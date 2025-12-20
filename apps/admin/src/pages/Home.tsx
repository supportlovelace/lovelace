import { useStats, useHealth } from '../hooks/use-stats'
import { Users, Gamepad2, Share2, Activity, CheckCircle2, XCircle } from 'lucide-react'

export function Home() {
  const { data: statsData, isLoading: statsLoading } = useStats()
  const { data: healthData, isLoading: healthLoading } = useHealth()

  const stats = statsData?.stats || { users: 0, games: 0, platforms: 0 }
  const isUp = healthData?.status === 'ok'

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500">Vue d'ensemble de l'écosystème Lovelace.</p>
        </div>
        
        {/* API Health Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
          healthLoading ? 'bg-gray-50 text-gray-500' :
          isUp ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {healthLoading ? (
            <Activity className="w-4 h-4 animate-pulse" />
          ) : isUp ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          API {healthLoading ? 'Checking...' : isUp ? 'Online' : 'Offline'}
        </div>
      </div>

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

      {/* Database Status Info */}
      {isUp && healthData.services && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex items-center gap-3 text-blue-800 text-sm">
          <Activity className="w-4 h-4" />
          <span>Base de données <strong>PostgreSQL</strong> connectée et opérationnelle.</span>
        </div>
      )}
    </div>
  );
}
