"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/i18n-provider";
import { useEditor } from "@/hooks/use-editor";
import { cn } from "@/utils/ui";

function formatTimeAgo(timestamp: number, locale: string): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	if (seconds < 5) return format.format(0, "second");
	if (seconds < 60) return format.format(-seconds, "second");
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return format.format(-minutes, "minute");
	return format.format(-Math.floor(minutes / 60), "hour");
}

/**
 * Tiny indicator that shows save status in the editor header.
 * Shows: "Saving..." / "Saved just now" / "Saved 2m ago"
 */
export function SaveStatus({ className }: { className?: string }) {
	const editor = useEditor();
	const { locale, t } = useI18n();
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<number | null>(null);
	const [, setTick] = useState(0);

	// Subscribe to save status changes
	useEffect(() => {
		const update = () => {
			setIsSaving(editor.save.getIsSaving());
			setLastSaved(editor.save.getLastSavedAt());
		};
		update();
		return editor.save.subscribeStatus(update);
	}, [editor]);

	// Tick every 15s to update the "Xm ago" display
	useEffect(() => {
		const interval = setInterval(() => setTick((t) => t + 1), 15_000);
		return () => clearInterval(interval);
	}, []);

	// Warn before closing tab with unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (editor.save.getIsDirty()) {
				e.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [editor]);

	if (isSaving) {
		return (
			<span
				className={cn(
					"text-[10px] text-muted-foreground animate-pulse",
					className,
				)}
			>
				Saving...
			</span>
		);
	}

	if (lastSaved) {
		return (
			<span className={cn("text-[10px] text-muted-foreground", className)}>
				{t("Saved")} {formatTimeAgo(lastSaved, locale)}
			</span>
		);
	}

	return null;
}
