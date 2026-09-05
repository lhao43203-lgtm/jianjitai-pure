import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TAB_KEYS } from "@/stores/assets-panel-store";
import { ACTIONS } from "@/lib/actions/definitions";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
describe("pure editor boundaries", () => {
	test("the audio panel uses local project media without mounting the online sound library", () => {
		const panel = readFileSync(
			resolve(
				root,
				"apps/web/src/components/editor/panels/assets/views/audio-combined.tsx",
			),
			"utf8",
		);
		expect(panel).not.toMatch(/SoundsView|fetch\(|useSoundsStore/);
		expect(panel).toContain("editor.media.getAssets()");
	});
	test("the editing workspace exposes no AI tab or keyboard action", () => {
		expect(TAB_KEYS).toEqual([
			"media",
			"text",
			"captions",
			"audio",
			"elements",
			"visuals",
			"brandkit",
			"settings",
		]);
		expect(
			Object.values(ACTIONS).some((action) => String(action.category) === "ai"),
		).toBe(false);
		expect(Object.keys(ACTIONS).some((key) => /(^|-)ai(-|$)/.test(key))).toBe(
			false,
		);
	});
	test("AI clients, services and model dependencies are absent", () => {
		for (const path of [
			"apps/web/src/lib/ai-client.ts",
			"apps/web/src/hooks/use-ai-status.ts",
			"apps/web/src/hooks/use-embedding-indexer.ts",
			"services/ai-backend/app/main.py",
			"services/whisper-service/app.py",
			"services/tts-service/app.py",
		])
			expect(existsSync(resolve(root, path))).toBe(false);
		const manifest = JSON.parse(
			readFileSync(resolve(root, "apps/web/package.json"), "utf8"),
		);
		expect(manifest.dependencies["@huggingface/transformers"]).toBeUndefined();
		expect(
			readFileSync(resolve(root, "docker-compose.yml"), "utf8"),
		).not.toMatch(/ollama|whisper|tts-service|ai-backend/);
	});
});
