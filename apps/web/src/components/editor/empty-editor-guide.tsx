"use client";

import { cn } from "@/utils/ui";

const STEPS = [
	[
		"Import your video",
		"Drag a video file into the editor or use the media panel",
	],
	["Edit your timeline", "Split, trim, and arrange your clips"],
	[
		"Add captions and effects",
		"Import subtitles and manage effects from the clip badge",
	],
	["Export your video", "Choose a format and save your finished video"],
];

export function EmptyEditorGuide({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"flex h-full flex-col gap-5 overflow-auto px-5 py-6",
				className,
			)}
		>
			<h3 className="text-sm font-medium">Get started</h3>
			{STEPS.map(([title, description], index) => (
				<div key={title} className="flex items-start gap-3">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
						{index + 1}
					</span>
					<div>
						<p className="text-xs font-medium">{title}</p>
						<p className="mt-1 text-xs text-muted-foreground">{description}</p>
					</div>
				</div>
			))}
		</div>
	);
}
