import { type NotificationSubscription, type User } from '@churros/db/prisma';
import type { MaybePromise } from '@pothos/core';
import type { PushNotification } from './push-notification.js';
export declare function notifyInBulk<U extends User>(jobId: string, users: U[], notification: (user: U) => MaybePromise<(PushNotification & {
    afterSent: () => Promise<void>;
}) | undefined>): Promise<void>;
export declare function notify<U extends User>(users: U[], notification: PushNotification | ((user: U) => MaybePromise<PushNotification>)): Promise<NotificationSubscription[]>;
