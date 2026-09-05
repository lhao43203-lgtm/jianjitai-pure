import { SITE_INFO, SITE_URL } from "@/constants/site-constants";

/**
 * JSON-LD structured data for SEO.
 * Renders Organization, WebSite, and SoftwareApplication schemas.
 */
export function JsonLd() {
	const organization = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE_INFO.title,
		url: SITE_URL,
		logo: `${SITE_URL}/favicon-commercial.svg`,
		description: SITE_INFO.description,
	};

	const website = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_INFO.title,
		url: SITE_URL,
		description: SITE_INFO.description,
	};

	const softwareApp = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: SITE_INFO.title,
		url: SITE_URL,
		description: SITE_INFO.description,
		applicationCategory: "MultimediaApplication",
		applicationSubCategory: "Video Editor",
		operatingSystem: "Web, Windows, macOS, Linux",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		featureList: [
			"Timeline editing",
			"Manual subtitles",
			"Video effects",
			"Local export",
		],
		screenshot: `${SITE_URL}${SITE_INFO.openGraphImage}`,
		softwareVersion: "1.0.0",
		license: "https://opensource.org/licenses/MIT",
		isAccessibleForFree: true,
	};

	return (
		<>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON; HTML delimiters are escaped.
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(organization).replace(/</g, "\\u003c"),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON; HTML delimiters are escaped.
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(website).replace(/</g, "\\u003c"),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw JSON; HTML delimiters are escaped.
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareApp).replace(/</g, "\\u003c"),
				}}
			/>
		</>
	);
}
