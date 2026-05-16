import { Tune } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const customFieldsFeature: FeatureModule = {
  slug: "custom-fields",
  title: "Custom Fields",
  icon: <Tune sx={{ fontSize: 40 }} />,
  summary:
    "Adapt Nexus to the way your institution works without waiting for a developer to hard-code every extra field.",
  seoDescription:
    "Nexus Custom Fields let institutions extend students, teachers, guardians, contacts, and other entities with configurable fields, input types, and private institution-scoped data without code changes.",
  heroIntro: [
    "No two institutions collect exactly the same data. One school wants transport points, another wants scholarship references, another wants boarding details, hostel grouping, or local compliance attributes. Hard-coded software struggles here. Nexus handles this with a proper custom-field system.",
    "The goal is simple: let institutions extend their records without turning every small requirement into a developer task. That keeps the platform more adaptable while preserving a cleaner product core.",
    "This matters not only during implementation, but throughout the life of the institution. Policies change, forms evolve, and new reporting needs appear. A system that cannot absorb those small changes becomes expensive very quickly. Nexus is built to stay practical as institutions grow and change.",
  ],
  highlights: [
    "Institution-scoped field definitions for specific entities",
    "Multiple supported input types for operational flexibility",
    "Values stored per record and available where the entity is used",
    "No need to wait on code changes for every small data variation",
    "Works as an extension layer across people and related modules",
    "Supports cleaner long-term adaptability for different institutions",
  ],
  audience: ["Implementation teams", "Institution admins", "Operations managers", "Product owners"],
  operationalWins: [
    "Reduce developer dependency for small schema needs",
    "Adapt the platform to different institution policies faster",
    "Keep data collection closer to the point of actual use",
    "Avoid bloating every standard profile with fields not everyone needs",
  ],
  aiAssist: {
    title: "AI-ready data structure for institution-specific workflows",
    body:
      "AI-powered assistance depends on data shape as much as interface design. Custom Fields helps Nexus stay AI-ready by letting institutions capture important local context without pushing it into disconnected files. That gives future AI-assisted workflows better context to work with while keeping the ERP flexible.",
  },
  sections: [
    {
      heading: "Field definitions built around entities, not guesswork",
      body:
        "Custom fields in Nexus are scoped to the module and entity where they actually matter. That means institutions can extend the right record type without polluting the whole system or forcing everyone into one oversized generic form.",
      paragraphs: [
        "A common weakness in flexible systems is that they become too generic to stay usable. Nexus takes a more practical route. Customisation is tied to the real record where the institution needs it, whether that is a student, teacher, guardian, contact, or another supported entity.",
        "That keeps implementation cleaner and makes the extra data more meaningful. Users see the field where it belongs instead of trying to remember which external sheet or side process holds the missing information.",
      ],
      bullets: [
        "Define fields for the entity that needs them",
        "Keep custom requirements separate from the standard product core",
        "Support cleaner implementation for varied institutions",
      ],
    },
    {
      heading: "Flexible input types for real operational data",
      body:
        "Institutions do not only need extra text boxes. They often need controlled choices, dates, phone fields, files, links, or toggles. Nexus supports a broad range of input types so custom data can still be captured in a structured way.",
      paragraphs: [
        "This is important because flexibility without structure often creates new problems. If every extra requirement becomes a free-text note, the institution gains a place to type but loses the ability to use the data reliably later.",
        "By supporting multiple field types, Nexus keeps customisation closer to real operational quality. Institutions can extend forms while still encouraging cleaner input and more usable records.",
      ],
      bullets: [
        "Use text, numbers, dates, selections, booleans, files, images, and more",
        "Match data collection to the kind of information being stored",
        "Reduce messy workarounds caused by one-size-fits-all fields",
      ],
    },
    {
      heading: "Configuration without losing privacy boundaries",
      body:
        "Custom field data is scoped to the institution, which is important in a shared platform model. One institution's extensions should not leak into another's forms or data, and Nexus keeps those boundaries explicit.",
      paragraphs: [
        "In a multi-tenant product, flexibility should never come at the cost of privacy or form pollution. Each institution needs the freedom to collect what matters to it without affecting the experience of others.",
        "Nexus preserves that boundary so implementations stay relevant and clean. Institutions get adaptability without turning the shared product into a confusing global form builder.",
      ],
      bullets: [
        "Keep custom definitions private to the institution that created them",
        "Preserve flexibility without flattening all clients into one data model",
        "Support safer multi-tenant behaviour at the product level",
      ],
    },
    {
      heading: "A practical extension layer for growth",
      body:
        "Custom fields are not only a convenience feature. They are a growth feature. They make the product easier to adopt in different institutional contexts because implementation teams can adapt forms and records without turning every deployment into a product rewrite.",
      paragraphs: [
        "This becomes especially valuable when onboarding institutions with regional, regulatory, or policy-specific requirements. Instead of rejecting those differences or pushing them into spreadsheets, Nexus gives teams a structured way to absorb them.",
        "That lowers implementation friction and keeps the core product healthier over time. The result is a system that can stay opinionated where it should and flexible where it needs to be.",
      ],
      bullets: [
        "Speed up onboarding for institutions with special data needs",
        "Lower the pressure to modify core schema for every client request",
        "Make Nexus more implementation-friendly at scale",
      ],
    },
    {
      heading: "Customisation that stays operational, not chaotic",
      body:
        "The best customisation is the kind that stays usable after the project goes live. Nexus Custom Fields are designed to support long-term operational work, not just initial setup excitement.",
      paragraphs: [
        "That means the extra fields should still make sense in day-to-day workflows, still be visible to the right teams, and still help with reporting or follow-up where relevant. Otherwise customisation becomes clutter.",
        "Nexus aims for practical flexibility: enough adaptability to support real institutions, without losing structure, clarity, or product discipline.",
      ],
      bullets: [
        "Keep extended data closer to live workflows",
        "Avoid spreadsheet drift for institution-specific details",
        "Support cleaner operations without overcomplicating the core product",
      ],
    },
  ],
  workflow: [
    {
      title: "Define the extra field once",
      body:
        "Create the field against the right entity with the right input type and label so the requirement is captured where it actually belongs.",
    },
    {
      title: "Capture values where work already happens",
      body:
        "Users fill the field inline as part of the normal record workflow instead of switching to separate disconnected forms or spreadsheets.",
    },
    {
      title: "Reuse the extended data operationally",
      body:
        "The institution keeps its special-case data inside the same ERP record so the information remains visible, useful, and easier to trust later.",
    },
    {
      title: "Adapt without reopening product development",
      body:
        "As institutional needs evolve, administrators can extend supported entities without turning every small change into a development request.",
    },
  ],
  faqs: [
    {
      question: "Why are custom fields important in an education ERP?",
      answer:
        "Because institutions vary widely in the extra information they collect, and a platform becomes much more practical when those needs can be handled without code changes.",
    },
    {
      question: "Are custom fields shared across all institutions in Nexus?",
      answer:
        "No. They are institution-scoped, which helps preserve privacy and keeps each institution's setup relevant only to its own use case.",
    },
    {
      question: "Do custom fields replace the normal core fields?",
      answer:
        "No. They extend the standard model where needed, which keeps the core product cleaner while still allowing flexibility.",
    },
    {
      question: "Can custom fields reduce spreadsheet dependency?",
      answer:
        "Yes. One of their biggest advantages is that institution-specific data can stay inside the ERP record itself instead of being tracked in side files that drift out of date.",
    },
  ],
};
