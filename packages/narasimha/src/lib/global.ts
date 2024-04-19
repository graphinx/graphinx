import { readable } from "svelte/store";
import type { SchemaClass } from "./schema.js";

export const schema = readable(undefined as undefined | SchemaClass);

export const liveIndicatorSettings = readable({
	href: "/websockets",
	title: "Websockets",
});
