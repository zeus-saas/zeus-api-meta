import { eq, desc } from "drizzle-orm";
import { getDb } from "./connection";
import { flows, type InsertFlow } from "../../db/schema";

export async function listFlows(companyId: number) {
  const db = getDb();
  return db.query.flows.findMany({
    where: eq(flows.companyId, companyId),
    orderBy: desc(flows.createdAt),
  });
}

export async function findFlowById(id: number) {
  const db = getDb();
  return db.query.flows.findFirst({
    where: eq(flows.id, id),
  });
}

export async function createFlow(data: InsertFlow) {
  const db = getDb();
  const result = await db.insert(flows).values(data);
  return result[0].insertId;
}

export async function updateFlow(id: number, data: Partial<InsertFlow>) {
  const db = getDb();
  await db.update(flows).set(data).where(eq(flows.id, id));
}

export async function deleteFlow(id: number) {
  const db = getDb();
  await db.delete(flows).where(eq(flows.id, id));
}
