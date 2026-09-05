export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002";

export const SITE_INFO = {
	title: "Editing Desk",
	description:
		"A local video editor with manual captions, timeline effects, and browser-based export.",
	url: SITE_URL,
	openGraphImage: "/open-graph/default.jpg",
	twitterImage: "/open-graph/default.jpg",
	favicon: "/favicon.svg",
};

export type ExternalTool = {
	name: string;
	description: string;
	url: string;
	logo: string;
};

export const EXTERNAL_TOOLS: ExternalTool[] = [];

export const DEFAULT_LOGO_URL = "/favicon-commercial.svg";

export const SOCIAL_LINKS = {
	x: "https://x.com/humblefool",
	github: "https://github.com/Ekaanth/OpenCut-AI",
};

/** Link back to the upstream project we forked from */
export const UPSTREAM_URL = "https://github.com/OpenCut-app/OpenCut";

export type Sponsor = {
	name: string;
	url: string;
	logo: string;
	description: string;
	invertOnDark?: boolean;
};

export const SPONSORS: Sponsor[] = [];
