import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import {
  listCompanies,
  findCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  listCompanyUsers,
  addUserToCompany,
  updateUserCompanyRole,
  removeUserFromCompany,
  getCompanyStats,
} from "../queries/companies";
import { findUserByEmail } from "../queries/users";

export const companyRouter = createRouter({
  list: publicQuery.query(async () => {
    return listCompanies();
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findCompanyById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        document: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        plan: z.enum(["free", "basic", "pro", "enterprise"]).default("free"),
        whatsappPhoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createCompany({
        name: input.name,
        document: input.document,
        phone: input.phone,
        email: input.email,
        plan: input.plan,
        whatsappPhoneNumber: input.whatsappPhoneNumber,
      });
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        document: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        plan: z.enum(["free", "basic", "pro", "enterprise"]).optional(),
        isActive: z.boolean().optional(),
        whatsappBusinessId: z.string().optional(),
        whatsappPhoneId: z.string().optional(),
        whatsappApiToken: z.string().optional(),
        whatsappPhoneNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCompany(id, data);
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCompany(input.id);
      return { success: true };
    }),

  stats: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getCompanyStats(input.id);
    }),

  // Gestão de usuários na empresa
  users: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return listCompanyUsers(input.companyId);
    }),

  addUser: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        email: z.string().email(),
        role: z.enum(["admin", "manager", "agent"]).default("agent"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      if (!user) {
        throw new Error("Usuário não encontrado. O usuário deve ter uma conta no sistema.");
      }
      const id = await addUserToCompany({
        userId: user.id,
        companyId: input.companyId,
        role: input.role,
      });
      return { id, userId: user.id };
    }),

  updateUserRole: publicQuery
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["admin", "manager", "agent"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateUserCompanyRole(input.id, input.role);
      return { success: true };
    }),

  removeUser: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await removeUserFromCompany(input.id);
      return { success: true };
    }),
});
