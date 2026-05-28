import prisma from "../src/db";

const count = await prisma.ticket.count();
await prisma.ticket.deleteMany();
console.log(`Deleted ${count} tickets.`);
