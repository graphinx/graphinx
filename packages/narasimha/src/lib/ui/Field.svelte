<script lang="ts">
import { liveIndicatorSettings } from "$lib/global.js";
import type { AugmentedField, Field, Pantry } from "$lib/index.js";
import HashLink from "$lib/ui/HashLink.svelte";
import LiveIndicator from "$lib/ui/LiveIndicator.svelte";
import { onMount } from "svelte";
import ArgType from "./ArgType.svelte";

export let field: AugmentedField;
export let pantry: Pantry;
export let kind: "query" | "mutation" | "subscription" | "field";

export const typeIsEnumAndWasExpanded = false;

let mobile = false;
onMount(() => {
	mobile = window.innerWidth < 768;
});

function syntaxHighlightTypeName(t: Field["type"]): string {
	if (t.kind === "ENUM") return "enum";
	return (
		t.name?.toLowerCase() ??
		(t.ofType ? syntaxHighlightTypeName(t.ofType) : "Unknown").toLowerCase()
	);
}

function expandTypedef(t: Field["type"]): boolean {
	const name = firstNonWrapperType(t)?.name ?? "";
	return name.includes("Input") || name.includes("HealthCheck");
}

function firstNonWrapperType(t: Field["type"]): Field["type"] | null {
	if (t.kind === "NON_NULL" || t.kind === "LIST")
		return t.ofType ? firstNonWrapperType(t.ofType) : null;
	return { ...t, ofType: null };
}

export let headingLevel: "h3" | "h4";
</script>

<svelte:window
	on:resize={() => {
		mobile = window.innerWidth < 768;
	}}
/>

<svelte:element this={kind === 'field' ? 'div' : 'article'} data-kind={kind}>
	<HashLink
		data-toc-title={field.name}
		hash={field.referencePath?.split('#', 2)[1]}
		element={kind === 'field' ? 'span' : headingLevel}
	>
		{#if kind !== 'field' && pantry.isLive(field.name)}
			<LiveIndicator href={$liveIndicatorSettings.href} title={$liveIndicatorSettings.title}
			></LiveIndicator>
		{/if}
		{#if kind === 'field' && (!field.args || field.args.length === 0)}
			<code class="no-color"
				><svelte:element
					this={typeIsEnumAndWasExpanded ? 'a' : 'span'}
					href="#{field.name}"
					class="field-name">{field.name}</svelte:element
				>: <ArgType {pantry} bind:enumWasExpanded={typeIsEnumAndWasExpanded} typ={field.type}
				></ArgType></code
			>
		{:else}
			<code class="no-color"
				>{field.name}({#if !mobile}&#8203;{/if}{#if field.args && field.args.length >= (mobile ? 3 : 5)}<span
						class="too-many-args">...</span
					>{:else if field.args}{#each Object.entries(field.args) as [i, { name, type, defaultValue }]}{name}{#if !mobile}:&nbsp;<ArgType
								{pantry}
								noExpandEnums={Boolean(defaultValue)}
								inline
								typ={type}
							></ArgType>{/if}{#if defaultValue !== null}&nbsp;=&nbsp;<span
								class="literal {syntaxHighlightTypeName(type)}">{defaultValue}</span
							>{/if}{#if Number(i) < field.args.length - 1},&#x20;&#8203;{/if}{/each}{/if})</code
			>&#x20;&rarr;&nbsp;<code class="no-color"
				><ArgType {pantry} inline typ={field.type}></ArgType></code
			>
		{/if}
		{#if kind !== 'field'}
			<a
				href="https://git.inpt.fr/inp-net/churros/-/tree/main/{field.sourceLocation?.filepath.replace(
					'/home/uwun/projects/churros/',
					''
				)}"
				class="source-code">[src]</a
			>
		{/if}
	</HashLink>
	{#if field.description}
		<section class="doc">
			{@html field.description}
		</section>
	{/if}

	{#if field.args && field.args.length > 0}
		<section class="args">
			<p class="subtitle">Arguments</p>
			<ul>
				{#each field.args as arg}
					<li>
						<code class="no-color">{arg.name}: </code>
						<span class="type">
							<code class="no-color">
								<ArgType {pantry} typ={arg.type} />
							</code>
						</span>
						{#if arg.defaultValue}
							<span class="default-value">
								<code class="no-color">
									= <span class="literal {syntaxHighlightTypeName(arg.type)}"
										>{arg.defaultValue}</span
									>
								</code>
							</span>
						{/if}
						{#if arg.description}
							<div class="doc">
								{@html arg.description}
							</div>
						{/if}
						{#if expandTypedef(arg.type)}
							{@const innerType = pantry.type(arg.type)}
							{#if innerType}
								<div class="inner-type">
									<ul>
										{#each innerType.inputFields ?? [] as field}
											<li>
												<svelte:self kind="field" query={{ ...field, args: [] }}></svelte:self>
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

	.source-code {
		margin-left: 1em;
	}
</style>
