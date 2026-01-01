import { usePendingActions } from '../hooks/use-pending-actions';
import { useLocation } from 'wouter';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export function Header() {
  const { requests } = usePendingActions();
  const [, setLocation] = useLocation();

  return (
    <header className="flex flex-col border-b border-gray-200">
      <div className="h-16 bg-white flex items-center px-6">
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
      </div>
      
      {requests.length > 0 && (
        <div className="bg-amber-400 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-950 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>{requests.length} action{requests.length > 1 ? 's' : ''} requise{requests.length > 1 ? 's' : ''} pour l'onboarding</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-900 font-medium italic">En attente pour : {requests[0].gameName}</span>
            <button 
              onClick={() => setLocation(`/games/${requests[0].gameId}`)}
              className="flex items-center gap-1.5 bg-amber-950 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-black transition-all active:scale-95"
            >
              Traiter l'action
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
