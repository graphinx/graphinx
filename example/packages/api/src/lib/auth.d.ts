import type { User } from '@churros/db/prisma';
import type { Context } from './context.js';
export interface AuthScopes {
    loggedIn: boolean;
    student: boolean;
    admin: boolean;
    canAccessDocuments: boolean;
    studentAssociationAdmin: boolean;
}
export interface AuthContexts {
    loggedIn: Context & {
        user: User;
    };
    student: Context & {
        user: User;
    };
}
export declare const authScopes: ({ user }: Context) => {
    loggedIn: boolean;
    student: boolean;
    admin: boolean;
    studentAssociationAdmin: boolean;
    canAccessDocuments: boolean;
};
export declare function isThirdPartyToken(token: string): boolean;
export declare function generateThirdPartyToken(): string;
