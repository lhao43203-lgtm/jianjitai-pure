"use client";

import { useCallback, useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-view";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FPS_PRESETS } from "@/constants/project-constants";
import { useEditor } from "@/hooks/use-editor";
import { useEditorStore } from "@/stores/editor-store";
import { dimensionToAspectRatio } from "@/utils/geometry";
import {
	Section,
	SectionContent,
	SectionHeader,
	SectionTitle,
} from "@/components/editor/panels/properties/section";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/ui";
import type { ProxyResolution } from "@/services/storage/types";

const ORIGINAL_PRESET_VALUE = "original";

export function findPresetIndexByAspectRatio({
	presets,
	targetAspectRatio,
}: {
	presets: Array<{ width: number; height: number }>;
	targetAspectRatio: string;
}) {
	for (let index = 0; index < presets.length; index++) {
		const preset = presets[index];
		const presetAspectRatio = dimensionToAspectRatio({
			width: preset.width,
			height: preset.height,
		});
		if (presetAspectRatio === targetAspectRatio) {
			return index;
		}
	}
	return -1;
}

export function SettingsView() {
	return (
		<PanelView contentClassName="px-0" hideHeader>
			<div className="flex flex-col">
				<Section showTopBorder={false}>
					<SectionContent>
						<ProjectInfoContent />
					</SectionContent>
				</Section>
				<Section>
					<SectionHeader>
						<SectionTitle>Proxy Editing</SectionTitle>
					</SectionHeader>
					<SectionContent>
						<ProxyEditingSection />
					</SectionContent>
				</Section>
			</div>
		</PanelView>
	);
}

function ProjectInfoContent() {
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const { canvasPresets } = useEditorStore();

	const currentCanvasSize = activeProject.settings.canvasSize;
	const currentAspectRatio = dimensionToAspectRatio(currentCanvasSize);
	const originalCanvasSize = activeProject.settings.originalCanvasSize ?? null;
	const presetIndex = findPresetIndexByAspectRatio({
		presets: canvasPresets,
		targetAspectRatio: currentAspectRatio,
	});
	const selectedPresetValue =
		presetIndex !== -1 ? presetIndex.toString() : ORIGINAL_PRESET_VALUE;

	const handleAspectRatioChange = ({ value }: { value: string }) => {
		if (value === ORIGINAL_PRESET_VALUE) {
			const canvasSize = originalCanvasSize ?? currentCanvasSize;
			editor.project.updateSettings({
				settings: { canvasSize },
			});
			return;
		}
		const index = parseInt(value, 10);
		const preset = canvasPresets[index];
		if (preset) {
			editor.project.updateSettings({ settings: { canvasSize: preset } });
		}
	};

	const handleFpsChange = ({ value }: { value: string }) => {
		const fps = parseFloat(value);
		editor.project.updateSettings({ settings: { fps } });
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<Label>Name</Label>
				<span className="text-sm leading-none">
					{activeProject.metadata.name}
				</span>
			</div>
			<div className="flex flex-col gap-2">
				<Label>Aspect ratio</Label>
				<Select
					value={selectedPresetValue}
					onValueChange={(value) => handleAspectRatioChange({ value })}
				>
					<SelectTrigger className="w-fit">
						<SelectValue placeholder="Select an aspect ratio" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ORIGINAL_PRESET_VALUE}>Original</SelectItem>
						{canvasPresets.map((preset, index) => {
							const label = dimensionToAspectRatio({
								width: preset.width,
								height: preset.height,
							});
							return (
								<SelectItem key={label} value={index.toString()}>
									{label}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			<div className="flex flex-col gap-2">
				<Label>Frame rate</Label>
				<Select
					value={activeProject.settings.fps.toString()}
					onValueChange={(value) => handleFpsChange({ value })}
				>
					<SelectTrigger className="w-fit">
						<SelectValue placeholder="Select a frame rate" />
					</SelectTrigger>
					<SelectContent>
						{FPS_PRESETS.map((preset) => (
							<SelectItem key={preset.value} value={preset.value}>
								{preset.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

// ----- Proxy Editing Section -----

const PROXY_RESOLUTION_OPTIONS: Array<{
	value: ProxyResolution;
	label: string;
	description: string;
}> = [
	{
		value: "480p",
		label: "480p",
		description: "Smallest files, fastest editing",
	},
	{
		value: "720p",
		label: "720p",
		description: "Good balance of quality and speed",
	},
	{
		value: "1080p",
		label: "1080p",
		description: "Higher quality preview, larger files",
	},
];

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProxyEditingSection() {
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const mediaAssets = editor.media.getAssets();
	const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
	const [progressMap, setProgressMap] = useState<Record<string, number>>({});

	const proxyEnabled = activeProject.settings.proxyEditing ?? false;
	const proxyResolution = activeProject.settings.proxyResolution ?? "720p";

	const highResAssets = mediaAssets.filter(
		(a) =>
			a.type === "video" &&
			a.width &&
			a.height &&
			(a.width > 1920 || a.height > 1080),
	);

	const toggleProxy = useCallback(() => {
		editor.project.updateSettings({
			settings: { proxyEditing: !proxyEnabled },
		});
	}, [editor, proxyEnabled]);

	const handleResolutionChange = useCallback(
		(value: string) => {
			editor.project.updateSettings({
				settings: { proxyResolution: value as ProxyResolution },
			});
		},
		[editor],
	);

	const handleGenerate = useCallback(
		async (assetId: string) => {
			const projectId = activeProject.metadata.id;
			setGeneratingIds((prev) => new Set(prev).add(assetId));
			setProgressMap((prev) => ({ ...prev, [assetId]: 0 }));

			await editor.media.generateProxyForAsset({
				assetId,
				projectId,
				resolution: proxyResolution,
				onProgress: (progress) => {
					setProgressMap((prev) => ({ ...prev, [assetId]: progress }));
				},
			});

			setGeneratingIds((prev) => {
				const next = new Set(prev);
				next.delete(assetId);
				return next;
			});
			setProgressMap((prev) => {
				const next = { ...prev };
				delete next[assetId];
				return next;
			});
		},
		[activeProject, editor, proxyResolution],
	);

	const handleGenerateAll = useCallback(async () => {
		const assetsNeedingProxy = highResAssets.filter((a) => !a.proxy);
		for (const asset of assetsNeedingProxy) {
			await handleGenerate(asset.id);
		}
	}, [highResAssets, handleGenerate]);

	const handleDelete = useCallback(
		async (assetId: string) => {
			const projectId = activeProject.metadata.id;
			await editor.media.deleteProxyForAsset({ assetId, projectId });
		},
		[activeProject, editor],
	);

	return (
		<div className="flex flex-col gap-3">
			<p className="text-[11px] text-muted-foreground leading-relaxed">
				Generate lower-resolution copies of high-res videos (&gt;1080p) for
				smooth preview playback. Exports always use original files.
			</p>

			<div className="flex items-center justify-between">
				<Label className="text-xs">Enable proxy editing</Label>
				<button
					type="button"
					onClick={toggleProxy}
					className={cn(
						"relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
						proxyEnabled ? "bg-primary" : "bg-input",
					)}
				>
					<span
						className={cn(
							"pointer-events-none inline-block size-3 rounded-full bg-background shadow-lg ring-0 transition-transform",
							proxyEnabled ? "translate-x-3" : "translate-x-0",
						)}
					/>
				</button>
			</div>

			{proxyEnabled && (
				<>
					<div className="flex flex-col gap-1.5">
						<Label className="text-xs">Proxy resolution</Label>
						<Select
							value={proxyResolution}
							onValueChange={handleResolutionChange}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PROXY_RESOLUTION_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label} — {opt.description}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{highResAssets.length > 0 && (
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center justify-between">
								<Label className="text-xs">
									High-res videos ({highResAssets.length})
								</Label>
								{highResAssets.some((a) => !a.proxy) && (
									<button
										type="button"
										className="text-[9px] text-primary hover:underline"
										onClick={handleGenerateAll}
										disabled={generatingIds.size > 0}
									>
										Generate all
									</button>
								)}
							</div>
							<div className="flex flex-col gap-1">
								{highResAssets.map((asset) => {
									const isGenerating = generatingIds.has(asset.id);
									const progress = progressMap[asset.id];
									return (
										<div
											key={asset.id}
											className="flex items-center gap-2 rounded-md border px-2 py-1.5"
										>
											<span
												className={cn(
													"size-1.5 rounded-full shrink-0",
													asset.proxy
														? "bg-green-500"
														: isGenerating
															? "bg-yellow-500 animate-pulse"
															: "bg-muted-foreground/30",
												)}
											/>
											<span className="text-[10px] truncate flex-1 min-w-0">
												{asset.name}
											</span>
											<span className="text-[9px] text-muted-foreground shrink-0">
												{asset.width}x{asset.height}
											</span>
											{asset.proxy && (
												<Badge
													variant="secondary"
													className="text-[8px] px-1 py-0 shrink-0"
												>
													{formatBytes(asset.proxy.fileSize)}
												</Badge>
											)}
											{isGenerating && (
												<span className="text-[9px] text-muted-foreground shrink-0">
													{Math.round(progress * 100)}%
												</span>
											)}
											{!asset.proxy && !isGenerating && (
												<button
													type="button"
													className="text-[9px] text-primary hover:underline shrink-0"
													onClick={() => handleGenerate(asset.id)}
												>
													Generate
												</button>
											)}
											{isGenerating && (
												<button
													type="button"
													className="text-[9px] text-destructive hover:underline shrink-0"
													onClick={() =>
														editor.media.cancelProxyGeneration(asset.id)
													}
												>
													Cancel
												</button>
											)}
											{asset.proxy && !isGenerating && (
												<button
													type="button"
													className="text-[9px] text-destructive hover:underline shrink-0"
													onClick={() => handleDelete(asset.id)}
												>
													Delete
												</button>
											)}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{highResAssets.length === 0 && (
						<p className="text-[10px] text-muted-foreground">
							No high-resolution videos (&gt;1080p) in this project. Proxy
							editing will apply to future imports.
						</p>
					)}
				</>
			)}
		</div>
	);
}
