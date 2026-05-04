// ═══════════════════════════════════════════════════
//  SUPER MARIO WORLD JS  –  Full Game Engine
// ═══════════════════════════════════════════════════

const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');

// ── Screens & HUD refs ──
const screenStart    = document.getElementById('screen-start');
const screenGameover = document.getElementById('screen-gameover');
const screenWin      = document.getElementById('screen-win');
const hudLives  = document.getElementById('lives');
const hudScore  = document.getElementById('score');
const hudCoins  = document.getElementById('coins');
const hudLevel  = document.getElementById('level-num');
const hudTimer  = document.getElementById('timer');
const finalScore= document.getElementById('final-score');
const winScore  = document.getElementById('win-score');

// ── Canvas size ──
const CANVAS_W = 800;
const CANVAS_H = 450;
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

// ── Physics constants ──
const GRAVITY       = 0.55;
const JUMP_FORCE    = -13;
const MOVE_SPEED    = 3.2;
const RUN_SPEED     = 5.5;
const MAX_FALL      = 16;
const TILE          = 32;

// ── Palette ──
const PAL = {
  sky1: '#5c94fc', sky2: '#3060c0',
  ground: '#c84c0c', groundTop: '#52a800',
  brick: '#b45020', brickLight: '#e87038',
  qblock: '#f8b800', qblockLight: '#fce860',
  pipe: '#00a800', pipeLight: '#00e000',
  coin: '#f8b800',
  mario: '#e40058', marioHat: '#e40058',
  goomba: '#b45020',
  koopa: '#00a800',
  mushroom: '#e40058',
  fireFlower: '#ff6000',
  star: '#f8f800',
  cloud: '#fcfcfc',
  mountain: '#00a800',
  flag: '#f8f800',
  lava: '#e82000',
  castle: '#888',
  info: '#fff',
};

// ═══════════════════════════════════════════════════
//  TILE TYPES
// ═══════════════════════════════════════════════════
const T = {
  AIR:    0,
  GROUND: 1,
  BRICK:  2,
  QBLOCK: 3,  // question block with coin
  QBLOCK_MUSHROOM: 4,
  QBLOCK_STAR: 5,
  QBLOCK_FLOWER: 6,
  PIPE_TOP_L: 7,
  PIPE_TOP_R: 8,
  PIPE_L:     9,
  PIPE_R:     10,
  QUSED:  11, // used question block
  LAVA:   12,
  CASTLE: 13,
  COIN_TILE: 14,
  SOLID_INVIS: 15, // invisible solid (for castle floor)
};

// ═══════════════════════════════════════════════════
//  LEVEL DEFINITIONS
//  Each level: { name, bg, tiles[][], enemies[], width }
//  Tiles are stored row-major [row][col]
//  ROWS = 14, COLS = level.width
// ═══════════════════════════════════════════════════

const ROWS = 14;

function makeEmpty(w) {
  return Array.from({length: ROWS}, () => new Array(w).fill(0));
}

/* ── helper: place pipe starting at col c, floor row f ── */
function placePipe(tiles, c, floorRow, height=3) {
  for (let r = floorRow - height; r < floorRow; r++) {
    if (r < 0) continue;
    if (r === floorRow - height) {
      tiles[r][c]   = T.PIPE_TOP_L;
      tiles[r][c+1] = T.PIPE_TOP_R;
    } else {
      tiles[r][c]   = T.PIPE_L;
      tiles[r][c+1] = T.PIPE_R;
    }
  }
}

/* ── helper: ground row from col a to b (inclusive) ── */
function groundRow(tiles, row, a, b) {
  for (let c = a; c <= b; c++) tiles[row][c] = T.GROUND;
}

// ─────────────────────────────────────────────────
//  LEVEL 1 – Grassland
// ─────────────────────────────────────────────────
function buildLevel1() {
  const W = 120;
  const t = makeEmpty(W);
  const floor = 12;

  // Main floor
  for (let c = 0; c < W; c++) {
    if (c >= 20 && c <= 22) continue; // gap
    if (c >= 55 && c <= 57) continue; // gap
    t[floor][c] = T.GROUND;
    t[floor+1][c] = T.GROUND;
  }

  // Platforms
  for (let c = 5; c <= 8; c++) t[9][c] = T.BRICK;
  for (let c = 14; c <= 17; c++) t[8][c] = T.BRICK;

  // Q-blocks
  t[8][6]  = T.QBLOCK;
  t[8][7]  = T.QBLOCK_MUSHROOM;
  t[8][16] = T.QBLOCK;
  t[7][11] = T.QBLOCK_STAR;

  // Coin tiles
  for (let c = 25; c <= 30; c++) t[9][c] = T.COIN_TILE;

  // Pipes
  placePipe(t, 35, floor, 3);
  placePipe(t, 40, floor, 4);
  placePipe(t, 45, floor, 3);

  // Bricks high platform
  for (let c = 60; c <= 65; c++) t[8][c] = T.BRICK;
  t[8][62] = T.QBLOCK_FLOWER;

  // More ground islands
  groundRow(t, floor, 70, 75);
  groundRow(t, floor, 80, 90);
  for (let c = 85; c <= 87; c++) t[9][c] = T.BRICK;
  t[8][85] = T.QBLOCK;

  // Staircase to flag
  for (let s = 0; s < 6; s++) {
    for (let r = floor - s; r <= floor; r++) t[r][W-10+s] = T.GROUND;
  }
  // Flag pole col
  const fp = W - 3;
  for (let r = 3; r <= floor; r++) t[r][fp] = T.SOLID_INVIS;

  const enemies = [
    {type:'goomba', x: 8*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 12*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 27*TILE, y: (floor-1)*TILE},
    {type:'koopa',  x: 33*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 48*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 50*TILE, y: (floor-1)*TILE},
    {type:'koopa',  x: 63*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 72*TILE, y: (floor-1)*TILE},
    {type:'goomba', x: 82*TILE, y: (floor-1)*TILE},
    {type:'koopa',  x: 88*TILE, y: (floor-1)*TILE},
  ];

  return {name:'World 1-1', bg:'sky', tiles:t, width:W, floorRow:floor, flagCol:fp,
          startX:2*TILE, startY:(floor-1)*TILE, enemies, music:'overworld'};
}

