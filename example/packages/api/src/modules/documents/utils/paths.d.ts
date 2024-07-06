export declare function documentFilePath(root: string, subject: {
    id: string;
    name: string;
    slug: string;
    shortName: string;
    nextExamAt: Date | null;
} | undefined | null, document: {
    slug: string;
    solutionPaths: string[];
    paperPaths: string[];
}, solution: boolean, file: {
    name: string;
}): string;
