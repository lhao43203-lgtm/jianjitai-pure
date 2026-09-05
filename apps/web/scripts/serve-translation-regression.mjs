// Run from the repository root: bun apps/web/scripts/serve-translation-regression.mjs
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const webDirectory = fileURLToPath(new URL("../", import.meta.url));
const layoutPath = resolve(webDirectory, "src/app/layout.tsx");
const escapeHtml = (value) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

const server = Bun.serve({
	hostname: "127.0.0.1",
	port: 3003,
	async fetch(request) {
		const pathname = new URL(request.url).pathname;
		if (pathname === "/translation-regression.js") {
			const build = await Bun.build({
				entrypoints: [
					resolve(webDirectory, "scripts/translation-regression.tsx"),
				],
				root: webDirectory,
				target: "browser",
				define: { "process.env.NODE_ENV": '"production"' },
			});
			if (!build.success)
				return new Response(build.logs.join("\n"), { status: 500 });
			return new Response(build.outputs[0], {
				headers: {
					"Content-Type": "text/javascript",
					"Cache-Control": "no-store",
				},
			});
		}
		if (
			!["/", "/unprotected", "/protected", "/i18n", "/recovery"].includes(
				pathname,
			)
		) {
			return new Response("Not found", { status: 404 });
		}
		const layout = await Bun.file(layoutPath).text();
		const htmlTag = layout.match(/<html\b[^>]*>/)?.[0];
		if (!htmlTag)
			return new Response("Root layout has no HTML tag", { status: 500 });
		const translate = htmlTag.match(/\btranslate=["']([^"']*)["']/)?.[1];
		const className = htmlTag.match(/\bclassName=["']([^"']*)["']/)?.[1];
		const extracted = [
			translate === undefined ? "" : `translate="${escapeHtml(translate)}"`,
			className === undefined ? "" : `class="${escapeHtml(className)}"`,
		]
			.filter(Boolean)
			.join(" ");
		const scenario =
			pathname === "/unprotected"
				? "unprotected"
				: pathname === "/i18n"
					? "i18n"
					: pathname === "/recovery"
						? "recovery"
						: "protected";
		const attributes = scenario === "unprotected" ? "" : extracted;
		const recovery = scenario === "recovery";
		return new Response(
			`<!doctype html>
<html lang="en" data-locale="en" ${attributes}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Translation regression</title>
<style>${recovery ? "body{margin:0}" : "body{font:16px system-ui;max-width:950px;margin:32px auto;padding:0 20px;line-height:1.6}button,a{margin:4px 12px 4px 0}button{padding:8px 12px}#fixture{border:1px solid #aaa;padding:20px;margin-top:20px}#result{white-space:pre-wrap;padding:16px;background:#eee}#result[data-status=pass]{background:#d9f5e3}#result[data-status=fail]{background:#ffe2e2}#stable{display:inline-block;margin-left:20px}code{overflow-wrap:anywhere}"}</style></head>
<body data-scenario="${scenario}">
<header data-i18n-ignore ${recovery ? "hidden" : ""}><h1>Translation / 撤销回归 / 復原回歸</h1>
<nav><a href="/unprotected">1. Old failure / 旧版复现 / 舊版重現</a><a href="/protected">2. Root protection / 根保护 / 根保護</a><a href="/i18n">3. Internal locales / 内置语言 / 內建語言</a><a href="/recovery">4. Recovery / 错误恢复 / 錯誤復原</a></nav>
<p>Scenario: <strong>${scenario}</strong>. Root layout attributes: <code>${escapeHtml(extracted || "(none)")}</code></p>
<p>The old case deliberately omits root protection. Other cases use attributes extracted from apps/web/src/app/layout.tsx.</p></header>
<div id="controls" data-i18n-ignore></div><div id="react-root"></div>
<pre id="result" role="status" data-i18n-ignore data-status="pending" ${recovery ? "hidden" : ""}>Ready / 就绪 / 就緒</pre>
<script type="module" src="/translation-regression.js"></script></body></html>`,
			{
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"Cache-Control": "no-store",
				},
			},
		);
	},
});
console.log(`Translation regression: ${server.url}unprotected`);
