type Translate = (key: string) => string;

export function translateAuthError(error: unknown, t: Translate) {
  const candidate = error as { code?: string; message?: string } | null;
  const code = candidate?.code?.toLowerCase() ?? "";
  const message = candidate?.message?.toLowerCase() ?? "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return t("errors.invalidCredentials");
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return t("errors.emailNotConfirmed");
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  ) {
    return t("errors.rateLimited");
  }

  if (
    code === "provider_disabled" ||
    message.includes("provider is not enabled") ||
    message.includes("provider is disabled")
  ) {
    return t("errors.providerDisabled");
  }

  if (
    code === "user_already_exists" ||
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return t("errors.userAlreadyRegistered");
  }

  return t("errors.generic");
}

export function translateMfaError(error: unknown, t: Translate) {
  const candidate = error as { code?: string; message?: string } | null;
  const code = candidate?.code?.toLowerCase() ?? "";
  const message = candidate?.message?.toLowerCase() ?? "";

  if (
    code === "mfa_factor_name_conflict" ||
    message.includes("friendly name")
  ) {
    return t("settings.security.mfaErrors.factorNameConflict");
  }

  if (
    code === "over_request_rate_limit" ||
    code === "mfa_rate_limit_exceeded" ||
    message.includes("rate limit") ||
    message.includes("too many attempts") ||
    message.includes("too many requests")
  ) {
    return t("settings.security.mfaErrors.tooManyAttempts");
  }

  if (
    code === "mfa_challenge_expired" ||
    message.includes("challenge has expired") ||
    message.includes("challenge expired") ||
    (message.includes("expired") && message.includes("challenge"))
  ) {
    return t("settings.security.mfaErrors.challengeExpired");
  }

  if (
    code === "mfa_verification_failed" ||
    code === "mfa_verification_code_invalid" ||
    message.includes("invalid otp") ||
    message.includes("invalid totp") ||
    message.includes("invalid verification code") ||
    (message.includes("invalid") && message.includes("code"))
  ) {
    return t("settings.security.mfaErrors.invalidCode");
  }

  if (
    code === "bad_jwt" ||
    code === "session_not_found" ||
    message.includes("refresh your session") ||
    message.includes("refresh the session") ||
    message.includes("jwt") ||
    message.includes("session is missing")
  ) {
    return t("settings.security.mfaErrors.sessionRefresh");
  }

  return t("settings.security.mfaError");
}
