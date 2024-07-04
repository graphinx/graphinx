# Objects
* [`Graphinx configuration`](#reference-graphinx-configuration) (root object)


---------------------------------------
<a name="reference-graphinx-configuration"></a>
## Graphinx configuration

Configuration file for Graphinx, a tool to generate a documentation website for a GraphQL API

**`Graphinx configuration` Properties**

|   |Type|Description|Required|
|---|---|---|---|
|**template**|`string`|Degit repository specifier to use as the website template. Defaults to Graphinx's default template.  See [degit's documentation](https://www.npmjs.com/package/degit#basics) for more information.  Basic syntax is `owner/repo/path#branch` for github repositories, or `https://example.com/...` for any git repository.  The only difference is that the default branch name is "main" instead of master (i.e. use  `...#master` to clone the master branch, and `...#main` is not needed)
|No|
|**branding**|`object`|Branding information for the API| &#10003; Yes|
|**footer**|`string`|HTML to insert at the bottom of every page
|No|
|**static**|`string`|Directory to look for additional static files that will be copied to the template's `static` directory, to be served at the root of the website
| &#10003; Yes|
|**pages**|`string`|Directory to look for additional documentation pages, as markdown or [MDSveX (.svx)](https://mdsvex.pngwn.io/) files. The final URL will be the path to the markdown file relative to the value of `pages`, without the `.md` extension. For example, with `pages: ./docs`, a page defined in `./docs/foo/bar.md` will be available at `/foo/bar`. Files are copied at build time into the template code at `src/routes/(path to file without extension)/+page.svx`. If the filename is prefix with a `+`, it'll be copied in src/routes directly (not in a subdirectory)
| &#10003; Yes|
|**modules**|`object`|Categorize your schema's items. If not specified, all items will be displayed in a single module|No|
|**schema**|`any`|A path or URL to a graphl schema file, or configuration for introspection| &#10003; Yes|

Additional properties are not allowed.

### Graphinx configuration.template

Degit repository specifier to use as the website template. Defaults to Graphinx's default template.  See [degit's documentation](https://www.npmjs.com/package/degit#basics) for more information.  Basic syntax is `owner/repo/path#branch` for github repositories, or `https://example.com/...` for any git repository.  The only difference is that the default branch name is "main" instead of master (i.e. use  `...#master` to clone the master branch, and `...#main` is not needed)


* **Type**: `string`
* **Required**: No
* **Examples**:
    * `"ewen-lbh/graphinx/packages/template#main"`

### Graphinx configuration.branding

Branding information for the API

* **Type**: `object`
* **Required**:  &#10003; Yes

### Graphinx configuration.footer

HTML to insert at the bottom of every page


* **Type**: `string`
* **Required**: No

### Graphinx configuration.static

Directory to look for additional static files that will be copied to the template's `static` directory, to be served at the root of the website


* **Type**: `string`
* **Required**:  &#10003; Yes
* **Examples**:
    * `"./static"`

### Graphinx configuration.pages

Directory to look for additional documentation pages, as markdown or [MDSveX (.svx)](https://mdsvex.pngwn.io/) files. The final URL will be the path to the markdown file relative to the value of `pages`, without the `.md` extension. For example, with `pages: ./docs`, a page defined in `./docs/foo/bar.md` will be available at `/foo/bar`. Files are copied at build time into the template code at `src/routes/(path to file without extension)/+page.svx`. If the filename is prefix with a `+`, it'll be copied in src/routes directly (not in a subdirectory)


* **Type**: `string`
* **Required**:  &#10003; Yes

### Graphinx configuration.modules

Categorize your schema's items. If not specified, all items will be displayed in a single module

* **Type**: `object`
* **Required**: No

### Graphinx configuration.schema

A path or URL to a graphl schema file, or configuration for introspection

* **Type**: `any`
* **Required**:  &#10003; Yes


