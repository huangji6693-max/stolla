import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_NODE_VERSION = "24";
const EXPECTED_LOCKFILE_PATH = "package-lock.json";
const REQUIRED_NODE_JOBS = ["frontend", "e2e"];

function extractJobSection(ciContent, jobName) {
  const lines = ciContent.split(/\r?\n/);
  const jobHeaderRegex = new RegExp(`^  ${jobName}:\\s*$`);
  const startIndex = lines.findIndex((line) => jobHeaderRegex.test(line));
  if (startIndex === -1) return null;

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^  [a-zA-Z0-9_-]+:\s*$/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }
  return lines.slice(startIndex, endIndex).join("\n");
}

export function validateCiWorkflowContent(ciContent) {
  const errors = [];

  if (typeof ciContent !== "string" || !ciContent.trim()) {
    errors.push(".github/workflows/ci.yml is missing or empty.");
    return errors;
  }

  if (ciContent.includes("apps/web/package-lock.json")) {
    errors.push(
      "CI workflow must not reference apps/web/package-lock.json; use the root package-lock.json.",
    );
  }

  if (/working-directory:\s*['"]?apps\/web\b/.test(ciContent)) {
    errors.push(
      "CI workflow must run Node install and workspace scripts from the repository root.",
    );
  }

  if (/npm\s+(?:ci|install)\s+.*--workspace/.test(ciContent)) {
    errors.push(
      "CI workflow must not run workspace-scoped dependency installs; run `npm ci` at the repository root.",
    );
  }

  for (const jobName of REQUIRED_NODE_JOBS) {
    const section = extractJobSection(ciContent, jobName);
    if (!section) {
      errors.push(`CI workflow is missing the required '${jobName}' job.`);
      continue;
    }

    if (!/uses:\s*actions\/setup-node@v4/.test(section)) {
      errors.push(
        `CI job '${jobName}' must configure Node with actions/setup-node@v4.`,
      );
    }

    const nodeVersionMatch = section.match(
      /node-version:\s*["']?([^"'\s]+)["']?/,
    );
    if (
      !nodeVersionMatch ||
      nodeVersionMatch[1] !== EXPECTED_NODE_VERSION
    ) {
      errors.push(
        `CI job '${jobName}' must use node-version "${EXPECTED_NODE_VERSION}".`,
      );
    }

    if (!/cache:\s*["']?npm["']?/.test(section)) {
      errors.push(`CI job '${jobName}' must enable npm caching.`);
    }

    const cachePathMatch = section.match(
      /cache-dependency-path:\s*["']?([^"'\s]+)["']?/,
    );
    if (!cachePathMatch || cachePathMatch[1] !== EXPECTED_LOCKFILE_PATH) {
      errors.push(
        `CI job '${jobName}' must set cache-dependency-path to ${EXPECTED_LOCKFILE_PATH}.`,
      );
    }

    const installIndex = section.search(/^\s*run:\s*npm ci\s*$/m);
    if (installIndex === -1) {
      errors.push(
        `CI job '${jobName}' must install dependencies from the repository root with \`npm ci\`.`,
      );
    }

    const checkWorkspaceIndex = section.search(
      /^\s*run:\s*npm run check:workspace\s*$/m,
    );
    if (checkWorkspaceIndex === -1) {
      errors.push(
        `CI job '${jobName}' must run \`npm run check:workspace\` to validate the workspace layout.`,
      );
    } else if (installIndex !== -1 && checkWorkspaceIndex < installIndex) {
      errors.push(
        `CI job '${jobName}' must run \`npm ci\` before \`npm run check:workspace\`.`,
      );
    }
  }

  const e2eSection = extractJobSection(ciContent, "e2e");
  if (e2eSection) {
    if (!/^\s*run:\s*npm run test:e2e:ci\s*$/m.test(e2eSection)) {
      errors.push(
        "CI job 'e2e' must run the root single-worker E2E script (`npm run test:e2e:ci`).",
      );
    }
    if (!/~\/\.cache\/ms-playwright/.test(e2eSection)) {
      errors.push("CI job 'e2e' must preserve Playwright browser caching.");
    }
  }

  return errors;
}

export function validateWorkspaceLayout({
  rootDir = process.cwd(),
  ciWorkflowContent,
} = {}) {
  const resolvePath = (relPath) => path.join(rootDir, relPath);
  const checks = [
    {
      invalid: existsSync(resolvePath("apps/web/package-lock.json")),
      message:
        "apps/web/package-lock.json must not exist. Install dependencies from the repository root.",
    },
    {
      invalid: !existsSync(resolvePath("node_modules/next/package.json")),
      message:
        "Root dependencies are missing or not hoisted. Run `npm ci` from the repository root.",
    },
    {
      invalid: !existsSync(
        resolvePath("node_modules/@swc/helpers/package.json"),
      ),
      message:
        "@swc/helpers is not available at the workspace root. Run `npm ci` from the repository root.",
    },
  ];

  const failures = checks
    .filter((check) => check.invalid)
    .map((check) => check.message);

  const ciPath = resolvePath(".github/workflows/ci.yml");
  const workflowText =
    ciWorkflowContent !== undefined
      ? ciWorkflowContent
      : existsSync(ciPath)
        ? readFileSync(ciPath, "utf8")
        : "";

  failures.push(...validateCiWorkflowContent(workflowText));

  return {
    valid: failures.length === 0,
    failures,
  };
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  const result = validateWorkspaceLayout();

  if (!result.valid) {
    console.error("Invalid npm workspace layout:\n");
    for (const message of result.failures) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log("Workspace layout is valid.");
}
