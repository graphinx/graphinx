import { Pantry } from '../pantry.js';
import { z } from 'zod';
export declare const spec: z.ZodObject<{
    reference_path: z.ZodOptional<z.ZodString>;
    modules: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        display: z.ZodOptional<z.ZodString>;
        docs: z.ZodString;
        items: z.ZodArray<z.ZodString, "many">;
        color: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        sources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        items: string[];
        docs: string;
        display?: string | undefined;
        color?: string | undefined;
        icon?: string | undefined;
        sources?: Record<string, string> | undefined;
    }, {
        name: string;
        items: string[];
        docs: string;
        display?: string | undefined;
        color?: string | undefined;
        icon?: string | undefined;
        sources?: Record<string, string> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    modules: {
        name: string;
        items: string[];
        docs: string;
        display?: string | undefined;
        color?: string | undefined;
        icon?: string | undefined;
        sources?: Record<string, string> | undefined;
    }[];
    reference_path?: string | undefined;
}, {
    modules: {
        name: string;
        items: string[];
        docs: string;
        display?: string | undefined;
        color?: string | undefined;
        icon?: string | undefined;
        sources?: Record<string, string> | undefined;
    }[];
    reference_path?: string | undefined;
}>;
export declare const DEFAULT_SPEC_PATH = ".narasimha.json";
/**
 * A static module loader, that just imports a JSON file containing the modules' definitions.
 */
declare const _default: {
    name: string;
    load(schema: import("../schema.js").SchemaClass, options: {
        path?: string | undefined;
    }): Promise<Pantry>;
};
export default _default;
