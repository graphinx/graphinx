# Graphinx

Sphinx for GraphQL APIs.

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

A JSON schema is available at <https://raw.githubusercontent.com/ewen-lbh/graphinx/main/config.schema.json>. The documentation below is generated from it, but right now is missing documentation for nested objects...

<!-- Include docs/config.md -->
### Objects
* [`Branding`](#reference-branding)
* [`Graphinx`](#reference-graphinx) (root object)
* [`Modules configuration`](#reference-modules)
    * [`Filesystem modules`](#reference-filesystem_modules)
        * [`Filesystem matcher`](#reference-filesystem_matcher)
    * [`Index module configuration`](#reference-index_module)
    * [`Static module configuration`](#reference-static_module)
* [`Schema`](#reference-schema)
    * [`introspection`](#reference-schema_introspection)


---------------------------------------
<a name="reference-branding"></a>
#### Branding

Branding information for the API

**`Branding` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**logo**|`string`|Path or URL to the API's logo| &#10003; Yes|
|**name**|`string`|Name of the API| &#10003; Yes|

Additional properties are not allowed.

##### Branding.logo

Path or URL to the API's logo

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Format**: uri

##### Branding.name

Name of the API

* **Type**: `string`
* **Required**:  &#10003; Yes




---------------------------------------
<a name="reference-filesystem_matcher"></a>
#### Filesystem matcher

**`Filesystem matcher` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**files**|`string`|Glob pattern of file paths to search in| &#10003; Yes|
|**match**|`string`|Regular expressions that will be tried for every file found in `files`. The regexp must define a named capture group named `name`. A given GraphQL Schema item will be considered as part of that module if a line of any file as specified by `files` matches this regular expression, with the capture group named `name` having as value the GraphQL schema type's name.| &#10003; Yes|
|**contribution**|`string`|URL to use for the "contribute" button for that item. Available placeholders are:

- %module%, 
- %name%, the item's name
- %path%, the path to the file that matched

If the value is not specified, the "contribute" button will not be displayed
|No|

Additional properties are not allowed.

##### filesystem_matcher.files

Glob pattern of file paths to search in

* **Type**: `string`
* **Required**:  &#10003; Yes

##### filesystem_matcher.match

Regular expressions that will be tried for every file found in `files`. The regexp must define a named capture group named `name`. A given GraphQL Schema item will be considered as part of that module if a line of any file as specified by `files` matches this regular expression, with the capture group named `name` having as value the GraphQL schema type's name.

* **Type**: `string`
* **Required**:  &#10003; Yes

##### filesystem_matcher.contribution

URL to use for the "contribute" button for that item. Available placeholders are:

- %module%, 
- %name%, the item's name
- %path%, the path to the file that matched

If the value is not specified, the "contribute" button will not be displayed


* **Type**: `string`
* **Required**: No




---------------------------------------
<a name="reference-filesystem_modules"></a>
#### Filesystem modules

Auto-categorize using your API's source code tree. Every value in here can use %module%, which will be replaced by the module we are currently checking.

**`Filesystem modules` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**names**|`any`|How to get the modules' names?|No|
|**order**|`string` `[]`|Order in which to display the modules. If a module is not listed here, it will be displayed at the end. If not specified, the order is alphabetical|No|
|**intro**|`string`|Path to a markdown file describing the module. The first paragraph will serve as the short description, while the `<h1>`'s content will serve as the module's display name| &#10003; Yes|
|**icon**|`string`|Path or URL to an icon for the module|No|
|**items**|`filesystem_matcher` `[]`|How to know that a given schema item (a type, a query, a mutation, etc.) should belong to that module?| &#10003; Yes|

Additional properties are not allowed.

##### filesystem_modules.names

How to get the modules' names?

* **Type**: `any`
* **Required**: No

##### filesystem_modules.order

Order in which to display the modules. If a module is not listed here, it will be displayed at the end. If not specified, the order is alphabetical

* **Type**: `string` `[]`
* **Required**: No

##### filesystem_modules.intro

Path to a markdown file describing the module. The first paragraph will serve as the short description, while the `<h1>`'s content will serve as the module's display name

* **Type**: `string`
* **Required**:  &#10003; Yes

##### filesystem_modules.icon

Path or URL to an icon for the module

* **Type**: `string`
* **Required**: No
* **Format**: uri

##### filesystem_modules.items

How to know that a given schema item (a type, a query, a mutation, etc.) should belong to that module?

* **Type**: `filesystem_matcher` `[]`
* **Required**:  &#10003; Yes




---------------------------------------
<a name="reference-graphinx"></a>
#### Graphinx

Configuration file for Graphinx, a tool to generate a documentation website for a GraphQL API

**`Graphinx` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**template**|`string`|Degit repository specifier to use as the website template. Defaults to Graphinx's default template.  See [degit's documentation](https://www.npmjs.com/package/degit#basics) for more information.  Basic syntax is `owner/repo/path#branch` for github repositories, or `https://example.com/...` for any git repository.  The only difference is that the default branch name is "main" instead of master (i.e. use  `...#master` to clone the master branch, and `...#main` is not needed)|No|
|**branding**|`Branding`|Branding information for the API| &#10003; Yes|
|**footer**|`string`|HTML to insert at the bottom of every page|No|
|**static**|`string`|Directory to look for additional static files that will be copied to the template's `static` directory, to be served at the root of the website| &#10003; Yes|
|**pages**|`string`|Directory to look for additional documentation pages, as markdown or [MDSveX (.svx)](https://mdsvex.pngwn.io/) files. The final URL will be the path to the markdown file relative to the value of `pages`, without the `.md` extension. For example, with `pages: ./docs`, a page defined in `./docs/foo/bar.md` will be available at `/foo/bar`. Files are copied at build time into the template code at `src/routes/(path to file without extension)/+page.svx`. If the filename is prefix with a `+`, it'll be copied in src/routes directly (not in a subdirectory)| &#10003; Yes|
|**environment**|`object`|Define environment variables that will be made available to the template.|No|
|**modules**|`modules`|Categorize your schema's items. If not specified, all items will be displayed in a single module|No|
|**schema**|`schema`|A path or URL to a graphl schema file, or configuration for introspection| &#10003; Yes|

Additional properties are not allowed.

##### Graphinx.template

Degit repository specifier to use as the website template. Defaults to Graphinx's default template.  See [degit's documentation](https://www.npmjs.com/package/degit#basics) for more information.  Basic syntax is `owner/repo/path#branch` for github repositories, or `https://example.com/...` for any git repository.  The only difference is that the default branch name is "main" instead of master (i.e. use  `...#master` to clone the master branch, and `...#main` is not needed)

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"ewen-lbh/graphinx/packages/template#main"`

##### Graphinx.branding

Branding information for the API

* **Type**: `Branding`
* **Required**:  &#10003; Yes

##### Graphinx.footer

HTML to insert at the bottom of every page

* **Type**: `string`
* **Required**: No

##### Graphinx.static

Directory to look for additional static files that will be copied to the template's `static` directory, to be served at the root of the website

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Examples**:
    * `"./static"`

##### Graphinx.pages

Directory to look for additional documentation pages, as markdown or [MDSveX (.svx)](https://mdsvex.pngwn.io/) files. The final URL will be the path to the markdown file relative to the value of `pages`, without the `.md` extension. For example, with `pages: ./docs`, a page defined in `./docs/foo/bar.md` will be available at `/foo/bar`. Files are copied at build time into the template code at `src/routes/(path to file without extension)/+page.svx`. If the filename is prefix with a `+`, it'll be copied in src/routes directly (not in a subdirectory)

* **Type**: `string`
* **Required**:  &#10003; Yes

##### Graphinx.environment

Define environment variables that will be made available to the template.

* **Type**: `object`
* **Required**: No
* **Type of each property**: `string`

##### Graphinx.modules

Categorize your schema's items. If not specified, all items will be displayed in a single module

* **Type**: `modules`
* **Required**: No

##### Graphinx.schema

A path or URL to a graphl schema file, or configuration for introspection

* **Type**: `schema`
* **Required**:  &#10003; Yes




---------------------------------------
<a name="reference-index_module"></a>
#### Index module configuration

Configure the "index" module, that contains every schema item. Set this to false, or remove it, to disable the index module. Set to true to enable it, with default values

**`Index module configuration` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**title**|`string`|Display name of the index module|No|
|**description**|`string`|A Markdown-formatted text describing the index module|No|

Additional properties are not allowed.

##### index_module.title

Display name of the index module

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"Index"`

##### index_module.description

A Markdown-formatted text describing the index module

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"The entire GraphQL schema"`




---------------------------------------
<a name="reference-modules"></a>
#### Modules configuration

Categorize your schema's items. If not specified, all items will be displayed in a single module

**`Modules configuration` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**index**|`index_module`|Configure the "index" module, that contains every schema item. Set this to false, or remove it, to disable the index module. Set to true to enable it, with default values|No|
|**filesystem**|`filesystem_modules`|Auto-categorize using your API's source code tree. Every value in here can use %module%, which will be replaced by the module we are currently checking.|No|
|**static**|`static_module` `[]`|Manually declare modules.|No|

Additional properties are not allowed.

##### modules.index

Configure the "index" module, that contains every schema item. Set this to false, or remove it, to disable the index module. Set to true to enable it, with default values

* **Type**: `index_module`
* **Required**: No

##### modules.filesystem

Auto-categorize using your API's source code tree. Every value in here can use %module%, which will be replaced by the module we are currently checking.

* **Type**: `filesystem_modules`
* **Required**: No

##### modules.static

Manually declare modules.

* **Type**: `static_module` `[]`
* **Required**: No




---------------------------------------
<a name="reference-schema"></a>
#### Schema

A path or URL to a graphl schema file, or configuration for introspection

**`Schema` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**introspection**|`schema_introspection`|Introspect a GraphQL schema of a given running GraphQL API server|No|
|**static**|`string`|Path or URL to a GraphQL schema file|No|

Additional properties are not allowed.

##### schema.introspection

Introspect a GraphQL schema of a given running GraphQL API server

* **Type**: `schema_introspection`
* **Required**: No

##### schema.static

Path or URL to a GraphQL schema file

* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"./schema.graphql"`




---------------------------------------
<a name="reference-schema_introspection"></a>
#### Schema introspection

Introspect a GraphQL schema of a given running GraphQL API server

**`Schema introspection` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**url**|`string`|URL where to query the API to generate a schema via introspection| &#10003; Yes|
|**headers**|`object`|Define headers to use when doing the POST request. For example, an authorization header|No|

Additional properties are not allowed.

##### schema_introspection.url

URL where to query the API to generate a schema via introspection

* **Type**: `string`
* **Required**:  &#10003; Yes
* **Format**: uri

##### schema_introspection.headers

Define headers to use when doing the POST request. For example, an authorization header

* **Type**: `object`
* **Required**: No
* **Type of each property**: `string`




---------------------------------------
<a name="reference-static_module"></a>
#### Static module configuration

**`Static module configuration` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**title**|`string`|Display name of the module| &#10003; Yes|
|**name**|`string`|URL-friendly name of the module. Cannot be "index" (reserved for the index module)| &#10003; Yes|
|**intro**|`string`|A Markdown-formatted text describing the module| &#10003; Yes|
|**icon**|`string`|Path or URL to an icon for the module|No|
|**items**|`string` `[]`|List of schema item names that belong in that module| &#10003; Yes|

Additional properties are not allowed.

##### static_module.title

Display name of the module

* **Type**: `string`
* **Required**:  &#10003; Yes

##### static_module.name

URL-friendly name of the module. Cannot be "index" (reserved for the index module)

* **Type**: `string`
* **Required**:  &#10003; Yes

##### static_module.intro

A Markdown-formatted text describing the module

* **Type**: `string`
* **Required**:  &#10003; Yes

##### static_module.icon

Path or URL to an icon for the module

* **Type**: `string`
* **Required**: No
* **Format**: uri

##### static_module.items

List of schema item names that belong in that module

* **Type**: `string` `[]`
* **Required**:  &#10003; Yes



## Template authoring

Docs TBD.
