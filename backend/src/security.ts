import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "./types";

const jwtSecret = process.env.JWT_SECRET ?? "flowworks-dev-secret-change-me";
const refreshSecret = process.env.REFRESH_TOKEN_SECRET ?? "flowworks-dev-refresh-change-me";

export interface AuthClaims {
  sub: string;
  email: string;
  roles: Record<string, Role>;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(claims: AuthClaims) {
  return jwt.sign(claims, jwtSecret, { expiresIn: "30m" });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, refreshSecret, { expiresIn: "14d" });
}

export function verifyAccessToken(token: string): AuthClaims {
  return jwt.verify(token, jwtSecret) as AuthClaims;
}

export function requireWorkspaceRole(claims: AuthClaims, workspaceId: string, allowed: Role[]) {
  const role = claims.roles[workspaceId];
  if (!role || !allowed.includes(role)) {
    const error = new Error("Workspace access denied");
    Object.assign(error, { status: 403 });
    throw error;
  }
}

function encryptionKey() {
  const configured = process.env.ENCRYPTION_KEY;
  if (configured) {
    const buffer = Buffer.from(configured, "base64");
    if (buffer.length === 32) return buffer;
  }
  return crypto.createHash("sha256").update("flowworks-dev-encryption-key").digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}

export function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
