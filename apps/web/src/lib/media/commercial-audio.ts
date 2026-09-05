import type {
	LibraryAudioElement,
	TimelineTrack,
} from "@/types/timeline";

const COMMERCIAL_SOUND_LICENSES = new Set([
	"creative commons 0",
	"cc0",
	"https://creativecommons.org/publicdomain/zero/1.0",
]);

export const COMMERCIAL_PROVIDER_TERMS_LICENSE = "Commercial provider terms";

export function isCommercialSoundLicenseAllowed(license?: string): boolean {
	const normalized = license?.trim().toLowerCase().replace(/\/$/, "") ?? "";
	return COMMERCIAL_SOUND_LICENSES.has(normalized);
}

export function filterCommercialSoundResults<
	T extends { license?: unknown },
>(results: T[], commercialMode: boolean): T[] {
	if (!commercialMode) return results;
	return results.filter((result) =>
		isCommercialSoundLicenseAllowed(
			typeof result.license === "string" ? result.license : undefined,
		),
	);
}

export function getUnverifiedLibraryAudioElements(
	tracks: TimelineTrack[],
): LibraryAudioElement[] {
	return tracks.flatMap((track) => {
		if (track.type !== "audio") return [];
		return track.elements.filter(
			(element): element is LibraryAudioElement =>
				element.sourceType === "library" &&
				!isCommercialSoundLicenseAllowed(element.sourceLicense) &&
				element.sourceLicense !== COMMERCIAL_PROVIDER_TERMS_LICENSE,
		);
	});
}
