export function GET() {
	return new Response(null, {
		status: 307,
		headers: {
			Location: "/favicon-commercial.svg",
			"Cache-Control": "public, max-age=86400",
		},
	});
}
