console.log("🌈 Starting main.js");

const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const previewCanvas = document.getElementById("preview");
const previewCtx = previewCanvas.getContext("2d");
previewCtx.scale(20, 20);

context.scale(20, 20);

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] !== 0 &&
        (
          !arena[y + o.y] ||
          arena[y + o.y][x + o.x] !== 0
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function createPiece(type) {
  if (type === 'T') return [[0, 'T', 0], ['T', 'T', 'T'], [0, 0, 0]];
  if (type === 'O') return [['O', 'O'], ['O', 'O']];
  if (type === 'L') return [[0, 0, 'L'], ['L', 'L', 'L'], [0, 0, 0]];
  if (type === 'J') return [['J', 0, 0], ['J', 'J', 'J'], [0, 0, 0]];
  if (type === 'I') return [[0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0], [0, 'I', 0, 0]];
  if (type === 'S') return [[0, 'S', 'S'], ['S', 'S', 0], [0, 0, 0]];
  if (type === 'Z') return [['Z', 'Z', 0], [0, 'Z', 'Z'], [0, 0, 0]];
}

function arenaSweep() {
  let rowCount = 1;
  for (let y = arena.length - 1; y >= 0; --y) {
    if (arena[y].every(cell => cell !== 0)) {
      arena.splice(y, 1);
      arena.unshift(new Array(arena[0].length).fill(0));
      ++y;
      player.score += rowCount * 10;
      rowCount *= 2;
    }
  }
}

const colors = {
  'T': '#FF0D72',
  'O': '#FFD500',
  'L': '#FF8C00',
  'J': '#0000F0',
  'I': '#0DC2FF',
  'S': '#0DFF72',
  'Z': '#F53838'
};

const arena = createMatrix(10, 20);
const player = {
  pos: { x: 0, y: 0 },
  matrix: createPiece('T'),
  score: 0
};
let nextPiece = createPiece('T');
player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);

function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value] || 'white';
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
  drawPreview();
}

function drawPreview() {
  previewCtx.fillStyle = "#000";
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  drawMatrix(nextPiece, { x: 1, y: 1 }, previewCtx);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;

function updateScore() {
  document.getElementById("score").innerText = `Score: ${player.score}`;
}

function update(time = 0) {
  if (gameOver) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      arenaSweep();
      player.matrix = nextPiece;
      const pieces = 'TJLOSZI';
      nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
      player.pos.y = 0;
      player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
      if (collide(arena, player)) {
        document.getElementById("gameOver").style.display = "block";
        gameOver = true;
      }
    }
    dropCounter = 0;
  }
  draw();
  updateScore();
  requestAnimationFrame(update);
}

function rotate(matrix, dir = 1) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function rotatePiece(player) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -1);
      player.pos.x = pos;
      return;
    }
  }
}

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    player.pos.x--;
    if (collide(arena, player)) {
      player.pos.x++;
    }
  } else if (event.key === 'ArrowRight') {
    player.pos.x++;
    if (collide(arena, player)) {
      player.pos.x--;
    }
  } else if (event.key === 'ArrowDown') {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
    }
  } else if (event.key === 'ArrowUp') {
    rotatePiece(player);
  } else if (event.key === 'Enter' && gameOver) {
    arena.forEach(row => row.fill(0));
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    nextPiece = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
    player.score = 0;
    gameOver = false;
    document.getElementById("gameOver").style.display = "none";
    updateScore();
    update();
  }
  draw();
});

update();