// ─────────────────────────────────────────────────
//  LEVEL 2 – Desert / Underground
// ─────────────────────────────────────────────────
function buildLevel2() {
  const W = 130;
  const t = makeEmpty(W);
  const floor = 12;

  // Ceiling (cave feel)
  for (let c = 0; c < W; c++) {
    t[0][c] = T.BRICK;
    t[1][c] = T.BRICK;
  }

  // Floor
  for (let c = 0; c < W; c++) {
    if (c >= 15 && c <= 17) continue;
    if (c >= 40 && c <= 43) continue;
    if (c >= 75 && c <= 78) continue;
    t[floor][c] = T.GROUND;
    t[floor+1][c] = T.GROUND;
  }

  // Platforms
  for (let c = 10; c <= 14; c++) t[9][c] = T.BRICK;
  for (let c = 20; c <= 24; c++) t[9][c] = T.BRICK;
  for (let c = 18; c <= 22; c++) t[7][c] = T.BRICK;
  t[7][20] = T.QBLOCK_MUSHROOM;
  t[7][22] = T.QBLOCK;

  // Coins
  for (let c = 30; c <= 38; c++) t[9][c] = T.COIN_TILE;

  // Lava pits
  for (let c = 15; c <= 17; c++) { t[floor][c]=T.LAVA; t[floor+1][c]=T.LAVA; }
  for (let c = 40; c <= 43; c++) { t[floor][c]=T.LAVA; t[floor+1][c]=T.LAVA; }
  for (let c = 75; c <= 78; c++) { t[floor][c]=T.LAVA; t[floor+1][c]=T.LAVA; }

  // Pipes
  placePipe(t, 50, floor, 4);
  placePipe(t, 60, floor, 3);

  // Q-blocks row
  for (let c = 55; c <= 59; c++) t[5][c] = T.QBLOCK;
  t[5][57] = T.QBLOCK_STAR;

  // Upper path
  for (let c = 85; c <= 100; c++) t[7][c] = T.BRICK;
  t[7][90] = T.QBLOCK_FLOWER;
  t[7][95] = T.QBLOCK;

  // Staircase to flag
  for (let s = 0; s < 6; s++) {
    for (let r = floor - s; r <= floor; r++) t[r][W-10+s] = T.GROUND;
  }
  const fp = W - 3;
  for (let r = 3; r <= floor; r++) t[r][fp] = T.SOLID_INVIS;

  const enemies = [
    {type:'goomba', x: 5*TILE,  y:(floor-1)*TILE},
    {type:'goomba', x: 7*TILE,  y:(floor-1)*TILE},
    {type:'koopa',  x: 22*TILE, y:(floor-1)*TILE},
    {type:'goomba', x: 30*TILE, y:(floor-1)*TILE},
    {type:'koopa',  x: 45*TILE, y:(floor-1)*TILE},
    {type:'goomba', x: 52*TILE, y:(floor-1)*TILE},
    {type:'goomba', x: 54*TILE, y:(floor-1)*TILE},
    {type:'koopa',  x: 65*TILE, y:(floor-1)*TILE},
    {type:'goomba', x: 80*TILE, y:(floor-1)*TILE},
    {type:'koopa',  x: 95*TILE, y: 6*TILE},
    {type:'goomba', x:105*TILE, y:(floor-1)*TILE},
  ];

  return {name:'World 1-2', bg:'cave', tiles:t, width:W, floorRow:floor, flagCol:fp,
          startX:2*TILE, startY:(floor-1)*TILE, enemies, music:'underground'};
}

// ─────────────────────────────────────────────────
//  LEVEL 3 – Sky / Cloud World
// ─────────────────────────────────────────────────
function buildLevel3() {
  const W = 140;
  const t = makeEmpty(W);
  const floor = 12;

  // Floating cloud platforms (bricks)
  const platforms = [
    [10,8,4],[10,14,5],[9,22,6],[10,30,4],[9,36,5],
    [8,43,6],[10,52,4],[9,58,5],[8,65,6],[10,75,4],
    [9,83,5],[8,90,6],[10,100,4],[9,107,5],[8,115,6]
  ];
  for (const [r,c,len] of platforms) {
    for (let i = 0; i < len; i++) t[r][c+i] = T.BRICK;
  }

  // Ground islands
  groundRow(t, floor, 0, 5);
  groundRow(t, floor, 20, 25);
  groundRow(t, floor, 45, 55);
  groundRow(t, floor, 70, 80);
  groundRow(t, floor, 100, 110);
  groundRow(t, floor, 125, W-1);

  // Reinforce ground
  for (const [_r,c,len] of [[0,0,6],[0,20,6],[0,45,11],[0,70,11],[0,100,11],[0,125,W-125]]) {
    for (let i = 0; i < len; i++) t[floor+1][c+i] = T.GROUND;
  }

  // Q blocks
  t[6][12] = T.QBLOCK_MUSHROOM;
  t[6][24] = T.QBLOCK_STAR;
  t[6][38] = T.QBLOCK_FLOWER;
  t[6][60] = T.QBLOCK;
  t[6][67] = T.QBLOCK;
  t[6][85] = T.QBLOCK_MUSHROOM;
  t[6][109]= T.QBLOCK_STAR;

  // Coin rows
  for (let c = 47; c <= 53; c++) t[8][c] = T.COIN_TILE;
  for (let c = 72; c <= 78; c++) t[8][c] = T.COIN_TILE;

  // Pipes on ground islands
  placePipe(t, 22, floor, 3);
  placePipe(t, 51, floor, 4);
  placePipe(t, 75, floor, 3);

  // Staircase to flag
  for (let s = 0; s < 6; s++) {
    for (let r = floor - s; r <= floor; r++) t[r][W-10+s] = T.GROUND;
  }
  const fp = W - 3;
  for (let r = 3; r <= floor; r++) t[r][fp] = T.SOLID_INVIS;

  const enemies = [
    {type:'goomba', x: 3*TILE, y:(floor-1)*TILE},
    {type:'koopa',  x:21*TILE, y:(floor-1)*TILE},
    {type:'goomba', x:47*TILE, y:(floor-1)*TILE},
    {type:'goomba', x:49*TILE, y:(floor-1)*TILE},
    {type:'koopa',  x:72*TILE, y:(floor-1)*TILE},
    {type:'goomba', x:74*TILE, y:(floor-1)*TILE},
    {type:'goomba', x:102*TILE,y:(floor-1)*TILE},
    {type:'koopa',  x:106*TILE,y:(floor-1)*TILE},
  ];

  return {name:'World 1-3', bg:'sky_high', tiles:t, width:W, floorRow:floor, flagCol:fp,
          startX:2*TILE, startY:(floor-1)*TILE, enemies, music:'overworld'};
}

