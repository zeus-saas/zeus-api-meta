import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../db/schema";

const globalForDb = globalThis as unknown as {
  conn: mysql.ConnectionPool | undefined;
};

export const conn =
  globalForDb.conn ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export function getDb() {
  return drizzle(conn, { schema, mode: "default" });
}
