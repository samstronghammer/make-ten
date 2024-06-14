const GRID_WIDTH = 11,
	GRID_HEIGHT = 16,
	TIME_LIMIT = 120; // 2 minutes in seconds.

const scoreDisplay = document.getElementById('score'),
	gameGrid = document.getElementById('game-grid'),
	selectionRect = document.getElementById('selection-rect'),
	timeIndicator = document.getElementById('time-indicator');

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
	document.getElementById('restart-btn').addEventListener('click', resetGame);
	resetGame();
}

function resetGame() {
	scoreDisplay.textContent = (score = 0);
	
	gameGrid.innerHTML = '';
	for (let y = 0; y < GRID_HEIGHT; y++) {
		cells[y] = [];
		for (let x = 0; x < GRID_WIDTH; x++) {
			cells[y][x] = createGridBtn();
			cells[y][x].x = x;
			cells[y][x].y = y;
			cells[y][x].style.gridRow = (y + 1);
			cells[y][x].style.gridColumn = (x + 1);
			gameGrid.appendChild(cells[y][x]);
		}
	}
	
	timeIndicator.value = (remainingTime = TIME_LIMIT);
	clearInterval(timerInterval);
	timerInterval = setInterval( () => {
		timeIndicator.value = (Math.max(0, remainingTime -= 1));
		if (remainingTime === 0) {
			endGame();
		}
	}, 1000);
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
function createGridBtn() {
	const value = Math.floor(Math.random() * 8) + 1,
		btn = document.createElement('button');
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
	selectionRect.style.gridColumn = `${selection.x + 1} / span ${selection.width }`;
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
		newStartY  = Math.min(selection.startY, ev.target.y),
		newEndX = Math.max(selection.startX, ev.target.x),
		newEndY  = Math.max(selection.startY, ev.target.y);
	
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
}

window.addEventListener('DOMContentLoaded', init);
