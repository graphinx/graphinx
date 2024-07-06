import { type Ticket } from '@churros/db/prisma';
import type Cron from 'croner';
export declare function scheduleShotgunNotifications({ id, tickets, notifiedAt, }: {
    id: string;
    tickets: Ticket[];
    notifiedAt: Date | null;
}, { dryRun }: {
    dryRun: boolean;
}): Promise<[Cron | boolean, Cron | boolean] | undefined>;
