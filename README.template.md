<p align="center">
<img src="./wordmark.svg" alt="Graphinx logo" height="100" /><br>
<i>Beautiful, auto-generated API documentation for your GraphQL APIs.</i>
<br>
<br>
<img src="./demo.gif" alt="Graphinx logo" width="80%" /><br>
</p>

## Production example

- [Churros](https://github.com/inp-net/churros)' API: [api-docs.churros.inpt.fr](https://api-docs.churros.inpt.fr)

## Getting Started

1. Add Graphinx to your dev dependencies:

   ```bash
   yarn add --dev graphinx
   ```

2. Initialize a config file

   ```bash
   yarn graphinx --init
   ```

## Configuration

Configuration is done through a `.graphinx.yaml` config file. The path to the config file can be changed with `--config`.

A JSON schema is available at <https://raw.githubusercontent.com/graphinx/graphinx/main/config.schema.json>.

<!-- Include docs/config.md -->

## Available templates

See [graphinx/templates](https://github.com/graphinx/templates?tab=readme-ov-file#list-of-templates)

## Creating a new template

See [graphinx/templates' contribution guide](https://github.com/graphinx/templates/blob/main/CONTRIBUTING.md)
