import { type Major, type Prisma, type QuickSignup, type School, type User, type UserCandidate } from '@churros/db/prisma';
export declare const saveUser: ({ id, uid, email, firstName, lastName, majorId, graduationYear, password, address, birthday, phone, schoolEmail, apprentice, schoolServer, schoolUid, cededImageRightsToTVn7, }: UserCandidate, returnPrismaQuery?: {
    include?: Prisma.UserCandidateInclude;
    select?: Prisma.UserCandidateSelect;
}) => Promise<User & {
    major?: null | (Major & {
        ldapSchool?: School | null;
    });
}>;
export declare const completeRegistration: (candidate: UserCandidate & {
    usingQuickSignup: null | (QuickSignup & {
        school: School & {
            majors: Major[];
        };
    });
    major: null | (Major & {
        schools: School[];
    });
}) => Promise<(User & {
    major?: null | (Major & {
        ldapSchool?: School | null;
    });
}) | undefined>;
/**
 *
 * @param candidate the candidate
 * @throws if the email is not validated yet (answering this question as no meaning at this point)
 */
export declare function needsManualValidation(candidate: UserCandidate & {
    usingQuickSignup: (QuickSignup & {
        school: School & {
            majors: Major[];
        };
    }) | null;
    major: (Major & {
        schools: School[];
    }) | null;
}): boolean;
