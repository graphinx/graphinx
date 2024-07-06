import type { Context } from '#lib';
import type { Group, Prisma } from '@churros/db/prisma';
import * as PrismaTypes from '@churros/db/prisma';
export declare function prismaQueryVisibleEvents(user: {
    uid: string;
} | undefined): Prisma.EventWhereInput;
export declare function userCanAccessEvent(event: (PrismaTypes.Event & {
    coOrganizers: Array<{
        id: string;
        uid: string;
        studentAssociation?: null | {
            school: {
                uid: string;
            };
        };
    }>;
    group: Group & {
        studentAssociation?: null | {
            school: {
                uid: string;
            };
        };
    };
    managers: Array<{
        user: {
            uid: string;
        };
        canEdit: boolean;
        canEditPermissions: boolean;
        canVerifyRegistrations: boolean;
    }>;
    tickets: Array<{
        openToExternal: boolean | null;
    }>;
}) | null, user: Context['user']): Promise<boolean>;
