import { describe, expect, test } from "bun:test";
import { getEffectIndicatorState } from "@/lib/effects/indicator";
import type { Effect } from "@/types/effects";

function effects(enabledStates: boolean[]): Effect[] {
	return enabledStates.map((enabled, index) => ({
		id: String(index),
		type: "test",
		params: {},
		enabled,
	}));
}

describe("getEffectIndicatorState", () => {
	test("returns no indicator when a clip has no effects", () => {
		expect(getEffectIndicatorState([])).toBeNull();
	});

	test("shows a total when every effect is enabled", () => {
		expect(getEffectIndicatorState(effects([true, true]))).toEqual({
			total: 2,
			enabled: 2,
			label: "2",
			kind: "all-enabled",
		});
	});

	test("shows enabled and total counts for mixed or disabled effects", () => {
		expect(getEffectIndicatorState(effects([true, false]))?.label).toBe("1/2");
		expect(getEffectIndicatorState(effects([false, false]))).toMatchObject({
			label: "0/2",
			kind: "all-disabled",
		});
	});
});
