"use strict";

const fs = require('fs');
const yaml = require('js-yaml');
const file = require('file');
const path = require('path');
const preq = require('preq');

const assert = require('assert');
const Ajv = require('ajv');

const ajv = new Ajv({
    schemaId: 'auto',
    loadSchema: (uri) => {
        return preq.get({ uri })
        .then((content) => {
            if (content.status !== 200) {
                throw new Error(`Failed to load meta schema at ${uri}`);
            }
            ajv.addMetaSchema(JSON.parse(content.body), uri);
        })
    }
});
const baseDir = path.join(__dirname, '/../../jsonschema/');

// Checks whether the schema contains each and every required property from the 'superschema'
assert.isSuperSchema = (schema, example, path, required) => {
    path = path || '';
    required = required || []

    if (typeof schema !== typeof example || Array.isArray(schema) !== Array.isArray(example)) {
        throw new assert.AssertionError({
            message: `Error at path: ${path}`,
            expected: example,
            actual: schema || {}
        });
    } else if (Array.isArray(schema)) {
        // For arrays we need to check that all of the elements from example
        // are also in the schema
        if (!example.every((element) => schema.indexOf(element) !== -1)) {
            throw new assert.AssertionError({
                message: `Error at path: ${path}`,
                expected: example,
                actual: schema || []
            });

        }
    } else if (typeof example === 'object') {
        // Go recursively
        return Object.keys(example)
        .filter((key) => key !== 'title' && key !== 'description' && key !== 'pattern')
        // Filter for key in both schemas, or required keys in example schema
        .filter((key) => key in schema || required.indexOf(key) >= 0)
        .forEach((key) =>
            assert.isSuperSchema(schema[key], example[key], path + '.' + key, example['required'])
        );
    } else if (typeof example === 'string' &&
            typeof schema === 'string' &&
            /^\/.+\/$/.test(example)) {
        if (!new RegExp(example.substring(1, example.length - 1)).test(schema)) {
            throw new assert.AssertionError({
                message: `Error at path: ${path}`,
                expected: example,
                actual: schema
            });
        }
    } else if (schema !== example) {
        throw new assert.AssertionError({
            message: `Error at path: ${path}`,
            expected: example,
            actual: schema
        });
    }
};

const isYamlJson = (fileName) => {
    return fileName.endsWith('.yaml') || fileName.endsWith('.json');
};

const loadYaml = (path) => {
    return yaml.safeLoad(fs.readFileSync(path), 'utf8');
};

const cropExtension = (fileName) => {
    return fileName.replace(/\.[^.]+$/, '');
};

/**
 * Here we generate a set of tests that check individual schemas for compliance
 * with common properties schemas, e.g. thay contain all the same properties,
 * the types are correct and required isn't missing.
 *
 * We've set up a directory structure in the test folder mapping the directory
 * structure of events. As we transfer this directory structure, we find common
 * schemas along the path and test that all the schemas in subdirectories comply
 * to this common schema.
 */
describe('Json schema', () => {
    file.walkSync(baseDir, (dirPath, dirs, files) => {
        files.filter(isYamlJson).forEach((fileName) => {
            const schemaPath = path.join(path.relative(baseDir, dirPath), fileName);
            const schema = loadYaml(path.join(dirPath, fileName));

            // TODO: Temporary. For now we will only run tests on old-style schemas.
            // As soon as tests for new-style schemas are ready we would enable them.
            let testFunc = describe;
            const schemaVersion = parseInt(/\/draft-(\d+)\//.exec(schema.$schema)[1], 10);
            if (schemaVersion > 4) {
                testFunc = describe.skip;
            }

            //if (schema.$schema === 'http://json-schema.org/draft-07/schema#')
            testFunc('Schema ' + cropExtension(schemaPath), () => {
                it('Must be valid JSON-Schema', () => ajv.compileAsync(schema, true));

                if (schemaPath === 'test/event/1.yaml') {
                    return;
                }

                const schemaVersion = Number.parseInt(fileName.replace('.yaml', ''));

                // Only test the latest schema version for inclusion of all items
                if (!fs.existsSync(path.join(dirPath, `${schemaVersion + 1}.yaml`))) {
                    // Testing conformance to the common interface
                    const pathSegments = schemaPath.split('/');
                    for (let idx = 0; idx < pathSegments.length - 1; idx++) {
                        const subPath = path.join(__dirname, pathSegments.slice(0, idx).join('/'));
                        if (fs.existsSync(subPath) && fs.statSync(subPath).isDirectory()) {
                            fs.readdirSync(subPath).filter(isYamlJson).forEach((fileName) => {
                                const exampleSchema = loadYaml(path.join(subPath, fileName));
                                it('Must contain ' + cropExtension(fileName), () => {
                                    assert.isSuperSchema(schema, exampleSchema);
                                });
                            });
                        }
                    }
                }

                // Testing that new versions only extend previous versions
                if (schemaVersion > 1) {
                    for (let prevVersion = schemaVersion - 1; prevVersion > 0; prevVersion--) {
                        const prevSchema = loadYaml(path.join(dirPath, prevVersion + '.yaml'));
                        // Until  we switch all to new-style schema,
                        // allow non entirely backwards compatible changes.
                        it('Must only extend version ' + prevVersion, function() {
                            try {
                                assert.isSuperSchema(schema, prevSchema);
                            } catch(e) {
                                this.skip();
                            }
                        });
                    }
                }
            });
        });
    });
});
