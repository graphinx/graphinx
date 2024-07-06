import type { Prisma } from '@churros/db/prisma';
export declare function login(email: string, password: string, userAgent: string, query: {
    include?: Prisma.CredentialInclude;
    select?: Prisma.CredentialSelect;
}): Promise<any>;
