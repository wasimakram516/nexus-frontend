import { AssignmentTurnedIn } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const examinationsFeature: FeatureModule = {
  slug: "examinations",
  title: "Examinations",
  icon: <AssignmentTurnedIn sx={{ fontSize: 40 }} />,
  summary:
    "Plan exams, capture results, and turn academic performance into something institutions can actually use.",
  seoDescription:
    "Nexus Examinations helps institutions schedule exams, enter marks, manage grading logic, calculate performance outcomes, and produce result-ready academic views for students, sections, and classes.",
  heroIntro: [
    "Examinations are where academic structure, student records, and reporting all come together. A strong examinations experience should help institutions organise schedules, record results accurately, and understand academic outcomes without building separate manual spreadsheets every term.",
    "Nexus is positioned to handle that workflow in a connected way. Because exam-related work sits close to academics, people, and reporting, institutions get cleaner data flow from subject setup to result communication.",
    "For many schools and colleges, result season is where disconnected systems become painfully obvious. The timetable lives in one place, marks in another, grading in a third, and reporting becomes a final cleanup project. Nexus is built to reduce that fragmentation and make academic evaluation easier to trust.",
  ],
  highlights: [
    "Exam scheduling linked to academic structure",
    "Per-student result entry with real subject context",
    "Grade and performance logic that institutions can standardise",
    "Class, section, and subject-level result analysis",
    "Cleaner preparation for result cards and academic reports",
    "Connected data flow into broader institutional reporting",
  ],
  audience: ["Examination departments", "Academic offices", "School leadership", "Teachers"],
  operationalWins: [
    "Reduce result processing delays caused by disconnected files",
    "Keep exam data aligned with real class and subject structures",
    "Make it easier to compare performance across groups and periods",
    "Prepare result communication on cleaner data foundations",
  ],
  aiAssist: {
    title: "AI-assisted result interpretation and trend visibility",
    body:
      "Examinations is a natural place for AI-powered assistance to add value over time. Once results are structured properly, Nexus can help institutions move toward AI-assisted interpretation that highlights academic trends, surfaces performance questions earlier, and gives leadership smarter visibility without overstating the product as fully autonomous analytics.",
  },
  sections: [
    {
      heading: "Scheduling with proper academic alignment",
      body:
        "Exam schedules work best when they are tied directly to the academic model instead of floating as disconnected events. Nexus can position exam activities around class, section, and subject context so the institution knows exactly who an assessment belongs to and where it should appear later.",
      paragraphs: [
        "An examination schedule is not just a calendar. It is an academic commitment that affects teachers, students, invigilators, reporting cycles, and parent communication. If it is not properly aligned to the academic structure, every later stage becomes harder to manage.",
        "Nexus keeps the exam context anchored to real academic groups so institutions can move into result entry and analysis with far less ambiguity.",
      ],
      bullets: [
        "Organise exams around the real academic structure",
        "Keep subject-level evaluation tied to the correct class context",
        "Reduce confusion for teachers and administrators during exam cycles",
      ],
    },
    {
      heading: "Results that are easier to trust",
      body:
        "Result entry needs more than a marks box. Institutions need confidence that marks belong to the correct student, subject, and exam context. Nexus supports that cleaner linking so result data stays more reliable for later comparisons and communication.",
      paragraphs: [
        "Trust in exam data is critical because small errors have visible consequences. A mismatched student, incorrect subject context, or missing exam link can undermine the credibility of the whole reporting process.",
        "By keeping results inside a more structured examination workflow, Nexus helps schools and colleges reduce correction cycles and prepare cleaner result outputs.",
      ],
      bullets: [
        "Record marks against the right student and assessment context",
        "Maintain cleaner result datasets for reporting and exports",
        "Prepare a stronger foundation for grade sheets and academic review",
      ],
    },
    {
      heading: "Performance analysis beyond raw marks",
      body:
        "What matters after exams is interpretation. Once data is connected properly, institutions can compare class performance, section performance, subject outcomes, and broader academic trends without rebuilding the same report manually each time.",
      paragraphs: [
        "Leadership rarely wants only a list of scores. They want to know what the scores mean. Which sections are underperforming? Which subjects need intervention? Which trends are repeating? Those questions require structured exam data, not isolated spreadsheets.",
        "Nexus helps make that interpretation possible by keeping performance data closer to the academic structure that gives it meaning.",
      ],
      bullets: [
        "Compare performance by class, section, and subject",
        "Spot weak areas that need intervention",
        "Support leadership review with more actionable academic insight",
      ],
    },
    {
      heading: "A cleaner path to result communication",
      body:
        "Results are not useful until they can be shared clearly. Nexus is designed to support cleaner preparation for result cards, academic reviews, and parent-facing communication.",
      paragraphs: [
        "Too often, institutions spend more time formatting and verifying outputs than understanding the actual academic picture. That is usually a sign the underlying examination workflow is too disconnected.",
        "By improving the way exams and results are structured upstream, Nexus makes downstream communication easier to prepare and easier to trust.",
      ],
      bullets: [
        "Prepare result-ready academic outputs more efficiently",
        "Reduce manual reconciliation before sharing results",
        "Support cleaner communication with leadership and families",
      ],
    },
    {
      heading: "An examinations layer that fits the wider ERP",
      body:
        "Examinations should not live as an isolated academic island. Their value grows when they sit close to academics, people, and reporting.",
      paragraphs: [
        "That connection is what helps institutions move from scheduling to marks, from marks to analysis, and from analysis to action without recreating the same context over and over.",
        "Nexus is built so the examination workflow feels like part of the institutional system, not a separate seasonal tool.",
      ],
      bullets: [
        "Connect results back to students and academic structure",
        "Support stronger reporting and analysis later",
        "Reduce fragmentation during exam season",
      ],
    },
  ],
  workflow: [
    {
      title: "Define the assessment context",
      body:
        "Set up the exam against the right class, section, and subject structure so the dataset is clean before marks ever begin to arrive.",
    },
    {
      title: "Capture and verify results",
      body:
        "Enter marks in the correct student and subject context so result data stays trustworthy and easier to validate.",
    },
    {
      title: "Review outcomes with academic meaning",
      body:
        "Use the connected data to compare groups, identify weak areas, and support academic review instead of just storing scores.",
    },
    {
      title: "Communicate results with more confidence",
      body:
        "Prepare result outputs and academic summaries from a cleaner base so reporting is less stressful and more credible.",
    },
  ],
  faqs: [
    {
      question: "Why does examination data need to be connected to academics?",
      answer:
        "Because exam schedules, subject contexts, and result analysis all depend on the academic structure being accurate. Without that link, result workflows become harder to trust.",
    },
    {
      question: "Can Nexus help compare performance across sections or classes?",
      answer:
        "Yes. Once results are connected to the right academic structure, comparison and reporting become far more practical.",
    },
    {
      question: "Is this useful only for final exams?",
      answer:
        "No. The same connected approach is useful for term exams, assessments, internal evaluations, and any structured result process an institution runs.",
    },
    {
      question: "How does Nexus reduce exam-season spreadsheet chaos?",
      answer:
        "By keeping scheduling, student context, subject context, and result entry more tightly connected. That reduces the number of disconnected files institutions have to reconcile before sharing results.",
    },
  ],
};
