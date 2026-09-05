"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	APP_LOCALES,
	normalizeLocale,
	translateText,
	type AppLocale,
} from "./translate";

const STORAGE_KEY = "opencut.locale";
const LOCALIZABLE_ATTRIBUTES = [
	"alt",
	"aria-description",
	"aria-label",
	"placeholder",
	"title",
] as const;
const SKIP_SELECTOR = [
	"code",
	"kbd",
	"pre",
	"samp",
	"script",
	"style",
	"[contenteditable='true']",
	"[data-i18n-ignore]",
	// The root blocks external translators, not our node-preserving localization.
	"[translate='no']:not(html)",
].join(",");

interface LocalizedValue {
	source: string;
	lastApplied: string;
}

interface I18nContextValue {
	locale: AppLocale;
	setLocale: (locale: AppLocale) => void;
	t: (source: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const textValues = new WeakMap<Text, LocalizedValue>();
const attributeValues = new WeakMap<Element, Map<string, LocalizedValue>>();

function isAppLocale(value: string | null): value is AppLocale {
	return APP_LOCALES.includes(value as AppLocale);
}

function shouldSkip(element: Element | null): boolean {
	return element?.closest(SKIP_SELECTOR) !== null;
}

function localizeTextNode(node: Text, locale: AppLocale) {
	if (shouldSkip(node.parentElement)) return;

	const current = node.data;
	let value = textValues.get(node);
	if (!value || current !== value.lastApplied) {
		value = { source: current, lastApplied: current };
		textValues.set(node, value);
	}

	const translated = translateText(value.source, locale);
	value.lastApplied = translated;
	if (current !== translated) node.data = translated;
}

function localizeAttribute(
	element: Element,
	attribute: string,
	locale: AppLocale,
) {
	if (shouldSkip(element)) return;

	const current = element.getAttribute(attribute);
	if (current === null) return;

	let values = attributeValues.get(element);
	if (!values) {
		values = new Map();
		attributeValues.set(element, values);
	}

	let value = values.get(attribute);
	if (!value || current !== value.lastApplied) {
		value = { source: current, lastApplied: current };
		values.set(attribute, value);
	}

	const translated = translateText(value.source, locale);
	value.lastApplied = translated;
	if (current !== translated) element.setAttribute(attribute, translated);
}

function localizeElement(element: Element, locale: AppLocale) {
	for (const attribute of LOCALIZABLE_ATTRIBUTES) {
		localizeAttribute(element, attribute, locale);
	}
	if (element instanceof HTMLMetaElement) {
		localizeAttribute(element, "content", locale);
	}
}

function localizeNode(root: Node, locale: AppLocale) {
	if (root instanceof Text) {
		localizeTextNode(root, locale);
		return;
	}
	if (!(root instanceof Element) || shouldSkip(root)) return;

	localizeElement(root, locale);
	for (const element of root.querySelectorAll("*")) {
		localizeElement(element, locale);
	}

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	let node = walker.nextNode();
	while (node) {
		localizeTextNode(node as Text, locale);
		node = walker.nextNode();
	}
}

function detectInitialLocale(): AppLocale {
	if (typeof document === "undefined") return "en";

	const bootstrapped = document.documentElement.dataset.locale ?? null;
	if (isAppLocale(bootstrapped)) return bootstrapped;

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (isAppLocale(stored)) return stored;

	return normalizeLocale(
		window.navigator.languages[0] ?? window.navigator.language,
	);
}

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<AppLocale>("en");

	const setLocale = useCallback((nextLocale: AppLocale) => {
		setLocaleState(nextLocale);
	}, []);

	useEffect(() => {
		setLocaleState(detectInitialLocale());
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dataset.locale = locale;
		window.localStorage.setItem(STORAGE_KEY, locale);

		localizeNode(document.documentElement, locale);
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "characterData") {
					localizeNode(mutation.target, locale);
					continue;
				}
				if (mutation.type === "attributes") {
					localizeElement(mutation.target as Element, locale);
					continue;
				}
				for (const node of mutation.addedNodes) localizeNode(node, locale);
			}
		});

		observer.observe(document.documentElement, {
			attributeFilter: [...LOCALIZABLE_ATTRIBUTES, "content"],
			attributes: true,
			characterData: true,
			childList: true,
			subtree: true,
		});

		return () => observer.disconnect();
	}, [locale]);

	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			setLocale,
			t: (source) => translateText(source, locale),
		}),
		[locale, setLocale],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const context = useContext(I18nContext);
	if (!context) throw new Error("useI18n must be used within I18nProvider");
	return context;
}
