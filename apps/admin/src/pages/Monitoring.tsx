import { useState, useEffect } from 'react';
import { useAlerts, useAlertEvents } from '../hooks/use-monitoring';
import { DataTable } from '../components/ui/data-table';
import { socket } from '../lib/socket';
import { mutate } from 'swr';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from "@repo/ui/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@repo/ui/components/ui/sheet";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { AlertCircle, Clock, Activity, ShieldAlert, Terminal, Zap, Fingerprint, Info, Server, History, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

function EventHistory({ fingerprint }: { fingerprint: string }) {
  const { events, isLoading } = useAlertEvents(fingerprint);

  if (isLoading) return <div className="text-[10px] text-muted-foreground animate-pulse italic">Chargement de l'historique...</div>;
  if (!events || events.length === 0) return <div className="text-[10px] text-muted-foreground italic">Aucun événement historique trouvé.</div>;

  return (
    <div className="space-y-6">
      {events.map((event: any, idx: number) => (
        <div key={idx} className="flex gap-4 relative pb-6 last:pb-0">
          {idx !== events.length - 1 && (
            <div className="absolute left-[7px] top-[20px] bottom-0 w-[2px] bg-slate-100" />
          )}
          <div className={`w-3.5 h-3.5 rounded-full mt-1.5 shrink-0 z-10 border-2 border-white shadow-sm ${
            event.status === 'firing' ? 'bg-red-500' : 'bg-emerald-500'
          }`} />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  {event.lastReceived ? new Date(event.lastReceived).toLocaleString('fr-FR') : 'Date inconnue'}
                </span>
                <Badge variant="outline" className={`text-[8px] font-black px-1.5 h-4 border-none uppercase ${
                  event.status === 'firing' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {event.status}
                </Badge>
              </div>
              {event.providerType && (
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                  <Server className="w-3 h-3" />
                  {event.providerType}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm space-y-3">
              <p className="text-[12px] text-slate-700 font-medium leading-snug">
                {event.message || "Changement d'état système."}
              </p>

              {event.status === 'resolved' && event.disposable_status?.timestamp && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  Résolu le {new Date(event.disposable_status.timestamp * 1000).toLocaleString('fr-FR')}
                </div>
              )}

              {event.note && (
                <div className="pt-3 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-600 tracking-wider">
                      <History className="w-3 h-3" />
                      Note d'intervention
                    </div>
                    {(event.assignee || event.disposable_dismissed?.value === "False") && (
                      <div className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">
                        Par: {event.assignee || "Système / Admin"}
                      </div>
                    )}
                  </div>
                  <div 
                    className="text-[11px] text-slate-600 leading-relaxed bg-emerald-50/30 p-3 rounded-md border border-emerald-100/50 italic prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.note }}
                  />
                </div>
              )}
              
              {event.payload && Object.keys(event.payload).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(event.payload).map(([k, v]) => (
                    <span key={k} className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Monitoring() {
  const { data, isLoading, error } = useAlerts();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Temps réel via Socket.io
  useEffect(() => {
    const onNewAlert = (newAlert: any) => {
      console.log('[Socket] Nouvelle alerte reçue:', newAlert);
      mutate(['monitoring-alerts']);
      
      setSelectedAlert((currentSelected: any) => {
        if (currentSelected && (currentSelected.fingerprint === newAlert.fingerprint || currentSelected.id === newAlert.id)) {
          mutate(['alert-events', newAlert.fingerprint]);
          return newAlert;
        }
        return currentSelected;
      });
    };

    socket.on('new-alert', onNewAlert);

    return () => {
      socket.off('new-alert', onNewAlert);
    };
  }, []);

  const alerts = data?.alerts || [];

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "severity",
      header: "Sévérité",
      cell: ({ row }) => {
        const severity = row.getValue("severity") as string;
        const colors: Record<string, string> = {
          critical: "bg-red-100 text-red-700 border-red-200",
          high: "bg-orange-100 text-orange-700 border-orange-200",
          medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
          low: "bg-blue-100 text-blue-700 border-blue-200",
        };
        return (
          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tighter ${colors[severity?.toLowerCase()] || "bg-slate-100"}`}>
            {severity}
          </Badge>
        );
      }
    },
    {
      accessorKey: "name",
      header: "Alerte",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">{row.getValue("name")}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.alert_id}</span>
        </div>
      )
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="max-w-[400px] truncate text-xs text-slate-600 italic" title={row.getValue("message")}>
          "{row.getValue("message")}"
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const isFiring = row.getValue("status") === "firing";
        return (
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isFiring ? "bg-red-50 text-red-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
            <Zap className={`w-3 h-3 ${isFiring ? "fill-current" : ""}`} />
            {isFiring ? "Firing" : "Resolved"}
          </div>
        );
      }
    },
    {
      accessorKey: "lastReceived",
      header: "Dernière activité",
      cell: ({ row }) => {
        const date = row.getValue("lastReceived") as string;
        if (!date) return "-";
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })}
          </div>
        );
      }
    },
    {
      id: "resolvedAt",
      header: "Résolution",
      cell: ({ row }) => {
        const isResolved = row.original.status === "resolved";
        const timestamp = row.original.disposable_status?.timestamp;
        
        if (!isResolved || !timestamp) return <span className="text-slate-300">-</span>;
        
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            {formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true, locale: fr })}
          </div>
        );
      }
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.getValue("source") as string[];
        return (
          <div className="flex items-center gap-1 text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
            <Terminal className="w-3 h-3" />
            {Array.isArray(source) ? source.join(', ') : (source || 'N/A')}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring & Alertes</h1>
          <p className="text-muted-foreground">Vue consolidée des incidents système via Keep.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Flux Temps Réel Actif</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex items-center gap-4 text-red-700">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <p className="font-bold text-lg">Erreur de connexion</p>
            <p className="text-sm">Impossible de joindre l'API de monitoring. Vérifiez votre configuration.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground italic">
              <Activity className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
              Synchronisation des alertes...
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={alerts} 
              searchPlaceholder="Filtrer les alertes..."
              onRowClick={(alert) => setSelectedAlert(alert)}
            />
          )}
        </div>
      )}

      <Sheet open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <SheetContent className="w-full sm:max-w-[800px] flex flex-col p-0 border-l shadow-2xl">
          <SheetHeader className="p-6 border-b bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest ${getSeverityColor(selectedAlert?.severity)}`}>
                {selectedAlert?.severity}
              </Badge>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${selectedAlert?.status === 'firing' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                {selectedAlert?.status}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold">{selectedAlert?.name}</SheetTitle>
            <SheetDescription className="font-mono text-xs text-blue-600">
              ID: {selectedAlert?.id}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Message Principal */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-xl shadow-inner border border-slate-800">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest">
                  <Info className="w-3 h-3" />
                  Message d'incident
                </div>
                <p className="text-sm leading-relaxed font-medium italic">
                  "{selectedAlert?.message}"
                </p>
              </div>

              {/* Infos Clés */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border rounded-xl space-y-1 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3" /> Fingerprint
                  </p>
                  <p className="font-mono text-xs font-semibold truncate">{selectedAlert?.fingerprint}</p>
                </div>
                <div className="p-4 bg-white border rounded-xl space-y-1 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3 h-3" /> Provider
                  </p>
                  <p className="font-mono text-xs font-semibold">{selectedAlert?.providerType || 'N/A'}</p>
                </div>
                <div className="p-4 bg-white border rounded-xl space-y-1 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Lancé le
                  </p>
                  <p className="text-xs font-semibold">
                    {selectedAlert?.firingStartTime ? new Date(selectedAlert.firingStartTime).toLocaleString() : 'Inconnu'}
                  </p>
                </div>
                <div className="p-4 bg-white border rounded-xl space-y-1 shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Récurrence
                  </p>
                  <p className="text-xs font-semibold">{selectedAlert?.firingCounter || 0} fois</p>
                </div>
              </div>

              {/* Historique des événements */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Historique des événements
                </h3>
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-5">
                  <EventHistory fingerprint={selectedAlert?.fingerprint} />
                </div>
              </div>

              {/* Labels & Tags */}
              {selectedAlert?.labels && Object.keys(selectedAlert.labels).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedAlert.labels).map(([key, value]) => (
                      <div key={key} className="px-2 py-1 bg-blue-50 border border-blue-100 rounded-md text-[10px] font-medium">
                        <span className="text-blue-400 mr-1">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON Brut */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  Payload Brut
                  <Badge variant="outline" className="font-mono lowercase text-[10px]">json</Badge>
                </h3>
                <div className="rounded-xl border bg-slate-50 overflow-hidden">
                  <pre className="p-4 font-mono text-[10px] text-slate-700 leading-tight overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedAlert, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}