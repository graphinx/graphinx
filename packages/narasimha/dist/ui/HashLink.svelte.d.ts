import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        [x: string]: any;
        hash: string | undefined;
        element?: string | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export type HashLinkProps = typeof __propDef.props;
export type HashLinkEvents = typeof __propDef.events;
export type HashLinkSlots = typeof __propDef.slots;
export default class HashLink extends SvelteComponent<HashLinkProps, HashLinkEvents, HashLinkSlots> {
}
export {};
