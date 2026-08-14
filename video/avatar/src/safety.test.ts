import assert from "node:assert/strict";
import test from "node:test";
import { detectCrisis } from "./safety";

test("identifies explicit self-harm language as urgent", () => {
  assert.equal(detectCrisis("I want to end my life")?.level, "urgent");
});
test("identifies low-mood language for supportive escalation", () => {
  assert.equal(detectCrisis("I feel depressed this week")?.level, "support");
});
test("does not over-trigger on ordinary exam pressure", () => {
  assert.equal(detectCrisis("I am stressed about my exams"), null);
});
