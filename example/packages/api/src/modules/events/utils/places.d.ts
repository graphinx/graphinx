import type { Ticket, TicketGroup } from '@churros/db/prisma';
export declare function eventCapacity(tickets: Array<Ticket & {
    group: TicketGroup | null;
}>, ticketGroups: Array<TicketGroup & {
    tickets: Ticket[];
}>): any;
