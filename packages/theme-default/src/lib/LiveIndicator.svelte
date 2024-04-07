<script lang="ts">
	import Pill from './Pill.svelte';
	export let href: string;
	export let noInteractions = false;
	export let title = 'Also available as a subscription';
</script>

<a {href} class="live-indicator" {title}>
	<Pill {noInteractions}><span class="dot"></span> LIVE</Pill>
</a>

<style>
	.live-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: rgb(255 49 118);
		text-decoration: none;
	}

	.dot::before {
		display: inline-block;
		width: 0.7em;
		height: 0.7em;
		content: '';
		background: currentcolor;
		border-radius: 100000px;
	}
</style>
