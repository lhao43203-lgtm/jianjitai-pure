"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEditor } from "@/hooks/use-editor";
import { useI18n } from "@/i18n/i18n-provider";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import { TracksSnapshotCommand } from "@/lib/commands/timeline/tracks-snapshot";
import { buildSubtitleTrack } from "@/lib/captions/subtitle-track";
import {
	parseSubtitleFile,
	serializeSubtitles,
	type SubtitleCue,
} from "@/lib/captions/subtitle-file";
import { toast } from "sonner";
import type { TextTrack } from "@/types/timeline";

export function Captions() {
	const editor = useEditor();
	const { t } = useI18n();
	const { selectElement } = useElementSelection();
	const input = useRef<HTMLInputElement>(null);
	const [text, setText] = useState("");
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(3);
	const [selectedId, setSelectedId] = useState("");
	const tracks = editor.timeline.getTracks();
	const textTracks = tracks.filter(
		(track): track is TextTrack => track.type === "text",
	);
	const selected =
		textTracks.find((track) => track.id === selectedId) ?? textTracks[0];
	const report = (error: unknown) =>
		toast.error(
			t(error instanceof Error ? error.message : "Subtitle operation failed"),
		);

	const addCues = (cues: SubtitleCue[], name: string, append: boolean) => {
		const before = editor.timeline.getTracks();
		const incoming = buildSubtitleTrack(
			cues,
			name,
			editor.project.getActive().settings.canvasSize.height,
		);
		if (append && selected?.locked)
			throw new Error("Unlock the subtitle track before editing");
		const after =
			append && selected
				? before.map((track) =>
						track.id === selected.id
							? {
									...selected,
									elements: [...selected.elements, ...incoming.elements],
								}
							: track,
					)
				: [incoming, ...before];
		editor.command.execute({
			command: new TracksSnapshotCommand(before, after),
		});
		setSelectedId(append && selected ? selected.id : incoming.id);
	};

	const importFile = async (file?: File) => {
		if (!file) return;
		try {
			const cues = parseSubtitleFile(await file.text());
			addCues(cues, file.name.replace(/\.(srt|vtt)$/i, ""), false);
			toast.success(t("Subtitles imported"));
		} catch (error) {
			report(error);
		}
	};

	const exportFile = (format: "srt" | "vtt") => {
		if (!selected) return;
		try {
			const cues = selected.elements.map((element) => ({
				start: element.startTime,
				end: element.startTime + element.duration,
				text: element.content,
			}));
			const blob = new Blob([serializeSubtitles(cues, format)], {
				type:
					format === "vtt"
						? "text/vtt;charset=utf-8"
						: "application/x-subrip;charset=utf-8",
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${selected.name}.${format}`;
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			report(error);
		}
	};

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
			<div>
				<h2 className="text-sm font-semibold">Captions</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Add captions manually or import an SRT/VTT file.
				</p>
			</div>
			<input
				ref={input}
				type="file"
				accept=".srt,.vtt"
				className="hidden"
				aria-label={t("Import subtitles")}
				onChange={(event) => {
					void importFile(event.target.files?.[0]);
					event.target.value = "";
				}}
			/>
			<Button variant="outline" onClick={() => input.current?.click()}>
				Import subtitles
			</Button>
			<div className="space-y-2">
				<Label htmlFor="caption-text">Subtitle text</Label>
				<Textarea
					id="caption-text"
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="Enter subtitle text"
					rows={3}
				/>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label htmlFor="caption-start">Start (seconds)</Label>
						<Input
							id="caption-start"
							type="number"
							min="0"
							step="0.1"
							value={start}
							onChange={(event) => setStart(event.target.valueAsNumber)}
						/>
					</div>
					<div>
						<Label htmlFor="caption-end">End (seconds)</Label>
						<Input
							id="caption-end"
							type="number"
							min="0"
							step="0.1"
							value={end}
							onChange={(event) => setEnd(event.target.valueAsNumber)}
						/>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						const time = editor.playback.getCurrentTime();
						setStart(time);
						setEnd(time + 3);
					}}
				>
					Use playhead time
				</Button>
				<Button
					className="w-full"
					disabled={!text.trim()}
					onClick={() => {
						try {
							addCues([{ start, end, text }], t("Captions"), true);
							setText("");
						} catch (error) {
							report(error);
						}
					}}
				>
					Add caption
				</Button>
			</div>
			{textTracks.length > 0 ? (
				<div className="space-y-3 border-t pt-3">
					<Label htmlFor="caption-track">Subtitle track</Label>
					<select
						id="caption-track"
						className="h-9 w-full rounded-md border bg-background px-2 text-sm"
						value={selected?.id ?? ""}
						onChange={(event) => setSelectedId(event.target.value)}
					>
						{textTracks.map((track) => (
							<option key={track.id} value={track.id} data-i18n-ignore>
								{track.name}
							</option>
						))}
					</select>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!selected?.elements.length}
							onClick={() => exportFile("srt")}
						>
							Export SRT
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!selected?.elements.length}
							onClick={() => exportFile("vtt")}
						>
							Export VTT
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						Select a caption to edit its text and style in Properties.
					</p>
					{selected?.elements.map((element) => (
						<button
							type="button"
							key={element.id}
							className="w-full rounded-md border p-2 text-left hover:bg-accent"
							onClick={() => {
								selectElement({ trackId: selected.id, elementId: element.id });
								editor.playback.seek({ time: element.startTime });
							}}
						>
							<span className="text-xs text-muted-foreground">
								{element.startTime.toFixed(2)} –{" "}
								{(element.startTime + element.duration).toFixed(2)}{" "}
								{t("seconds")}
							</span>
							<p data-i18n-ignore className="whitespace-pre-wrap text-sm">
								{element.content}
							</p>
						</button>
					))}
				</div>
			) : (
				<p className="text-xs text-muted-foreground">No subtitle tracks yet</p>
			)}
		</div>
	);
}