// ─────────────────────────────────────────────────
//  LEVEL 4 – Castle / Lava
// ─────────────────────────────────────────────────
function buildLevel4() {
  const W = 150;
  const t = makeEmpty(W);
  const floor = 12;

  // Lava floor everywhere
  for (let c = 0; c < W; c++) {
    t[floor][c]   = T.LAVA;
    t[floor+1][c] = T.LAVA;
  }

  // Stone platforms
  const plats = [
    [11,0,8],[11,12,8],[11,24,6],[11,34,6],
    [9,40,6],[9,50,5],[9,60,6],
    [11,70,6],[11,80,6],[9,88,6],
    [11,98,6],[11,108,6],[9,116,6],
    [11,125,W-125]
  ];
  for (const [r,c,len] of plats) {
    for (let i = 0; i < len; i++) t[r][c+i] = T.GROUND;
  }

  // Ceiling bricks
  for (let c = 0; c < W; c++) {
    t[0][c] = T.CASTLE;
    t[1][c] = T.CASTLE;
  }

  // Wall bricks here and there
  for (let r = 2; r <= 10; r++) { t[r][0]=T.CASTLE; }

  // Q blocks
  t[7][15]  = T.QBLOCK_MUSHROOM;
  t[7][36]  = T.QBLOCK_STAR;
  t[7][55]  = T.QBLOCK_FLOWER;
  t[7][84]  = T.QBLOCK_MUSHROOM;
  t[7][103] = T.QBLOCK_STAR;

  // Coin paths on platforms
  for (let c = 40; c <= 44; c++) t[8][c] = T.COIN_TILE;
  for (let c = 88; c <= 92; c++) t[8][c] = T.COIN_TILE;

  // Bricks
  for (let c = 42; c <= 44; c++) t[6][c] = T.BRICK;
  for (let c = 90; c <= 92; c++) t[6][c] = T.BRICK;

  // Castle end
  for (let r = 0; r < ROWS; r++) {
    t[r][W-5] = T.CASTLE;
    t[r][W-4] = T.CASTLE;
  }
  // Flag in castle
  const fp = W - 3;
  for (let r = 2; r <= 11; r++) t[r][fp] = T.SOLID_INVIS;

  const enemies = [
    {type:'goomba', x: 2*TILE,  y:10*TILE},
    {type:'koopa',  x:13*TILE,  y:10*TILE},
    {type:'goomba', x:15*TILE,  y:10*TILE},
    {type:'koopa',  x:25*TILE,  y:10*TILE},
    {type:'goomba', x:35*TILE,  y:10*TILE},
    {type:'koopa',  x:41*TILE,  y: 8*TILE},
    {type:'goomba', x:51*TILE,  y: 8*TILE},
    {type:'koopa',  x:61*TILE,  y: 8*TILE},
    {type:'goomba', x:71*TILE,  y:10*TILE},
    {type:'koopa',  x:81*TILE,  y:10*TILE},
    {type:'goomba', x:89*TILE,  y: 8*TILE},
    {type:'koopa',  x:100*TILE, y:10*TILE},
    {type:'koopa',  x:110*TILE, y:10*TILE},
    {type:'goomba', x:118*TILE, y: 8*TILE},
  ];

  return {name:'World 1-4 🏰', bg:'castle', tiles:t, width:W, floorRow:floor, flagCol:fp,
          startX:2*TILE, startY:10*TILE, enemies, music:'castle'};
}

const LEVELS = [buildLevel1, buildLevel2, buildLevel3, buildLevel4];

// ═══════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════

let state = 'start'; // 'start' | 'playing' | 'gameover' | 'win'
let paused = false;
let currentLevelIndex = 0;
let level = null;
let player = null;
let enemies = [];
let particles = [];
let collectibles = [];
let fireballs = [];
let score = 0;
let coins = 0;
let lives = 3;
let levelTimer = 300;
let timerTick = 0;
let cameraX = 0;
let powerupQueue = [];
let flagTriggered = false;
let flagY = 0;
let levelComplete = false;
let levelCompleteTimer = 0;

// ── Input ──
const keys = {};
const prevKeys = {};

// ═══════════════════════════════════════════════════
//  PLAYER
// ═══════════════════════════════════════════════════
function createPlayer(x, y) {
  return {
    x, y,
    w: 28, h: 32,
    vx: 0, vy: 0,
    onGround: false,
    facingRight: true,
    state: 'small',   // 'small' | 'big' | 'fire'
    invincible: 0,     // frames
    starPower: 0,
    jumpPressed: false,
    dead: false,
    deathTimer: 0,
    walkFrame: 0,
    walkTimer: 0,
  };
}

// ── Resize player for big/small ──
function setPlayerState(p, newState) {
  if (newState === 'big' || newState === 'fire') {
    p.h = 56; p.w = 28;
  } else {
    p.h = 32; p.w = 28;
  }
  p.state = newState;
}

// ═══════════════════════════════════════════════════
//  TILE HELPERS
// ═══════════════════════════════════════════════════
function isSolid(tid) {
  return [T.GROUND, T.BRICK, T.QBLOCK, T.QBLOCK_MUSHROOM,
          T.QBLOCK_STAR, T.QBLOCK_FLOWER, T.QUSED,
          T.PIPE_TOP_L, T.PIPE_TOP_R, T.PIPE_L, T.PIPE_R,
          T.CASTLE, T.SOLID_INVIS].includes(tid);
}

function getTile(tx, ty) {
  if (!level) return T.AIR;
  if (ty < 0 || ty >= ROWS) return T.AIR;
  if (tx < 0 || tx >= level.width) return T.AIR;
  return level.tiles[ty][tx];
}

function setTile(tx, ty, val) {
  if (ty < 0 || ty >= ROWS || tx < 0 || tx >= level.width) return;
  level.tiles[ty][tx] = val;
}

// ═══════════════════════════════════════════════════
//  PHYSICS – axis-separated AABB
// ═══════════════════════════════════════════════════
function resolveEntity(e, checkCeil=false) {
  // X movement
  e.x += e.vx;
  const tileXL = Math.floor(e.x / TILE);
  const tileXR = Math.floor((e.x + e.w - 1) / TILE);
  const tileYT = Math.floor(e.y / TILE);
  const tileYB = Math.floor((e.y + e.h - 1) / TILE);

  if (e.vx > 0) {
    for (let ty = tileYT; ty <= tileYB; ty++) {
      if (isSolid(getTile(tileXR, ty))) {
        e.x = tileXR * TILE - e.w;
        e.vx = 0;
        break;
      }
    }
  } else if (e.vx < 0) {
    for (let ty = tileYT; ty <= tileYB; ty++) {
      if (isSolid(getTile(tileXL, ty))) {
        e.x = (tileXL + 1) * TILE;
        e.vx = 0;
        break;
      }
    }
  }

  // Y movement
  e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
  e.y += e.vy;
  e.onGround = false;

  const tileXL2 = Math.floor(e.x / TILE);
  const tileXR2 = Math.floor((e.x + e.w - 1) / TILE);
  const tileYT2 = Math.floor(e.y / TILE);
  const tileYB2 = Math.floor((e.y + e.h - 1) / TILE);

  if (e.vy > 0) { // falling
    for (let tx = tileXL2; tx <= tileXR2; tx++) {
      if (isSolid(getTile(tx, tileYB2))) {
        e.y = tileYB2 * TILE - e.h;
        e.vy = 0;
        e.onGround = true;
        break;
      }
    }
  } else if (e.vy < 0) { // rising
    for (let tx = tileXL2; tx <= tileXR2; tx++) {
      const tid = getTile(tx, tileYT2);
      if (isSolid(tid)) {
        e.y = (tileYT2 + 1) * TILE;
        e.vy = 0;
        // Hit block from below
        if (checkCeil) onBlockHit(tx, tileYT2, e);
        break;
      }
    }
  }

  // Lava check
  for (let tx = tileXL2; tx <= tileXR2; tx++) {
    if (getTile(tx, tileYB2) === T.LAVA || getTile(tx, tileYT2) === T.LAVA) {
      if (e === player) killPlayer();
    }
  }

  // Fall off world
  if (e.y > CANVAS_H + 200) {
    if (e === player) killPlayer();
    else e.dead = true;
  }
}

