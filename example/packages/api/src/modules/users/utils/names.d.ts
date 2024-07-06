import type { Prisma, School } from '@churros/db/prisma';
export declare function fullName(user: {
    firstName: string;
    lastName: string;
    nickname?: string;
}): string;
/**
 * Create prisma clauses to search for a user by email or uid, taking into account alias mail domains for schools.
 * @param schools all schools of the instance
 * @param email the input email or uid
 * @returns clauses: an array of prisma clauses to be OR'ed in a query; uidOrEmail: the input email or uid; processed (basically lowercased and trimmed)
 */
export declare function emailLoginPrismaClauses(schools: School[], email: string): {
    clauses: Prisma.UserWhereInput[];
    uidOrEmail: string;
};
