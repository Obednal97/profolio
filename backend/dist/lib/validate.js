"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequiredFields = validateRequiredFields;
function validateRequiredFields(obj, fields) {
    return fields.filter((field) => {
        const value = obj[field];
        return value === undefined || value === null || value === '';
    });
}
