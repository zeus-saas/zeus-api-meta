import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { campaigns, messageLogs, type InsertCampaign, type InsertMessageLog } from "../../db/schema";

export async function listCampaigns(companyId: number) {
  const db = getDb();
  return db.query.campaigns.findMany({
    where: eq(campaigns.companyId, companyId),
    orderBy: desc(campaigns.createdAt),
  });
}

export async function findCampaignById(id: number) {
  const db = getDb();
  return db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
  });
}

export async function createCampaign(data: InsertCampaign) {
  const db = getDb();
  const result = await db.insert(campaigns).values(data);
  return result[0].insertId;
}

export async function updateCampaign(id: number, data: Partial<InsertCampaign>) {
  const db = getDb();
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = getDb();
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

export async function getCampaignStats(companyId: number) {
  const db = getDb();
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.companyId, companyId));
  const [running] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.companyId, companyId)).where(eq(campaigns.status, "running"));
  return { total: total.count, running: running.count };
}

// Message Logs
export async function createMessageLog(data: InsertMessageLog) {
  const db = getDb();
  const result = await db.insert(messageLogs).values(data);
  return result[0].insertId;
}

export async function listMessageLogs(companyId: number, limit = 50) {
  const db = getDb();
  return db.query.messageLogs.findMany({
    where: eq(messageLogs.companyId, companyId),
    orderBy: desc(messageLogs.createdAt),
    limit,
  });
}

export async function getMessageStats(companyId: number) {
  const db = getDb();
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId));
  const [sent] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "sent"));
  const [delivered] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "delivered"));
  const [read] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "read"));
  const [failed] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "failed"));
  
  return {
    total: total.count,
    sent: sent.count,
    delivered: delivered.count,
    read: read.count,
    failed: failed.count,
  };
}
