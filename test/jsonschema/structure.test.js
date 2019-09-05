'use strict';

const path = require('path');
const assert = require('assert').strict;
const fs = require('fs');
const semver = require('semver');
const jsonSchemaTools = require('@wikimedia/jsonschema-tools');

const BASE_PATH = path.join(__dirname, '..', '..', 'jsonschema');
const allSchemas = jsonSchemaTools.findSchemasByTitle(BASE_PATH);

describe('structure', () => {
    Object.keys(allSchemas).forEach((schemaTitle) => {
        describe(schemaTitle, () => {
            const dirPath = path.join(BASE_PATH, schemaTitle);
            const schemaInfos = allSchemas[schemaTitle];
            it('must contain current.yaml', () => {
                assert.ok(fs.existsSync(path.join(dirPath, 'current.yaml')));
            });

            it('must not contain current symlink', () => {
                assert.equal(false, fs.existsSync(path.join(dirPath, 'current')));
            });

            describe('current', () => {
                const currentSchemaInfo = schemaInfos.find((schema) => schema.current);
                it('must be equal to materialized latest', async () => {
                    const currentSchema = currentSchemaInfo.schema;
                    const latestSchemaInfo = schemaInfos.filter((schema) => !schema.current).pop();
                    assert.equal(
                        latestSchemaInfo.version,
                        semver.coerce(currentSchema.$id).version
                    );
                    const dereferencedSchema = await jsonSchemaTools.dereferenceSchema(
                        currentSchema,
                        {
                            schemaBaseUris: [ BASE_PATH ]
                        }
                    );
                    assert.deepEqual(dereferencedSchema, latestSchemaInfo.schema);
                });
            });

            allSchemas[schemaTitle].filter((schema) => !schema.current)
            .forEach((schemaInfo) => {
                describe(schemaInfo.version, () => {
                    it('must have yaml version', () => {
                        assert.ok(fs.existsSync(path.join(dirPath, `${schemaInfo.version}.yaml`)));
                    });
                    it('must have json version', () => {
                        assert.ok(fs.existsSync(path.join(dirPath, `${schemaInfo.version}.json`)));
                    });
                    it('must have symlink version pointing to yaml', () => {
                        const filePath = path.join(dirPath, schemaInfo.version);
                        assert.ok(fs.existsSync(filePath));
                        assert.ok(fs.lstatSync(filePath).isSymbolicLink());
                        assert.equal(fs.readlinkSync(filePath), `${schemaInfo.version}.yaml`);
                    });
                    it('json and yaml versions must be equal', () => {
                        assert.deepEqual(
                            schemaInfo.schema,
                            JSON.parse(fs.readFileSync(path.join(dirPath, `${schemaInfo.version}.json`), {
                                encoding: 'utf8'
                            }))
                        );
                    });
                });
            });
        });
    });
});
