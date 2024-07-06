export interface LdapUser {
    schoolUid: string;
    schoolEmail: string;
    firstName?: string;
    lastName?: string;
}
export declare const schoolLdapSettings: {
    servers: Record<string, {
        url: string;
        filterAttribute: string;
        wholeEmail: boolean;
        attributesMap: LdapUser;
    }>;
    emailDomains: Record<string, string>;
};
/** Finds a user in a school database or returns `undefined`. */
export declare const findSchoolUser: (searchBy: {
    email: string;
} | {
    firstName: string;
    lastName: string;
    graduationYear: number;
    major: {
        shortName: string;
    };
    schoolServer: string;
}) => Promise<(LdapUser & {
    schoolServer: string;
    major?: string | undefined;
    graduationYear?: number;
    apprentice?: boolean;
}) | undefined>;
