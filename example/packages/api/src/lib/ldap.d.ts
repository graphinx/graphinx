import type { Group, GroupMember, Major, School, StudentAssociation, User } from '@churros/db/prisma';
import ldap from 'ldapjs';
declare const LDAP_BIND_DN: string;
declare function connectLdap(): ldap.Client;
interface LdapUser {
    objectClass: string[];
    uid: string;
    uidNumber: number;
    gidNumber: number;
    birthDate?: string;
    cn: string;
    displayName?: string;
    ecole: string;
    mail: string;
    filiere: string;
    genre: number;
    givenName?: string;
    givenNameSearch?: string;
    hasWebsite?: boolean;
    homeDirectory: string;
    inscritAE: boolean;
    inscritFrappe?: boolean;
    inscritPassVieEtudiant?: boolean;
    loginShell: string;
    loginTP?: string;
    mailAnnexe?: string[];
    mailEcole?: string;
    mailForwardingAddress?: string[];
    mobile?: string[];
    userPassword: string[];
    promo: number;
    sn: string;
    snSearch?: string;
    uidParrain?: string[];
}
declare function queryLdapUser(username: string): Promise<LdapUser | null>;
export declare function markAsContributor(uid: string): Promise<void>;
declare function createLdapUser(user: {
    birthday: Date | null;
    firstName: string;
    lastName: string;
    uid: string;
    schoolUid: string | null;
    schoolEmail: string | null;
    email: string;
    otherEmails: string[];
    phone: string;
    graduationYear: number;
    major?: undefined | null | (Major & {
        ldapSchool?: School | undefined | null;
    });
    godparent?: User | null;
    contributesToAEn7?: boolean;
}, password: string): Promise<void>;
declare function resetLdapUserPassword(user: User & {
    major?: undefined | null | (Major & {
        ldapSchool?: School | undefined | null;
    });
}, password: string): Promise<void>;
declare function createLdapGroup(group: Group & {
    studentAssociation: StudentAssociation & {
        school: School;
    };
} & {
    members: Array<GroupMember & {
        user: User;
    }>;
}): Promise<void>;
declare function createLdapClub(club: Group & {
    studentAssociation: StudentAssociation & {
        school: School;
    };
} & {
    members: Array<GroupMember & {
        user: User;
    }>;
}): Promise<void>;
export { connectLdap, createLdapClub, createLdapGroup, createLdapUser, LDAP_BIND_DN, queryLdapUser, resetLdapUserPassword, };
