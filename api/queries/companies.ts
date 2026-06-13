import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./connection";
import { companies, userCompanies, contacts, campaigns, messageTemplates, flows, type InsertCompany, type InsertUserCompany } from "../../db/schema";

export async function findCompanyById(id: number) {
  const db = getDb();
  return db.query.companies.findFirst({
    where: eq(companies.id, id),
  });
}

export async function listCompanies() {
  const db = getDb();
  return db.select().from(companies).orderBy(desc(companies.createdAt));
}

export async function createCompany(data: InsertCompany) {
  const db = getDb();
  const result = await db.insert(companies).values(data);
  return result[0].insertId;
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = getDb();
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = getDb();
  await db.delete(companies).where(eq(companies.id, id));
}

export async function addUserToCompany(data: InsertUserCompany) {
  const db = getDb();
  const result = await db.insert(userCompanies).values(data);
  return result[0].insertId;
}

export async function findUserCompany(userId: number, companyId: number) {
  const db = getDb();
  return db.query.userCompanies.findFirst({
    where: sql`${userCompanies.userId} = ${userId} AND ${userCompanies.companyId} = ${companyId}`,
  });
}

export async function listUserCompanies(userId: number) {
  const db = getDb();
  return db.query.userCompanies.findMany({
    where: eq(userCompanies.userId, userId),
    with: {
      company: true,
    },
  });
}

export async function listCompanyUsers(companyId: number) {
  const db = getDb();
  return db.query.userCompanies.findMany({
    where: eq(userCompanies.companyId, companyId),
    with: {
      user: true,
    },
  });
}

export async function updateUserCompanyRole(id: number, role: string) {
  const db = getDb();
  await db.update(userCompanies).set({ role }).where(eq(userCompanies.id, id));
}

export async function removeUserFromCompany(id: number) {
  const db = getDb();
  await db.delete(userCompanies).where(eq(userCompanies.id, id));
}

export async function getCompanyStats(companyId: number) {
  const db = getDb();
  const [contactsCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.companyId, companyId));
  const [campaignsCount] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.companyId, companyId));
  const [templatesCount] = await db.select({ count: sql<number>`count(*)` }).from(messageTemplates).where(eq(messageTemplates.companyId, companyId));
  const [flowsCount] = await db.select({ count: sql<number>`count(*)` }).from(flows).where(eq(flows.companyId, companyId));
  
  return {
    contacts: contactsCount.count,
    campaigns: campaignsCount.count,
    templates: templatesCount.count,
    flows: flowsCount.count,
  };
}
