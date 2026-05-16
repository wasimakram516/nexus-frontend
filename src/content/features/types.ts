import { ReactNode } from "react";

export type FeatureSection = {
  heading: string;
  body: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type FeatureWorkflowStep = {
  title: string;
  body: string;
};

export type FeatureAiAssist = {
  title: string;
  body: string;
};

export type FeatureFaq = {
  question: string;
  answer: string;
};

export type FeatureModule = {
  slug: string;
  title: string;
  icon: ReactNode;
  summary: string;
  seoDescription: string;
  heroIntro: string[];
  highlights: string[];
  audience: string[];
  operationalWins: string[];
  aiAssist?: FeatureAiAssist;
  sections: FeatureSection[];
  workflow: FeatureWorkflowStep[];
  faqs: FeatureFaq[];
};