// ═══════════════════════════════════════════════════
//  BLOCK HIT
// ═══════════════════════════════════════════════════
function onBlockHit(tx, ty, hitter) {
  const tid = getTile(tx, ty);
  if (tid === T.BRICK) {
    if (player.state !== 'small') {
      setTile(tx, ty, T.AIR);
      spawnBrickParticles(tx * TILE + TILE/2, ty * TILE + TILE/2);
      score += 50;
    } else {
      bumpBlock(tx, ty);
    }
    return;
  }
  if ([T.QBLOCK, T.QBLOCK_MUSHROOM, T.QBLOCK_STAR, T.QBLOCK_FLOWER].includes(tid)) {
    bumpBlock(tx, ty);
    if (tid === T.QBLOCK) {
      spawnCoin(tx * TILE + TILE/2, ty * TILE);
    } else if (tid === T.QBLOCK_MUSHROOM) {
      spawnPowerup(tx * TILE, (ty-1) * TILE, player.state === 'small' ? 'mushroom' : 'fireflower');
    } else if (tid === T.QBLOCK_STAR) {
      spawnPowerup(tx * TILE, (ty-1) * TILE, 'star');
    } else if (tid === T.QBLOCK_FLOWER) {
      spawnPowerup(tx * TILE, (ty-1) * TILE, 'fireflower');
    }
    setTile(tx, ty, T.QUSED);
  }
}

// ── Bump animation (just a particle for now) ──
function bumpBlock(tx, ty) {
  particles.push({
    x: tx*TILE + TILE/2, y: ty*TILE, vx: 0, vy: -3,
    life: 12, maxLife: 12, color: PAL.qblock, r: 6, type:'bump'
  });
}

// ═══════════════════════════════════════════════════
//  SPAWN HELPERS
// ═══════════════════════════════════════════════════
function spawnCoin(x, y) {
  const startY = y + TILE;
  collectibles.push({
    type:'coin', x, y: startY, startY, w:16, h:16,
    vy:-6, dead:false, anim:0
  });
  score += 100;
  coins++;
}

function spawnPowerup(x, y, kind) {
  collectibles.push({
    type: kind,
    x, y, w: 28, h: 28,
    vx: 1.5, vy: 0,
    onGround: false,
    dead: false,
    anim: 0
  });
}

function spawnBrickParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(ang) * (2 + Math.random() * 3),
      vy: Math.sin(ang) * (2 + Math.random() * 3) - 2,
      life: 25, maxLife: 25,
      color: PAL.brick, r: 4+Math.random()*4,
      type: 'debris'
    });
  }
}

function spawnScorePopup(x, y, text) {
  particles.push({
    type:'text', x, y, vy:-1.5, life:45, maxLife:45, text, color:'#ffe066'
  });
}

function spawnEnemyParticles(x, y) {
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(ang) * (1.5 + Math.random() * 2.5),
      vy: Math.sin(ang) * (1.5 + Math.random() * 2.5) - 1,
      life: 20, maxLife: 20,
      color: '#b45020', r: 4+Math.random()*4,
      type: 'debris'
    });
  }
}

// ═══════════════════════════════════════════════════
//  ENEMIES
// ═══════════════════════════════════════════════════
function createEnemy(def) {
  return {
    type: def.type,
    x: def.x, y: def.y,
    w: def.type === 'koopa' ? 28 : 28,
    h: def.type === 'koopa' ? 36 : 28,
    vx: -1.2, vy: 0,
    onGround: false,
    dead: false,
    squished: false,
    squishTimer: 0,
    anim: 0,
    shell: false,  // koopa in shell
    shellVx: 0,
  };
}

function updateEnemy(e) {
  if (e.dead) return;
  if (e.squished) {
    e.squishTimer--;
    if (e.squishTimer <= 0) e.dead = true;
    return;
  }

  e.anim++;

  if (e.shell) {
    e.vx = e.shellVx;
  }

  resolveEntity(e, false);

  // Turn at ledge or wall
  if (e.onGround && !e.shell) {
    const frontX = e.vx > 0 ? e.x + e.w : e.x;
    const belowTy = Math.floor((e.y + e.h + 1) / TILE);
    const frontTx = Math.floor(frontX / TILE);
    if (!isSolid(getTile(frontTx, belowTy))) {
      e.vx *= -1;
    }
  }
  if (e.vx === 0 && !e.shell) e.vx = -1.2;
}

// ═══════════════════════════════════════════════════
//  COLLECTIBLES (powerups, coins)
// ═══════════════════════════════════════════════════
function updateCollectible(c) {
  if (c.dead) return;
  c.anim++;

  if (c.type === 'coin') {
    c.vy += 0.4;
    c.y += c.vy;
    if (c.vy > 0 && c.y > c.startY + TILE * 2) c.dead = true;
    return;
  }

  // Powerups use physics
  resolveEntity(c, false);

  if (c.onGround) {
    if (c.vx === 0) c.vx = 1.5;
    const frontX = c.vx > 0 ? c.x + c.w : c.x;
    const belowTy = Math.floor((c.y + c.h + 1) / TILE);
    const frontTx = Math.floor(frontX / TILE);
    if (!isSolid(getTile(frontTx, belowTy))) c.vx *= -1;
  }

  // Player picks up
  if (rectsOverlap(player, c)) {
    applyPowerup(c.type);
    c.dead = true;
  }
}

function applyPowerup(kind) {
  if (kind === 'mushroom') {
    if (player.state === 'small') {
      setPlayerState(player, 'big');
      player.y -= 24;
    }
    score += 1000;
    spawnScorePopup(player.x, player.y - 20, '1000');
  } else if (kind === 'fireflower') {
    if (player.state === 'small') { setPlayerState(player, 'big'); player.y -= 24; }
    setPlayerState(player, 'fire');
    score += 1000;
    spawnScorePopup(player.x, player.y - 20, '1000');
  } else if (kind === 'star') {
    player.starPower = 480; // ~8 seconds
    score += 1000;
    spawnScorePopup(player.x, player.y - 20, '⭐ 1000');
  }
}

// ═══════════════════════════════════════════════════
//  FIREBALLS
// ═══════════════════════════════════════════════════

function shootFireball() {
  fireballs.push({
    x: player.x + (player.facingRight ? player.w : 0),
    y: player.y + player.h/2 - 8,
    w: 14, h: 14,
    vx: player.facingRight ? 7 : -7,
    vy: -2,
    dead: false,
    anim: 0
  });
}

function updateFireball(fb) {
  if (fb.dead) return;
  fb.anim++;
  fb.vy = Math.min(fb.vy + GRAVITY * 0.6, 8);
  fb.x += fb.vx;
  fb.y += fb.vy;

  // Bounce on floor
  const tileYB = Math.floor((fb.y + fb.h) / TILE);
  const tileX  = Math.floor((fb.x + fb.w/2) / TILE);
  if (isSolid(getTile(tileX, tileYB))) {
    fb.vy = -5;
    fb.y = tileYB * TILE - fb.h;
  }
  // Hit wall
  const tileXF = Math.floor((fb.vx > 0 ? fb.x + fb.w : fb.x) / TILE);
  const tileYM = Math.floor((fb.y + fb.h/2) / TILE);
  if (isSolid(getTile(tileXF, tileYM))) fb.dead = true;

  // Off screen
  if (fb.x < cameraX - 100 || fb.x > cameraX + CANVAS_W + 100) fb.dead = true;
  if (fb.y > CANVAS_H + 50) fb.dead = true;

  // Hit enemy
  for (const e of enemies) {
    if (!e.dead && !e.squished && rectsOverlap(fb, e)) {
      killEnemy(e, 300);
      fb.dead = true;
      break;
    }
  }
}

