"use client";

import { useState } from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { useI18n } from "@/i18n/i18n-provider";
import { invokeAction } from "@/lib/actions";
import { getTransition, hasTransition } from "@/lib/transitions";
import { usePropertiesStore } from "@/stores/properties-store";
import type { TransitionData } from "@/types/timeline";

interface TransitionControlProps {
	transition: TransitionData;
	trackId: string;
	elementId: string;
	locked: boolean;
}

function transitionName(transition: TransitionData) {
	return hasTransition({ transitionType: transition.type })
		? getTransition({ transitionType: transition.type }).name
		: "Unknown transition";
}

function focusClip(elementId: string) {
	document.getElementById(`timeline-clip-${elementId}`)?.focus();
}

export function TransitionDetails({
	transition,
	trackId,
	elementId,
	locked,
	onRemove,
}: TransitionControlProps & { onRemove?: () => void }) {
	const { t } = useI18n();
	return (
		<div data-timeline-effects-popup="" className="space-y-2">
			<h3 className="text-sm font-semibold">{t("Applied transition")}</h3>
			<p className="flex items-center gap-2 text-sm">
				<ArrowRightLeft
					className="size-4 shrink-0 text-cyan-600 dark:text-cyan-400"
					aria-hidden="true"
				/>
				<span>{t(transitionName(transition))}</span>
				<span className="text-xs text-muted-foreground">
					{transition.duration} {t("seconds")}
				</span>
			</p>
			<p className="text-xs text-muted-foreground">
				{t(
					"Transition at the end of this clip. Removing it keeps the clip and its effects.",
				)}
			</p>
			<Button
				variant="outline"
				size="sm"
				className="text-destructive"
				disabled={locked}
				onClick={() => {
					onRemove?.();
					focusClip(elementId);
					invokeAction("remove-transition", { trackId, elementId });
				}}
			>
				<Trash2 className="size-4" aria-hidden="true" />
				{t("Remove transition")}
			</Button>
		</div>
	);
}

export function TimelineTransitionBadge({
	compact,
	...props
}: TransitionControlProps & { compact: boolean }) {
	const { t } = useI18n();
	const [open, setOpen] = useState(false);
	const { selectElement } = useElementSelection();
	const closeClipEffects = usePropertiesStore(
		(state) => state.closeClipEffects,
	);
	const label = `${t("Transition")} · ${t(transitionName(props.transition))}`;
	return (
		<Popover
			open={open}
			onOpenChange={(value) => {
				if (value) {
					selectElement({ trackId: props.trackId, elementId: props.elementId });
					closeClipEffects();
				}
				setOpen(value);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					data-timeline-effects-trigger=""
					variant="text"
					size="sm"
					className="h-5 max-w-full gap-1 rounded border border-white/80 bg-cyan-800 px-1 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700"
					title={label}
					aria-label={label}
					onClick={(event) => event.stopPropagation()}
					onPointerDown={(event) => event.stopPropagation()}
					onMouseDown={(event) => event.stopPropagation()}
				>
					<ArrowRightLeft className="size-3 shrink-0" aria-hidden="true" />
					{!compact && <span className="truncate">{label}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				data-timeline-effects-popup=""
				side="top"
				align="end"
				className="w-72 max-w-[calc(100vw-24px)] p-3"
				onClick={(event) => event.stopPropagation()}
				onPointerDown={(event) => event.stopPropagation()}
				onMouseDown={(event) => event.stopPropagation()}
				onKeyDown={(event) => {
					event.stopPropagation();
					if (event.key === "Escape") setOpen(false);
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					focusClip(props.elementId);
				}}
			>
				<TransitionDetails {...props} onRemove={() => setOpen(false)} />
			</PopoverContent>
		</Popover>
	);
}
