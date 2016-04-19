"use strict";

var fs = require('fs');
var yaml = require('js-yaml');
var assert = require('assert');
var Ajv = require('ajv');
var preq = require('preq');

describe('Json schema', function() {
    var ajv = new Ajv();
    var baseDir = __dirname + '/../../jsonschema/';
    function browseDir(pathFromBase) {
        fs.readdirSync(baseDir + pathFromBase).forEach(function(fileName) {
            var filePath = pathFromBase + '/' + fileName;
            if (fs.statSync(baseDir + filePath).isDirectory()) {
                browseDir(filePath);
            } else {
                it('Validity: ' + filePath, function() {
                    var schema = yaml.safeLoad(fs.readFileSync(baseDir + filePath, 'utf8'));
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
            }
        });
    }
    browseDir('');
});