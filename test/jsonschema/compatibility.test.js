'use strict';

const path = require('path');
const assert = require('assert').strict;
const jsonSchemaTools = require('@wikimedia/jsonschema-tools');

const BASE_PATH = path.join(__dirname, '..', '..', 'jsonschema');
const allSchemas = jsonSchemaTools.findSchemasByTitleAndMajor(BASE_PATH);

const FIELDS_ALLOWED_TO_CHANGE = [
    '$id',
    'description',
    'examples'
];

const isAllowedToChange = (fieldName) => FIELDS_ALLOWED_TO_CHANGE.indexOf(fieldName) !== -1;

const isRequiredCompatible = (newRequired, oldRequired, path) => {
    if (!oldRequired.every((element) => newRequired.indexOf(element) !== -1)) {
        throw new assert.AssertionError({
            message: `Removed a required property at path: ${path}`,
            expected: oldRequired,
            actual: newRequired
        });
    }
};

const isCompatible = (newSchema, oldSchema, path = '') => {
    if (typeof newSchema !== typeof oldSchema ||
            Array.isArray(newSchema) !== Array.isArray(oldSchema)) {
        throw new assert.AssertionError({
            message: `Error at path: ${path}`,
            expected: oldSchema,
            actual: newSchema || {}
        });
    } else if (typeof oldSchema === 'object') {
        // Go recursively
        for (const key of Object.keys(oldSchema)) {
            if (isAllowedToChange(key)) {
                continue;
            }

            switch (key) {
                case 'required':
                    isRequiredCompatible(newSchema.required, oldSchema.required, `${path}.${key}`);
                    break;
                default:
                    // If the field is in both schemas, must be compatible
                    if (key in newSchema) {
                        isCompatible(newSchema[key], oldSchema[key], `${path}.${key}`);
                    }
                    break;
            }
        }
    } else if (newSchema !== oldSchema) {
        throw new assert.AssertionError({
            message: `Error at path: ${path}`,
            expected: oldSchema,
            actual: newSchema
        });
    }
};

describe('compatibility', () => {
    for (const title of Object.keys(allSchemas)) {
        describe(title, () => {
            for (const major of Object.keys(allSchemas[title])) {
                const materializedSchemas = allSchemas[title][major]
                .filter((schema) => !schema.current);
                if (materializedSchemas.length > 1) {
                    describe(`Version ${major}.x`, () => {
                        for (let i = 0; i < materializedSchemas.length - 1; i++) {
                            const oldSchema = materializedSchemas[i];
                            const newSchema = materializedSchemas[i + 1];
                            it(`${newSchema.version} must be compatible with ${oldSchema.version}`, () => {
                                isCompatible(newSchema.schema, oldSchema.schema);
                            });
                        }
                    });
                }
            }
        });
    }
});
