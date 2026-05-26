import { router } from "./trpc";
import { authRouter } from "./routes/auth/route";
import { formRouter } from "./routes/form/route";
import { formVersionRouter } from "./routes/form-versions/route";
import { formSubmissionsRouter } from "./routes/form-submissions/route";
import { dashboardRouter } from "./routes/dashboard/route";
import { analyticsRouter } from "./routes/analytics/route";

export const serverRouter = router({
  auth: authRouter,
  form: formRouter,
  formVersion: formVersionRouter,
  formSubmissions: formSubmissionsRouter,
  dashboard: dashboardRouter,
  analytics: analyticsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
