export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyMasterKey(password: string): Promise<boolean>;
