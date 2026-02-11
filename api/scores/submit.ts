import type { IncomingMessage, ServerResponse } from "node:http";
import { prisma } from "../_lib/prisma";

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

type SubmitBody = {
  userId: string;
  date: string; // ISO date
  puzzleId: string;
  score: number;
  timeTaken: number;
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = (await readJson(req)) as Partial<SubmitBody>;
  if (!body.userId || !body.date || !body.puzzleId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "userId, date, puzzleId are required" }));
    return;
  }

  const score = Number(body.score ?? 0);
  const timeTaken = Number(body.timeTaken ?? 0);
  const date = new Date(body.date);

  const daily = await prisma.dailyScore.upsert({
    where: { userId_date: { userId: body.userId, date } },
    update: { puzzleId: body.puzzleId, score, timeTaken },
    create: { userId: body.userId, date, puzzleId: body.puzzleId, score, timeTaken },
  });

  await prisma.user.update({
    where: { id: body.userId },
    data: {
      totalPoints: { increment: score },
      lastPlayed: new Date(),
    },
  });

  await prisma.userStats.upsert({
    where: { userId: body.userId },
    update: { puzzlesSolved: { increment: 1 } },
    create: { userId: body.userId },
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, daily }));
}
