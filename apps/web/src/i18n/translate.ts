import { messages } from "./messages";

export const APP_LOCALES = ["en", "zh-CN", "zh-TW"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

const dynamicMessages: Record<
	Exclude<AppLocale, "en">,
	Array<{
		pattern: RegExp;
		translate: (match: RegExpMatchArray) => string;
	}>
> = {
	"zh-CN": [
		{
			pattern: /^Filter: (.+)$/,
			translate: (match) => `滤镜：${translateMessage(match[1], "zh-CN")}`,
		},
		{
			pattern: /^AI backend (connected|disconnected)$/,
			translate: (match) =>
				match[1] === "connected" ? "AI 后端已连接" : "AI 后端未连接",
		},
		{
			pattern: /^Sort (ascending|descending)$/,
			translate: (match) =>
				`排序：${match[1] === "ascending" ? "升序" : "降序"}`,
		},
		{
			pattern: /^Delete "(.+)"\?$/,
			translate: (match) => `删除“${match[1]}”？`,
		},
		{
			pattern: /^Editing Desk - (.+)$/,
			translate: () =>
				translateMessage("{0} - Self-Hosted Video Editing", "zh-CN").replace(
					"{0}",
					translateMessage("Editing Desk", "zh-CN"),
				),
		},
		{
			pattern: /^(.+) \| Editing Desk$/,
			translate: (match) =>
				`${translateMessage(match[1], "zh-CN")} | ${translateMessage("Editing Desk", "zh-CN")}`,
		},
	],
	"zh-TW": [
		{
			pattern: /^Filter: (.+)$/,
			translate: (match) => `濾鏡：${translateMessage(match[1], "zh-TW")}`,
		},
		{
			pattern: /^AI backend (connected|disconnected)$/,
			translate: (match) =>
				match[1] === "connected" ? "AI 後端已連線" : "AI 後端未連線",
		},
		{
			pattern: /^Sort (ascending|descending)$/,
			translate: (match) =>
				`排序：${match[1] === "ascending" ? "升冪" : "降冪"}`,
		},
		{
			pattern: /^Delete "(.+)"\?$/,
			translate: (match) => `刪除「${match[1]}」？`,
		},
		{
			pattern: /^Editing Desk - (.+)$/,
			translate: () =>
				translateMessage("{0} - Self-Hosted Video Editing", "zh-TW").replace(
					"{0}",
					translateMessage("Editing Desk", "zh-TW"),
				),
		},
		{
			pattern: /^(.+) \| Editing Desk$/,
			translate: (match) =>
				`${translateMessage(match[1], "zh-TW")} | ${translateMessage("Editing Desk", "zh-TW")}`,
		},
	],
};

interface MessageTemplate {
	pattern: RegExp;
	placeholderIndexes: number[];
	translation: string;
}

const messageTemplateCache = new Map<
	Exclude<AppLocale, "en">,
	MessageTemplate[]
>();
const translationCache = new Map<string, string>();
const englishMonths = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMessageTemplates(
	locale: Exclude<AppLocale, "en">,
): MessageTemplate[] {
	const cached = messageTemplateCache.get(locale);
	if (cached) return cached;

	const templates = Object.entries(messages[locale])
		.filter(([source]) => /\{\d+\}/.test(source))
		.map(([source, translation]) => {
			const placeholderIndexes: number[] = [];
			let pattern = "^";
			let cursor = 0;

			for (const match of source.matchAll(/\{(\d+)\}/g)) {
				pattern += escapeRegExp(source.slice(cursor, match.index));
				pattern += "([\\s\\S]*?)";
				placeholderIndexes.push(Number(match[1]));
				cursor = (match.index ?? 0) + match[0].length;
			}

			pattern += `${escapeRegExp(source.slice(cursor))}$`;
			return {
				pattern: new RegExp(pattern),
				placeholderIndexes,
				translation,
			};
		})
		.sort(
			(left, right) => right.pattern.source.length - left.pattern.source.length,
		);

	messageTemplateCache.set(locale, templates);
	return templates;
}

function translateMessage(
	message: string,
	locale: Exclude<AppLocale, "en">,
): string {
	const dateMatch = message.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
	if (dateMatch) {
		const month = englishMonths.indexOf(
			dateMatch[1] as (typeof englishMonths)[number],
		);
		if (month >= 0) return `${dateMatch[3]}年${month + 1}月${dateMatch[2]}日`;
	}

	const exact = messages[locale][message];
	if (exact !== undefined) return exact;

	for (const dynamicMessage of dynamicMessages[locale]) {
		const match = message.match(dynamicMessage.pattern);
		if (match) return dynamicMessage.translate(match);
	}

	for (const template of getMessageTemplates(locale)) {
		const match = message.match(template.pattern);
		if (!match) continue;

		const values: string[] = [];
		for (
			let index = 0;
			index < template.placeholderIndexes.length;
			index += 1
		) {
			values[template.placeholderIndexes[index]] = match[index + 1];
		}
		return template.translation.replaceAll(
			/\{(\d+)\}/g,
			(placeholder, index) => values[Number(index)] ?? placeholder,
		);
	}

	return message;
}

export function normalizeLocale(locale?: string | null): AppLocale {
	const normalized = locale?.toLowerCase() ?? "";

	if (
		normalized === "zh-tw" ||
		normalized === "zh-hk" ||
		normalized === "zh-mo" ||
		normalized.startsWith("zh-hant")
	) {
		return "zh-TW";
	}

	if (normalized.startsWith("zh")) {
		return "zh-CN";
	}

	return "en";
}

export function translateText(source: string, locale: AppLocale): string {
	if (locale === "en" || source.length === 0) {
		return source;
	}

	const leadingWhitespace = source.match(/^\s*/)?.[0] ?? "";
	const trailingWhitespace = source.match(/\s*$/)?.[0] ?? "";
	const message = source.trim();

	if (message.length === 0) {
		return source;
	}

	const cacheKey = `${locale}\u0000${message}`;
	let translated = translationCache.get(cacheKey);
	if (translated === undefined) {
		translated = translateMessage(message, locale);
		translationCache.set(cacheKey, translated);
	}

	return translated === message
		? source
		: `${leadingWhitespace}${translated}${trailingWhitespace}`;
}
