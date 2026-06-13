import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  listTemplates,
  findTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../queries/templates";

export const templateRouter = createRouter({
  list: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return listTemplates(input.companyId);
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findTemplateById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).default("MARKETING"),
        language: z.string().default("pt_BR"),
        body: z.string().min(1),
        headerType: z.enum(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).default("NONE"),
        headerText: z.string().optional(),
        headerMediaUrl: z.string().optional(),
        footer: z.string().optional(),
        buttons: z.array(z.object({ type: z.string(), text: z.string(), url: z.string().optional() })).optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { companyId, ...data } = input;
      const id = await createTemplate({
        ...data,
        companyId,
        metaStatus: "NOT_SUBMITTED",
      });
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]).optional(),
        body: z.string().optional(),
        headerType: z.enum(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional(),
        headerText: z.string().optional(),
        headerMediaUrl: z.string().optional(),
        footer: z.string().optional(),
        buttons: z.array(z.object({ type: z.string(), text: z.string(), url: z.string().optional() })).optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTemplate(id, data);
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTemplate(input.id);
      return { success: true };
    }),
});
