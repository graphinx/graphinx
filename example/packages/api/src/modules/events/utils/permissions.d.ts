import { type Context } from '#lib';
import type { Event, EventManager, Group } from '@churros/db/prisma';
export declare function canEdit(event: Event & {
    managers: EventManager[];
    group: {
        studentAssociationId: string | null;
    };
}, user: Context['user']): boolean;
export declare function canEditManagers(event: Event & {
    managers: EventManager[];
    group: Group;
}, user: Context['user']): boolean;
export declare function canCreateEvent(group: Group, user: Context['user']): boolean;
export declare function canSeeEventLogs(event: Event & {
    managers: EventManager[];
    group: Group;
}, user: Context['user']): boolean;
