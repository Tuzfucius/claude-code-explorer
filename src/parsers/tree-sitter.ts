import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

import Parser from "web-tree-sitter";

import type { FileIndexEntry, FileSymbol } from "../core/types.js";

const require = createRequire(import.meta.url);

const AST_LANGUAGE_MAP: Record<string, string> = {
  typescript: "tree-sitter-typescript.wasm",
  javascript: "tree-sitter-javascript.wasm",
  python: "tree-sitter-python.wasm",
  java: "tree-sitter-java.wasm",
  go: "tree-sitter-go.wasm",
  rust: "tree-sitter-rust.wasm",
};

let parserReady: Promise<void> | undefined;
const languageCache = new Map<string, Promise<Parser.Language>>();

export async function parseWithTreeSitter(repoPath: string, relativePath: string, language: string): Promise<FileIndexEntry | undefined> {
  if (!(language in AST_LANGUAGE_MAP)) {
    return undefined;
  }

  await ensureParserReady();
  const parser = new Parser();
  parser.setLanguage(await loadLanguage(language));

  const absolutePath = path.join(repoPath, relativePath);
  const source = await readFile(absolutePath, "utf8");
  const tree = parser.parse(source);
  if (!tree) {
    return undefined;
  }
  const root = tree.rootNode;
  const symbols: FileSymbol[] = [];
  const imports: string[] = [];
  const exports: string[] = [];

  walk(root, (node) => {
    collectNode(node, source, language, symbols, imports, exports);
  });

  return {
    path: relativePath,
    language,
    size: Buffer.byteLength(source, "utf8"),
    imports: dedupe(imports),
    exports: dedupe(exports),
    symbols,
    summary: source.split(/\r?\n/).slice(0, 30).join("\n"),
    source: "ast",
    confidence: "high",
  };
}

async function ensureParserReady(): Promise<void> {
  parserReady ??= Parser.init({
    locateFile(scriptName: string) {
      if (scriptName.endsWith(".wasm")) {
        return require.resolve("web-tree-sitter/tree-sitter.wasm");
      }
      return scriptName;
    },
  });

  await parserReady;
}

async function loadLanguage(language: string): Promise<Parser.Language> {
  let pending = languageCache.get(language);
  if (!pending) {
    const wasmPath = require.resolve(`tree-sitter-wasms/out/${AST_LANGUAGE_MAP[language]}`);
    pending = Parser.Language.load(wasmPath);
    languageCache.set(language, pending);
  }

  return pending;
}

function walk(node: Parser.SyntaxNode, visitor: (node: Parser.SyntaxNode) => void): void {
  visitor(node);
  for (let index = 0; index < node.namedChildCount; index += 1) {
    const child = node.namedChild(index);
    if (child) {
      walk(child, visitor);
    }
  }
}

function collectNode(
  node: Parser.SyntaxNode,
  source: string,
  language: string,
  symbols: FileSymbol[],
  imports: string[],
  exports: string[],
): void {
  const text = sliceText(source, node).replace(/\s+/g, " ").trim();

  switch (language) {
    case "typescript":
    case "javascript":
      collectJsTs(node, text, symbols, imports, exports);
      break;
    case "python":
      collectPython(node, text, symbols, imports);
      break;
    case "java":
      collectJava(node, text, symbols, imports);
      break;
    case "go":
      collectGo(node, text, symbols, imports);
      break;
    case "rust":
      collectRust(node, text, symbols, imports);
      break;
    default:
      break;
  }
}

function collectJsTs(
  node: Parser.SyntaxNode,
  text: string,
  symbols: FileSymbol[],
  imports: string[],
  exports: string[],
): void {
  if (node.type === "import_statement") {
    imports.push(text);
  }

  if (node.type === "export_statement") {
    exports.push(text);
  }

  if (node.type === "class_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({ kind: "class", name, signature: text, confidence: "high", source: "ast" });
  }

  if (node.type === "function_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    const returns = node.childForFieldName("return_type")?.text;
    symbols.push({
      kind: "function",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      returns,
      confidence: "high",
      source: "ast",
    });
  }

  if (node.type === "method_definition") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    symbols.push({
      kind: "method",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      confidence: "high",
      source: "ast",
    });
  }

  if (node.type === "interface_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({ kind: "interface", name, signature: text, confidence: "high", source: "ast" });
  }

  if (node.type === "type_alias_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({ kind: "type", name, signature: text, confidence: "high", source: "ast" });
  }
}

function collectPython(node: Parser.SyntaxNode, text: string, symbols: FileSymbol[], imports: string[]): void {
  if (node.type === "import_statement" || node.type === "import_from_statement") {
    imports.push(text);
  }

  if (node.type === "class_definition") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({ kind: "class", name, signature: text.split(":")[0] ?? text, confidence: "high", source: "ast" });
  }

  if (node.type === "function_definition") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    const returns = node.childForFieldName("return_type")?.text;
    symbols.push({
      kind: "function",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      returns,
      confidence: "high",
      source: "ast",
    });
  }
}

function collectJava(node: Parser.SyntaxNode, text: string, symbols: FileSymbol[], imports: string[]): void {
  if (node.type === "import_declaration") {
    imports.push(text);
  }

  if (node.type === "class_declaration" || node.type === "interface_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({
      kind: node.type === "class_declaration" ? "class" : "interface",
      name,
      signature: text,
      confidence: "high",
      source: "ast",
    });
  }

  if (node.type === "method_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    const returns = node.childForFieldName("type")?.text;
    symbols.push({
      kind: "method",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      returns,
      confidence: "high",
      source: "ast",
    });
  }
}

function collectGo(node: Parser.SyntaxNode, text: string, symbols: FileSymbol[], imports: string[]): void {
  if (node.type === "import_declaration" || node.type === "import_spec") {
    imports.push(text);
  }

  if (node.type === "type_declaration") {
    const name = node.namedChild(0)?.text ?? "anonymous";
    symbols.push({ kind: "type", name, signature: text, confidence: "high", source: "ast" });
  }

  if (node.type === "function_declaration" || node.type === "method_declaration") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    const returns = node.childForFieldName("result")?.text;
    symbols.push({
      kind: node.type === "method_declaration" ? "method" : "function",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      returns,
      confidence: "high",
      source: "ast",
    });
  }
}

function collectRust(node: Parser.SyntaxNode, text: string, symbols: FileSymbol[], imports: string[]): void {
  if (node.type === "use_declaration") {
    imports.push(text);
  }

  if (node.type === "struct_item" || node.type === "enum_item" || node.type === "trait_item") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    symbols.push({
      kind: node.type === "trait_item" ? "interface" : "type",
      name,
      signature: text,
      confidence: "high",
      source: "ast",
    });
  }

  if (node.type === "function_item") {
    const name = node.childForFieldName("name")?.text ?? "anonymous";
    const params = node.childForFieldName("parameters")?.text ?? "()";
    const returns = node.childForFieldName("return_type")?.text;
    symbols.push({
      kind: "function",
      name,
      signature: `${name}${params}`,
      parameters: splitParameters(params),
      returns,
      confidence: "high",
      source: "ast",
    });
  }
}

function sliceText(source: string, node: Parser.SyntaxNode): string {
  return source.slice(node.startIndex, node.endIndex);
}

function splitParameters(parameters: string): string[] {
  return parameters
    .replace(/^[({]/, "")
    .replace(/[)}]$/, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
