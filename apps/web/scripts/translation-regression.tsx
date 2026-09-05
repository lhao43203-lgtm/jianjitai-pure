import { Component, type ReactNode, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import ErrorRecovery from "@/app/error";
import { I18nProvider, useI18n } from "@/i18n/i18n-provider";
import type { AppLocale } from "@/i18n/translate";

const result = elementById("result");
const container = elementById("react-root");
const scenario = document.body.dataset.scenario;
const errors: unknown[] = [];
const RECOVERY_ERROR = "Deliberate QA recovery error";
const nextPaint = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);

function report(pass: boolean, detail: string) {
	result.dataset.status = pass ? "pass" : "fail";
	result.textContent = `${pass ? "PASS" : "FAIL"}: ${detail}`;
	if (!pass) result.hidden = false;
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function elementById(id: string) {
	const element = document.getElementById(id);
	assert(element, `Missing fixture element: ${id}`);
	return element;
}

function firstText(element: Element) {
	const node = element.firstChild;
	assert(node instanceof Text, `Missing fixture text: ${element.id}`);
	return node;
}

function errorText(error: unknown) {
	return error instanceof Error
		? `${error.name}: ${error.message}`
		: String(error);
}

function rootProtected() {
	return (
		document.documentElement.getAttribute("translate") === "no" &&
		document.documentElement.classList.contains("notranslate")
	);
}

const root = createRoot(container, {
	onCaughtError(error) {
		const expected =
			scenario === "recovery" &&
			error instanceof Error &&
			error.message === RECOVERY_ERROR;
		report(
			expected,
			expected
				? "Deliberate error caught; production ErrorRecovery is mounted."
				: errorText(error),
		);
	},
	onUncaughtError(error) {
		errors.push(error);
		const expected =
			scenario === "unprotected" && /removeChild/.test(errorText(error));
		report(
			expected,
			`${expected ? "Expected old failure captured" : "Unexpected React error"}\n${errorText(error)}`,
		);
	},
});

// Model the DOM mutation performed by page translators; never patch Node methods.
function wrapTranslatedText(element: Element) {
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	while (walker.nextNode()) nodes.push(walker.currentNode as Text);
	let wrapped = 0;
	for (const node of nodes) {
		const parent = node.parentElement;
		if (
			!parent ||
			!node.data.trim() ||
			parent.closest('[translate="no"], .notranslate')
		)
			continue;
		const outer = document.createElement("font");
		const inner = document.createElement("font");
		inner.textContent = `翻译：${node.data}`;
		outer.append(inner);
		parent.replaceChild(outer, node);
		wrapped++;
	}
	return wrapped;
}

function keyCommand(redo = false) {
	document.dispatchEvent(
		new KeyboardEvent("keydown", {
			key: "z",
			code: "KeyZ",
			ctrlKey: true,
			shiftKey: redo,
			bubbles: true,
			cancelable: true,
		}),
	);
}

function UndoFixture() {
	const [visible, setVisible] = useState(true);
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z")
				return;
			event.preventDefault();
			flushSync(() => setVisible(event.shiftKey));
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, []);
	return (
		<div id="fixture">
			{visible && "Timeline clip"}
			<span id="stable">Stable text</span>
		</div>
	);
}

function addButton(label: string, action: () => void | Promise<void>) {
	const button = document.createElement("button");
	button.textContent = label;
	button.onclick = () =>
		Promise.resolve()
			.then(action)
			.catch((error) => report(false, errorText(error)));
	elementById("controls").append(button);
}

