import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { getErrorMessage, getFieldErrors, isApiError } from "@/lib/api-error";

export const applyServerErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  codeFields: Partial<Record<string, FieldPath<T>>> = {},
): boolean => {
  const fieldErrors = Object.entries(getFieldErrors(error));

  for (const [path, message] of fieldErrors) {
    setError(path as FieldPath<T>, { message });
  }

  for (const [code, field] of Object.entries(codeFields)) {
    if (field && isApiError(error, code)) {
      setError(field, { message: getErrorMessage(error) });
      return true;
    }
  }

  if (fieldErrors.length > 0) {
    return true;
  }

  setError("root.server" as FieldPath<T>, { message: getErrorMessage(error) });

  return false;
};
