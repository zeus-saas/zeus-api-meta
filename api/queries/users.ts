import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { users, type InsertUser } from "../../db/schema";

export async function findUserById(id: number) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function findUserByExternalId(externalId: string, provider: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.externalId, externalId),
  });
}

export async function findUserByUnionId(unionId: string) {
  const db = getDb();
  return db.query.users.findFirst({
    where: eq(users.id, Number(unionId)),
  });
}

export async function createUser(data: InsertUser) {
  const db = getDb();
  const result = await db.insert(users).values(data);
  return result[0].insertId;
}

export async function upsertUser(data: { unionId: string; name?: string | null; avatar?: string | null; lastSignInAt?: Date }) {
  const db = getDb();
  const existing = await findUserById(Number(data.unionId));
  if (existing) {
    await db.update(users)
      .set({
        name: data.name || existing.name,
        avatar: data.avatar || existing.avatar,
        lastSignInAt: data.lastSignInAt || new Date(),
      })
      .where(eq(users.id, Number(data.unionId)));
    return existing.id;
  }
  const result = await db.insert(users).values({
    id: Number(data.unionId),
    email: `user_${data.unionId}@temp.com`,
    name: data.name,
    avatar: data.avatar,
    authProvider: "local",
    role: "user",
    lastSignInAt: data.lastSignInAt || new Date(),
  });
  return result[0].insertId;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = getDb();
  await db.update(users).set(data).where(eq(users.id, id));
  return findUserById(id);
}

export async function updateUserMfa(id: number, mfaSecret: string | null, mfaEnabled: boolean) {
  const db = getDb();
  await db.update(users).set({ mfaSecret, mfaEnabled }).where(eq(users.id, id));
}

export async function updateLastSignIn(id: number) {
  const db = getDb();
  await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, id));
}