// ═══════════════════════════════════════════════════
//  KILL HELPERS
// ═══════════════════════════════════════════════════
function killEnemy(e, pts) {
  score += pts || 100;
  spawnScorePopup(e.x + e.w/2, e.y, String(pts || 100));
  spawnEnemyParticles(e.x + e.w/2, e.y + e.h/2);
  e.dead = true;
}

function squishEnemy(e) {
  if (e.type === 'koopa' && !e.shell) {
    e.shell = true;
    e.shellVx = 0;
    e.squished = false;
    e.h = 24;
    e.vx = 0;
    score += 100;
    spawnScorePopup(e.x, e.y, '100');
    return;
  }
  if (e.type === 'koopa' && e.shell) {
    // Kick shell
    e.shellVx = player.facingRight ? 6 : -6;
    return;
  }
  // Goomba
  e.squished = true;
  e.squishTimer = 15;
  e.vy = 0;
  score += 100;
  spawnScorePopup(e.x, e.y, '100');
}

function killPlayer() {
  if (player.invincible > 0 || player.dead) return;
  if (player.starPower > 0) return;
  if (player.state !== 'small') {
    setPlayerState(player, 'small');
    player.invincible = 120;
    return;
  }
  player.dead = true;
  player.deathTimer = 90;
  player.vy = JUMP_FORCE * 0.9;
  player.vx = 0;
}

// ═══════════════════════════════════════════════════
//  PLAYER UPDATE
// ═══════════════════════════════════════════════════
function updatePlayer() {
  if (!player || player.dead) {
    if (player && player.dead) {
      player.deathTimer--;
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.deathTimer <= 0) {
        lives--;
        if (lives <= 0) { triggerGameOver(); }
        else { loadLevel(currentLevelIndex); }
      }
    }
    return;
  }

  if (levelComplete) return;

  const running = keys['KeyX'] || keys['ShiftLeft'] || keys['ShiftRight'] || touchState.run;
  const speed   = running ? RUN_SPEED : MOVE_SPEED;

  // Horizontal
  if (keys['ArrowLeft'] || keys['KeyA'] || touchState.left) {
    player.vx = Math.max(player.vx - 0.8, -speed);
    player.facingRight = false;
  } else if (keys['ArrowRight'] || keys['KeyD'] || touchState.right) {
    player.vx = Math.min(player.vx + 0.8, speed);
    player.facingRight = true;
  } else {
    // Friction
    player.vx *= 0.82;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  // Jump
  const jumpKey = keys['Space'] || keys['KeyZ'] || keys['ArrowUp'] || touchState.jump;
  if (jumpKey && !player.jumpPressed && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    player.jumpPressed = true;
  }
  if (!jumpKey) {
    player.jumpPressed = false;
    // Variable jump height
    if (player.vy < -5) player.vy += 0.5;
  }

  // Fireball shoot
  if ((keys['KeyX'] || touchState.run) && player.state === 'fire') {
    if (!player._shootCool || player._shootCool <= 0) {
      shootFireball();
      player._shootCool = 22;
    }
  }
  if (player._shootCool > 0) player._shootCool--;

  resolveEntity(player, true);

  // Coin tiles
  const tileXC = Math.floor((player.x + player.w/2) / TILE);
  const tileYC = Math.floor((player.y + player.h/2) / TILE);
  if (getTile(tileXC, tileYC) === T.COIN_TILE) {
    setTile(tileXC, tileYC, T.AIR);
    coins++;
    score += 200;
    spawnCoin(tileXC * TILE + TILE/2, tileYC * TILE);
  }

  // Star power
  if (player.starPower > 0) player.starPower--;

  // Invincibility frames
  if (player.invincible > 0) player.invincible--;

  // Walk animation
  if (Math.abs(player.vx) > 0.5) {
    player.walkTimer++;
    if (player.walkTimer > 7) { player.walkFrame = (player.walkFrame+1)%4; player.walkTimer=0; }
  } else { player.walkFrame = 0; }

  // Enemy collisions
  for (const e of enemies) {
    if (e.dead || e.squished) continue;
    if (!rectsOverlap(player, e)) continue;

    if (player.starPower > 0) { killEnemy(e, 200); continue; }

    // Stomping: player falling onto enemy top
    const playerBottom = player.y + player.h;
    const enemyTop     = e.y;
    if (player.vy > 0 && playerBottom - e.h/2 < enemyTop + 8) {
      squishEnemy(e);
      player.vy = JUMP_FORCE * 0.6; // bounce up
      score += 100;
    } else {
      // Side hit
      if (player.invincible > 0) continue;
      killPlayer();
    }
  }

  // Shell hits enemies
  for (const shell of enemies.filter(e => e.shell && Math.abs(e.shellVx) > 0.5)) {
    for (const e2 of enemies) {
      if (e2 === shell || e2.dead) continue;
      if (rectsOverlap(shell, e2)) { killEnemy(e2, 500); }
    }
    // Shell hits player
    if (!player.dead && player.invincible === 0 && rectsOverlap(player, shell)) {
      killPlayer();
    }
  }

  // Flag / level end
  if (!flagTriggered && level.flagCol) {
    const playerTileX = Math.floor((player.x + player.w/2) / TILE);
    if (playerTileX >= level.flagCol - 1) {
      flagTriggered = true;
      score += 500 + levelTimer * 10;
      spawnScorePopup(player.x, player.y - 30, '🏁 +' + (500 + levelTimer*10));
      levelComplete = true;
      levelCompleteTimer = 120;
    }
  }
}

// ═══════════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════════
function updateCamera() {
  const target = player.x - CANVAS_W * 0.38;
  cameraX += (target - cameraX) * 0.15;
  cameraX = Math.max(0, Math.min(cameraX, level.width * TILE - CANVAS_W));
}

// ═══════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════
function updateParticles() {
  for (const p of particles) {
    p.life--;
    if (p.type !== 'text') {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'debris') p.vy += GRAVITY * 0.5;
    } else {
      p.y += p.vy;
    }
  }
  particles = particles.filter(p => p.life > 0);
}

// ═══════════════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════════════
let lastTime = 0;
let frameCount = 0;

