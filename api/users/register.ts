import type { IncomingMessage, ServerResponse } from "node:http";
import { prisma } from "../_lib/prisma";

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

type RegisterBody = {
  email?: string;
  phone?: string;
  name?: string;
  authMethod: "google" | "truecaller" | "guest";
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = (await readJson(req)) as Partial<RegisterBody>;
  const authMethod = body.authMethod;

  if (!authMethod) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "authMethod is required" }));
    return;
  }

  const email = body.email?.trim() || null;
  const phone = body.phone?.trim() || null;
  const name = body.name?.trim() || null;

  if (!email && !phone && authMethod !== "guest") {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "email or phone is required" }));
    return;
  }

  const where = email
    ? { email }
    : phone
      ? { phone }
      : { email: `guest_${Date.now()}@guest.local` };

  const user = await prisma.user.upsert({
    where,
    update: {
      name,
      authMethod,
      lastPlayed: new Date(),
    },
    create: {
      email: email ?? (typeof where.email === "string" ? where.email : null),
      phone,
      name,
      authMethod,
      lastPlayed: new Date(),
      stats: { create: {} },
    },
    include: { stats: true },
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(user));
}
