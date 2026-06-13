import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
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
        email: z.string().email().optional(),
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
        email: z.string().email().optional(),
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

  // Listas
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
