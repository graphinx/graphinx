export declare const RESERVED_UIDS: Set<string>;
/**
 * Ensure that a given uid is free to use (exists nowhere in the database)
 * @param uid the uid to check
 */
export declare function uidIsFree(uid: string): Promise<boolean>;
export declare const freeUidValidator: readonly [typeof uidIsFree, (uid: string) => string];
