import { describe, expect, test } from "bun:test";
import { parseSubtitleFile, serializeSubtitles } from "./subtitle-file";
import { buildSubtitleTrack } from "./subtitle-track";

describe("local subtitle files", () => {
	test("imports multiline Chinese SRT with BOM and CRLF", () => {
		expect(
			parseSubtitleFile(
				"\uFEFF1\r\n00:00:01,250 --> 00:00:03,500\r\n你好\r\n剪輯台\r\n",
			),
		).toEqual([{ start: 1.25, end: 3.5, text: "你好\n剪輯台" }]);
	});
	test("handles WebVTT cue identifiers and settings", () => {
		expect(
			parseSubtitleFile(
				"WEBVTT\n\nNOTE example\n\ncue-1\n00:01.000 --> 00:03.000 align:center\n你好",
			),
		).toEqual([{ start: 1, end: 3, text: "你好" }]);
	});
	test("round-trips SRT and VTT locally", () => {
		const cues = [{ start: 60.12, end: 3601.7, text: "中文\nEnglish" }];
		for (const format of ["srt", "vtt"] as const)
			expect(parseSubtitleFile(serializeSubtitles(cues, format))).toEqual(cues);
	});
	test("rejects malformed, reversed and empty cues before import", () => {
		for (const source of [
			"",
			"1\n00:70:00,000 --> 00:71:00,000\na",
			"1\n00:00:03,000 --> 00:00:01,000\na",
			"1\n00:00:00,000 --> 00:00:01,000\n",
			"garbage",
		]) {
			expect(() => parseSubtitleFile(source)).toThrow();
		}
	});
	test("keeps overlapping cues and creates independent editable text elements", () => {
		const cues = [
			{ start: 1, end: 4, text: "第一行" },
			{ start: 2, end: 5, text: "第二行" },
		];
		const track = buildSubtitleTrack(cues, "字幕", 1080);
		expect(
			track.elements.map((e) => [e.content, e.startTime, e.duration]),
		).toEqual([
			["第一行", 1, 3],
			["第二行", 2, 3],
		]);
		expect(track.elements[0].id).not.toBe(track.elements[1].id);
		track.elements[0].background.color = "#ff0000";
		expect(track.elements[1].background.color).toBe("#000000");
	});
});
