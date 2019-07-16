This schema contains fields that should be present in all events.  To include it in your current
event schema, add

```
$ref: /common/1.0.0#/properties
```

in the `properties` object in all current.yaml schema files.  If the jsonschema-tools
pre-commit hook is installed, then when committing a change to a current.yaml file,
a versioned dereferenced file will be reendered including the common schemea fields.
