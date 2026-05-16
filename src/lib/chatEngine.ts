import env from "@/config/env";

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
}

const SITE = env.nexusUrl;
const WS = env.wisemensoftUrl;

const L = {
  home:         `${SITE}/`,
  features:     `${SITE}/features`,
  academics:    `${SITE}/features/academics`,
  people:       `${SITE}/features/people`,
  attendance:   `${SITE}/features/attendance`,
  finance:      `${SITE}/features/finance`,
  examinations: `${SITE}/features/examinations`,
  reporting:    `${SITE}/features/reporting`,
  campuses:     `${SITE}/features/campuses`,
  customFields: `${SITE}/features/custom-fields`,
  pricing:      `${SITE}/pricing`,
  about:        `${SITE}/about`,
  contact:      `${SITE}/contact`,
  faq:          `${SITE}/faq`,
  privacy:      `${SITE}/privacy-policy`,
  terms:        `${SITE}/terms-of-service`,
  cookies:      `${SITE}/cookie-policy`,
  wisemensoft:  WS,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Entry {
  patterns: string[];
  replies: { reply: string; suggestions?: string[] }[];
}

const knowledgeBase: Entry[] = [
  {
    patterns: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy", "start", "begin"],
    replies: [
      {
        reply: `Hi there! I'm Nexus AI. Ask me anything about Nexus — features, pricing, how it works, or how to get started.`,
        suggestions: ["What is Nexus?", "Show me pricing", "What features does Nexus have?", "How do I get a demo?"],
      },
      {
        reply: `Hey! Welcome to Nexus. I can help you explore our modules, understand pricing, or get you started with a demo. What are you looking for?`,
        suggestions: ["Tell me about Nexus", "Show me pricing", "Request a demo"],
      },
      {
        reply: `Hello! I'm here to help you learn about Nexus — the all-in-one ERP for educational institutions. What would you like to know?`,
        suggestions: ["What is Nexus?", "What modules are available?", "How much does it cost?"],
      },
    ],
  },
  {
    patterns: ["what is nexus", "what does nexus do", "tell me about nexus", "about nexus", "explain nexus", "overview"],
    replies: [
      {
        reply: `Nexus is an all-in-one Education ERP built for schools, colleges, and universities.\n\nIt covers everything your institution needs:\n\n- Academics — levels, classes, sections, subjects\n- People — students, teachers, guardians\n- Attendance — check-in/out, leaves, auto-absent\n- Finance — fees, payroll, fines, discounts\n- Examinations — scheduling, results, grades, GPA\n- Reporting — analytics and exportable reports\n- Multi-Campus — unlimited campuses, one platform\n- Custom Fields — extend any entity without code\n\nStarted in 2020 as a desktop app, rebuilt as a full web platform in 2026 by Wisemen Soft.\n\n${L.home}`,
        suggestions: ["What are the pricing plans?", "Show me all features", "How do I get a demo?"],
      },
      {
        reply: `Nexus is the ERP your institution actually needs. Instead of juggling spreadsheets for attendance, separate billing software for fees, and manual payroll — Nexus brings it all into one platform.\n\nKey modules: Academics, People, Attendance, Finance, Examinations, Reporting, Multi-Campus, Custom Fields.\n\nBuilt by Wisemen Soft. Available now.\n\nLearn more: ${L.home}`,
        suggestions: ["Tell me about the modules", "What does it cost?", "Who built Nexus?"],
      },
      {
        reply: `Think of Nexus as the operating system for your institution. Every module talks to every other — attendance feeds into payroll deductions, academic structure drives fee vouchers, people profiles link across every module.\n\nOne login. Everything connected.\n\nExplore: ${L.home}`,
        suggestions: ["Show me all features", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["features", "what can nexus do", "modules", "what modules", "all features", "capabilities", "what does it include"],
    replies: [
      {
        reply: `Nexus has 8 core modules:\n\n1. Academics — ${L.academics}\n2. People — ${L.people}\n3. Attendance — ${L.attendance}\n4. Finance — ${L.finance}\n5. Examinations — ${L.examinations}\n6. Reporting — ${L.reporting}\n7. Multi-Campus — ${L.campuses}\n8. Custom Fields — ${L.customFields}\n\nAll features: ${L.features}`,
        suggestions: ["Tell me about examinations", "How does reporting work?", "Tell me about finance"],
      },
      {
        reply: `Here's what Nexus covers out of the box:\n\n- Full academic structure (levels, classes, sections, subjects)\n- Student, teacher, and guardian profiles\n- Daily attendance with auto-absent and leave management\n- Fee collection, salary payroll, fines, and discounts\n- Examinations — scheduling, results, grading, GPA\n- Reporting — analytics and exports across all modules\n- Multi-campus data isolation and management\n- Custom fields for any entity — no code needed\n\nSee all: ${L.features}`,
        suggestions: ["Tell me about examinations", "How does reporting work?", "Show me pricing"],
      },
      {
        reply: `Nexus modules work together seamlessly:\n\nAcademics sets the structure → People are enrolled into it → Attendance is tracked daily → Finance generates fee vouchers and calculates payroll deductions based on attendance → Examinations record results and compute GPA → Reporting pulls everything into exportable analytics → Custom Fields extend everything to fit your institution.\n\nFull overview: ${L.features}`,
        suggestions: ["Tell me about each module", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["academics", "academic", "classes", "levels", "sections", "subjects", "curriculum", "class hierarchy"],
    replies: [
      {
        reply: `The Academics module is the backbone of Nexus — everything else builds on top of it:\n\n- Levels (Primary, Secondary, University etc.)\n- Classes linked to each level\n- Sections (A, B, C) within classes\n- Subjects per class with codes and descriptions\n- Teacher-to-subject assignments\n- Student promotion history across years\n\n${L.academics}`,
        suggestions: ["How does attendance work?", "Tell me about people", "Show me pricing"],
      },
      {
        reply: `With Academics, you define your institution's full hierarchy once — and every other module uses it automatically.\n\nSet up your levels, add classes under them, create sections, define subjects, and assign teachers. Students are enrolled into sections and carried through promotions year by year.\n\nDetails: ${L.academics}`,
        suggestions: ["Tell me about student promotions", "How does attendance use this?", "What about finance?"],
      },
      {
        reply: `Academics in Nexus goes beyond just listing subjects. Teacher assignments, section management, and student promotion histories all live here — giving you a complete picture of your academic structure at any point in time.\n\n${L.academics}`,
        suggestions: ["How does attendance work?", "Tell me about finance", "Show me pricing"],
      },
    ],
  },
  {
    patterns: ["people", "students", "teachers", "guardians", "staff", "profiles", "enrollment", "student management"],
    replies: [
      {
        reply: `The People module manages everyone in your institution:\n\nStudents — registration numbers, DOB, CNIC, admission date, section assignment\nTeachers — CNIC, subject and class assignments, salary and attendance tracking\nGuardians — linked to students with relation types (Father, Mother, Uncle, Aunt, Other), multiple guardians per student\nContacts — phone and address records for all\n\n${L.people}`,
        suggestions: ["How does attendance work?", "Tell me about finance", "Show me pricing"],
      },
      {
        reply: `Every person in your institution has a complete profile in Nexus.\n\nStudents carry a full academic and financial history from enrollment. Teachers are linked to their classes and subjects. Guardians are associated with students and can be notified about fees and attendance.\n\nAll contact records are centralised and always up to date.\n\n${L.people}`,
        suggestions: ["Tell me about attendance", "Tell me about finance", "Show me pricing"],
      },
      {
        reply: `People in Nexus aren't siloed — student profiles connect to academic records, fee vouchers, attendance history, and custom fields. Teacher profiles link to their class assignments and salary records.\n\nEverything is connected under one profile.\n\n${L.people}`,
        suggestions: ["Tell me about custom fields", "How does finance work?", "Show me pricing"],
      },
    ],
  },
  {
    patterns: ["attendance", "check in", "check out", "check-in", "check-out", "absent", "leave", "late", "present", "daily tracking"],
    replies: [
      {
        reply: `The Attendance module handles daily tracking for students and staff:\n\n- Check-in and check-out with exact timestamps\n- Statuses: PRESENT, ABSENT, LATE, LEAVE, half-day\n- Auto-absent marking at end of day\n- Leave marking with reason\n- Campus-level late thresholds (configurable per campus)\n- Summaries filterable by campus, class, section, or individual\n\nAttendance feeds directly into Finance — absences drive staff deductions and student fines.\n\n${L.attendance}`,
        suggestions: ["How does finance use attendance?", "Tell me about multi-campus", "Show me pricing"],
      },
      {
        reply: `Attendance in Nexus is more than just marking present or absent. Every check-in and check-out is timestamped. The system automatically determines LATE status based on your campus's configured thresholds. At end of day, anyone who didn't check in is auto-marked ABSENT.\n\nAll of this feeds into monthly salary deductions and student fines automatically.\n\n${L.attendance}`,
        suggestions: ["Tell me about salary deductions", "How does finance work?", "Show me pricing"],
      },
      {
        reply: `Running a multi-campus institution? Each campus can have its own operating hours and late thresholds in Nexus. Attendance is tracked independently per campus, with a central view available to institution admins.\n\nLeave management, half-day tracking, and attendance summaries all included.\n\n${L.attendance}`,
        suggestions: ["Tell me about multi-campus", "How does finance work?", "Show me pricing"],
      },
    ],
  },
  {
    patterns: ["finance", "fees", "fee", "salary", "payroll", "payment", "voucher", "discount", "fine", "billing", "money", "bank", "deduction"],
    replies: [
      {
        reply: `The Finance module is a complete financial engine for your institution:\n\nStudent Fees\n- Fee structures per class\n- Monthly vouchers (PENDING/PAID/OVERDUE)\n- Cash or bank transfer payments\n- Discounts — Sibling, Merit, Need-Based, Staff Child\n- Fines for absences, lates, and leaves\n\nStaff Payroll\n- Base salary with configurable deduction rules\n- One-time bonuses and deductions\n- Monthly net salary calculations\n\nBank account management per campus.\n\n${L.finance}`,
        suggestions: ["How do deductions work?", "Tell me about fee vouchers", "Show me pricing"],
      },
      {
        reply: `Finance in Nexus covers both sides — student fees and staff payroll.\n\nFor students: define a fee structure per class, generate monthly vouchers automatically, apply discounts and fines based on attendance, and record payments.\n\nFor staff: set base salaries, configure deduction rules for absences and late arrivals, add bonuses, and generate monthly net salary calculations.\n\n${L.finance}`,
        suggestions: ["Tell me about attendance", "What are the pricing plans?", "Show me all features"],
      },
      {
        reply: `Every financial operation in your institution lives in Nexus Finance:\n\nFee vouchers are generated monthly per student based on their class's fee structure. Discounts (Sibling, Merit, Need-Based, Staff Child) are applied automatically. Fines accumulate from attendance records.\n\nPayroll works the same way — deduction rules run against attendance data every month to calculate net salaries.\n\n${L.finance}`,
        suggestions: ["How does attendance feed into finance?", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["multi campus", "multiple campuses", "campuses", "campus", "branches", "locations", "multi-campus"],
    replies: [
      {
        reply: `Multi-campus support is built into Nexus from day one — not an add-on:\n\n- Unlimited campuses per institution\n- Per-campus operating hours and late thresholds\n- Staff are scoped to their assigned campuses\n- Full data isolation between campuses\n- Institution admins see everything across all campuses\n\nWhether you have 2 or 20 campuses — one Nexus account handles it all.\n\n${L.campuses}`,
        suggestions: ["Tell me about user roles", "Show me pricing", "How do I get a demo?"],
      },
      {
        reply: `Managing multiple campuses usually means multiple software installs or complicated shared databases. Nexus solves this natively.\n\nEvery campus has its own configuration, users, and data — but institution admins get a unified view across all of them. No switching accounts, no duplicate work.\n\n${L.campuses}`,
        suggestions: ["Tell me about user roles", "Show me pricing", "Request a demo"],
      },
      {
        reply: `Each campus in Nexus is fully self-contained — its own operating hours, attendance thresholds, staff assignments, and financial records. At the same time, institution-level admins can see and manage everything centrally.\n\nData isolation means a teacher at Campus A cannot see Campus B's students or records.\n\n${L.campuses}`,
        suggestions: ["Tell me about data security", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["examination", "examinations", "exam", "exams", "results", "grades", "grading", "gpa", "grade sheet", "result card", "marks", "pass fail", "assessment"],
    replies: [
      {
        reply: `The Examinations module handles your full assessment lifecycle:\n\n- Schedule exams per class, section, and subject\n- Enter obtained marks per student\n- Automatic pass/fail and grade calculation\n- Configurable grading scale (A+, A, B, C or custom)\n- GPA and percentage computation per student\n- Class and section rank calculation\n- Result cards and grade sheets ready to print or share\n- Supplementary exam support\n\n${L.examinations}`,
        suggestions: ["How does grading work?", "Tell me about reporting", "Show me pricing"],
      },
      {
        reply: `Running exams in Nexus is straightforward:\n\n1. Schedule an exam — link it to a class, section, and subject with a date and total marks\n2. Enter results — record obtained marks per student after the exam\n3. Nexus does the rest — calculates percentages, applies your grading scale, computes GPA, and ranks the class\n\nResult cards are generated instantly and ready to export.\n\n${L.examinations}`,
        suggestions: ["Tell me about the grading scale", "How does reporting use exam data?", "Show me pricing"],
      },
      {
        reply: `Nexus Examinations is fully connected to the rest of the platform. Students are pulled from People, subject structure comes from Academics, and exam results feed directly into Reporting for cross-class and trend analysis.\n\nOne system. No double entry.\n\n${L.examinations}`,
        suggestions: ["Tell me about reporting", "Tell me about academics", "Show me pricing"],
      },
    ],
  },
  {
    patterns: ["reporting", "reports", "analytics", "analysis", "export", "insights", "data export", "statistics", "trends", "dashboard reports", "pdf", "csv"],
    replies: [
      {
        reply: `The Reporting module gives you institution-wide analytics across every module:\n\n- Attendance reports by student, class, campus, date range\n- Finance summaries — collections, dues, outstanding balances\n- Payroll breakdowns per staff member\n- Exam result analysis by class, section, and subject\n- Student enrollment and demographic breakdowns\n- Custom date-range filtering\n- Export to PDF and CSV with your institution branding\n\n${L.reporting}`,
        suggestions: ["Tell me about attendance", "Tell me about finance", "Show me pricing"],
      },
      {
        reply: `Reporting in Nexus pulls live data from every module — attendance, finance, academics, and examinations — into one place.\n\nFilter by campus, class, section, date range, or individual. Export as a branded PDF for boards and parents or raw CSV for further analysis.\n\nNo third-party BI tool needed.\n\n${L.reporting}`,
        suggestions: ["How do I export reports?", "Tell me about examinations", "Show me pricing"],
      },
      {
        reply: `Every report in Nexus is actionable:\n\n- Spot chronically absent students before it becomes a problem\n- See which classes are underperforming in exams\n- Identify outstanding fee balances at a glance\n- Compare payroll costs across campuses\n\nAll filterable, all exportable.\n\n${L.reporting}`,
        suggestions: ["Tell me about attendance", "Tell me about finance", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["custom fields", "custom field", "dynamic fields", "add fields", "extra fields", "extend"],
    replies: [
      {
        reply: `Custom Fields let you extend any entity in Nexus without writing code:\n\n- 15+ input types: text, number, email, phone, date, datetime, select, multi-select, checkbox, radio, boolean, file, image, URL\n- Define fields for Students, Teachers, Guardians, and more\n- Fields appear inline on the relevant page — no separate settings screen\n- Institution-scoped — your fields are private\n\n${L.customFields}`,
        suggestions: ["Show me pricing", "How do I get a demo?", "Tell me about features"],
      },
      {
        reply: `Every institution has data that doesn't fit in a standard form. Scholarship status, transport route, uniform size, emergency contact type — Nexus Custom Fields handles all of it.\n\nCreate fields directly from the entity page. Choose from 15+ input types. No developer needed.\n\n${L.customFields}`,
        suggestions: ["Tell me about people", "Show me pricing", "Request a demo"],
      },
      {
        reply: `Custom Fields in Nexus are inline — they appear on the student, teacher, or guardian page right alongside the standard fields. No navigating to a separate settings area.\n\nYour fields are institution-scoped, so they're completely private to your organisation.\n\n${L.customFields}`,
        suggestions: ["Tell me about people", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["pricing", "price", "cost", "how much", "plans", "plan", "subscription", "afford", "charge", "pay for"],
    replies: [
      {
        reply: `Nexus has 3 plans:\n\nStarter\n- 1 campus, up to 500 students\n- Academics, People, Attendance\n- Email support\n\nGrowth (Most Popular)\n- Up to 5 campuses, 3,000 students\n- All modules including Finance and Payroll\n- Custom fields, Priority support\n\nEnterprise\n- Unlimited campuses and students\n- All modules + Custom branding + API access\n- Dedicated support and SLA\n\nAll plans include a 14-day free trial. No credit card required.\n\n${L.pricing}`,
        suggestions: ["Start a free trial", "What modules are included?", "Contact the team"],
      },
      {
        reply: `Nexus pricing is designed to grow with your institution.\n\nStart on the Starter plan for a single campus. Move to Growth when you expand to multiple campuses. Enterprise when you need unlimited scale, custom branding, and dedicated support.\n\nAll plans come with a 14-day free trial — no card required.\n\nFull breakdown: ${L.pricing}`,
        suggestions: ["What's included in Growth?", "Tell me about Enterprise", "How do I start a trial?"],
      },
      {
        reply: `Rather than locking features behind expensive tiers, Nexus gives you what you need at each stage:\n\n- Small institution? Starter covers the essentials.\n- Growing? Growth adds finance, payroll, and custom fields.\n- University network? Enterprise gives you unlimited scale and a dedicated team.\n\nSee full pricing: ${L.pricing}`,
        suggestions: ["Start a free trial", "Contact the team", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["free trial", "trial", "try nexus", "test nexus", "demo account", "free plan", "try for free"],
    replies: [
      {
        reply: `Yes — all Nexus plans include a 14-day free trial with no credit card required.\n\nFull feature access, no limitations. Cancel or upgrade at any time.\n\nGet started: ${L.contact}`,
        suggestions: ["What are the pricing plans?", "Request a demo", "Contact the team"],
      },
      {
        reply: `We believe you should see Nexus working for your institution before you pay anything. That's why every plan starts with a 14-day free trial.\n\nNo credit card. No commitment. Full access.\n\n${L.contact}`,
        suggestions: ["Show me pricing", "What features are included?", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["demo", "get started", "sign up", "register", "onboard", "request demo", "book demo", "walkthrough"],
    replies: [
      {
        reply: `To request a demo:\n\n1. Visit our Contact page\n2. Fill in your institution name and inquiry type\n3. We'll reach out within 24 hours to schedule a walkthrough\n\nWe tailor every demo to your institution — school, college, or university.\n\n${L.contact}`,
        suggestions: ["What are the pricing plans?", "What features does Nexus have?", "Who built Nexus?"],
      },
      {
        reply: `A Nexus demo takes about 30–45 minutes. We walk you through the modules most relevant to your institution, answer your questions, and help you figure out the right plan.\n\nBook yours here: ${L.contact}`,
        suggestions: ["Show me pricing", "Tell me about features", "Contact the team"],
      },
      {
        reply: `Getting started with Nexus is simple — reach out and we'll set up your trial environment and walk you through everything.\n\nRequest a demo: ${L.contact}`,
        suggestions: ["What are the pricing plans?", "What features does Nexus have?"],
      },
    ],
  },
  {
    patterns: ["roles", "role", "user roles", "who can use", "permissions", "access control", "superadmin", "admin", "accountant"],
    replies: [
      {
        reply: `Nexus has 6 user roles, each with scoped access:\n\n- Superadmin — Platform-level (Wisemen Soft team)\n- Admin — Full institution management\n- Teacher — Classes, attendance, subjects\n- Student — Own profile and records\n- Guardian — Linked student info and fee status\n- Accountant — Finance module access\n\nEach role sees only what they need. Campus users are further restricted to their assigned campuses.`,
        suggestions: ["Tell me about multi-campus", "Show me pricing", "How do I get a demo?"],
      },
      {
        reply: `Role-based access in Nexus means everyone sees exactly what they need — nothing more.\n\nAdmins manage the whole institution. Teachers see their classes and students. Accountants access finance only. Guardians see their linked children's records. Students see their own profiles.\n\nAll scoped to their assigned campus automatically.`,
        suggestions: ["Tell me about campus scoping", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["security", "secure", "data", "privacy", "safe", "encrypted", "data protection", "data safety"],
    replies: [
      {
        reply: `Nexus takes data security seriously:\n\n- TLS 1.2+ encryption in transit\n- Passwords hashed with bcrypt — never stored in plain text\n- Short-lived JWT tokens (15 min) with HttpOnly refresh cookies\n- Full data isolation per institution\n- You own your data — export anytime\n- No tracking or advertising cookies\n\nPrivacy Policy: ${L.privacy}\nCookie Policy: ${L.cookies}`,
        suggestions: ["Show me pricing", "Who built Nexus?", "How do I get a demo?"],
      },
      {
        reply: `Your institution's data in Nexus is completely isolated from other institutions at the database level. No institution can ever see another's records — even accidentally.\n\nAll connections are TLS-encrypted. Passwords are bcrypt-hashed. Access tokens expire every 15 minutes. You can export your full dataset at any time.\n\nPrivacy Policy: ${L.privacy}`,
        suggestions: ["Tell me about data ownership", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["wisemen soft", "wisemensoft", "wisemen", "wiseman", "who made nexus", "who built nexus", "who created nexus", "company", "team", "developer", "built by"],
    replies: [
      {
        reply: `Nexus is built by Wisemen Soft — a software house based in Pakistan, building enterprise and SaaS products for clients across Pakistan and the GCC region.\n\nNexus started as a desktop app in 2020 and was rebuilt as a full web platform in 2026. It's our most ambitious product.\n\nAbout: ${L.about}\nWisemen Soft: ${L.wisemensoft}`,
        suggestions: ["What is Nexus?", "Tell me about features", "How do I get a demo?"],
      },
      {
        reply: `Wisemen Soft is the team behind Nexus. Based in Pakistan, we build software that solves real operational problems — and we kept coming back to education because it's one of the most underserved sectors when it comes to quality operational software.\n\nNexus is our answer to that.\n\n${L.about}`,
        suggestions: ["Tell me about Nexus", "Show me pricing", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["gcc", "region", "country", "pakistan", "middle east", "gulf", "uae", "saudi", "qatar", "kuwait", "arabic", "rtl"],
    replies: [
      {
        reply: `Nexus is built for the GCC and South Asian education market — schools, colleges, and universities in Pakistan, UAE, Saudi Arabia, Qatar, Kuwait, and the wider region.\n\nArabic and RTL language support is on our roadmap. Contact us if this is a current requirement: ${L.contact}`,
        suggestions: ["Show me pricing", "How do I get a demo?", "Tell me about features"],
      },
      {
        reply: `We built Nexus specifically with the GCC and Pakistan education sector in mind. The workflows, fee structures, and operational patterns are designed around how institutions in this region actually work.\n\nArabic/RTL is coming soon. Contact us for timeline: ${L.contact}`,
        suggestions: ["Show me pricing", "Request a demo", "Who built Nexus?"],
      },
    ],
  },
  {
    patterns: ["api", "integration", "integrate", "developer", "technical", "rest api", "webhook"],
    replies: [
      {
        reply: `Nexus runs on a fully documented REST API. API access is available on the Enterprise plan — integrate with student information systems, HR tools, payment gateways, or custom dashboards.\n\nContact us for technical documentation: ${L.contact}`,
        suggestions: ["Show me Enterprise pricing", "How do I get a demo?", "Contact the team"],
      },
      {
        reply: `If you need to connect Nexus to other systems — payment gateways, HR software, custom reporting — our REST API makes that possible.\n\nAvailable on Enterprise. Contact us for details: ${L.contact}\n\nPricing: ${L.pricing}`,
        suggestions: ["Tell me about Enterprise", "Contact the team", "Request a demo"],
      },
    ],
  },
  {
    patterns: ["contact", "reach", "email", "support", "talk", "speak", "message", "get in touch", "help", "assistance"],
    replies: [
      {
        reply: `You can reach the Nexus team at:\n\nnexus@wisemensoft.com — general enquiries\nsupport@wisemensoft.com — technical support\n\nWe respond within 24 hours on business days.\n\nContact page: ${L.contact}`,
        suggestions: ["Request a demo", "Show me pricing", "What is Nexus?"],
      },
      {
        reply: `The fastest way to reach us is through our contact page — fill in your details and inquiry type and we'll get back to you within 24 hours.\n\n${L.contact}\n\nOr email directly: nexus@wisemensoft.com`,
        suggestions: ["Request a demo", "Show me pricing", "What features does Nexus have?"],
      },
    ],
  },
  {
    patterns: ["faq", "frequently asked", "questions", "common questions"],
    replies: [
      {
        reply: `We have a full FAQ covering campuses, billing, security, data export, support, API access, and more.\n\n${L.faq}`,
        suggestions: ["Show me pricing", "Contact the team", "Tell me about features"],
      },
    ],
  },
  {
    patterns: ["privacy policy", "terms", "terms of service", "legal", "cookie", "gdpr", "data rights"],
    replies: [
      {
        reply: `Our legal documents:\n\nPrivacy Policy: ${L.privacy}\nTerms of Service: ${L.terms}\nCookie Policy: ${L.cookies}`,
        suggestions: ["Tell me about data security", "Contact the team", "What is Nexus?"],
      },
    ],
  },
  {
    patterns: ["thank", "thanks", "thank you", "appreciate", "helpful", "great", "awesome", "perfect"],
    replies: [
      {
        reply: `You're welcome! Is there anything else you'd like to know about Nexus?\n\n${L.home}`,
        suggestions: ["Show me pricing", "Tell me about features", "How do I get a demo?"],
      },
      {
        reply: `Happy to help! Feel free to ask anything else about Nexus.\n\n${L.home}`,
        suggestions: ["Show me pricing", "Request a demo", "Contact the team"],
      },
      {
        reply: `Glad that helped! Anything else on your mind?\n\n${L.home}`,
        suggestions: ["What are the pricing plans?", "Tell me about features"],
      },
    ],
  },
  {
    patterns: ["bye", "goodbye", "see you", "later", "cya", "done", "that's all", "no thanks"],
    replies: [
      {
        reply: `Thanks for your interest in Nexus! Feel free to come back anytime. Have a great day!\n\n${L.home}`,
        suggestions: [],
      },
      {
        reply: `Take care! If you have more questions later, I'm always here.\n\n${L.home}`,
        suggestions: [],
      },
    ],
  },
];

const fallbackReplies = [
  {
    reply: `I'm not sure about that specific question. I can help with features, pricing, demos, security, or getting started.\n\nExplore Nexus: ${L.home}`,
    suggestions: ["What is Nexus?", "Show me pricing", "How do I get a demo?", "Contact the team"],
  },
  {
    reply: `That's a bit outside what I know right now. Try asking about features, pricing, or how to request a demo.\n\nFAQ: ${L.faq}`,
    suggestions: ["What is Nexus?", "Show me pricing", "Request a demo"],
  },
  {
    reply: `I don't have a specific answer for that. Our team can help directly:\n\nnexus@wisemensoft.com\n\nContact: ${L.contact}`,
    suggestions: ["What is Nexus?", "Show me pricing", "How do I get a demo?"],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

export function getResponse(userInput: string): ChatResponse {
  const input = normalize(userInput);
  for (const entry of knowledgeBase) {
    for (const pattern of entry.patterns) {
      if (input.includes(pattern)) {
        return pick(entry.replies);
      }
    }
  }
  return pick(fallbackReplies);
}

