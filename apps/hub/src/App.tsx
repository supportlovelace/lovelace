import { Link, Router, Switch, Route } from "wouter";
import { Layout } from "./components/Layout";
import { TooltipProvider } from "./contexts/TooltipContext";
import Dashboard from "./pages/Dashboard";
import ChatAI from "./pages/ChatAI";
import TheHub from "./pages/TheHub";
import Insights from "./pages/Insights";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Account from "./pages/Account";
import SignOut from "./pages/SignOut";

function App() {
  return (
    <TooltipProvider app="hub">
      <Router base="">
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/chat-ai" component={ChatAI} />
            <Route path="/the-hub" component={TheHub} />
            <Route path="/insights" component={Insights} nest />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
            <Route path="/account" component={Account} />
            <Route path="/signout" component={SignOut} />
            <Route path="/" component={Dashboard} />
            <Route>
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-3xl font-bold mb-4">Not Found</h1>
                <p>
                  Page not found. <Link href="/dashboard">Go to Dashboard</Link>
                </p>
              </div>
            </Route>
          </Switch>
        </Layout>
      </Router>
    </TooltipProvider>
  );
}

export default App;
