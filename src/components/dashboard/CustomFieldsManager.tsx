"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { Alert, Chip } from "@mui/material";
import ResourceSection from "@/components/dashboard/ResourceSection";
import CustomFieldOptionsEditor from "@/components/dashboard/CustomFieldOptionsEditor";
import CustomFieldVisibilityEditor from "@/components/dashboard/CustomFieldVisibilityEditor";
import CustomFieldValidationEditor from "@/components/dashboard/CustomFieldValidationEditor";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { customFieldsService, type CustomFieldEntityDefinition } from "@/services/customFields.service";

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
  validation?: unknown;
  visibilityRules?: unknown;
}

interface CustomFieldsManagerProps {
  /** When set (superadmin context), definitions are scoped to this institution. */
  institutionId?: string;
}

const INPUT_TYPES = [
  "TEXT", "TEXTAREA", "NUMBER", "EMAIL", "PHONE", "DATE", "DATETIME",
  "SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO", "BOOLEAN", "FILE", "IMAGE", "URL",
];

/** Manages definitions using the backend's supported entity catalog. */
export default function CustomFieldsManager({ institutionId }: CustomFieldsManagerProps) {
  const { showMessage } = useMessage();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<CustomFieldEntityDefinition[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const [{ data, success }, catalog] = await Promise.all([apiHandler<Definition[]>(
      () => customFieldsService.getDefinitions(institutionId ? { institutionId } : undefined),
      { showMessage, silent: true }
    ), apiHandler<CustomFieldEntityDefinition[]>(() => customFieldsService.getEntities(), { showMessage, silent: true })]);
    setDefinitions(Array.isArray(data) ? data : []);
    setEntities(catalog.data ?? []);
    setLoadError(!success || !catalog.success);
    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  /** Derives the module so users cannot create invisible cross-module definitions. */
  const definitionPayload = (payload: Record<string, unknown>): Record<string, unknown> => {
    const entityType = String(payload.entityType ?? "").toLowerCase();
    const entity = entities.find((candidate) => candidate.entityType === entityType);
    if (!entity) throw new Error("Select a supported entity type.");
    return { ...payload, entityType, moduleKey: entity.moduleKey };
  };

  return (
    <>
    {loadError && <Alert severity="error">Custom field definitions could not be loaded. Reload this page to retry.</Alert>}
    <ResourceSection
      title="Field Definitions"
      subtitle="Define additional information to collect for each record type."
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
        { key: "entityType", label: "Entity Type", type: "select", options: entities.map((entity) => ({ value: entity.entityType, label: entity.entityType.replaceAll("_", " ") })), required: true, cols: 6, createOnly: true },
        { key: "inputType", label: "Input Type", type: "select", options: INPUT_TYPES.map((t) => ({ value: t, label: t })), required: true, cols: 6 },
        { key: "options", label: "Choices", type: "json", renderInput: (value, onChange, disabled) => <CustomFieldOptionsEditor value={value} onChange={onChange} disabled={disabled} /> },
        { key: "sortOrder", label: "Sort Order", type: "number", cols: 6 },
        { key: "placeholder", label: "Placeholder", cols: 6 },
        { key: "helpText", label: "Help Text", cols: 6 },
        { key: "isRequired", label: "Required", type: "boolean", cols: 6 },
        { key: "isActive", label: "Active", type: "boolean", cols: 6 },
        { key: "visibilityRules", label: "Visibility", type: "json", renderInput: (value, onChange, disabled) => <CustomFieldVisibilityEditor value={value} onChange={onChange} disabled={disabled} /> },
        { key: "validation", label: "File / image rules", type: "json", renderInput: (value, onChange, disabled) => <CustomFieldValidationEditor value={value} onChange={onChange} disabled={disabled} /> },
      ]}
      onCreate={async (payload) => {
        const { success } = await apiHandler(
          () => customFieldsService.createDefinition({ ...definitionPayload(payload), ...(institutionId && { institutionId }) }),
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
    </>
  );
}
