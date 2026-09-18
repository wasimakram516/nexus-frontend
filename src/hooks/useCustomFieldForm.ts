"use client";

import { useRef, useState } from "react";
import { customFieldsService, type CustomFieldDefinition } from "@/services/customFields.service";

/** Shares definition loading, defaults and required-value state across record forms. */
export function useCustomFieldForm(entityType?: string, institutionId?: string) {
  const requestRef = useRef(0);
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Discards stale responses and preserves saved falsy values instead of replacing them with defaults. */
  const load = async (action: "create" | "read" | "update", saved: Record<string, unknown> = {}): Promise<void> => {
    const request = ++requestRef.current;
    setDefinitions([]);
    setValues({});
    setError(null);
    setLoading(Boolean(entityType));
    if (!entityType) return;
    try {
      const response = await customFieldsService.getFormDefinitions({ entityType, institutionId, action });
      if (request !== requestRef.current) return;
      const fields = response.data.data;
      setDefinitions(fields);
      setValues(Object.fromEntries(fields.map((field) => [field.fieldKey,
        Object.hasOwn(saved, field.fieldKey) ? saved[field.fieldKey] : action === "create" ? field.defaultValue ?? null : null])));
    } catch {
      if (request === requestRef.current) setError("Additional fields could not be loaded. Close and reopen this form to retry.");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  };

  const missingRequired = definitions.some((definition) => {
    const value = values[definition.fieldKey];
    return definition.isRequired && (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length));
  });
  return { definitions, values, setValues, loading, error, load, missingRequired };
}
