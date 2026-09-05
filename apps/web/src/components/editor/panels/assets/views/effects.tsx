"use client";

import { useEffect, useRef, useCallback } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-view";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { getAllEffects, EFFECT_TARGET_ELEMENT_TYPES } from "@/lib/effects";
import {
	effectPreviewService,
	onPreviewImageReady,
} from "@/services/renderer/effect-preview";
import { useEditor } from "@/hooks/use-editor";
import { buildEffectElement } from "@/lib/timeline/element-utils";
import type { EffectDefinition } from "@/types/effects";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n-provider";
import { isVisualElement } from "@/lib/timeline";

export function EffectsView() {
	const effects = getAllEffects();

	return (
		<PanelView title="Effects">
			<EffectsGrid effects={effects} />
		</PanelView>
	);
}

function EffectsGrid({ effects }: { effects: EffectDefinition[] }) {
	return (
		<div
			className="grid gap-2"
			style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
		>
			{effects.map((effect) => (
				<EffectItem key={effect.type} effect={effect} />
			))}
		</div>
	);
}

function EffectPreviewCanvas({ effectType }: { effectType: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const render = () => {
			if (canvasRef.current) {
				effectPreviewService.renderPreview({
					effectType,
					params: {},
					targetCanvas: canvasRef.current,
				});
			}
		};

		render();
		return onPreviewImageReady({ callback: render });
	}, [effectType]);

	return <canvas ref={canvasRef} className="size-full" />;
}

function EffectItem({ effect }: { effect: EffectDefinition }) {
	const editor = useEditor();
	const { t } = useI18n();
	const selection = editor.selection.getSelectedElements();
	const target = selection.length === 1 ? selection[0] : undefined;
	const targetTrack = target
		? editor.timeline.getTrackById({ trackId: target.trackId })
		: undefined;
	const targetElement = targetTrack?.elements.find(
		(element) => element.id === target?.elementId,
	);
	const canApply =
		targetElement && isVisualElement(targetElement) && !targetTrack?.locked;

	const handleAddToTimeline = useCallback(() => {
		const currentTime = editor.playback.getCurrentTime();
		const element = buildEffectElement({
			effectType: effect.type,
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			placement: { mode: "auto", trackType: "effect" },
			element,
		});
	}, [editor, effect.type]);

	const preview = <EffectPreviewCanvas effectType={effect.type} />;

	return (
		<div className="min-w-0">
			<DraggableItem
				name={t(effect.name)}
				preview={preview}
				dragData={{
					id: effect.type,
					name: effect.name,
					type: "effect",
					effectType: effect.type,
					targetElementTypes: EFFECT_TARGET_ELEMENT_TYPES,
				}}
				onAddToTimeline={handleAddToTimeline}
				aspectRatio={1}
				isRounded
				variant="card"
				containerClassName="w-full"
			/>
			<Button
				variant="ghost"
				size="sm"
				className="h-auto min-h-7 w-full whitespace-normal px-1 text-[11px]"
				disabled={!canApply}
				title={t("Apply to selected clip")}
				aria-label={`${t("Apply to selected clip")}: ${t(effect.name)}`}
				onClick={() => {
					if (target && canApply)
						editor.timeline.addClipEffect({
							...target,
							effectType: effect.type,
						});
				}}
			>
				{t("Apply to selected clip")}
			</Button>
		</div>
	);
}
