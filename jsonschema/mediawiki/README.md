# Mediawiki Specific Event Schemas

Mediawiki entities are represented in directories here.  Individual
change event types are in subdirectories of each entity.  E.g.

```
page/
  create/
  delete/
  restore/
# ...
```

The schema form of each entity should be fairly similiar, with individual
variations needed in order to represent the properties that change during an
event.  Top level fields such as `page_id` or `user_id` should refer to
the entity that the event represents.  This means that a `user_id`
field on a user event represents the affected user entity, NOT the user
that performed the change.  Mediawiki code refers to such user's as
'performers', and we keep that convention here as well.

For update (change) type events, the prior values of the entity's
changed properties should be contained in a `prior_state` subobject, with
field names the same as the entity's top level field names.


NOTE: Any change event directly present in this directory (e.g. `page_delete`,
`revision_create`) should be considered deprecated.  Analytics and Services are
working together to switch over uses of these schemas to the new entity-first
ones.
