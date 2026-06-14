import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

// Importações nativas e seguras
import * as jose from "jose";
import { findUserByEmail, findUserById, createUser, updateLastSignIn } from "./queries/users";

const JWT_SECRET = new TextEncoder().encode(env.appSecret || process.env.APP_SECRET || "whatsapp-saas-secret-key-2024");

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ==========================================
// ROTAS NATIVAS DO GOOGLE OAUTH
// ==========================================
app.get("/api/auth/google", (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "590967625880-dtdqdschku650fjfi63bh7j304likh6v.apps.googleusercontent.com";
  const host = c.req.header('host') || "170.80.219.154.sslip.io:3000";
  const protocol = host.includes('localhost') ? 'http' : 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`;
  return c.redirect(url);
});

app.get("/api/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) return c.redirect("/login?error=NenhumCodigoRetornado");

  const clientId = process.env.GOOGLE_CLIENT_ID || "590967625880-dtdqdschku650fjfi63bh7j304likh6v.apps.googleusercontent.com";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  
  const host = c.req.header('host') || "170.80.219.154.sslip.io:3000";
  const protocol = host.includes('localhost') ? 'http' : 'http';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return c.redirect("/login?error=FalhaNaTrocaDeTokenGoogle");

    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    let user = await findUserByEmail(userData.email);
    if (!user) {
      const userId = await createUser({
        name: userData.name,
        email: userData.email,
        authProvider: "google",
        externalId: userData.id,
        avatar: userData.picture,
        role: "user",
      });
      user = await findUserById(userId);
    }

    await updateLastSignIn(user!.id);
    
    // Assina o Token JWT padrão que o seu TRPC e o frontend já conhecem
    const token = await new jose.SignJWT({ userId: user!.id, email: user!.email, type: "google", role: user!.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Retorna para o frontend injetando o token na URL
    return c.redirect(`/login?token=${token}`);
  } catch (err) {
    console.error("Erro Interno OAuth:", err);
    return c.redirect("/login?error=ErroCriticoNoServidor");
  }
});
// ==========================================

app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
