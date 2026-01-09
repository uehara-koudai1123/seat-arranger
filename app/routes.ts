import type { RouteConfig } from "@react-router/dev/routes";
import { index, route, layout, prefix } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/sessions/new", "routes/dashboard.sessions.new.tsx"),
  route("dashboard/sessions/:id", "routes/dashboard.sessions.$id.tsx"),
  route("dashboard/sessions/:id/duplicate", "routes/dashboard.sessions.$id.duplicate.tsx"),
  route("s/:publicId", "routes/s.$publicId.tsx"),
] satisfies RouteConfig;
