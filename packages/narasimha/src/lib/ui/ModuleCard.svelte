<script lang="ts">
	import type { Module } from '$lib/pantry.js';
	import { MODULES_COLORS } from '$lib/colors.js';

	export let module: Module;
</script>

<a
	style:--color="var(--{MODULES_COLORS[module.name] ?? 'fg'})"
	href="/{module.name}"
	class="module-link"
>
	<div class="card">
		<h4 class="toc-exclude">
			<slot name="icon" />
			{module.displayName}
		</h4>
		<p>{@html module.shortDescription}</p>
	</div>
</a>

<style>
	.card {
		box-sizing: border-box;
		width: 100%;

		/* background-color: var(--shadow); */
		height: 100%;
		padding: 1rem;
		overflow: hidden;
		color: color-mix(in oklab, var(--color) 30%, var(--fg));
		background-color: var(--shadow);
		border: 2px solid var(--color);
		border-radius: 0.5rem;
		transition: all 0.2s ease;

		--icon-color: color-mix(in oklab, var(--color) 70%, var(--fg));
	}

	a:has(.card):hover .card,
	a:has(.card):focus-within .card {
		background-color: color-mix(in oklab, var(--color) 40%, var(--shadow));
		border-color: var(--color);
	}

	a:has(.card) {
		display: block;
		width: calc(min(var(--card-width), 100%));
		height: var(--card-height);
		color: inherit;
		text-decoration: none;
	}

	.card h4 {
		margin-top: 0.125rem;
	}

	.card p {
		font-size: 0.85em;
		text-overflow: ellipsis;
	}
</style>
