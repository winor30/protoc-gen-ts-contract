import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateWithBuf } from "./helpers/buf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function collectFiles(
  root: string,
  acc: Record<string, string> = {},
  prefix = ""
): Record<string, string> {
  for (const entry of readdirSync(root)) {
    const absolute = path.join(root, entry);
    const relative = path.join(prefix, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      collectFiles(absolute, acc, relative);
    } else {
      acc[relative] = readFileSync(absolute, "utf8");
    }
  }
  return acc;
}

/**
 * Collects all generated contract files under `root` into a
 * `Record<string, string>` where each key is the relative path (including file
 * name) and each value is the file contents. Optional `filterFile` and
 * `replaceContent` allow tests to drop or tweak entries before comparison.
 *
 * @param {string} root root directory to traverse for contracts
 * @param {(file: string) => boolean} [filterFile] optional matcher to drop entries
 * @param {(file: string) => string} [replaceContent] optional mapper to tweak contents
 * @returns {Record<string, string>} map of relative contract paths to contents
 */
function collectContracts(
  root: string,
  filterFile?: (file: string) => boolean,
  replaceContent?: (file: string) => string
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(collectFiles(root))
      .filter(([file]) => file.endsWith("_contract.ts"))
      .filter(([file]) => (filterFile ? filterFile(file) : true))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, content]) => [
        file,
        replaceContent ? replaceContent(content) : content,
      ])
  );
}

test("contracts match expected outputs", () => {
  const expectedRoot = path.join(__dirname, "fixtures", "expected");
  const expected = collectContracts(expectedRoot);

  const { genDir } = generateWithBuf();
  const actual = collectContracts(genDir);

  expect(actual).toEqual(expected);
});

test("skip_pkg removes matching packages from generation", () => {
  const expectedRoot = path.join(__dirname, "fixtures", "expected");
  const expected = collectContracts(
    expectedRoot,
    (file) => !file.includes("fixtures/orders/v1/order_contract.ts"),
    (content) =>
      content.replace(
        '"target=ts,import_extension=.js"',
        '"target=ts,import_extension=.js,skip_pkg=fixtures.orders.*"'
      )
  );

  const { genDir } = generateWithBuf({
    pluginOptions: ["skip_pkg=fixtures.orders.*"],
  });
  const actual = collectContracts(genDir);

  expect(actual).toEqual(expected);
});
