import { z } from 'zod';
export declare const UNAUTHORIZED_ERROR_MESSAGE = "Tu n'es pas autoris\u00E9 \u00E0 effectuer cette action.";
export declare class UnauthorizedError extends Error {
    constructor();
}
export declare const customErrorMap: z.ZodErrorMap;
