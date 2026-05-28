import prisma from "../src/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Senders — 30 distinct customers
// ---------------------------------------------------------------------------

const SENDERS = [
  { fromName: "Alice Morgan",     fromEmail: "alice.morgan@gmail.com" },
  { fromName: "Bob Patel",        fromEmail: "bob.patel@outlook.com" },
  { fromName: "Clara Nguyen",     fromEmail: "clara.nguyen@yahoo.com" },
  { fromName: "David Kim",        fromEmail: "david.kim@hotmail.com" },
  { fromName: "Eva Rossi",        fromEmail: "eva.rossi@proton.me" },
  { fromName: "Frank Müller",     fromEmail: "frank.muller@icloud.com" },
  { fromName: "Grace Chen",       fromEmail: "grace.chen@gmail.com" },
  { fromName: "Henry Okafor",     fromEmail: "henry.okafor@outlook.com" },
  { fromName: "Isabelle Dupont",  fromEmail: "isabelle.dupont@gmail.com" },
  { fromName: "James Osei",       fromEmail: "james.osei@yahoo.com" },
  { fromName: "Karen Tanaka",     fromEmail: "karen.tanaka@gmail.com" },
  { fromName: "Luca Ferrari",     fromEmail: "luca.ferrari@libero.it" },
  { fromName: "Maria Santos",     fromEmail: "maria.santos@gmail.com" },
  { fromName: "Nathan Brooks",    fromEmail: "nathan.brooks@outlook.com" },
  { fromName: "Olivia Hart",      fromEmail: "olivia.hart@me.com" },
  { fromName: "Pedro Alves",      fromEmail: "pedro.alves@sapo.pt" },
  { fromName: "Quinn Spencer",    fromEmail: "quinn.spencer@gmail.com" },
  { fromName: "Rachel Gomez",     fromEmail: "rachel.gomez@hotmail.com" },
  { fromName: "Samuel Lee",       fromEmail: "samuel.lee@gmail.com" },
  { fromName: "Tina Kowalski",    fromEmail: "tina.kowalski@wp.pl" },
  { fromName: "Uma Sharma",       fromEmail: "uma.sharma@gmail.com" },
  { fromName: "Victor Blanc",     fromEmail: "victor.blanc@orange.fr" },
  { fromName: "Wendy Chan",       fromEmail: "wendy.chan@gmail.com" },
  { fromName: "Xander Novak",     fromEmail: "xander.novak@seznam.cz" },
  { fromName: "Yara Al-Hassan",   fromEmail: "yara.alhassan@gmail.com" },
  { fromName: "Zoe Williams",     fromEmail: "zoe.williams@outlook.com" },
  { fromName: "Aaron Webb",       fromEmail: "aaron.webb@gmail.com" },
  { fromName: "Bella Marchetti",  fromEmail: "bella.marchetti@gmail.com" },
  { fromName: "Carlos Rivera",    fromEmail: "carlos.rivera@gmail.com" },
  { fromName: "Diana Petrov",     fromEmail: "diana.petrov@mail.ru" },
];

// ---------------------------------------------------------------------------
// Ticket templates
// ---------------------------------------------------------------------------

type TicketTemplate = {
  subject: string;
  body: string;
  category: "general_question" | "technical_question" | "refund_request" | null;
  status: "open" | "resolved" | "closed";
};

