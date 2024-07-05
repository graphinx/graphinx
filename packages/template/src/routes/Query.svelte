<script lang="ts">
	import { page } from '$app/stores';
	import HashLink from '$lib/HashLink.svelte';
	import LiveIndicator from '$lib/LiveIndicator.svelte';
	import { pascalToKebab } from '$lib/casing';
	import { markdownToHtml } from '$lib/markdown';
	import {
		getNamedType,
		type GraphQLField,
		type GraphQLNamedType,
		type GraphQLSchema,
		type GraphQLType,
		isEnumType,
		isInputObjectType,
		isNamedType
	} from 'graphql';
	import { onMount } from 'svelte';
	import ArgType from './ArgType.svelte';

	export let schema: GraphQLSchema;
	export let query: GraphQLField<unknown, unknown>; //| GraphQLArgument;
	export let kind: 'query' | 'mutation' | 'subscription' | 'field';
	export let hasAvailableSubscription = false;
	// export let showReturnType = false;
	export let typeIsEnumAndWasExpanded = false;

	$: args = query.args ?? [];

	let mobile = false;
	onMount(() => {
		mobile = window.innerWidth < 768;
	});

	function syntaxHighlightTypeName(t: GraphQLType): string {
		if (isEnumType(t)) return 'enum';
		return isNamedType(t) ? t.name : t.ofType ? syntaxHighlightTypeName(t.ofType) : 'Unknown';
	}

	function expandTypedef(t: GraphQLType): boolean {
		const name = firstNonWrapperType(t)?.name ?? '';
		return name.includes('Input') || name.includes('HealthCheck');
	}

	function firstNonWrapperType(t: GraphQLType): GraphQLNamedType | null {
		if (!isNamedType(t)) return t.ofType ? firstNonWrapperType(t.ofType) : null;
		return t;
	}

	$: hash = kind !== 'field' ? `${kind}/${query.name}` : undefined;

	$: headingLevel = $page.url.pathname === '/' ? 'h4' : 'h3';
</script>

<svelte:window
	on:resize={() => {
		mobile = window.innerWidth < 768;
	}}
/>

<svelte:element this={kind === 'field' ? 'div' : 'article'} data-kind={kind}>
	<HashLink data-toc-title={query.name} {hash} element={kind === 'field' ? 'span' : headingLevel}>
		{#if hasAvailableSubscription}
			<LiveIndicator></LiveIndicator>
		{/if}
		{#if kind === 'field' && args && args.length === 0}
			<code class="no-color"
				><svelte:element
					this={typeIsEnumAndWasExpanded ? 'a' : 'span'}
					href="#{query.name}"
					class="field-name">{query.name}</svelte:element
				>: <ArgType {schema} bind:enumWasExpanded={typeIsEnumAndWasExpanded} typ={query.type}
				></ArgType></code
			>
		{:else}
			<code class="no-color"
				>{query.name}({#if !mobile}&#8203;{/if}{#if args && args.length >= (mobile ? 3 : 5)}<span
						class="too-many-args">...</span
					>{:else}{#each Object.entries(args) as [i, { name, type, defaultValue }]}{name}{#if !mobile}:&nbsp;<ArgType
								{schema}
								noExpandEnums={Boolean(defaultValue)}
								inline
								typ={type}

							></ArgType>{/if}{#if defaultValue !== null && defaultValue !== undefined}&nbsp;=&nbsp;<span
								class="literal {pascalToKebab(syntaxHighlightTypeName(type))}">{defaultValue}</span
							>{/if}{#if Number(i) < args.length - 1},&#x20;&#8203;{/if}{/each}{/if})</code
			>&#x20;&rarr;&nbsp;<code class="no-color"
				><ArgType {schema} inline typ={query.type}></ArgType></code
			>
		{/if}
	</HashLink>
	{#if query.description}
		<section class="doc">
			{#await markdownToHtml(query.description, $page.data.allResolvers) then doc}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html doc}
			{:catch error}
				<p>Impossible de rendre la documentation pour {query.name}: {error}</p>
			{/await}
		</section>
	{/if}

	{#if 'isDeprecated' in query && query.isDeprecated}
		<section class="deprecated">
			<p class="subtitle">Déprécié</p>
			{#if query.deprecationReason}
				{#await markdownToHtml(query.deprecationReason, $page.data.allResolvers)}
					<p>{query.deprecationReason}</p>
				{:then deprecationReason}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html deprecationReason}
				{:catch}
					<p>{query.deprecationReason}</p>
				{/await}
			{/if}
		</section>
	{/if}
	{#if args.length > 0}
		<section class="args">
			<p class="subtitle">Arguments</p>
			<ul>
				{#each args as arg}
					<li>
						<code class="no-color">{arg.name}: </code>
						<span class="type">
							<code class="no-color">
								<ArgType {schema} typ={arg.type} />
							</code>
						</span>
						{#if arg.defaultValue}
							<span class="default-value">
								<code class="no-color">
									= <span class="literal {pascalToKebab(syntaxHighlightTypeName(arg.type))}"
										>{arg.defaultValue}</span
									>
								</code>
							</span>
						{/if}
						{#if arg.description}
							<div class="doc">
								{#await markdownToHtml(arg.description, $page.data.allResolvers) then doc}
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html doc}
								{:catch error}
									<p>
										Impossible de rendre la documentation pour {arg.name}: {error}
									</p>
								{/await}
							</div>
						{/if}
						{#if expandTypedef(arg.type)}
							{@const innerTypeName = firstNonWrapperType(arg.type)?.name}
							{@const innerType = innerTypeName ? schema.getType(innerTypeName) : undefined}
							{#if innerType}
								<div class="inner-type">
									<ul>
										{#each isInputObjectType(innerType) ? Object.values(innerType.getFields()) ?? [] : [] as field}
											<li>
												<svelte:self kind="field" query={field}></svelte:self>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</svelte:element>

<style>
	.literal.string {
		color: var(--green);
	}

	.literal.enum {
		color: var(--yellow);
	}

	.literal.int,
	.literal.float {
		color: var(--orange);
	}

	.too-many-args {
		color: var(--pink);
	}

	.subtitle {
		margin-top: 1rem;
		font-weight: bold;
		color: var(--muted);
	}

	.doc {
		padding-top: 0.25rem;
		padding-bottom: 0.75rem;
	}
</style>
