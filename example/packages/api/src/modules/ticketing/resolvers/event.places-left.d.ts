import { type Context } from '#lib';
import type { Event, EventManager, Group } from '@churros/db/prisma';
export declare function canSeePlacesLeftCount(event: Event & {
    managers: EventManager[];
    group: Group;
}, user: Context['user'], placesLeft: number): any;
