import { NumberVal, RuntimeVal } from "./values.ts";
import { Program, BinaryExpr, NumericLiteral, Stmt, Identifier, VarDeclaration, AssignmentExpr, ObjectLiteral, CallExpr } from "../frontend/ast.ts";
import Environment from "./environment.ts";
import { eval_identifier, evaluate_binary_expr, eval_assignment, eval_object_expr, eval_call_expr } from "./eval/expressions.ts";
import { eval_program, eval_var_declaration } from "./eval/statements.ts";


export function evaluate(astNode: Stmt, env: Environment): RuntimeVal { // this is the heart of the interpreter, it switches through different AST nodes and evaluates them
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: (astNode as NumericLiteral).value,
                type: "number"
            } as NumberVal;
        case "Identifier": 
            return eval_identifier(astNode as Identifier, env)
        case "ObjectLiteral": 
            return eval_object_expr(astNode as ObjectLiteral, env)
        case "CallExpr": 
            return eval_call_expr(astNode as CallExpr, env)
        case "BinaryExpr": 
            return evaluate_binary_expr(astNode as BinaryExpr, env)
        case "AssignmentExpr":
            return eval_assignment(astNode as AssignmentExpr, env)
        case "Program":  
            return eval_program(astNode as Program, env)
        case "VarDeclaration": 
            return eval_var_declaration(astNode as VarDeclaration, env)
        default:
            console.error("This AST Node has not yet been set up for interpretation.", "\n",  astNode)
            Deno.exit(1)
    }
}


/*
1. Evaluate Node from parser
2. Iterate through all children, return last evaluated statement
3. Evaluate numeric literal, binary expression, program
4. Evaluate identifiers (variables, check the variables in lookupVar())
4. Evaluate binary expression: get lhs & rhs, make sure they are a number ==> evaluate
*/