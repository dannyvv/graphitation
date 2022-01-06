/**
 * NOTE: This is currently in-flight and mostly re-uses code from the above mentioned package, where it's tested.
 */
/* istanbul ignore file */

import { FormatModule } from "relay-compiler/lib/language/RelayLanguagePluginInterface";
import { DocumentNode, parse, print } from "graphql";
import { optimizeDocumentNode } from "@graphql-tools/optimize";
import { reduceNodeWatchQueryTransform } from "./formatModuleTransforms/reduceNodeWatchQueryTransform";
import { schema } from "./schema";
import invariant from "invariant";
import { stripFragmentReferenceFieldSelectionTransform } from "./formatModuleTransforms/stripFragmentReferenceFieldSelectionTransform";
import { extractMetadataFromWatchQuery } from "./extractMetadata/extractMetadataFromWatchQuery";
import { CompiledArtefactModule } from "./types";

function printDocumentComment(document: DocumentNode) {
  return `/*\n${print(document).trim()}\n*/`;
}

function generateExports(moduleName: string, docText: string) {
  const exports: CompiledArtefactModule = {};
  const originalDocument = parse(docText, { noLocation: true });
  const optimizedDocument = optimizeDocumentNode(originalDocument);

  if (!moduleName.endsWith("WatchNodeQuery.graphql")) {
    exports.executionQueryDocument = stripFragmentReferenceFieldSelectionTransform(
      optimizedDocument
    );
  }

  invariant(schema, "Expected a schema to be passed in or set in the env");
  exports.watchQueryDocument = reduceNodeWatchQueryTransform(
    schema,
    optimizedDocument
  );

  exports.metadata = extractMetadataFromWatchQuery(exports.watchQueryDocument);

  return exports;
}

export const formatModule: FormatModule = ({
  docText,
  hash,
  moduleName,
  typeText,
  definition,
}) => {
  invariant(definition, "whatevs");
  const exports = docText && generateExports(moduleName, docText);
  const components = [
    typeText,
    exports &&
      exports.executionQueryDocument &&
      printDocumentComment(exports.executionQueryDocument),
    exports &&
      process.env.PRINT_WATCH_QUERIES &&
      exports.watchQueryDocument &&
      printDocumentComment(exports.watchQueryDocument),
    exports &&
      `export const documents: import("relay-compiler-language-graphitation").CompiledArtefactModule = ${JSON.stringify(
        exports,
        null,
        2
      )};`,
  ].filter(Boolean) as string[];

  return `/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
${hash ? `/* ${hash} */\n` : ""};

${components.join("\n\n")}`;
};
