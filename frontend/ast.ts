/*
INPUT: LEXER OUTPUT
OUTPUT: 
{
  "kind": "Program",
  "body": [
    {
      "kind": "BinaryExpr",
      "operator": "=",
      "left": { "kind": "Identifier", "symbol": "x" },
      "right": { "kind": "NumericLiteral", "value": 10 }
    }
  ]
}
*/

// Defines the structure of the language AST

export type NodeType =
  // STATEMENTS
  | "Program"
  | "VarDeclaration"
  | "FunctionDeclaration"

  // EXPRESSIONS
  | "AssignmentExpr"
  | "MemberExpr"
  | "CallExpr"

  // Literals
  | "Property"
  | "ObjectLiteral"
  | "NumericLiteral"
  | "Identifier"
  | "BinaryExpr";

/*
Statements do not result in a value at runtime.
They contain one or more Expressions internally
*/
 export interface Stmt {
   kind: NodeType;
  }
  
/*
Defines only a block which contains many statements.
Only one program will be contained in a file
*/
export interface Program extends Stmt {
  kind: "Program",
  body: Stmt[]
}

export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration",
  constant: boolean, 
  identifier: string, 
  value?: Expr; // assume identifier is undefined
}

export interface FunctionDeclaration extends Stmt {
  kind: "FunctionDeclaration",  
  parameters: string[], 
  name: string, 
  body: Stmt[]
}

/* Expression will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr", 
  assigne: Expr, // assigne is the identifier
  value: Expr, 
}

export interface BinaryExpr extends Expr {
  kind: "BinaryExpr"
  left: Expr, 
  right: Expr, 
  operator: string
}

export interface CallExpr extends Expr {
  kind: "CallExpr"
  args: Expr[], 
  caller: Expr, 
}

export interface MemberExpr extends Expr {
  kind: "MemberExpr"
  object: Expr, 
  property: Expr, 
  computed: boolean // computed is foo["bar"](), non-computed (member) is foo.bar()
}

export interface Identifier extends Expr {
  kind: "Identifier", 
  symbol: string;
}

export interface NumericLiteral extends Expr {
  kind: "NumericLiteral", 
  value: number
}

export interface Property extends Expr {
  kind: "Property", 
  key: string, 
  value?: Expr
}

export interface ObjectLiteral extends Expr {
  kind: "ObjectLiteral", 
  properties: Property[]
}
/*
KNOWLEDGE LEARNT
1. NodeType
2. Stmt
3. Program
4. Expr
5. BinaryExpr, Identifier, NumericLiteral...
*/