"use strict";

const fs = require('fs');
const yaml = require('js-yaml');
const file = require('file');
const path = require('path');

const assert = require('assert');
const Ajv = require('ajv');

const ajv = new Ajv({});
const baseDir = path.join(__dirname, '/../../jsonschema/');

// Checks whether the schema contains each and every property from the 'superschema'
assert.isSuperSchema = (schema, example, path) => {
    path = path || '';
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
        .filter((key) => key !== 'title' && key !== 'description')
        .forEach((key) => {
            if (example.required.indexOf(key) !== -1
                    || schema.required.indexOf(key) !== -1) {
                assert.isSuperSchema(schema[key], example[key], path + '.' + key)
            }
        });
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
            describe('Schema ' + cropExtension(schemaPath), () => {
                it('Must be valid JSON-Schema', () => ajv.validateSchema(schema, true));

                if (schemaPath === 'test/event/1.yaml') {
                    return;
                }

                var pathSegments = schemaPath.split('/');
                for (var idx = 0; idx < pathSegments.length - 1; idx++) {
                    var subPath = path.join(__dirname, pathSegments.slice(0, idx).join('/'));
                    if (fs.existsSync(subPath) && fs.statSync(subPath).isDirectory()) {
                        fs.readdirSync(subPath).filter(isYamlJson).forEach((fileName) => {
                            const exampleSchema = loadYaml(path.join(subPath, fileName));
                            it('Must contain ' + cropExtension(fileName), () => {
                                assert.isSuperSchema(schema, exampleSchema)
                            });
                        });
                    }
                }
            });
        });
    });
});