<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import TableOfContents from '$lib/TableOfContents.svelte';
	import { colorNames } from '$lib/colors';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	onMount(() => {
		if (!browser) return;

		const colorsStylesheet = [...document.styleSheets].find((d) => d.href?.endsWith('colors.css'));

		const colorsRootCssRule = [...(colorsStylesheet?.cssRules ?? [])].find(
			(r) => r instanceof CSSStyleRule && r.selectorText === ':root'
		) as CSSStyleRule;

		$colorNames = [...colorsRootCssRule.style].map((n) => n.replace(/^--/, ''));
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="/fonts.css" />
	<link rel="stylesheet" href="/colors.css" />
</svelte:head>

<main>
	<div class="toc">
		<TableOfContents
			title={$page.url.pathname === '/'
				? undefined
				: browser
					? document.title.split('—')[0].trim()
					: $page.route.id === '/[module]'
						? $page.params.module
						: data.config.branding.name}
			headingSelector={$page.url.pathname === '/'
				? `:is(h2, [data-toc-include]):not(.toc-exclude)`
				: `:is(h2, h3, h4, [data-toc-include]):not(.toc-exclude)`}
		></TableOfContents>
	</div>
	<div class="content">
		<slot />
		<footer>
			<img src={data.config.branding.logo} alt="{data.config.branding.name} Logo" />
			{#if data.config.footer}
				<section>
					{@html data.config.footer}
				</section>
			{/if}
		</footer>
	</div>
</main>

<style>
	:root {
		--side-padding: 2rem;
	}

	main {
		display: grid;
		grid-template-columns: var(--toc-width) 1fr;
		gap: 2rem;
		max-width: 1000px;
		padding: 0 var(--side-padding);
		margin: 0 auto;

		--toc-width: 250px;
		--toc-li-hover-color: var(--cyan);
		--toc-active-bg: var(--fg);
		--toc-active-color: var(--bg);
		--toc-mobile-bg: var(--bg);
	}

	footer {
		/* border-radius: 10000px; */
		padding: 5rem;
		padding-bottom: 1rem;
		margin-top: 5rem;
		text-align: center;
		border-top: var(--shadow) 5px solid;
	}

	footer img {
		width: 50px;
	}
	:global(a) {
		color: var(--cyan);
	}

	:global(a:hover, a:focus-visible) {
		color: var(--pink);
	}

	:global(pre) {
		overflow-x: auto;
	}

	.content {
		max-width: calc(100vw - 2 * var(--side-padding));
		overflow-x: auto;
	}

	@media (max-width: 1000px) {
		main {
			grid-template-columns: 1fr;
		}
	}

	:global(body, button, input) {
		font-family: 'Space Grotesk', Roboto, sans-serif;
		color: var(--fg);
		background: var(--bg);
	}

	:global(code, pre) {
		font-family: 'Space Mono', monospace;
	}

	:global(code:not(.no-color)) {
		color: var(--pink);
	}

	:global(h4) {
		margin: 0.5rem 0;
	}

	:global(p) {
		margin: 0.125rem 0;
	}

	:global(article) {
		padding: 1rem;
		margin: 2rem 0;
		border-radius: 1.5rem;
	}

	:global(article.error) {
		color: color-mix(in oklab, var(--red) 50%, var(--fg));
		text-align: center;
		background: color-mix(in oklab, var(--red) 20%, var(--bg));
	}

	:global(hr) {
		height: 0.5rem;
		margin: 2rem 0;
		background: var(--shadow);
		border: 0;
		border-radius: 2rem;
	}
</style>
