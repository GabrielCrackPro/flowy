"use client";

import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import type { z } from "zod";

export type FormErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  schema?: z.ZodTypeAny;
  onSubmit?: (values: T) => unknown | Promise<unknown>;
}

export interface UseFormResult<T extends Record<string, unknown>> {
  values: T;
  errors: FormErrors<T>;
  status: string | null;
  setStatus: Dispatch<SetStateAction<string | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  handleChange: <K extends keyof T>(
    field: K,
  ) => (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  /** Para controles estilo Base UI que devuelven el valor directamente en vez de un evento, p. ej. onValueChange de Select, onCheckedChange de Switch. */
  handleValueChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  validate: () =>
    | { success: true; data: T }
    | { success: false; errors: FormErrors<T> };
  reset: () => void;
}

function formatZodErrors<T extends Record<string, unknown>>(
  error: z.ZodError<T>,
): FormErrors<T> {
  return error.issues.reduce<FormErrors<T>>((acc, issue) => {
    const field = issue.path[0];

    if (typeof field === "string" || typeof field === "number") {
      acc[field as keyof T] = issue.message;
    }

    return acc;
  }, {});
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((currentValues) => ({ ...currentValues, [field]: value }));
      setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    },
    [],
  );

  const handleChange = useCallback(
    <K extends keyof T>(field: K) =>
      (
        event: ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        const nextValue =
          event.target instanceof HTMLInputElement &&
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value;

        setFieldValue(field, nextValue as T[K]);
      },
    [setFieldValue],
  );

  const handleValueChange = useCallback(
    <K extends keyof T>(field: K) =>
      (value: T[K]) => {
        setFieldValue(field, value);
      },
    [setFieldValue],
  );

  const validate = useCallback(() => {
    if (!schema) {
      return { success: true as const, data: values };
    }

    const result = schema.safeParse(values);

    if (!result.success) {
      const validationErrors = formatZodErrors(result.error as z.ZodError<T>);
      setErrors(validationErrors);
      return { success: false as const, errors: validationErrors };
    }

    setErrors({});
    return { success: true as const, data: result.data as T };
  }, [schema, values]);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setError(null);
      setStatus(null);
      setErrors({});

      const validation = validate();

      if (!validation.success) {
        return;
      }

      setBusy(true);

      try {
        await onSubmit?.(validation.data);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Ocurrió un error inesperado";
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [onSubmit, validate],
  );

  const reset = useCallback(() => {
    setValues({ ...initialValues });
    setErrors({});
    setStatus(null);
    setError(null);
    setBusy(false);
  }, [initialValues]);

  return {
    values,
    errors,
    status,
    setStatus,
    error,
    setError,
    busy,
    setBusy,
    setFieldValue,
    handleChange,
    handleValueChange,
    handleSubmit,
    validate,
    reset,
  } as UseFormResult<T>;
}
