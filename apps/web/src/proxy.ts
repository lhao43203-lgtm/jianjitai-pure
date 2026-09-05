import { COMMERCIAL_MODE } from "@/lib/commercial-mode";
import { type NextRequest, NextResponse } from "next/server";

const LEGACY_BRAND_ROUTES = [
	"/blog",
	"/brand",
	"/changelog",
	"/compare",
	"/contributors",
	"/roadmap",
	"/sponsors",
];

export async function proxy(request: NextRequest) {
	if (
		COMMERCIAL_MODE &&
		LEGACY_BRAND_ROUTES.some(
			(route) =>
				request.nextUrl.pathname === route ||
				request.nextUrl.pathname.startsWith(`${route}/`),
		)
	) {
		const target = request.nextUrl.clone();
		target.pathname = request.nextUrl.pathname.startsWith("/brand")
			? "/terms"
			: "/";
		return NextResponse.redirect(target);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
