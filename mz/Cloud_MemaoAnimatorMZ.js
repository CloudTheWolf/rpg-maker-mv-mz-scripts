/*:
 * @target MZ
 * @plugindesc Ver 1.2 - Add support for Memao Sprite Sheet Creator sprites
 * @author CloudTheWolf
 * @url https://sleeping-robot-games.itch.io/sprite-sheet-creator
 * @help
 * Allow using Sprites created via Memao Sprite Sheet Creator 
 * Any Actor/Event whose graphic filename ends with _$(memao) will use this animator.
 * Example: teo_$(memao).png  |  $teo_$(memao).png  |  !teo_$(memao).png
 *
 * Features
 * - Uses a custom Sprite (not Sprite_Character).
 * - Pixel-crisp scaling: forces NEAREST, disables mipmaps, rounds positions to whole pixels.
 * - Configurable offsets (default Y +8 px).
 * - Auto Idle/Walk/Run (run = player dashing).
 * - Plugin commands to play actions (axe/pickaxe/plant/water/pickup/reap) in facing dir.
 *
 * If your sheet layout differs, paste JSON into RowMapOverride (defaults to 8×20 map).
 *
 * @param CellWidth
 * @type number
 * @min 8
 * @default 48
 * @text Cell Width (px)
 *
 * @param CellHeight
 * @type number
 * @min 8
 * @default 48
 * @text Cell Height (px)
 *
 * @param ScalePercent
 * @type number
 * @min 1
 * @max 800
 * @default 200
 * @text Scale (%)
 * @desc 200=2x, 150=1.5x, 50=0.5x. Applied exactly.
 *
 * @param CrispPixels
 * @type boolean
 * @default true
 * @text Pixel-Crisp Scaling (Nearest)
 * @desc Turns off smoothing and mipmaps for these sprites + rounds positions.
 *
 * @param XOffset
 * @type number
 * @default 0
 * @text X Offset (px)
 *
 * @param YOffset
 * @type number
 * @default 8
 * @text Y Offset (px)
 * @desc This is multiplied by ScalePercent at runtime ["(ScalePercent/100)*YOffset"]
 *
 * @param WalkFps
 * @type number
 * @min 1
 * @max 60
 * @default 7
 * @text FPS (Walking)
 * 
 * @param IdleFps
 * @type number
 * @min 1
 * @max 60
 * @default 3
 * @text FPS (Idle)
 *
 * @param RunFps
 * @type number
 * @min 1
 * @max 60
 * @default 9
 * @text FPS (Running/Dash)
 * 
 * @param ActionFps
 * @type number
 * @min 1
 * @max 60
 * @default 8
 * @text FPS (Actions)
 *
 * @param RowMapOverride
 * @type note
 * @default 
 * @text Row Map Override (JSON)
 *
 * @command PlayAction
 * @text Play Action
 * @arg Target
 * @type select
 * @option player
 * @option thisEvent
 * @option eventId
 * @default player
 * @arg EventId
 * @type number
 * @min 1
 * @default 1
 * @text Event Id
 * @arg Action
 * @type select
 * @option axe_chop
 * @option axe_strike
 * @option hoe 
 * @option idle
 * @option pickaxe
 * @option pickup
 * @option plant
 * @option reap
 * @option run
 * @option walk
 * @option water
 * @default axe_chop
 * @arg Direction
 * @type select
 * @option current
 * @option down
 * @option left
 * @option right
 * @option up
 * @default current
 * @arg Loop
 * @type boolean
 * @default false
 * @arg Wait
 * @type boolean
 * @default false
 *
 * @command StopAction
 * @text Stop Action
 * @arg Target
 * @type select
 * @option player
 * @option thisEvent
 * @option eventId
 * @default player
 * @arg EventId
 * @type number
 * @min 1
 * @default 1
 * 
 */

