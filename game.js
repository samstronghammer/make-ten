// IMPORTANT: Do not make width and height both odd!! It'll break the algorithm!
const GRID_WIDTH = 11,
  GRID_HEIGHT = 16,
  TIME_LIMIT = 120, // 2 minutes in seconds.
  CLEAR_BONUS = 500;

const scoreDisplay = document.getElementById('score'),
  gameGrid = document.getElementById('game-grid'),
  selectionRect = document.getElementById('selection-rect'),
  timeIndicator = document.getElementById('time-indicator');

class Point {
  constructor(row, col) {
    this.row = row
    this.col = col
  }

  toString = () => {
    return `${this.row},${this.col}`
  }

  equals = (other) => {
    this.toString() === other.toString()
  }

  static fromString = (s) => {
    const toks = s.split(",")
    return new Point(Number(toks[0]), Number(toks[1]))
  }

  adj4 = () => {
    return [
      new Point(this.row - 1, this.col),
      new Point(this.row, this.col - 1),
      new Point(this.row, this.col + 1),
      new Point(this.row + 1, this.col),
    ]
  }

  adj4s = () => {
    return this.adj4().map(p => p.toString())
  }
}



/** {Array<Array<HTMLButtonElement>>} */
let cells = [],
  /** {Boolean} */
  pointerDragging = false,
  /** {Number} */
  score = 0,
  /** {Number} seconds */
  remainingTime = 0,
  timerInterval,
  /** {Object<String,Number> */
  selection;

function init() {
  window.addEventListener('pointerup', handlePointerUp);
  document.getElementById('restart-btn-timed').addEventListener('click', resetGameTimed);
  document.getElementById('restart-btn-infinite').addEventListener('click', resetGameInfinite);
  resetGameInfinite();
}

function resetGameTimed() {
  resetGame(false)
}

function resetGameInfinite() {
  resetGame(true)
}

function resetGame(infinite) {
  const easyGrid = makeEasyGrid()

  scoreDisplay.textContent = (score = 0);

  gameGrid.innerHTML = '';

  for (let y = 0; y < GRID_HEIGHT; y++) {
    cells[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const value = easyGrid.get(new Point(y, x).toString())
      cells[y][x] = createGridBtn(value);
      cells[y][x].x = x;
      cells[y][x].y = y;
      cells[y][x].style.gridRow = (y + 1);
      cells[y][x].style.gridColumn = (x + 1);
      gameGrid.appendChild(cells[y][x]);
    }
  }

  clearInterval(timerInterval)
  timeIndicator.value = (remainingTime = TIME_LIMIT);
  if (infinite) {
    timeIndicator.style.visibility = "hidden"
  } else {
    timeIndicator.style.visibility = "visible"
    timerInterval = setInterval(() => {
      timeIndicator.value = (Math.max(0, remainingTime -= 1));
      if (remainingTime === 0) {
        endGame();
      }
    }, 1000);
  }
}

function printGrid(grid) {
  scoreDisplay.textContent = (score = 0);

  gameGrid.innerHTML = '';

  for (let y = 0; y < GRID_HEIGHT; y++) {
    cells[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const value = grid.get(new Point(y, x).toString()) ?? 0
      cells[y][x] = createGridBtn(value);
      cells[y][x].x = x;
      cells[y][x].y = y;
      cells[y][x].style.gridRow = (y + 1);
      cells[y][x].style.gridColumn = (x + 1);
      gameGrid.appendChild(cells[y][x]);
    }
  }
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}