const TICKETS: TicketTemplate[] = [
  // ── technical_question ────────────────────────────────────────────────────
  {
    subject: "Cannot log in — says my account is locked",
    body: "Hi, I keep getting 'Account locked' when I try to sign in. I've only ever used the correct password. Can you please unlock my account? My email is on this ticket.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Two-factor authentication code not arriving",
    body: "I enabled 2FA last week and now I can't log in because the SMS code never arrives. I've waited 10 minutes and tried resending multiple times. Phone number is correct.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "API returning 500 errors intermittently",
    body: "Our integration with your API has been throwing 500 Internal Server Errors roughly 5% of the time since yesterday evening. The endpoint is POST /v2/payments. Request IDs attached.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Dashboard not loading — blank white screen",
    body: "After your maintenance window last night the dashboard just shows a blank white page. I've tried Chrome, Firefox and Safari. Console shows: 'ChunkLoadError: Loading chunk 17 failed.'",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Webhook events not being delivered",
    body: "Our webhook endpoint stopped receiving events around 3 PM UTC today. We can see the events in the portal but they're marked as failed with no error detail. Endpoint is healthy and responding 200.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Password reset email never arrives",
    body: "I requested a password reset three times in the last hour and haven't received a single email. I've checked spam and promotions folders. Please help.",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Export to CSV produces an empty file",
    body: "Every time I click 'Export' on the Reports page I get a CSV that only has headers and zero rows, even though the table clearly shows 2,000+ records.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Mobile app crashes on launch after latest update",
    body: "Since I updated to version 4.2.1 on iOS 17.4 the app crashes immediately on launch. I've reinstalled twice. My device is iPhone 14 Pro.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "SSO integration broken — SAML assertion failing",
    body: "Our SAML-based SSO stopped working today. The error from your system is 'Invalid issuer in SAML assertion'. Nothing has changed on our IdP. We're using Okta.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Upload limit exceeded error on files under 5 MB",
    body: "I'm getting 'Upload limit exceeded' on a 3.2 MB PDF. Your docs say the limit is 25 MB. I've tried different files and browsers — same result every time.",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Search returns no results despite matching records",
    body: "The search bar on the contacts page returns zero results for names I can plainly see in the list. This started happening after the UI update two days ago.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Notification emails going to spam",
    body: "All transactional emails from your platform are landing in our users' spam folders. Can you check your SPF/DKIM configuration? We're seeing this across Gmail and Outlook.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Rate limit hit despite being within published limits",
    body: "We're getting 429 responses claiming we've exceeded the rate limit, but our logs show we're well within the 100 requests/minute allowance. Our account tier is Enterprise.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Data sync stopped after OAuth token refresh",
    body: "Our background sync job stopped with 'token expired' even though we're using refresh tokens properly per the docs. This broke around 02:00 UTC this morning.",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Report scheduling broken — emails not sent",
    body: "I set up three scheduled reports to go out every Monday at 8 AM. None of them arrived this morning or last Monday. The schedule shows 'Last run: Never'.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Bulk import fails on row 247 every time",
    body: "I'm trying to import a CSV of 500 contacts. It always fails at row 247 with 'Invalid date format' but that cell is empty — there is no date there.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Custom domain SSL certificate showing as expired",
    body: "Our custom domain on your platform shows an expired SSL cert in browsers as of this morning. The cert was auto-renewed last month and showed valid yesterday.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Dark mode causes text to disappear in editor",
    body: "When I switch to dark mode and open the rich-text editor, I can see the cursor moving but the text itself is invisible (white on white, presumably). Light mode works fine.",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Stripe integration: charges failing with code card_error",
    body: "Since this morning every payment attempt through your Stripe integration is failing with error code 'card_error / incorrect_number' even with valid test cards. Our Stripe dashboard shows the charges never reach Stripe.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Account merge lost half my contact records",
    body: "I merged two workspaces as your support suggested. The merge completed but I'm now missing approximately 1,200 contacts from the secondary workspace. This is urgent.",
    category: "technical_question",
    status: "open",
  },

  // ── refund_request ────────────────────────────────────────────────────────
  {
    subject: "Request refund — cancelled within 24 hours",
    body: "I subscribed to the Pro plan yesterday by mistake (meant to pick the Starter plan). I cancelled within an hour. Please process a full refund to my card ending in 4242.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Double-charged for the same invoice",
    body: "My bank statement shows two identical charges of $149 on 12 May from your company. Invoice #INV-2024-0891 appears twice. Please refund the duplicate immediately.",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Charged after cancellation date",
    body: "I cancelled my subscription on 30 April but was charged again on 1 May. Your system shows cancellation was confirmed. Invoice #INV-2024-0934. Please refund.",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Refund for unused annual plan — switching provider",
    body: "We purchased an annual Enterprise plan in January but have decided to switch to a competitor. We've used less than two months. Please advise on your pro-rata refund policy.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Overcharged — quoted price doesn't match invoice",
    body: "During our sales call we were quoted $299/month for the Business plan. My first invoice is $379. No one told us about extra charges. I'd like either a correction or refund of the difference.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Annual subscription — not what was advertised",
    body: "The annual plan advertised on your website included 'unlimited team members'. After purchasing I was told this is capped at 10. I want a refund and to downgrade.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Accidental team seat purchase — 20 seats instead of 2",
    body: "A typo in the quantity field led me to purchase 20 seats instead of 2. I noticed immediately and contacted chat support who could not process a refund. Transaction ID: TXN-88201.",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Promotional discount not applied — want refund of difference",
    body: "I used promo code SAVE30 at checkout and the page showed the discount applied, but I was charged full price. Screenshot attached. Please refund the $90 difference.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Refund request — service was down for 3 days",
    body: "Your platform was completely unavailable from 8–11 March. I have screenshots and downtime monitor alerts. Per your SLA that entitles me to a credit. I'd prefer a cash refund.",
    category: "refund_request",
    status: "closed",
  },
  {
    subject: "Wrong currency charged — EUR instead of GBP",
    body: "I selected GBP at checkout but was charged in EUR at an unfavourable rate, costing me an extra £22. Invoice #INV-2024-1102. Please refund and recharge in GBP.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Trial ended early without notice — refund first month",
    body: "My 14-day trial ended on day 10 and my card was charged immediately with no warning email. I hadn't had a chance to evaluate the product properly. Requesting a refund.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Refund for add-on I can't use due to account tier",
    body: "I purchased the AI add-on but your team confirmed it's only accessible on Enterprise accounts. I'm on Business. I was not warned at checkout. Please refund $49.",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Charged twice in one month — billing cycle issue",
    body: "My billing date changed without notice and I was charged on the 1st and the 15th of the same month. That's two charges in 15 days. Please refund the second one.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Requesting partial refund after plan downgrade",
    body: "I downgraded from Enterprise to Business on the 5th of the month. I'd like a pro-rata refund for the remaining 25 days on the Enterprise plan. Amount should be ~$183.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Feature removed without notice — want refund",
    body: "The advanced analytics feature I specifically paid for was removed in your April update with no warning or price reduction. I want a refund for the months I paid for that feature.",
    category: "refund_request",
    status: "closed",
  },

  // ── general_question ──────────────────────────────────────────────────────
  {
    subject: "How do I add a team member to my account?",
    body: "I've looked through the settings but can't find where to invite additional users. My plan says I can have up to 5 seats. How do I send an invitation?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "What's included in the Business plan?",
    body: "I'm considering upgrading from Starter to Business. The comparison table on your pricing page doesn't explain what 'priority routing' means. Can you elaborate and confirm what else changes?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Can I change my billing email address?",
    body: "Our finance team has a new email address and I need to update where invoices are sent. I can't find this option in account settings. Is it possible to change it?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Do you offer discounts for non-profits?",
    body: "We're a registered 501(c)(3) and are exploring your platform. Do you have a non-profit pricing tier or a discount programme? If so, what documentation do we need to provide?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Is there a public API I can use?",
    body: "I want to build an internal integration that reads ticket data. Do you have a REST or GraphQL API available? If so, where's the documentation and how do I get an API key?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "How long is data retained after account cancellation?",
    body: "We're doing a compliance audit and need to know your data retention policy. Specifically: how long is our data kept after we cancel? Can we export everything before deletion?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Where can I find my invoices?",
    body: "My accountant is asking for invoices from the last 12 months and I'm having trouble locating them in the portal. Could you point me to the right section or email them to me?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Can I pause my subscription instead of cancelling?",
    body: "I'll be travelling for two months and won't be using the service. Is there a way to pause my subscription rather than cancel and lose my data and settings?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Do you support GDPR data deletion requests?",
    body: "A user is requesting that we delete all their personal data under GDPR Article 17. Does your platform support this and if so, how do we initiate the deletion?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "What are your uptime SLA commitments?",
    body: "We're evaluating platforms for a critical production workload. What is your guaranteed uptime SLA and what compensation do you offer if it's breached? Is this in a public document?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "How do I transfer ownership of the account?",
    body: "Our original account owner has left the company. How do we transfer ownership to a new admin? We still have access to the original email address.",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Can I use your service in China?",
    body: "We have a team in Shanghai and need to know if your platform is accessible from mainland China without a VPN. Are any features restricted due to data sovereignty laws?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "What payment methods do you accept?",
    body: "We pay via bank transfer/ACH rather than credit card. Is that an option? Also, do you accept invoicing with net-30 terms for annual plans?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Is there a free plan or extended trial available?",
    body: "The 14-day trial ended before I could properly test the platform with my team. Is there a free tier or could you extend our trial? We're a startup with limited budget.",
    category: "general_question",
    status: "open",
  },
  {
    subject: "How do I set up custom email notifications?",
    body: "I want certain team members to receive email alerts only for specific ticket categories. Is this configurable per user or only globally? I've looked in Notifications settings but only see on/off.",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Can multiple users work on the same ticket simultaneously?",
    body: "Our team sometimes needs two agents on a single ticket. Is there a collision detection or locking system so they don't overwrite each other's responses?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Do you have a mobile app for agents?",
    body: "Our agents are frequently away from their desks. Is there an iOS or Android app that provides full ticket management functionality, or is it mobile-web only?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "How are tickets prioritised in the queue?",
    body: "I can't figure out the ordering logic in the default ticket queue. Is it strictly by creation time, or does urgency or status factor in? Can we customise the sort order?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Does your platform integrate with Slack?",
    body: "We use Slack heavily and would love to receive ticket notifications there and maybe even reply from Slack. Do you have a Slack integration and what does it support?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Can I white-label the customer-facing portal?",
    body: "We'd like to replace your branding with ours in the customer portal. Is that possible on any plan? What level of customisation is available (logo, colours, custom domain)?",
    category: "general_question",
    status: "open",
  },

  // ── null category (uncategorised) ─────────────────────────────────────────
  {
    subject: "Just wanted to say thank you",
    body: "Your support agent Sarah was incredibly helpful resolving my issue last week. She went above and beyond. Please pass on my thanks to her and her manager.",
    category: null,
    status: "closed",
  },
  {
    subject: "Suggestion: add keyboard shortcuts to the editor",
    body: "It would be really useful to have Ctrl+K for links and Ctrl+Shift+C for inline code in the reply editor. Any plans for this? Happy to elaborate if helpful.",
    category: null,
    status: "open",
  },
  {
    subject: "Update my company name on the account",
    body: "We rebranded last month. Can you update our account's company name from 'Acme Ltd' to 'Acme Technologies Ltd'? Let me know if you need any verification.",
    category: null,
    status: "resolved",
  },
  {
    subject: "Security concern — suspicious login from unknown location",
    body: "I received an alert that my account was accessed from Singapore at 3 AM. I'm in Germany and did not log in. Please help me secure my account and check what was accessed.",
    category: null,
    status: "open",
  },
  {
    subject: "Request: export all data before closing account",
    body: "We've decided to close our account at end of month. Before we do, I need to export all tickets, contacts and settings. What's the best way to do a full data export?",
    category: null,
    status: "open",
  },
  {
    subject: "Wrong address on invoices — need corrected copies",
    body: "Our registered address changed six months ago and I notice our old address is still on all invoices. Can you update it and send corrected copies for the last two quarters?",
    category: null,
    status: "resolved",
  },

  // ── extra tickets to reach 100, mixing categories and statuses ────────────
  {
    subject: "Integration with Zendesk — is it possible?",
    body: "We're migrating from Zendesk and need to know if we can import our historical tickets and contacts. Do you have a Zendesk importer or an open API we can use?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Two accounts — can I merge them?",
    body: "I created accounts with two different email addresses by mistake. Can they be merged into one? The emails are alice.morgan@gmail.com and a.morgan@work.com.",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Agent response time SLA — how is it calculated?",
    body: "Our contract mentions a 4-hour first-response SLA. Does that include weekends and public holidays? And which timezone is used for the calculation?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Login page not loading on corporate network",
    body: "Several colleagues cannot access the login page from our office network. It works fine on mobile data. Our IT team suspects a firewall issue — can you provide a list of IPs/domains to whitelist?",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Auto-reply not triggering on new tickets",
    body: "I set up an auto-reply rule three days ago but customers are not receiving the acknowledgement email when they submit a ticket. The rule is enabled. Logs show no errors.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Refund — purchased wrong add-on",
    body: "I purchased the 'Advanced Reporting' add-on but actually needed 'Advanced Automation'. These are different products at the same price. Can you swap or refund so I can buy the correct one?",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Ticket tags not saving",
    body: "When I add tags to a ticket and navigate away, the tags are gone when I return. This happens in all browsers. Tags were working fine until last Thursday.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Annual renewal reminder — when will I be charged?",
    body: "My annual plan renews next month and I want to plan cash flow. On exactly which date will the charge happen and will I get an invoice in advance?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Refund — team member left the company",
    body: "One of our 5 paid seats is now unused after a team member resigned. Can I get a refund for the remaining months on that seat, or transfer it to a new hire?",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Customer portal login loop",
    body: "Our customers are getting stuck in a redirect loop when trying to log into the customer portal. It goes: login → loading → login → loading endlessly. Started this morning.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "How do canned responses work?",
    body: "I've heard about canned/saved responses but can't find the feature. Where is it configured and how do agents insert them into a reply? Is it available on all plans?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "Attachment preview broken — shows garbled text",
    body: "When I click to preview a PDF attachment inside a ticket it shows garbled characters instead of the document. Downloading and opening locally works fine.",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Refund — pricing page was misleading",
    body: "Your pricing page says 'all integrations included' but after I purchased I was told Salesforce integration is an extra $50/month. This is misleading. I want a full refund.",
    category: "refund_request",
    status: "open",
  },
  {
    subject: "Time zone setting not applying to reports",
    body: "I set my account timezone to EST but all reports still show UTC. This makes it very confusing to analyse our data. Is there a separate setting I'm missing?",
    category: "technical_question",
    status: "resolved",
  },
  {
    subject: "Can I customise the ticket submission form?",
    body: "We want to add a 'Product Version' dropdown and make the 'Phone Number' field optional rather than required. Is the customer-facing form customisable?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Overcharged VAT — incorrect tax rate applied",
    body: "I'm based in Ireland and should be charged 23% VAT. My invoice shows 25%. The difference is only €4 but it makes the invoice incorrect for our accounting. Please issue a corrected invoice.",
    category: "refund_request",
    status: "resolved",
  },
  {
    subject: "Agent collision — two of us replied to same ticket",
    body: "Both myself and my colleague sent replies to the same ticket within seconds of each other. The customer received duplicate responses. Is there a way to prevent this?",
    category: "general_question",
    status: "resolved",
  },
  {
    subject: "HIPAA compliance — is patient data safe?",
    body: "We work with healthcare data. Before we continue our evaluation we need to confirm whether your platform is HIPAA compliant and if you can sign a BAA.",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Spam tickets flooding our queue",
    body: "We're receiving hundreds of automated spam submissions per hour through our contact form. Do you have CAPTCHA or spam filtering? How can we stop this?",
    category: "technical_question",
    status: "open",
  },
  {
    subject: "Transfer data to new region — EU hosting required",
    body: "Our DPA now requires data to be hosted in the EU. We're currently on US servers. What's the process to migrate our account data to your EU region?",
    category: "general_question",
    status: "open",
  },
  {
    subject: "Invoice PDF is corrupted — cannot open",
    body: "The latest invoice email has a PDF attachment that cannot be opened in any PDF viewer. I get 'File is damaged and could not be repaired'. Please resend.",
    category: "technical_question",
    status: "resolved",
  },
];

