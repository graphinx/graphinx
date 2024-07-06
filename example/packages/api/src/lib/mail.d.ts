import type Mail from 'nodemailer/lib/mailer/index.js';
import { type MailProps, type MailRequiredContentIDs, type MailTemplate } from '../mail-templates/props.js';
/**
 * Maps attachments to their CIDs
 */
type AttachmentsMap<K extends string | number | symbol> = {
    [cid in K]: Omit<Mail.Attachment, 'cid'>;
};
/**
 *
 * @param templateName the template name. See src/mail-templates/
 * @param to Who to send the mail to
 * @param data The data to give. Should be pretty explicit from the type
 * @param options.from The sender of the mail
 * @param options.subjectOverride Override the subject of the mail. By default, the subject is the email's <title>
 * @param options.attachments Attachments to add to the mail. Typing should help you to know what attachments are required
 */
export declare function sendMail<Template extends MailTemplate>(templateName: Template, to: string | string[], data: Template extends keyof MailProps ? MailProps[Template] : Record<string, never>, { from, attachments, subjectOverride, }: {
    from?: string;
    subjectOverride?: string;
} & (Template extends keyof MailRequiredContentIDs ? {
    attachments: AttachmentsMap<MailRequiredContentIDs[Template][number]> & AttachmentsMap<string>;
} : {
    attachments?: AttachmentsMap<string>;
})): Promise<void>;
export {};
