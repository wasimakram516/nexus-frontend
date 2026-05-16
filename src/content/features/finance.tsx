import { AccountBalance } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const financeFeature: FeatureModule = {
  slug: "finance",
  title: "Finance",
  icon: <AccountBalance sx={{ fontSize: 40 }} />,
  summary:
    "Manage fee collection, payroll, discounts, fines, vouchers, and campus bank records from one connected finance module.",
  seoDescription:
    "Nexus Finance helps educational institutions manage fee structures, monthly vouchers, payments, payroll, salary deductions, discounts, fines, and campus bank accounts with attendance-connected logic.",
  heroIntro: [
    "Finance in education is never just accounting. It is deeply tied to class structures, campus operations, attendance behavior, discount policy, and staff payroll. Nexus is built to reflect that reality rather than treat school finance like a generic bookkeeping add-on.",
    "The result is a finance module that covers both sides of institutional operations: student billing and staff payroll. Because it connects to academics, attendance, and people data, administrators spend less time reconciling records and more time acting on them.",
    "For many institutions, the hardest part of finance is not collecting data. It is keeping fee structures, vouchers, discounts, deductions, and payroll logic aligned with what is actually happening in classes and campuses. Nexus helps finance teams work from live institutional context instead of chasing updates across separate registers and spreadsheets.",
  ],
  highlights: [
    "Class-linked fee structures and monthly student vouchers",
    "Voucher payment tracking with cash and bank transfer support",
    "Student discounts and fine policies built into the workflow",
    "Salary records, salary payments, and adjustment handling",
    "Campus-based deduction rules for absences, lateness, and leaves",
    "Bank account management for campus-level operations",
  ],
  audience: ["Accountants", "Finance managers", "Campus admins", "School leadership"],
  operationalWins: [
    "Reduce manual fee and payroll spreadsheets",
    "Connect academic placement directly to fee logic",
    "Use attendance data to support fairer deductions and fines",
    "Track money movement with cleaner operational context",
  ],
  aiAssist: {
    title: "AI-assisted fee and payroll visibility",
    body:
      "Nexus Finance is positioned to give teams AI-powered assistance around fee follow-up, payroll visibility, and operational review. The goal is not autonomous finance decisions. It is smarter guidance that helps institutions spot exceptions, understand collection pressure, and review payroll-impact patterns with better context.",
  },
  sections: [
    {
      heading: "Fee structures and vouchers that follow the academic model",
      body:
        "In Nexus, fees are not random one-off entries. They are tied to the academic structure so students inherit the right billing context from the class they belong to. Monthly vouchers can then be generated on a cleaner operational base, making collections and outstanding balances easier to understand.",
      paragraphs: [
        "That matters because fee operations usually break down when academic placement and finance records drift apart. If a student moves classes, receives a different fee treatment, or belongs to a campus with different handling rules, the finance team should not have to patch the logic manually every month.",
        "With Nexus, fee structures are defined in context and monthly vouchers can be generated from a cleaner institutional base. That gives administrators a more reliable view of what should be billed, what has already been collected, and which balances still need follow-up.",
      ],
      bullets: [
        "Define class-level fee structures with detailed breakdowns",
        "Generate student vouchers on a recurring monthly basis",
        "Track voucher states such as pending, paid, and overdue",
      ],
    },
    {
      heading: "Discounts and fines with institutional logic",
      body:
        "Educational institutions often use policy-based pricing adjustments, and Nexus reflects that. Discounts can be applied in meaningful categories, while fine rules support attendance-linked accountability without forcing manual side calculations every month.",
      paragraphs: [
        "Schools and colleges rarely run on one universal fee rule. Some students qualify for sibling relief, others for merit-based discounts, and some institutions maintain staff-child or hardship-based categories. Nexus keeps those adjustments inside the fee workflow instead of pushing them into informal side calculations.",
        "The same principle applies to fines. When attendance-linked or policy-linked penalties exist, institutions need a structured way to define and apply them. Nexus supports that so fine records remain visible, traceable, and easier to explain to finance teams, administration, and guardians.",
      ],
      bullets: [
        "Apply sibling, merit, need-based, and staff-child discounts",
        "Define fine rules by campus and class context",
        "Calculate monthly fine records for students where policies require it",
      ],
    },
    {
      heading: "Payroll that understands attendance impact",
      body:
        "Staff payroll in Nexus is not detached from campus operations. Salary records, deduction rules, one-time adjustments, and salary payments work together so institutions can model their real payroll processes instead of patching them together in separate tools.",
      paragraphs: [
        "This is where the ERP connection becomes especially important. If payroll sits outside attendance, finance teams spend their time re-checking absences, late arrivals, and leave behavior manually before they can trust a month-end payout. Nexus reduces that friction by keeping salary logic closer to the same operational records the campus is already using.",
        "The result is a payroll workflow that is easier to review, easier to explain, and better aligned with institutional policy. Base salaries, deductions, bonus adjustments, and final salary payments all stay visible in one finance context instead of being spread across disconnected documents.",
      ],
      bullets: [
        "Store base salary and effective-date context",
        "Configure deduction rules for absences, lateness, half-days, and leave",
        "Add bonuses and deductions as one-time salary adjustments",
      ],
    },
    {
      heading: "Banking and payment tracking with campus context",
      body:
        "For growing institutions, finance is often distributed across campuses. Nexus supports campus-level bank accounts and payment references so teams can manage collections and payouts with clearer traceability, especially where operations are decentralised.",
      paragraphs: [
        "Multi-campus institutions often need local execution with central oversight. A single shared finance view is useful, but campus-specific bank handling, collections, and payment flows still need to be represented properly. Nexus keeps those financial references organised without flattening every campus into one generic setup.",
        "That creates a better foundation for internal control, audit preparation, and reporting. When finance activity is connected to campus context, leadership can understand not only the totals, but where money is being collected, processed, and managed operationally.",
      ],
      bullets: [
        "Maintain bank account records per campus",
        "Use payment method context such as cash or bank transfer",
        "Keep campus-specific financial flows easier to audit and report",
      ],
    },
    {
      heading: "A finance workflow that supports both operators and leadership",
      body:
        "The strongest finance systems are not only accurate. They are understandable to the people using them every day and to the leadership reviewing outcomes each month. Nexus is designed to make both sides easier.",
      paragraphs: [
        "For accountants and finance officers, that means clearer voucher handling, better visibility into outstanding balances, cleaner payroll context, and fewer disconnected data sources. For school owners and administrators, it means better confidence in what the numbers actually represent.",
        "When finance is connected properly to the rest of the institution, it stops being a cleanup exercise and becomes a management tool. That is the direction Nexus is built for.",
      ],
      bullets: [
        "Reduce end-of-month reconciliation stress",
        "Create cleaner audit and reporting trails",
        "Give decision-makers more confidence in financial visibility",
      ],
    },
  ],
  workflow: [
    {
      title: "Configure the policy layer",
      body:
        "Set up fee structures, deduction rules, fine rules, and bank details for the campus or class context that needs them.",
    },
    {
      title: "Run monthly operations",
      body:
        "Generate vouchers, record payments, process salary calculations, and apply discounts or adjustments through the same system.",
    },
    {
      title: "Review finance with operational context",
      body:
        "Because finance is linked to students, classes, attendance, and campuses, collections and payroll figures are easier to interpret correctly.",
    },
    {
      title: "Act on dues, payouts, and policy outcomes",
      body:
        "Use the resulting visibility to follow up on outstanding balances, review payroll accuracy, and improve policy decisions with cleaner data.",
    },
  ],
  faqs: [
    {
      question: "Does Nexus Finance cover both student fees and staff payroll?",
      answer:
        "Yes. The module is built to manage both sides, which is important because institutions often need those views connected rather than separated.",
    },
    {
      question: "Can attendance affect finance calculations in Nexus?",
      answer:
        "Yes. Attendance data can influence salary deductions and student fine calculations, which helps reduce duplicate manual work.",
    },
    {
      question: "Is the finance module useful for multi-campus institutions?",
      answer:
        "Yes. Campus-specific bank records, fee logic, salary context, and reporting make it suitable for distributed operations.",
    },
    {
      question: "Can Nexus help reduce spreadsheet dependency in school finance?",
      answer:
        "Yes. A major benefit of the Finance module is that it keeps vouchers, payments, discounts, fines, payroll, and campus-level finance context inside one connected system instead of forcing teams to reconcile separate files every month.",
    },
  ],
};
