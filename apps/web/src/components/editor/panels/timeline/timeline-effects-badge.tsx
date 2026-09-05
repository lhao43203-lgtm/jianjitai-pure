"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Delete02Icon,
	MagicWand05Icon,
	ViewIcon,
	ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getEffect, hasEffect } from "@/lib/effects/registry";
import { getEffectIndicatorState } from "@/lib/effects/indicator";
import { invokeAction } from "@/lib/actions";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { usePropertiesStore } from "@/stores/properties-store";
import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/utils/ui";
import type { VisualElement } from "@/types/timeline";

export function TimelineEffectsBadge({
	element,
	trackId,
	compact,
	locked,
}: {
	element: VisualElement;
	trackId: string;
	compact: boolean;
	locked: boolean;
}) {
	const { t } = useI18n();
	const [open, setOpen] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const detailsButton = useRef<HTMLButtonElement>(null);
	const { selectElement } = useElementSelection();
	const openDetails = usePropertiesStore((state) => state.openClipEffects);
	const indicator = getEffectIndicatorState(element.effects);
	if (!indicator) return null;
	const target = { trackId, elementId: element.id };
	const focusClip = () =>
		document.getElementById(`timeline-clip-${element.id}`)?.focus();
	const removeOne = (effectId: string) => {
		if (indicator.total === 1) {
			setOpen(false);
			focusClip();
		} else {
			// Do not strand keyboard focus on a row that is about to disappear.
			detailsButton.current?.focus();
		}
		invokeAction("remove-clip-effect", { ...target, effectId });
	};

	return (
		<>
			<Popover
				open={open}
				onOpenChange={(value) => {
					if (value) selectElement(target);
					setOpen(value);
				}}
			>
				<PopoverTrigger asChild>
					<Button
						data-timeline-effects-trigger=""
						type="button"
						variant="text"
						size="sm"
						title={`${t("Manage applied effects")} · ${indicator.label}`}
						aria-label={`${t("Manage applied effects")} · ${indicator.label}`}
						className={cn(
							"h-6 gap-1 rounded border border-white/80 px-1.5 text-xs font-semibold text-white shadow-sm",
							indicator.enabled
								? "bg-violet-700 hover:bg-violet-600"
								: "bg-zinc-700 hover:bg-zinc-600",
						)}
						onClick={(event) => event.stopPropagation()}
						onPointerDown={(event) => event.stopPropagation()}
						onMouseDown={(event) => event.stopPropagation()}
					>
						{compact ? (
							<HugeiconsIcon icon={MagicWand05Icon} className="size-3" />
						) : (
							<span>{t("FX")}</span>
						)}
						<span>{indicator.label}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					data-timeline-effects-popup=""
					side="top"
					align="start"
					className="w-80 max-w-[calc(100vw-24px)] p-3"
					onPointerDown={(event) => event.stopPropagation()}
					onMouseDown={(event) => event.stopPropagation()}
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => {
						event.stopPropagation();
						if (event.key === "Escape") setOpen(false);
					}}
					onCloseAutoFocus={(event) => {
						if (confirming) event.preventDefault();
					}}
				>
					<div className="mb-2 flex items-center justify-between gap-2">
						<h3 className="text-sm font-semibold">{t("Applied effects")}</h3>
						<span className="text-xs text-muted-foreground">
							{indicator.enabled}/{indicator.total} {t("enabled")}
						</span>
					</div>
					<div className="max-h-64 overflow-y-auto">
						{element.effects?.map((effect) => {
							const name = hasEffect({ effectType: effect.type })
								? t(getEffect({ effectType: effect.type }).name)
								: t("Unknown effect");
							return (
								<div
									key={effect.id}
									className="flex items-center gap-2 border-t py-2"
								>
									<span
										className={cn(
											"min-w-0 flex-1 truncate text-sm",
											!effect.enabled && "text-muted-foreground line-through",
										)}
										title={name}
									>
										{name}
									</span>
									<Button
										variant="ghost"
										size="icon"
										disabled={locked}
										aria-label={
											t(effect.enabled ? "Disable effect" : "Enable effect") +
											": " +
											name
										}
										title={t(
											effect.enabled ? "Disable effect" : "Enable effect",
										)}
										onClick={() =>
											invokeAction("toggle-clip-effect", {
												...target,
												effectId: effect.id,
											})
										}
									>
										<HugeiconsIcon
											icon={effect.enabled ? ViewIcon : ViewOffSlashIcon}
											className="size-4"
										/>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										disabled={locked}
										className="text-destructive"
										aria-label={`${t("Delete effect")}: ${name}`}
										title={t("Delete effect")}
										onClick={() => removeOne(effect.id)}
									>
										<HugeiconsIcon icon={Delete02Icon} className="size-4" />
									</Button>
								</div>
							);
						})}
					</div>
					<div className="mt-2 flex justify-between gap-2 border-t pt-2">
						<Button
							ref={detailsButton}
							variant="outline"
							size="sm"
							onClick={() => {
								setOpen(false);
								openDetails(target);
							}}
						>
							{t("Detailed settings")}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={locked}
							className="text-destructive"
							onClick={() => {
								setConfirming(true);
								setOpen(false);
							}}
						>
							{t("Remove all effects")}
						</Button>
					</div>
				</PopoverContent>
			</Popover>
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent
					data-timeline-effects-popup=""
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						focusClip();
					}}
				>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("Remove all effects?")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t(
								"This removes all effects from this clip. You can undo this action.",
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
						<AlertDialogAction
							disabled={locked}
							onClick={() => {
								focusClip();
								invokeAction("remove-all-clip-effects", target);
							}}
						>
							{t("Remove all effects")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
