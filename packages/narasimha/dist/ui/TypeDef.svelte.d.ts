import { SvelteComponent } from "svelte";
import { type AugmentedSchemaType, Pantry } from '../index.js';
declare const __propDef: {
    props: {
        pantry: Pantry;
        type: AugmentedSchemaType;
        renderTitle?: boolean | undefined;
        headingLevel: 'h3' | 'h4';
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type TypeDefProps = typeof __propDef.props;
export type TypeDefEvents = typeof __propDef.events;
export type TypeDefSlots = typeof __propDef.slots;
export default class TypeDef extends SvelteComponent<TypeDefProps, TypeDefEvents, TypeDefSlots> {
}
export {};
