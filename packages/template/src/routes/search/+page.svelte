<script lang="ts">
	import { page } from '$app/stores';
	import ModuleCard from '$lib/ModuleCard.svelte';
	import Fuse from 'fuse.js';
	import Query from '../Query.svelte';
	import TypeDef from '../TypeDef.svelte';
	import type { PageData } from './$types';
	import { buildSchema, isNamedType } from 'graphql';
	import {
		findMutationInSchema,
		findQueryInSchema,
		findSubscriptionInSchema,
		findTypeInSchema
	} from '$lib/schema-utils';

	function nonNullable<T>(value: T): value is NonNullable<T> {
		return value !== null;
	}

	export let data: PageData;
	$: ({ modules, schemaRaw } = data);
	$: schema = buildSchema(schemaRaw);

	$: queries = modules.flatMap((module) =>
		module.queries
			.map((q) => findQueryInSchema(schema, q))
			.filter(nonNullable)
			.map((q) => ({ ...q, module }))
	);
	$: mutations = modules.flatMap((module) =>
		module.mutations
			.map((m) => findMutationInSchema(schema, m))
			.filter(nonNullable)
			.map((m) => ({ ...m, module }))
	);

	$: types = modules.flatMap((module) =>
		module.types
			.map((t) => findTypeInSchema(schema, t))
			.filter(nonNullable)
			.map((t) => ({ ...t, module }))
	);

	$: query = $page.url.searchParams.get('q') || '';

	function search(searchQuery: string) {
		if (searchQuery.length < 3) return { resultsCount: 0, results: [], modulesResults: [] };
		const modulesResults = new Fuse(modules, {
			keys: [
				{ name: 'name', weight: 2 },
				{ name: 'displayName', weight: 2 },
				{ name: 'description', weight: 0.5 }
			],
			includeMatches: true,
			includeScore: true,
			threshold: 0.2
		}).search(searchQuery);
		const results = new Fuse([...queries, ...mutations, ...types], {
			keys: [
				{ name: 'name', weight: 4 },
				{ name: 'type', weight: 1 },
				{ name: 'description', weight: 2 },
				{ name: 'args.name', weight: 1 },
				{ name: 'args.description', weight: 0.5 },
				{ name: 'module.name', weight: 0.3 },
				{ name: 'module.displayName', weight: 0.3 },
				{ name: 'module.description', weight: 0.25 }
			],
			includeScore: true,
			includeMatches: true,
			threshold: 0.2
		}).search(searchQuery);
		return {
			resultsCount: results.length + modulesResults.length,
			results,
			modulesResults
		};
	}

	$: ({ resultsCount, results, modulesResults } = search(query));

	function resultKind({ item }: (typeof results)[number]) {
		if (queries.some((query) => query.name === item.name)) return 'query';
		if (mutations.some((mutation) => mutation.name === item.name)) return 'mutation';
		return 'field';
	}
</script>

<svelte:head>
	<title>Recherche—Churros API</title>
</svelte:head>

<h1>Recherche de “{query}”</h1>
{#if resultsCount > 0}
	<p class="results-count">
		{resultsCount} résultat{resultsCount === 1 ? '' : 's'}
	</p>
{/if}

{#each modulesResults as { item }}
	<ModuleCard module={item}></ModuleCard>
{/each}

<!-- {#if modulesResults.length > 0 && results.length > 0}
	<hr />
{/if} -->

{#each results as result}
	{#if isNamedType(result.item)}
		<TypeDef
			{schema}
			allResolvers={data.resolvers}
			moduleName={result.item.module.name}
			type={result.item}
		></TypeDef>
	{:else}
		{@const query =
			findQueryInSchema(schema, result.item.name) ??
			findMutationInSchema(schema, result.item.name) ??
			findSubscriptionInSchema(schema, result.item.name)}
		{#if query}
			<Query {schema} kind={resultKind(result)} {query}></Query>
		{:else}
			<p>Impossible de trouver la query {result.item.name} dans le schéma</p>
		{/if}
	{/if}
{:else}
	<p class="no-results">Aucun résultat.</p>
	<a href="/">Retour à l'accueil</a>
{/each}

<style>
	h1 {
		margin-bottom: 0;
	}

	.results-count {
		margin-top: 0;
		margin-bottom: 2rem;
	}
</style>
