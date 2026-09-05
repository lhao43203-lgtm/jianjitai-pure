import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { translate } from "bing-translate-api";

const scriptsDirectory = import.meta.dirname;
const extractorPath = join(scriptsDirectory, "extract-i18n-messages.mjs");
const cachePath = join(scriptsDirectory, ".i18n-translation-cache.json");
const outputPath = join(
	scriptsDirectory,
	"..",
	"src",
	"i18n",
	"messages.generated.ts",
);
const targetLanguages = {
	"zh-CN": "zh-Hans",
	"zh-TW": "zh-Hant",
};
const translationOverrides = {
	"zh-CN": {
		"Editing Desk": "剪辑台",
		"Commercial safe": "商用安全",
		"Commercial-safe model policy": "商用安全模型策略",
		"built for control.": "尽在掌控。",
		"Generative creation stays separate from this editing workspace.":
			"生成式创作与当前剪辑工作区相互独立。",
		"Multilingual Captions": "多语言字幕",
		"Transcribe speech and manage subtitles in the editing workflow. Optional translation providers stay disabled until their commercial terms are approved.":
			"在剪辑流程中转写语音并管理字幕。可选翻译服务仅在管理员确认其商业条款后开放。",
		"Professional editing tools": "专业剪辑工具",
		"Transcription, text-based editing, visible effect management, word-pop subtitles, auto-reframe, brand kits, and reliable local export.":
			"支持转录、文本剪辑、可视化特效管理、逐字字幕、自动重构画面、品牌工具包和可靠的本地导出。",
		"Core Editing Tools": "核心剪辑工具",
		"No restricted local models required": "无需受限的本地模型",
		"Version history and project tools": "版本历史和项目工具",
		"Higher-quality export presets": "高质量导出预设",
		"Reviewed local processing stack": "经审查的本地处理组件",
		"Performance Server": "高性能服务器",
		"Faster rendering and transcription": "更快的渲染和转录",
		"Hardware-accelerated rendering": "硬件加速渲染",
		"Faster effects and previews": "更快的特效和预览",
		"Restricted models": "受限模型",
		Blocked: "已阻止",
		"Provider terms": "遵循提供商条款",
		"{0} - Self-Hosted Video Editing": "{0} - 自托管视频剪辑",
		"{0} - Self-Hosted Video Editor": "{0} - 自托管视频剪辑工具",
		"Models - Editing Desk": "模型 - 剪辑台",
		"Privacy Policy - Editing Desk": "隐私政策 - 剪辑台",
		"Terms of Service - Editing Desk": "服务条款 - 剪辑台",
		"Applied effects": "已应用特效",
		"Manage applied effects": "管理已应用特效",
		"Delete effect": "删除特效",
		"Remove all effects": "移除全部特效",
		"Remove all effects?": "要移除全部特效吗？",
		"enabled": "已启用",
		"License unknown": "许可证未知",
		"Commercial version unavailable": "商用版暂不可用",
		"Administrator approval required": "需要管理员确认商业条款",
		"Local unavailable": "本地功能暂不可用",
		"Export blocked: remove or replace library sounds with missing or non-CC0 license information.":
			"导出已阻止：请移除或替换缺少许可证信息或非 CC0 的音效素材。",
	},
	"zh-TW": {
		"Editing Desk": "剪輯台",
		"Commercial safe": "商用安全",
		"Commercial-safe model policy": "商用安全模型策略",
		"built for control.": "盡在掌控。",
		"Generative creation stays separate from this editing workspace.":
			"生成式創作與目前剪輯工作區相互獨立。",
		"Multilingual Captions": "多語言字幕",
		"Transcribe speech and manage subtitles in the editing workflow. Optional translation providers stay disabled until their commercial terms are approved.":
			"在剪輯流程中轉錄語音並管理字幕。可選翻譯服務僅在管理員確認其商業條款後開放。",
		"Professional editing tools": "專業剪輯工具",
		"Transcription, text-based editing, visible effect management, word-pop subtitles, auto-reframe, brand kits, and reliable local export.":
			"支援轉錄、文字剪輯、可視化特效管理、逐字字幕、自動重構畫面、品牌工具包和可靠的本地匯出。",
		"Core Editing Tools": "核心剪輯工具",
		"No restricted local models required": "無需受限的本地模型",
		"Version history and project tools": "版本歷史和專案工具",
		"Higher-quality export presets": "高品質匯出預設",
		"Reviewed local processing stack": "經審查的本地處理元件",
		"Performance Server": "高效能伺服器",
		"Faster rendering and transcription": "更快的渲染和轉錄",
		"Hardware-accelerated rendering": "硬體加速渲染",
		"Faster effects and previews": "更快的特效和預覽",
		"Restricted models": "受限模型",
		Blocked: "已阻止",
		"Provider terms": "遵循提供商條款",
		"{0} - Self-Hosted Video Editing": "{0} - 自架設影片剪輯",
		"{0} - Self-Hosted Video Editor": "{0} - 自架設影片剪輯工具",
		"Models - Editing Desk": "模型 - 剪輯台",
		"Privacy Policy - Editing Desk": "隱私權政策 - 剪輯台",
		"Terms of Service - Editing Desk": "服務條款 - 剪輯台",
		"Applied effects": "已套用特效",
		"Manage applied effects": "管理已套用特效",
		"Delete effect": "刪除特效",
		"Remove all effects": "移除全部特效",
		"Remove all effects?": "要移除全部特效嗎？",
		"enabled": "已啟用",
		"License unknown": "授權資訊未知",
		"Commercial version unavailable": "商用版暫不可用",
		"Administrator approval required": "需要管理員確認商業條款",
		"Local unavailable": "本機功能暫不可用",
		"Export blocked: remove or replace library sounds with missing or non-CC0 license information.":
			"匯出已封鎖：請移除或替換缺少授權資訊或非 CC0 的音效素材。",
	},
};
const batchCharacterLimit = 2_400;
const concurrentRequests = 3;
const protectedMessages = new Set([
	"AI",
	"API",
	"BPM",
	"CPU",
	"CUDA",
	"Discord",
	"Docker",
	"FFmpeg",
	"GitHub",
	"GPU",
	"Instagram",
	"Kimi",
	"Luma AI",
	"NVIDIA",
	"Ollama",
	"OpenCut",
	"OpenCut AI",
	"PayPal",
	"Replicate",
	"Sarvam AI",
	"Seedance",
	"Smallest AI",
	"TikTok",
	"TurboQuant",
	"Twitter / X",
	"Whisper",
	"YouTube",
]);

