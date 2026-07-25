import Environment from "./environment.ts";

// define the types used in the runtime
export type ValueType = "null" | "number" | "boolean" | "object" | "native-fn"

// runtime value is the type exists in custlan
export interface RuntimeVal {
    type: ValueType
}

export interface NullVal extends RuntimeVal {
    type: "null", 
    value: null
}

export function MK_NULL(): NullVal {
    return { value: null, type: "null" }
}

export interface NumberVal extends RuntimeVal {
    type: "number", 
    value: number
}

export function MK_NUMBER(n = 0): NumberVal {
    return { value: n, type: "number" } as NumberVal
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean"
    value: boolean
}

export function MK_BOOL(b = true): BooleanVal {
    return { value: b, type: "boolean" }
}

export interface ObjectVal extends RuntimeVal {
    type: "object", 
    properties: Map<string, RuntimeVal>
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal

export interface NativeFnValue extends RuntimeVal {
    type: "native-fn", 
    call: FunctionCall
}

export function MK_NATIVE_FN(call: FunctionCall) {
    return { type: "native-fn", call } as NativeFnValue
}