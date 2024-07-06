import { Visibility } from '@churros/db/prisma';
export declare const ShopItemType: any;
export interface VisibilityQuery {
    OR?: Array<{
        visibility: Visibility;
    }>;
    visibility?: Visibility;
}
export declare function visibleShopPrismaQuery(groupUid: string, user: {
    id: string;
    schoolUid: string | null;
}): Promise<{
    OR: {
        visibility: any;
    }[];
    visibility?: undefined;
} | {
    visibility: any;
    OR?: undefined;
}>;
