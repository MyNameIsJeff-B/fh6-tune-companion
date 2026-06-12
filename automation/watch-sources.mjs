import { writeFile } from "node:fs/promises";
import { runWatch, renderIssue } from "./source-watch.mjs";

const dryRun = process.argv.includes("--dry-run");
const report = await runWatch({ dryRun });
const actionable =
  report.dataUpdates.length ||
  report.reviewRequired.length ||
  report.signals.length ||
  report.unreachable.length;

if (!dryRun) {
  await writeFile("automation/issue-body.md", renderIssue(report), "utf8");
}

console.log(JSON.stringify({ actionable: Boolean(actionable), ...report }, null, 2));
