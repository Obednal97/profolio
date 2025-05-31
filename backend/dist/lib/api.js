"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRequest = apiRequest;
async function apiRequest(path, method = "GET", body, headers = {}) {
    const res = await fetch(`/api${path}`, {
        method,
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const error = await res.json();
        const errMsg = typeof error === "object" && error !== null && "message" in error
            ? error.message
            : "API request failed";
        throw new Error(errMsg);
    }
    return res.json();
}
