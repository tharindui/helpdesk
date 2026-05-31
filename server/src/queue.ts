import { PgBoss } from "pg-boss";
import type { Ticket } from "./generated/prisma/client";
import { classifyTicketWorker, type ClassifyJobData } from "./workers/classifyTicket";

const CLASSIFY_QUEUE = "classify-ticket";

const boss = new PgBoss(process.env.DATABASE_URL!);

export async function startQueue(): Promise<void> {
  await boss.start();
  await boss.createQueue(CLASSIFY_QUEUE);
  await boss.work<ClassifyJobData>(CLASSIFY_QUEUE, classifyTicketWorker);
  console.log("[Queue] classify-ticket worker registered");
}

export async function stopQueue(): Promise<void> {
  await boss.stop();
  console.log("[Queue] stopped");
}

export async function sendClassifyJob(ticket: Pick<Ticket, "id" | "subject" | "body">): Promise<void> {
  await boss.send(CLASSIFY_QUEUE, { ticketId: ticket.id, subject: ticket.subject, body: ticket.body });
}
