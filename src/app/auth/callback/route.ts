import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const CALLBACK_OTP_TYPES = [
  "email",
  "magiclink",
  "signup",
  "recovery",
  "invite",
] as const;
type CallbackOtpType = (typeof CALLBACK_OTP_TYPES)[number];

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, "http://flowy.local");
    if (parsed.origin !== "http://flowy.local") return "/dashboard";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

function getCallbackOtpType(value: string | null): CallbackOtpType | null {
  if (!value) return null;
  return CALLBACK_OTP_TYPES.includes(value as CallbackOtpType)
    ? (value as CallbackOtpType)
    : null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const callbackOtpType = getCallbackOtpType(type);
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  // Supabase can return provider or email errors before a code is issued.
  // Do not reflect the provider's raw description into the UI or URL.
  if (requestUrl.searchParams.has("error")) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback", requestUrl.origin),
    );
  }

  if (!code && !(tokenHash && callbackOtpType)) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: callbackOtpType as CallbackOtpType,
      });

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/login?error=callback", requestUrl.origin),
    );
  }

  const destination = type === "recovery" ? "/auth/reset-password" : next;

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