function loadCache() {
	if (!existsSync(cachePath)) return { "zh-CN": {}, "zh-TW": {} };
	return JSON.parse(readFileSync(cachePath, "utf8"));
}

function saveCache(cache) {
	writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

function shouldKeepSource(source) {
	if (protectedMessages.has(source)) return true;
	if (/^@[\w.-]+$/.test(source)) return true;
	if (/^#[\da-f]{3,8}$/i.test(source)) return true;
	if (/^\.[\w,.*-]+$/.test(source)) return true;
	if (/^&[a-z]+;$/i.test(source)) return true;
	if (
		/^[\d\s:.,%+×x/()-]+(?:bit|bits|dB|fps|GB|Hz|KB|kHz|MB|ms|px)?$/i.test(
			source,
		)
	) {
		return true;
	}
	if (/^[A-Z\d][A-Z\d +/_.()-]*$/.test(source)) return true;
	if (
		/^\S+\.(?:avif|css|gif|glsl|jpeg|jpg|json|md|mp3|mp4|png|svg|ts|tsx|wav|webm)$/i.test(
			source,
		)
	) {
		return true;
	}
	return false;
}

function applyTerminology(source, value, locale) {
	let result = value;
	if (/\bAI\b/i.test(source)) {
		result = result.replaceAll(/人工智能|人工智慧/g, "AI");
	}

	if (locale === "zh-CN") {
		if (/export/i.test(source)) result = result.replaceAll("出口", "导出");
		if (/project/i.test(source)) result = result.replaceAll("工程", "项目");
		if (/timeline/i.test(source))
			result = result.replaceAll("时间轴", "时间线");
		if (/B-roll/i.test(source))
			result = result.replaceAll(/B卷|B 卷/g, "B-roll");
		return result;
	}

	if (/export/i.test(source)) {
		result = result.replaceAll(/出口|輸出|导出|導出/g, "匯出");
	}
	if (/project/i.test(source)) {
		result = result.replaceAll(/計畫|項目|工程/g, "專案");
	}
	if (/files?/i.test(source)) result = result.replaceAll(/文件|文檔/g, "檔案");
	if (/load/i.test(source)) result = result.replaceAll(/加載|載入/g, "載入");
	if (/save/i.test(source)) result = result.replaceAll(/保存|存儲/g, "儲存");
	if (/settings?/i.test(source))
		result = result.replaceAll(/設置|设置/g, "設定");
	if (/video/i.test(source)) result = result.replaceAll(/視頻|视频/g, "影片");
	if (/software/i.test(source))
		result = result.replaceAll(/軟件|软件/g, "軟體");
	if (/network/i.test(source)) result = result.replaceAll(/網絡|网络/g, "網路");
	if (/clipboard/i.test(source))
		result = result.replaceAll(/剪貼板|剪贴板/g, "剪貼簿");
	if (/default/i.test(source)) result = result.replaceAll(/默認|默认/g, "預設");
	if (/quality/i.test(source)) result = result.replaceAll(/質量|质量/g, "品質");
	if (/information|\binfo\b/i.test(source)) {
		result = result.replaceAll(/信息|訊息/g, "資訊");
	}
	if (/timeline/i.test(source))
		result = result.replaceAll(/時間線|时间线/g, "時間軸");
	if (/B-roll/i.test(source)) result = result.replaceAll(/B卷|B 卷/g, "B-roll");
	return result;
}

function makeBatches(sources) {
	const batches = [];
	let batch = [];
	let length = 0;

	for (const source of sources) {
		const markerLength = 18;
		if (
			batch.length > 0 &&
			length + source.length + markerLength > batchCharacterLimit
		) {
			batches.push(batch);
			batch = [];
			length = 0;
		}
		batch.push(source);
		length += source.length + markerLength;
	}

	if (batch.length > 0) batches.push(batch);
	return batches;
}

function protectPlaceholders(source) {
	return source.replaceAll(/\{(\d+)\}/g, "⟪VAR$1⟫");
}

function restorePlaceholders(value) {
	return value.replaceAll(/⟪\s*VAR\s*(\d+)\s*⟫/gi, "{$1}");
}

function placeholders(value) {
	return [...value.matchAll(/\{(\d+)\}/g)].map((match) => match[1]).sort();
}

function isValidTranslation(source, value) {
	return (
		typeof value === "string" &&
		value.trim().length > 0 &&
		!value.includes("\n") &&
		!/I18N|⟪|VAR\d/i.test(value) &&
		JSON.stringify(placeholders(value)) === JSON.stringify(placeholders(source))
	);
}

function parseBatchTranslation(value, count) {
	const translations = new Array(count);
	const marker = /\[\[I18N(\d{4})\]\]/g;
	const matches = [...value.matchAll(marker)];

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const translatedIndex = Number(match[1]);
		const start = (match.index ?? 0) + match[0].length;
		const end = matches[index + 1]?.index ?? value.length;
		translations[translatedIndex] = restorePlaceholders(
			value.slice(start, end).trim(),
		);
	}

	if (
		translations.filter((translation) => translation !== undefined).length !==
		count
	) {
		throw new Error(
			`Translation response omitted one or more of ${count} markers.`,
		);
	}

	return translations;
}

async function translateSingle(source, targetLanguage, locale) {
	let lastError;
	for (let attempt = 1; attempt <= 4; attempt += 1) {
		try {
			const result = await translate(
				protectPlaceholders(source),
				"en",
				targetLanguage,
			);
			const value = restorePlaceholders(result.translation.trim());
			if (!isValidTranslation(source, value)) {
				throw new Error(
					"The translation response changed a protected placeholder.",
				);
			}
			return applyTerminology(source, value, locale);
		} catch (error) {
			lastError = error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
		}
	}
	throw lastError;
}

async function translateBatch(sources, targetLanguage, locale) {
	const text = sources
		.map(
			(source, index) =>
				`[[I18N${String(index).padStart(4, "0")}]] ${protectPlaceholders(source)}`,
		)
		.join("\n");

	let lastError;
	for (let attempt = 1; attempt <= 4; attempt += 1) {
		try {
			const result = await translate(text, "en", targetLanguage);
			const translations = parseBatchTranslation(
				result.translation,
				sources.length,
			);
			return Promise.all(
				translations.map((value, index) =>
					isValidTranslation(sources[index], value)
						? applyTerminology(sources[index], value, locale)
						: translateSingle(sources[index], targetLanguage, locale),
				),
			);
		} catch (error) {
			lastError = error;
			await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
		}
	}

	throw lastError;
}

async function translateLocale(locale, targetLanguage, sources, cache) {
	for (const [source, value] of Object.entries(cache[locale])) {
		if (
			!isValidTranslation(source, value) ||
			(value === source &&
				/[A-Za-z]{2}/.test(source) &&
				!shouldKeepSource(source))
		) {
			delete cache[locale][source];
			continue;
		}
		cache[locale][source] = applyTerminology(source, value, locale);
	}

	const pending = sources.filter(
		(source) =>
			cache[locale][source] === undefined && !shouldKeepSource(source),
	);
	for (const source of sources) {
		if (shouldKeepSource(source)) cache[locale][source] = source;
	}

	const batches = makeBatches(pending);
	for (let offset = 0; offset < batches.length; offset += concurrentRequests) {
		const group = batches.slice(offset, offset + concurrentRequests);
		const results = await Promise.all(
			group.map((batch) => translateBatch(batch, targetLanguage, locale)),
		);

		for (let batchIndex = 0; batchIndex < group.length; batchIndex += 1) {
			for (
				let itemIndex = 0;
				itemIndex < group[batchIndex].length;
				itemIndex += 1
			) {
				cache[locale][group[batchIndex][itemIndex]] =
					results[batchIndex][itemIndex];
			}
		}

		saveCache(cache);
		process.stdout.write(
			`${locale}: ${Math.min(offset + group.length, batches.length)}/${batches.length} batches\n`,
		);
	}
}

function serializeCatalog(name, values, sources) {
	const entries = sources.map(
		(source) =>
			`\t${JSON.stringify(source)}: ${JSON.stringify(values[source] ?? source)},`,
	);
	return `export const ${name}: Record<string, string> = {\n${entries.join("\n")}\n};`;
}

const extractedMessages = JSON.parse(
	execFileSync(process.execPath, [extractorPath], { encoding: "utf8" }),
);
const sources = extractedMessages.map(({ source }) => source);
const cache = loadCache();

for (const [locale, targetLanguage] of Object.entries(targetLanguages)) {
	await translateLocale(locale, targetLanguage, sources, cache);
	Object.assign(cache[locale], translationOverrides[locale]);
}

saveCache(cache);

const output = [
	"// Generated by scripts/generate-i18n-catalogs.mjs. Do not edit by hand.",
	serializeCatalog("zhCNGeneratedMessages", cache["zh-CN"], sources),
	serializeCatalog("zhTWGeneratedMessages", cache["zh-TW"], sources),
].join("\n\n");

writeFileSync(outputPath, `${output}\n`);
process.stdout.write(`Wrote ${sources.length} messages to ${outputPath}\n`);
