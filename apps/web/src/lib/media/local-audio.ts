import type { MediaAsset } from "@/types/assets";
import { buildUploadAudioElement } from "@/lib/timeline/element-utils";

const AUDIO_MIME_TYPES: Record<string, string> = {
	mp3: "audio/mpeg",
	wav: "audio/wav",
	m4a: "audio/mp4",
	ogg: "audio/ogg",
	flac: "audio/flac",
	aac: "audio/aac",
};

export function getAudioImportFiles(files: File[]): File[] {
	return files.flatMap((file) => {
		if (file.type.startsWith("audio/")) return [file];
		if (file.type && file.type !== "application/octet-stream") return [];
		const type =
			AUDIO_MIME_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""];
		return type
			? [new File([file], file.name, { type, lastModified: file.lastModified })]
			: [];
	});
}

export function getLocalAudioAssets(assets: MediaAsset[]): MediaAsset[] {
	return assets.filter((asset) => asset.type === "audio" && !asset.ephemeral);
}

export function buildLocalAudioElement(
	asset: MediaAsset | undefined,
	startTime: number,
) {
	if (
		asset?.type !== "audio" ||
		!asset.duration ||
		!Number.isFinite(asset.duration) ||
		asset.duration < 0
	) {
		throw new Error(
			"This audio cannot be added. Try importing an MP3 or WAV file.",
		);
	}
	return buildUploadAudioElement({
		mediaId: asset.id,
		name: asset.name,
		duration: asset.duration,
		startTime,
	});
}
