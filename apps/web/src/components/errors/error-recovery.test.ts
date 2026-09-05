import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RecoveryScreen } from "./error-recovery";
import GlobalError from "@/app/global-error";
import { GET } from "@/app/favicon.ico/route";
import type { AppLocale } from "@/i18n/translate";

describe("safe page recovery", () => {
	test("the initial server document opts out of external page translation before hydration", async () => {
		const layout = await Bun.file(
			new URL("../../app/layout.tsx", import.meta.url),
		).text();
		const htmlTag = layout.match(/<html\b[^>]*>/)?.[0] || "";
		expect(htmlTag).toContain('translate="no"');
		expect(htmlTag).toContain('className="notranslate"');
		expect(layout).toContain('<meta name="google" content="notranslate" />');
	});
	test.each<[AppLocale, string, string]>([
		["en", "This page could not continue", "Reload saved project"],
		["zh-CN", "页面暂时无法继续运行", "重新加载已保存项目"],
		["zh-TW", "頁面暫時無法繼續執行", "重新載入已儲存專案"],
	])(
		"renders a provider-independent recovery screen for %s",
		(locale, title, reload) => {
			const html = renderToStaticMarkup(
				createElement(RecoveryScreen, { locale }),
			);
			expect(html).toContain(title);
			expect(html).toContain(reload);
			expect(html).toContain('href="/projects"');
			expect(html).toContain('translate="no"');
			expect(html).toContain('role="alert"');
		},
	);
	test("the global fallback owns its document and requires no editor, router or i18n provider", () => {
		const html = renderToStaticMarkup(createElement(GlobalError));
		expect(html).toContain("<html");
		expect(html).toContain("<body");
		expect(html).toContain('content="notranslate"');
		expect(html).toContain("Unsaved changes may be lost");
	});
	test("the legacy favicon URL resolves locally instead of returning 404", () => {
		const response = GET();
		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("/favicon-commercial.svg");
	});
});
