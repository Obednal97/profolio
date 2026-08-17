/**
 * Copies the pdf.js worker out of node_modules into public/.
 *
 * pdf.js refuses to run when the worker and the library disagree: the worker
 * throws `The API version "X" does not match the Worker version "Y"`. The
 * worker used to be a file committed by hand into public/, and it had drifted -
 * public/pdf.worker.min.js was 5.2.133 while the installed pdfjs-dist was
 * 5.4.149 - so every PDF upload failed before it parsed anything.
 *
 * Copying it on install and before a build means the two cannot disagree again,
 * whatever pdfjs-dist is upgraded to.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(
  root,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const destination = join(root, "public/pdf.worker.min.mjs");

if (!existsSync(source)) {
  // Not a failure: a production install without dev dependencies, or a
  // pdfjs-dist that has moved its build output, should not break the build.
  // The upload page reports that PDF support is unavailable instead.
  console.warn(`[pdf-worker] ${source} not found, skipping copy`);
  process.exit(0);
}

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);

const version =
  /version\s*=\s*"([\d.]+)"/.exec(
    readFileSync(join(root, "node_modules/pdfjs-dist/package.json"), "utf8"),
  )?.[1] ?? JSON.parse(
    readFileSync(join(root, "node_modules/pdfjs-dist/package.json"), "utf8"),
  ).version;

console.log(`[pdf-worker] copied pdfjs-dist ${version} worker to public/`);
