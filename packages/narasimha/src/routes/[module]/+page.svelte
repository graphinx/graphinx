<script lang="ts">
import { Pantry } from "$lib/pantry.js";
import Field from "$lib/ui/Field.svelte";
import TypeDef from "$lib/ui/TypeDef.svelte";
import type { PageData } from "./$types.js";

export let data: PageData;
$: ({ schema, module, pantry } = data);
</script>

{#await Pantry.fromSerialized(schema, pantry) then pantry}
	<h1>{module.displayName}</h1>
	<div class="doc">
		{@html module.documentation}
	</div>

	<section class="types">
		<h2>Types</h2>
		{#each pantry
			.types(module.name)
			.filter(t => !pantry.connectionType(t.name) && !pantry.resultType(t.name)) as type (type.name)}
			<TypeDef headingLevel="h3" {pantry} {type}></TypeDef>
		{/each}
	</section>

	<section class="queries">
		<h2>Queries</h2>
		{#each pantry.queries(module.name) as query (query.name)}
			<article>
				<Field headingLevel="h3" kind="query" {pantry} field={query}></Field>
			</article>
		{/each}
	</section>

	<section class="mutations">
		<h2>Mutations</h2>
		{#each pantry.mutations(module.name) as mutation (mutation.name)}
			<article>
				<Field headingLevel="h3" kind="mutation" {pantry} field={mutation}></Field>
			</article>
		{/each}
	</section>
{:catch err}
	<pre>
	{err}
</pre>
{/await}
