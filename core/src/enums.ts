export const Role = {
  admin: "admin",
  agent: "agent",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export enum TicketStatus {
  open = "open",
  resolved = "resolved",
  closed = "closed",
}

export enum TicketCategory {
  general_question = "general_question",
  technical_question = "technical_question",
  refund_request = "refund_request",
}

export enum SenderType {
  agent = "agent",
  customer = "customer",
}
