import { type Context } from '#lib';
import { userCanAccessEvent, userCanManageEvent } from '#permissions';
import { Visibility, type Contribution, type ContributionOption, type Form, type FormSection, type Group, type Question, type StudentAssociation } from '@churros/db/prisma';
export declare const requiredIncludesForPermissions: Prisma.FormInclude;
export declare function canEditForm(form: {
    createdById: string | null;
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function canCreateForm(associatedGroup: null | {
    uid: string;
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function canSeeAllAnswers(form: {
    createdById: string | null;
    group: null | {
        uid: string;
    };
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function canAnswerForm(form: Form & {
    group: Group | null;
}, associatedEvent: Parameters<typeof userCanAccessEvent>[0] | null, user: Context['user'], userContributions: Array<Contribution & {
    option: ContributionOption & {
        paysFor: StudentAssociation[];
    };
}>): any;
export declare function canModifyFormAnswers(form: Form & {
    group: Group | null;
}, associatedEvent: Parameters<typeof userCanAccessEvent>[0] | null, user: Context['user'], userContributions: Array<Contribution & {
    option: ContributionOption & {
        paysFor: StudentAssociation[];
    };
}>): boolean;
export declare function canSeeForm(form: {
    createdById: string | null;
    visibility: Visibility;
    group: null | {
        id: string;
        studentAssociation: null | {
            schoolId: string;
        };
    };
}, associatedEvent: (Parameters<typeof userCanAccessEvent>[0] & Parameters<typeof userCanManageEvent>[0]) | null, user: Context['user']): boolean;
export declare function canSetFormAnswerCheckboxes(form: Form & {
    group: Group | null;
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function canSeeAnswerStats(form: Form & {
    group: Group | null;
    sections: Array<FormSection & {
        questions: Question[];
    }>;
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function canSeeAnswerStatsForQuestion(question: Question, form: Form & {
    group: Group | null;
}, associatedEvent: Parameters<typeof userCanManageEvent>[0] | null, user: Context['user']): boolean;
export declare function isOpenForAnswers(form: Pick<Form, 'opensAt' | 'closesAt'>): any;
export declare function hasAnonymousQuestions(form: {
    sections: Array<{
        questions: Array<Pick<Question, 'anonymous'>>;
    }>;
}): boolean;