function mountUndoCase() {
	flushSync(() => root.render(<UndoFixture />));
	const fixture = elementById("fixture");
	const clip = firstText(fixture);
	const stable = elementById("stable");
	const stableText = firstText(stable);
	let wrapped: number | undefined;
	const translate = () => {
		if (wrapped !== undefined) return;
		wrapped = wrapTranslatedText(fixture);
		result.textContent = `Translator wrapped ${wrapped} text nodes. Press Ctrl+Z / 撤销 / 復原.`;
	};
	addButton("Wrap text / 模拟翻译 / 模擬翻譯", translate);
	addButton("Undo / 撤销 / 復原 (Ctrl+Z)", () => keyCommand());
	addButton("Redo / 重做 / 重做 (Ctrl+Shift+Z)", () => keyCommand(true));
	addButton("Run regression / 运行回归 / 執行回歸", async () => {
		assert(
			clip.parentNode === fixture,
			"Reload before running the regression again",
		);
		translate();
		if (scenario === "unprotected") {
			assert(
				wrapped === 2 && clip.parentNode === null,
				"Translator did not replace the original text nodes",
			);
			keyCommand();
			await nextPaint();
			assert(
				errors.some((error) => /removeChild/.test(errorText(error))),
				"Old unprotected case did not reproduce removeChild",
			);
			report(
				true,
				`Old unprotected case reproduced after Ctrl+Z.\n${errors.map(errorText).join("\n")}`,
			);
			return;
		}
		assert(
			rootProtected(),
			"Root layout is missing translate=no or class notranslate",
		);
		assert(
			wrapped === 0 &&
				clip.parentNode === fixture &&
				stableText.parentNode === stable,
			"Translator changed protected React node parentage",
		);
		keyCommand();
		await nextPaint();
		assert(errors.length === 0, errors.map(errorText).join("\n"));
		assert(
			clip.parentNode === null && fixture.firstChild === stable,
			"Undo did not remove only the conditional clip text",
		);
		assert(
			stable.firstChild === stableText,
			"Undo replaced the stable React text node",
		);
		keyCommand(true);
		await nextPaint();
		assert(errors.length === 0, errors.map(errorText).join("\n"));
		assert(
			fixture.firstChild instanceof Text &&
				fixture.firstChild.data === "Timeline clip",
			"Redo did not restore clip text",
		);
		assert(
			stable.firstChild === stableText && stableText.parentNode === stable,
			"Redo changed stable text node parentage",
		);
		report(
			true,
			"Root attributes loaded from production layout. Translator wrapped 0 nodes. Ctrl+Z removed the clip; Ctrl+Shift+Z restored it. Stable Text identity/parentage preserved; no React errors.",
		);
	});
}

const expected = {
	en: {
		settings: "Settings",
		export: "Export",
		delete: "Delete",
		projects: "Projects",
	},
	"zh-CN": {
		settings: "设置",
		export: "导出",
		delete: "删除",
		projects: "项目",
	},
	"zh-TW": {
		settings: "設定",
		export: "匯出",
		delete: "刪除",
		projects: "專案",
	},
};
let originalTextNodes: Array<{ node: ChildNode; parent: HTMLElement }> = [];

function checkLocale(locale: AppLocale, alternate: boolean) {
	assert(rootProtected(), "Root layout is missing translation protection");
	const labels = expected[locale];
	assert(
		elementById("raw-label").textContent === labels.settings,
		`Raw JSX did not localize to ${locale}`,
	);
	const dynamic = elementById("dynamic-label");
	assert(
		dynamic.textContent === (alternate ? labels.projects : labels.export),
		`Reactive JSX text did not localize to ${locale}`,
	);
	assert(
		dynamic.title === (alternate ? labels.projects : labels.settings),
		`Reactive title did not localize to ${locale}`,
	);
	assert(
		dynamic.getAttribute("aria-label") ===
			(alternate ? labels.export : labels.delete),
		`Reactive aria-label did not localize to ${locale}`,
	);
	for (const id of ["user-no-translate", "user-ignore"]) {
		const user = elementById(id);
		assert(
			user.textContent === "SettingsProjects" &&
				user.title === "Export" &&
				user.getAttribute("aria-label") === "Delete",
			`${id} user content was translated`,
		);
	}
	assert(
		originalTextNodes.every(
			({ node, parent }) =>
				node.parentNode === parent && parent.firstChild === node,
		),
		"Internal localization replaced or moved a React Text node",
	);
	assert(errors.length === 0, errors.map(errorText).join("\n"));
	report(
		true,
		`${locale}; alternate=${alternate}. Raw JSX, reactive text, title and aria-label translated. translate=no and data-i18n-ignore user content preserved. Original Text identity/parentage intact.`,
	);
}

