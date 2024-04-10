import { SvelteComponent } from "svelte";
import { type Arg, Pantry } from '../index.js';
declare const __propDef: {
    props: {
        typ: Arg['type'];
        pantry: Pantry;
        inline?: boolean | undefined;
        nullable?: boolean | undefined;
        noExpandEnums?: boolean | undefined;
        invertNullabilitySign?: boolean | undefined;
        explicitNullabilitySign?: boolean | undefined;
        enumWasExpanded?: boolean | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ArgTypeProps = typeof __propDef.props;
export type ArgTypeEvents = typeof __propDef.events;
export type ArgTypeSlots = typeof __propDef.slots;
export default class ArgType extends SvelteComponent<ArgTypeProps, ArgTypeEvents, ArgTypeSlots> {
}
export {};