// Checks if current set of empty points is possible to fill (all groups have even size) 
function bubbleSizesOk(emptyPointsSet) {
  const emptyPointsArray = [...emptyPointsSet]
  while (emptyPointsSet.size > 0) {
    const start = Point.fromString(emptyPointsArray.pop())
    if (!emptyPointsSet.has(start.toString())) continue;
    let frontier = new Set([start.toString()]);
    const done = new Set();
    while (frontier.size > 0) {
      const newFrontier = new Set();
      for (const frontierPointString of frontier) {
        const frontierPoint = Point.fromString(frontierPointString)
        for (const adj of frontierPoint.adj4()) {
          const adjString = adj.toString()
          // if (!done.has(adjString) && !grid.has(adjString) && inBounds(adj)) {
          if (!done.has(adjString) && emptyPointsSet.has(adjString)) {
            newFrontier.add(adjString)
          }
        }
        done.add(frontierPointString)
      }
      frontier = newFrontier
    }
    if (done.size % 2 !== 0) return false;
    done.forEach(s => emptyPointsSet.delete(s))
  }
  return true;
}

// Checks if move is completely empty, which is necessary to be valid
function moveOk(startPoint, endPoint, emptyPointsSet) {
  const minRow = Math.min(startPoint.row, endPoint.row)
  const maxRow = Math.max(startPoint.row, endPoint.row)
  const minCol = Math.min(startPoint.col, endPoint.col)
  const maxCol = Math.max(startPoint.col, endPoint.col)
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const p = new Point(row, col)
      if (!emptyPointsSet.has(p.toString())) return false;
    }
  }
  return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcScore(p1, p2) {
  return (Math.abs(p1.row - p2.row) + 1) * (Math.abs(p1.col - p2.col) + 1)
}

function makeEasyGrid() {
  const emptyPoints = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      emptyPoints.push(new Point(y, x))
    }
  }
  shuffle(emptyPoints)
  const grid = new Map()
  while (emptyPoints.length > 0) {
    const allEmptyPoints = new Set(emptyPoints.map(p => p.toString()));
    const startPoint = emptyPoints.shift()
    const startValue = Math.floor(Math.random() * 9) + 1
    grid.set(startPoint.toString(), startValue)
    const endValue = 10 - startValue;
    const options = [];
    for (const endPoint of emptyPoints) {
      if (!moveOk(startPoint, endPoint, allEmptyPoints)) continue;
      grid.set(endPoint.toString(), endValue)
      const emptyPointsCopy = new Set(emptyPoints.map(p => p.toString()))
      emptyPointsCopy.delete(endPoint.toString())
      const ok = bubbleSizesOk(emptyPointsCopy)
      if (ok) {
        options.push(endPoint);
      }
      grid.delete(endPoint.toString())
    }
    if (options.length === 0) {
      emptyPoints.push(startPoint)
      grid.delete(startPoint.toString())
    } else {
      const bestOption = { point: options[0], score: 0 }
      for (const option of options) {
        score = calcScore(startPoint, option)
        if (score >= 9) {
          bestOption.point = option;
          bestOption.score = score
          break;
        } else if (score > bestOption.score) {
          bestOption.point = option
          bestOption.score = score
        }
      }
      const index = emptyPoints.indexOf(bestOption.point)
      emptyPoints.splice(index, 1)
      grid.set(bestOption.point.toString(), endValue)
    }
  }
  return grid;
}


function endGame() {
  clearInterval(timerInterval);
  if (selection) {
    selection = undefined;
    gameGrid.removeChild(selectionRect);
  }
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      cells[y][x].disabled = true;
    }
  }
}

/**
 * 
 * @returns {HTMLButtonElement}
 */
function createGridBtn(value) {
  const btn = document.createElement('button');
  btn.textContent = value;
  btn.numValue = value;
  btn.className = `num${value}`;
  btn.addEventListener('pointerdown', handleCellPointerDown);
  btn.addEventListener('pointerenter', handleCellPointerMove);
  return btn;
}

/**
 * 
 */
function updateSelectionRect() {
  selectionRect.style.gridColumn = `${selection.x + 1} / span ${selection.width}`;
  selectionRect.style.gridRow = `${selection.y + 1} / span ${selection.height}`;
}

/**
 * 
 * @returns {Number}
 */
