import apiClient from "@/lib/axios";

export interface CustomFieldEntityDefinition {
  entityType: string;
  moduleKey: string;
}

export interface CustomFieldDefinition {
  id: string;
  fieldKey: string;
  label: string;
  inputType: "TEXT" | "TEXTAREA" | "NUMBER" | "EMAIL" | "PHONE" | "DATE" | "DATETIME" | "SELECT" | "MULTI_SELECT" | "CHECKBOX" | "RADIO" | "BOOLEAN" | "FILE" | "IMAGE" | "URL";
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  validation?: Record<string, unknown>;
}

export const customFieldsService = {
  /** Loads the entity/module combinations implemented by the backend. */
  getEntities: () => apiClient.get<{ data: CustomFieldEntityDefinition[] }>("/custom-fields/entities"),
  /** Loads active definitions under the record's own action permission. */
  getFormDefinitions: (params: { entityType: string; institutionId?: string; action: "create" | "read" | "update" }) =>
    apiClient.get<{ data: CustomFieldDefinition[] }>("/custom-fields/form-definitions", { params }),
  createDefinition: (payload: Record<string, unknown>) =>
    apiClient.post("/custom-fields/definitions", payload),
  getDefinitions: (params?: Record<string, unknown>) =>
    apiClient.get("/custom-fields/definitions", { params }),
  updateDefinition: (definitionId: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/custom-fields/definitions/${definitionId}`, payload),

  upsertValue: (payload: Record<string, unknown>) =>
    apiClient.post("/custom-fields/values", payload),
  getValues: (params?: Record<string, unknown>) =>
    apiClient.get("/custom-fields/values", { params }),
};
