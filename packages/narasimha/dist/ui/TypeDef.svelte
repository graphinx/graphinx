<script>import HashLink from "./HashLink.svelte";
import TypeKindIndicator from "./TypeKindIndicator.svelte";
import { Kind, Pantry } from "../index.js";
import ArgType from "./ArgType.svelte";
import Field from "./Field.svelte";
export let pantry;
export let type;
export let renderTitle = false;
export let headingLevel;
$:
  fields = type.fields ?? [];
</script>

<article>
	<section class="doc">
		<HashLink
			data-toc-title={type.name}
			element={renderTitle ? 'h4' : 'h3'}
			hash={type.referencePath?.split('#', 2)[1]}
		>
			<TypeKindIndicator kind={type.kind}></TypeKindIndicator>
			<code class="no-color">{type.name}</code>
			<a
				href="https://git.inpt.fr/inp-net/churros/-/tree/main/{type.sourceLocation?.filepath.replace(
					'/home/uwun/projects/churros/',
					''
				)}"
				class="source-code">[src]</a
			>
		</HashLink>
		{#if type.description}
			{@html type.description}
		{/if}
	</section>
	<section class="fields">
		{#if fields.length > 0}
			<ul>
				{#each fields as field}
					<li>
						<Field pantry={pantry} {headingLevel} kind="field" {field}></Field>
					</li>
				{/each}
			</ul>
		{:else if type.kind === Kind.Enum}
			<ul>
				{#each type.enumValues ?? [] as { name, description }}
					<li>
						<code class="no-color">
							{#if description}
								<strong>{name}</strong>
							{:else}{name}{/if}
						</code>
						{#if type.description}
							<div class="doc">
								{@html type.description}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if type.kind === Kind.Union}
			{@const { possibleTypes } = pantry.union(type.name)}
			<ul>
				{#each possibleTypes as t}
					<li>
						<ArgType pantry={pantry} nullable={false} typ={{ ...t, ofType: null }}></ArgType>
						{#if type.description}
							<div class="doc">
								{@html type.description}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if type.kind !== 'SCALAR'}
			<ArgType pantry={pantry} nullable={false} typ={{ ...type, ofType: null }}></ArgType>
		{/if}
	</section>
</article>

<style>
	.source-code {
		margin-left: 1em;
	}
</style>
