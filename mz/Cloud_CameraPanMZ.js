//=============================================================================
// Cloud_CameraPanMZ.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.2 Smooth pan to Event, Coordinates, or Player
 * @author Cloud
 *
 * @param defaultSpeed
 * @text Default Speed (tiles/frame)
 * @type number
 * @decimals 2
 * @min 0
 * @default 0.25
 *
 * @param arriveThreshold
 * @text Arrival Threshold (tiles)
 * @type number
 * @decimals 3
 * @min 0
 * @default 0.02
 *
 * @command PanToEvent
 * @text Pan to Event
 * @arg eventId
 * @type number
 * @text Event ID
 * @default 0
 * @arg follow
 * @type boolean
 * @text Follow Event Movement
 * @on Yes
 * @off No
 * @default false
 * @arg speed
 * @type number
 * @decimals 3
 * @min 0
 * @text Speed (tiles/frame)
 * @desc 0 = snap. Empty = Default Speed.
 * @arg wait
 * @type boolean
 * @text Wait Until Completed
 * @on Yes
 * @off No
 * @default false
 *
 * @command PanToPoint
 * @text Pan to Coordinates
 * @arg x
 * @type number
 * @decimals 3
 * @text X (tiles)
 * @default 0
 * @arg y
 * @type number
 * @decimals 3
 * @text Y (tiles)
 * @default 0
 * @arg speed
 * @type number
 * @decimals 3
 * @min 0
 * @text Speed (tiles/frame)
 * @desc 0 = snap. Empty = Default Speed.
 * @arg wait
 * @type boolean
 * @text Wait Until Completed
 * @on Yes
 * @off No
 * @default false
 *
 * @command PanToPlayer
 * @text Pan to Player
 * @arg speed
 * @type number
 * @decimals 3
 * @min 0
 * @text Speed (tiles/frame)
 * @desc 0 = snap. Empty = Default Speed.
 * @arg wait
 * @type boolean
 * @text Wait Until Completed
 * @on Yes
 * @off No
 * @default false
 */

var Cloud = Cloud || {};
Cloud.CameraPanMZ = Cloud.CameraPanMZ || {};

