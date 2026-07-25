// deno-lint-ignore-file no-explicit-any
import {
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    FunctionDeclaration,
    Identifier,
    MemberExpr,
    NumericLiteral,
    ObjectLiteral,
    Program,
    Property,
    Stmt,
    VarDeclaration,
} from "./ast.ts";
import { Token, tokenize, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    } // check if the next token is not EOF

    private at() {
        return this.tokens[0] as Token; // as Token means represent tokens[0] as value & type
    } // get current token

    private eat() {
        const prev = this.tokens.shift() as Token;
        return prev;
    } // remove and return current token

    private expect(type: TokenType, err: any) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type != type) {
            console.error("Parser Error:\n", err, prev, "Expecting: ", type);
            Deno.exit(1);
        }

        return prev;
    } // remove and return current token, with optional argument for error handling

    public produceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: "Program",
            body: [],
        };

        // Parse until EOF
        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }

        return program;
    } // the main function for the parser

    private parse_stmt(): Stmt { // check for variables, if no, parse expr next
        switch (this.at().type) {
            case TokenType.Let:
            case TokenType.Const:
                return this.parse_var_declaration();
            case TokenType.Fn:
                return this.parse_fn_declaration();
            default:
                return this.parse_expr();
        }
    }

    private parse_fn_declaration(): Stmt {
        this.eat(); // eats fn keyword
        const name =
            this.expect(
                TokenType.Identifier,
                "Expected function name after fn keyword",
            ).value; // throw an error if function name doesnt exist

        const args = this.parse_args(); // get all args (reads them)
        const params: string[] = [];

        for (const arg of args) {
            if (arg.kind !== "Identifier") {
                console.log(arg);
                throw `Expected params to be type of string inside function declaration `;
            }

            params.push((arg as Identifier).symbol);
        }

        this.expect(
            TokenType.OpenBrace,
            "Expected function body after declaration",
        );

        const body: Stmt[] = [];

        while (
            this.at().type !== TokenType.EOF &&
            this.at().type !== TokenType.CloseBrace
        ) {
            body.push(this.parse_stmt());
        } // loop until body block ends

        this.expect(
            TokenType.CloseBrace,
            "Expected closing brace inside function declaration",
        );

        const fn = {
            body,
            name,
            parameters: params,
            kind: "FunctionDeclaration",
        } as FunctionDeclaration;

        return fn;
    }

    private parse_var_declaration(): Stmt {
        // let ident;
        // (let | const) ident = expr;
        const isConstant = this.eat().type == TokenType.Const; // check if var declaration is constant
        const identifier = this.expect( // expect variable name
            TokenType.Identifier,
            "Expected identifier name following let | const keywords.",
        ).value;

        if (this.at().type == TokenType.Semicolon) { // if next character is semicolon --> statement ended --> if constant, throw error
            this.eat(); // remove the semicolon
            if (isConstant) {
                throw "Must assign value to constant expression. No value provided. ";
            }

            return { // if no semicolon & not a constant, return
                kind: "VarDeclaration",
                identifier,
                constant: false,
            } as VarDeclaration; // we can confirm this variable is not constant because if it's a constant, an error is thrown already.
        }

        this.expect( // expect equal token (otherwise it has to be declared)
            TokenType.Equals,
            "Expected equals token following identifier in variable declaraion. ",
        );
        const declaration = { // declare variable
            kind: "VarDeclaration",
            value: this.parse_expr(),
            identifier,
            constant: isConstant,
        } as VarDeclaration;

        this.expect(
            TokenType.Semicolon,
            "Variable declaration statement must end with semicolon",
        ); // all variable declarations must end with semicolon
        return declaration;
    }

    private parse_expr(): Expr {
        return this.parse_assignment_expr();
    }

    private parse_assignment_expr(): Expr {
        const left = this.parse_object_expr();

        if (this.at().type == TokenType.Equals) {
            this.eat(); // advance past the equal token
            const value = this.parse_assignment_expr(); // allow chaining

            return {
                value,
                assigne: left,
                kind: "AssignmentExpr",
            } as AssignmentExpr;
        }

        return left;
    }

    private parse_object_expr(): Expr {
        // { Prop[] }
        if (this.at().type !== TokenType.OpenBrace) {
            return this.parse_additive_expr();
        }

        this.eat(); // advanced past open brace

        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) { // check if object has ended or not
            const key =
                this.expect(TokenType.Identifier, "Object literal key expected")
                    .value;

            // allows shorthand key: pair -> key
            if (this.at().type == TokenType.Comma) {
                this.eat(); // advance past comma
                properties.push(
                    { key, kind: "Property", value: undefined } as Property,
                );
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property", value: undefined });
                continue;
            }

            // {key: val}
            this.expect(
                TokenType.Colon,
                "Missing colon following identifier in ObjectExpr",
            );
            const value = this.parse_expr();

            properties.push({ kind: "Property", value, key });
            if (this.at().type == TokenType.Comma) {
                this.eat();
            } else if (this.at().type != TokenType.CloseBrace) {
                this.expect(
                    TokenType.CloseBrace,
                    "Expected comma or closing brace following property",
                );
            }
        }

        this.expect(
            TokenType.CloseBrace,
            "Object literal missing closing brace",
        );
        return { kind: "ObjectLiteral", properties } as ObjectLiteral;
    }

    private parse_additive_expr(): Expr {
        let left = this.parse_multiplicative_expr(); // Parse left side

        while (this.at().value == "+" || this.at().value == "-") { // Check if the next operation is still +/-
            const operator = this.eat().value; // Get the current value (after the left --> operator)
            const right = this.parse_multiplicative_expr(); // Parse right side
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }

        return left;
    } // parse additive expr, get current value (left) --> get operator --> get right value --> return left (which is now a binary expr)

    private parse_multiplicative_expr(): Expr {
        let left = this.parse_call_member_expr(); // Parse left side

        while (
            this.at().value == "/" || this.at().value == "*" ||
            this.at().value == "%"
        ) { // Check if the next operation is still *//
            const operator = this.eat().value; // Get the current value (after the left --> operator)
            const right = this.parse_call_member_expr(); // Parse right side
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            } as BinaryExpr;
        }

        return left;
    } // parse multiplicitive expr, get current value (left) --> get operator --> get right value --> return left (which is now a binary expr)

    private parse_call_member_expr(): Expr {
        const member = this.parse_member_expr();

        if (this.at().type == TokenType.OpenParen) { // foo.x(): if openParen found, call the expression, if not, return the member
            return this.parse_call_expr(member);
        }

        return member;
    }

    private parse_call_expr(caller: Expr): Expr {
        let call_expr: Expr = {
            kind: "CallExpr",
            caller,
            args: this.parse_args(),
        } as CallExpr;

        if (this.at().type == TokenType.OpenParen) {
            call_expr = this.parse_call_expr(call_expr);
        }

        return call_expr;
    }

    private parse_args(): Expr[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis"); // already checked for OpenParen up there, for emergencies only
        const args = this.at().type == TokenType.CloseParen
            ? []
            : this.parse_arguments_list();

        this.expect(
            TokenType.CloseParen,
            "Missing closing parenthesis inside arguments list",
        );
        return args;
    }

    private parse_arguments_list(): Expr[] {
        // helper function to parse_args
        const args = [this.parse_assignment_expr()]; // first arg

        while (
            this.not_eof() && this.at().type == TokenType.Comma && this.eat()
        ) { // expected comma
            args.push(this.parse_assignment_expr()); // add current arg to the args list
        }

        return args; // already expected CloseParen (in parse_args())
    }

    private parse_member_expr(): Expr {
        let object = this.parse_primary_expr();

        while (
            this.at().type == TokenType.Dot ||
            this.at().type == TokenType.OpenBracket
        ) { // foo.x or foo["x"]
            const operator = this.eat(); // either be a dot or openbracket
            let property: Expr;
            let computed: boolean;

            // non-computed value (obj.expr)
            if (operator.type == TokenType.Dot) {
                computed = false;

                // get identifier
                property = this.parse_primary_expr();

                if (property.kind != "Identifier") {
                    throw `Cannot use dot operator without right hand side being an identifier`;
                }
            } else { // allows obj[computedValue]
                computed = true;
                property = this.parse_expr();
                this.expect(
                    TokenType.CloseBracket,
                    "Missing closing bracket in computed value",
                );
            }

            object = {
                kind: "MemberExpr",
                object,
                property,
                computed,
            } as MemberExpr;
        }

        return object;
    }

    private parse_primary_expr(): Expr {
        const tk = this.at().type;

        switch (tk) { // this is the core logic for the ast in the body array
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                } as Identifier;
            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                } as NumericLiteral;
            case TokenType.OpenParen: {
                this.eat(); // Eat OpenParen
                const value = this.parse_expr();
                this.expect(
                    TokenType.CloseParen,
                    "Unexpected token found inside parenthesised expression. Expected closing parenthesis.",
                ); // closing paren
                return value;
            }
            default:
                console.error(
                    "Unexpected token found during parsing!",
                    this.at(),
                );
                Deno.exit(1);
        }
    } // parse primary expr, check if the current token is an identifier, number, or open paren. If it's an identifier or number, return the corresponding AST node. If it's an open paren, parse the expression inside the parentheses and expect a closing paren. If none of these cases match, log an error and exit.
}

/* Order of Prescidence
* AssignmentExpr
LogicalExpr
ComparisonExpr
* ObjectExpr
* AdditiveExpr
* MultiplicativeExpr
UnaryExpr
* CallExpr
* MemberExpr
* PrimaryExpr

KNOWLEDGE LEARNT:
1. Parse Stmt
2. Parse Expr
3. Parse Additive Expr & Multiplicative Expr
4. Error Handling
5. Check for EOF
*/

// parse out lhs (which allows foo.x() to be computed)
// if not computed, go to primary expr
/// parse if we are at openparen, then parse call expr,
// call expr takes in caller, lhs is call_expr, parses args list (open paren, 0 or more expr separated by commas)
