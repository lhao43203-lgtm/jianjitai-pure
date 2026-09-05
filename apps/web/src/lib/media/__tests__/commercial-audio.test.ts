import { describe, expect, test } from "bun:test";
import {
	COMMERCIAL_PROVIDER_TERMS_LICENSE,
	filterCommercialSoundResults,
	getUnverifiedLibraryAudioElements,
	isCommercialSoundLicenseAllowed,
} from "@/lib/media/commercial-audio";
import type { TimelineTrack } from "@/types/timeline";

describe("isCommercialSoundLicenseAllowed", () => {
	test("accepts the Freesound CC0 label and canonical URL", () => {
		expect(isCommercialSoundLicenseAllowed("Creative Commons 0")).toBe(true);
		expect(
			isCommercialSoundLicenseAllowed(
				"https://creativecommons.org/publicdomain/zero/1.0/",
			),
		).toBe(true);
	});

	test("rejects attribution and noncommercial licenses in safe mode", () => {
		expect(isCommercialSoundLicenseAllowed("Attribution")).toBe(false);
		expect(
			isCommercialSoundLicenseAllowed("Attribution Noncommercial"),
		).toBe(false);
	});

	test("rejects missing and unknown license values", () => {
		expect(isCommercialSoundLicenseAllowed()).toBe(false);
		expect(isCommercialSoundLicenseAllowed("Custom permissive license")).toBe(
			false,
		);
	});
});

describe("filterCommercialSoundResults", () => {
	test("removes CC BY-NC and unknown licenses from a Freesound response", () => {
		const response = [
			{ id: 1, license: "Creative Commons 0" },
			{ id: 2, license: "Attribution Noncommercial" },
			{ id: 3, license: "" },
		];

		expect(
			filterCommercialSoundResults(response, true).map(({ id }) => id),
		).toEqual([1]);
	});
});

describe("getUnverifiedLibraryAudioElements", () => {
	test("returns legacy and non-CC0 library audio but ignores user uploads", () => {
		const base = {
			id: "audio",
			name: "audio",
			type: "audio" as const,
			duration: 1,
			startTime: 0,
			trimStart: 0,
			trimEnd: 0,
			volume: 1,
		};
		const tracks = [
			{
				id: "track",
				type: "audio",
				name: "Audio",
				locked: false,
				muted: false,
				solo: false,
				elements: [
					{ ...base, id: "legacy", sourceType: "library", sourceUrl: "a" },
					{
						...base,
						id: "by",
						sourceType: "library",
						sourceUrl: "b",
						sourceLicense: "Attribution",
					},
					{
						...base,
						id: "cc0",
						sourceType: "library",
						sourceUrl: "c",
						sourceLicense: "Creative Commons 0",
					},
					{
						...base,
						id: "provider",
						sourceType: "library",
						sourceUrl: "d",
						sourceLicense: COMMERCIAL_PROVIDER_TERMS_LICENSE,
						sourceCreator: "Configured cloud provider",
					},
					{ ...base, id: "upload", sourceType: "upload", mediaId: "m" },
				],
			},
		] as TimelineTrack[];

		expect(
			getUnverifiedLibraryAudioElements(tracks).map((element) => element.id),
		).toEqual(["legacy", "by"]);
	});
});
