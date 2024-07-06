import { GroupType } from '@churros/db/prisma';
export declare function removeMemberFromGroupMailingList(groupId: string, email: string): Promise<void>;
export declare function updateMemberBoardLists(memberID: string, groupId: string, groupType: GroupType): Promise<void>;
export declare function addMemberToGroupMailingList(groupId: string, email: string): Promise<void>;
