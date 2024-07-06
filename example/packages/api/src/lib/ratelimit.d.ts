import type { PothosTypes } from '#lib';
import { type Locale } from 'date-fns';
import { type GraphQLSchema } from 'graphql';
export type RateLimitDirective = {
    locations: 'OBJECT' | 'FIELD_DEFINITION';
    args: {
        limit: number;
        duration: number;
    };
};
export declare const DEFAULT_RATE_LIMITS: {
    readonly Query: {
        readonly limit: 1200;
        readonly duration: 60;
    };
    readonly Mutation: {
        readonly limit: 1200;
        readonly duration: number;
    };
    readonly Subscription: {
        readonly limit: 600;
        readonly duration: number;
    };
};
export declare function setDefaultRateLimits(b: PothosSchemaTypes.SchemaBuilder<PothosSchemaTypes.ExtendDefaultTypes<PothosTypes>>): void;
export declare function rateLimitDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema;
export declare function formatRateLimit({ limit, duration }: RateLimitDirective['args'], locale?: Locale): string;
