import { Router, Route, Switch } from 'wouter';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Users } from './pages/Users';
import { UserDetails } from './pages/UserDetails';
import { Publishers } from './pages/Publishers';
import { PublisherDetails } from './pages/PublisherDetails';
import { Games } from './pages/Games';
import { StudioDetails } from './pages/StudioDetails';
import { GameDetails } from './pages/GameDetails';
import { Platforms } from './pages/Platforms';
import { PlatformDetails } from './pages/PlatformDetails';
import { Tooltips } from './pages/Tooltips';
import { OnboardingGlobal } from './pages/OnboardingGlobal';
import { Discord } from './pages/Discord';
import { DiscordDetails } from './pages/DiscordDetails';
import { Toaster } from '@repo/ui/components/ui/sonner';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">
            <Switch>
              <Route path="/" component={Home} />
              
              {/* IAM - Utilisateurs */}
              <Route path="/users" component={Users} />
              <Route path="/users/:id" component={UserDetails} />
              
              {/* Structure */}
              <Route path="/publishers" component={Publishers} />
              <Route path="/publishers/:id" component={PublisherDetails} />
              <Route path="/games" component={Games} />
              <Route path="/games/:id" component={GameDetails} />
              <Route path="/studios/:id" component={StudioDetails} />
              <Route path="/platforms" component={Platforms} />
              <Route path="/platforms/:id" component={PlatformDetails} />
              <Route path="/tooltips" component={Tooltips} />
              <Route path="/onboarding-global" component={OnboardingGlobal} />
              <Route path="/discord" component={Discord} />
              <Route path="/discord/:id" component={DiscordDetails} />
              
              {/* 404 - Optionnel */}
              <Route>404 - Page non trouvée</Route>
            </Switch>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
