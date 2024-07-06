export declare function createUid({ title, groupId }: {
    title: string;
    groupId: string;
}): Promise<string>;
export declare function createTicketUid({ name, eventId, ticketGroupName, }: {
    name: string;
    eventId: string;
    ticketGroupName: null | undefined | string;
}): Promise<string>;
