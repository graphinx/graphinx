import { FamilyTree } from '../types/family-tree.js';
export declare function getFamilyTree({ id, godparentId }: {
    id: string;
    godparentId?: string;
}): Promise<FamilyTree>;
