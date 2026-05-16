import { BarChart } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const reportingFeature: FeatureModule = {
  slug: "reporting",
  title: "Reporting",
  icon: <BarChart sx={{ fontSize: 40 }} />,
  summary:
    "Turn attendance, academics, finance, and operational data into reports leaders can actually act on.",
  seoDescription:
    "Nexus Reporting brings together attendance, finance, academic, and institutional data into filterable, exportable reports for education leaders, administrators, and campus operations teams.",
  heroIntro: [
    "Reporting matters most when it saves leadership from hunting across multiple systems. Nexus is designed so institutions can move from raw operational records to filtered, exportable reports without rebuilding the same datasets again and again.",
    "Because the wider platform already connects campuses, people, academics, attendance, and finance, the Reporting module can focus on interpretation. That makes it more useful for school heads, administrators, and owners who need visibility without technical friction.",
    "The real problem with reporting in many institutions is not lack of data. It is lack of connected data. Teams spend days collecting exports, aligning filters, checking names, and validating totals before they can answer a simple management question. Nexus is built to shorten that distance between data and decision.",
  ],
  highlights: [
    "Attendance reporting by campus, class, section, person, and date",
    "Finance reporting for collections, dues, payroll, and balances",
    "Academic and examination-linked performance views",
    "Enrollment and demographic visibility across the institution",
    "Export-ready outputs for internal or external sharing",
    "Better cross-campus oversight for leaders and operators",
  ],
  audience: ["School leaders", "Owners", "Accountants", "Academic administrators"],
  operationalWins: [
    "Replace ad hoc manual report-building with reusable institutional views",
    "Get faster visibility into attendance, collections, and academic trends",
    "Support board, management, and parent-facing reporting more confidently",
    "Make cross-campus performance easier to compare",
  ],
  aiAssist: {
    title: "AI-powered insights and decision support",
    body:
      "Reporting is where Nexus can most clearly express AI-powered insights over time. With connected data underneath, Nexus can evolve toward AI-assisted decision support that helps institutions ask better questions, understand unusual patterns faster, and move from raw reports to smarter operational interpretation.",
  },
  sections: [
    {
      heading: "Attendance reporting that supports intervention",
      body:
        "Attendance reports are most useful when they help institutions act early. Nexus reporting supports the filters leadership teams need to isolate trends by campus, class, section, student, or date range, making it easier to identify recurring absence or lateness before it becomes a larger problem.",
      paragraphs: [
        "A report is valuable when it changes what happens next. In attendance, that usually means identifying patterns soon enough for intervention rather than merely documenting them after the fact.",
        "Because Nexus attendance already understands campus, class, section, timing, and status context, reporting can focus on surfacing meaningful patterns instead of just reproducing flat registers.",
      ],
      bullets: [
        "Filter attendance views by the scopes that matter operationally",
        "Spot patterns instead of reading flat daily sheets",
        "Support pastoral, disciplinary, and operational follow-up",
      ],
    },
    {
      heading: "Finance reporting that reflects actual institutional operations",
      body:
        "Finance visibility should not stop at totals. Nexus can help institutions understand billed amounts, collections, dues, payroll exposure, and other operational finance views in context, which is essential when multiple campuses or multiple administrative teams are involved.",
      paragraphs: [
        "A raw total may be useful for bookkeeping, but education leaders usually need more context than that. They want to know where dues are rising, which campuses are collecting well, and how payroll or policy decisions are affecting the institution over time.",
        "Because finance in Nexus is already connected to students, attendance, campuses, and academic structure where relevant, reporting can tell a clearer story with less manual reconstruction.",
      ],
      bullets: [
        "Review collections and outstanding balances with better structure",
        "Understand payroll outputs in a campus-aware way",
        "Support decision-making with more connected financial context",
      ],
    },
    {
      heading: "Academic and enrollment insight in one place",
      body:
        "When leadership wants to understand academic performance or enrollment distribution, they should not have to collect records from different teams manually. Nexus makes it easier to analyse educational performance and institutional growth from a shared reporting layer.",
      paragraphs: [
        "This is where connected ERP data becomes especially valuable. Enrollment, section size, examination outcomes, and progression patterns make more sense when the reporting layer already understands the academic and people structure underneath them.",
        "Nexus helps institutions move from disconnected operational snapshots to a more coherent picture of how the educational organisation is performing.",
      ],
      bullets: [
        "Support result and academic trend analysis",
        "Track enrollment by campus, section, class, or demographic split",
        "Use a shared reporting layer instead of disconnected exports",
      ],
    },
    {
      heading: "Exportable outputs for real communication needs",
      body:
        "Institutions rarely keep reports inside the software only. Reports often need to move to management, parents, partners, or regulators. Nexus is built with exportability in mind so operational teams can move from filtered data to shareable output more efficiently.",
      paragraphs: [
        "A useful report should not require hours of reformatting before it can be shared upward or outward. Reporting only becomes operationally powerful when the path from analysis to communication is short enough to support real decisions.",
        "Nexus helps make that transition cleaner so administrators spend less time packaging information and more time using it.",
      ],
      bullets: [
        "Prepare branded or structured outputs for external sharing",
        "Support administrative review without reformatting everything manually",
        "Create a better bridge between operations and decision-makers",
      ],
    },
    {
      heading: "A reporting layer leadership can rely on",
      body:
        "The strongest reporting systems do more than produce charts. They help decision-makers trust the numbers enough to act on them.",
      paragraphs: [
        "Because Nexus reporting is built on top of connected operational modules, it is better positioned to answer real management questions with less manual reconciliation. That makes the reports more credible and more useful in meetings, planning cycles, and intervention work.",
        "The goal is not just visibility. It is usable visibility that helps campus teams, administrators, and institutional leadership move faster with more confidence.",
      ],
      bullets: [
        "Reduce time spent merging disconnected exports",
        "Improve confidence in cross-department reporting",
        "Support faster operational and leadership decisions",
      ],
    },
  ],
  workflow: [
    {
      title: "Choose the operational lens",
      body:
        "Start from attendance, finance, academic, or enrollment context depending on the question leadership or operators need answered.",
    },
    {
      title: "Filter to the real scope",
      body:
        "Narrow the report by campus, class, section, date range, or other relevant dimension so the output matches the decision context.",
    },
    {
      title: "Review patterns, not just totals",
      body:
        "Use the connected data to understand trends, risk areas, and performance differences instead of stopping at summary figures.",
    },
    {
      title: "Share and act",
      body:
        "Move from insight to export, intervention, leadership review, or planning without rebuilding the same dataset outside the platform.",
    },
  ],
  faqs: [
    {
      question: "What kinds of reports can Nexus support?",
      answer:
        "The platform is designed around operational reporting across attendance, finance, academics, enrollment, and cross-campus oversight.",
    },
    {
      question: "Why is connected reporting better than separate spreadsheets?",
      answer:
        "Because the data is already tied to the right students, classes, campuses, and finance records, which reduces mismatches and repetitive manual cleanup.",
    },
    {
      question: "Can reports be useful for both campus teams and leadership?",
      answer:
        "Yes. The reporting layer is valuable for day-to-day operators as well as for institution-level leaders who need a broader view.",
    },
    {
      question: "How does Nexus Reporting help institutions act faster?",
      answer:
        "It shortens the distance between raw operational records and decision-ready outputs. Teams spend less time assembling data and more time responding to what the data shows.",
    },
  ],
};
