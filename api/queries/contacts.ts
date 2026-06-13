import { eq, like, desc, sql, and } from "drizzle-orm";
import { getDb } from "./connection";
import { contacts, contactLists, contactListItems, type InsertContact, type InsertContactList, type InsertContactListItem } from "../../db/schema";

export async function listContacts(companyId: number, search?: string) {
  const db = getDb();
  if (search) {
    return db.query.contacts.findMany({
      where: and(
        eq(contacts.companyId, companyId),
        like(contacts.name, `%${search}%`)
      ),
      orderBy: desc(contacts.createdAt),
    });
  }
  return db.query.contacts.findMany({
    where: eq(contacts.companyId, companyId),
    orderBy: desc(contacts.createdAt),
  });
}

export async function findContactById(id: number) {
  const db = getDb();
  return db.query.contacts.findFirst({
    where: eq(contacts.id, id),
  });
}

export async function createContact(data: InsertContact) {
  const db = getDb();
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = getDb();
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function countContacts(companyId: number) {
  const db = getDb();
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.companyId, companyId));
  return result.count;
}

// Listas de contatos
export async function listContactLists(companyId: number) {
  const db = getDb();
  return db.query.contactLists.findMany({
    where: eq(contactLists.companyId, companyId),
    orderBy: desc(contactLists.createdAt),
  });
}

export async function createContactList(data: InsertContactList) {
  const db = getDb();
  const result = await db.insert(contactLists).values(data);
  return result[0].insertId;
}

export async function deleteContactList(id: number) {
  const db = getDb();
  await db.delete(contactListItems).where(eq(contactListItems.listId, id));
  await db.delete(contactLists).where(eq(contactLists.id, id));
}

export async function addContactToList(data: InsertContactListItem) {
  const db = getDb();
  await db.insert(contactListItems).values(data);
}

export async function getListContacts(listId: number) {
  const db = getDb();
  return db.query.contactListItems.findMany({
    where: eq(contactListItems.listId, listId),
    with: {
      contact: true,
    },
  });
}
