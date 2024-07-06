import type { Context, RateLimitDirective } from '#lib';
import { type AuthContexts, type AuthScopes } from '#lib';
import type PrismaTypes from '@churros/db/pothos';
export interface PothosTypes {
    AuthContexts: AuthContexts;
    AuthScopes: AuthScopes;
    Context: Context;
    DefaultInputFieldRequiredness: true;
    PrismaTypes: PrismaTypes;
    DefaultEdgesNullability: false;
    DefaultNodeNullability: false;
    Scalars: {
        DateTime: {
            Input: Date;
            Output: Date;
        };
        File: {
            Input: never;
            Output: File;
        };
        ID: {
            Input: string;
            Output: string;
        };
        Counts: {
            Input: Record<string, number>;
            Output: Record<string, number>;
        };
        BooleanMap: {
            Input: Record<string, boolean>;
            Output: Record<string, boolean>;
        };
        UID: {
            Input: string;
            Output: string;
        };
    };
    Directives: {
        rateLimit: RateLimitDirective;
    };
}
export declare const builder: any;
