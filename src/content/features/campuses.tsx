import { Verified } from "@mui/icons-material";
import { FeatureModule } from "./types";

export const campusesFeature: FeatureModule = {
  slug: "campuses",
  title: "Multi-Campus",
  icon: <Verified sx={{ fontSize: 40 }} />,
  summary:
    "Run multiple campuses from one platform without sacrificing local control, security, or reporting clarity.",
  seoDescription:
    "Nexus Multi-Campus support helps institutions manage multiple campuses with scoped access, independent timing rules, campus-level configuration, data isolation, and central oversight from one ERP.",
  heroIntro: [
    "Many education systems say they support multiple campuses, but what they really offer is one big shared workspace with weak separation. Nexus is designed differently. Multi-campus support is a core operational model, not a late add-on.",
    "That means campus users can work inside the boundaries they should have, while institution-level administrators still get central oversight. This balance is critical for school systems, college groups, and expanding education brands.",
    "For growing institutions, the challenge is not only adding another branch. It is preserving discipline, access control, and reporting clarity as the organisation expands. Nexus treats campuses as real operating units so scale does not automatically create administrative confusion.",
  ],
  highlights: [
    "Multiple campuses managed from one institutional platform",
    "Campus-specific timing rules and threshold configuration",
    "User-to-campus assignments with scoped access",
    "Central oversight for institution-level admins",
    "Soft-delete and recycle-bin support for safer operational changes",
    "Cleaner groundwork for cross-campus reporting and comparison",
  ],
  audience: ["School groups", "College networks", "Institution owners", "Regional administrators"],
  operationalWins: [
    "Prevent users from seeing or changing the wrong campus data",
    "Allow each campus to keep its own operational settings",
    "Reduce duplicate system management across branches",
    "Support growth without forcing a separate app per location",
  ],
  aiAssist: {
    title: "AI-assisted multi-campus oversight",
    body:
      "Multi-campus operations are exactly where AI-powered assistance becomes useful. Nexus Campuses creates the structure needed for smarter visibility across branches, helping institutions move toward AI-assisted oversight that can highlight operational differences, policy drift, and cross-campus questions without losing local context.",
  },
  sections: [
    {
      heading: "Campus setup that affects real operations",
      body:
        "Campuses are not cosmetic labels in Nexus. They carry operational meaning through student hours, staff hours, late thresholds, and related policy behavior. That makes the campus model useful immediately instead of merely descriptive.",
      paragraphs: [
        "A branch or campus usually has its own rhythm. Start times, dismissal windows, staffing realities, and local policy expectations often differ more than leadership expects. If the software ignores that, campus teams end up maintaining side rules outside the system.",
        "Nexus keeps those differences inside the platform, where they can be applied consistently. That gives each campus room to operate realistically without breaking the institution-wide model.",
      ],
      bullets: [
        "Store operating hours for students and staff per campus",
        "Configure local thresholds for lateness and early departure",
        "Use those settings in attendance and policy-driven workflows",
      ],
    },
    {
      heading: "Scoped access that mirrors institutional roles",
      body:
        "A teacher or accountant at one campus should not accidentally be working in another branch's data. Nexus uses campus assignments and role-based access so users see what they need without exposing unrelated records across the institution.",
      paragraphs: [
        "This is one of the most important differences between true multi-campus software and a shared workspace that only pretends to be separated. Access boundaries are not just about security. They are also about reducing noise and preventing daily operational mistakes.",
        "When users stay inside the right campus scope, support becomes simpler, accountability becomes clearer, and the institution can scale with less risk of cross-campus data confusion.",
      ],
      bullets: [
        "Assign users to one or more campuses",
        "Restrict access based on role and assigned scope",
        "Support cleaner data ownership and safer daily operations",
      ],
    },
    {
      heading: "Central administration without operational chaos",
      body:
        "Institution-level leaders still need a unified view, especially when they are planning resources, checking performance, or investigating issues. Nexus gives them that central oversight without flattening all campuses into one uncontrolled workspace.",
      paragraphs: [
        "Leadership needs visibility across the network, but campuses still need enough local structure to run responsibly. Too much centralisation creates friction; too little creates fragmentation. Nexus is designed around that balance.",
        "This makes it easier for owners, directors, and regional administrators to compare performance, review policy application, and support branch teams without undermining local operational control.",
      ],
      bullets: [
        "View and manage multiple campuses from one platform",
        "Support institution-wide reporting and oversight",
        "Balance central governance with local operational autonomy",
      ],
    },
    {
      heading: "Safer change management for campus records",
      body:
        "Campuses are long-lived entities, and mistakes or restructuring can happen. With soft-delete and recycle-bin support in the platform, administration teams can make changes more safely instead of treating every campus record change as irreversible.",
      paragraphs: [
        "In real operations, campuses may be renamed, merged, paused, or corrected after setup. Those changes should not feel dangerous. If every structural edit is permanent, administrators become hesitant and cleanup quality suffers.",
        "Nexus gives teams a safer way to manage those records. That improves confidence during restructuring and reduces the risk of accidental operational damage.",
      ],
      bullets: [
        "Use soft deletion instead of immediate data destruction",
        "Restore records when change decisions need to be reversed",
        "Keep the administrative model safer for real-world operations",
      ],
    },
    {
      heading: "A growth model for expanding institutions",
      body:
        "The biggest strength of the Multi-Campus model is that it supports expansion without forcing institutions to reinvent operations branch by branch.",
      paragraphs: [
        "When a school group opens new campuses, the real question is whether the system can scale governance, structure, and reporting without becoming harder to control. Nexus is built to answer that challenge directly.",
        "It gives growing institutions one platform they can keep standardising on while still preserving the realities of local execution.",
      ],
      bullets: [
        "Support branch growth without multiplying software silos",
        "Keep oversight cleaner as the institution expands",
        "Build stronger cross-campus reporting and control over time",
      ],
    },
  ],
  workflow: [
    {
      title: "Create and configure each campus",
      body:
        "Set the timing, thresholds, and location-specific operating context for each branch so policy starts from the right local reality.",
    },
    {
      title: "Assign the right people to the right places",
      body:
        "Users are scoped by role and campus responsibility so they work inside legitimate operational boundaries only.",
    },
    {
      title: "Operate locally while managing centrally",
      body:
        "Campuses handle day-to-day work in their own context while institution-level leaders keep a unified oversight layer.",
    },
    {
      title: "Scale without losing control",
      body:
        "As the organisation grows, the same campus model keeps governance, visibility, and reporting cleaner across branches.",
    },
  ],
  faqs: [
    {
      question: "Can Nexus support multiple campuses under one institution account?",
      answer:
        "Yes. Multi-campus management is one of the product's core structural capabilities, not a thin add-on.",
    },
    {
      question: "Can each campus have different hours and attendance thresholds?",
      answer:
        "Yes. Campus-specific timings and thresholds are part of the operating model and feed attendance behavior directly.",
    },
    {
      question: "How does Nexus stop cross-campus data leakage?",
      answer:
        "Campus assignments and role-based controls work together so users only access the campuses they are meant to manage or serve.",
    },
    {
      question: "Why is multi-campus support more than a branch list?",
      answer:
        "Because real multi-campus operations need scoped access, local policy settings, safer record handling, and central reporting. A branch label alone does not solve those problems.",
    },
  ],
};
