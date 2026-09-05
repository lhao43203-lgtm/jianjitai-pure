"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogBody,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	PROJECT_TEMPLATES,
	type ProjectTemplate,
} from "@/constants/project-constants";
import { cn } from "@/utils/ui";

export function ProjectTemplatePicker({
	isOpen,
	onOpenChange,
	onSelectTemplate,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectTemplate: (template: ProjectTemplate) => void;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const template = PROJECT_TEMPLATES.find((item) => item.id === selectedId);
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>What are you making?</DialogTitle>
					<DialogDescription>
						Pick a template to set up your project. You can change settings
						later.
					</DialogDescription>
				</DialogHeader>
				<DialogBody>
					<div className="grid grid-cols-2 gap-2">
						{PROJECT_TEMPLATES.map((item) => (
							<button
								type="button"
								key={item.id}
								aria-pressed={selectedId === item.id}
								onClick={() => setSelectedId(item.id)}
								className={cn(
									"rounded-lg border p-3 text-left hover:bg-accent",
									selectedId === item.id && "ring-2 ring-primary",
								)}
							>
								<p className="text-sm font-medium">{item.name}</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{item.description}
								</p>
								<p className="mt-2 text-xs">
									{item.canvas.width} × {item.canvas.height} · {item.fps} fps
								</p>
							</button>
						))}
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Skip
					</Button>
					<Button
						disabled={!template}
						onClick={() => {
							if (template) {
								onSelectTemplate(template);
								onOpenChange(false);
							}
						}}
					>
						Create project
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
