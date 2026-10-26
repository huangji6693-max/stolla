import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  validateCiWorkflowContent,
  validateWorkspaceLayout,
} from "./check-workspace-layout.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ciWorkflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");

test("repository workspace layout and CI workflow pass validation", () => {
  const result = validateWorkspaceLayout({ rootDir: repoRoot });
  assert.equal(result.valid, true, result.failures.join("\n"));
  assert.deepEqual(result.failures, []);
});

test("CI workflow contains no reference to nested apps/web/package-lock.json", () => {
  const ciContent = fs.readFileSync(ciWorkflowPath, "utf8");
  assert.equal(ciContent.includes("apps/web/package-lock.json"), false);

  const broken = ciContent.replace(
    "cache-dependency-path: package-lock.json",
    "cache-dependency-path: apps/web/package-lock.json",
  );
  const errors = validateCiWorkflowContent(broken);
  assert.ok(
    errors.some((msg) => msg.includes("apps/web/package-lock.json")),
    `Expected nested lockfile error, got: ${errors.join("; ")}`,
  );
});

test("rejects mismatched Node versions or workspace-scoped installs in CI", () => {
  const ciContent = fs.readFileSync(ciWorkflowPath, "utf8");

  const mismatchedNode = ciContent.replace(
    'node-version: "24"',
    'node-version: "20"',
  );
  const nodeErrors = validateCiWorkflowContent(mismatchedNode);
  assert.ok(
    nodeErrors.some((msg) => msg.includes('must use node-version "24"')),
  );

  const missingWorkspaceCheck = ciContent.replace(
    /^\s*- name: Validate workspace layout\r?\n\s*run: npm run check:workspace\r?\n/m,
    "",
  );
  const checkErrors = validateCiWorkflowContent(missingWorkspaceCheck);
  assert.ok(
    checkErrors.some((msg) => msg.includes("npm run check:workspace")),
  );

  const nonSingleWorkerE2e = ciContent.replace(
    "run: npm run test:e2e:ci",
    "run: npm run test:e2e --workspace=web",
  );
  const e2eErrors = validateCiWorkflowContent(nonSingleWorkerE2e);
  assert.ok(e2eErrors.some((msg) => msg.includes("npm run test:e2e:ci")));
});
