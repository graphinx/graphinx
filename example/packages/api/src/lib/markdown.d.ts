import 'linkify-plugin-mention';
/** Converts markdown to HTML. */
export declare const toHtml: (body: string, options?: {
    linkifyUserMentions: boolean;
    linkifyGitlabItems: boolean;
}) => Promise<any>;
export declare function htmlToText(body: string): string;
