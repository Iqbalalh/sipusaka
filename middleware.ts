import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: any) {

    // Next-auth payload
    const { nextUrl, nextauth } = req;

    // Auth Check
    const isAuth = !!nextauth?.token;
    const isAuthPage = nextUrl.pathname.startsWith("/signin");

    // Redirect if user is logged in and try to access /signin
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redirect if user is not logged in and try to access protected route
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
      Patterns to apply this middleware:
      - /api/auth         (next-auth handler)
      - /_next/static     (handler static file)
      - /_next/image      (handler image file)
      - /favicon.ico      (favicon file)
    */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
