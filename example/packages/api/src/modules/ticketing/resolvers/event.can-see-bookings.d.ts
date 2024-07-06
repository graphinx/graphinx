import { type Context } from '#lib';
import type { EventManager, Group, Event } from '@churros/db/prisma';
export declare function canSeeBookings(event: Event & {
    managers: EventManager[];
    group: Group;
}, user: Context['user']): any;
