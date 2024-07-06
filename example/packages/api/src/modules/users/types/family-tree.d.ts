import { UserType } from './user.js';
type User = Omit<typeof UserType.$inferType, 'familyTree'>;
export declare class FamilyTree {
    nesting: string;
    users: Array<User>;
    constructor(nesting: string, users: User[]);
}
export {};
