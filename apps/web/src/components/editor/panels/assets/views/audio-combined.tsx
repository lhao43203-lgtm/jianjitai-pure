"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/hooks/use-editor";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useI18n } from "@/i18n/i18n-provider";
import { invokeAction } from "@/lib/actions";
import {
	getAudioImportFiles,
	getLocalAudioAssets,
} from "@/lib/media/local-audio";
import { processMediaAssets } from "@/lib/media/processing";
import type { MediaAsset } from "@/types/assets";

export function AudioCombinedView() {
	const editor = useEditor();
	const { t } = useI18n();
	const assets = getLocalAudioAssets(editor.media.getAssets());
	const playerRef = useRef<HTMLAudioElement>(null);
	const previewUrl = useRef<string | null>(null);
	const previewRequest = useRef(0);
	const mounted = useRef(true);
	const importing = useRef(false);
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		mounted.current = true;
		const player = playerRef.current;
		const unsubscribe = editor.playback.subscribe(() => {
			if (!editor.playback.getIsPlaying() || player?.paused) return;
			previewRequest.current += 1;
			player?.pause();
			setPreviewId(null);
		});
		return () => {
			unsubscribe();
			mounted.current = false;
			previewRequest.current += 1;
			player?.pause();
			player?.removeAttribute("src");
			player?.load();
			if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
		};
	}, [editor]);

	const stopPreview = () => {
		previewRequest.current += 1;
		playerRef.current?.pause();
		setPreviewId(null);
	};

	const preview = async (asset: MediaAsset) => {
		const player = playerRef.current;
		if (!player) return;
		if (previewId === asset.id) {
			stopPreview();
			return;
		}
		stopPreview();
		if (editor.playback.getIsPlaying()) editor.playback.pause();
		if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
		previewUrl.current = URL.createObjectURL(asset.file);
		player.src = previewUrl.current;
		const request = previewRequest.current;
		setPreviewId(asset.id);
		try {
			await player.play();
		} catch {
			if (request !== previewRequest.current || !mounted.current) return;
			setPreviewId(null);
			toast.error(t("Unable to preview this audio. Try an MP3 or WAV file."));
		}
	};

	const importAudio = async (files: FileList) => {
		if (importing.current || files.length === 0) return;
		const audioFiles = getAudioImportFiles(Array.from(files));
		if (audioFiles.length !== files.length)
			toast.error(
				t(
					"Only audio files can be imported here. Use Media for videos and images.",
				),
			);
		if (audioFiles.length === 0) return;
		const projectId = editor.project.getActive().metadata.id;
		importing.current = true;
		setIsImporting(true);
		setProgress(0);
		let saved = 0;
		try {
			const processed = await processMediaAssets({
				files: audioFiles,
				onProgress: ({ progress }) => {
					if (mounted.current) setProgress(progress);
				},
			});
			for (const asset of processed) {
				if (editor.project.getActiveOrNull()?.metadata.id !== projectId) {
					if (asset.url) URL.revokeObjectURL(asset.url);
					continue;
				}
				const id = await editor.media.addMediaAsset({ projectId, asset });
				if (editor.media.getAssets().some((item) => item.id === id)) saved += 1;
				else if (asset.url) URL.revokeObjectURL(asset.url);
			}
			if (!mounted.current) return;
			if (saved > 0) toast.success(t("Audio imported"));
			if (saved !== audioFiles.length)
				toast.error(
					t(
						"Some audio could not be imported. Check the file format and available browser storage.",
					),
				);
		} catch {
			if (mounted.current)
				toast.error(
					t(
						"Some audio could not be imported. Check the file format and available browser storage.",
					),
				);
		} finally {
			importing.current = false;
			if (mounted.current) setIsImporting(false);
		}
	};
	const { isDragOver, dragProps, openFilePicker, fileInputProps } =
		useFileUpload({
			accept: "audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac",
			multiple: true,
			onFilesSelected: (files) => {
				void importAudio(files);
			},
		});

	return (
		<div
			{...dragProps}
			data-native-button-keys
			className="relative flex h-full min-h-0 flex-col"
		>
			<input {...fileInputProps} aria-label={t("Upload audio")} />
			{/* biome-ignore lint/a11y/useMediaCaption: Preview of the user's unmodified audio file. */}
			<audio
				ref={playerRef}
				className="hidden"
				preload="none"
				aria-label={t("Audio preview")}
				onEnded={stopPreview}
			/>
			<div className="space-y-3 border-b p-3">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-sm font-semibold">
						{t("My audio")}{" "}
						<span className="text-muted-foreground tabular-nums">
							({assets.length})
						</span>
					</h2>
					<Button
						size="sm"
						variant="outline"
						onClick={openFilePicker}
						disabled={isImporting}
					>
						<Upload className="size-4" aria-hidden="true" />
						{t("Upload audio")}
					</Button>
				</div>
				<p className="text-xs leading-relaxed text-muted-foreground">
					{t(
						"Audio is shared with Media and saved in this browser, not the cloud. Keep your original files.",
					)}
				</p>
				{isImporting && (
					<p role="status" className="text-xs tabular-nums">
						{t("Importing audio")}: {progress}%
					</p>
				)}
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{assets.length === 0 ? (
					<div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center">
						<Music2
							className="size-7 text-muted-foreground"
							aria-hidden="true"
						/>
						<p className="text-sm font-medium">{t("No audio imported yet")}</p>
						<p className="text-xs leading-relaxed text-muted-foreground">
							{t(
								"Upload or drop your music, voice recordings, or sound effects here. MP3 and WAV are recommended.",
							)}
						</p>
						<Button size="sm" onClick={openFilePicker} disabled={isImporting}>
							{t("Choose audio files")}
						</Button>
					</div>
				) : (
					<ul className="space-y-2" aria-label={t("Imported audio")}>
						{assets.map((asset) => (
							<li key={asset.id} className="space-y-2 rounded-lg border p-3">
								<div className="flex min-w-0 items-center gap-2">
									<Music2
										className="size-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<span
										className="min-w-0 flex-1 truncate text-sm"
										title={asset.name}
										data-i18n-ignore
									>
										{asset.name}
									</span>
									<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
										{Number.isFinite(asset.duration)
											? `${asset.duration?.toFixed(1)} ${t("seconds")}`
											: "—"}
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										variant={previewId === asset.id ? "secondary" : "ghost"}
										onClick={() => void preview(asset)}
										aria-label={`${t(previewId === asset.id ? "Stop preview" : "Preview audio")}: ${asset.name}`}
										aria-pressed={previewId === asset.id}
									>
										{previewId === asset.id ? (
											<Pause className="size-4" aria-hidden="true" />
										) : (
											<Play className="size-4" aria-hidden="true" />
										)}
										{t(
											previewId === asset.id ? "Stop preview" : "Preview audio",
										)}
									</Button>
									<Button
										size="sm"
										variant="outline"
										aria-label={`${t("Add to timeline")}: ${asset.name}`}
										onClick={() => {
											stopPreview();
											invokeAction("add-local-audio", { mediaId: asset.id });
										}}
									>
										<Plus className="size-4" aria-hidden="true" />
										{t("Add to timeline")}
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
			{isDragOver && (
				<div
					className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-primary bg-background/95 p-4 text-center text-sm"
					role="status"
				>
					{t("Drop audio files to import")}
				</div>
			)}
		</div>
	);
}
