"use strict";

var fs = require('fs');
var yaml = require('js-yaml');
var assert = require('assert');
var Ajv = require('ajv');
var preq = require('preq');

var metaSchema = yaml.safeLoad(fs.readFileSync(__dirname + '/meta_schema.yaml', 'utf8'));

// Checks whether the schema contains each and every property
// from the 'superschema'
assert.isSuperSchema = function(schema, example, path) {
    path = path || '';
    if (typeof schema !== typeof example
            || Array.isArray(schema) !== Array.isArray(example)) {
        throw new assert.AssertionError({
            message: 'Error at path: ' + path,
            expected: example,
            actual: schema || {}
        });
    }
    if (Array.isArray(schema)) {
        // For arrays we need to check that all of the elements from example
        // are also in the schema
        if (!example.every(function(element) {
            return schema.indexOf(element) !== -1;
        })) {
            throw new assert.AssertionError({
                message: 'Error at path: ' + path,
                expected: example,
                actual: schema || []
            });

        }
    }
    if (typeof example === 'object') {
        // Go recursively
        return Object.keys(example).forEach(function(key) {
            if (key === 'title'
                    || key === 'description') {
                // These are for documentation mostly, so exclude them
                return;
            }
            assert.isSuperSchema(schema[key], example[key], path + '.' + key);
        });
    }

    if (schema !== example) {
        throw new assert.AssertionError({
            message: 'Error at path: ' + path,
            expected: example,
            actual: schema || []
        });
    }

};

describe('Json schema', function() {
    var ajv = new Ajv();
    var baseDir = __dirname + '/../../jsonschema/';
    function browseDir(pathFromBase) {
        fs.readdirSync(baseDir + pathFromBase).forEach(function(fileName) {
            var filePath = pathFromBase + '/' + fileName;
            if (fs.statSync(baseDir + filePath).isDirectory()) {
                browseDir(filePath);
            }
            else if (filePath.endsWith('.yaml') || filePath.endsWith('.json')) {
                var schema = yaml.safeLoad(fs.readFileSync(baseDir + filePath, 'utf8'));
                it('Validity: ' + filePath, function() {
                    assert.notEqual(schema, undefined);
                    assert.notEqual(schema['$schema'], undefined);
                    return preq.get({
                        uri: schema['$schema']
                    })
                    .then(function(res) {
                        var validate = ajv.compile(res.body);
                        var valid = validate(schema);
                        if (!valid) {
                            throw new assert.AssertionError({
                                message: ajv.errorsText(valid.errors)
                            });
                        }
                    });
                });

                if (filePath.indexOf('/test/event/1.yaml') !== -1) {
                    return;
                }

                it('Contains meta: ' + filePath, function() {
                    assert.isSuperSchema(schema, metaSchema);
                });
            }
        });
    }
    browseDir('');
});