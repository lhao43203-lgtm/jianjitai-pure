const FEATURES = [
	["Timeline editing", "Split, trim, and arrange your clips"],
	["Captions", "Add captions manually or import an SRT/VTT file."],
	[
		"Applied effects",
		"View, disable, or delete effects directly from the timeline",
	],
	["Audio", "Adjust volume and add music or sound effects"],
	["Version History", "Save your project and undo changes"],
	[
		"Interface Languages",
		"Simplified Chinese, Traditional Chinese, and English",
	],
];

export function Features() {
	return (
		<section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
			{FEATURES.map(([title, description]) => (
				<div key={title} className="rounded-lg border p-5">
					<h2 className="text-base font-semibold">{title}</h2>
					<p className="mt-2 text-sm text-muted-foreground">{description}</p>
				</div>
			))}
		</section>
	);
}
