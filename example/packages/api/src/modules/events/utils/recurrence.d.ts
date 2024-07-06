import { type Event as EventPrisma } from '@churros/db/prisma';
export declare function findNextRecurringEvent<T extends EventPrisma>(event: T): T;
