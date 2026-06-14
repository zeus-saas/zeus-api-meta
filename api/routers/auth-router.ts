import { z } from "zod";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import * as jose from "jose";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { env } from "../lib/env";
import { 
  findUserByEmail, 
  findUserById, 
  createUser, 
  updateUserMfa, 
  updateLastSignIn 
} from "../queries/users";

const JWT_SECRET = new TextEncoder().encode(env.appSecret || "whatsapp-saas-secret-key-2024");

async function signToken(payload: Record<string, any>): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload;
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  // Registro com email/senha
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Este email já está cadastrado." });
      }

      try {
        const passwordHash = await bcrypt.hash(input.password, 12);
        const userId = await createUser({
          name: input.name,
          email: input.email,
          passwordHash,
          authProvider: "local",
          role: "user",
        });

        const token = await signToken({ userId, email: input.email, type: "local" });
        return { token, userId };
      } catch (error: any) {
        // Agora, se o banco falhar, o erro exato sobe para a tela!
        console.error("Erro interno ao criar usuário:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro no banco de dados: ${error.message}`
        });
      }
    }),

  // Login com email/senha
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await findUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada. Entre em contato com o suporte." });
      }

      if (user.mfaEnabled) {
        const tempToken = await signToken({ 
          userId: user.id, 
          email: user.email, 
          type: "mfa_pending",
          mfaRequired: true 
        });
        return { mfaRequired: true, tempToken };
      }

      await updateLastSignIn(user.id);
      const token = await signToken({ 
        userId: user.id, 
        email: user.email, 
        type: "local",
        role: user.role 
      });
      
      return { mfaRequired: false, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  verifyMfa: publicQuery
    .input(
      z.object({
        tempToken: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const payload = await verifyToken(input.tempToken);
      if (!payload || payload.type !== "mfa_pending") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou expirado" });
      }

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido" });
      }

      await updateLastSignIn(user.id);
      const token = await signToken({ 
        userId: user.id, 
        email: user.email, 
        type: "local",
        role: user.role 
      });

      return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  setupMfa: publicQuery
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });

      const user = await findUserById(payload.userId as number);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      const secret = speakeasy.generateSecret({
        name: `WhatsCloud:${user.email}`,
        length: 32,
      });

      await updateUserMfa(user.id, secret.base32, false);
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

      return { secret: secret.base32, qrCode: qrCodeUrl };
    }),

  enableMfa: publicQuery
    .input(
      z.object({
        token: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido" });

      await updateUserMfa(user.id, user.mfaSecret, true);
      return { success: true };
    }),

  disableMfa: publicQuery
    .input(
      z.object({
        token: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) throw new TRPCError({ code: "UNAUTHORIZED", message: "Código inválido" });

      await updateUserMfa(user.id, null, false);
      return { success: true };
    }),

  me: publicQuery
    .input(z.object({ token: z.string() }).optional())
    .query(async ({ input }) => {
      if (!input?.token) return null;
      const payload = await verifyToken(input.token);
      if (!payload) return null;
      const user = await findUserById(payload.userId as number);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
        authProvider: user.authProvider,
        isActive: user.isActive,
      };
    }),
});