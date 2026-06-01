import { Sentry } from "../lib/sentry";
import prisma from "../db";
import { classifyTicket, autoResolveTicket } from "../services/ai";
import { SenderType, TicketStatus } from "@helpdesk/core";

export type ClassifyJobData = { ticketId: number; subject: string; body: string; fromName: string };

export async function classifyTicketWorker(jobs: { data: ClassifyJobData }[]): Promise<void> {
  for (const job of jobs) {
    const { ticketId, subject, body, fromName } = job.data;
    try {
      await prisma.ticket.update({ where: { id: ticketId }, data: { status: TicketStatus.processing } });

      const [category, resolved] = await Promise.all([
        classifyTicket(subject, body),
        autoResolveTicket(subject, body, fromName),
      ]);

      if (resolved.canResolve) {
        await prisma.$transaction([
          prisma.reply.create({
            data: { ticketId, senderType: SenderType.ai, body: resolved.reply },
          }),
          prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.resolved, ...(category && { category }) },
          }),
        ]);
      } else {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.open, ...(category && { category }) },
        });
      }
    } catch (err) {
      Sentry.captureException(err);
      console.error(`[Worker] Failed to process ticket ${ticketId}:`, err);
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.open },
      }).catch(() => {});
    }
  }
}
