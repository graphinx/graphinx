# .graphinx.yaml

Configuration file for generating documentation sites with Graphinx.

_Default configuration values:_
```yaml
template: graphinx/templates/default
schema:
  static: https://example.com/graphql
branding:
  name: My API
  logo:
    dark: https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png
    light: https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png
types:
  relay:
    connection: ^[A-Z]\w+Connection$
    nodes: edges.node
    edges: edges
  errors:
    result: ^[A-Z]\w+Result$
    success: ^[A-Z]\w+Success$
    datafield: data
  input:
    type: Mutation[FieldName]Input
environment: {}
modules:
  order: []
  mapping: {}

```


## `template`

Template specifier (repository or sub-path to a template if the repo has more than one). Use #branch-or-tag at the end to specify a branch or tag. You can use owner/repo for a github repository.
  - Default: "graphinx/templates/default"
  - String

## `schema`

Ways to get the schema
  - _One of:_
    - `static`
    - `introspection`
      - `url`:         URL to an introspection endpoint
      - `headers`:         Headers to send with the introspection query
        - Optional
        - Object of strings

## `branding`

Branding options for the generated site
  - `name`:     Name of the site
    - Default: "My API"
  - `logo`:     Logo for the site
    - `dark`:       URL or path to the dark version
      - Default: "https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png"
    - `light`:       URL or path to the light version
      - Default: "https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png"

## `types`

Configuration to handle special types such as Relay connection types and mutation result types
  - `relay`:     Configuration for Relay types. Set to null to disable Relay types integration.
    - Nullable
    - `connection`:       Regular expression to identify Relay connection types by name.
      - Default: "^[A-Z]\\w+Connection$"
    - `nodes`:       Dotted path to the node from a connection object
      - Default: "edges.node"
    - `edges`:       Dotted path to the list of edges from a connection object
      - Default: "edges"
  - `errors`:     Configuration for error types. Set to null to disable error types integration.
    - Nullable
    - `result`:       Regular expression to identify error result type unions by name.
      - Default: "^[A-Z]\\w+Result$"
    - `success`:       Regular expression to identify success result types by name.
      - Default: "^[A-Z]\\w+Success$"
    - `datafield`:       Name of the field that contains the mutation's success data in the result type.
      - Default: "data"
  - `input`:     Configuration for input types of mutations. Set to null to disable input types integration.
    - Nullable
    - `type`:       Input type name for mutations. [FieldName] will be replaced with the field's name, with the first letter capitalized.
      - Default: "Mutation[FieldName]Input"

## `environment`

Environment variables to write to a .env file before building the site
  - Object of strings

## `pages`

Path to a directory of .md pages to be included in the source of the template before building the site
  - Optional
  - String

## `static`

Path to a directory of static files to be copied to the output directory as-is
  - Optional
  - String

## `modules`

Modules configuration
  - `docs`:     Path to a .md file documenting that module. The markdown file's top-level title will become the module's display name. Use [module] to refer to the module name.
    - Optional
  - `icons`:     Path to a SVG file that is the module's icon. Use [module] to refer to the module name.
    - Optional
  - `order`:     Order of the modules. Module names that are not listed here will be placed first.
    - Default: []
    - Array of strings
  - `fallback`:     Fallback module name
    - Optional
  - `filesystem`:     Categorize items into modules based on the existence of files.
    
    List of glob patterns to test, with the following tokens: 
    
    - `[module]`,
    - `[fieldname]`,
    - `[typename]`,
    - `[parent]`
    
    (note that these (except `[module]`) are casing-insensitive, the following are supported: camelCase, snake_case, kebab-case and PascalCase).
    
     For example, `- src/modules/[module]/resolvers/[parent].[fieldname].ts` will categorize `Query.loggedIn` into "users" if `src/modules/users/resolvers/{query,Query}.{logged-in,logged_in,loggedIn,LoggedIn}.ts exists`.
    
    
    - Optional
    - Array of strings
  - `mapping`:     Map schema items to module names. Useful if you don't want to annotate your schema with @graphinx directives. For example: `{ "Query.version": "global" }`
    - Object of strings

## `description`

Markdown file to insert content on the site's homepage
  - Optional
  - String

## `footer`

Markdown content for the site's footer
  - Optional
  - String
