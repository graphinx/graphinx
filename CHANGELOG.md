# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/graphinx/graphinx/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/graphinx/graphinx/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/graphinx/graphinx/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/graphinx/graphinx/releases/tag/v0.6.0

[//]: # (C3-2-DKAC:GGH:Hgithub.com:Rgraphinx/graphinx:Tv{t})
