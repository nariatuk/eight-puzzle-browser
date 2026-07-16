import {
  DIFFICULTY_RANGES,
  GOAL_STATE,
  canMoveTile,
  formatElapsedTime,
  generateShuffle,
  getMovableTiles,
  isSolved,
  moveTile,
  solvePuzzle,
} from "./puzzle.js";

const SPEEDS = Object.freeze({
  slow: 900,
  normal: 450,
  fast: 150,
});

const configuredLabels = document.body.dataset.tileLabels?.split(",") ?? [];
const TILE_LABELS = configuredLabels.length === 8
  ? configuredLabels
  : ["1", "2", "3", "4", "5", "6", "7", "8"];

function getTileLabel(tile) {
  return TILE_LABELS[tile - 1] ?? String(tile);
}

const boardElement = document.querySelector("#puzzle-board");
const emptySlotElement = document.querySelector(".empty-slot");
const statusElement = document.querySelector("#game-status");
const moveCountElement = document.querySelector("#move-count");
const elapsedTimeElement = document.querySelector("#elapsed-time");
const shortestCountElement = document.querySelector("#shortest-count");
const autoProgressElement = document.querySelector("#auto-progress");
const shuffleButton = document.querySelector("#shuffle-button");
const solveButton = document.querySelector("#solve-button");
const pauseButton = document.querySelector("#pause-button");
const stopButton = document.querySelector("#stop-button");
const speedSelect = document.querySelector("#speed-select");
const difficultyButtons = Array.from(document.querySelectorAll("[data-difficulty]"));
const completionDialog = document.querySelector("#completion-dialog");
const completionTitle = document.querySelector("#completion-title");
const completionText = document.querySelector("#completion-text");
const replayButton = document.querySelector("#replay-button");
const closeDialogButton = document.querySelector("#close-dialog-button");

let board = GOAL_STATE.slice();
let selectedDifficulty = "medium";
let manualMoves = 0;
let shortestMoves = 0;
let timerStartedAt = null;
let storedElapsed = 0;
let timerFrame = null;
let autoMoves = [];
let autoMoveIndex = 0;
let autoTimer = null;
let isAutoPlaying = false;
let isAutoPaused = false;

const tileElements = new Map();

function createTiles() {
  for (let tile = 1; tile <= 8; tile += 1) {
    const label = getTileLabel(tile);
    const button = document.createElement("button");
    button.className = "puzzle-tile";
    button.type = "button";
    button.textContent = label;
    button.dataset.tile = String(tile);
    button.setAttribute("aria-label", `${label}のプレート`);
    button.addEventListener("click", () => handleTileSelection(tile));
    boardElement.append(button);
    tileElements.set(tile, button);
  }
}

function setStatus(message, tone = "neutral") {
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}

function getElapsedMilliseconds() {
  if (timerStartedAt === null) {
    return storedElapsed;
  }
  return storedElapsed + (performance.now() - timerStartedAt);
}

function updateTimerDisplay() {
  elapsedTimeElement.textContent = formatElapsedTime(getElapsedMilliseconds());
  if (timerStartedAt !== null) {
    timerFrame = requestAnimationFrame(updateTimerDisplay);
  }
}

function startTimer() {
  if (timerStartedAt !== null) {
    return;
  }
  timerStartedAt = performance.now();
  cancelAnimationFrame(timerFrame);
  updateTimerDisplay();
}

function stopTimer() {
  if (timerStartedAt !== null) {
    storedElapsed += performance.now() - timerStartedAt;
    timerStartedAt = null;
  }
  cancelAnimationFrame(timerFrame);
  updateTimerDisplay();
}

function resetTimer() {
  cancelAnimationFrame(timerFrame);
  timerStartedAt = null;
  storedElapsed = 0;
  elapsedTimeElement.textContent = "00:00";
}

function renderBoard() {
  const movableTiles = new Set(getMovableTiles(board));
  const blankIndex = board.indexOf(0);

  emptySlotElement.style.setProperty("--column", String(blankIndex % 3));
  emptySlotElement.style.setProperty("--row", String(Math.floor(blankIndex / 3)));

  for (const [tile, element] of tileElements) {
    const index = board.indexOf(tile);
    element.style.setProperty("--column", String(index % 3));
    element.style.setProperty("--row", String(Math.floor(index / 3)));
    const isMovable = movableTiles.has(tile) && !isAutoPlaying;
    element.classList.toggle("is-movable", isMovable);
    element.disabled = isAutoPlaying || !movableTiles.has(tile);
    element.setAttribute("aria-disabled", String(element.disabled));
  }

  moveCountElement.textContent = String(manualMoves);
  shortestCountElement.textContent = shortestMoves > 0 ? String(shortestMoves) : "—";
  autoProgressElement.textContent = isAutoPlaying || autoMoveIndex > 0
    ? `${autoMoveIndex} / ${autoMoves.length}`
    : "—";

  solveButton.disabled = isAutoPlaying || isSolved(board);
  pauseButton.disabled = !isAutoPlaying;
  stopButton.disabled = !isAutoPlaying;
  shuffleButton.disabled = isAutoPlaying;
  difficultyButtons.forEach((button) => {
    button.disabled = isAutoPlaying;
  });
  pauseButton.textContent = isAutoPaused ? "再開" : "一時停止";
  boardElement.setAttribute("aria-busy", String(isAutoPlaying));
}