(() => {
  "use strict";

  const PLUGIN = "Cloud_MemaoAnimatorMZ";
  const P = PluginManager.parameters(PLUGIN);

  const CW = Number(P.CellWidth || 48);
  const CH = Number(P.CellHeight || 48);
  const SCALE_PCT = Number(P.ScalePercent || 100);
  const CRISP = P.CrispPixels === "true";
  const XOFF = Number(P.XOffset || 0);
  const YOFF = Number(P.YOffset || 0) * (SCALE_PCT / 100);
  const WALK_FPS = Number(P.WalkFps || 12);
  const DASH_FPS = Number(P.RunFps || 15);
  const IDLE_FPS = Number(P.IdleFps || 2)
  const ACTION_FPS = Number(P.ActionFps || 15);

  
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


  function parseRowMapOverride() {
    const raw = String(P.RowMapOverride || "").trim();
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { console.warn(PLUGIN,"RowMapOverride parse failed:",e); return null; }
  }
  const rowMap = parseRowMapOverride() || DEFAULT_ROW_MAP;

  const RANGE = {};
  for (const row of (rowMap.rows || [])) {
    const r = Number(row.r);
    for (const e of (row.entries || [])) {
      const frames = [];
      for (let i = Number(e.start); i <= Number(e.end); i++) frames.push(i);
      RANGE[String(e.name)] = { row:r, frames };
    }
  }

  // helpers
  function isMemaoName(name){ return String(name||"").toLowerCase().endsWith("_$(memao)"); }
  function dirName(d){ switch(d){case 2:return"Down";case 4:return"Left";case 6:return"Right";case 8:return"Up";default:return"Down";} }
  function pickIdleRange(d){ const D=dirName(d); return RANGE["idle"+D]?[RANGE["idle"+D]]:[]; }
  function pickWalkRange(d){
    const D=dirName(d);
    if (D==="Up"){ const a=RANGE["walkUp_a"], b=RANGE["walkUp_b"]; return a&&b?[a,b]:(RANGE["walkUp"]?[RANGE["walkUp"]]:[]); }
    if (D==="Left"){ const a=RANGE["walkLeft_a"], b=RANGE["walkLeft_b"]; return a&&b?[a,b]:(RANGE["walkLeft"]?[RANGE["walkLeft"]]:[]); }
    return RANGE["walk"+D]?[RANGE["walk"+D]]:[];
  }
  function pickRunRange(d){
    const D=dirName(d);
    if (D==="Up"){ const a=RANGE["runUp_a"], b=RANGE["runUp_b"]; return a&&b?[a,b]:(RANGE["runUp"]?[RANGE["runUp"]]:[]); }
    if (D==="Left"){ const a=RANGE["runLeft_a"], b=RANGE["runLeft_b"]; return a&&b?[a,b]:(RANGE["runLeft"]?[RANGE["runLeft"]]:[]); }
    return RANGE["run"+D]?[RANGE["run"+D]]:[];
  }
  function pickActionRange(action, d) {
    const D = dirName(d);
    const base = String(action || "").toLowerCase();
    const R = (n) => RANGE[n] || null;
    const out = [];    
    // Split actions that span two blocks
    // if (base === "pickaxe") {
    //   if (D === "Up")  { if (R("pickaxeUp_a"))  out.push(R("pickaxeUp_a"));  if (R("pickaxeUp_b"))  out.push(R("pickaxeUp_b")); }
    //   if (D === "Left"){ if (R("pickaxeLeft_a"))out.push(R("pickaxeLeft_a"));if (R("pickaxeLeft_b"))out.push(R("pickaxeLeft_b")); }
    // }
    if (base === "plant") {
      if (D === "Left"){ if (R("plantLeft_a")) out.push(R("plantLeft_a")); if (R("plantLeft_b")) out.push(R("plantLeft_b")); }
    }

    // Single-block actions (most directions)
    if (!out.length) {
      const single = R(base + D);
      if (single) out.push(single);
    }

    // If nothing matched above, fall back to idle in current direction
    if (!out.length) return pickIdleRange(d);
    return out;
  }

  function memaoState(ch){ if(!ch._memaoState) ch._memaoState = { mode:"auto", loop:false, done:false }; return ch._memaoState; }

  // movement lock during manual action
  const _Game_CharacterBase_updateRoutineMove = Game_CharacterBase.prototype.updateRoutineMove;
  Game_CharacterBase.prototype.updateRoutineMove = function(){ if (this._memaoLocked) return; _Game_CharacterBase_updateRoutineMove.call(this); };
  const _Game_Player_canMove = Game_Player.prototype.canMove;
  Game_Player.prototype.canMove = function(){ if (this._memaoLocked) return false; return _Game_Player_canMove.call(this); };


  // --- Interpreter wait mode for Memao manual actions ---
  const _Memao_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "memao") {
      const w = this._memaoWait;
      if (!w || !w.ch) { this._waitMode = ""; this._memaoWait = null; return false; }
      const st = memaoState(w.ch);

      const currentCycles = st._cycles || 0;
      const cyclesDone = currentCycles >= (w.start + (w.cycles || 1));
      const manualOver = st.mode !== "manual";
      const stillWaiting = !(cyclesDone || manualOver);

      if (!stillWaiting) { this._waitMode = ""; this._memaoWait = null; }
      return stillWaiting;
    }
    return _Memao_updateWaitMode.call(this);
  };


  // ──────────────────────────────────────────────────────────────────────────
  // Sprite_Memao: extends Sprite (no vanilla slicing) + crisp scaling + offsets
  // ──────────────────────────────────────────────────────────────────────────
  function Sprite_Memao(){ this.initialize(...arguments); }
  
  // Inherit from Sprite_Character so other systems detect it correctly
  Sprite_Memao.prototype = Object.create(Sprite_Character.prototype);
  Sprite_Memao.prototype.constructor = Sprite_Memao;

  // Keep a reference to the original update / balloon / animation logic for safety
  const _Memao_SpriteChar_updateBalloon = Sprite_Character.prototype.updateBalloon;
  const _Memao_SpriteChar_setupAnimation = Sprite_Character.prototype.setupAnimation;
  const _Memao_SpriteChar_startBalloon = Sprite_Character.prototype.startBalloon;

  
  const WALK_HOLD_FRAMES = 6;

  Sprite_Memao.prototype.initialize = function(character){
    Sprite.prototype.initialize.call(this);
    this._character = character;
    this.anchor.set(0.5, 1.0);

    const name = character.characterName() || "";
    this.bitmap = ImageManager.loadBitmap("img/characters/", name);

    // enforce crisp once the bitmap has loaded
    this._crispApplied = false;
    this.bitmap.addLoadListener(() => {
      if (CRISP) {
        // Bitmap smoothing off + update scale mode
        if (typeof this.bitmap.smooth === "boolean") this.bitmap.smooth = false;
        if (this.bitmap._updateScaleMode) this.bitmap._updateScaleMode();
        // WebGL BaseTexture → NEAREST + no mipmaps
        const bt = this.bitmap._baseTexture || (this.texture && this.texture.baseTexture);
        if (bt) {
          if (PIXI && PIXI.SCALE_MODES) bt.scaleMode = PIXI.SCALE_MODES.NEAREST;
          if (PIXI && PIXI.MIPMAP_MODES && bt.mipmap !== undefined) bt.mipmap = PIXI.MIPMAP_MODES.OFF;
        }
        // Update UVs to be safe
        if (this.texture && this.texture.updateUvs) this.texture.updateUvs();
        // Per-sprite pixel snapping
        this.roundPixels = true;
        this._crispApplied = true;
      }
    });
    
    // exact scale
    const s = SCALE_PCT / 100.0;
    this.scale.set(s, s);

    // animation state
    this._mTimer = 0;
    this._mFps = IDLE_FPS;
    this._mFrameIndex = 0;
    this._mRanges = [];
    this._mRangesKey = "";
    this._lastDir = character.direction();
    this._lastMoving = false;
    this._lastDashing = false;
    this._mMoveHold = 0;
    this._mKey = "";
    this._mSeq = [];
  };

  function memaoBuildSeq(ranges, pingpong,isIdle) {
    const seq = [];
    for (const seg of (ranges || [])) {
      for (const c of seg.frames) seq.push({ row: seg.row, col: c });
    }
    
    // ---- Idle smoothing / subtle breathing ----
    if (isIdle && seq.length) {
      const extended = [];

      for (let i = 0; i < seq.length; i++) {
        const f = seq[i];
        if (i === 0) {
          extended.push(f, f, f, f);
        } else {
          extended.push(f);
        }
      }

      return extended;
    }

    if (!pingpong || seq.length < 2) return seq;

    const back = seq.slice(0, -1).reverse();
    return seq.concat(back);
  }

  function isCharacterDashing(ch) {
    if (ch instanceof Game_Player) return ch.isDashing();
    if (ch instanceof Game_Follower) return $gamePlayer.isDashing();
    return false;
  }

  Sprite_Memao.prototype.update = function(){
    Sprite.prototype.update.call(this);
    if (!this.bitmap || !this.bitmap.isReady()) return;

    const ch = this._character;

    this.x = Math.round(ch.screenX()) + XOFF;
    this.y = Math.round(ch.screenY()) + YOFF;
    this.z = ch.screenZ();
    this.visible = !ch.isTransparent();
    this.opacity = ch.opacity();

    // —— movement smoothing so we don't flip to idle between footsteps ——
    const movingNow = ch.isMoving();
    if (movingNow) this._mMoveHold = WALK_HOLD_FRAMES;
    else if (this._mMoveHold > 0) this._mMoveHold--;
    const movingSmooth = movingNow || this._mMoveHold > 0;

    const dashing = isCharacterDashing(ch);
    const dir = ch.direction();
    const st = memaoState(ch);

    let ranges = [];
    let fps = IDLE_FPS;
    let key = "";

    if (st.mode === "manual") {
      const manualDir = st.dir || dir;
      ranges = pickActionRange(st.action, manualDir);
      fps = ACTION_FPS;
      key = `act:${st.action}:${manualDir}`;
    } else if (!movingSmooth) {
      ranges = pickIdleRange(dir);                 // 4 frames
      fps = IDLE_FPS;
      key = `idle:${dir}`;
    } else if (dashing) {
      ranges = pickRunRange(dir);                  // 6 frames
      fps = DASH_FPS;
      key = `run:${dir}`;
    } else {
      ranges = pickWalkRange(dir);                 // 6 frames
      fps = WALK_FPS;
      key = `walk:${dir}`;
    }

    if (!ranges || ranges.length === 0) { ranges = [RANGE.idleDown]; key = "idle:1"; fps = IDLE_FPS; }

    // reset ONLY when the state or speed truly changes
    if (this._mKey !== key || this._mFps !== fps) {
      this._mKey = key;
      this._mFps = fps;
      this._mRanges = ranges;
      const _memaoPingPong = (st.mode === "manual" && st.action === "water");
      const _memaoIdle = (st.mode !== "manual" && key.startsWith("idle:")) || (st.mode === "manual" && st.action === "idle");
      this._mSeq = memaoBuildSeq(ranges, _memaoPingPong,_memaoIdle);
      this._mFrameIndex = 0;
      this._mTimer = 0;
      this._memaoDrawCurrent();
    }

    // stable clock
    const framesPerTick = 60 / Math.max(1, this._mFps);
    this._mTimer += 1;
    if (this._mTimer >= framesPerTick && this._mSeq && this._mSeq.length) {
      this._mTimer = 0;
      this._mFrameIndex = (this._mFrameIndex + 1) % this._mSeq.length;

      if (st.mode === "manual" && !st.loop && this._mFrameIndex === 0) {
        st.done = true;
        st.mode = "auto";
        ch._memaoLocked = false;
      }
      this._memaoDrawCurrent();
    }

    this._memaoScanTicker = (this._memaoScanTicker||0) + 1;
    if (this._memaoScanTicker >= 20){
      this._memaoScanTicker = 0;
      const list = this._characterSprites || [];
      for (let i=0;i<list.length;i++){
        const spr = list[i]; const ch = spr && spr._character; if (!ch) continue;
        const want = wantsMemao(ch); const has = spr instanceof Sprite_Memao;
        if (want && !has) replaceSprite(list, i, new Sprite_Memao(ch));
        else if (!want && has) replaceSprite(list, i, new Sprite_Character(ch));
      }
    }

  };

  Sprite_Memao.prototype._memaoDrawCurrent = function(){
    const seq = this._mSeq || [];
    if (!seq.length) return;
    const f = seq[this._mFrameIndex % seq.length];
    const sx = (f.col - 1) * CW;
    const sy = (f.row - 1) * CH;
    this.setFrame(sx, sy, CW, CH);
  };

  function wantsMemao(ch){ const n = ch.characterName(); return !!n && isMemaoName(n); }
  function replaceSprite(list, i, sprite){
    const old = list[i]; if (!old || !old.parent) return;
    const p = old.parent, at = p.getChildIndex(old);
    p.removeChildAt(at); list[i] = sprite; p.addChildAt(sprite, at);
  }

  const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
  Spriteset_Map.prototype.createCharacters = function(){
    _Spriteset_Map_createCharacters.call(this);
    this._characterSprites = this._characterSprites || [];
    for (let i=0;i<this._characterSprites.length;i++){
      const spr = this._characterSprites[i]; const ch = spr && spr._character; if (!ch) continue;
      if (wantsMemao(ch) && !(spr instanceof Sprite_Memao)) replaceSprite(this._characterSprites, i, new Sprite_Memao(ch));
    }
    this._memaoScanTicker = 0;
  };

  function resolveTarget(which, id){
    const n = Number(id || 0);

    if (which === "player") {
      // If no index or 1 → leader
      if (n <= 1) return $gamePlayer;

      // Followers: 2 → follower[0], 3 → follower[1], etc.
      const idx = n - 2;
      const followers = $gamePlayer.followers ? $gamePlayer.followers()._data : [];
      return followers[idx] || null;
    }

    if (which === "thisEvent") {
      const e = $gameMap._interpreter?.eventId?.() || 0;
      return e ? $gameMap.event(e) : null;
    }

    if (which === "eventId") {
      return n ? $gameMap.event(n) : null;
    }

    return null;
  }

    Game_Event.updateShadowChanges
  
  /**
   * Compatability Patch for VisuStella
   */
  if (typeof Sprite_Memao === "function" && !Sprite_Memao.prototype.checkCharacter) {
    Sprite_Memao.prototype.checkCharacter = function(character) {
      return this._character === character;
    };
  }

  const _findTargetSprite = Spriteset_Map.prototype.findTargetSprite;
  Spriteset_Map.prototype.findTargetSprite = function(character) {
    const sprites = this._characterSprites || [];
    for (const spr of sprites) {
      if (!spr) continue;
      if (typeof spr.checkCharacter === "function") {
        if (spr.checkCharacter(character)) return spr;
      } else if (spr._character === character) {
        return spr;
      }
    }
    try { return _findTargetSprite.call(this, character); } catch { return null; }
  };

  const _updateShadowChanges = Game_Event.prototype.updateShadowChanges;
  if (_updateShadowChanges) {
    Game_Event.prototype.updateShadowChanges = function() {
      try {
        return _updateShadowChanges.apply(this, arguments);
      } catch (e) {
        if (e && /checkCharacter is not a function/.test(String(e))) {
          return;
        }
        throw e;
      }
    };
  }

  const _Memao_Game_Event_refresh = Game_Event.prototype.refresh;
  Game_Event.prototype.refresh = function() {
    _Memao_Game_Event_refresh.call(this);

    const page = this.page();
    const image = page ? page.image : null;
    const name = image?.characterName || "";
    const isMemao = name.toLowerCase().endsWith("_$(memao)");

    // --- Normal event: do nothing ---
    if (!isMemao) return;

    // --- Handle Memao event logic ---
    if (!page || !image.characterName) {
      // empty page → hide sprite
      this.setTransparent(true);
      this._through = true;

      // Find the sprite and visually hide it
      const scene = SceneManager._scene;
      if (scene && scene._spriteset) {
        const spriteset = scene._spriteset;
        for (const spr of spriteset._characterSprites || []) {
          if (spr && spr._character === this && spr instanceof Sprite_Memao) {
            spr.visible = false;
          }
        }
      }
      return;
    }

    this.setupPageSettings();
    this.setTransparent(false);

    const scene = SceneManager._scene;
    if (scene && scene._spriteset) {
      const spriteset = scene._spriteset;
      const list = spriteset._characterSprites || [];

      let hasSprite = false;
      for (let i = 0; i < list.length; i++) {
        const spr = list[i];
        if (spr && spr._character === this) {
          if (!(spr instanceof Sprite_Memao)) {
            const memao = new Sprite_Memao(this);
            const parent = spr.parent;
            const index = parent.getChildIndex(spr);
            parent.removeChildAt(index);
            list[i] = memao;
            parent.addChildAt(memao, index);
          }
          hasSprite = true;
          break;
        }
      }

      if (!hasSprite) {
        const memao = new Sprite_Memao(this);
        spriteset._characterSprites.push(memao);
        spriteset._tilemap.addChild(memao);
      }
    }
  };  


  // ───────────────────────────────────────────────
  // Scene_Map Functions
  // ───────────────────────────────────────────────
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);

    const ss = this._spriteset;
    if (!ss || !ss._characterSprites) return;

    for (let i = 0; i < ss._characterSprites.length; i++) {
      const spr = ss._characterSprites[i];
      const ch = spr?._character;
      if (!ch) continue;

      const name = ch.characterName ? ch.characterName() : "";
      const isMemao = name.toLowerCase().endsWith("_$(memao)");

      // Memao actor/event → ensure Sprite_Memao
      if (isMemao && !(spr instanceof Sprite_Memao)) {
        const memao = new Sprite_Memao(ch);
        const parent = spr.parent;
        if (parent) {
          const index = parent.getChildIndex(spr);
          parent.removeChildAt(index);
          ss._characterSprites[i] = memao;
          parent.addChildAt(memao, index);
        }
      }

      // Non-Memao actor/event → ensure Sprite_Character
      if (!isMemao && spr instanceof Sprite_Memao) {
        const normal = new Sprite_Character(ch);
        const parent = spr.parent;
        if (parent) {
          const index = parent.getChildIndex(spr);
          parent.removeChildAt(index);
          ss._characterSprites[i] = normal;
          parent.addChildAt(normal, index);
        }
      }
    }

    
    for (const ev of $gameMap.events()) {
      if (ev && ev._memaoMoveTo && !ev._memaoMoveTo.done) memaoUpdateMove(ev);
    }
    const pl = $gamePlayer;
    if (pl && pl._memaoMoveTo && !pl._memaoMoveTo.done) memaoUpdateMove(pl);

  };

  // ───────────────────────────────────────────────
  // Plugin Command: Play Action
  // ───────────────────────────────────────────────
  PluginManager.registerCommand(PLUGIN, "PlayAction", function(args) {
  const target = String(args.Target || "player");
  const eventId = Number(args.EventId || 0);
  const ch = resolveTarget(target, eventId);
  if (!ch) return;

  const d = String(args.Direction || "current").trim().toLowerCase();
  let dir = ch.direction();
  if (d === "up") dir = 8;
  else if (d === "down") dir = 2;
  else if (d === "left") dir = 4;
  else if (d === "right") dir = 6;

  const raw = String(args.Action || "axe").trim().toLowerCase();
  const ACTIONS = {
    idle:"idle", walk:"walk", run:"run",
    pickup:"pickup","pick up":"pickup","pick-up":"pickup",pick:"pickup",
    pickaxe:"pickaxe","pick axe":"pickaxe",mining:"pickaxe",
    axe_chop:"axe_chop",chop:"axe_chop",chopping:"axe_chop",
    plant:"plant",sow:"plant",seed:"plant",
    water:"water",watering:"water",
    reap:"reap",scythe:"reap",
    axe_strike:"axe_strike",hoe:"hoe"

  };
  const action = ACTIONS[raw] || "idle";

  const st = memaoState(ch);
  st.mode = "manual";
  st.action = action;
  st.dir = dir;
  st.loop = (args.Loop === "true");
  st.done = false;
  // init cycle counter if missing
  st._cycles = st._cycles || 0;

  // lock movement during manual
  ch._memaoLocked = true;

  // If Wait=true, tell the interpreter to pause until ONE full loop completes.
  if (String(args.Wait) === "true") {
    this._memaoWait = { ch, start: st._cycles, cycles: 1 };
    this.setWaitMode("memao");
  }
  
  });

  // ───────────────────────────────────────────────
  // Plugin Command: Stop Action
  // ───────────────────────────────────────────────  
  PluginManager.registerCommand(PLUGIN, "StopAction", args=>{
    const ch = resolveTarget(String(args.Target||"player"), Number(args.EventId||0)); if (!ch) return;
    const st = memaoState(ch); st.mode="auto"; st.done=true; ch._memaoLocked=false;
  });

})();

// Expose to other Plugins

function Sprite_Memao(){ this.initialize(...arguments); }
Sprite_Memao.prototype = Object.create(Sprite.prototype);
Sprite_Memao.prototype.constructor = Sprite_Memao;

// ───────────────────────────────────────────────
// ABS / HUD / Balloon Compatibility
// ───────────────────────────────────────────────
Sprite_Memao.prototype.updateBalloon = function() {
  if (_Memao_SpriteChar_updateBalloon)
    _Memao_SpriteChar_updateBalloon.call(this);
};

Sprite_Memao.prototype.setupAnimation = function() {
  if (_Memao_SpriteChar_setupAnimation)
    _Memao_SpriteChar_setupAnimation.call(this);
};

Sprite_Memao.prototype.startBalloon = function() {
  if (_Memao_SpriteChar_startBalloon)
    _Memao_SpriteChar_startBalloon.call(this);
};

Sprite_Memao.prototype.isMemao = true;

// Export globally for addons
window.Sprite_Memao = Sprite_Memao;
