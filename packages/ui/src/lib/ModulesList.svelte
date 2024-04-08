<script lang="ts">
	import ModuleCard from '$lib/ModuleCard.svelte';
	import type { Module } from '@narasimha/core';

	export let modules: Module[];
</script>

<section class="modules-list">
	{#each modules as module}
		<ModuleCard {module} />
	{/each}
</section>

<style>
	.modules-list {
		--card-width: 223px;
		--card-height: 200px;

		display: grid;
		grid-template-columns: repeat(auto-fill, calc(min(var(--card-width), 100%)));
		gap: 1.5rem;
		justify-content: center;
	}
</style>
