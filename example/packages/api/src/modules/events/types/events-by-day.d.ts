import { EventType } from '#modules/events';
export type EventsByDay = {
    events: Array<typeof EventType.$inferType>;
    date: Date;
    id: string;
};
export declare function makeEventsByDate(events: EventsByDay['events']): EventsByDay;
export declare function dateFromDateCursor(cursor: string): any;
export declare function ensureCorrectDateCursor(dateOrCursor: Date | string): string;
export declare function ensureCorrectDateCursor(dateOrCursor: Date | string | null | undefined): string | null | undefined;
export declare const EventsByDayType: any;
