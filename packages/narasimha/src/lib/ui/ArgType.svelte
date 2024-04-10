<script lang="ts">
	import { Kind, type Arg, Pantry } from '$lib/index.js';

	export let typ: Arg['type'];
	export let pantry: Pantry;
	export let inline = false;
	export let nullable = true;
	export let noExpandEnums = false;
	export let invertNullabilitySign = true;
	export let explicitNullabilitySign = false;

	let href: string | undefined = undefined;
	$: {
		try {
			href = pantry.type(typ).referencePath;
		} catch {}
	}

	export let enumWasExpanded = false;
	$: enumWasExpanded = willExpandEnum(typ);

	let connectionType: ReturnType<typeof pantry.connectionType> = null;
	$: {
		try {
			connectionType = pantry.connectionType(typ);
		} catch (error) {}
	}

	let resultType: ReturnType<typeof pantry.resultType> = null;
	$: {
		try {
			resultType = pantry.resultType(typ);
		} catch (error) {}
	}

	let unionType: null | ReturnType<typeof pantry.union> = null;
	$: {
		try {
			unionType = pantry.union(typ);
		} catch (error) {}
	}

	let enumType: null | ReturnType<typeof pantry.enum> = null;
	$: {
		try {
			enumType = pantry.enum(typ);
		} catch (error) {}
	}

	function willExpandEnum(t: Arg['type']) {
		const valuesCount =
			t.kind === Kind.Enum
				? enumType?.enumValues.length
				: t.kind === Kind.Union
					? unionType?.possibleTypes.length
					: 0;
		return Boolean(
			(t.kind === 'ENUM' || t.kind === 'UNION') &&
				!noExpandEnums &&
				(inline ? (valuesCount ?? 0) <= 3 : true) &&
				(valuesCount ?? 0) <= 10
		);
	}
</script>

<!-- Need to avoid extraneous whitespace, so the code is ugly like that. Sowwy ._. -->
{#if !typ}(none){:else}{#if enumType}{@const enumValues = enumType?.enumValues}<a
			{href}
			title={enumValues.map(v => v.name).join(' | ')}
			class="type enum">{typ.name}</a
		>{#if willExpandEnum(typ)}&nbsp;({#each Object.entries(enumValues) as [i, value]}<span
					class="type enum enum-value"
					title={value.description}
					><svelte:self module={pantry} nullable={false} {inline} {noExpandEnums} typ={value}
					></svelte:self></span
				>{#if Number(i) < enumValues.length - 1}<span class="type enum enum-value-separator"
						>&nbsp;|&#x20;</span
					>{/if}{/each}){/if}{:else if typ.kind === 'INPUT_OBJECT'}<a {href} class="type input"
			>{typ.name}</a
		>{:else if typ.kind === 'INTERFACE'}<span class="type interface">{typ.name}</span
		>{:else if typ.kind === 'LIST'}<span class="type array">[</span><svelte:self
			module={pantry}
			noExpandEnums={true}
			{nullable}
			{inline}
			typ={typ.ofType}
		/><span class="type array">]</span>{:else if typ.kind === 'NON_NULL'}<svelte:self
			module={pantry}
			{noExpandEnums}
			{inline}
			nullable={false}
			typ={typ.ofType}
		/>{:else if typ.kind === 'OBJECT'}{#if connectionType}<span class="type connection"
				><a class="type connection" href="/#types/special/connection">Connection</a>&lt;<svelte:self
					module={pantry}
					{noExpandEnums}
					{inline}
					{nullable}
					typ={connectionType.nodeType}
				></svelte:self>&gt;</span
			>{:else}<a class="type object" {href}>{typ.name}</a>{/if}{:else if typ.kind === 'SCALAR'}<span
			class="type scalar">{typ.name}</span
		>{:else if unionType}{@const unionValues = unionType.possibleTypes}{#if resultType}<span
				class="type errorable"
				><a class="type errorable" href="/#types/special/results-type">Result</a>&lt;<svelte:self
					module={pantry}
					{inline}
					{noExpandEnums}
					{nullable}
					typ={resultType.dataType}
				></svelte:self>&gt;</span
			>{:else}
			{#if willExpandEnum(typ)}{#if nullable}({/if}<span class="type union">
					{#each Object.entries(unionValues) as [i, value]}
						<svelte:self module={pantry} nullable={false} noExpandEnums {inline} typ={value}
						></svelte:self>{#if Number(i) < unionValues.length - 1}&nbsp;<strong>|</strong
							>&nbsp;{/if}{/each}</span
				>{#if nullable}){/if}{:else}<a {href}>{typ.name}</a>{/if}{/if}{:else}<span
			class="type unknown">{typ.name}</span
		>{/if}<span class:nullable class:non-nullable={typ.kind === 'NON_NULL'}
		>{#if invertNullabilitySign}{#if typ.kind !== 'NON_NULL' && nullable}{#if explicitNullabilitySign}&nbsp;|&#x20;null{:else}<span
						title="Peut être null">?</span
					>{/if}{/if}{:else if typ.kind === 'NON_NULL'}!{/if}</span
	>{/if}

<style>
	.connection {
		color: var(--magenta);
	}

	.scalar {
		color: var(--orange);
	}

	.enum {
		color: var(--yellow);
	}

	.enum.enum-value-separator {
		font-weight: bold;
		color: var(--fg);
	}

	.object {
		color: var(--blue);
	}

	.union {
		color: var(--pink);
	}

	.errorable,
	.nullable {
		font-weight: bold;
		color: var(--red);
	}

	.array {
		font-weight: bold;
		color: var(--fg);
	}

	.input {
		color: var(--cyan);
	}
</style>
