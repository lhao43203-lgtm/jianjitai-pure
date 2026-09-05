import { describe, expect, test } from "bun:test";
import { TAB_KEYS } from "./assets-panel-store";

describe("editing workspace tabs", () => {
	test("keeps generative studio tools out of the editor", () => {
		expect(TAB_KEYS).not.toContain("ai");
		expect(TAB_KEYS).not.toContain("videogen");
	});
});
