import {
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    Identifier,
    ObjectLiteral,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { MK_NULL, NativeFnValue, NumberVal, ObjectVal, RuntimeVal } from "../values.ts";

function eval_numeric_binary_expr(
    lhs: NumberVal,
    rhs: NumberVal,
    operator: string,
): NumberVal {
    let result = 0;

    if (operator == "+") {
        result = lhs.value + rhs.value;
    } else if (operator == "-") {
        result = lhs.value - rhs.value;
    } else if (operator == "*") {
        result = lhs.value * rhs.value;
    } else if (operator == "/") {
        // TODO: Division by zero checks
        result = lhs.value / rhs.value;
    } else if (operator == "%") {
        result = lhs.value % rhs.value;
    }

    return { value: result, type: "number" };
}

export function evaluate_binary_expr(
    binop: BinaryExpr,
    env: Environment,
): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);

    if (lhs.type == "number" && rhs.type == "number") {
        return eval_numeric_binary_expr(
            lhs as NumberVal,
            rhs as NumberVal,
            binop.operator,
        );
    }

    // one or both are null
    return MK_NULL();
}

export function eval_identifier(ident: Identifier, env: Environment) {
    const val = env.lookupVar(ident.symbol); // ident.symbol is the value of variable
    return val;
}

export function eval_assignment(
    node: AssignmentExpr,
    env: Environment,
): RuntimeVal {
    if (node.assigne.kind != "Identifier") { // checks if assigne is not identifier
        throw `Invalid LHS inside assignment expression ${
            JSON.stringify(node.assigne)
        }`;
    }

    const varname = (node.assigne as Identifier).symbol;
    return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(
    obj: ObjectLiteral,
    env: Environment,
): RuntimeVal {
    const object = { type: "object", properties: new Map() } as ObjectVal; // define object type
    for (const { key, value } of obj.properties) {

        // if value is undefined (shorthand syntax), expect value is already defined in the parentScope;
        // if value is defined, evaluate the expr
        const runtimeVal = (value == undefined)
            ? env.lookupVar(key)
            : evaluate(value, env);

        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
    const args = expr.args.map((arg) => evaluate(arg, env))
    const fn = evaluate(expr.caller, env) // RuntimeVal: Function

    if (fn.type !== "native-fn") {
        throw `Cannot call value that is not a function` + JSON.stringify(fn)
    }

    const result = (fn as NativeFnValue).call(args, env)

    return result;
}
