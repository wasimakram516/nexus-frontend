import type { Metadata } from "next";
import Link from "next/link";
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import {
  AccountBalance,
  ArrowForward,
  CheckCircle,
  Groups,
  SchoolOutlined,
  Tune,
  Today,
  Verified,
} from "@mui/icons-material";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

export const metadata: Metadata = {
  title: "Features — Nexus Education ERP",
  description:
    "Explore Nexus features: academic management, attendance tracking, finance, people management, multi-campus support, and custom fields.",
};

export const modules = [
  {
    slug: "academics",
    icon: <SchoolOutlined sx={{ fontSize: 40 }} />,
    title: "Academics",
    summary: "Build and manage your full academic structure — from institution-wide levels down to individual subjects and sections.",
    highlights: [
      "Academic levels (Primary, Secondary, University etc.)",
      "Classes linked to levels with full metadata",
      "Sections within each class for group management",
      "Subject catalog per class with code and description",
      "Teacher-to-subject assignments per class",
      "Student promotion history and academic progression",
    ],
    details: [
      {
        heading: "Levels & Classes",
        body: "Define your institution's academic hierarchy — create levels such as Primary, Middle, Secondary, or University, then nest classes under each level. Every class carries its own metadata and links directly to sections and subjects.",
      },
      {
        heading: "Sections",
        body: "Split classes into sections (A, B, C or custom names) to manage student groupings. Students are assigned to a specific section, and attendance, fees, and reports are all section-aware.",
      },
      {
        heading: "Subjects",
        body: "Build a subject catalog per class — each subject has a name, code, and description. Subjects are linked to teachers and used across attendance, grading, and reporting modules.",
      },
      {
        heading: "Teacher-Subject Assignment",
        body: "Assign one or more teachers to a subject within a specific class. This drives teacher dashboards, timetables, and subject-level reporting.",
      },
      {
        heading: "Student Promotion",
        body: "Record academic promotions as students move between classes or levels. A full promotion history is maintained per student, enabling year-on-year tracking.",
      },
    ],
  },
  {
    slug: "people",
    icon: <Groups sx={{ fontSize: 40 }} />,
    title: "People",
    summary: "Centralised profiles for every person in your institution — students, teachers, and guardians — with full relationship and contact management.",
    highlights: [
      "Student profiles with registration numbers, DOB, CNIC, and admission date",
      "Section assignment per student",
      "Guardian profiles with FATHER, MOTHER, UNCLE, AUNT, or OTHER relation types",
      "Many-to-many student–guardian linking",
      "Teacher profiles with gender, CNIC, and joining details",
      "Subject assignments per teacher",
      "Unified contact records (phone, address) for all people",
    ],
    details: [
      {
        heading: "Students",
        body: "Each student has a unique registration number, date of birth, CNIC, admission date, and is assigned to a campus and section. Students carry a complete academic and financial history.",
      },
      {
        heading: "Guardians",
        body: "Create guardian profiles and link them to one or more students with a relationship type (Father, Mother, Uncle, Aunt, Other). Guardians can receive fee notifications and have their own contact records.",
      },
      {
        heading: "Teachers",
        body: "Teacher profiles include personal details, gender, CNIC, and employment dates. Teachers are assigned to subjects within classes and their attendance, salary, and performance are tracked across the platform.",
      },
      {
        heading: "Contacts",
        body: "A shared contact system stores phone numbers and addresses for students, guardians, and teachers. Multiple contact records per person are supported.",
      },
    ],
  },
  {
    slug: "attendance",
    icon: <Today sx={{ fontSize: 40 }} />,
    title: "Attendance",
    summary: "Accurate, real-time attendance tracking for students and staff with automated absent marking, leave management, and summary reporting.",
    highlights: [
      "Check-in and check-out time recording",
      "PRESENT, ABSENT, LATE, and LEAVE statuses",
      "Half-day tracking flag",
      "Manual leave marking with reason",
      "Auto-absent marking for non-arrivals",
      "Campus-level attendance summaries",
      "Per-student and per-teacher attendance history",
    ],
    details: [
      {
        heading: "Check-In & Check-Out",
        body: "Record the exact check-in and check-out times for students and staff. Campus operating hours and late thresholds are configurable per campus — the system automatically determines PRESENT, LATE, or ABSENT status based on arrival time.",
      },
      {
        heading: "Leave Management",
        body: "Mark a student or staff member on leave with a reason. Leaves are factored into salary deduction calculations for staff and fee fine calculations for students.",
      },
      {
        heading: "Auto-Absent Marking",
        body: "Run the auto-absent job at end of day to automatically mark anyone who did not check in as ABSENT. This keeps records clean without manual intervention.",
      },
      {
        heading: "Summaries & Reporting",
        body: "Pull attendance summaries filtered by campus, class, section, date range, or individual. Summary data feeds directly into finance calculations for deductions and fines.",
      },
    ],
  },
  {
    slug: "finance",
    icon: <AccountBalance sx={{ fontSize: 40 }} />,
    title: "Finance",
    summary: "A complete financial engine covering student fee collection, staff payroll, deductions, fines, discounts, and bank account management.",
    highlights: [
      "Fee structures per class with JSON-defined breakdown",
      "Monthly fee voucher generation per student",
      "Fee payments via cash or bank transfer",
      "Student discounts: Sibling, Merit, Need-Based, Staff Child",
      "Student fine rules and monthly fine generation",
      "Staff salary records with base amount and effective date",
      "Salary deduction rules for absences, lates, half-days, and leaves",
      "One-time salary adjustments (bonus or deduction)",
      "Monthly salary payments with calculated net amount",
      "Campus bank account management",
    ],
    details: [
      {
        heading: "Fee Structures & Vouchers",
        body: "Define fee structures per class with a detailed JSON breakdown (tuition, transport, lab etc.). Monthly fee vouchers are generated per student based on their class fee structure. Voucher statuses are PENDING, PAID, or OVERDUE.",
      },
      {
        heading: "Discounts",
        body: "Apply student-level discounts by type — Sibling, Merit, Need-Based, or Staff Child. Discounts are factored into voucher calculations automatically.",
      },
      {
        heading: "Fines",
        body: "Define fine rules per campus and class for absences, late arrivals, half-days, and leaves. Monthly fines are generated per student and tracked separately with PENDING or PAID status.",
      },
      {
        heading: "Staff Payroll",
        body: "Store base salary records per staff member with joining date and effective date. Define deduction rules by campus and role — the system calculates net pay after applying absence, late, and leave deductions. One-time bonuses or deductions can be added as salary adjustments.",
      },
      {
        heading: "Bank Accounts",
        body: "Manage campus bank accounts for salary transfers and fee collection. Each campus can have multiple bank accounts on record.",
      },
    ],
  },
  {
    slug: "campuses",
    icon: <Verified sx={{ fontSize: 40 }} />,
    title: "Multi-Campus",
    summary: "Run unlimited campuses from one platform with full data isolation, per-campus user access, and centralised oversight.",
    highlights: [
      "Unlimited campus locations per institution",
      "Per-campus operating hours (student & staff start/end times)",
      "Late arrival and early departure thresholds per campus",
      "User-to-campus assignments with role scoping",
      "Campus-scoped data access — users only see their campus",
      "Centralised admin view across all campuses",
      "Soft-delete and restore campuses without data loss",
    ],
    details: [
      {
        heading: "Campus Configuration",
        body: "Each campus has its own operating hours for students and staff, configurable late thresholds, and contact details. This drives attendance logic, deduction rules, and fine calculations independently per campus.",
      },
      {
        heading: "User Assignment",
        body: "Assign administrators, teachers, and accountants to specific campuses. A user's data access is automatically scoped to their assigned campuses — they cannot see or modify data from other campuses.",
      },
      {
        heading: "Centralised Admin Oversight",
        body: "Institution admins can view and manage all campuses from a single dashboard. Cross-campus reporting and comparisons are available at the admin level.",
      },
    ],
  },
  {
    slug: "custom-fields",
    icon: <Tune sx={{ fontSize: 40 }} />,
    title: "Custom Fields",
    summary: "Extend any entity in Nexus with institution-specific fields — no code changes required.",
    highlights: [
      "15+ input types: text, textarea, number, email, phone, date, datetime, select, multi-select, checkbox, radio, boolean, file, image, URL",
      "Define fields per module and entity type",
      "Fields appear inline on the relevant entity page",
      "Values stored and retrievable per entity record",
      "Institution-scoped — custom fields are private to your institution",
      "Create, update, and manage fields without developer involvement",
    ],
    details: [
      {
        heading: "Field Definitions",
        body: "Create custom field definitions scoped to a specific module (Students, Teachers, Guardians, etc.) and entity. Each definition has a label, input type, and optional configuration like select options or validation rules.",
      },
      {
        heading: "Input Types",
        body: "Nexus supports 15+ field types: Text, Textarea, Number, Email, Phone, Date, DateTime, Select (single), Multi-Select, Checkbox, Radio, Boolean toggle, File upload, Image upload, and URL. This covers virtually any institutional data requirement.",
      },
      {
        heading: "Inline Management",
        body: "Custom fields appear directly on the relevant entity page — when editing a student profile, all custom fields for students are shown alongside the standard fields. No navigation to a separate settings page required.",
      },
      {
        heading: "Data Privacy",
        body: "All custom field definitions and their values are scoped to your institution. Other institutions cannot see your fields or data.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: "left", backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[{ label: "Features" }]} />
          <Typography variant="h3" sx={{ fontWeight: 100, mb: 2 }}>
            Built for how education{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>actually works</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Every module in Nexus was designed around real institutional operations — not retrofitted generic software.
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {modules.map((mod) => (
              <Grid size={{ xs: 12, md: 6 }} key={mod.slug}>
                <Card sx={{ height: "100%", p: 1, backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", "&:hover": { borderColor: "primary.main" }, transition: "border-color 0.2s" }}>
                  <CardContent>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{mod.icon}</Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {mod.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      {mod.summary}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                      {mod.highlights.slice(0, 4).map((h) => (
                        <Box key={h} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: "success.main", flexShrink: 0 }} />
                          <Typography variant="body2">{h}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Link href={`/features/${mod.slug}`}>
                      <Button endIcon={<ArrowForward />} size="small">
                        Learn more
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
