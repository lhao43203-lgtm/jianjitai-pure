import { describe, expect, test } from "bun:test";
import { normalizeLocale, translateText, type AppLocale } from "../translate";

describe("normalizeLocale", () => {
	test.each<[string, AppLocale]>([
		["zh-CN", "zh-CN"],
		["zh-SG", "zh-CN"],
		["zh-TW", "zh-TW"],
		["zh-HK", "zh-TW"],
		["en-US", "en"],
		["fr-FR", "en"],
	])("normalizes %s to a supported app locale", (input, expected) => {
		expect(normalizeLocale(input)).toBe(expected);
	});
});

describe("translateText", () => {
	test.each<[AppLocale, string, string, string]>([
		["en", "My audio", "Preview audio", "Stop preview"],
		["zh-CN", "我的音频", "试听", "停止试听"],
		["zh-TW", "我的音訊", "試聽", "停止試聽"],
	])(
		"localizes local audio controls for %s",
		(locale, title, preview, stop) => {
			expect(translateText("My audio", locale)).toBe(title);
			expect(translateText("Preview audio", locale)).toBe(preview);
			expect(translateText("Stop preview", locale)).toBe(stop);
		},
	);
	test.each<[AppLocale, string, string]>([
		["en", "Applied transition", "Remove transition"],
		["zh-CN", "已添加转场", "删除转场"],
		["zh-TW", "已套用轉場", "刪除轉場"],
	])(
		"localizes visible transition controls for %s",
		(locale, title, remove) => {
			expect(translateText("Applied transition", locale)).toBe(title);
			expect(translateText("Remove transition", locale)).toBe(remove);
		},
	);
	test.each<[AppLocale, string, string]>([
		["en", "Filter: Grayscale", "Effect track"],
		["zh-CN", "滤镜：灰度", "特效轨道"],
		["zh-TW", "濾鏡：灰階", "特效軌道"],
	])(
		"localizes generated effect and track labels for %s",
		(locale, filter, track) => {
			expect(translateText("Filter: Grayscale", locale)).toBe(filter);
			expect(translateText("Effect track", locale)).toBe(track);
		},
	);

	test.each<[AppLocale, string]>([
		["en", "New project"],
		["zh-CN", "新建项目"],
		["zh-TW", "新增專案"],
	])("translates an exact UI message for %s", (locale, expected) => {
		expect(translateText("New project", locale)).toBe(expected);
	});

	test("preserves the whitespace around a translated text node", () => {
		expect(translateText("\n  Search...  \n", "zh-CN")).toBe("\n  搜索...  \n");
	});

	test.each<[AppLocale, string]>([
		["zh-CN", "删除“演示项目”？"],
		["zh-TW", "刪除「演示项目」？"],
	])(
		"interpolates dynamic values without translating user content",
		(locale, expected) => {
			expect(translateText('Delete "演示项目"?', locale)).toBe(expected);
		},
	);

	test("leaves unknown text untouched so project names and media content are safe", () => {
		expect(translateText("My Summer Film", "zh-CN")).toBe("My Summer Film");
	});

	test.each<[AppLocale, string]>([
		["zh-CN", "2026年9月4日"],
		["zh-TW", "2026年9月4日"],
	])("localizes English project dates for %s", (locale, expected) => {
		expect(translateText("Sep 4, 2026", locale)).toBe(expected);
	});

	test.each<[AppLocale, string]>([
		["zh-CN", "AI 后端未连接"],
		["zh-TW", "AI 後端未連線"],
	])("localizes dynamic backend status for %s", (locale, expected) => {
		expect(translateText("AI backend disconnected", locale)).toBe(expected);
	});

	test.each<[AppLocale, string]>([
		["zh-CN", "服务条款 - 剪辑台 | 剪辑台"],
		["zh-TW", "服務條款 - 剪輯台 | 剪輯台"],
	])("localizes composed document titles for %s", (locale, expected) => {
		expect(
			translateText("Terms of Service - Editing Desk | Editing Desk", locale),
		).toBe(expected);
	});

	test.each<[AppLocale, string]>([
		["zh-CN", "剪辑台 - 自托管视频剪辑"],
		["zh-TW", "剪輯台 - 自架設影片剪輯"],
	])("localizes the commercial home title for %s", (locale, expected) => {
		expect(
			translateText("Editing Desk - Self-Hosted Video Editing", locale),
		).toBe(expected);
	});
});
