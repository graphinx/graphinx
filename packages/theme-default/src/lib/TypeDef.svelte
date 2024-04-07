<script lang="ts">
	import HashLink from '$lib/HashLink.svelte';
	import TypeKindIndicator from '$lib/TypeKindIndicator.svelte';
	import { pascalToKebab } from '$lib/casing.js';
	import { markdownToHtml } from '$lib/markdown.js';
	import { Kind, type InterfaceElement, type SchemaType, type EnumValue } from '$lib/schema.js';
	import ArgType from './ArgType.svelte';
	import Query from './Query.svelte';

	export let type: SchemaType;
	export let renderTitle = false;
	export let moduleName: string;
	export let headingLevel: 'h3' | 'h4';
	export let types: {
		successTypes: { [k: string]: InterfaceElement | undefined };
		edgeTypes: { [k: string]: InterfaceElement | undefined };
		enumTypes: { [k: string]: EnumValue[] | null };
		allTypes: { [k: string]: SchemaType };
		allResolvers: Array<{
			name: string;
			moduleName: string;
			type: 'query' | 'mutation' | 'subscription';
		}>;
	};
	$: ({ allTypes, allResolvers } = types);
	export let liveIndicatorSettings: {
		href: string;
		title?: string;
	};
	$: fields = type?.fields ?? type?.inputFields ?? [];
</script>

<article>
	<section class="doc">
		<HashLink data-toc-title={type.name} element={renderTitle ? 'h4' : 'h3'} hash={type.name}>
			<TypeKindIndicator kind={type.kind}></TypeKindIndicator>
			<code class="no-color">{type.name}</code>
			<a
				href="https://git.inpt.fr/inp-net/churros/-/tree/main/packages/api/src/modules/{moduleName}/types/{pascalToKebab(
					type.name
				)}.ts"
				class="source-code">[src]</a
			>
		</HashLink>
		{#await markdownToHtml(type.description ?? '', allResolvers) then doc}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html doc}
		{:catch error}
			<p>Impossible de rendre la documentation pour {type.name}: {error}</p>
		{/await}
	</section>
	<section class="fields">
		{#if fields.length > 0}
			<ul>
				{#each fields as field}
					<li>
						<Query
							{liveIndicatorSettings}
							{...types}
							{headingLevel}
							kind="field"
							query={{ args: [], ...field }}
						></Query>
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
						<div class="doc">
							{#await markdownToHtml(description ?? '', allResolvers) then doc}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html doc}
							{:catch error}
								<p>Impossible de rendre la documentation pour {name}: {error}</p>
							{/await}
						</div>
					</li>
				{/each}
			</ul>
		{:else if type.kind === Kind.Union}
			{@const possibleTypes = (type.possibleTypes ?? [])
				.map((t) => allTypes[t.name ?? ''])
				.filter(Boolean)}
			<ul>
				{#each possibleTypes as t}
					<li>
						<ArgType {types} nullable={false} typ={{ ...t, ofType: null }}></ArgType>
						<div class="doc">
							{#await markdownToHtml(t.description ?? '', allResolvers) then doc}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html doc}
							{:catch error}
								<p>Impossible de rendre la documentation pour {moduleName}: {error}</p>
							{/await}
						</div>
					</li>
				{/each}
			</ul>
		{:else if type.kind !== 'SCALAR'}
			<ArgType {types} nullable={false} typ={{ ...allTypes[type.name], ofType: null }}></ArgType>
		{/if}
	</section>
</article>

<style>
	.source-code {
		margin-left: 1em;
	}
</style>
