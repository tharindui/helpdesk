import prisma from "../db";
import { classifyTicket } from "../services/ai";

export type ClassifyJobData = { ticketId: number; subject: string; body: string };

export async function classifyTicketWorker(jobs: { data: ClassifyJobData }[]): Promise<void> {
  for (const job of jobs) {
    const { ticketId, subject, body } = job.data;
    const category = await classifyTicket(subject, body);
    if (category) {
      await prisma.ticket.update({ where: { id: ticketId }, data: { category } });
    }
  }
}
