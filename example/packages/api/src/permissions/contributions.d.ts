import type { Prisma } from '@churros/db/prisma';
export declare function getUserWithContributesTo(userId: string, query?: {
    include?: Prisma.UserInclude;
    select?: Prisma.UserSelect;
}): Promise<any>;