function showCompletion(source) {
  stopTimer();
  if (source === "manual") {
    completionTitle.textContent = "完成しました！";
    completionText.textContent = `${manualMoves}手・${formatElapsedTime(storedElapsed)}でそろいました。`;
    setStatus("おめでとうございます。きれいにそろいました！", "success");
  } else {
    completionTitle.textContent = "自動整列が完了しました";
    completionText.textContent = `最短${shortestMoves}手で完成しました。`;
    setStatus(`最短${shortestMoves}手で自動整列しました。`, "success");
  }

  if (typeof completionDialog.showModal === "function") {
    completionDialog.showModal();
  } else {
    completionDialog.setAttribute("open", "");
  }
}

function handleTileSelection(tile) {
  if (isAutoPlaying || !canMoveTile(board, tile)) {
    return;
  }

  if (timerStartedAt === null) {
    startTimer();
  }
  board = moveTile(board, tile);
  manualMoves += 1;
  setStatus(`「${getTileLabel(tile)}」を動かしました。`);
  renderBoard();

  if (isSolved(board)) {
    showCompletion("manual");
  }
}

function clearAutoTimer() {
  if (autoTimer !== null) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function finishAutoPlay() {
  clearAutoTimer();
  isAutoPlaying = false;
  isAutoPaused = false;
  renderBoard();
  showCompletion("auto");
}

function scheduleNextAutoMove() {
  clearAutoTimer();
  if (!isAutoPlaying || isAutoPaused) {
    return;
  }
  if (autoMoveIndex >= autoMoves.length) {
    finishAutoPlay();
    return;
  }

  const delay = SPEEDS[speedSelect.value] ?? SPEEDS.normal;
  autoTimer = setTimeout(() => {
    const tile = autoMoves[autoMoveIndex];
    board = moveTile(board, tile);
    autoMoveIndex += 1;
    setStatus(`自動整列中：${autoMoveIndex} / ${autoMoves.length}手`);
    renderBoard();
    scheduleNextAutoMove();
  }, delay);
}

function startAutoSolve() {
  if (isAutoPlaying || isSolved(board)) {
    return;
  }

  stopTimer();
  setStatus("最短経路を計算しています…");
  solveButton.disabled = true;

  requestAnimationFrame(() => {
    const solution = solvePuzzle(board);
    if (!solution) {
      setStatus("この配置は自動整列できませんでした。", "error");
      renderBoard();
      return;
    }

    autoMoves = solution;
    autoMoveIndex = 0;
    shortestMoves = solution.length;
    isAutoPlaying = true;
    isAutoPaused = false;
    setStatus(`最短${shortestMoves}手で自動整列を開始します。`);
    renderBoard();
    scheduleNextAutoMove();
  });
}

function togglePause() {
  if (!isAutoPlaying) {
    return;
  }

  isAutoPaused = !isAutoPaused;
  if (isAutoPaused) {
    clearAutoTimer();
    setStatus(`一時停止中：${autoMoveIndex} / ${autoMoves.length}手`);
  } else {
    setStatus(`自動整列を再開しました：${autoMoveIndex} / ${autoMoves.length}手`);
    scheduleNextAutoMove();
  }
  renderBoard();
}

function stopAutoSolve() {
  if (!isAutoPlaying) {
    return;
  }

  clearAutoTimer();
  isAutoPlaying = false;
  isAutoPaused = false;
  setStatus("自動整列を中止しました。手動で続けられます。");
  renderBoard();
  if (!isSolved(board)) {
    startTimer();
  }
}

function shuffleGame() {
  clearAutoTimer();
  const result = generateShuffle(selectedDifficulty);
  board = result.state;
  manualMoves = 0;
  shortestMoves = result.solutionLength;
  autoMoves = [];
  autoMoveIndex = 0;
  isAutoPlaying = false;
  isAutoPaused = false;
  resetTimer();
  startTimer();
  const label = DIFFICULTY_RANGES[selectedDifficulty].label;
  setStatus(`${label}でシャッフルしました。動かせるプレートを選んでください。`);
  renderBoard();
}

function selectDifficulty(difficulty) {
  selectedDifficulty = difficulty;
  difficultyButtons.forEach((button) => {
    const isSelected = button.dataset.difficulty === difficulty;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  setStatus(`${DIFFICULTY_RANGES[difficulty].label}を選びました。`);
}

function closeCompletionDialog() {
  if (typeof completionDialog.close === "function") {
    completionDialog.close();
  } else {
    completionDialog.removeAttribute("open");
  }
}

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});
shuffleButton.addEventListener("click", shuffleGame);
solveButton.addEventListener("click", startAutoSolve);
pauseButton.addEventListener("click", togglePause);
stopButton.addEventListener("click", stopAutoSolve);
speedSelect.addEventListener("change", () => {
  if (isAutoPlaying && !isAutoPaused) {
    setStatus(`速度を「${speedSelect.selectedOptions[0].textContent}」に変更しました。`);
    scheduleNextAutoMove();
  }
});
replayButton.addEventListener("click", () => {
  closeCompletionDialog();
  shuffleGame();
});
closeDialogButton.addEventListener("click", closeCompletionDialog);

createTiles();
selectDifficulty(selectedDifficulty);
renderBoard();
setStatus("難易度を選び、「シャッフル」を押して始めましょう。");