function LocaleFixture() {
	const { locale, setLocale } = useI18n();
	const [alternate, setAlternate] = useState(false);
	useEffect(() => {
		let cancelled = false;
		void nextPaint().then(() => {
			if (cancelled) return;
			try {
				checkLocale(locale, alternate);
			} catch (error) {
				report(false, errorText(error));
			}
		});
		return () => {
			cancelled = true;
		};
	}, [locale, alternate]);
	return (
		<>
			<div data-i18n-ignore>
				<button type="button" onClick={() => setLocale("en")}>
					English
				</button>
				<button type="button" onClick={() => setLocale("zh-CN")}>
					简体中文
				</button>
				<button type="button" onClick={() => setLocale("zh-TW")}>
					繁體中文
				</button>
				<button type="button" onClick={() => setAlternate((value) => !value)}>
					Toggle text + attributes / 切换内容 / 切換內容
				</button>
				<p>
					Locale: <output id="current-locale">{locale}</output>; alternate:{" "}
					{String(alternate)}
				</p>
			</div>
			<div id="fixture">
				<p id="raw-label">Settings</p>
				<button
					type="button"
					id="dynamic-label"
					title={alternate ? "Projects" : "Settings"}
					aria-label={alternate ? "Export" : "Delete"}
				>
					{alternate ? "Projects" : "Export"}
				</button>
				<button
					type="button"
					id="user-no-translate"
					translate="no"
					title="Export"
					aria-label="Delete"
				>
					Settings<span>Projects</span>
				</button>
				<button
					type="button"
					id="user-ignore"
					data-i18n-ignore
					title="Export"
					aria-label="Delete"
				>
					Settings<span>Projects</span>
				</button>
				<div>
					{alternate && "Delete"}
					<span>Settings</span>
				</div>
			</div>
		</>
	);
}

class RecoveryBoundary extends Component<
	{ children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? <ErrorRecovery /> : this.props.children;
	}
}

function RecoveryFault(): never {
	throw new Error(RECOVERY_ERROR);
}

function RecoveryFixture() {
	const [failed, setFailed] = useState(false);
	if (failed) return <RecoveryFault />;
	function trigger(locale: AppLocale) {
		localStorage.setItem("opencut.locale", locale);
		setFailed(true);
	}
	return (
		<main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
			<h1>Recovery test / 错误恢复测试 / 錯誤復原測試</h1>
			<p>Choose a language to trigger the error. Reload returns here.</p>
			<p>
				选择语言触发错误，重新加载后回到此页。／選擇語言觸發錯誤，重新載入後回到此頁。
			</p>
			<div style={{ display: "flex", gap: 16 }}>
				<button type="button" onClick={() => trigger("en")}>
					English
				</button>
				<button type="button" onClick={() => trigger("zh-CN")}>
					简体中文
				</button>
				<button type="button" onClick={() => trigger("zh-TW")}>
					繁體中文
				</button>
			</div>
		</main>
	);
}

if (scenario === "recovery") {
	flushSync(() =>
		root.render(
			<RecoveryBoundary>
				<RecoveryFixture />
			</RecoveryBoundary>,
		),
	);
} else if (scenario === "i18n") {
	flushSync(() =>
		root.render(
			<I18nProvider>
				<LocaleFixture />
			</I18nProvider>,
		),
	);
	originalTextNodes = ["raw-label", "dynamic-label"].map((id) => {
		const parent = elementById(id);
		return { node: firstText(parent), parent };
	});
} else {
	mountUndoCase();
}
