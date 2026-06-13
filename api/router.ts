import { localAuthRouter } from "./routers/auth-router";
import { companyRouter } from "./routers/company-router";
import { contactRouter } from "./routers/contact-router";
import { templateRouter } from "./routers/template-router";
import { campaignRouter } from "./routers/campaign-router";
import { flowRouter } from "./routers/flow-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: localAuthRouter,
  company: companyRouter,
  contact: contactRouter,
  template: templateRouter,
  campaign: campaignRouter,
  flow: flowRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
