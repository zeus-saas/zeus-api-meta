import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  listCampaigns,
  findCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  listMessageLogs,
  getMessageStats,
} from "../queries/campaigns";

export const campaignRouter = createRouter({
  list: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return listCampaigns(input.companyId);
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findCampaignById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        userId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        templateId: z.number().optional(),
        listId: z.number().optional(),
        scheduledAt: z.string().optional(),
        templateVariables: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { companyId, userId, scheduledAt, ...data } = input;
      const id = await createCampaign({
        ...data,
        companyId,
        userId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : "draft",
        totalContacts: 0,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        replyCount: 0,
      });
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        templateId: z.number().optional(),
        listId: z.number().optional(),
        status: z.enum(["draft", "scheduled", "running", "paused", "completed", "cancelled"]).optional(),
        scheduledAt: z.string().optional(),
        templateVariables: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, scheduledAt, ...data } = input;
      await updateCampaign(id, {
        ...data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCampaign(input.id);
      return { success: true };
    }),

  stats: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return getCampaignStats(input.companyId);
    }),

  // Logs
  logs: publicQuery
    .input(z.object({ companyId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return listMessageLogs(input.companyId, input.limit || 50);
    }),

  messageStats: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return getMessageStats(input.companyId);
    }),
});
