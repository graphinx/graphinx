<script lang="ts">
	import { Kind } from 'graphql';

	export let kind: Kind;

	const kinds: Partial<Record<Kind, { color: string; letter: string; title: string }>> = {
		[Kind.INTERFACE_TYPE_DEFINITION]: { color: 'magenta', letter: 'I', title: 'Interface' },
		[Kind.ENUM_TYPE_DEFINITION]: { color: 'pink', letter: 'E', title: 'Enum' },
		[Kind.INPUT_OBJECT_TYPE_DEFINITION]: { color: 'orange', letter: 'N', title: "Objet d'input" },
		[Kind.SCALAR_TYPE_DEFINITION]: { color: 'yellow', letter: 'S', title: 'Scalar' },
		[Kind.UNION_TYPE_DEFINITION]: { color: 'cyan', letter: 'U', title: 'Union' }
		// [Kind.Object]: { color: 'red', letter: 'O', title: 'Object' }
	};

	$: ({ letter, color, title } = kinds[kind] ?? {
		letter: '',
		color: '',
		title: ''
	});
</script>

{#if letter && color && title}
	<div class="indicator" style:--color="var(--{color})" {title}>
		<code class="no-color">{letter}</code>
	</div>
{/if}

<style>
	.indicator {
		display: inline-block;
		width: 1.5em;
		height: 1.5em;
		margin-right: 0.25em;
		color: var(--color);
		text-align: center;
		vertical-align: middle;
		border: 2px solid var(--color);
		border-radius: 50%;
	}
</style>
