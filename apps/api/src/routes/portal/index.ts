import { Hono } from "hono";
import gamesRoute from "./games";
import meRoute from "./me";
import bootstrapRoute from "./bootstrap";
import onboardingRoute from "./onboarding";

const app = new Hono();

app.route("/games", gamesRoute);
app.route("/me", meRoute);
app.route("/bootstrap", bootstrapRoute);
app.route("/onboarding", onboardingRoute);

export default app;
