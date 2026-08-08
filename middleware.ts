import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Handle locale cookie
  const localeCookie = req.cookies.get(LOCALE_COOKIE);
  const acceptLanguage = req.headers.get("accept-language") || "";
  const detectedLocale = normalizeLocale(acceptLanguage.split(",")[0]);

  if (!localeCookie) {
    const localeResponse = NextResponse.next();
    localeResponse.cookies.set(LOCALE_COOKIE, detectedLocale || defaultLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
    });
    return localeResponse;
  }

  const response = NextResponse.next({ request: req });

  // Cookies written while refreshing the session. If getUser() refreshes the
  // tokens and we then redirect, they must be carried over to the redirect
  // response or the next request would keep using the stale token.
  let refreshedCookies: {
    name: string;
    value: string;
    options: CookieOptions;
  }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        refreshedCookies = cookies;
        for (const { name, value, options } of cookies) {
          req.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Use getUser() instead of getSession(): it validates the JWT against the
  // Supabase Auth server, so route protection can't be bypassed with a
  // tampered or expired session token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isAuthPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    return redirectWithCookies(
      NextResponse.redirect(redirectUrl),
      refreshedCookies,
    );
  }

  if (user && isAuthPath) {
    return redirectWithCookies(
      NextResponse.redirect(new URL("/", req.url)),
      refreshedCookies,
    );
  }

  return response;
}

function redirectWithCookies(
  redirectResponse: NextResponse,
  cookies: { name: string; value: string; options: CookieOptions }[],
) {
  for (const { name, value, options } of cookies) {
    redirectResponse.cookies.set(name, value, options);
  }
  return redirectResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|wasm|mp4|webm|ogg|css|js)$).*)",
  ],
};
