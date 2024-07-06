import type { NotificationChannel as NotificationChannelPrisma } from '@churros/db/prisma';
export declare function serverCanSendNotificationToUser(subscriptionOwner: {
    enabledNotificationChannels: NotificationChannelPrisma[];
}, channel: NotificationChannelPrisma): boolean;
