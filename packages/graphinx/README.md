# Graphinx

****
*WARNING*: This project is in a very early stage and not yet ready for production use. I'm in the process of extracting code from [Churros' API documentation package](https://github.com/inp-net/churros/tree/main/packages/docs) and turning it into a library.
****

A collection of functions and Svelte components to easily build a documentation site for a GraphQL API.

## Getting Started

Create your website by using our template:

```bash
yarn create graphinx my-docs-site
```

## Using the utility functions to get schema information

You can, in the e.g. load function of a SvelteKit page, use the utility functions to get schema information:

```javascript
import { schemaUtils } from 'graphinx';
import { schema } from '$lib/schema';
export async function load({ params }) {
	return { query: schemaUtils.findQueryInSchema(schema, params.query) };
}
```

## Using the UI components directly

You can also use the components directly in an existing Svelte(Kit) project:

```svelte
<script>
    import { Query } from 'graphinx';
    export let data: PageData;
</script>

<Query query={data.query}>
```
