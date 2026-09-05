import { describe, expect, test } from "bun:test";
import {
	buildLocalAudioElement,
	getAudioImportFiles,
	getLocalAudioAssets,
} from "@/lib/media/local-audio";
import type { MediaAsset } from "@/types/assets";

const audio: MediaAsset = {
	id: "audio-1",
	name: "我的配乐.wav",
	type: "audio",
	duration: 2.5,
	file: new File(["audio"], "我的配乐.wav", { type: "audio/wav" }),
};

describe("local audio panel", () => {
	test("shares existing project audio without copying it or exposing temporary assets", () => {
		const assets: MediaAsset[] = [
			{ ...audio, id: "video", type: "video" },
			audio,
			{ ...audio, id: "temporary", ephemeral: true },
			{ ...audio, id: "image", type: "image" },
		];
		expect(getLocalAudioAssets(assets)).toEqual([audio]);
		expect(getLocalAudioAssets(assets)[0]).toBe(audio);
		expect(getLocalAudioAssets([])).toEqual([]);
	});
	test("accepts audio and rejects non-audio files from a mixed drop", () => {
		const files = [
			audio.file,
			new File(["image"], "image.png", { type: "image/png" }),
		];
		expect(getAudioImportFiles(files)).toEqual([audio.file]);
	});
	test("recognizes common audio extensions when Windows supplies no MIME type", () => {
		for (const name of [
			"音乐.MP3",
			"音樂.m4a",
			"voice.wav",
			"sound.ogg",
			"sound.flac",
			"voice.aac",
		]) {
			const file = new File(["data"], name, { lastModified: 123 });
			const result = getAudioImportFiles([file]);
			expect(result).toHaveLength(1);
			expect(result[0].type).toMatch(/^audio\//);
			expect(result[0].name).toBe(name);
			expect(result[0].lastModified).toBe(123);
			expect(result[0].size).toBe(file.size);
		}
	});
	test("does not reinterpret known video MIME types or unknown files as audio", () => {
		expect(
			getAudioImportFiles([
				new File(["data"], "fake.mp3", { type: "video/mp4" }),
				new File(["data"], "unknown.bin"),
			]),
		).toEqual([]);
	});
	test("creates an upload-backed timeline element at the playhead without altering the asset", () => {
		const element = buildLocalAudioElement(audio, 3);
		expect(element).toMatchObject({
			type: "audio",
			sourceType: "upload",
			mediaId: audio.id,
			name: audio.name,
			startTime: 3,
			duration: 2.5,
			sourceDuration: 2.5,
			volume: 1,
			muted: false,
			trimStart: 0,
			trimEnd: 0,
		});
		expect(audio.duration).toBe(2.5);
	});
	test("rejects missing, non-audio and invalid-duration assets before timeline insertion", () => {
		for (const asset of [
			undefined,
			{ ...audio, type: "video" as const },
			...[undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY].map(
				(duration) => ({ ...audio, duration }),
			),
		]) {
			expect(() => buildLocalAudioElement(asset, 0)).toThrow(
				"This audio cannot be added. Try importing an MP3 or WAV file.",
			);
		}
	});
});
