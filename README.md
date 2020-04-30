# DEPRECATED

This repository has been replaced by 2 other schema repositories:

https://gerrit.wikimedia.org/r/admin/projects/schemas/event/primary
https://gerrit.wikimedia.org/r/admin/projects/schemas/event/secondary




# mediawiki/event-schemas

This is a repository of event schemas for use with Mediawiki and other related services
deployed at the Wikimedia foundation.  JSONSchemas for events are versioned as static
files in the jsonschema/ directory.

This repository uses [jsonschema-tools](https://github.com/wikimedia/jsonschema-tools) to
automate dereferencing and versioning schemas.  On an `npm install`, a git pre-commit
hook will be added.  Once in place, the pre-commit hook will allow you to create new
version files of schemas by editing the 'current.yaml' file for that schema.  If a current.yaml
file is modified, the pre-commit hook will invoke jsonsschema-tools to dereference any
JSON $ref pointers, and then render a versioned file based on the value of `$id` in current.yaml.

By keeping static versioned files in this repository, we can host static schemas at remote
URLs via a simple HTTP fileserver.  This allows looking up the exact version of a schema for
event data from the URL found in an event's `$schema` field.
