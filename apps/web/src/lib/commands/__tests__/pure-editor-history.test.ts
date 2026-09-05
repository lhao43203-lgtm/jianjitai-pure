import { afterEach, describe, expect, test } from "bun:test";
import { EditorCore } from "@/core";
import { CommandManager } from "@/core/managers/commands";
import { DEFAULT_TRANSFORM } from "@/constants/timeline-constants";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import { buildSubtitleTrack } from "@/lib/captions/subtitle-track";
import { parseSubtitleFile } from "@/lib/captions/subtitle-file";
import { TracksSnapshotCommand } from "@/lib/commands/timeline/tracks-snapshot";
import { UpdateElementCommand } from "@/lib/commands/timeline/element/update-element";
import { RemoveClipEffectCommand } from "@/lib/commands/timeline/element/effects/remove-effect";
import { ToggleClipEffectCommand } from "@/lib/commands/timeline/element/effects/toggle-effect";
import { RemoveTransitionCommand } from "@/lib/commands/timeline/element/transitions/add-transition";
import type { TimelineTrack, VisualElement } from "@/types/timeline";

const original = EditorCore.getInstance;
afterEach(() => {
	EditorCore.getInstance = original;
});

function setup(initial: TimelineTrack[]) {
	let tracks = structuredClone(initial);
	EditorCore.getInstance = () =>
		({
			timeline: {
				getTracks: () => tracks,
				updateTracks: (next: TimelineTrack[]) => {
					tracks = next;
				},
			},
		}) as unknown as EditorCore;
	return { history: new CommandManager(), tracks: () => tracks };
}

function fixture(
	type: "video" | "image" | "text" | "sticker",
): TimelineTrack[] {
	const base = {
		id: "clip",
		name: "Clip",
		duration: 5,
		startTime: 0,
		trimStart: 0,
		trimEnd: 0,
		transform: structuredClone(DEFAULT_TRANSFORM),
		opacity: 1,
		effects: [
			{ id: "fx1", type: "blur", params: { radius: 12 }, enabled: true },
			{
				id: "fx2",
				type: "vignette",
				params: { intensity: 0.7 },
				enabled: false,
			},
		],
	};
	if (type === "text")
		return [
			{
				id: "track",
				type: "text",
				name: "Captions",
				hidden: false,
				elements: [{ ...DEFAULT_TEXT_ELEMENT, ...base }],
			},
		];
	if (type === "sticker")
		return [
			{
				id: "track",
				type: "sticker",
				name: "Stickers",
				hidden: false,
				elements: [{ ...base, type, stickerId: "emoji:1f600" }],
			},
		];
	return [
		{
			id: "track",
			type: "video",
			name: "Main",
			hidden: false,
			muted: false,
			isMain: true,
			elements: [{ ...base, type, mediaId: "media" }],
		},
	];
}

describe("pure editor undo history", () => {
	for (const type of ["video", "image", "text", "sticker"] as const) {
		test(`${type}: deleting a transition preserves clips and FX, with one-step undo and redo`, () => {
			const before = fixture(type);
			(before[0].elements[0] as VisualElement).transitionOut = {
				type: "cross-dissolve",
				duration: 0.75,
			};
			const state = setup(before);
			state.history.execute({
				command: new RemoveTransitionCommand({
					trackId: "track",
					elementId: "clip",
				}),
			});
			const withoutTransition = fixture(type);
			expect(state.tracks()).toEqual(withoutTransition);
			expect(state.history.getHistoryLength()).toBe(1);
			state.history.undo();
			expect(state.tracks()).toEqual(before);
			state.history.redo();
			expect(state.tracks()).toEqual(withoutTransition);
		});
		test(`${type}: remove all restores effect order, parameters and enabled state in one undo`, () => {
			const before = fixture(type);
			const state = setup(before);
			state.history.execute({
				command: new UpdateElementCommand({
					trackId: "track",
					elementId: "clip",
					updates: { effects: [] },
				}),
			});
			expect((state.tracks()[0].elements[0] as VisualElement).effects).toEqual(
				[],
			);
			expect(state.history.getHistoryLength()).toBe(1);
			state.history.undo();
			expect(state.tracks()).toEqual(before);
			state.history.redo();
			expect((state.tracks()[0].elements[0] as VisualElement).effects).toEqual(
				[],
			);
			expect(state.tracks()[0].elements).toHaveLength(1);
		});
	}
	test("targeted toggles and deletion never delete their clip and are undoable", () => {
		const before = fixture("video");
		const state = setup(before);
		const target = { trackId: "track", elementId: "clip", effectId: "fx1" };
		state.history.execute({ command: new ToggleClipEffectCommand(target) });
		expect(
			(state.tracks()[0].elements[0] as VisualElement).effects?.[0].enabled,
		).toBe(false);
		state.history.execute({ command: new RemoveClipEffectCommand(target) });
		expect(
			(state.tracks()[0].elements[0] as VisualElement).effects?.map(
				(e) => e.id,
			),
		).toEqual(["fx2"]);
		expect(state.tracks()[0].elements[0].id).toBe("clip");
		state.history.undo();
		state.history.undo();
		expect(state.tracks()).toEqual(before);
	});
	test("an entire subtitle import is a single undo, leaving existing media unchanged", () => {
		const before = fixture("video");
		const state = setup(before);
		const cues = parseSubtitleFile(
			"1\n00:00:00,000 --> 00:00:01,500\n第一行\n第二行\n\n2\n00:00:02,000 --> 00:00:03,000\n繁體中文",
		);
		const after = [
			buildSubtitleTrack(cues, "Imported captions", 1080),
			...state.tracks(),
		];
		state.history.execute({
			command: new TracksSnapshotCommand(state.tracks(), after),
		});
		expect(state.tracks()[0].elements).toHaveLength(2);
		expect(state.history.getHistoryLength()).toBe(1);
		state.history.undo();
		expect(state.tracks()).toEqual(before);
		state.history.redo();
		expect(state.tracks()).toEqual(after);
	});
});
