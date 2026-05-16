import { SchoolOutlined } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const academicsFeature: FeatureModule = {
  slug: "academics",
  title: "Academics",
  icon: <SchoolOutlined sx={{ fontSize: 40 }} />,
  summary:
    "Structure your institution once and let every other Nexus module work from the same academic reality.",
  seoDescription:
    "Nexus Academics helps schools, colleges, and universities manage levels, classes, sections, subjects, teacher assignments, and student promotion history from one connected academic structure.",
  heroIntro: [
    "The Academics module is the structural backbone of Nexus. It gives your institution a single source of truth for levels, classes, sections, subjects, and the teacher assignments that power day-to-day operations.",
    "Instead of rebuilding the same academic hierarchy in separate attendance sheets, fee registers, result files, and report templates, Nexus lets you define it once and reuse it everywhere. That means cleaner data, fewer manual mistakes, and much faster administrative work.",
    "For many institutions, academic structure is where downstream errors begin. If the wrong section name appears in one report, a teacher is assigned informally outside the system, or students are moved without proper historical tracking, attendance, finance, and examinations all become harder to trust. Nexus is designed to stop that drift at the source.",
  ],
  highlights: [
    "Levels, classes, and sections built in a clear academic hierarchy",
    "Subject catalogs linked to the right classes and sections",
    "Teacher-to-subject assignments tied to the real timetable structure",
    "Student promotion history preserved across years and transitions",
    "Academic records ready to support attendance, finance, and reporting",
    "Campus-aware structure for institutions managing multiple locations",
  ],
  audience: ["Principals", "Academic coordinators", "Campus admins", "Section managers"],
  operationalWins: [
    "Avoid duplicate academic setup across modules and teams",
    "Keep class, section, and subject references consistent across the whole platform",
    "Track how students move from one academic stage to the next without losing history",
    "Make attendance, exams, and fee structures easier to organise because the academic base is already clean",
  ],
  aiAssist: {
    title: "AI-assisted academic planning clarity",
    body:
      "Academic structure is one of the most important foundations for AI-ready workflows. When levels, classes, sections, and subjects are defined cleanly, Nexus can evolve toward AI-powered assistance that helps institutions review setup gaps, understand planning consequences, and ask better operational questions from a reliable academic base.",
  },
  sections: [
    {
      heading: "Levels, classes, and sections that mirror real institutions",
      body:
        "Nexus lets you build the exact hierarchy your institution works with, whether that means primary to higher secondary, college streams, or university-style academic groupings. Classes sit under the correct level, and sections give you the practical teaching groups needed for attendance, timetable alignment, examinations, and reporting.",
      paragraphs: [
        "That matters because academic structure is rarely cosmetic. It determines how students are grouped, how teachers are assigned, how attendance is marked, how fees are mapped, and how results are later interpreted. When the structure is inconsistent, every department compensates with its own side logic.",
        "Nexus keeps that hierarchy explicit and reusable. Instead of treating class names and sections like loose labels, the platform gives them a connected place in the wider ERP so operational decisions can rely on the same academic map.",
      ],
      bullets: [
        "Create academic levels such as Primary, Secondary, College, or custom structures",
        "Add classes under each level with their own metadata",
        "Split classes into sections such as A, B, C, or custom names",
      ],
    },
    {
      heading: "Subject management that stays connected to delivery",
      body:
        "Subjects are not stored as isolated labels. They are attached to the correct class context, which means teaching assignments, performance tracking, and examination workflows all stay aligned with how learning actually happens in the institution.",
      paragraphs: [
        "A subject list only becomes useful when the institution knows where it belongs, who is responsible for it, and how it connects to assessment and reporting. Many systems keep subjects too flat, which forces schools to rebuild context in other places later.",
        "Nexus keeps subjects closer to their real academic home. That helps administrators plan delivery more cleanly and gives examinations, attendance, and reporting a more trustworthy subject layer to build on.",
      ],
      bullets: [
        "Store subject names, codes, and descriptions",
        "Associate subjects with the relevant class structure",
        "Prepare clean data for exams, reports, and teacher allocation",
      ],
    },
    {
      heading: "Teacher assignment with operational meaning",
      body:
        "Academic data becomes valuable when it supports execution. Nexus links teachers to the subjects and class contexts they are responsible for, giving institutions a cleaner operational base for dashboards, workload allocation, and academic reporting.",
      paragraphs: [
        "Without structured assignments, academic leadership often depends on verbal understanding, spreadsheets, or timetable fragments to answer basic questions about who is teaching what. That creates confusion during substitutions, reviews, and result analysis.",
        "By giving teacher assignment a formal place inside the academic structure, Nexus makes responsibility easier to see and easier to reuse across the rest of the platform. The same context that helps today with coordination will help later with reporting and performance review.",
      ],
      bullets: [
        "Assign one or more teachers to the right subject and class combination",
        "Improve clarity for administrators managing delivery responsibilities",
        "Reduce confusion when attendance or exam data needs subject-level context",
      ],
    },
    {
      heading: "Promotion history that protects continuity",
      body:
        "Student movement is part of academic life, but too many systems treat it like an overwrite. Nexus keeps promotion history so you can see where a student was, where they moved, and why changes happened. That continuity matters for administration, reporting, and parent communication.",
      paragraphs: [
        "A student record should not lose meaning every time the class assignment changes. Historical movement matters when institutions need to answer parent queries, check progression, understand cohort shifts, or validate older reports.",
        "Nexus preserves that path instead of flattening it. The result is a more reliable academic record that keeps present placement useful without discarding the journey that led there.",
      ],
      bullets: [
        "Track movement between classes and sections over time",
        "Preserve academic history instead of replacing it",
        "Support future result and progression analysis with cleaner context",
      ],
    },
    {
      heading: "An academic foundation the rest of the ERP can trust",
      body:
        "The biggest value of the Academics module is not just organising classes. It is giving attendance, finance, examinations, and reporting one shared academic reality to work from.",
      paragraphs: [
        "When academic structure is weak, every connected workflow becomes more fragile. Fees get tied to the wrong class logic, results are harder to compare, and reports need more cleanup before anyone can act on them.",
        "Nexus is built so academic structure becomes a stable base layer. Once it is set correctly, the rest of the institution can move faster and make decisions with more confidence.",
      ],
      bullets: [
        "Reduce manual reconciliation across departments",
        "Strengthen data quality for examinations and reporting",
        "Give leadership a more trustworthy academic picture",
      ],
    },
  ],
  workflow: [
    {
      title: "Set up the academic hierarchy",
      body:
        "Create levels, classes, and sections in the structure your institution already uses so every later workflow starts from the right academic base.",
    },
    {
      title: "Attach subjects and teaching responsibility",
      body:
        "Define subject offerings and connect teachers to the right academic groups so delivery responsibility is no longer informal.",
    },
    {
      title: "Use the structure across the ERP",
      body:
        "Attendance, finance, examinations, and reporting all inherit this academic context instead of rebuilding it manually in separate places.",
    },
    {
      title: "Preserve continuity as students move",
      body:
        "When students are promoted or reassigned, Nexus keeps the historical path intact so the institution does not lose academic context over time.",
    },
  ],
  faqs: [
    {
      question: "Can Nexus support custom academic structures instead of only school-style grades?",
      answer:
        "Yes. The Academics module is flexible enough for schools, colleges, and other institutions that need their own level, class, and section naming structure.",
    },
    {
      question: "Why is the Academics module important for other features?",
      answer:
        "Because attendance, finance, examinations, and reporting all work better when they rely on the same class, section, and subject structure instead of separate disconnected lists.",
    },
    {
      question: "Does Nexus keep student promotion history?",
      answer:
        "Yes. Promotion history is preserved so institutions can see how a student moved over time rather than losing historical context on each update.",
    },
    {
      question: "How does a connected academic structure reduce admin work?",
      answer:
        "It removes the need to recreate the same hierarchy across different modules. Once the academic model is clean, downstream workflows become faster, clearer, and less error-prone.",
    },
  ],
};
