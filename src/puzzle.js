export const GOAL_STATE = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 0]);

export const DIFFICULTY_RANGES = Object.freeze({
  easy: Object.freeze({ min: 4, max: 8, label: "初級" }),
  medium: Object.freeze({ min: 10, max: 16, label: "中級" }),
  hard: Object.freeze({ min: 18, max: 24, label: "上級" }),
});

const BOARD_WIDTH = 3;
const NEIGHBORS = Object.freeze([
  Object.freeze([1, 3]),
  Object.freeze([0, 2, 4]),
  Object.freeze([1, 5]),
  Object.freeze([0, 4, 6]),
  Object.freeze([1, 3, 5, 7]),
  Object.freeze([2, 4, 8]),
  Object.freeze([3, 7]),
  Object.freeze([4, 6, 8]),
  Object.freeze([5, 7]),
]);

export function stateKey(state) {
  return state.join("");
}

export function isSolved(state) {
  return stateKey(state) === stateKey(GOAL_STATE);
}

export function getMovableTiles(state) {
  const blankIndex = state.indexOf(0);
  return NEIGHBORS[blankIndex].map((index) => state[index]);
}

export function canMoveTile(state, tile) {
  if (!Number.isInteger(tile) || tile < 1 || tile > 8) {
    return false;
  }

  const tileIndex = state.indexOf(tile);
  const blankIndex = state.indexOf(0);
  return NEIGHBORS[blankIndex].includes(tileIndex);
}

export function moveTile(state, tile) {
  if (!canMoveTile(state, tile)) {
    return state.slice();
  }

  const next = state.slice();
  const tileIndex = next.indexOf(tile);
  const blankIndex = next.indexOf(0);
  [next[tileIndex], next[blankIndex]] = [next[blankIndex], next[tileIndex]];
  return next;
}

export function isSolvable(state) {
  const values = state.filter((value) => value !== 0);
  let inversions = 0;

  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      if (values[left] > values[right]) {
        inversions += 1;
      }
    }
  }

  return inversions % 2 === 0;
}

export function manhattanDistance(state) {
  return state.reduce((distance, tile, index) => {
    if (tile === 0) {
      return distance;
    }

    const goalIndex = tile - 1;
    const currentRow = Math.floor(index / BOARD_WIDTH);
    const currentColumn = index % BOARD_WIDTH;
    const goalRow = Math.floor(goalIndex / BOARD_WIDTH);
    const goalColumn = goalIndex % BOARD_WIDTH;
    return distance
      + Math.abs(currentRow - goalRow)
      + Math.abs(currentColumn - goalColumn);
  }, 0);
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(value) {
    this.items.push(value);
    this.#bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return null;
    }

    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.#sinkDown(0);
    }
    return first;
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[parentIndex].priority <= this.items[index].priority) {
        break;
      }
      [this.items[parentIndex], this.items[index]] = [
        this.items[index],
        this.items[parentIndex],
      ];
      index = parentIndex;
    }
  }

  #sinkDown(index) {
    while (true) {
      const left = (index * 2) + 1;
      const right = left + 1;
      let smallest = index;

      if (
        left < this.items.length
        && this.items[left].priority < this.items[smallest].priority
      ) {
        smallest = left;
      }
      if (
        right < this.items.length
        && this.items[right].priority < this.items[smallest].priority
      ) {
        smallest = right;
      }
      if (smallest === index) {
        return;
      }

      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index],
      ];
      index = smallest;
    }
  }
}

function rebuildPath(parentByKey, finalKey) {
  const moves = [];
  let cursor = finalKey;

  while (parentByKey.has(cursor)) {
    const entry = parentByKey.get(cursor);
    moves.push(entry.tile);
    cursor = entry.parentKey;
  }

  return moves.reverse();
}

export function solvePuzzle(initialState) {
  if (!isSolvable(initialState)) {
    return null;
  }
  if (isSolved(initialState)) {
    return [];
  }

  const start = initialState.slice();
  const startKey = stateKey(start);
  const frontier = new MinHeap();
  const bestCostByKey = new Map([[startKey, 0]]);
  const parentByKey = new Map();
  let insertionOrder = 0;

  frontier.push({
    state: start,
    cost: 0,
    priority: manhattanDistance(start),
    order: insertionOrder,
  });

  while (frontier.size > 0) {
    const current = frontier.pop();
    const currentKey = stateKey(current.state);

    if (current.cost !== bestCostByKey.get(currentKey)) {
      continue;
    }
    if (isSolved(current.state)) {
      return rebuildPath(parentByKey, currentKey);
    }

    for (const tile of getMovableTiles(current.state)) {
      const nextState = moveTile(current.state, tile);
      const nextKey = stateKey(nextState);
      const nextCost = current.cost + 1;
      const knownCost = bestCostByKey.get(nextKey);

      if (knownCost !== undefined && knownCost <= nextCost) {
        continue;
      }

      bestCostByKey.set(nextKey, nextCost);
      parentByKey.set(nextKey, { parentKey: currentKey, tile });
      insertionOrder += 1;
      frontier.push({
        state: nextState,
        cost: nextCost,
        priority: nextCost + manhattanDistance(nextState) + (insertionOrder / 1_000_000),
        order: insertionOrder,
      });
    }
  }

  return null;
}

function randomInteger(min, max, random) {
  return Math.floor(random() * ((max - min) + 1)) + min;
}

function randomWalk(steps, random) {
  let state = GOAL_STATE.slice();
  let previousBlank = -1;

  for (let step = 0; step < steps; step += 1) {
    const blankIndex = state.indexOf(0);
    let candidates = NEIGHBORS[blankIndex].filter((index) => index !== previousBlank);
    if (candidates.length === 0) {
      candidates = NEIGHBORS[blankIndex].slice();
    }
    const selectedIndex = candidates[randomInteger(0, candidates.length - 1, random)];
    const tile = state[selectedIndex];
    previousBlank = blankIndex;
    state = moveTile(state, tile);
  }

  return state;
}

function shuffledSolvableState(random) {
  const values = GOAL_STATE.slice();

  for (let index = values.length - 1; index > 0; index -= 1) {
    const other = randomInteger(0, index, random);
    [values[index], values[other]] = [values[other], values[index]];
  }

  return isSolvable(values) ? values : null;
}

export function generateShuffle(difficulty = "medium", random = Math.random) {
  const range = DIFFICULTY_RANGES[difficulty] ?? DIFFICULTY_RANGES.medium;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    let state;
    if (difficulty === "easy") {
      state = randomWalk(randomInteger(range.min, range.max + 4, random), random);
    } else if (attempt < 80) {
      const multiplier = difficulty === "hard" ? 4 : 2;
      state = randomWalk(randomInteger(range.min * multiplier, range.max * multiplier, random), random);
    } else {
      state = shuffledSolvableState(random);
      if (!state) {
        continue;
      }
    }

    const solution = solvePuzzle(state);
    if (solution && solution.length >= range.min && solution.length <= range.max) {
      return {
        state,
        solutionLength: solution.length,
      };
    }
  }

  // Extremely unlikely fallback. These positions are verified solvable examples.
  const fallback = {
    easy: [1, 2, 3, 5, 0, 6, 4, 7, 8],
    medium: [1, 3, 6, 5, 0, 2, 4, 7, 8],
    hard: [7, 2, 4, 5, 0, 6, 8, 3, 1],
  }[difficulty] ?? [1, 3, 6, 5, 0, 2, 4, 7, 8];
  const solution = solvePuzzle(fallback);
  return { state: fallback.slice(), solutionLength: solution.length };
}

export function formatElapsedTime(milliseconds) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
