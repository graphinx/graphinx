import type { Context } from '#lib';
export declare function canManageThirdPartyApp(app: {
    groupId: string;
    group: {
        uid: string;
    };
}, user: Context['user']): boolean;
