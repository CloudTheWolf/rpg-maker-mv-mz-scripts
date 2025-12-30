/*:
 * @target MV
 * @plugindesc v1.2 - Add support for Memao Sprite Sheet Creator sprites
 * @author CloudTheWolf
 *
 * @param CellWidth
 * @type number
 * @default 48
 *
 * @param CellHeight
 * @type number
 * @default 48
 *
 * @param ScalePercent
 * @type number
 * @default 200
 *
 * @param WalkFps
 * @type number
 * @default 7
 *
 * @param RunFps
 * @type number
 * @default 9
 *
 * @param IdleFps
 * @type number
 * @default 3
 *
 * @param ActionFps
 * @type number
 * @default 8
 *
 * @param RowMapOverride
 * @type note
 * @default 
 * @text Row Map Override (JSON)
 *
 * @help
 * Any character whose filename ends with _$(memao) will use this animator.
 *
 * Example filenames:
 *   teo_$(memao).png
 *   $hero_$(memao).png
 *
 * Plugin Commands (MV):
 *   MemaoPlayAction target eventId action direction loop wait
 *   MemaoStopAction target eventId
 */

(function() {
"use strict";

/* ============================================================================
 * Parameters
 * ==========================================================================*/

var PLUGIN = "Cloud_MemaoAnimatorMV";
var params = PluginManager.parameters(PLUGIN);

var CW = Number(params.CellWidth || 48);
var CH = Number(params.CellHeight || 48);
var SCALE = Number(params.ScalePercent || 200) / 100;
var WALK_FPS = Number(params.WalkFps || 7);
var RUN_FPS = Number(params.RunFps || 9);
var IDLE_FPS = Number(params.IdleFps || 3);
var ACTION_FPS = Number(params.ActionFps || 8);
var WALK_HOLD_FRAMES = 6;
var RANGE = {};

/* ============================================================================
 * RowMap → RANGE
 * ==========================================================================*/

// --- Hardcoded fallback (always valid) ---
const DEFAULT_ROW_MAP = {
  rows: [
    { r: 1,  entries: [
      { name: "idleDown",  start: 1, end: 4 },
      { name: "idleUp",    start: 5, end: 8 }
    ]},
    { r: 2,  entries: [
      { name: "idleLeft",  start: 1, end: 4 },
      { name: "idleRight", start: 5, end: 8 }
    ]},
    { r: 3,  entries: [
      { name: "walkDown",  start: 1, end: 6 },
      { name: "walkUp_a",  start: 7, end: 8 }
    ]},
    { r: 4,  entries: [
      { name: "walkUp_b",    start: 1, end: 4 },
      { name: "walkLeft_a",  start: 5, end: 8 }
    ]},
    { r: 5,  entries: [
      { name: "walkLeft_b", start: 1, end: 2 },
      { name: "walkRight",  start: 3, end: 8 }
    ]},
    { r: 6,  entries: [
      { name: "runDown",  start: 1, end: 6 },
      { name: "runUp_a",  start: 7, end: 8 }
    ]},
    { r: 7,  entries: [
      { name: "runUp_b",    start: 1, end: 4 },
      { name: "runLeft_a",  start: 5, end: 8 }
    ]},
    { r: 8,  entries: [
      { name: "runLeft_b", start: 1, end: 2 },
      { name: "runRight",  start: 3, end: 8 }
    ]},
    { r: 9,  entries: [
      { name: "pickupDown", start: 1, end: 4 },
      { name: "pickupUp",   start: 5, end: 8 }
    ]},
    { r: 10, entries: [
      { name: "pickupLeft",  start: 1, end: 4 },
      { name: "pickupRight", start: 5, end: 8 }
    ]},
    { r: 11, entries: [
      { name: "pickaxeDown", start: 1, end: 4 },
      { name: "pickaxeUp", start: 5, end: 8 }
    ]},
    { r: 12, entries: [
      { name: "pickaxeLeft",   start: 1, end: 4 },
      { name: "pickaxeRight", start: 5, end: 8 }
    ]},
    { r: 13, entries: [
      { name: "axe_chopDown", start: 1, end: 4 },
      { name: "axe_chopUp",  start: 5, end: 8 }
    ]},
    { r: 14, entries: [
      { name: "axe_chopLeft", start: 1, end: 4 },
      { name: "axe_chopRight",   start: 5, end: 8 }
    ]},
    { r: 15, entries: [
      { name: "plantDown",   start: 1, end: 3 },
      { name: "plantUp",     start: 4, end: 6 },
      { name: "plantLeft_a", start: 7, end: 8 }
    ]},
    { r: 16, entries: [
      { name: "plantLeft_b", start: 1, end: 1 },
      { name: "plantRight",  start: 2, end: 4 },
      { name: "waterDown",   start: 5, end: 8 }
    ]},
    { r: 17, entries: [
      { name: "waterUp",   start: 1, end: 4 },
      { name: "waterLeft", start: 5, end: 8 }
    ]},
    { r: 18, entries: [
      { name: "waterRight", start: 1, end: 4 },
      { name: "reapDown",   start: 5, end: 8 }
    ]},
    { r: 19, entries: [
      { name: "reapUp",   start: 1, end: 4 },
      { name: "reapLeft", start: 5, end: 8 }
    ]},
    { r: 20, entries: [
      { name: "reapRight", start: 1, end: 4 },
      { name: "unused",    start: 5, end: 8 }
    ]},
    { r: 21, entries: [
      { name: "hoeDown", start: 1, end: 4 },
      { name: "hoeUp",    start: 5, end: 8 }
    ]},
    { r: 22, entries: [
      { name: "hoeLeft", start: 1, end: 4 },
      { name: "hoeRight",    start: 5, end: 8 }
    ]},
    { r: 23, entries: [
      { name: "axe_strikeDown", start: 1, end: 4 },
      { name: "axe_strikeUp",    start: 5, end: 8 }
    ]},
    { r: 24, entries: [
      { name: "axe_strikeLeft", start: 1, end: 4 },
      { name: "axe_strikeRight",    start: 5, end: 8 }
    ]}
  ]
};

// ---------------------------------------------------------------------------
// Optional override from plugin parameters (MV-safe)
// ---------------------------------------------------------------------------
function parseRowMapOverride() {
  var raw = String(params.RowMapOverride || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Cloud_MemaoAnimatorMV", "RowMapOverride parse failed:", e);
    return null;
  }
}

var rowMap = parseRowMapOverride() || DEFAULT_ROW_MAP;

// ---------------------------------------------------------------------------
// Build RANGE (identical output to MZ)
// ---------------------------------------------------------------------------
var RANGE = {};

var rows = rowMap.rows || [];
for (var i = 0; i < rows.length; i++) {
  var row = rows[i];
  var r = Number(row.r);
  var entries = row.entries || [];

  for (var j = 0; j < entries.length; j++) {
    var e = entries[j];
    var frames = [];
    var start = Number(e.start);
    var end = Number(e.end);

    for (var f = start; f <= end; f++) {
      frames.push(f);
    }

    RANGE[String(e.name)] = {
      row: r,
      frames: frames
    };
  }
}

/* ============================================================================
 * Helpers
 * ==========================================================================*/

function isMemaoName(name) {
    return name && name.toLowerCase().endsWith("_$(memao)");
}

function memaoState(ch) {
    if (!ch._memaoState) {
        ch._memaoState = {
            mode: "auto",
            action: "idle",
            dir: 2,
            loop: false,
            finished: false
        };
    }
    return ch._memaoState;
}


function dirName(d) {
    return d === 2 ? "Down" :
           d === 4 ? "Left" :
           d === 6 ? "Right" :
           d === 8 ? "Up" : "Down";
}

function isCharacterDashing(ch) {
    if (ch instanceof Game_Player) return ch.isDashing();
    if (ch instanceof Game_Follower) return $gamePlayer.isDashing();
    return false;
}

/* ============================================================================
 * Range Pickers
 * ==========================================================================*/

function pickIdleRange(d) {
    var r = RANGE["idle" + dirName(d)];
    return r ? [r] : [];
}

function pickWalkRange(d) {
  var D = dirName(d);

  if (D === "Up") {
    if (RANGE.walkUp_a && RANGE.walkUp_b)
      return [RANGE.walkUp_a, RANGE.walkUp_b];
  }

  if (D === "Left") {
    if (RANGE.walkLeft_a && RANGE.walkLeft_b)
      return [RANGE.walkLeft_a, RANGE.walkLeft_b];
  }

  var r = RANGE["walk" + D];
  return r ? [r] : [];
}

function pickRunRange(d) {
  var D = dirName(d);

  if (D === "Up") {
    if (RANGE.runUp_a && RANGE.runUp_b)
      return [RANGE.runUp_a, RANGE.runUp_b];
  }

  if (D === "Left") {
    if (RANGE.runLeft_a && RANGE.runLeft_b)
      return [RANGE.runLeft_a, RANGE.runLeft_b];
  }

  var r = RANGE["run" + D];
  return r ? [r] : [];
}


function pickActionRange(action, d) {
  var D = dirName(d);
  var base = String(action || "").toLowerCase();
  var out = [];

  function R(name) {
    return RANGE[name] || null;
  }

  // -----------------------------------------------------------------------
  // Split actions 
  // -----------------------------------------------------------------------

  // plant: split on Left
  if (base === "plant") {
    if (D === "Left") {
      if (R("plantLeft_a")) out.push(R("plantLeft_a"));
      if (R("plantLeft_b")) out.push(R("plantLeft_b"));
    }
  }

  // -----------------------------------------------------------------------
  // Single-block action (most directions)
  // -----------------------------------------------------------------------
  if (!out.length) {
    var single = R(base + D);
    if (single) out.push(single);
  }

  // -----------------------------------------------------------------------
  // Final fallback: idle in current direction
  // -----------------------------------------------------------------------
  if (!out.length) {
    return pickIdleRange(d);
  }

  return out;
}


/* ============================================================================
 * Movement Lock (MV-safe)
 * ==========================================================================*/

var _Game_Character_updateMove = Game_Character.prototype.updateMove;
Game_Character.prototype.updateMove = function() {
    if (this._memaoLocked) return;
    _Game_Character_updateMove.call(this);
};

var _Game_Player_canMove = Game_Player.prototype.canMove;
Game_Player.prototype.canMove = function() {
    if (this._memaoLocked) return false;
    return _Game_Player_canMove.call(this);
};

/* ============================================================================
 * Sprite_Memao
 * ==========================================================================*/

function Sprite_Memao(character) {
    this.initialize(character);
}

Sprite_Memao.prototype = Object.create(Sprite.prototype);
Sprite_Memao.prototype.constructor = Sprite_Memao;

Sprite_Memao.prototype.initialize = function(character) {
    Sprite.prototype.initialize.call(this);
    this._character = character;

    this.anchor.x = 0.5;
    this.anchor.y = 1.0;

    this.bitmap = ImageManager.loadCharacter(character.characterName());
    this.scale.x = SCALE;
    this.scale.y = SCALE;

    this._timer = 0;
    this._frameIndex = 0;
    this._moveHold = 0;
    this._seq = [];
    this._key = "";

    this.bitmap.addLoadListener(this._applyCrisp.bind(this));
    this.setFrame(0, 0, CW, CH);
};

Sprite_Memao.prototype._applyCrisp = function() {
    this.bitmap.smooth = false;
    if (this.texture && this.texture.baseTexture) {
        this.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
};

Sprite_Memao.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (!this.bitmap || !this.bitmap.isReady()) return;

    var ch = this._character;

    this.x = Math.round(ch.screenX());
    this.y = Math.round(ch.screenY());
    this.opacity = ch.opacity();
    this.visible = !ch.isTransparent();

    if (ch.isMoving()) this._moveHold = WALK_HOLD_FRAMES;
    else if (this._moveHold > 0) this._moveHold--;

    var moving = ch.isMoving() || this._moveHold > 0;
    var dir = ch.direction();
    var st = memaoState(ch);

    var ranges, fps, key;
    var dName = dirName(dir);

    if (st.mode === "manual") {
        var useDir = st.dir || dir;
        ranges = pickActionRange(st.action, useDir);
        fps = ACTION_FPS;
        key = "act:" + st.action + ":" + useDir;
    }
    else if (!moving) {
        ranges = pickIdleRange(dir);
        fps = IDLE_FPS;
        key = "idle:" + dName;
    }
    else if (isCharacterDashing(ch)) {
        ranges = pickRunRange(dir);
        fps = RUN_FPS;
        key = "run:" + dName;
    }
    else {
        ranges = pickWalkRange(dir);
        fps = WALK_FPS;
        key = "walk:" + dName;
    }

    if (!ranges.length) ranges = pickIdleRange(dir);

    if (this._key !== key) {
        this._key = key;
        this._seq = [];
        ranges.forEach(function(r) {
            r.frames.forEach(function(f) {
                this._seq.push({ row: r.row, col: f });
            }, this);
        }, this);
        this._frameIndex = 0;
        this._timer = 0;
    }

    this._timer++;
    if (this._timer >= 60 / fps) {
        this._timer = 0;

        var last = this._frameIndex === this._seq.length - 1;

        if (st.mode === "manual" && !st.loop && last) {
            // End of non-looping action
            st.mode = "auto";
            st.finished = true;      // ← IMPORTANT
            ch._memaoLocked = false;
            this._frameIndex = 0;
            return;
        }

        this._frameIndex = (this._frameIndex + 1) % this._seq.length;
    }

    var f = this._seq[this._frameIndex];
    if (f) {
        this.setFrame((f.col - 1) * CW, (f.row - 1) * CH, CW, CH);
    }
};

/* ============================================================================
 * Sprite Replacement
 * ==========================================================================*/

var _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
Spriteset_Map.prototype.createCharacters = function() {
    _Spriteset_Map_createCharacters.call(this);
    for (var i = 0; i < this._characterSprites.length; i++) {
        var spr = this._characterSprites[i];
        var ch = spr._character;
        if (isMemaoName(ch.characterName())) {
            var m = new Sprite_Memao(ch);
            var p = spr.parent;
            var idx = p.getChildIndex(spr);
            p.removeChildAt(idx);
            this._characterSprites[i] = m;
            p.addChildAt(m, idx);
        }
    }
};

/* ============================================================================
 * Interpreter Overrides
 * ==========================================================================*/

var _Game_Interpreter_updateWaitMode =
    Game_Interpreter.prototype.updateWaitMode;

Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "memao") {
        if (!this._memaoWaitChar) return false;

        var st = memaoState(this._memaoWaitChar);
        if (st.finished) {
            st.finished = false;      // reset
            this._memaoWaitChar = null;
            return false;             // stop waiting
        }
        return true;                  // keep waiting
    }

    return _Game_Interpreter_updateWaitMode.call(this);
};


