import { useState } from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { uploadAsset } from '../lib/api'
import { ImageIcon, Loader2, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string | null
  onChange: (value: string | null) => void
  type: 'game_logo' | 'platform_logo' | 'avatar'
  label?: string
}

const CDN_URL = import.meta.env.VITE_CDN_URL ?? 'https://cdn.lovelace.gg'

export function ImageUpload({ value, onChange, type, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  // URL de l'image si elle existe déjà (on prend la variante 192 pour la preview)
  const existingImageUrl = value ? `${CDN_URL}/assets/${value}/192.webp` : null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview locale
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const { assetId } = await uploadAsset(file, type)
      onChange(assetId)
      toast.success('Image uploadée')
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l’upload')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    onChange(null)
    setPreview(null)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="flex items-center gap-4">
        {/* Preview Area */}
        <div className="relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
          {(preview || existingImageUrl) ? (
            <>
              <img 
                src={preview || existingImageUrl || ''} 
                alt="Preview" 
                className="w-full h-full object-cover" 
              />
              {!uploading && (
                <button
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${type}`}
            disabled={uploading}
          />
          <label htmlFor={`image-upload-${type}`}>
            <Button
              type="button"
              variant="default"
              className="cursor-pointer"
              asChild
              disabled={uploading}
            >
              <span>{uploading ? 'Upload en cours...' : (value ? 'Changer l\'image' : 'Sélectionner une image')}</span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG ou WebP. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  )
}
