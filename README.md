# Narasimha

A collection of functions and Svelte components to easily build a documentation site for a GraphQL API.

## Getting Started

Create your website by using our template:

```bash
yarn create narasimha my-docs-site
```

## Using the utility functions to get schema information

You can, in the e.g. load function of a SvelteKit page, use the utility functions to get schema information:

```javascript
import { schemaUtils } from 'narasimha';
import { schema } from '$lib/schema';
export async function load({ params }) {
	return { query: schemaUtils.findQueryInSchema(schema, params.query) };
}
```

## Using the UI components directly

You can also use the components directly in an existing Svelte(Kit) project:

```svelte
<script>
    import { Query } from 'narasimha';
    export let data: PageData;
</script>

<Query query={data.query}>
```
