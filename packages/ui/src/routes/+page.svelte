<script lang="ts">
	import { Module } from '@narasimha/core';
	import type { PageData } from './$types.js';
	import HashLink from '$lib/HashLink.svelte';
	import ModuleCard from '$lib/ModuleCard.svelte';
	import ModulesList from '$lib/ModulesList.svelte';

	export let data: PageData;
	let modules: Module[] = [];

	async function initializeModules() {
		modules = await Promise.all(data.modules.map(m => Module.fromSerialized(data.schema, m)));
	}
</script>

{#await initializeModules() then}
	<!-- <HashLink href="/{module.name}"></HashLink>
		<h1>{module.displayName}</h1> -->
	<ModulesList {modules}></ModulesList>
{/await}
