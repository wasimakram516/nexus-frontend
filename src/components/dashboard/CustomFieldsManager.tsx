"use client";

import { useCallback, useEffect, useState } from "react";
import { Chip } from "@mui/material";
import ResourceSection from "@/components/dashboard/ResourceSection";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { customFieldsService } from "@/services/customFields.service";

interface Definition {
  id: string;
  moduleKey: string;
  entityType: string;
  fieldKey: string;
  label: string;
  inputType: string;
  placeholder?: string;
  helpText?: string;
  isRequired?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

interface CustomFieldsManagerProps {
  /** When set (superadmin context), definitions are scoped to this institution. */
  institutionId?: string;
}

const MODULE_KEYS = ["PEOPLE", "ACADEMICS", "ATTENDANCE", "FINANCE", "EXAMINATIONS", "REPORTING", "DOCUMENTS"];
const ENTITY_TYPES = ["STUDENT", "TEACHER", "GUARDIAN", "CAMPUS", "LEVEL", "CLASS", "SECTION", "SUBJECT"];
const INPUT_TYPES = [
  "TEXT", "TEXTAREA", "NUMBER", "EMAIL", "PHONE", "DATE", "DATETIME",
  "SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO", "BOOLEAN", "FILE", "IMAGE", "URL",
];

export default function CustomFieldsManager({ institutionId }: CustomFieldsManagerProps) {
  const { showMessage } = useMessage();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await apiHandler<Definition[]>(
      () => customFieldsService.getDefinitions(institutionId ? { institutionId } : undefined),
      { showMessage, silent: true }
    );
    setDefinitions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ResourceSection
      title="Field Definitions"
      subtitle="Custom fields appear on the matching entity's forms and records."
      createLabel="Add Field"
      rows={definitions}
      loading={loading}
      columns={[
        { key: "label", label: "Label" },
        { key: "fieldKey", label: "Key" },
        { key: "moduleKey", label: "Module", render: (r) => <Chip label={r.moduleKey} size="small" /> },
        { key: "entityType", label: "Entity" },
        { key: "inputType", label: "Input Type" },
        { key: "isRequired", label: "Required", render: (r) => (r.isRequired ? "Yes" : "No") },
        {
          key: "isActive",
          label: "Status",
          render: (r) => (
            <Chip
              label={r.isActive === false ? "INACTIVE" : "ACTIVE"}
              size="small"
              color={r.isActive === false ? "default" : "success"}
            />
          ),
        },
      ]}
      fields={[
        { key: "label", label: "Field Label", required: true, cols: 6 },
        { key: "fieldKey", label: "Field Key", required: true, cols: 6, helperText: "Unique key, e.g. blood_group" },
        { key: "moduleKey", label: "Module", type: "select", options: MODULE_KEYS.map((m) => ({ value: m, label: m })), required: true, cols: 6 },
        { key: "entityType", label: "Entity Type", type: "select", options: ENTITY_TYPES.map((e) => ({ value: e, label: e })), required: true, cols: 6 },
        { key: "inputType", label: "Input Type", type: "select", options: INPUT_TYPES.map((t) => ({ value: t, label: t })), required: true, cols: 6 },
        { key: "sortOrder", label: "Sort Order", type: "number", cols: 6 },
        { key: "placeholder", label: "Placeholder", cols: 6 },
        { key: "helpText", label: "Help Text", cols: 6 },
        { key: "isRequired", label: "Required", type: "boolean", cols: 6 },
        { key: "isActive", label: "Active", type: "boolean", cols: 6 },
      ]}
      onCreate={async (payload) => {
        const { success } = await apiHandler(
          () => customFieldsService.createDefinition({ ...payload, ...(institutionId && { institutionId }) }),
          { showMessage, successMessage: "Field definition created." }
        );
        if (success) load();
        return success;
      }}
      onUpdate={async (id, payload) => {
        const { success } = await apiHandler(
          () => customFieldsService.updateDefinition(id, payload),
          { showMessage, successMessage: "Field definition updated." }
        );
        if (success) load();
        return success;
      }}
    />
  );
}
