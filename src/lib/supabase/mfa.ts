import supabase from "./client";

const MFA_FACTOR_NAMES_KEY = "flowy_mfa_factor_names";

type MfaFactorNames = Record<string, string>;

function getFactorNames(userMetadata: Record<string, unknown> | undefined) {
  const value = userMetadata?.[MFA_FACTOR_NAMES_KEY];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([factorId, name]) =>
        typeof factorId === "string" &&
        typeof name === "string" &&
        name.trim().length > 0,
    ),
  ) as MfaFactorNames;
}

export async function listMfaFactors() {
  return supabase.auth.mfa.listFactors();
}

export async function listMfaFactorNames() {
  const { data, error } = await supabase.auth.getUser();

  return {
    data: getFactorNames(data.user?.user_metadata),
    error,
  };
}

export async function enrollTotp(friendlyName: string) {
  return supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: friendlyName.trim(),
  });
}

export async function updateMfaFactorName(
  factorId: string,
  friendlyName: string,
) {
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return { data: null, error: userError };
  }

  const names = getFactorNames(data.user.user_metadata);
  names[factorId] = friendlyName.trim();

  return supabase.auth.updateUser({
    data: {
      ...data.user.user_metadata,
      [MFA_FACTOR_NAMES_KEY]: names,
    },
  });
}

export async function removeMfaFactorName(factorId: string) {
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return { data: null, error: userError };
  }

  const names = getFactorNames(data.user.user_metadata);
  delete names[factorId];

  return supabase.auth.updateUser({
    data: {
      ...data.user.user_metadata,
      [MFA_FACTOR_NAMES_KEY]: names,
    },
  });
}

export async function challengeMfa(factorId: string) {
  return supabase.auth.mfa.challenge({ factorId });
}

export async function verifyMfa(
  factorId: string,
  challengeId: string,
  code: string,
) {
  const result = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (!result.error) {
    await supabase.auth.refreshSession();
  }

  return result;
}

export async function unenrollMfa(factorId: string) {
  const result = await supabase.auth.mfa.unenroll({ factorId });

  if (!result.error) {
    await supabase.auth.refreshSession();
  }

  return result;
}

export async function getMfaAssuranceLevel() {
  return supabase.auth.mfa.getAuthenticatorAssuranceLevel();
}
