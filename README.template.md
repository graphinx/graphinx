<p align="center">
<img src="./wordmark.svg" alt="Graphinx logo" height="100" /><br>
<i>Beautiful, auto-generated API documentation for your GraphQL APIs.</i>
<br>
<br>
<img src="./demo.gif" alt="Graphinx logo" width="80%" /><br>
</p>

## Production example

- [Churros](https://github.com/inp-net/churros)' API: [api-docs.churros.inpt.fr](https://api-docs.churros.inpt.fr)

## Features

### Less noise

|                              |                                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![](./demo-relay.png)        | <h4>Relay integration</h4><br> Don't pollute your documentation with hundreds of `ThingEdge` and `ThingConnection` types. Graphinx will automatically detect them and display them as `Connection<Thing>`. |
| ![](./demo-result-types.png) | <h4>Result types</h4><br> Similarly, Graphinx will detect return types that are unions of a Success type and error types.                                                                                  |

### Less indirection

|                                                                                                                                                                                                                                                                                                         |                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Some types are only used in one place. Documenting them somewhere else is unecessary, and makes answering the important question complex: _what data can I get on this object?_ <br><br> Graphinx gives template the opportunity to _embed types when they are only referenced by a single other type_. | ![](./demo-inlined-types.png) |

### Ready for scale

|                         |                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![](./demo-modules.png) | Big GraphQL APIs have _a lot_ of types, queries and mutations. Don't let your users read a 10,000-pages-long dump of unrelated, alphabetically-sorted types. <br><br> With Graphinx, you organize your schema items (types, queries, mutations and subscriptions) into _modules_. <br><br> You can define modules manually, or [define patterns to auto-categorize your items based on your source code](#reference-filesystem_modules). |

### Extensible

|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| As with the Sphinx documentation tool, Graphinx is template-based: if you want your documentation site to have a unique look, [it's really easy to do so](https://github.com/graphinx/templates/blob/main/CONTRIBUTING.md).<br><br> Graphinx essentially processes your schema into data that's ready to use for documentation site generation. [Here's an example](./example/generated.data.ts) of what the generated data made available to templates looks like <br><bR> Right now, Graphinx offers a gorgeous default template, and a _markdown_ template, that exports an index markdown file as well as one file per module. | ![](./demo-template-definition.png) <br> _A template's `package.json`_ |

## Getting Started

1. Add Graphinx to your dev dependencies:

   ```bash
   yarn add --dev graphinx
   ```

2. Initialize a config file

   ```bash
   yarn graphinx init
   ```

3. Follow the instructions given by the CLI ;)

## Configuration

Configuration is done through a `.graphinx.yaml` config file. The path to the config file can be changed with `--config`.

A JSON schema is available at <https://raw.githubusercontent.com/graphinx/graphinx/main/config.schema.json>.

<!-- Include docs/config.md -->

## Available templates

See [graphinx/templates](https://github.com/graphinx/templates?tab=readme-ov-file#list-of-templates)

## Creating a new template

See [graphinx/templates' contribution guide](https://github.com/graphinx/templates/blob/main/CONTRIBUTING.md)
