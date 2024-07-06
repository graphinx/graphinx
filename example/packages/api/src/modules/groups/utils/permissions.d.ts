import type { Context } from '#lib';
import { GroupType, Prisma, type Group, type StudentAssociation } from '@churros/db/prisma';
export declare const requiredPrismaIncludesForPermissions: Prisma.GroupInclude;
export declare const ALLOWED_SUBGROUP_TYPES: GroupType[];
/**
 * People that can create a group:
 * - Global admins
 * - People that can edit groups
 * - People that are admins of the new group's student association
 * - People that can edit the parent group, **if the subgroup's type is allowed** (this is to prevent 'regular' users from creating StudentAssociationSections, for example)
 */
export declare function canCreateGroup(user: Context['user'], { studentAssociationUid, parentUid, type, }: {
    studentAssociationUid?: string | null | undefined;
    parentUid?: string | null | undefined;
    type: GroupType;
}): boolean;
/**
 * Group edition: board members can edit the group if the student association stays the same.
 * When the student association changes, we check that the user could create a new group with the new student association and could also create the group under the old student association.
 * Otherwise, they are the same permissions as if we tried to create a new group with the info given in `newGroup`.
 */
export declare function canEditGroup(user: Context['user'], existingGroup: Group & {
    studentAssociation: StudentAssociation | null;
    parent: null | Group;
}, newGroup?: {
    studentAssociationUid?: string | null | undefined;
    studentAssociationId?: string | null | undefined;
    type: GroupType;
    parentUid?: string | null | undefined;
} | undefined | null, newParentGroup?: null | (Group & {
    studentAssociation: StudentAssociation | null;
    parent: null | Group;
})): boolean;
export declare function userIsOnGroupBoard(user: Context['user'], group: {
    uid: string;
} | {
    id: string;
}): any;
export declare function prismaQueryOnClubBoard(): Prisma.GroupMemberWhereInput;
export declare function prismaQueryCanCreatePostsOn(user: {
    id: string;
}): Prisma.GroupWhereInput;
