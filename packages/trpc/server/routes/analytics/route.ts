import { router } from "../../trpc";
import { formAnalyticsRouter } from "./form-router";
import { globalAnalyticsRouter } from "./global-router";

export const analyticsRouter = router({
  form: formAnalyticsRouter,
  global: globalAnalyticsRouter,
});
