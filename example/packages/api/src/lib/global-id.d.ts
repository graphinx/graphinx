/**
 * Maps database ID prefixes to GraphQL type names. Please add new types here as they are added to
 * the schema, by running node scripts/update-id-prefix-to-typename-map.js.
 */
export declare const ID_PREFIXES_TO_TYPENAMES: {
    readonly u: "User";
    readonly godparentreq: "GodparentRequest";
    readonly candidate: "UserCandidate";
    readonly passreset: "PasswordReset";
    readonly emailchange: "EmailChange";
    readonly quicksignup: "QuickSignup";
    readonly service: "Service";
    readonly link: "Link";
    readonly major: "Major";
    readonly minor: "Minor";
    readonly school: "School";
    readonly credential: "Credential";
    readonly token: "ThirdPartyCredential";
    readonly app: "ThirdPartyApp";
    readonly ae: "StudentAssociation";
    readonly contribution: "Contribution";
    readonly contributionoption: "ContributionOption";
    readonly g: "Group";
    readonly a: "Article";
    readonly e: "Event";
    readonly tg: "TicketGroup";
    readonly t: "Ticket";
    readonly r: "Registration";
    readonly log: "LogEntry";
    readonly lydia: "LydiaAccount";
    readonly lydiapayment: "LydiaTransaction";
    readonly paypalpayment: "PaypalTransaction";
    readonly barweek: "BarWeek";
    readonly notifsub: "NotificationSubscription";
    readonly notif: "Notification";
    readonly ann: "Announcement";
    readonly ue: "TeachingUnit";
    readonly subj: "Subject";
    readonly doc: "Document";
    readonly comment: "Comment";
    readonly reac: "Reaction";
    readonly promocode: "PromotionCode";
    readonly promo: "Promotion";
    readonly picfile: "Picture";
    readonly shopitem: "ShopItem";
    readonly shoppayment: "ShopPayment";
    readonly shopitemoption: "ShopItemOption";
    readonly shopitemanswer: "ShopItemAnswer";
    readonly form: "Form";
    readonly formsection: "FormSection";
    readonly formjump: "FormJump";
    readonly question: "Question";
    readonly answer: "Answer";
    readonly page: "Page";
};
export declare const TYPENAMES_TO_ID_PREFIXES: Record<(typeof ID_PREFIXES_TO_TYPENAMES)[keyof typeof ID_PREFIXES_TO_TYPENAMES], keyof typeof ID_PREFIXES_TO_TYPENAMES>;
export declare function removeIdPrefix(id: string): string;
export declare function ensureGlobalId(id: string, typename: keyof typeof TYPENAMES_TO_ID_PREFIXES): string;
/**
 * Split a global ID into its typename and local ID parts.
 * @param id The global ID to split
 */
export declare function splitID(id: string): [keyof typeof TYPENAMES_TO_ID_PREFIXES, string];
export declare function makeGlobalID(typename: keyof typeof TYPENAMES_TO_ID_PREFIXES, localID: string): string;
export declare function encodeGlobalID(_typename: string, id: string | number | bigint): string;
export declare function decodeGlobalID(globalID: string): {
    typename: "User" | "GodparentRequest" | "UserCandidate" | "PasswordReset" | "EmailChange" | "QuickSignup" | "Service" | "Link" | "Major" | "Minor" | "School" | "Credential" | "ThirdPartyCredential" | "ThirdPartyApp" | "StudentAssociation" | "Contribution" | "ContributionOption" | "Group" | "Article" | "Event" | "TicketGroup" | "Ticket" | "Registration" | "LogEntry" | "LydiaAccount" | "LydiaTransaction" | "PaypalTransaction" | "BarWeek" | "NotificationSubscription" | "Notification" | "Announcement" | "TeachingUnit" | "Subject" | "Document" | "Comment" | "Reaction" | "PromotionCode" | "Promotion" | "Picture" | "ShopItem" | "ShopPayment" | "ShopItemOption" | "ShopItemAnswer" | "Form" | "FormSection" | "FormJump" | "Question" | "Answer" | "Page";
    id: string;
};
