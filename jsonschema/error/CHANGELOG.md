# 1.0.0
- switch to semver versioning 1.0.0 is after 2.yaml
- switch to JSONSchema Draft 7
- use $schema instead of meta.schema, meta.schema has been removed.
- use meta.stream instead of meta.topic, meta.topic has been removed.
- set $id to the relative schema URI
- meta.uri is no longer required, as it wasn't always meaningful
- meta.uri format is now uri-reference instead of uri to support relative URIs.

# Version 2
- Added `minLength: 1` for required string properties.