(() => {
  const pluginName = "Cloud_CameraPanMZ";
  const P = PluginManager.parameters(pluginName);
  const DEFAULT_SPEED = Math.max(0, Number(P.defaultSpeed ?? 0.25) || 0);
  const ARRIVE_EPS    = Math.max(0, Number(P.arriveThreshold ?? 0.02) || 0.02);

  Cloud.CameraPanMZ._lastCmdEventId = 0;
  const _GI_cmd357 = Game_Interpreter.prototype.command357;
  Game_Interpreter.prototype.command357 = function(params) {
    Cloud.CameraPanMZ._lastCmdEventId = this.eventId();
    return _GI_cmd357.call(this, params);
  };

  // ---- Map state -----------------------------------------------------------
  const seedState = () => {
    const m = $gameMap;
    if (m._camPanActive         === undefined) m._camPanActive = false;
    if (m._camPanMode           === undefined) m._camPanMode   = "idle";
    if (m._camPanSpeed          === undefined) m._camPanSpeed  = DEFAULT_SPEED;
    if (m._camPanFollow         === undefined) m._camPanFollow = false;
    if (m._camPanEventId        === undefined) m._camPanEventId= 0;
    if (m._camPanTX             === undefined) m._camPanTX     = null;
    if (m._camPanTY             === undefined) m._camPanTY     = null;
    if (m._camPanArrivedOnce    === undefined) m._camPanArrivedOnce = false;
    if (m._cloudCamWaitActive   === undefined) m._cloudCamWaitActive = false;
    if (m._cloudCamWaitSatisfied=== undefined) m._cloudCamWaitSatisfied = false;
  };

  const worldToDisplay = (wx, wy) => {
    const cx = $gamePlayer.centerX();
    const cy = $gamePlayer.centerY();
    return [wx - cx, wy - cy];
  };

  const clampDisplayTarget = (tx, ty) => {
    const endX = $gameMap.width() - $gameMap.screenTileX();
    const endY = $gameMap.height() - $gameMap.screenTileY();
    const ctx  = Math.min(Math.max(0, tx), Math.max(0, endX));
    const cty  = Math.min(Math.max(0, ty), Math.max(0, endY));
    return [ctx, cty];
  };

  const setTargetFromWorld = (wx, wy) => {
    let [tx, ty] = worldToDisplay(wx, wy);
    [tx, ty] = clampDisplayTarget(tx, ty);
    $gameMap._camPanTX = tx;
    $gameMap._camPanTY = ty;
  };

  const satisfyWaitIfAny = () => {
    if ($gameMap._cloudCamWaitActive) $gameMap._cloudCamWaitSatisfied = true;
  };

  const clearPan = () => {
    const m = $gameMap;
    m._camPanActive = false;
    m._camPanMode   = "idle";
    m._camPanFollow = false;
    m._camPanEventId= 0;
    m._camPanTX = m._camPanTY = null;
    m._camPanArrivedOnce = false;
  };

  const startPanToPoint = (wx, wy, speed) => {
    seedState();
    const s = (speed == null || isNaN(speed)) ? DEFAULT_SPEED : Math.max(0, Number(speed));
    $gameMap._camPanActive = true;
    $gameMap._camPanMode   = "point";
    $gameMap._camPanFollow = false;
    $gameMap._camPanSpeed  = s;
    $gameMap._camPanArrivedOnce = false;
    setTargetFromWorld(wx, wy);

    if (s === 0) {
      $gameMap.setDisplayPos($gameMap._camPanTX, $gameMap._camPanTY);
      $gameMap._camPanArrivedOnce = true;
      satisfyWaitIfAny();
      clearPan();
    }
  };

  const startPanToEvent = (eventId, follow, speed) => {
    seedState();
    const s = (speed == null || isNaN(speed)) ? DEFAULT_SPEED : Math.max(0, Number(speed));
    const id = Number(eventId || 0);
    const actualId = id > 0 ? id : (Cloud.CameraPanMZ._lastCmdEventId || 0);
    const ev = actualId > 0 ? $gameMap.event(actualId) : null;

    $gameMap._camPanActive = true;
    $gameMap._camPanMode   = "event";
    $gameMap._camPanFollow = !!follow;
    $gameMap._camPanSpeed  = s;
    $gameMap._camPanEventId= actualId;
    $gameMap._camPanArrivedOnce = false;

    if (!ev) { $gameMap._camPanArrivedOnce = true; satisfyWaitIfAny(); clearPan(); return; }

    const wx = ev._realX ?? ev.x;
    const wy = ev._realY ?? ev.y;
    setTargetFromWorld(wx, wy);

    if (s === 0) {
      $gameMap.setDisplayPos($gameMap._camPanTX, $gameMap._camPanTY);
      $gameMap._camPanArrivedOnce = true;
      satisfyWaitIfAny();
      if (!$gameMap._camPanFollow) clearPan();
    }
  };

  const startPanToPlayer = (speed) => {
    seedState();
    const s = (speed == null || isNaN(speed)) ? DEFAULT_SPEED : Math.max(0, Number(speed));
    $gameMap._camPanActive = true;
    $gameMap._camPanMode   = "player";
    $gameMap._camPanFollow = true;
    $gameMap._camPanSpeed  = s;
    $gameMap._camPanArrivedOnce = false;

    const wx = $gamePlayer._realX ?? $gamePlayer.x;
    const wy = $gamePlayer._realY ?? $gamePlayer.y;
    setTargetFromWorld(wx, wy);

    if (s === 0) {
      $gameMap.setDisplayPos($gameMap._camPanTX, $gameMap._camPanTY);
      $gameMap._camPanArrivedOnce = true;
      $gameMap._camPanSpeed = 0;
      satisfyWaitIfAny();
      clearPan();
    }
  };

  PluginManager.registerCommand(pluginName, "PanToEvent", function(args) {
    const eventId = Number(args.eventId || 0);
    const follow  = String(args.follow || "false") === "true";
    const speed   = args.speed !== undefined && args.speed !== "" ? Number(args.speed) : null;
    const wait    = String(args.wait || "false") === "true";
    seedState();
    if (wait) { $gameMap._cloudCamWaitActive = true; $gameMap._cloudCamWaitSatisfied = false; this.setWaitMode("cloudCamPan"); }
    startPanToEvent(eventId, follow, speed);
  });

  PluginManager.registerCommand(pluginName, "PanToPoint", function(args) {
    const x = Number(args.x || 0);
    const y = Number(args.y || 0);
    const speed = args.speed !== undefined && args.speed !== "" ? Number(args.speed) : null;
    const wait  = String(args.wait || "false") === "true";
    seedState();
    if (wait) { $gameMap._cloudCamWaitActive = true; $gameMap._cloudCamWaitSatisfied = false; this.setWaitMode("cloudCamPan"); }
    startPanToPoint(x, y, speed);
  });

  PluginManager.registerCommand(pluginName, "PanToPlayer", function(args) {
    const speed = args.speed !== undefined && args.speed !== "" ? Number(args.speed) : null;
    const wait  = String(args.wait || "false") === "true";
    seedState();
    if (wait) { $gameMap._cloudCamWaitActive = true; $gameMap._cloudCamWaitSatisfied = false; this.setWaitMode("cloudCamPan"); }
    startPanToPlayer(speed);
  });

  const _GI_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "cloudCamPan") {
      if ($gameMap._cloudCamWaitSatisfied) {
        $gameMap._cloudCamWaitActive = false;
        $gameMap._cloudCamWaitSatisfied = false;
        this._waitMode = "";
        return false;
      }
      return true;
    }
    return _GI_updateWaitMode.call(this);
  };

  const _GP_updateScroll = Game_Player.prototype.updateScroll;
  Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    if ($gameMap && $gameMap._camPanActive) return;
    _GP_updateScroll.call(this, lastScrolledX, lastScrolledY);
  };

  const _GM_update = Game_Map.prototype.update;
  Game_Map.prototype.update = function(sceneActive) {
    _GM_update.call(this, sceneActive);
    seedState();
    if (!this._camPanActive) return;

    if (this._camPanMode === "event" && this._camPanFollow) {
      const ev = this._camPanEventId > 0 ? this.event(this._camPanEventId) : null;
      if (!ev) { this._camPanArrivedOnce = true; satisfyWaitIfAny(); clearPan(); return; }
      setTargetFromWorld(ev._realX ?? ev.x, ev._realY ?? ev.y);
    } else if (this._camPanMode === "player" && this._camPanFollow) {
      setTargetFromWorld($gamePlayer._realX ?? $gamePlayer.x, $gamePlayer._realY ?? $gamePlayer.y);
    }

    if (this._camPanTX == null || this._camPanTY == null) { this._camPanArrivedOnce = true; satisfyWaitIfAny(); clearPan(); return; }

    const curX = this._displayX;
    const curY = this._displayY;
    const dx = this._camPanTX - curX;
    const dy = this._camPanTY - curY;

    const speed = this._camPanSpeed;
    if (speed <= 0) {
      this.setDisplayPos(this._camPanTX, this._camPanTY);
      if (!this._camPanArrivedOnce) { this._camPanArrivedOnce = true; satisfyWaitIfAny(); }
      if (!(this._camPanMode === "event" && this._camPanFollow)) clearPan();
      return;
    }

    const dist = Math.hypot(dx, dy);
    if (dist <= ARRIVE_EPS) {
      if (!this._camPanArrivedOnce) { this._camPanArrivedOnce = true; satisfyWaitIfAny(); }
      this.setDisplayPos(this._camPanTX, this._camPanTY);

      if (this._camPanMode === "event" && this._camPanFollow) return;
      if (this._camPanMode === "player") this._camPanSpeed = 0;
      clearPan();
      return;
    }

    const step = Math.min(speed, dist);
    const nx = curX + (dx / dist) * step;
    const ny = curY + (dy / dist) * step;
    this.setDisplayPos(nx, ny);
  };

  // ---- Reset on map setup --------------------------------------------------
  const _GM_setup = Game_Map.prototype.setup;
  Game_Map.prototype.setup = function(mapId) {
    _GM_setup.call(this, mapId);
    seedState();
    $gameMap._cloudCamWaitActive = false;
    $gameMap._cloudCamWaitSatisfied = false;
    clearPan();
  };
})();
