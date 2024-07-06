import { type User } from '@churros/db/prisma';
import type { YogaInitialContext } from '@graphql-yoga/node';
/** Deletes the session cache for a given user id. */
export declare const purgeUserSessions: (uid: User["uid"]) => void;
export declare const getUserFromThirdPartyToken: (token: string) => Promise<any>;
export type Context = YogaInitialContext & Awaited<ReturnType<typeof context>>;
/** The request context, made available in all resolvers. */
export declare const context: ({ request, ...rest }: YogaInitialContext) => Promise<{
    token: string;
    client: any;
    user?: undefined;
} | {
    token?: undefined;
    client?: undefined;
    user?: undefined;
} | {
    token: string;
    user: any;
    client?: undefined;
}>;