/* ============================================================================
 * Plugin Commands (MV)
 * ==========================================================================*/

var _Game_Interpreter_pluginCommand =
    Game_Interpreter.prototype.pluginCommand;

Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    if (command === "MemaoPlayAction") {
        var target = args[0];
        var eventId = Number(args[1] || 0);
        var action = args[2];
        var rawDir = args[3];
        var dir;

        var ch;

        if (target === "player") {
            ch = $gamePlayer;
        } else {
            // event target
            if (eventId === 0) {
                ch = $gameMap.event(this._eventId);
            } else {
                ch = $gameMap.event(eventId);
            }
        }

        if (!ch) return;

        if (rawDir === "current" || rawDir === "-1") {
          dir = ch.direction();
        } else {
          dir = Number(rawDir);
        }
        var loop = args[4] === "true";
        var wait = args[5] === "true";

        

        var st = memaoState(ch);
        st.mode = "manual";
        st.action = action;
        st.dir = dir;
        st.loop = loop;
        st.finished = false; 

        ch._memaoLocked = true;

        if (wait && !loop) {
            this.setWaitMode("memao");
            this._memaoWaitChar = ch;
        }
    }

    if (command === "MemaoStopAction") {
        var target2 = args[0];
        var eventId2 = Number(args[1] || 0);
        var ch2 = target2 === "player"
            ? $gamePlayer
            : $gameMap.event(eventId2);

        if (!ch2) return;

        memaoState(ch2).mode = "auto";
        ch2._memaoLocked = false;
    }
};

})();
