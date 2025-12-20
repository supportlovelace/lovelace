import { Hono } from "hono";
import { requireGlobalAccess } from "../../middleware/requireGlobalAccess";
import publishersRoute from "./publishers";
import studiosRoute from "./studios";
import gamesRoute from "./games";
import usersRoute from "./users";
import platformsRoute from "./platforms";
import assetsRoute from "./assets";
import tooltipsRoute from "./tooltips";
import dashboardRoute from "./dashboard";
import discordRoute from "./discord";
import onboardingRoute from "./onboarding";

// Type pour le contexte avec userId (important pour que TS suive)
type Variables = {
  userId: string;
};

const admin = new Hono<{ Variables: Variables }>();

// Global Protection
admin.use("*", requireGlobalAccess);

// Sub-routers
admin.route("/", dashboardRoute); // Stats & Dashboard
admin.route("/publishers", publishersRoute);
admin.route("/studios", studiosRoute);
admin.route("/games", gamesRoute);
admin.route("/users", usersRoute);
admin.route("/platforms", platformsRoute);
admin.route("/assets", assetsRoute);
admin.route("/tooltips", tooltipsRoute);
admin.route("/discord", discordRoute);
admin.route("/onboarding", onboardingRoute);

export default admin;
