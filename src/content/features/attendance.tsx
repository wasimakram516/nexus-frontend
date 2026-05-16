import { Today } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const attendanceFeature: FeatureModule = {
  slug: "attendance",
  title: "Attendance",
  icon: <Today sx={{ fontSize: 40 }} />,
  summary:
    "Track real attendance behavior, not just a daily tick mark, with timestamps, leave handling, thresholds, and downstream financial impact.",
  seoDescription:
    "Nexus Attendance handles student and staff attendance with check-in and check-out times, late thresholds, leave management, auto-absent marking, summaries, and integration with payroll deductions and student fine calculations.",
  heroIntro: [
    "Attendance is one of the most operationally sensitive parts of an education ERP. If it is too simple, it becomes unreliable. If it is too disconnected, it creates friction for payroll, parent communication, and intervention workflows. Nexus is designed to make attendance both usable and meaningful.",
    "Instead of storing attendance as a flat status only, Nexus tracks the context around it: check-in time, check-out time, leave states, late thresholds, and campus-specific rules. That gives administrators a better view of discipline, punctuality, and operational consistency.",
    "That matters because schools and colleges rarely struggle with the idea of taking attendance. They struggle with making it trustworthy, consistent across campuses, and useful after the register is marked. Nexus turns attendance into an operational record that can support action, not just compliance.",
  ],
  highlights: [
    "Daily attendance for students and staff with timestamps",
    "Present, absent, late, leave, and half-day support",
    "Campus-specific late and early-leave thresholds",
    "Auto-absent workflow for missed arrivals",
    "Attendance history and summary visibility by scope",
    "Connected downstream use in fines, deductions, and reporting",
  ],
  audience: ["Campus admins", "Teachers", "Operations teams", "HR and finance staff"],
  operationalWins: [
    "Reduce manual reconciliation between attendance sheets and payroll",
    "Spot punctuality and absence patterns sooner",
    "Support fairer deduction and fine calculations from real data",
    "Keep campus-level policies consistent without extra spreadsheet logic",
  ],
  aiAssist: {
    title: "AI-powered attendance insights",
    body:
      "Nexus Attendance is designed to support AI-powered assistance around patterns that humans often miss at scale: repeated lateness, absence clustering, and campus-level discipline drift. That gives institutions a path toward smarter attendance review without pretending the system is making autonomous decisions for them.",
  },
  sections: [
    {
      heading: "Attendance with real timing context",
      body:
        "Nexus records actual check-in and check-out times, which matters because punctuality and partial attendance are often more operationally important than a simple present or absent marker. The module can distinguish late arrivals and half-day patterns in a way traditional registers usually cannot.",
      paragraphs: [
        "In many institutions, a present mark hides too much. A student who walks in late every day, a staff member who leaves early, or a class that records attendance inconsistently can create problems that never show up in a flat daily register. Nexus gives those events shape by recording the timing around the attendance state itself.",
        "That richer context helps administrators, section heads, and operations teams understand whether the real issue is absenteeism, punctuality, schedule discipline, or incomplete day records. It also creates a more credible foundation for any later reporting or finance-side impact.",
      ],
      bullets: [
        "Capture daily check-in and check-out events",
        "Mark present, absent, late, leave, and half-day states",
        "Preserve attendance history for both staff and students",
      ],
    },
    {
      heading: "Campus-specific policy enforcement",
      body:
        "Different campuses often have different hours, and Nexus respects that. Attendance logic can follow campus operating windows and configurable thresholds, helping institutions manage multi-campus discipline without forcing a single timing policy everywhere.",
      paragraphs: [
        "This is especially important for institutions that operate junior and senior sections differently, run multiple campuses, or have separate expectations for teaching staff and administrative staff. A one-rule-fits-all attendance system usually ends up pushing exceptions into verbal instructions and spreadsheets.",
        "With Nexus, policy can stay closer to the campus that actually operates it. That reduces debate around whether someone was technically late, whether an early departure should count, and whether the same rule is being applied consistently across teams.",
      ],
      bullets: [
        "Configure student and staff timing windows per campus",
        "Set late thresholds and early-leave thresholds based on local policy",
        "Apply rules consistently through the platform instead of manually",
      ],
    },
    {
      heading: "Leave management and auto-absent support",
      body:
        "Operational teams need a system that can handle both planned exceptions and end-of-day cleanup. Nexus supports leave marking with reasons and also helps clean records by auto-marking non-arrivals, reducing the burden on staff who would otherwise close days manually.",
      paragraphs: [
        "Attendance quality usually breaks down at the edges: approved leave that is not documented properly, students who never arrive but remain unmarked, or staff records that are left unresolved until someone remembers to clean them up later. Those small gaps quickly reduce trust in the whole attendance system.",
        "Nexus is designed to reduce that drift. Teams can record leave states with context, while automatic absent handling helps close open records more predictably. That makes downstream summaries easier to trust and reduces the need for end-of-month correction work.",
      ],
      bullets: [
        "Record leave with reasons for better traceability",
        "Use auto-absent marking to finish incomplete days cleanly",
        "Maintain more trustworthy attendance data for later reporting",
      ],
    },
    {
      heading: "Attendance that feeds decisions, not just storage",
      body:
        "Attendance becomes much more valuable when it drives action. In Nexus, attendance is designed to connect with finance and reporting so that absences, late arrivals, and leaves can influence payroll deductions, fines, and wider institutional insights.",
      paragraphs: [
        "The real value of attendance is not in storing rows. It is in helping institutions respond correctly. A campus administrator may need to identify recurring lateness, HR may need absence-linked deduction data, and finance may need attendance-backed fine logic that can be explained clearly if questioned.",
        "Because Nexus keeps attendance connected to the rest of the ERP, the same operational record can support multiple outcomes without forcing departments to rebuild the story from scratch. That makes the module more useful to management and less frustrating for the teams doing the daily work.",
      ],
      bullets: [
        "Use attendance records in salary deduction calculations",
        "Support student fine logic using the same source data",
        "Filter summaries by campus, class, section, or individual",
      ],
    },
    {
      heading: "A clearer attendance picture for teachers, operators, and leadership",
      body:
        "Different users need different levels of visibility. Teachers need a practical daily workflow. Campus operators need exception handling and consistency. Leadership needs patterns, not noise. Nexus is structured so the same attendance engine can support all three without making the interface feel overloaded.",
      paragraphs: [
        "That separation matters because many attendance tools are either too basic for operations teams or too heavy for classroom use. When the workflow becomes inconvenient, records get delayed, guessed, or bypassed altogether.",
        "Nexus keeps the day-to-day act of attendance straightforward while still giving administrators the structure they need for review, intervention, and reporting. The result is a module that works at classroom level and still holds value at management level.",
      ],
      bullets: [
        "Support simple day-level marking for operational users",
        "Give admins a clearer trail of exceptions and reasons",
        "Provide leadership with patterns they can act on earlier",
      ],
    },
  ],
  workflow: [
    {
      title: "Capture the day",
      body:
        "Teachers or administrators record attendance with status and timing context, so the day starts with a cleaner operational record instead of a simple present-or-absent guess.",
    },
    {
      title: "Apply policy automatically",
      body:
        "Campus thresholds, leave states, and auto-absent rules help standardize how attendance is interpreted without forcing staff to remember every rule manually.",
    },
    {
      title: "Use the output operationally",
      body:
        "The final record can then feed reporting, follow-up, payroll deductions, and student fine workflows instead of sitting inside an isolated register.",
    },
  ],
  faqs: [
    {
      question: "Can Nexus handle different attendance rules for different campuses?",
      answer:
        "Yes. Nexus is designed for institutions that do not run every campus on the same timing model. Operating hours, late thresholds, and related attendance logic can follow the campus context instead of forcing one blanket policy everywhere.",
    },
    {
      question: "Does attendance in Nexus affect payroll or student fines?",
      answer:
        "Yes. Attendance is structured to support related finance workflows, so absences, lateness, and other attendance outcomes can be reflected in salary deductions or student fine calculations where the institution uses those rules.",
    },
    {
      question: "Is attendance only for students?",
      answer:
        "No. Nexus supports both student and staff attendance, which is important for institutions that want one consistent operational system rather than separate attendance processes for academics and HR-related workflows.",
    },
    {
      question: "Why is timestamp-based attendance better than a simple daily register?",
      answer:
        "A simple register can tell you who was marked present, but it often cannot explain punctuality issues, half-days, early departures, or whether attendance data is strong enough to support payroll or fines. Timestamp-aware attendance gives institutions a more useful and defensible operational record.",
    },
  ],
};
