import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import ts from "typescript";

const sourceRoot = join(import.meta.dirname, "..", "src");
const uiAttributeNames = new Set([
	"alt",
	"aria-description",
	"aria-label",
	"placeholder",
	"title",
]);
const uiComponentPropNames = new Set([
	"actionLabel",
	"body",
	"buttonLabel",
	"description",
	"emptyMessage",
	"errorMessage",
	"helperText",
	"hint",
	"label",
	"message",
	"note",
	"subtitle",
	"text",
	"tooltip",
]);
const uiObjectKeys = new Set([
	"actionLabel",
	"badge",
	"buttonLabel",
	"capcut",
	"category",
	"content",
	"cta",
	"description",
	"descript",
	"details",
	"emptyMessage",
	"errorMessage",
	"feature",
	"features",
	"helperText",
	"hint",
	"items",
	"kapwing",
	"label",
	"message",
	"name",
	"note",
	"opencut",
	"period",
	"placeholder",
	"specs",
	"status",
	"subtitle",
	"tags",
	"text",
	"title",
	"tooltip",
	"resolve",
	"runway",
]);
const uiCallNames = new Set([
	"t",
	"alert",
	"confirm",
	"setError",
	"toast",
	"toast.error",
	"toast.info",
	"toast.loading",
	"toast.success",
	"toast.warning",
]);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			if (
				entry.name === "__tests__" ||
				entry.name === "api" ||
				entry.name === "i18n" ||
				entry.name.startsWith(".")
			) {
				return [];
			}
			return walk(path);
		}
		return [path];
	});
}

function normalize(value) {
	return value
		.replaceAll("&copy;", "©")
		.replaceAll("&gt;", ">")
		.replaceAll("&larr;", "←")
		.replaceAll("&ldquo;", "“")
		.replaceAll("&middot;", "·")
		.replaceAll("&quot;", '"')
		.replaceAll("&rdquo;", "”")
		.replace(/\s+/g, " ")
		.trim();
}

function containsNaturalLanguage(value) {
	if (!/[A-Za-z]{2}/.test(value)) return false;
	if (/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/.test(value)) return false;
	if (/^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i.test(value)) return false;
	if (/^[a-z0-9_-]+\/[a-z0-9_./-]+$/i.test(value)) return false;
	return true;
}

function propertyName(node) {
	if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
	return undefined;
}

function callName(expression) {
	if (ts.isIdentifier(expression)) return expression.text;
	if (ts.isPropertyAccessExpression(expression)) {
		return `${callName(expression.expression)}.${expression.name.text}`;
	}
	return "";
}

function templateSource(node) {
	if (ts.isNoSubstitutionTemplateLiteral(node)) return normalize(node.text);
	if (!ts.isTemplateExpression(node)) return undefined;

	let value = node.head.text;
	for (const span of node.templateSpans) {
		value += `{${value.match(/\{\d+\}/g)?.length ?? 0}}${span.literal.text}`;
	}
	return normalize(value);
}

function jsxParentTag(node) {
	const parent = node.parent;
	if (!ts.isJsxElement(parent)) return "";
	return parent.openingElement.tagName.getText().toLowerCase();
}

function isComponentAttribute(node) {
	if (!ts.isJsxAttribute(node)) return false;
	const parent = node.parent.parent;
	if (!ts.isJsxOpeningElement(parent) && !ts.isJsxSelfClosingElement(parent)) {
		return false;
	}
	return /^[A-Z]/.test(parent.tagName.getText());
}

function expressionSources(node) {
	if (ts.isStringLiteralLike(node)) return [normalize(node.text)];
	const template = templateSource(node);
	if (template) return [template];
	if (ts.isParenthesizedExpression(node))
		return expressionSources(node.expression);
	if (ts.isConditionalExpression(node)) {
		return [
			...expressionSources(node.whenTrue),
			...expressionSources(node.whenFalse),
		];
	}
	if (
		ts.isBinaryExpression(node) &&
		(node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
			node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
	) {
		return expressionSources(node.right);
	}
	if (ts.isArrayLiteralExpression(node)) {
		return node.elements.flatMap(expressionSources);
	}
	return [];
}

const messages = new Map();

function add(value, file, node) {
	const source = normalize(value);
	if (!source || !containsNaturalLanguage(source)) return;

	const position = node
		.getSourceFile()
		.getLineAndCharacterOfPosition(node.getStart());
	const location = `${relative(sourceRoot, file).replaceAll("\\", "/")}:${position.line + 1}`;
	const locations = messages.get(source) ?? new Set();
	locations.add(location);
	messages.set(source, locations);
}

for (const file of walk(sourceRoot)) {
	if (!statSync(file).isFile() || ![".ts", ".tsx"].includes(extname(file))) {
		continue;
	}

	const sourceText = readFileSync(file, "utf8");
	const sourceFile = ts.createSourceFile(
		file,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	function visit(node) {
		if (ts.isJsxText(node)) {
			const parentTag = jsxParentTag(node);
			if (!["code", "kbd", "pre", "script", "style"].includes(parentTag)) {
				add(node.text, file, node);
			}
		}

		if (
			ts.isJsxAttribute(node) &&
			(uiAttributeNames.has(node.name.text) ||
				(isComponentAttribute(node) &&
					uiComponentPropNames.has(node.name.text)))
		) {
			if (node.initializer && ts.isStringLiteral(node.initializer)) {
				add(node.initializer.text, file, node.initializer);
			} else if (
				node.initializer &&
				ts.isJsxExpression(node.initializer) &&
				node.initializer.expression
			) {
				for (const source of expressionSources(node.initializer.expression)) {
					add(source, file, node.initializer.expression);
				}
			}
		}

		if (
			ts.isJsxExpression(node) &&
			node.expression &&
			!ts.isJsxAttribute(node.parent) &&
			!["code", "kbd", "pre", "script", "style"].includes(jsxParentTag(node))
		) {
			for (const source of expressionSources(node.expression)) {
				add(source, file, node.expression);
			}
		}

		if (ts.isPropertyAssignment(node)) {
			const key = propertyName(node.name);
			if (key && uiObjectKeys.has(key)) {
				for (const source of expressionSources(node.initializer)) {
					add(source, file, node.initializer);
				}
			}
		}

		if (
			ts.isCallExpression(node) &&
			uiCallNames.has(callName(node.expression))
		) {
			const firstArgument = node.arguments[0];
			if (firstArgument) {
				if (callName(node.expression) === "t") {
					for (const source of expressionSources(firstArgument))
						add(source, file, firstArgument);
				} else if (ts.isStringLiteralLike(firstArgument)) {
					add(firstArgument.text, file, firstArgument);
				} else {
					const source = templateSource(firstArgument);
					if (source) add(source, file, firstArgument);
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
}

const output = [...messages.entries()]
	.map(([source, locations]) => ({ source, locations: [...locations].sort() }))
	.sort((left, right) => left.source.localeCompare(right.source));

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
