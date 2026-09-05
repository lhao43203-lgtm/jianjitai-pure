import { expect, test } from "bun:test";
import { isNativeButtonKey } from "./browser";

test("opted-in audio buttons retain native Space/Enter activation without swallowing undo", () => {
	const target = {
		closest: (selector: string) =>
			selector === "[data-native-button-keys] button" ? {} : null,
	} as unknown as Element;
	const event = {
		target,
		key: " ",
		ctrlKey: false,
		metaKey: false,
		altKey: false,
	};
	expect(isNativeButtonKey(event)).toBe(true);
	expect(isNativeButtonKey({ ...event, key: "Enter" })).toBe(true);
	expect(isNativeButtonKey({ ...event, key: "z", ctrlKey: true })).toBe(false);
	expect(isNativeButtonKey({ ...event, ctrlKey: true })).toBe(false);
	expect(isNativeButtonKey({ ...event, target: null })).toBe(false);
	expect(
		isNativeButtonKey({
			...event,
			target: { closest: () => null } as unknown as Element,
		}),
	).toBe(false);
});
