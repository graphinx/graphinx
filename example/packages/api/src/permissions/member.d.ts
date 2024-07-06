import type { Context } from '#lib';
export declare function onBoard(permissions: {
    president: boolean;
    treasurer: boolean;
    vicePresident: boolean;
    secretary: boolean;
} | undefined | null): boolean;
export declare function userIsPresidentOf(user: Context['user'], groupUid: string): boolean;
export declare function userIsTreasurerOf(user: Context['user'], groupUid: string): boolean;
export declare function userIsOnBoardOf(user: Context['user'], groupUid: string): boolean;
export declare function userIsMemberOf(user: Context['user'], groupUid: string): boolean;
export declare function userIsDeveloperOf(user: Context['user'], groupUid: string): boolean;
export declare function userIsAdminOf(user: Context['user'], studentAssociationId?: string[] | string | null): boolean;
/**
 * Check if a user has permission to edit a group
 *
 * @param user
 * @param studentAssociationId the id of the student association that the group belongs to
 */
export declare function userIsGroupEditorOf(user: Context['user'], studentAssociationId: string[] | string | undefined | null): boolean;
