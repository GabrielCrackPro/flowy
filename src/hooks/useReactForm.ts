"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import {
  type DefaultValues,
  type Path,
  type PathValue,
  type Resolver,
  type UseFormReturn,
  useForm as useReactHookForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

export type ReactFormErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

interface UseReactFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  schema?: z.ZodTypeAny;
  onSubmit?: (values: T) => unknown | Promise<unknown>;
}

export interface UseReactFormResult<T extends Record<string, unknown>> {
  values: T;
  errors: ReactFormErrors<T>;
  status: string | null;
  setStatus: (status: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  handleChange: <K extends keyof T>(
    field: K,
  ) => (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleValueChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  validate: () => Promise<
    { success: true; data: T } | { success: false; errors: ReactFormErrors<T> }
  >;
  reset: () => void;
  form: UseFormReturn<T>;
}

export function useReactForm<T extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
}: UseReactFormOptions<T>): UseReactFormResult<T> {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useReactHookForm<T>({
    defaultValues: initialValues as unknown as DefaultValues<T>,
    resolver: schema
      ? (zodResolver(
          schema as Parameters<typeof zodResolver>[0],
        ) as unknown as Resolver<T>)
      : undefined,
    mode: "onTouched",
  });

  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      form.setValue(
        field as unknown as Path<T>,
        value as unknown as PathValue<T, Path<T>>,
      );
      form.clearErrors(field as unknown as Path<T>);
    },
    [form],
  );

  const handleChange = useCallback(
    <K extends keyof T>(field: K) =>
      (
        event: React.ChangeEvent<
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

  const validate = useCallback(async () => {
    const result = await form.trigger();
    if (result) {
      return { success: true as const, data: form.getValues() as T };
    }
    return {
      success: false as const,
      errors: form.formState.errors as ReactFormErrors<T>,
    };
  }, [form]);

  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setError(null);
      setStatus(null);

      const validation = await form.trigger();
      if (!validation) {
        return;
      }

      setBusy(true);

      try {
        const values = form.getValues() as T;
        await onSubmit?.(values);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : t("common.unexpectedError");
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [form, onSubmit, t],
  );

  const reset = useCallback(() => {
    form.reset(initialValues);
    setStatus(null);
    setError(null);
    setBusy(false);
  }, [form, initialValues]);

  const values = form.watch() as T;
  const errors = form.formState.errors as ReactFormErrors<T>;

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
    form: form as unknown as UseFormReturn<T>,
  };
}
