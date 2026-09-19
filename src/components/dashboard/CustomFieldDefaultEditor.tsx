"use client";

import CustomFieldInputs from "./CustomFieldInputs";
import type { CustomFieldDefinition } from "@/services/customFields.service";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  form: Readonly<Record<string, string>>;
  onBusyChange: (busy: boolean) => void;
}

/** Uses the value control's actual type and choice contract for definition defaults. */
export default function CustomFieldDefaultEditor({ value, onChange, disabled, form, onBusyChange }: Props) {
  const definition: CustomFieldDefinition = {
    id: "definition-default", fieldKey: "defaultValue", label: "Default value", isRequired: false,
    inputType: (form.inputType || "TEXT") as CustomFieldDefinition["inputType"],
    options: form.options ? JSON.parse(form.options) : [],
  };
  return <CustomFieldInputs definitions={[definition]} values={{ defaultValue: value ? JSON.parse(value) : null }}
    disabled={disabled} onBusyChange={onBusyChange} onChange={(_, next) => onChange(JSON.stringify(next))} />;
}
