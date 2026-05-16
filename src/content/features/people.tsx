import { Groups } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const peopleFeature: FeatureModule = {
  slug: "people",
  title: "People",
  icon: <Groups sx={{ fontSize: 40 }} />,
  summary:
    "Manage students, teachers, guardians, and contact relationships in one connected profile system.",
  seoDescription:
    "Nexus People centralises student, teacher, and guardian management with linked profiles, contact records, guardian relationships, admissions context, and cross-module reuse across academics, attendance, and finance.",
  heroIntro: [
    "The People module keeps your institution's most important records connected: students, teachers, guardians, and the contact relationships around them. Instead of spreading core identity data across forms, fee registers, attendance sheets, and side spreadsheets, Nexus keeps it central and usable everywhere.",
    "That connection matters because real institutions do not manage people in isolation. A student profile needs academic placement, fee history, attendance history, and guardian relationships. A teacher profile needs subject assignments, salary records, and campus context. Nexus is designed around that reality.",
    "For many schools and colleges, people data is where operational confusion begins. A student changes section but one register is not updated. A guardian number changes but finance still uses the old contact. A teacher record exists in HR, but not in the academic workflow. Nexus is built to reduce that fragmentation and give every department a shared profile foundation.",
  ],
  highlights: [
    "Student profiles with registration, admissions, identity, and section context",
    "Guardian records with explicit relation types and many-to-many linking",
    "Teacher profiles ready for subject assignment, attendance, and payroll",
    "Shared contact management for students, guardians, and teachers",
    "Institution-aware and campus-aware access to sensitive profile data",
    "Custom-field extensibility for institution-specific profile needs",
  ],
  audience: ["Admissions teams", "Front desk staff", "Academic offices", "HR and administration"],
  operationalWins: [
    "Reduce duplicate profile entry across departments",
    "Give every team one reliable place to find identity and relationship data",
    "Make parent communication easier because guardian links are structured, not informal",
    "Keep student and teacher records ready for downstream modules like attendance and finance",
  ],
  aiAssist: {
    title: "AI-assisted record discovery and relationship clarity",
    body:
      "Nexus People gives the platform a cleaner people graph to work from, which matters for AI-powered assistance later. When student, guardian, teacher, and contact data are structured properly, Nexus AI can help teams find the right record faster, surface relationship context more clearly, and guide users without working from fragmented data.",
  },
  sections: [
    {
      heading: "Student profiles that support the full lifecycle",
      body:
        "Nexus stores the information institutions actually need to work with every day: registration number, date of birth, identity details, admission date, campus placement, and class or section alignment. That profile becomes the anchor for attendance, finance, future examinations, and reporting.",
      paragraphs: [
        "A student profile should be more than an admissions form saved in software. It should be the operational identity the rest of the institution can trust. When identity data and academic placement stay consistent, other modules stop wasting time asking the same questions in different places.",
        "That is especially important over time. Students move between sections, campuses, and academic stages. Administrators need a stable record that can carry those changes cleanly while still remaining useful to finance, attendance, academics, and parent-facing communication.",
      ],
      bullets: [
        "Track admissions and identity information clearly",
        "Link students to campus, class, and section",
        "Use the same student record across academic and operational modules",
      ],
    },
    {
      heading: "Guardian relationships with real-world flexibility",
      body:
        "Families are not always simple one-record structures, and institutions should not have to force them into one. Nexus supports multiple guardian relationships and clear relation types, making it easier to record who is responsible, who should be contacted, and how families connect to student records.",
      paragraphs: [
        "This matters in everyday school operations more than many systems admit. Siblings often share the same responsible adult, some students live with extended family, and institutions need clarity about who should receive notices, who is financially responsible, and who can be contacted first in operational situations.",
        "When those relationships are left informal, every department ends up building its own partial understanding of the family. Nexus keeps those links structured so that admissions, academics, attendance follow-up, and finance collection are all working from the same relationship map.",
      ],
      bullets: [
        "Store guardian relation types such as father, mother, aunt, uncle, or other",
        "Link one guardian to multiple students where needed",
        "Support family-level communication and fee follow-up more cleanly",
      ],
    },
    {
      heading: "Teacher records built for operations, not just storage",
      body:
        "Teacher profiles are designed to support the actual work of running a campus. They connect to subject assignments, attendance, and salary records so administration teams are not constantly translating between different systems to understand workload or responsibility.",
      paragraphs: [
        "In many institutions, teacher data becomes fragmented quickly. One record lives in an HR file, another in timetable discussions, and another in payroll notes. That makes routine questions surprisingly hard to answer: who teaches what, where are they assigned, and how does that connect to compensation or attendance history?",
        "Nexus gives teacher records a stronger operational role. The profile becomes a connected base for subject responsibility, campus context, attendance, and compensation-related workflows, which helps administration teams work with a more complete view of the person behind the role.",
      ],
      bullets: [
        "Store teacher identity and profile details in one place",
        "Connect profiles to class and subject responsibility",
        "Support payroll and attendance workflows from the same base record",
      ],
    },
    {
      heading: "Contact data that is structured instead of scattered",
      body:
        "Nexus stores contact ownership with stronger relational integrity while preserving the simple product experience institutions expect. That means clearer phone and address records for students, guardians, and teachers without the loose linking problems that often show up later in reporting or support work.",
      paragraphs: [
        "Contact data seems small until it fails. An outdated number can affect parent communication, due follow-up, emergency contact, and support work all at once. When the system is unclear about whose number belongs to whom, trust in the data drops quickly.",
        "Nexus keeps contact information tied to the right person context so teams can work more confidently. That helps front desk staff, accountants, administrators, and academic offices rely on the same record instead of maintaining private side lists.",
      ],
      bullets: [
        "Maintain phone and address records against the right person type",
        "Keep relationship data safer at the database level",
        "Support institution-specific custom fields on contact records where needed",
      ],
    },
    {
      heading: "One people layer that supports every department",
      body:
        "The real strength of a people module is not just what it stores. It is what it prevents. When admissions, academics, attendance, and finance all pull from the same profile layer, the institution spends less time correcting identity drift and more time handling real work.",
      paragraphs: [
        "This is where an ERP earns its value. Instead of each department maintaining a partial version of the same person, Nexus gives the institution one connected source for the people it serves and employs.",
        "That improves both operational speed and managerial confidence. Staff can find the right information faster, while leadership can trust that downstream reports and workflows are grounded in the same core records.",
      ],
      bullets: [
        "Reduce duplicate data entry across teams",
        "Improve accuracy in downstream attendance and finance workflows",
        "Create a stronger institutional record for long-term reporting",
      ],
    },
  ],
  workflow: [
    {
      title: "Create core profiles",
      body:
        "Admissions or administration teams create student, guardian, and teacher records with the right campus, identity, and academic context so the operational foundation is clean from the start.",
    },
    {
      title: "Link the right relationships",
      body:
        "Guardians are linked to the right students, teachers are tied to academic structures, and contact records are attached in a way every department can reuse confidently.",
    },
    {
      title: "Reuse the same records across modules",
      body:
        "Attendance, finance, and other institutional workflows then pull from the same trusted profiles instead of recreating identity data in separate places.",
    },
    {
      title: "Keep people data usable over time",
      body:
        "As students move, families change, or teacher responsibilities evolve, the same people layer stays reusable instead of becoming a one-time admissions archive.",
    },
  ],
  faqs: [
    {
      question: "Can one guardian be linked to multiple students in Nexus?",
      answer:
        "Yes. Nexus supports many-to-many student-guardian relationships, which is especially useful for siblings, shared family responsibility, and institutions that want cleaner household-level records.",
    },
    {
      question: "Does the People module help beyond admissions?",
      answer:
        "Yes. The People module is not just for intake. These records are reused across attendance, finance, academics, and reporting, which makes it a long-term operational layer rather than a one-time admissions store.",
    },
    {
      question: "Can the People module support institution-specific profile fields?",
      answer:
        "Yes. Nexus custom fields can extend people-related entities without forcing every institution-specific requirement into the core product schema.",
    },
    {
      question: "Why is a connected people module important in an education ERP?",
      answer:
        "Because student, guardian, and teacher records are reused everywhere. If identity and relationship data is weak, every downstream module suffers. A connected people layer reduces duplication, improves communication accuracy, and gives the institution a more reliable operational base.",
    },
  ],
};
