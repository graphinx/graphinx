<script lang="ts">
	import HashLink from '$lib/HashLink.svelte';
	import TypeKindIndicator from '$lib/TypeKindIndicator.svelte';
	import { pascalToKebab } from '$lib/casing';
	import { markdownToHtml, type ResolverFromFilesystem } from '$lib/markdown';
	import {
		type GraphQLNamedType,
		type GraphQLSchema,
		isEnumType,
		isInputObjectType,
		isInterfaceType,
		isObjectType,
		isScalarType,
		isUnionType
	} from 'graphql';
	import ArgType from './ArgType.svelte';
	import Query from './Query.svelte';
	import { findTypeInSchema } from '$lib/schema-utils';

	export let type: GraphQLNamedType;
	export let allResolvers: ResolverFromFilesystem[];
	export let schema: GraphQLSchema;
	export let renderTitle = false;
	export let moduleName: string;
	$: fields =
		isObjectType(type) || isInputObjectType(type) || isInterfaceType(type)
			? Object.values(type.getFields())
			: [];
</script>

<article>
	<section class="doc">
		<HashLink data-toc-title={type.name} element={renderTitle ? 'h4' : 'h3'} hash={type.name}>
			{#if type.astNode?.kind}
				<TypeKindIndicator kind={type.astNode?.kind}></TypeKindIndicator>
			{/if}
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
						<Query {schema} kind="field" query={{ args: [], ...field }}></Query>
					</li>
				{/each}
			</ul>
		{:else if isEnumType(type)}
			<ul>
				{#each type.getValues() ?? [] as { name, description }}
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
		{:else if isUnionType(type)}
			{@const possibleTypes = (type.getTypes() ?? [])
				.map((t) => findTypeInSchema(schema, t.name))
				.filter(Boolean)}
			<ul>
				{#each possibleTypes as t}
					<li>
						<ArgType {schema} nullable={false} typ={t}></ArgType>
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
		{:else if isScalarType(type)}
			<ArgType {schema} nullable={false} typ={type}></ArgType>
		{/if}
	</section>
</article>

<style>
	.source-code {
		margin-left: 1em;
	}
</style>
