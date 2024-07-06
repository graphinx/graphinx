import type { Page } from '@churros/db/prisma';
export declare function withTrailingSlash(path: string): string;
export declare function withoutTrailingSlash(path: string): string;
export declare function pageFilePath(page: Page, file: {
    name: string;
}): {
    filepath: string;
    relativePath: string;
    root: string;
};
