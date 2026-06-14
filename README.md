# ⚡ Zeus API Meta
### Plataforma SaaS de Automação de WhatsApp de Alta Performance

O **Zeus API Meta** é um ecossistema completo para gestão de disparos, automação de fluxos e CRM de contatos via WhatsApp, construído com foco em escalabilidade, segurança e tipagem forte.

## 🚀 Principais Funcionalidades
- **Multi-Tenancy**: Arquitetura isolada por empresas.
- **Gestão de Contatos**: Importação em massa via Excel (.xlsx), tags e filtros.
- **Autenticação**: Google OAuth e MFA (TOTP).
- **Backend**: Hono + tRPC + Drizzle ORM.

## 🛠 Tech Stack
- Node.js 22+, Hono, tRPC, Drizzle ORM, MySQL, Docker.

## ⚙️ Instalação
1. Clone o repositório: `git clone https://github.com/zeus-saas/zeus-api-meta.git`
2. Configure o .env: `cp .env.example .env`
3. Suba o sistema: `docker compose up -d --build`
4. Sincronize o banco: `docker compose exec app npm run db:push`

## 📂 Estrutura
- `/api`: Backend (tRPC + Hono)
- `/db`: Schemas do Banco
- `/src`: Frontend (React + Shadcn UI)

*Desenvolvido por The Biazolli Company.*
