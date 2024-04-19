<script lang="ts">
import { Pantry } from "$lib/pantry.js";
import ModulesList from "$lib/ui/ModulesList.svelte";
import type { PageData } from "./$types.js";

export let data: PageData;
</script>

{#await Pantry.fromSerialized(data.schema, data.pantry) then pantry}
	<ModulesList modules={pantry.modules}></ModulesList>
{/await}
