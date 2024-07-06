import type Cron from 'croner';
export declare function scheduleNewArticleNotification({ id, publishedAt, notifiedAt, }: {
    id: string;
    publishedAt: Date;
    notifiedAt: Date | null;
}, { eager, dryRun, }: {
    eager: boolean;
    dryRun?: boolean;
}): Promise<Cron | boolean>;
