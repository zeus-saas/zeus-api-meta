import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  json,
  decimal,
} from "drizzle-orm/mysql-core";

// ============================================================
// EMPRESAS (CLIENTES DO SAAS)
// Declarada primeiro para podermos referenciá-la nos usuários
// ============================================================

export const companies = mysqlTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  logo: text("logo"),
  // Configurações da API WhatsApp da Meta
  whatsappBusinessId: varchar("whatsapp_business_id", { length: 255 }),
  whatsappPhoneId: varchar("whatsapp_phone_id", { length: 255 }),
  whatsappApiToken: text("whatsapp_api_token"),
  whatsappPhoneNumber: varchar("whatsapp_phone_number", { length: 50 }),
  // Limites e plano
  plan: mysqlEnum("plan", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  maxContacts: int("max_contacts").default(1000).notNull(),
  maxMessagesPerMonth: int("max_messages_per_month").default(5000).notNull(),
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ============================================================
// USUÁRIOS E AUTENTICAÇÃO
// ============================================================

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  // Vínculo Direto: O usuário pertence obrigatoriamente a uma empresa
  companyId: bigint("company_id", { mode: "number", unsigned: true }).references(() => companies.id),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  // Role global: saas_admin = dono da plataforma, user = usuário comum
  role: mysqlEnum("role", ["saas_admin", "user"]).default("user").notNull(),
  // Provedor de login: local (email/senha), google, microsoft
  authProvider: mysqlEnum("auth_provider", ["local", "google", "microsoft"]).default("local").notNull(),
  // ID externo para OAuth (google/microsoft)
  externalId: varchar("external_id", { length: 255 }),
  // MFA TOTP
  mfaSecret: varchar("mfa_secret", { length: 255 }),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
  mfaVerified: boolean("mfa_verified").default(false).notNull(),
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("last_sign_in_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// VÍNCULO USUÁRIO-EMPRESA (PERMISSÕES MULTI-WORKSPACE Opcional)
// ============================================================

export const userCompanies = mysqlTable("user_companies", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  // Role na empresa: admin = admin da empresa, manager = gestor, agent = atendente/operador
  role: mysqlEnum("role", ["admin", "manager", "agent"]).default("agent").notNull(),
  // Permissões específicas (JSON para flexibilidade)
  permissions: json("permissions").$type<string[]>(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserCompany = typeof userCompanies.$inferSelect;
export type InsertUserCompany = typeof userCompanies.$inferInsert;

// ============================================================
// CONTATOS (LEADS)
// ============================================================

export const contacts = mysqlTable("contacts", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  
  // Informações Pessoais
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  phone2: varchar("phone_2", { length: 50 }), // Telefone 2 (Opcional)
  
  // Informações Corporativas do Contato
  company: varchar("contact_company_name", { length: 255 }), // Empresa onde o lead trabalha
  cnpj: varchar("cnpj", { length: 50 }),
  
  // Origem e Rastreamento de Importação
  source: varchar("source", { length: 255 }), // Ex: "Planilha Excel", "Landing Page", "Manual"
  importedById: bigint("imported_by_id", { mode: "number", unsigned: true }).references(() => users.id), // Quem importou
  importIp: varchar("import_ip", { length: 50 }), // IP de quem importou
  importedAt: timestamp("imported_at").defaultNow(), // Data e Hora da importação
  
  // Tags para segmentação
  tags: json("tags").$type<string[]>(),
  // Dados customizados (JSON)
  customData: json("custom_data").$type<Record<string, string>>(),
  // Status: active, inactive, blocked
  status: mysqlEnum("status", ["active", "inactive", "blocked"]).default("active").notNull(),
  // Opt-in LGPD
  optIn: boolean("opt_in").default(true).notNull(),
  optInDate: timestamp("opt_in_date").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ============================================================
// LISTAS DE CONTATOS (SEGMENTAÇÃO)
// ============================================================

export const contactLists = mysqlTable("contact_lists", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Filtros usados para criar a lista (JSON)
  filters: json("filters").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContactList = typeof contactLists.$inferSelect;
export type InsertContactList = typeof contactLists.$inferInsert;

// Relação contato-lista
export const contactListItems = mysqlTable("contact_list_items", {
  id: serial("id").primaryKey(),
  listId: bigint("list_id", { mode: "number", unsigned: true }).notNull(),
  contactId: bigint("contact_id", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// TEMPLATES DE MENSAGEM
// ============================================================

export const messageTemplates = mysqlTable("message_templates", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Categoria do template (Meta): MARKETING, UTILITY, AUTHENTICATION
  category: mysqlEnum("category", ["MARKETING", "UTILITY", "AUTHENTICATION"]).default("MARKETING").notNull(),
  // Idioma
  language: varchar("language", { length: 10 }).default("pt_BR").notNull(),
  // Conteúdo do template com variáveis {{1}}, {{2}}, etc.
  body: text("body").notNull(),
  headerType: mysqlEnum("header_type", ["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).default("NONE").notNull(),
  headerText: varchar("header_text", { length: 255 }),
  headerMediaUrl: text("header_media_url"),
  footer: varchar("footer", { length: 255 }),
  // Botões (JSON)
  buttons: json("buttons").$type<Array<{ type: string; text: string; url?: string }>>(),
  // Status na Meta: PENDING, APPROVED, REJECTED
  metaStatus: mysqlEnum("meta_status", ["PENDING", "APPROVED", "REJECTED", "NOT_SUBMITTED"]).default("NOT_SUBMITTED").notNull(),
  metaTemplateId: varchar("meta_template_id", { length: 255 }),
  // Variáveis esperadas
  variables: json("variables").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

// ============================================================
// CAMPANHAS DE DISPARO
// ============================================================

export const campaigns = mysqlTable("campaigns", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Template usado
  templateId: bigint("template_id", { mode: "number", unsigned: true }),
  // Lista de contatos
  listId: bigint("list_id", { mode: "number", unsigned: true }),
  // Status: draft, scheduled, running, paused, completed, cancelled
  status: mysqlEnum("status", ["draft", "scheduled", "running", "paused", "completed", "cancelled"]).default("draft").notNull(),
  // Agendamento
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  // Métricas
  totalContacts: int("total_contacts").default(0).notNull(),
  sentCount: int("sent_count").default(0).notNull(),
  deliveredCount: int("delivered_count").default(0).notNull(),
  readCount: int("read_count").default(0).notNull(),
  failedCount: int("failed_count").default(0).notNull(),
  replyCount: int("reply_count").default(0).notNull(),
  // Variáveis do template em formato JSON
  templateVariables: json("template_variables").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ============================================================
// REGISTRO DE ENVIO DE MENSAGENS
// ============================================================

export const messageLogs = mysqlTable("message_logs", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  campaignId: bigint("campaign_id", { mode: "number", unsigned: true }),
  contactId: bigint("contact_id", { mode: "number", unsigned: true }).notNull(),
  // ID da mensagem na Meta
  metaMessageId: varchar("meta_message_id", { length: 255 }),
  // Status: pending, sent, delivered, read, failed
  status: mysqlEnum("status", ["pending", "sent", "delivered", "read", "failed"]).default("pending").notNull(),
  // Tipo: campaign, flow, manual
  type: mysqlEnum("type", ["campaign", "flow", "manual"]).default("campaign").notNull(),
  // Conteúdo enviado
  content: text("content"),
  // Resposta do cliente
  replyContent: text("reply_content"),
  replyAt: timestamp("reply_at"),
  // Erro se houver
  errorMessage: text("error_message"),
  // Timestamps da Meta
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MessageLog = typeof messageLogs.$inferSelect;
export type InsertMessageLog = typeof messageLogs.$inferInsert;

// ============================================================
// FLUXOS DE AUTOMAÇÃO
// ============================================================

export const flows = mysqlTable("flows", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Status: draft, active, paused, inactive
  status: mysqlEnum("status", ["draft", "active", "paused", "inactive"]).default("draft").notNull(),
  // Gatilho: manual, webhook, schedule, inbound_message
  trigger: mysqlEnum("trigger", ["manual", "webhook", "schedule", "inbound_message"]).default("manual").notNull(),
  // Configuração do gatilho (JSON)
  triggerConfig: json("trigger_config").$type<Record<string, any>>(),
  // Nós do fluxo (JSON)
  nodes: json("nodes").$type<Array<any>>(),
  // Conexões entre nós
  edges: json("edges").$type<Array<any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Flow = typeof flows.$inferSelect;
export type InsertFlow = typeof flows.$inferInsert;

// ============================================================
// EXECUÇÕES DE FLUXO
// ============================================================

export const flowExecutions = mysqlTable("flow_executions", {
  id: serial("id").primaryKey(),
  flowId: bigint("flow_id", { mode: "number", unsigned: true }).notNull(),
  contactId: bigint("contact_id", { mode: "number", unsigned: true }).notNull(),
  // Status: running, completed, failed, waiting
  status: mysqlEnum("status", ["running", "completed", "failed", "waiting"]).default("running").notNull(),
  // Dados do contexto da execução
  contextData: json("context_data").$type<Record<string, any>>(),
  currentNodeId: varchar("current_node_id", { length: 255 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ============================================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================================

export const systemSettings = mysqlTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ============================================================
// WEBHOOK LOGS (LOGS DE CALLBACK DA META)
// ============================================================

export const webhookLogs = mysqlTable("webhook_logs", {
  id: serial("id").primaryKey(),
  companyId: bigint("company_id", { mode: "number", unsigned: true }),
  // Tipo do evento: message, status_update, etc.
  eventType: varchar("event_type", { length: 100 }).notNull(),
  // Payload completo
  payload: json("payload").$type<Record<string, any>>(),
  // Processado ou não
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});