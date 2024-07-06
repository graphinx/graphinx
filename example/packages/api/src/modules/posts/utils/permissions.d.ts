import type { Context } from '#lib';
export declare function canEditArticle(oldArticle: {
    authorId: string | null;
    groupId: string;
}, newArticle: {
    authorId: string | null;
    groupId: string;
}, user: Context['user']): boolean;
