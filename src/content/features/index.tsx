import { academicsFeature } from "./academics";
import { attendanceFeature } from "./attendance";
import { campusesFeature } from "./campuses";
import { customFieldsFeature } from "./custom-fields";
import { examinationsFeature } from "./examinations";
import { financeFeature } from "./finance";
import { peopleFeature } from "./people";
import { reportingFeature } from "./reporting";

export const featureModules = [
  academicsFeature,
  peopleFeature,
  attendanceFeature,
  financeFeature,
  examinationsFeature,
  reportingFeature,
  campusesFeature,
  customFieldsFeature,
];

export const featureModuleMap = new Map(
  featureModules.map((module) => [module.slug, module] as const),
);

export type { FeatureModule } from "./types";
