# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- support for `static`
- checks for version mismatches between the installed Graphinx and the template's dependency

### Changed

- the CLI now has subcommands instead of only flags
- templates cannot read introspection header values anymore

## [0.10.0] - 2024-07-08

### Added

- new field `modules.metadata` on built data that exposes arbitrary objects coming from modules' `intro`. Intended to be used for template-specific things (for example, in the default template, the accent color of a module)
- new field `modules.iconSvg` that contains the module's icon file content as a string (assumes the given icon is a local SVG filepath)
- new config property modules.filesystem.items.debug, to debug if specific items is are matched by a specific matcher
- new field `items.referencedBy` that contains the list of items that reference that item.

### Changed

- paths in the config file are now taken relative to the config file's location, not the current working directory. This makes the use of `--config` not too cumbersome
- huge performance improvements! filesystem matchers are now pre-computed per-module before being run on every item

### Removed

- undocumented feature that allowed specifying `manually_included` in a module intro's frontmatter to manually include stuff. Use filesystem matchers instead.

### Fixed

- a bug where an empty `graphinx-*` folder was created in the current working directory

## [0.9.0] - 2024-07-07

### Added

- special integration for relay (connection and edge types) and result types (result and success types)

### Fixed

- don't write debug “allitems.json” file

## [0.8.0] - 2024-07-07

### Added

- mandatory description in config to fill the index page
- env variable GRAPHINX_ITEMS_LIMIT to limit the maximum count of items to categorize. Useful when developing templates and test data contains a lot of items

### Changed

- branding.logo is now an object of dark and light, to allow setting a different logo on dark and light themes
- contribution and source config settings are now taken into account and exposed to templates
- the categorization process was revamped and is now much faster
- the initial template (generated with --init) has now pins the version of the declared json schema
- example now depends on a development tarball of the graphinx package. The example is not meant to be used directly anyways, and is instead also used internally to develop templates

## [0.7.0] - 2024-07-07

### Added

- initial release

## [0.6.0] - 2024-07-06

### Added

- (No changelog yet)

[Unreleased]: https://github.com/graphinx/graphinx/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/graphinx/graphinx/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/graphinx/graphinx/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/graphinx/graphinx/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/graphinx/graphinx/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/graphinx/graphinx/releases/tag/v0.6.0

[//]: # (C3-2-DKAC:GGH:Hgithub.com:Rgraphinx/graphinx:Tv{t})