function getSelectionSum() {
  let sum = 0;
  for (let y = selection.y; y < selection.y + selection.height; y++) {
    for (let x = selection.x; x < selection.x + selection.width; x++) {
      sum += cells[y][x].numValue;
    }
  }
  return sum;
}

/**
 * 
 */
function clearSelectionCells() {
  let sum = 0;
  for (let y = selection.y; y < selection.y + selection.height; y++) {
    for (let x = selection.x; x < selection.x + selection.width; x++) {
      cells[y][x].numValue = 0;
      cells[y][x].className = 'num0';
    }
  }
}

function handleCellPointerDown(ev) {
  if (remainingTime === 0) { return; }

  ev.preventDefault();
  ev.target.releasePointerCapture(ev.pointerId); // Cancel implicit button pointer capture.

  selection = {
    startX: ev.target.x,
    startY: ev.target.y,
    x: ev.target.x,
    y: ev.target.y,
    width: 1,
    height: 1
  };
  updateSelectionRect();
  gameGrid.appendChild(selectionRect);
}

function handleCellPointerMove(ev) {
  if (!selection) { return; }

  ev.preventDefault();

  const newStartX = Math.min(selection.startX, ev.target.x),
    newStartY = Math.min(selection.startY, ev.target.y),
    newEndX = Math.max(selection.startX, ev.target.x),
    newEndY = Math.max(selection.startY, ev.target.y);

  selection.x = newStartX;
  selection.y = newStartY;
  selection.width = newEndX - newStartX + 1;
  selection.height = newEndY - newStartY + 1;
  updateSelectionRect();
}

function handlePointerUp(ev) {
  if (!selection) { return; }

  const sum = getSelectionSum();

  if (sum === 10) {
    const scoreIncrease = selection.width * selection.height; // Total number of cells.
    scoreDisplay.textContent = (score += scoreIncrease);
    clearSelectionCells();
  }

  // Clear the selection.
  selection = undefined;
  gameGrid.removeChild(selectionRect);
  const grid = calcButtonGrid();
  if (!hasMove(grid)) {
    if (isEmpty(grid)) {
      scoreDisplay.textContent = (score += CLEAR_BONUS);
    }
    endGame()
  }
}


const calcButtonGrid = () => {
  const buttons = document.querySelectorAll("#game-grid button:not(.num0)")
  const buttonGrid = new Map()
  buttons.forEach((buttonElement) => {
    const row = buttonElement.style["grid-row-start"]
    const col = buttonElement.style["grid-column-start"]
    const point = new Point(row - 1, col - 1)
    buttonGrid.set(point.toString(), Number(buttonElement.textContent))
  })
  return buttonGrid
}

const addsToTen = (grid, move) => {
  const [startp, endp] = move;
  let sum = 0;
  for (let row = startp.row; row <= endp.row; row++) {
    for (let col = startp.col; col <= endp.col; col++) {
      if (sum > 10) return false;
      const p = new Point(row, col)
      if (grid.has(p.toString())) {
        sum += grid.get(p.toString())
      }
    }
  }
  if (sum !== 10) return false
  return true
}

const hasMove = (grid) => {
  for (let rowStart = 0; rowStart < GRID_HEIGHT; rowStart++) {
    for (let rowEnd = rowStart; rowEnd < GRID_HEIGHT; rowEnd++) {
      for (let colStart = 0; colStart < GRID_WIDTH; colStart++) {
        for (let colEnd = colStart; colEnd < GRID_WIDTH; colEnd++) {
          const move = [new Point(rowStart, colStart), new Point(rowEnd, colEnd)]
          const success = addsToTen(grid, move)
          if (success) return true;
        }
      }
    }
  }
  return false;
}

const isEmpty = (grid) => {
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = row; col < GRID_WIDTH; col++) {
      const p = new Point(row, col)
      if (grid.has(p.toString())) return false;
    }
  }
  return true;
}

window.addEventListener('DOMContentLoaded', init);
