<script lang="ts">
	import { Module } from '@narasimha/core';
	import type { PageData } from './$types.js';

	export let data: PageData;
	let modules: Module[] = [];
	let formsT: any;

	async function initializeModules() {
		modules = await Promise.all(data.modules.map(m => Module.fromSerialized(data.schema, m)));
		const forms = modules.find(m => m.name === 'forms')!;
		formsT = forms.connectionType(forms.query('allForms').type);
	}
</script>

{#await initializeModules() then}
	<pre>{JSON.stringify(formsT, null, 2)}</pre>
{/await}
