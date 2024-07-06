import type { Major, User } from '@churros/db/prisma';
export declare const userCanSeeBarWeek: (user: User, group: {
    studentAssociation?: {
        school: {
            majors: Major[];
        };
    };
}) => boolean;
export declare function getFoyGroups(): Promise<any>;
export declare const FOY_GROUPS_UIDS: string[];
