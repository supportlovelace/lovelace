import { Router, Route } from 'wouter';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Users } from './pages/Users';
import { Games } from './pages/Games';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">
            <Route path="/" component={Home} />
            <Route path="/users" component={Users} />
            <Route path="/games" component={Games} />
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
