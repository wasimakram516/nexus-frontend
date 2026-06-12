"use client";

import StepPermissions from "@/components/platform/wizard/StepPermissions";

interface Props {
  institutionId: string;
}

/**
 * Full permission-template CRUD for an institution. Templates define base
 * module permissions (view/manage) and are assigned to staff users from the
 * Users screen, where per-user overrides can also be layered on top.
 */
export default function InstitutionPermissionsTab({ institutionId }: Props) {
  return <StepPermissions institutionId={institutionId} />;
}
