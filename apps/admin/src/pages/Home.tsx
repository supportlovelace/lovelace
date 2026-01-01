import { useStats, useHealth } from '../hooks/use-stats'
import { Users, Gamepad2, Share2, Activity, CheckCircle2, XCircle, AlertTriangle, Zap, Clock } from 'lucide-react'

export function Home() {
  const { data: statsData, isLoading: statsLoading } = useStats()
  const { data: healthData, isLoading: healthLoading } = useHealth()

  const stats = statsData?.stats || { users: 0, games: 0, platforms: 0, pendingActions: 0, onboarding: { running: 0, completed: 0, total: 0 } }
  const isUp = healthData?.status === 'ok'
  const temporalUp = statsData?.services?.temporal === 'up'

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500">Vue d'ensemble de l'écosystème Lovelace.</p>
        </div>
        
        <div className="flex gap-3">
          {/* Temporal Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-tight ${
            statsLoading ? 'bg-gray-50 text-gray-500' :
            temporalUp ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <Zap className={`w-3 h-3 ${temporalUp ? 'fill-blue-500' : ''}`} />
            Temporal {statsLoading ? '...' : temporalUp ? 'Online' : 'Offline'}
          </div>

          {/* API Health Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-tight ${
            healthLoading ? 'bg-gray-50 text-gray-500' :
            isUp ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {healthLoading ? (
              <Activity className="w-3 h-3 animate-pulse" />
            ) : isUp ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            API {healthLoading ? '...' : isUp ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Comptes</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.users}</p>
          <p className="text-sm text-gray-500">Utilisateurs enregistrés</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-green-600">
            <Gamepad2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Catalogue</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.games}</p>
          <p className="text-sm text-gray-500">Jeux référencés</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-600">
            <Share2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Services</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.platforms}</p>
          <p className="text-sm text-gray-500">Plateformes supportées</p>
        </div>
      </div>

      {/* Onboarding Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border shadow-sm space-y-2 transition-all ${stats.pendingActions > 0 ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-500/20' : 'bg-white opacity-60'}`}>
          <div className={`flex items-center justify-between ${stats.pendingActions > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
            <AlertTriangle className={`w-5 h-5 ${stats.pendingActions > 0 ? 'animate-bounce' : ''}`} />
            <span className="text-xs font-bold uppercase tracking-wider">Actions</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.pendingActions}</p>
          <p className={`text-sm ${stats.pendingActions > 0 ? 'text-orange-700 font-medium' : 'text-slate-500'}`}>Demandes en attente</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-500">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">En cours</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.onboarding.running}</p>
          <p className="text-sm text-gray-500">Workflows actifs</p>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Onboardés</span>
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.onboarding.completed}</p>
          <p className="text-sm text-gray-500">Sur {stats.onboarding.total} jeux</p>
        </div>
      </div>

      {/* Services Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isUp && healthData.services && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 text-slate-600 text-sm font-medium">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Base de données <strong>PostgreSQL</strong> connectée.</span>
          </div>
        )}
        {temporalUp && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3 text-slate-600 text-sm font-medium">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
            <span>Serveur d'orchestration <strong>Temporal</strong> opérationnel.</span>
          </div>
        )}
      </div>
    </div>
  );
}