// ---------------------------------------------------------------------------
// Dates — spread over the last 180 days
// ---------------------------------------------------------------------------

const DATE_OFFSETS = [
  0, 1, 2, 3, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 34, 36, 38, 40, 42, 45, 47, 50, 53, 56, 60, 64, 68, 72,
  76, 80, 84, 88, 92, 96, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145,
  150, 155, 160, 165, 170, 175, 180, 3, 7, 14, 21, 28, 45, 60,
  90, 120, 5, 10, 15, 25, 35, 50, 70, 95, 1, 2, 4, 6, 8, 3, 12, 18, 22, 30,
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const existing = await prisma.ticket.count();
if (existing > 0) {
  console.log(`Skipping — ${existing} tickets already exist. Delete them first if you want to re-seed.`);
  process.exit(0);
}

const records = TICKETS.map((t, i) => ({
  ...pick(SENDERS),
  subject: t.subject,
  body: t.body,
  status: t.status,
  category: t.category,
  createdAt: daysAgo(DATE_OFFSETS[i % DATE_OFFSETS.length]),
}));

// Pad to exactly 100 by cycling through templates with different senders/dates
while (records.length < 100) {
  const i = records.length;
  const template = TICKETS[i % TICKETS.length];
  records.push({
    ...pick(SENDERS),
    subject: template.subject,
    body: template.body,
    status: template.status,
    category: template.category,
    createdAt: daysAgo(Math.floor(Math.random() * 180)),
  });
}

await prisma.ticket.createMany({ data: records.slice(0, 100) });

console.log(`Seeded 100 tickets.`);
