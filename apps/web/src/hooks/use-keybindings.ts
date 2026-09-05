import { useEffect } from "react";
import { invokeAction } from "@/lib/actions";
import { useKeybindingsStore } from "@/stores/keybindings-store";
import { isNativeButtonKey } from "@/utils/browser";

/**
 * a composable that hooks to the caller component's
 * lifecycle and hooks to the keyboard events to fire
 * the appropriate actions based on keybindings
 */
export function useKeybindingsListener() {
	const { keybindings, getKeybindingString, keybindingsEnabled, isRecording } =
		useKeybindingsStore();

	useEffect(() => {
		const eventOptions: AddEventListenerOptions = { capture: true };
		const handleKeyDown = (ev: KeyboardEvent) => {
			// do not check keybinds if the mode is disabled
			if (!keybindingsEnabled) return;
			// ignore key events if user is changing keybindings
			if (isRecording) return;
			if (isNativeButtonKey(ev)) return;

			// Effect popovers own their keys; never delete a clip beneath them.
			if (
				(ev.target as Element | null)?.closest?.(
					"[data-timeline-effects-popup]",
				)
			)
				return;
			// Let a focused badge open with Space/Enter, without playing or deleting
			// the underlying clip. Undo/redo remain available after the popover closes.
			if (
				(ev.target as Element | null)?.closest?.(
					"[data-timeline-effects-trigger]",
				) &&
				[" ", "Enter", "Delete", "Backspace"].includes(ev.key)
			)
				return;
			const binding = getKeybindingString(ev);
			if (!binding) return;

			const boundAction = keybindings[binding];
			if (!boundAction) return;

			const activeElement = document.activeElement;
			const isTextInput =
				activeElement &&
				(activeElement.tagName === "INPUT" ||
					activeElement.tagName === "TEXTAREA" ||
					(activeElement as HTMLElement).isContentEditable);

			if (isTextInput) return;

			ev.preventDefault();

			switch (boundAction) {
				case "seek-forward":
					invokeAction("seek-forward", { seconds: 1 }, "keypress");
					break;
				case "seek-backward":
					invokeAction("seek-backward", { seconds: 1 }, "keypress");
					break;
				case "jump-forward":
					invokeAction("jump-forward", { seconds: 5 }, "keypress");
					break;
				case "jump-backward":
					invokeAction("jump-backward", { seconds: 5 }, "keypress");
					break;
				default:
					invokeAction(boundAction, undefined, "keypress");
			}
		};

		document.addEventListener("keydown", handleKeyDown, eventOptions);

		return () => {
			document.removeEventListener("keydown", handleKeyDown, eventOptions);
		};
	}, [keybindings, getKeybindingString, keybindingsEnabled, isRecording]);
}

/**
 * this composable allows for the UI component to be disabled if the component in question is mounted
 */
export function useKeybindingDisabler() {
	const { disableKeybindings, enableKeybindings } = useKeybindingsStore();

	return {
		disableKeybindings,
		enableKeybindings,
	};
}
