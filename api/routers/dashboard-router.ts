import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { campaigns, contacts, messageTemplates, flows, messageLogs, companies } from "../../db/schema";

export const dashboardRouter = createRouter({
  stats: publicQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { companyId } = input;

      // Contagens
      const [contactsCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.companyId, companyId));
      const [templatesCount] = await db.select({ count: sql<number>`count(*)` }).from(messageTemplates).where(eq(messageTemplates.companyId, companyId));
      const [campaignsCount] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.companyId, companyId));
      const [flowsCount] = await db.select({ count: sql<number>`count(*)` }).from(flows).where(eq(flows.companyId, companyId));

      // Campanhas ativas
      const [activeCampaigns] = await db.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.companyId, companyId)).where(eq(campaigns.status, "running"));

      // Estatísticas de mensagens
      const [totalMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId));
      const [sentMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "sent"));
      const [deliveredMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "delivered"));
      const [readMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "read"));
      const [failedMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs).where(eq(messageLogs.companyId, companyId)).where(eq(messageLogs.status, "failed"));

      // Últimas mensagens
      const recentMessages = await db.query.messageLogs.findMany({
        where: eq(messageLogs.companyId, companyId),
        orderBy: desc(messageLogs.createdAt),
        limit: 10,
      });

      // Últimas campanhas
      const recentCampaigns = await db.query.campaigns.findMany({
        where: eq(campaigns.companyId, companyId),
        orderBy: desc(campaigns.createdAt),
        limit: 5,
      });

      return {
        counts: {
          contacts: contactsCount.count,
          templates: templatesCount.count,
          campaigns: campaignsCount.count,
          flows: flowsCount.count,
          activeCampaigns: activeCampaigns.count,
        },
        messages: {
          total: totalMessages.count,
          sent: sentMessages.count,
          delivered: deliveredMessages.count,
          read: readMessages.count,
          failed: failedMessages.count,
        },
        recentMessages,
        recentCampaigns,
      };
    }),

  // Estatísticas globais (para SaaS Admin)
  globalStats: publicQuery.query(async () => {
    const db = getDb();

    const [companiesCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const [activeCompanies] = await db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.isActive, true));
    const [totalContacts] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    const [totalCampaigns] = await db.select({ count: sql<number>`count(*)` }).from(campaigns);
    const [totalMessages] = await db.select({ count: sql<number>`count(*)` }).from(messageLogs);

    return {
      companies: companiesCount.count,
      activeCompanies: activeCompanies.count,
      contacts: totalContacts.count,
      campaigns: totalCampaigns.count,
      messages: totalMessages.count,
    };
  }),

  // Gráfico de mensagens por dia
  messagesByDay: publicQuery
    .input(z.object({ companyId: z.number(), days: z.number().default(7) }))
    .query(async ({ input }) => {
      const db = getDb();
      const { companyId, days } = input;

      const result = await db.select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`,
        status: messageLogs.status,
      })
        .from(messageLogs)
        .where(eq(messageLogs.companyId, companyId))
        .groupBy(sql`DATE(created_at)`, messageLogs.status)
        .orderBy(desc(sql`DATE(created_at)`))
        .limit(days);

      return result;
    }),
});
