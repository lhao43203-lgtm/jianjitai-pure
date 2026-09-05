// Opt-in panels can preserve native button activation alongside editor shortcuts.
export function isNativeButtonKey(
	event: Pick<
		KeyboardEvent,
		"target" | "key" | "ctrlKey" | "metaKey" | "altKey"
	>,
): boolean {
	return (
		!event.ctrlKey &&
		!event.metaKey &&
		!event.altKey &&
		[" ", "Enter"].includes(event.key) &&
		Boolean(
			(event.target as Element | null)?.closest?.(
				"[data-native-button-keys] button",
			),
		)
	);
}

export function downloadBlob({
	blob,
	filename,
}: {
	blob: Blob;
	filename: string;
}): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

export function isTypableDOMElement({
	element,
}: {
	element: HTMLElement;
}): boolean {
	if (element.isContentEditable) return true;

	if (element.tagName === "INPUT") {
		return !(element as HTMLInputElement).disabled;
	}

	if (element.tagName === "TEXTAREA") {
		return !(element as HTMLTextAreaElement).disabled;
	}

	return false;
}
