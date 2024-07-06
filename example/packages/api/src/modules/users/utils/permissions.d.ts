import type { Context } from '#lib';
export declare const prismaIncludesForStudentAssociationAdmins: {
    readonly schools: {
        readonly include: {
            readonly studentAssociations: {
                readonly include: {
                    readonly admins: true;
                };
            };
        };
    };
};
export declare function prismaUserFilterForStudentAssociationAdmins(user: NonNullable<Context['user']>): {
    readonly major?: undefined;
} | {
    readonly major: {
        readonly schools: {
            readonly some: {
                readonly studentAssociations: {
                    readonly some: {
                        readonly admins: {
                            readonly some: {
                                readonly id: any;
                            };
                        };
                    };
                };
            };
        };
    };
};
export declare function prismaGroupFilterForStudentAssociationAdmins(user: NonNullable<Context['user']>): {
    readonly studentAssociation?: undefined;
} | {
    readonly studentAssociation: {
        readonly admins: {
            readonly some: {
                readonly id: any;
            };
        };
    };
};
export declare function prismaGroupFilterForStudentAssociationGroupsEditors(user: NonNullable<Context['user']>): {
    readonly studentAssociation?: undefined;
} | {
    readonly studentAssociation: {
        readonly groupsEditors: {
            readonly some: {
                readonly id: any;
            };
        };
    };
};
export declare function canBeEdited(user: {
    id: string;
    major: {
        schools: Array<{
            studentAssociations: Array<{
                id: string;
            }>;
        }>;
    } | null;
}, me: NonNullable<Context['user']>): any;
