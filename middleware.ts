import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE, defaultLocale, normalizeLocale } from "@/lib/i18n";

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
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, detectedLocale || defaultLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
    });
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value } of cookies) {
          req.cookies.set(name, value);
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (!user && !isAuthPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next({ request: req });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|wasm|mp4|webm|ogg|css|js)$).*)",
  ],
};
