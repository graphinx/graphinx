import * as KeepAChangelog from 'keep-a-changelog';
import { type ChangelogRelease } from '../index.js';
export declare const UpcomingVersion: unique symbol;
export declare function changelogFromFile(fileContents?: string): Promise<any>;
export declare function findReleaseInChangelog(changelog: KeepAChangelog.Changelog, version: typeof UpcomingVersion | string): ChangelogRelease;
