import { Link, useLocation } from 'wouter';

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-48 bg-gray-50 border-r border-gray-200" style={{ height: 'calc(100vh - 4rem)' }}>
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className={`block px-3 py-2 rounded text-sm font-medium ${
                location === '/' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Accueil
            </Link>
          </li>
          <li>
            <Link
              href="/users"
              className={`block px-3 py-2 rounded text-sm font-medium ${
                location === '/users' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Utilisateurs
            </Link>
          </li>
          <li>
            <Link
              href="/games"
              className={`block px-3 py-2 rounded text-sm font-medium ${
                location === '/games' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Jeux
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
