import { type Group, type GroupMember, type Major, type School, type User } from '@churros/db/prisma';
import type { MaybePromise } from '@pothos/core';
import { Cron } from 'croner';
import type { PushNotification } from './push-notification.js';
/**
 * @param notification A function that returns a PushNotification to send, or undefined to send
 *   nothing and cancel the job.
 * @param options.type Notification type
 * @param options.objectId ID of the object to which the notification is related. Together with
 *   `options.type`, this is used to identify the cron job associated with the notification.
 * @param options.at Date at which the notification should be sent
 * @param options.eager If true, the notification will be sent immediately if `options.at` is in the
 *   past
 * @param option.dryRun print to the console but don't send anything
 * @returns The created job, false if no notification was sent and true if notifications were sent
 *   eagerly
 */
export declare function scheduleNotification(notification: (user: User & {
    major: null | (Major & {
        schools: School[];
    });
    groups: Array<GroupMember & {
        group: Group;
    }>;
}) => MaybePromise<(PushNotification & {
    afterSent: () => Promise<void>;
}) | undefined>, { at, eager, dryRun, }: {
    at: Date;
    eager?: boolean;
    dryRun?: boolean;
}): Promise<Cron | boolean>;
