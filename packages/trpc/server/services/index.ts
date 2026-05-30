import UserService from "@repo/services/user";
import FormService from "@repo/services/form";
import FormVersionService from "@repo/services/form-versions";
import FormSubmissionsService from "@repo/services/form-submissions";
import DashboardService from "@repo/services/dashboard";
import AnalyticsService from "@repo/services/analytics";
import ThemeService from "@repo/services/theme";

export const userService = new UserService();
export const formService = new FormService();
export const formVersionService = new FormVersionService();
export const formSubmissionsService = new FormSubmissionsService();
export const dashboardService = new DashboardService();
export const analyticsService = new AnalyticsService();
export const themeService = new ThemeService();
