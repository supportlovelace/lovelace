import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { FileUp, Loader2, Table2, Check } from "lucide-react"
import { toast } from 'sonner'
import { devHeaders } from '../lib/api'
import { submitOnboardingRequest } from '../hooks/use-onboarding-requests'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameId: string
  stepSlug: string
  targetTable: string
  expectedFields: string[] // Liste des colonnes attendues dans ClickHouse
  requestId?: string // ID de la requête Temporal (V2)
  onSuccess: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function CsvImportDialog({
  open,
  onOpenChange,
  gameId,
  stepSlug,
  targetTable,
  expectedFields,
  requestId,
  onSuccess
}: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [s3Key, setS3Key] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'mapping'>('upload')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsLoading(true)

    try {
      // 1. Upload immédiat vers S3 pour introspection
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('gameId', gameId)

      const uploadRes = await fetch(`${API_BASE_URL}/admin/onboarding/upload`, {
        method: 'POST',
        headers: { ...devHeaders() },
        body: formData
      })

      if (!uploadRes.ok) throw new Error('Erreur lors du transfert S3')
      const { s3Key: uploadedKey } = await uploadRes.json()
      setS3Key(uploadedKey)

      // 2. Demander à ClickHouse d'analyser le fichier distant
      const introspectRes = await fetch(`${API_BASE_URL}/admin/onboarding/introspect-csv`, {
        method: 'POST',
        headers: { 
          ...devHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ s3Key: uploadedKey })
      })

      if (!introspectRes.ok) throw new Error('Erreur analyse ClickHouse')
      const { headers: introspectedHeaders } = await introspectRes.json()
      setHeaders(introspectedHeaders)
      
      // Auto-mapping simple
      const initialMapping: Record<string, string> = {}
      expectedFields.forEach(field => {
        if (introspectedHeaders.includes(field)) initialMapping[field] = field
      })
      setMapping(initialMapping)
      
      setStep('mapping')
    } catch (err: any) {
      toast.error(err.message || "Impossible d'analyser le fichier")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!s3Key) return
    setIsLoading(true)
    try {
      if (requestId) {
        await submitOnboardingRequest(requestId, { 
          s3Key, 
          mapping,
          targetTable
        })
        toast.success("Signal envoyé à Temporal")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'importation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importation CSV - {targetTable}</DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? "Sélectionnez le fichier CSV à importer pour ce jeu." 
              : "Faites correspondre les colonnes du CSV avec les champs ClickHouse."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              <FileUp className="w-10 h-10 text-blue-500 mb-3" />
              <p className="text-sm font-medium text-gray-700">Cliquez ou glissez un fichier CSV</p>
              <p className="text-xs text-gray-500 mt-1">Format attendu : UTF-8, délimiteur virgule</p>
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Table2 className="w-3.5 h-3.5" />
                Mapping des colonnes
              </div>
              
              {expectedFields.map(field => (
                <div key={field} className="grid grid-cols-2 items-center gap-4 py-2 border-b last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{field}</span>
                    <span className="text-[10px] text-blue-600 font-mono">ClickHouse</span>
                  </div>
                  <Select 
                    value={mapping[field]} 
                    onValueChange={(val) => setMapping(prev => ({ ...prev, [field]: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choisir une colonne..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          {step === 'mapping' && (
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Lancer l'importation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
