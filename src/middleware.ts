import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/platform"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get("isAuthenticated")?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/platform/:path*"],
};
