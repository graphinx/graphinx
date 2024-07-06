import type { Event, Registration, Ticket, User } from '@churros/db/prisma';
export declare function generatePDF(registration: Registration & {
    ticket: Ticket & {
        event: Event;
    };
    author: null | User;
}): any;
