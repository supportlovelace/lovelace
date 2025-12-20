import { Route, Switch } from "wouter";
import { InsightsOverview } from "../components/insights/InsightsOverview";
import { InsightsDomain } from "../components/insights/InsightsDomain";
import { InsightDetail } from "../components/insights/InsightDetail";

export default function Insights() {
  return (
    <div className="max-w-[1400px] mx-auto py-10 px-8">
      <Switch>
        {/* Avec 'nest' sur le parent, les chemins ici sont relatifs à /insights */}
        
        {/* /insights */}
        <Route path="/" component={InsightsOverview} />
        
        {/* /insights/:domainId */}
        <Route path="/:domainId" component={InsightsDomain} />

        {/* /insights/:domainId/:insightId */}
        <Route path="/:domainId/:insightId" component={InsightDetail} />
      </Switch>
    </div>
  );
}