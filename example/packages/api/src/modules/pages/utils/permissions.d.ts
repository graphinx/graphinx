import type { Context } from '#lib';
import type { Group, StudentAssociation } from '@churros/db/prisma';
export declare function canListStudentAssociationPages(user: Context['user'], studentAssociationId: string): boolean;
export declare function canListGroupPages(user: Context['user'], group: Group): boolean;
export declare function canEditGroupPages(user: Context['user'], group: Group): boolean;
export declare function canEditStudentAssociationPages(user: Context['user'], studentAssociationId: string): boolean;
export declare function canEditPage(page: {
    group: null | Group;
    studentAssociation: null | StudentAssociation;
}, user: Context['user']): boolean;
