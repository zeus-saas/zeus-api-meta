import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { db } from "../../db/index";
import { contacts } from "../../db/schema";
import {
  listContacts,
  findContactById,
  createContact,
  updateContact,
  deleteContact,
  listContactLists,
  createContactList,
  deleteContactList,
  addContactToList,
  getListContacts,
  countContacts,
} from "../queries/contacts";

export const contactRouter = createRouter({
  list: publicQuery
    .input(z.object({ companyId: z.number(), search: z.string().optional() }))
    .query(async ({ input }) => {
      return listContacts(input.companyId, input.search);
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return findContactById(input.id);
    }),

  create: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().min(1),
        phone: z.string().min(8),
        phone2: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        company: z.string().optional(),
        cnpj: z.string().optional(),
        source: z.string().optional(),
        importIp: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customData: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { companyId, ...data } = input;
      const id = await createContact({
        ...data,
        companyId,
        tags: data.tags || [],
        status: "active",
        optIn: true,
        optInDate: new Date(),
      });
      return { id };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        phone2: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        company: z.string().optional(),
        cnpj: z.string().optional(),
        source: z.string().optional(),
        importIp: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customData: z.record(z.string()).optional(),
        status: z.enum(["active", "inactive", "blocked"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateContact(id, data);
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteContact(input.id);
      return { success: true };
    }),

  count: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return countContacts(input.companyId);
    }),

  // ==========================================================
  // ROTA NOVA: Importação em Massa (Excel)
  // ==========================================================
  bulkImport: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        importedById: z.number().optional(), // ID do usuário que fez o upload
        contacts: z.array(
          z.object({
            name: z.string().min(1),
            phone: z.string().min(8),
            phone2: z.string().optional(),
            email: z.string().email().optional().or(z.literal("")),
            company: z.string().optional(),
            cnpj: z.string().optional(),
            source: z.string().optional(),
            importIp: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { companyId, importedById, contacts: contactsData } = input;

      if (contactsData.length === 0) return { success: true, count: 0 };

      // Prepara os dados brutos do Excel para o formato do Banco de Dados
      const payload = contactsData.map((contact) => ({
        ...contact,
        companyId,
        importedById: importedById || null,
        status: "active" as const,
        optIn: true,
        optInDate: new Date(),
        importedAt: new Date(),
      }));

      // Faz o insert nativo em lote utilizando o Drizzle ORM (Alta performance)
      await db.insert(contacts).values(payload);

      return { success: true, count: payload.length };
    }),

  // ==========================================================
  // Listas de Segmentação
  // ==========================================================
  listLists: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return listContactLists(input.companyId);
    }),

  createList: publicQuery
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createContactList({
        companyId: input.companyId,
        name: input.name,
        description: input.description,
      });
      return { id };
    }),

  deleteList: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteContactList(input.id);
      return { success: true };
    }),

  addToList: publicQuery
    .input(
      z.object({
        listId: z.number(),
        contactId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await addContactToList({
        listId: input.listId,
        contactId: input.contactId,
      });
      return { success: true };
    }),

  listContacts: publicQuery
    .input(z.object({ listId: z.number() }))
    .query(async ({ input }) => {
      return getListContacts(input.listId);
    }),
});