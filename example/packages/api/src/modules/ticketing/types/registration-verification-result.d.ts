import type { Registration, User } from '@churros/db/prisma';
import { RegistrationVerificationState } from '../index.js';
export declare class RegistrationVerificationResult {
    state: RegistrationVerificationState;
    registration?: Registration & {
        verifiedBy?: User | null;
    };
    constructor(state: RegistrationVerificationState, registration?: Registration & {
        verifiedBy?: User | null;
    });
}
export declare const RegistrationVerificationResultType: any;
