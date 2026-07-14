import test from "node:test";
import assert from "node:assert/strict";

import {
  DIFFICULTY_RANGES,
  GOAL_STATE,
  canMoveTile,
  formatElapsedTime,
  generateShuffle,
  getMovableTiles,
  isSolvable,
  isSolved,
  manhattanDistance,
  moveTile,
  solvePuzzle,
} from "../src/puzzle.js";

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = ((value * 1664525) + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

test("完成状態を判定できる", () => {
  assert.equal(isSolved(GOAL_STATE), true);
  assert.equal(isSolved([1, 2, 3, 4, 5, 6, 7, 0, 8]), false);
  assert.equal(manhattanDistance(GOAL_STATE), 0);
});

test("空きマスの上下左右にあるプレートだけを動かせる", () => {
  const state = [1, 2, 3, 4, 0, 5, 6, 7, 8];
  assert.deepEqual(getMovableTiles(state).sort((a, b) => a - b), [2, 4, 5, 7]);
  assert.equal(canMoveTile(state, 5), true);
  assert.equal(canMoveTile(state, 1), false);
  assert.deepEqual(moveTile(state, 5), [1, 2, 3, 4, 5, 0, 6, 7, 8]);
  assert.deepEqual(moveTile(state, 1), state);
});

test("反転数から完成可能性を判定できる", () => {
  assert.equal(isSolvable([1, 2, 3, 4, 5, 6, 7, 0, 8]), true);
  assert.equal(isSolvable([1, 2, 3, 4, 5, 6, 8, 7, 0]), false);
});

test("A*探索が既知の配置を最短手数で解く", () => {
  assert.equal(solvePuzzle([1, 2, 3, 4, 5, 6, 7, 0, 8]).length, 1);
  assert.equal(solvePuzzle([1, 2, 3, 4, 5, 6, 0, 7, 8]).length, 2);
  assert.equal(solvePuzzle([8, 6, 7, 2, 5, 4, 3, 0, 1]).length, 31);
  assert.equal(solvePuzzle([1, 2, 3, 4, 5, 6, 8, 7, 0]), null);
});

test("解法の操作列を適用すると完成する", () => {
  let state = [7, 2, 4, 5, 0, 6, 8, 3, 1];
  const solution = solvePuzzle(state);
  for (const tile of solution) {
    state = moveTile(state, tile);
  }
  assert.equal(isSolved(state), true);
});

for (const [difficulty, range] of Object.entries(DIFFICULTY_RANGES)) {
  test(`${range.label}のシャッフルが指定した最短手数に収まる`, () => {
    const random = seededRandom(20260714 + range.min);
    for (let index = 0; index < 3; index += 1) {
      const result = generateShuffle(difficulty, random);
      const solution = solvePuzzle(result.state);
      assert.equal(isSolvable(result.state), true);
      assert.equal(isSolved(result.state), false);
      assert.equal(solution.length, result.solutionLength);
      assert.ok(solution.length >= range.min);
      assert.ok(solution.length <= range.max);
    }
  });
}

test("経過時間を分秒形式に整形できる", () => {
  assert.equal(formatElapsedTime(0), "00:00");
  assert.equal(formatElapsedTime(65_999), "01:05");
});
