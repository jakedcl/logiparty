import assert from "node:assert/strict";
import { it } from "node:test";
import { loadingProgress } from "./loading-progress";

it("overloading one item cannot complete a different item's loading", () => {
  const progress = loadingProgress([
    { quantityAssigned: 10, quantityLoaded: 20 },
    { quantityAssigned: 10, quantityLoaded: 0 },
  ]);
  assert.equal(progress.loadedLines, 1);
  assert.equal(progress.totalLines, 2);
});

it("counts partially loaded lines and preserves actual unit totals", () => {
  assert.deepEqual(loadingProgress([
    { quantityAssigned: 8, quantityLoaded: 4 },
    { quantityAssigned: 3, quantityLoaded: 3 },
  ]), { loadedLines: 1, totalLines: 2, assignedUnits: 11, loadedUnits: 7 });
});

it("empty or unassigned inventory does not report fully loaded lines", () => {
  assert.deepEqual(loadingProgress([]), { loadedLines: 0, totalLines: 0, assignedUnits: 0, loadedUnits: 0 });
  assert.equal(loadingProgress([{ quantityAssigned: 0, quantityLoaded: 0 }]).totalLines, 0);
});
