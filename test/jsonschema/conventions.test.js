'use strict';

const path = require('path');
const assert = require('assert').strict;
const jsonSchemaTools = require('@wikimedia/jsonschema-tools');

const Ajv = require('ajv');
const ajv = new Ajv({
    schemaId: '$id'
});
const isSchemaValid = ajv.compile(require('ajv/lib/refs/json-schema-draft-07.json'));
const isSchemaSecure = ajv.compile(require('ajv/lib/refs/json-schema-secure.json'));

const BASE_PATH = path.join(__dirname, '..', '..', 'jsonschema');
const allSchemas = jsonSchemaTools.findSchemasByTitle(BASE_PATH);

describe('conventions', () => {
    for (const title of Object.keys(allSchemas)) {
        describe(title, () => {
            allSchemas[title].forEach((schemaInfo) => {
                describe(schemaInfo.current ? 'current' : schemaInfo.version, () => {
                    const schema = schemaInfo.schema;
                    it('must be valid JSON-Schema', () => {
                        if (!isSchemaValid(schema)) {
                            throw new assert.AssertionError({
                                message: 'Schema is invalid',
                                expected: [],
                                actual: isSchemaValid.errors
                            });
                        }
                    });
                    it('must be a secure JSON-Schema', () => {
                        if (!isSchemaSecure(schema)) {
                            throw new assert.AssertionError({
                                message: 'Schema insecure errors',
                                expected: [],
                                actual: isSchemaSecure.errors
                            });
                        }
                    });

                    it('must use snake_case', () => {
                        const assertSnakeCase = (node, path = '') => {
                            (node.allOf || []).forEach((schema) => {
                                assertSnakeCase(schema, path);
                            });
                            Object.keys(node.properties || {}).forEach((prop) => {
                                const propPath = `${path}/properties/${prop}`;
                                if (!/^[$a-z]+[a-z0-9_]*$/.test(prop)) {
                                    throw new assert.AssertionError({
                                        message: `Non snake_case: #/${propPath}`
                                    });
                                }
                                assertSnakeCase(node.properties[prop], propPath);
                            });
                        };
                        assertSnakeCase(schema);
                    });

                    // TODO: https://phabricator.wikimedia.org/T216567
                    it.skip('must only have monomorphic types', () => {
                        const assertMonomorthTypes = (node, path = '') => {
                            if (Array.isArray(node.type)) {
                                throw new assert.AssertionError({
                                    message: `Polymorthic type property at #${path}`
                                });
                            }
                            Object.keys(node.properties || {}).forEach((key) => {
                                const keyPath = `${path}/properties/${key}`;
                                if (!node.properties[key].type) {
                                    throw new assert.AssertionError({
                                        message: `Missing type at #${keyPath}`
                                    });
                                }
                                assertMonomorthTypes(node.properties[key], keyPath);
                            });
                            (node.allOf || []).forEach((schema) => {
                                assertMonomorthTypes(schema, path);
                            });
                        };
                        assertMonomorthTypes(schema);
                    });

                    // The following tests are for materialized schemas only
                    if (schemaInfo.current) {
                        return;
                    }

                    it('all required properties must exist', () => {
                        const assertRequired = (node, path = '') => {
                            if (node.required) {
                                assert.ok(node.properties, `#${path}/properties must exist`);
                                node.required.forEach((prop) => {
                                    assert.ok(
                                        node.properties[prop],
                                        `#${path}/properties/${prop} is required but not exist`
                                    );
                                });
                            }
                            Object.keys(node.properties || {}).forEach((prop) => {
                                assertRequired(node.properties[prop], `${path}/properties/${prop}`);
                            });
                        };
                        assertRequired(schema);
                    });
                });
            });
        });
    }
});
