import { z } from "zod";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import * as jose from "jose";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "../../db/schema";
import { findUserByEmail, findUserById, createUser, updateUser, updateUserMfa, updateLastSignIn } from "../queries/users";

// JWT Secret
const JWT_SECRET = new TextEncoder().encode(process.env.APP_SECRET || "whatsapp-saas-secret-key-2024");

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
        throw new Error("Este email já está cadastrado");
      }

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
        throw new Error("Email ou senha inválidos");
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Email ou senha inválidos");
      }

      if (!user.isActive) {
        throw new Error("Conta desativada. Entre em contato com o suporte.");
      }

      // Se MFA estiver habilitado, retornar flag para verificação
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

  // Verificar MFA
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
        throw new Error("Token inválido ou expirado");
      }

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) {
        throw new Error("Usuário não encontrado");
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new Error("Código inválido");
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

  // Configurar MFA
  setupMfa: publicQuery
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new Error("Token inválido");

      const user = await findUserById(payload.userId as number);
      if (!user) throw new Error("Usuário não encontrado");

      const secret = speakeasy.generateSecret({
        name: `WhatsCloud:${user.email}`,
        length: 32,
      });

      // Salvar secret temporariamente (não ativa ainda)
      await updateUserMfa(user.id, secret.base32, false);

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
      };
    }),

  // Ativar MFA
  enableMfa: publicQuery
    .input(
      z.object({
        token: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new Error("Token inválido");

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) throw new Error("Usuário não encontrado");

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) throw new Error("Código inválido");

      await updateUserMfa(user.id, user.mfaSecret, true);
      return { success: true };
    }),

  // Desativar MFA
  disableMfa: publicQuery
    .input(
      z.object({
        token: z.string(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const payload = await verifyToken(input.token);
      if (!payload) throw new Error("Token inválido");

      const user = await findUserById(payload.userId as number);
      if (!user || !user.mfaSecret) throw new Error("Usuário não encontrado");

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) throw new Error("Código inválido");

      await updateUserMfa(user.id, null, false);
      return { success: true };
    }),

  // Me (autenticado via token JWT local)
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
