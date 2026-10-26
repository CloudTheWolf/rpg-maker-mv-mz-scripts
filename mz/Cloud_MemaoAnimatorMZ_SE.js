/*:
 * @target MZ
 * @plugindesc v1.6 Memao SE Addon — Frame sounds for all animations, including Hoe and Axe Strike
 * @author CloudTheWolf
 *
 * @help
 * Add Sound Effects To Cloud_MemaoAnimatorMZ.
 * Load below Cloud_MemaoAnimatorMZ.
 * Supports idle, walk, run, pickup, pickaxe, axe_chop, axe_strike, hoe,
 * plant, water, reap, slash, hurt, downed, death, revive, eat, drink, laugh,
 * wave, think, shrug, sit, read and paint (left/right only).
 * Axe settings control axe_chop. Axe Strike has its own settings; older projects
 * without Axe Strike settings continue using Axe settings until configured.
 * Frame Mode chooses animation frame numbers or positions in the playback sequence.
 * Animation mode repeats sounds when Wave/Laugh/Drink repeat their final two frames,
 * and follows the original frame numbers during Drink/Revive reverse playback.
 * Playback mode counts the entire expanded sequence, including repeats and reverse.
 * Existing settings without Frame Mode keep playback numbering for compatibility.
 * Slow Downed loops trigger once per configured frame each cycle.
 * Debug speed changes and Replay restart sound triggers; held frames play once.
 *
 * Tips:
 * - Footsteps Walk/Run: frame "2,5".
 * - Axe/Pickaxe/WaterReap: frame "4".
 * - Plant: frame "2".
 *
 * @param Idle
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"","OnlyManual":"false","FrameMode":"animation"}
 *
 * @param Walk
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2,5","OnlyManual":"false","FrameMode":"animation"}
 *
 * @param Run
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2,5","OnlyManual":"false","FrameMode":"animation"}
 *
 * @param Pickup
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Pickaxe
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Axe
 * @text Axe Chop
 * @type struct<ActionSE>
 * @default {"Enabled":"true","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"4","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param AxeStrike
 * @text Axe Strike
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"4","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Hoe
 * @text Hoe
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"4","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Plant
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Water
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Reap
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 * 
 * @param Slash
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 * 
 * @param Hurt
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 * 
 * @param Downed
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 * 
 * @param Death
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 * 
 * @param Eat
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Drink
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Laugh
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Wave
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Think
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Shrug
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Sit
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Read
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Paint
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 *
 * @param Revive
 * @type struct<ActionSE>
 * @default {"Enabled":"false","SE":"{\"Name\":\"\",\"Volume\":\"75\",\"Pitch\":\"100\",\"Pan\":\"0\"}","Frames":"2","OnlyManual":"true","FrameMode":"animation"}
 */

/*~struct~SE:
 * @param Name
 * @text File
 * @type file
 * @dir audio/se
 * @default
 * @param Volume
 * @type number
 * @min 0
 * @max 100
 * @default 90
 * @param Pitch
 * @type number
 * @min 50
 * @max 150
 * @default 100
 * @param Pan
 * @type number
 * @min -100
 * @max 100
 * @default 0
 */

/*~struct~ActionSE:
 * @param Enabled
 * @type boolean
 * @default false
 * @param SE
 * @type struct<SE>
 * @default {"Name":"","Volume":"75","Pitch":"100","Pan":"0"}
 * @param FrameMode
 * @text Frame Mode
 * @type select
 * @option Animation frame (repeat sounds with frames)
 * @value animation
 * @option Playback position (entire sequence)
 * @value playback
 * @default animation
 *
 * @param Frames
 * @text Trigger Frames (1-based)
 * @desc Animation mode uses original frame numbers; Playback mode counts all repeated/reversed steps.
 * @type string
 * @default
 * @param OnlyManual
 * @text Only when using PlayAction?
 * @type boolean
 * @default false
 */

