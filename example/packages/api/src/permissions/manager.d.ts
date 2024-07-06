import { type Context } from '#lib';
import type { Event } from '@churros/db/prisma';
export declare function userCanManageEvent(event: Event & {
    managers: Array<{
        user: {
            uid: string;
        };
        canEdit: boolean;
        canEditPermissions: boolean;
        canVerifyRegistrations: boolean;
    }>;
}, user: Context['user'], required: {
    canEdit?: boolean;
    canEditPermissions?: boolean;
    canVerifyRegistrations?: boolean;
}): boolean;
