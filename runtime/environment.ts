// This file is for declaring variables

import { MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, RuntimeVal } from "./values.ts";

export function createGlobalEnv() {
    const env = new Environment()

    // declaring global environment
    env.declareVar("true", MK_BOOL(true), true)
    env.declareVar("false", MK_BOOL(false), true)
    env.declareVar("null", MK_NULL(), true)

    // define a native built-in method
    env.declareVar("print", MK_NATIVE_FN((args) => {
        console.log(...args);
        return MK_NULL()
    }),true)
    
    function timeFunction(args: RuntimeVal[], env: Environment) {
        return MK_NUMBER(Date.now())
    }
    env.declareVar("time", MK_NATIVE_FN(timeFunction), true)

    return env
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeVal>; // map --> object, set --> array 
    private constants: Set<string>;

    constructor (parentENV?: Environment) {
        this.parent = parentENV
        this.variables = new Map()  
        this.constants = new Set()

    }

    public declareVar(varname: string, value: RuntimeVal, constant: boolean): RuntimeVal { // let the user to define a var
        if (this.variables.has(varname)) { // check if variable already exists (.has() checks if key exists in Map)
            throw `Cannot declare variable ${varname} as it already is defined`
        }

        this.variables.set(varname, value) // set the var

        if (constant) {
            this.constants.add(varname)
        }

        return value;
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname) // find the variable
        
        // cannot assign to constant
        if (env.constants.has(varname)) {
            throw `Cannot reassign to variable ${varname} as it was declared constant. `
        }

        env.variables.set(varname, value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const env = this.resolve(varname) // find the variable
        return env.variables.get(varname) as RuntimeVal // find the value of assigned variable, (as Runtimeval is for preventing TS throws RuntimeVal is undefined)
    }

    public resolve(varname: string): Environment { 
        if (this.variables.has(varname)) {
            return this // check if current scope has this variable, return current scope
        }

        if (this.parent == undefined) {
            throw `Cannot resolve '${varname}' as it does not exist.`
        } // check the parent (global scope), if not exist, throw an error

        return this.parent.resolve(varname) 
    }
}

/*
KNOWLEDGE LEARNT
1. Parent (global scope)
2. Variables is a Map
3. Declare variable
4. Assign & resolve variable
5. Lookup variable (get the value of variable) 
*/