import { eq, desc } from "drizzle-orm";
import { getDb } from "./connection";
import { messageTemplates, type InsertMessageTemplate } from "../../db/schema";

export async function listTemplates(companyId: number) {
  const db = getDb();
  return db.query.messageTemplates.findMany({
    where: eq(messageTemplates.companyId, companyId),
    orderBy: desc(messageTemplates.createdAt),
  });
}

export async function findTemplateById(id: number) {
  const db = getDb();
  return db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.id, id),
  });
}

export async function createTemplate(data: InsertMessageTemplate) {
  const db = getDb();
  const result = await db.insert(messageTemplates).values(data);
  return result[0].insertId;
}

export async function updateTemplate(id: number, data: Partial<InsertMessageTemplate>) {
  const db = getDb();
  await db.update(messageTemplates).set(data).where(eq(messageTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = getDb();
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
}
