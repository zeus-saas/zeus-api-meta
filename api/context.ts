import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifyToken } from "./routers/auth-router";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  
  // Tentar autenticação via OAuth (Kimi)
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
    if (ctx.user) return ctx;
  } catch {
    // Ignorar erro OAuth
  }

  // Tentar autenticação via token JWT local (Bearer token)
  try {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        const user = await findUserById(payload.userId as number);
        if (user) {
          ctx.user = user;
        }
      }
    }
  } catch {
    // Ignorar erro JWT
  }

  return ctx;
}