function gameLoop(ts) {
  requestAnimationFrame(gameLoop);
  if (state !== 'playing') return;
  if (paused) {
    // Draw pause overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    ctx.fillStyle = '#ffe066';
    ctx.font = '22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GEPAUZEERD', CANVAS_W/2, CANVAS_H/2 - 10);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Druk ⏸ of P om door te gaan', CANVAS_W/2, CANVAS_H/2 + 22);
    ctx.textAlign = 'left';
    return;
  }

  frameCount++;

  // Timer
  timerTick++;
  if (timerTick >= 60) { timerTick = 0; levelTimer = Math.max(0, levelTimer - 1); }
  if (levelTimer === 0 && !player.dead) killPlayer();

  // Level complete countdown
  if (levelComplete) {
    levelCompleteTimer--;
    if (levelCompleteTimer <= 0) {
      currentLevelIndex++;
      if (currentLevelIndex >= LEVELS.length) {
        triggerWin();
      } else {
        loadLevel(currentLevelIndex);
      }
    }
  }

  updatePlayer();
  for (const e of enemies) updateEnemy(e);
  enemies = enemies.filter(e => !e.dead);
  for (const c of collectibles) updateCollectible(c);
  collectibles = collectibles.filter(c => !c.dead);
  for (const fb of fireballs) updateFireball(fb);
  fireballs = fireballs.filter(fb => !fb.dead);
  updateParticles();
  if (!player.dead) updateCamera();

  updateHUD();
  render();
  Object.assign(prevKeys, keys);
}

// ═══════════════════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════════════════

// ── sky gradient per bg type ──
const BG_GRADIENTS = {
  sky:      ['#5c94fc','#3c74dc'],
  cave:     ['#1a1428','#2a1848'],
  sky_high: ['#7eb8f7','#4a90d9'],
  castle:   ['#2a1828','#1a0a18'],
};

function render() {
  if (!level) return;
  const bg = BG_GRADIENTS[level.bg] || BG_GRADIENTS.sky;
  const grad = ctx.createLinearGradient(0,0,0,CANVAS_H);
  grad.addColorStop(0, bg[0]);
  grad.addColorStop(1, bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  // Decorations
  drawBgDecorations();

  // Tiles
  const startCol = Math.floor(cameraX / TILE) - 1;
  const endCol   = startCol + Math.ceil(CANVAS_W / TILE) + 2;

  for (let row = 0; row < ROWS; row++) {
    for (let col = Math.max(0, startCol); col < Math.min(level.width, endCol); col++) {
      const tid = level.tiles[row][col];
      if (tid === T.AIR || tid === T.SOLID_INVIS) continue;
      drawTile(tid, col * TILE - cameraX, row * TILE);
    }
  }

  // Flag
  if (level.flagCol) drawFlag();

  // Collectibles
  for (const c of collectibles) drawCollectible(c);

  // Enemies
  for (const e of enemies) drawEnemy(e);

  // Fireballs
  for (const fb of fireballs) drawFireball(fb);

  // Player
  drawPlayer();

  // Particles
  drawParticles();

  // Level complete banner
  if (levelComplete) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, CANVAS_H/2 - 40, CANVAS_W, 80);
    ctx.fillStyle = '#ffe066';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL CLEAR! 🎉', CANVAS_W/2, CANVAS_H/2 + 8);
    ctx.textAlign = 'left';
  }
}

// ── Background decorations ──
function drawBgDecorations() {
  if (level.bg === 'sky' || level.bg === 'sky_high') {
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const cloudPositions = [
      {x:120, y:60}, {x:350, y:40}, {x:600, y:70}, {x:900, y:50},
      {x:1200,y:65}, {x:1500,y:45}, {x:1800,y:60}, {x:2100,y:50},
      {x:2400,y:70}, {x:2700,y:55}, {x:3000,y:65}
    ];
    for (const c of cloudPositions) {
      drawCloud(c.x - (cameraX * 0.4) % (level.width * TILE + CANVAS_W*2), c.y);
    }
    // Mountains
    ctx.fillStyle = '#5ab552';
    for (let i = 0; i < 12; i++) {
      const mx = i * 320 - (cameraX * 0.6) % (320*12);
      drawMountain(mx, CANVAS_H - 80, 120, 100);
    }
  }
  if (level.bg === 'cave') {
    // Stalactites
    ctx.fillStyle = '#6a4e8a';
    for (let i = 0; i < 20; i++) {
      const sx = i * 180 - (cameraX * 0.5) % (180 * 20);
      drawStalactite(sx, 40, 12, 30);
    }
  }
  if (level.bg === 'castle') {
    // Fire torches effect
    for (let i = 0; i < 8; i++) {
      const tx = i * 400 - cameraX % (400*8) + 100;
      const flicker = Math.sin(frameCount * 0.2 + i) * 3;
      ctx.fillStyle = `rgba(255,${120+flicker*10},0,0.7)`;
      ctx.beginPath();
      ctx.ellipse(tx, 60+flicker, 8, 14+flicker, 0, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI*2);
  ctx.arc(x+22, y-5, 26, 0, Math.PI*2);
  ctx.arc(x+46, y, 18, 0, Math.PI*2);
  ctx.fill();
}
function drawMountain(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x+w/2, y-h); ctx.lineTo(x+w, y);
  ctx.fill();
}
function drawStalactite(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x-w/2, y); ctx.lineTo(x, y+h); ctx.lineTo(x+w/2, y);
  ctx.fill();
}

// ── Tile renderer ──
function drawTile(tid, sx, sy) {
  const s = TILE;
  switch(tid) {
    case T.GROUND: {
      // Dirt body
      ctx.fillStyle = PAL.ground;
      ctx.fillRect(sx, sy+6, s, s-6);
      // Green top
      ctx.fillStyle = PAL.groundTop;
      ctx.fillRect(sx, sy, s, 7);
      // Detail
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx+s-3, sy, 3, s);
      ctx.fillRect(sx, sy+s-3, s, 3);
      break;
    }
    case T.BRICK: {
      ctx.fillStyle = PAL.brick;
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = PAL.brickLight;
      ctx.fillRect(sx+2, sy+2, s/2-3, s/2-3);
      ctx.fillRect(sx+s/2+1, sy+s/2+1, s/2-3, s/2-3);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(sx, sy+s/2-1, s, 2);
      ctx.fillRect(sx+s/2-1, sy, 2, s);
      break;
    }
    case T.QBLOCK:
    case T.QBLOCK_MUSHROOM:
    case T.QBLOCK_STAR:
    case T.QBLOCK_FLOWER: {
      const bob = Math.sin(frameCount * 0.12) * 1.5;
      ctx.fillStyle = PAL.qblock;
      ctx.fillRect(sx, sy+bob, s, s);
      ctx.fillStyle = PAL.qblockLight;
      ctx.fillRect(sx+3, sy+3+bob, s-6, 5);
      ctx.fillRect(sx+3, sy+3+bob, 5, s-6);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', sx + s/2, sy + s*0.72 + bob);
      ctx.textAlign = 'left';
      break;
    }
    case T.QUSED: {
      ctx.fillStyle = '#888';
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = '#666';
      ctx.fillRect(sx+2, sy+2, s-4, 4);
      break;
    }
    case T.PIPE_TOP_L: {
      ctx.fillStyle = '#006000';
      ctx.fillRect(sx-3, sy, s+3, s);
      ctx.fillStyle = PAL.pipe;
      ctx.fillRect(sx-3, sy+2, s+3, s-6);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(sx-1, sy+4, 6, s-10);
      break;
    }
    case T.PIPE_TOP_R: {
      ctx.fillStyle = '#006000';
      ctx.fillRect(sx, sy, s+3, s);
      ctx.fillStyle = PAL.pipe;
      ctx.fillRect(sx, sy+2, s+3, s-6);
      break;
    }
    case T.PIPE_L: {
      ctx.fillStyle = PAL.pipe;
      ctx.fillRect(sx-3, sy, s+3, s);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(sx-1, sy, 6, s);
      ctx.fillStyle = '#004000';
      ctx.fillRect(sx+s-1, sy, 4, s);
      break;
    }
    case T.PIPE_R: {
      ctx.fillStyle = '#004000';
      ctx.fillRect(sx, sy, s+3, s);
      break;
    }
    case T.LAVA: {
      const wave = Math.sin(frameCount * 0.08 + sx * 0.03) * 3;
      const lg = ctx.createLinearGradient(sx, sy+wave, sx, sy+s);
      lg.addColorStop(0, '#ff6000');
      lg.addColorStop(0.5, '#e82000');
      lg.addColorStop(1, '#a01000');
      ctx.fillStyle = lg;
      ctx.fillRect(sx, sy+wave, s, s);
      // Bubbles
      if ((frameCount + sx) % 40 < 3) {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(sx + s/2, sy + s/3 + wave, 4, 0, Math.PI*2);
        ctx.fill();
      }
      break;
    }
    case T.CASTLE: {
      ctx.fillStyle = '#708090';
      ctx.fillRect(sx, sy, s, s);
      ctx.fillStyle = '#8090a0';
      ctx.fillRect(sx+1, sy+1, s-2, 4);
      ctx.fillRect(sx+1, sy+1, 4, s-2);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(sx+s-3, sy, 3, s);
      ctx.fillRect(sx, sy+s-3, s, 3);
      break;
    }
    case T.COIN_TILE: {
      const spin = Math.abs(Math.sin(frameCount * 0.15 + sx * 0.1));
      ctx.fillStyle = PAL.coin;
      ctx.beginPath();
      ctx.ellipse(sx+s/2, sy+s/2, 8*spin+1, 10, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.ellipse(sx+s/2, sy+s/2, 4*spin+1, 7, 0, 0, Math.PI*2);
      ctx.fill();
      break;
    }
  }
}

