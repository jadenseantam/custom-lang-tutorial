import Parser from "./frontend/parser.ts"
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

run("./test.txt")
// repl()

async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv()


    const input = await Deno.readTextFile(filename)
    const program = parser.produceAST(input)
    const result = evaluate(program, env)
}

/* 
1. Lexer
2. AST Types
3. Parser (using AST Types, produces AST)
4. Interpreter (Evaluate AST)
5. Environment Variables (true, false, null) (declareVar, assignVar, lookupVar, resolve)
5a. Map for variables, Set for constants
6. User Declarable Variables (VarDeclaration is a Stmt, Define Variable Keywords)
6a. Parse the variable declaration, kind: "VarDeclaration", identifier, constant: boolean
6b. Assign variable: Lexer --> Parser --> Interpreter
7. Object & User Defined Structures: Lexer --> Parser --> Interpreter
*/ 