import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface BufGenerationResult {
  readonly outDir: string;
  readonly genDir: string;
}

export interface BufGenerationOptions {
  readonly pluginOptions?: readonly string[];
}

export function generateWithBuf(
  options: BufGenerationOptions = {}
): BufGenerationResult {
  const outDir = mkdtempSync(path.join(tmpdir(), "ts-contract-gen-"));
  const templatePath = path.join(outDir, "buf.gen.yaml");
  writeFileSync(
    templatePath,
    createTemplate(outDir, options.pluginOptions ?? []),
    "utf8"
  );

  execFileSync("buf", ["generate", "--template", templatePath], {
    cwd: path.resolve(__dirname, "../fixtures/proto"),
    stdio: "inherit",
  });

  return {
    outDir,
    genDir: path.join(outDir, "gen"),
  };
}

/**
 * Creates a buf.gen.yaml template that runs the upstream ES plugin first and
 * then this repo's local plugin against the same `gen` directory.
 *
 * Example buf.gen.yaml:
 * ```
 * version: v2
 * plugins:
 *   - remote: buf.build/bufbuild/es:v2.0.0
 *     out: "/tmp/ts-contract-gen-abc/gen"
 *     include_imports: true
 *     opt:
 *       - target=ts
 *       - import_extension=.js
 *   - local: "/path/to/repo/dist/cli.js"
 *     out: "/tmp/ts-contract-gen-abc/gen"
 *     opt:
 *       - target=ts
 *       - import_extension=.js
 *       - customOption=foo
 * ```
 *
 * @param outDir temporary directory that will host buf.gen.yaml and outputs
 * @param pluginOptions optional extra opts appended to the contract plugin
 * @returns YAML string ready to be written to buf.gen.yaml
 */
function createTemplate(
  outDir: string,
  pluginOptions: readonly string[]
): string {
  const baseOut = path.join(outDir, "gen");
  const esOut = baseOut;
  const contractOut = baseOut;
  const pluginPath = path.resolve(__dirname, "../../dist/cli.js");
  const esOpts = ["target=ts", "import_extension=.js"];
  const contractOpts = ["target=ts", "import_extension=.js", ...pluginOptions];

  const formatOpts = (opts: readonly string[]): string =>
    opts.map((opt) => `      - ${opt}`).join("\n");

  return `version: v2
plugins:
  - remote: buf.build/bufbuild/es:v2.0.0
    out: ${JSON.stringify(esOut)}
    include_imports: true
    opt:
${formatOpts(esOpts)}
  - local: ${JSON.stringify(pluginPath)}
    out: ${JSON.stringify(contractOut)}
    opt:
${formatOpts(contractOpts)}
`;
}
