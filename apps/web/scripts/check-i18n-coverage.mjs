import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const scriptsDirectory = import.meta.dirname;
const extractorPath = join(scriptsDirectory, "extract-i18n-messages.mjs");
const catalogPath = join(
	scriptsDirectory,
	"..",
	"src",
	"i18n",
	"messages.generated.ts",
);

const extracted = JSON.parse(
	execFileSync(process.execPath, [extractorPath], { encoding: "utf8" }),
);
const sourceFile = ts.createSourceFile(
	catalogPath,
	readFileSync(catalogPath, "utf8"),
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.TS,
);

const pureCatalogPath = join(
	scriptsDirectory,
	"..",
	"src",
	"i18n",
	"messages.pure-editor.ts",
);
const pureSourceFile = ts.createSourceFile(
	pureCatalogPath,
	readFileSync(pureCatalogPath, "utf8"),
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.TS,
);

function readCatalog(variableName, file = sourceFile) {
	let catalog;

	function visit(node) {
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.name.text === variableName &&
			node.initializer &&
			ts.isObjectLiteralExpression(node.initializer)
		) {
			catalog = new Map();
			for (const property of node.initializer.properties) {
				if (!ts.isPropertyAssignment(property)) continue;
				const key = ts.isIdentifier(property.name)
					? property.name.text
					: ts.isStringLiteralLike(property.name)
						? property.name.text
						: undefined;
				const value = ts.isStringLiteralLike(property.initializer)
					? property.initializer.text
					: undefined;
				if (key !== undefined && value !== undefined) catalog.set(key, value);
			}
			return;
		}
		ts.forEachChild(node, visit);
	}

	visit(file);
	if (!catalog) throw new Error(`Missing generated catalog: ${variableName}`);
	return catalog;
}

function placeholders(value) {
	return [...value.matchAll(/\{(\d+)\}/g)]
		.map((match) => match[1])
		.sort()
		.join(",");
}

const sourceMessages = extracted.map(({ source }) => source);
const catalogs = [
	[
		"zh-CN",
		new Map([
			...readCatalog("zhCNGeneratedMessages"),
			...readCatalog("zhCNPureMessages", pureSourceFile),
		]),
	],
	[
		"zh-TW",
		new Map([
			...readCatalog("zhTWGeneratedMessages"),
			...readCatalog("zhTWPureMessages", pureSourceFile),
		]),
	],
];
const failures = [];

for (const [locale, catalog] of catalogs) {
	for (const source of sourceMessages) {
		const translation = catalog.get(source);
		if (!translation) {
			failures.push(`${locale}: missing ${JSON.stringify(source)}`);
			continue;
		}
		if (placeholders(source) !== placeholders(translation)) {
			failures.push(
				`${locale}: placeholders changed in ${JSON.stringify(source)}`,
			);
		}
		if (/I18N\d{4}|VAR\d/i.test(translation)) {
			failures.push(
				`${locale}: translation marker leaked in ${JSON.stringify(source)}`,
			);
		}
	}
}

if (failures.length > 0) {
	process.stderr.write(`${failures.slice(0, 50).join("\n")}\n`);
	process.exitCode = 1;
} else {
	process.stdout.write(
		`i18n coverage: ${sourceMessages.length}/${sourceMessages.length} messages in zh-CN and zh-TW\n`,
	);
}