// ── Flag ──
function drawFlag() {
  const fx = level.flagCol * TILE - cameraX;
  const topY = 3 * TILE;
  const botY = level.floorRow * TILE;
  // Pole
  ctx.fillStyle = '#888';
  ctx.fillRect(fx + TILE/2 - 2, topY, 4, botY - topY);
  // Ball
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(fx + TILE/2, topY - 6, 8, 0, Math.PI*2);
  ctx.fill();
  // Flag
  if (!flagTriggered) {
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.moveTo(fx + TILE/2, topY);
    ctx.lineTo(fx + TILE/2 + 24, topY + 12);
    ctx.lineTo(fx + TILE/2, topY + 24);
    ctx.fill();
  }
}

// ── Player ──
function drawPlayer() {
  if (!player) return;
  const px = player.x - cameraX;
  const py = player.y;
  const w  = player.w;
  const h  = player.h;

  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) return;

  ctx.save();
  if (!player.facingRight) {
    ctx.translate(px + w/2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(px + w/2), 0);
  }

  const starFlash = player.starPower > 0 ? `hsl(${frameCount * 18 % 360},100%,60%)` : null;

  if (player.dead) {
    // Dead Mario spins
    ctx.fillStyle = '#e40058';
    ctx.beginPath();
    ctx.arc(px + w/2, py + h/2, w/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const big = (player.state !== 'small');

  // Body
  ctx.fillStyle = starFlash || (player.state === 'fire' ? '#fff' : '#e40058');
  ctx.fillRect(px+2, py + (big?14:10), w-4, h - (big?14:10));

  // Overalls
  ctx.fillStyle = starFlash || '#0070e0';
  ctx.fillRect(px+4, py + h - (big?20:14), w-8, big?14:10);

  // Hat
  ctx.fillStyle = starFlash || PAL.marioHat;
  ctx.fillRect(px, py, w, big?10:8);
  ctx.fillRect(px-3, py+(big?4:3), w+6, big?6:5);

  // Face
  ctx.fillStyle = '#f8b868';
  ctx.fillRect(px+4, py+(big?10:8), w-8, big?8:6);

  // Eye
  ctx.fillStyle = '#000';
  ctx.fillRect(px + (player.facingRight ? w-10 : 6), py+(big?12:9), 4, 4);

  // Mustache
  ctx.fillStyle = '#4a2000';
  ctx.fillRect(px + 4, py+(big?18:13), w - 8, 3);

  // Shoes
  ctx.fillStyle = '#4a2000';
  ctx.fillRect(px, py + h - 6, w/2+2, 6);
  ctx.fillRect(px + w/2-2, py + h - 6, w/2+2, 6);

  // Fire flower effect
  if (player.state === 'fire') {
    ctx.fillStyle = '#ff6000';
    ctx.beginPath();
    ctx.arc(px + w + 3, py + h/2, 4, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Enemy ──
function drawEnemy(e) {
  if (e.dead) return;
  const ex = e.x - cameraX;
  const ey = e.y;

  if (e.type === 'goomba') {
    if (e.squished) {
      ctx.fillStyle = PAL.goomba;
      ctx.fillRect(ex, ey + e.h - 10, e.w, 10);
      return;
    }
    const footOff = e.anim % 16 < 8 ? 3 : -3;
    // Body
    ctx.fillStyle = PAL.goomba;
    ctx.beginPath();
    ctx.arc(ex + e.w/2, ey + e.h/2 + 2, e.w/2, 0, Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(ex+4, ey+8, 8, 8);
    ctx.fillRect(ex+e.w-12, ey+8, 8, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(ex+6, ey+10, 4, 4);
    ctx.fillRect(ex+e.w-10, ey+10, 4, 4);
    // Eyebrows
    ctx.fillStyle = '#000';
    ctx.fillRect(ex+3, ey+6, 10, 3);
    ctx.fillRect(ex+e.w-13, ey+6, 10, 3);
    // Feet
    ctx.fillStyle = '#7a3010';
    ctx.fillRect(ex+2, ey+e.h-8+footOff, 10, 8);
    ctx.fillRect(ex+e.w-12, ey+e.h-8-footOff, 10, 8);
  }

  if (e.type === 'koopa') {
    if (e.shell) {
      ctx.fillStyle = '#00a800';
      ctx.beginPath();
      ctx.ellipse(ex+e.w/2, ey+e.h/2+4, e.w/2, e.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.ellipse(ex+e.w/2, ey+e.h/2+4, e.w/3, e.h/3, 0, 0, Math.PI*2);
      ctx.fill();
      return;
    }
    ctx.save();
    if (e.vx > 0) { ctx.translate(ex+e.w/2,0); ctx.scale(-1,1); ctx.translate(-(ex+e.w/2),0); }
    // Shell
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.ellipse(ex+e.w/2, ey+e.h*0.6, e.w/2, e.h*0.4, 0, 0, Math.PI*2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#00c800';
    ctx.beginPath();
    ctx.arc(ex+e.w/2, ey+e.h*0.25, e.w/2-2, 0, Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(ex+e.w-12, ey+6, 10, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(ex+e.w-9, ey+8, 4, 4);
    // Feet
    const fOff = e.anim%16<8?3:-3;
    ctx.fillStyle = '#e0e000';
    ctx.fillRect(ex+2, ey+e.h-10+fOff, 10, 10);
    ctx.fillRect(ex+e.w-12, ey+e.h-10-fOff, 10, 10);
    ctx.restore();
  }
}

// ── Collectible ──
function drawCollectible(c) {
  const cx = c.x - cameraX;
  if (c.type === 'coin') {
    const spin = Math.abs(Math.sin(frameCount * 0.2));
    ctx.fillStyle = '#f8b800';
    ctx.beginPath();
    ctx.ellipse(cx + c.w/2, c.y + c.h/2, 8*spin+1, 12, 0, 0, Math.PI*2);
    ctx.fill();
    return;
  }
  if (c.type === 'mushroom') {
    // Stem
    ctx.fillStyle = '#f8f8d0';
    ctx.fillRect(cx+4, c.y+14, c.w-8, 14);
    // Cap
    ctx.fillStyle = '#e40058';
    ctx.beginPath();
    ctx.arc(cx+c.w/2, c.y+12, c.w/2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx+7, c.y+10, 5, 0, Math.PI*2);
    ctx.arc(cx+c.w-7, c.y+10, 5, 0, Math.PI*2);
    ctx.fill();
  }
  if (c.type === 'fireflower') {
    const fl = frameCount * 0.1;
    ctx.fillStyle = '#00c000';
    ctx.fillRect(cx+12, c.y+8, 4, 16);
    ctx.fillStyle = `hsl(${fl*180%360},100%,50%)`;
    ctx.beginPath();
    ctx.arc(cx+c.w/2, c.y+8, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx+c.w/2, c.y+8, 5, 0, Math.PI*2);
    ctx.fill();
  }
  if (c.type === 'star') {
    drawStar(cx + c.w/2, c.y + c.h/2, 5, 14, 7, `hsl(${frameCount*6%360},100%,60%)`);
  }
}

function drawStar(cx, cy, spikes, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < spikes*2; i++) {
    const r = i%2===0 ? outerR : innerR;
    const a = (i / (spikes*2)) * Math.PI*2 - Math.PI/2;
    if (i===0) ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    else ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
  }
  ctx.closePath();
  ctx.fill();
}

// ── Fireball ──
function drawFireball(fb) {
  const fx = fb.x - cameraX;
  const flicker = Math.sin(frameCount * 0.4 + fb.x);
  ctx.fillStyle = `rgba(255,${140+flicker*60},0,0.95)`;
  ctx.beginPath();
  ctx.arc(fx + fb.w/2, fb.y + fb.h/2, fb.w/2 + flicker, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff8c0';
  ctx.beginPath();
  ctx.arc(fx + fb.w/2, fb.y + fb.h/2, fb.w/4, 0, Math.PI*2);
  ctx.fill();
}

// ── Particles ──
function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    if (p.type === 'text') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x - cameraX, p.y);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX - p.r/2, p.y - p.r/2, p.r, p.r);
      ctx.globalAlpha = 1;
    }
  }
}

// ═══════════════════════════════════════════════════
//  HUD UPDATE
// ═══════════════════════════════════════════════════
function updateHUD() {
  hudLives.textContent  = lives;
  hudScore.textContent  = score;
  hudCoins.textContent  = coins;
  hudLevel.textContent  = currentLevelIndex + 1;
  hudTimer.textContent  = levelTimer;
}

// ═══════════════════════════════════════════════════
//  COLLISION
// ═══════════════════════════════════════════════════
function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ═══════════════════════════════════════════════════
//  LEVEL LOAD
// ═══════════════════════════════════════════════════
function loadLevel(idx) {
  const def = LEVELS[idx]();
  level        = def;
  player       = createPlayer(def.startX, def.startY);
  enemies      = def.enemies.map(createEnemy);
  particles    = [];
  collectibles = [];
  fireballs    = [];
  cameraX      = 0;
  levelTimer   = 300;
  timerTick    = 0;
  flagTriggered  = false;
  levelComplete  = false;
  levelCompleteTimer = 0;
  updateHUD();
}

// ═══════════════════════════════════════════════════
//  STATE MACHINE
// ═══════════════════════════════════════════════════
function startGame() {
  score  = 0;
  coins  = 0;
  lives  = 3;
  paused = false;
  currentLevelIndex = 0;
  loadLevel(0);
  showScreen(null);
  canvas.style.display = 'block';
  document.body.classList.add('playing');
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) pauseBtn.textContent = '⏸';
  state = 'playing';
  requestWakeLock();
}
window._startGame = startGame;

function triggerGameOver() {
  state = 'gameover';
  finalScore.textContent = score;
  canvas.style.display = 'none';
  document.body.classList.remove('playing');
  showScreen(screenGameover);
}

function triggerWin() {
  state = 'win';
  winScore.textContent = score;
  canvas.style.display = 'none';
  document.body.classList.remove('playing');
  showScreen(screenWin);
}

function showScreen(el) {
  [screenStart, screenGameover, screenWin].forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  if (el) {
    el.style.display = 'flex';
    el.classList.add('active');
  }
}

// ─── Pause ───
function togglePause() {
  if (state !== 'playing') return;
  paused = !paused;
  const btn = document.getElementById('btn-pause');
  if (btn) btn.textContent = paused ? '▶' : '⏸';
}
window._togglePause = togglePause;

// ═══════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    if (state === 'start' || state === 'gameover' || state === 'win') startGame();
  }
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Touch controls (D-pad + action buttons) ──
const touchState = { left:false, right:false, jump:false, run:false };

function bindBtn(id, prop) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const on  = e => { e.preventDefault(); touchState[prop] = true;  btn.classList.add('pressed'); };
  const off = e => { e.preventDefault(); touchState[prop] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('touchstart',  on,  { passive:false });
  btn.addEventListener('touchend',    off, { passive:false });
  btn.addEventListener('touchcancel', off, { passive:false });
  btn.addEventListener('mousedown',  () => { touchState[prop] = true;  btn.classList.add('pressed'); });
  btn.addEventListener('mouseup',    () => { touchState[prop] = false; btn.classList.remove('pressed'); });
  btn.addEventListener('mouseleave', () => { touchState[prop] = false; btn.classList.remove('pressed'); });
}

bindBtn('btn-left',  'left');
bindBtn('btn-right', 'right');
bindBtn('btn-up',    'jump');
bindBtn('btn-jump',  'jump');   // alias
bindBtn('btn-run',   'run');

// ── Canvas resize: fills the slot between HUD and controls ──
function resizeCanvas() {
  // CSS handles placement via fixed + calc; we just set internal resolution
  // and let CSS scale it with width/height 100%
  // Nothing needed – the canvas CSS does the work.
}
window.addEventListener('resize', resizeCanvas);

// ─── Wake Lock (screen stays on while playing) ───
let wakeLock = null;
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch(_) {}
  }
}
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch(_) {}
  }
  // Autopause when tab hidden
  if (document.visibilityState === 'hidden' && state === 'playing' && !paused) togglePause();
});

// ═══════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════
showScreen(screenStart);
requestAnimationFrame(gameLoop);
