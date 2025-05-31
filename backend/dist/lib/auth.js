"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
function verifyToken(token) {
    try {
        return (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
