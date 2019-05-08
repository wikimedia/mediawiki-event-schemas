# 0.0.3
- switch to semver versioning 0.0.3 is after 2.yaml
- Don't use .yaml in filenames anymore, makes URIs cleaner
- switch to JSONSchema Draft 7
- use $schema instead of meta.schema, meta.schema has been removed.
- use meta.stream instead of meta.topic, meta.topic has beren removed.
- set $id to the relative schema URI
- meta.uri is no longer required, as it wasn't always meaningful
- meta.uri format is now uri-reference instead of uri to support relative URIs.

# Version 2
- Added `minLength: 1` for required string properties.