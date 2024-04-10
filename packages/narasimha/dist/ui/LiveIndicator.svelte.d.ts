import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        href: string;
        noInteractions?: boolean | undefined;
        title?: string | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type LiveIndicatorProps = typeof __propDef.props;
export type LiveIndicatorEvents = typeof __propDef.events;
export type LiveIndicatorSlots = typeof __propDef.slots;
export default class LiveIndicator extends SvelteComponent<LiveIndicatorProps, LiveIndicatorEvents, LiveIndicatorSlots> {
}
export {};
