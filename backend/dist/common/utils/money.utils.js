"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoneyUtils = void 0;
const library_1 = require("@prisma/client/runtime/library");
class MoneyUtils {
    /**
     * Convert cents/pence to decimal amount
     */
    static fromCents(cents) {
        return cents / 100;
    }
    /**
     * Convert decimal amount to cents/pence
     */
    static toCents(amount) {
        return Math.round(amount * 100);
    }
    /**
     * Convert basis points to percentage
     */
    static fromBasisPoints(basisPoints) {
        return basisPoints / 10000;
    }
    /**
     * Convert percentage to basis points
     */
    static toBasisPoints(percentage) {
        return Math.round(percentage * 10000);
    }
    /**
     * Convert micro-units to decimal
     */
    static fromMicroUnits(microUnits) {
        return microUnits / 1000000;
    }
    /**
     * Convert decimal to micro-units
     */
    static toMicroUnits(amount) {
        return Math.round(amount * 1000000);
    }
    /**
     * Format money for display
     */
    static formatMoney(cents, currency = 'USD') {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        });
        return formatter.format(this.fromCents(cents));
    }
    /**
     * Safe decimal arithmetic using Prisma's Decimal type
     */
    static safeAdd(a, b) {
        return new library_1.Decimal(a).add(new library_1.Decimal(b)).toNumber();
    }
    static safeSubtract(a, b) {
        return new library_1.Decimal(a).sub(new library_1.Decimal(b)).toNumber();
    }
    static safeMultiply(a, b) {
        return new library_1.Decimal(a).mul(new library_1.Decimal(b)).toNumber();
    }
    static safeDivide(a, b) {
        if (b === 0)
            throw new Error('Division by zero');
        return new library_1.Decimal(a).div(new library_1.Decimal(b)).toNumber();
    }
}
exports.MoneyUtils = MoneyUtils;
