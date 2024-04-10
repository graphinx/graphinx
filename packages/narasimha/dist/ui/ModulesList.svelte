<script>import ModuleCard from "./ModuleCard.svelte";
export let modules;
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
