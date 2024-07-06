import { type ReleaseChangesMap } from '../index.js';
export type ChangelogRelease = {
    version: string;
    date: Date | undefined;
    changes: ReleaseChangesMap;
    description: string;
};
export declare const ChangelogReleaseType: any;
