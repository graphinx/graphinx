import type { Major, School } from '@churros/db/prisma';
/**
 * Resolve a mail into its school mail. Retun null if the given mail is not a valid school email address for the given major.
 * @param mail input mail
 * @param major the major we are trying to resolve the mail for
 */
export declare function resolveSchoolMail(mail: string, major: Major & {
    schools: School[];
}): string | null;
export declare function isSchoolEmailForMajor(mail: string, major: Major & {
    schools: School[];
}): boolean;
export declare function isSchoolEmail(mail: string, schools: School[]): boolean;
export declare function resolveSchoolMailForSchool(mail: string, school: School): string | null;
export declare function replaceMailDomainPart(mail: string, newDomain: string): string;
export declare function mailDomainsMatch(email: string, domain: string): boolean;
export declare function mailDomain(mail: string): string;
