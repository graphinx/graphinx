import { type ReleaseChange } from '../index.js';
export type ReleaseChangesMap = {
    fixed: ReleaseChange[];
    improved: ReleaseChange[];
    added: ReleaseChange[];
    security: ReleaseChange[];
    other: ReleaseChange[];
    technical: ReleaseChange[];
};
export declare const ReleaseChangesMapType: any;