(() => {
  "use strict";

  const PLUGIN = "Cloud_MemaoAnimatorMZ_SE";
  const Params = PluginManager.parameters(PLUGIN);

  // ---------- config parsing ----------
  function parseStruct(s, d={}) { if (!s) return d; try { return JSON.parse(s); } catch { return d; } }
  function parseAction(name){
    const raw = parseStruct(Params[name] || "{}");
    const se = parseStruct(raw.SE || "{}");
    const frames = String(raw.Frames || "")
      .split(",").map(t=>t.trim()).filter(Boolean)
      .map(n=>Number(n)).filter(n=>Number.isInteger(n) && n>=1);
    return {
      enabled: String(raw.Enabled||"false")==="true",
      onlyManual: String(raw.OnlyManual||"false")==="true",
      framesSet: new Set(frames),
      frameMode: raw.FrameMode === "animation" ? "animation" : "playback",
      se: {
        name: String(se.Name||""),
        volume: Number(se.Volume ?? 90),
        pitch: Number(se.Pitch ?? 100),
        pan: Number(se.Pan ?? 0)
      }
    };
  }

  const CONFIG = {
    idle:           parseAction("Idle"),
    walk:           parseAction("Walk"),
    run:            parseAction("Run"),
    pickup:         parseAction("Pickup"),
    pickaxe:        parseAction("Pickaxe"),
    axe_chop:       parseAction("Axe"),
    axe_strike:     parseAction(Params.AxeStrike ? "AxeStrike" : "Axe"),
    hoe:            parseAction("Hoe"),
    plant:          parseAction("Plant"),
    water:          parseAction("Water"),
    reap:           parseAction("Reap"),
    slash:           parseAction("Slash"),
    hurt:           parseAction("Hurt"),
    downed:           parseAction("Downed"),
    death:           parseAction("Death"),
    revive:           parseAction("Revive"),
    eat: parseAction("Eat"),
    drink: parseAction("Drink"),
    laugh: parseAction("Laugh"),
    wave: parseAction("Wave"),
    think: parseAction("Think"),
    shrug: parseAction("Shrug"),
    sit: parseAction("Sit"),
    read: parseAction("Read"),
    paint: parseAction("Paint")
  };

  // ---------- helpers ----------
  function actionFromSprite(spr){
    const key = spr._mKey || "";
    const st  = spr._character ? (spr._character._memaoState || {}) : {};
    if (key.startsWith("manual:") || key.startsWith("act:")) {
      const parts = key.split(":");
      return parts[1] || st.action || "";
    }
    if (key.startsWith("walk:")) return "walk";
    if (key.startsWith("run:"))  return "run";
    if (key.startsWith("idle:")) return "idle";
    if (st.mode === "manual") return st.action || "";
    return "";
  }

  function looksLikeMemaoSprite(s){
    // Don’t rely on class; check for fields the animator sets.
    return s && s._character && typeof s.setFrame === "function" &&
           (typeof s._mKey === "string" || typeof s._mFrameIndex === "number" || s._mSeq || s._mPeriod);
  }

  function periodOf(spr){
    // Prefer animator’s ping-pong period if present; otherwise length of seq.
    return (spr._mPeriod || (spr._mSeq ? spr._mSeq.length : 0)) | 0;
  }

  function animationFrameOf(spr, idx) {
    const current = spr._mSeq?.[idx];
    if (!current) return idx + 1;
    let frame = 0;
    for (const range of spr._mRanges || []) {
      for (const col of range.frames || []) {
        frame++;
        if (range.row === current.row && col === current.col) return frame;
      }
    }
    return idx + 1;
  }

  function playSe(se){
    if (!se || !se.name) return;
    AudioManager.playSe({
      name: se.name,
      volume: Number.isFinite(se.volume) ? se.volume : 90,
      pitch:  Number.isFinite(se.pitch)  ? se.pitch  : 100,
      pan:    Number.isFinite(se.pan)    ? se.pan    : 0
    });
  }

  // ---------- scanner (runs every Scene_Map frame) ----------
  const MemaoSE = {
    cache: new WeakMap(), // sprite -> { key, idx, period, fired: Map<action, Set<frame1>> }

    scan(){
      const scene = SceneManager._scene;
      const ss = scene && scene._spriteset;
      const list = ss && ss._characterSprites;
      if (!list || !Array.isArray(list)) return;

      for (const spr of list){
        if (!looksLikeMemaoSprite(spr)) continue;

        const key = spr._mKey || "";
        const idx = (spr._mFrameIndex ?? 0) | 0;
        const per = periodOf(spr);
        if (!per) continue;

        // fetch & init cache
        let c = this.cache.get(spr);
        if (!c) { c = { key, idx, period: per, fired: new Map() }; this.cache.set(spr, c); }

        // detect wrap or state swap
        const st = spr._character?._memaoState || {};
        const cycles = st._cycles || 0;
        const wrapped = (key !== c.key) || (idx < c.idx) ||
          (spr._mSeq !== c.sequence) || (st.loop && cycles !== c.cycles);

        // current action + config
        const act = actionFromSprite(spr);
        const cfg = CONFIG[act];
        if (cfg && cfg.enabled && cfg.se && cfg.se.name) {
          // OnlyManual?
          if (!cfg.onlyManual || st.mode === "manual") {
            // per-action per-cycle dedupe
            let bucket = c.fired.get(act);
            if (!bucket || wrapped) { bucket = new Set(); c.fired.set(act, bucket); }
            if (cfg.frameMode === "animation") {
              // Fire once on each entry, even if the same source frame repeats later.
              const entered = !c.observed || wrapped || idx !== c.idx;
              if (entered && cfg.framesSet.has(animationFrameOf(spr, idx))) playSe(cfg.se);
            } else {
              const frame1 = (idx % per) + 1;
              if (cfg.framesSet.has(frame1) && !bucket.has(frame1)) {
                bucket.add(frame1);
                playSe(cfg.se);
              }
            }
          }
        }

        // update cache
        c.key = key; c.idx = idx; c.period = per;
        c.sequence = spr._mSeq; c.cycles = cycles; c.observed = true;
      }
    }
  };

  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function(){
    _Scene_Map_update.call(this);
    MemaoSE.scan();
  };

})();
