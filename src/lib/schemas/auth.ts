import { z } from "zod";
import { CURRENCIES, LOCALES } from "@/lib/preferences";

type Translate = (key: string) => string;

export function createLoginSchema(t: Translate) {
  return z.object({
    email: z
      .email(t("validation.emailInvalid"))
      .nonempty(t("validation.emailRequired")),
    password: z.string(),
  });
}

export function createRegisterSchema(t: Translate) {
  return z
    .object({
      fullName: z.string().nonempty(t("validation.fullNameRequired")),
      email: z
        .email(t("validation.emailInvalid"))
        .nonempty(t("validation.emailRequired")),
      password: z.string().min(8, t("validation.passwordMinLength")),
      confirmPassword: z
        .string()
        .nonempty(t("validation.confirmPasswordRequired")),
      locale: z.enum(LOCALES, { message: t("validation.localeRequired") }),
      currency: z.enum(CURRENCIES, {
        message: t("validation.currencyRequired"),
      }),
      acceptedTerms: z.boolean().refine((value) => value, {
        message: t("validation.acceptTermsRequired"),
      }),
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.confirmPassword) {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: "custom",
          message: t("validation.passwordsMustMatch"),
        });
      }
    });
}

export function createChangePasswordSchema(t: Translate) {
  return z
    .object({
      currentPassword: z
        .string()
        .nonempty(t("validation.currentPasswordRequired")),
      newPassword: z.string().min(8, t("validation.passwordMinLength")),
      confirmPassword: z
        .string()
        .nonempty(t("validation.confirmPasswordRequired")),
    })
    .superRefine((values, ctx) => {
      if (values.newPassword !== values.confirmPassword) {
        ctx.addIssue({
          path: ["confirmPassword"],
          code: "custom",
          message: t("validation.passwordsMustMatch"),
        });
      }
    });
}
