import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  listFlows,
  findFlowById,
  createFlow,
  updateFlow,
  deleteFlow,
} from "../queries/flows";

export const flowRouter = createRouter({
  list: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return listFlows(input.companyId);
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findFlowById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        userId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        trigger: z.enum(["manual", "webhook", "schedule", "inbound_message"]).default("manual"),
        triggerConfig: z.record(z.any()).optional(),
        nodes: z.array(z.any()).optional(),
        edges: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { companyId, userId, ...data } = input;
      const id = await createFlow({
        ...data,
        companyId,
        userId,
        status: "draft",
      });
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "active", "paused", "inactive"]).optional(),
        trigger: z.enum(["manual", "webhook", "schedule", "inbound_message"]).optional(),
        triggerConfig: z.record(z.any()).optional(),
        nodes: z.array(z.any()).optional(),
        edges: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateFlow(id, data);
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteFlow(input.id);
      return { success: true };
    }),
});
