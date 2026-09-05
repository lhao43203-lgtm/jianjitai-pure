import { expect, test } from "bun:test";
import Home from "./page";

test("the tool entry redirects to existing projects instead of rendering a marketing page", async () => {
	await expect(Home()).rejects.toMatchObject({
		digest: "NEXT_REDIRECT;replace;/projects;307;",
	});
});
