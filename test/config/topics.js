"use strict";

const fs = require('fs');
const yaml = require('js-yaml');
const file = require('file');
const path = require('path');

const assert = require('assert');

const baseDir = path.join(__dirname, '/../../jsonschema/');
const checked = [];

describe('All schemas referenced from topics config must exist', () => {
    const topics = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/../../config/eventbus-topics.yaml')));
    Object.keys(topics).forEach((topicName) => {
        const schemaName = topics[topicName].schema_name;
        if (checked.indexOf(schemaName) === -1) {
            checked.push(schemaName);
            it(schemaName + ' should exist', () => {
                assert.strictEqual(
                    fs.existsSync(path.join(baseDir, topics[topicName].schema_name, '1.yaml')),
                    true
                );
            });
        }
    });
});
