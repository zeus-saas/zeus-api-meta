import { z } from "zod";
import "dotenv/config";

// Cria as regras para as variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string({ required_error: "Falta o DATABASE_URL no .env" }),
  JWT_SECRET: z.string({ required_error: "Falta o JWT_SECRET no .env" }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Erro nas variáveis de ambiente:", parsedEnv.error.format());
  process.exit(1); // Para o servidor se faltar algo importante
}

export const env = {
  ...parsedEnv.data,
  isProduction: parsedEnv.data.NODE_ENV === "production",
};