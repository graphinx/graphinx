import type { Prisma } from '@churros/db/prisma';
export declare function userCanSeeTicket({ event, openToGroups, openToSchools, openToPromotions, openToMajors, openToContributors, openToApprentices, openToExternal, }: {
    event: {
        id: string;
        group: {
            studentAssociation: null | {
                id: string;
            };
        };
        managers: Array<{
            userId: string;
        }>;
        bannedUsers: Array<{
            id: string;
        }>;
    };
    onlyManagersCanProvide: boolean;
    openToGroups: Array<{
        uid: string;
    }>;
    openToSchools: Array<{
        uid: string;
    }>;
    openToPromotions: number[];
    openToMajors: Array<{
        id: string;
    }>;
    openToContributors: boolean | null;
    openToApprentices: boolean | null;
    openToExternal: boolean | null;
}, user?: {
    id: string;
    admin: boolean;
    groups: Array<{
        group: {
            uid: string;
        };
    }>;
    graduationYear: number;
    major?: {
        schools: Array<{
            uid: string;
        }>;
        id: string;
    } | null;
    contributions: Array<{
        paid: boolean;
        option: {
            id: string;
            paysFor: Array<{
                id: string;
                school: {
                    uid: string;
                };
            }>;
        };
    }>;
    apprentice: boolean;
} | null): boolean;
export declare function getTicketsWithConstraints(eventId: string, query?: {
    include?: Prisma.TicketInclude;
    select?: Prisma.TicketSelect;
}): Promise<any>;
