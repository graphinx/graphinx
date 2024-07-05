<script lang="ts">
	import { page } from '$app/stores';
	import {
		type GraphQLEnumValue,
		type GraphQLNamedType,
		type GraphQLObjectType,
		type GraphQLSchema,
		type GraphQLType,
		isEnumType,
		isInputObjectType,
		isInterfaceType,
		isListType,
		isNamedType,
		isNonNullType,
		isObjectType,
		isScalarType,
		isUnionType
	} from 'graphql';

	export let schema: GraphQLSchema;
	export let typ: GraphQLType;
	export let inline = false;
	export let nullable = true;
	export let noExpandEnums = false;
	export let invertNullabilitySign = true;
	export let explicitNullabilitySign = false;
	export let underlyingType: GraphQLNamedType | undefined = undefined;

	export let enumWasExpanded = false;
	$: enumWasExpanded = willExpandEnum(typ);

	$: successTypes = schema
		? Object.fromEntries(
				Object.values(schema.getTypeMap())
					.filter(isObjectType)
					.filter((type) => type.name.endsWith('Success'))
					.map((t) => [t.name, Object.values(t.getFields()).find((f) => f.name === 'data')?.type])
			)
		: {};

	$: edgeTypes = schema
		? Object.fromEntries(
				Object.values(schema.getTypeMap())
					.filter(isObjectType)
					.filter((type) => type.name.endsWith('ConnectionEdge'))
					.map((t) => [t.name, Object.values(t.getFields()).find((f) => f.name === 'node')?.type])
			)
		: {};

	$: enumValues = getEnumValues(typ);

	$: {
		if (typ && isUnionType(typ) && typ.name?.endsWith('Result')) {
			const maybeUnderlying = successTypes[typ.name?.replace('Result', 'Success')];
			if (isNamedType(maybeUnderlying)) underlyingType ??= maybeUnderlying;
		} else if (isNamedType(typ) && typ?.name?.endsWith('Connection')) {
			// biome-ignore lint/style/noNonNullAssertion: Connection types always have their corresponding Edge type
			const maybeUnderlying = edgeTypes[`${typ.name}Edge`]!;
			if (isNamedType(maybeUnderlying)) underlyingType ??= maybeUnderlying;
		}
	}

	function getEnumValues(t: GraphQLType): GraphQLEnumValue[] {
		try {
			if (isEnumType(t)) return Object.values(t.getValues()) ?? [];
		} catch {
			return [];
		}
		return [];
	}

	function getUnionValues(t: GraphQLType): readonly GraphQLObjectType[] {
		try {
			if (isUnionType(t)) return t.getTypes() ?? [];
		} catch {
			return [];
		}
		return [];
	}

	function willExpandEnum(t: GraphQLType) {
		const valuesCount = isEnumType(t)
			? getEnumValues(t).length
			: isUnionType(t)
				? getUnionValues(t).length
				: 0;
		return Boolean(
			(isEnumType(t) || isUnionType(t)) &&
				enumValues &&
				!noExpandEnums &&
				(inline ? valuesCount <= 3 : true) &&
				valuesCount <= 10
		);
	}
</script>

<!-- Need to avoid extraneous whitespace, so the code is ugly like that. Sowwy ._. -->
{#if !typ}(none){:else}{#if isEnumType(typ)}{#if !enumValues || !willExpandEnum(typ)}<a
				href="#{typ.name}"
				title={(enumValues || []).map((v) => v.name).join(' | ')}
				class="type enum">{typ.name}</a
			>{:else}{#if nullable}({/if}{#each Object.entries(enumValues) as [i, value]}<span
					class="type enum enum-value"
					><svelte:self nullable={false} {inline} {noExpandEnums} typ={value}></svelte:self></span
				>{#if Number(i) < enumValues.length - 1}<span class="type enum enum-value-separator"
						>&nbsp;|&#x20;</span
					>{/if}{/each}{#if nullable}){/if}{/if}{:else if isInputObjectType(typ)}<a
			href="#{typ.name}"
			class="type input">{typ.name}</a
		>{:else if isInterfaceType(typ)}<span class="type interface">{typ.name}</span
		>{:else if isListType(typ)}<span class="type array">[</span><svelte:self
			noExpandEnums={true}
			{nullable}
			{inline}
			typ={typ.ofType}
		/><span class="type array">]</span>{:else if isNonNullType(typ)}<svelte:self
			{noExpandEnums}
			{inline}
			nullable={false}
			typ={typ.ofType}
		/>{:else if isObjectType(typ)}{#if typ.name?.endsWith('Connection') && underlyingType}<span
				class="type connection"
				><a class="type connection" href="/#types/special/connection">Connection</a>&lt;<svelte:self
					{noExpandEnums}
					{inline}
					{nullable}
					typ={underlyingType}
				></svelte:self>&gt;</span
			>{:else}<a class="type object" href="#{typ.name}">{typ.name}</a
			>{/if}{:else if isScalarType(typ)}<span class="type scalar">{typ.name}</span
		>{:else if isUnionType(typ)}{#if typ.name?.endsWith('Result') && underlyingType}<span
				class="type errorable"
				><a class="type errorable" href="/#types/special/result">Result</a>&lt;<svelte:self
					{inline}
					{noExpandEnums}
					{nullable}
					typ={underlyingType}
				></svelte:self>&gt;</span
			>{:else}
			{#if willExpandEnum(typ)}{#if nullable}({/if}<span class="type union">
					{#each Object.entries(getUnionValues(typ)) as [i, value]}
						<svelte:self nullable={false} noExpandEnums {inline} typ={value}
						></svelte:self>{#if Number(i) < getUnionValues(typ).length - 1}&nbsp;<strong>|</strong
							>&nbsp;{/if}{/each}</span
				>{#if nullable}){/if}{:else}<a href="#{typ.name}">{typ.name}</a>{/if}{/if}{:else}<span
			class="type unknown">unknown</span
		>{/if}<span class:nullable class:non-nullable={isNonNullType(typ)}
		>{#if invertNullabilitySign}{#if !isNonNullType(typ) && nullable}{#if explicitNullabilitySign}&nbsp;|&#x20;null{:else}<span
						title="Peut être null">?</span
					>{/if}{/if}{:else if isNonNullType(typ)}!{/if}</span
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
