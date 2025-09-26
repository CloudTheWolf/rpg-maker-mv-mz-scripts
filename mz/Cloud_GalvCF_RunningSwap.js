/*:
 * @target MZ
 * @plugindesc [Addon] Auto-swap to running charset (eg $player_running_%(8)) while player is dashing (Galv CF compatible)
 * @author CloudTheWolf
 * @version 1.0.0
 * @pluginver
 * @help
 * Place this plugin BELOW "GALV_CharacterFramesMZ.js".
 *
 * Example: If base is "$teo_%(8)", running should be "$teo_running_%(8)".
 *
 * Here us an example 8x4 sprite sheet
 * | (Front) Right Foot Up | Ignore | (Front) Right Foot Forward | (Front) Right Foot Down | (Front) Left Foot Up | Ignored | (Front) Left Foot Forward | (Front) Left Foot Down |
 * | (Left ) Right Foot Up | Ignore | (Left ) Right Foot Forward | (Left ) Right Foot Down | (Left ) Left Foot Up | Ignored | (Left ) Left Foot Forward | (Left ) Left Foot Down |
 * | (Right) Right Foot Up | Ignore | (Right) Right Foot Forward | (Right) Right Foot Down | (Right) Left Foot Up | Ignored | (Right) Left Foot Forward | (Right) Left Foot Down |
 * | (Up   ) Right Foot Up | Ignore | (Up   ) Right Foot Forward | (Up   ) Right Foot Down | (Up   ) Left Foot Up | Ignored | (Up   ) Left Foot Forward | (Up   ) Left Foot Down |
 * 
 * No plugin commands.
 *
 * @param Affect Followers
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 * @desc Also apply running-swap to party followers.
 * 
 * @param Running Wait Multiplier
 * @type number
 * @decimals 2
 * @min 0.1
 * @default 1.50
 * @desc Multiplies frame wait while using the running sheet. >1 slows; <1 speeds.
 * 
 * @param Skip Frames While Running
 * @type string
 * @default 1,5
 * @desc Comma-separated 0-based frame indexes to skip while the running sheet is active. Example: 1,5
 * 
 * @param Movement Grace Frames
 * @type number
 * @min 0
 * @default 2
 * @desc Frames to keep using the running sheet after movement briefly pauses (prevents flicker between steps).
 * 
 */
(() => {
    "use strict";

    // --- Guard: require Galv's Character Frames ---
    if (!window.Imported || !Imported.Galv_CharacterFrames || !window.Galv || !Galv.CF) {
        console.warn("[Cloud_GalvCF_RunningSwap] Galv's Character Frames not found. Addon disabled.");
        return;
    }

    // --- Params ---
    const _params = PluginManager.parameters("Cloud_GalvCF_RunningSwap");
    const AFFECT_FOLLOWERS = String(_params["Affect Followers"] ?? "true").toLowerCase() === "true";
    const RUN_WAIT_MULT = Math.max(0.1, Number(_params["Running Wait Multiplier"] || 1.50));
    const SKIP_FRAMES_RAW = String(_params["Skip Frames While Running"] ?? "1,5");
    const MOVE_GRACE = Math.max(0, Number(_params["Movement Grace Frames"] ?? 2));
    const SKIP_FRAMES = new Set(
    SKIP_FRAMES_RAW.split(",")
        .map(s => Number(s.trim()))
        .filter(n => Number.isInteger(n) && n >= 0)
    );

    function _cgrs_isTargetChar(ch) {
        return ch === $gamePlayer || (AFFECT_FOLLOWERS && ch instanceof Game_Follower);
    }

    const CF_REGEX = Galv.CF.regex;

    function makeRunningName(originalName) {
        if (!originalName) return originalName;
        const prefixMatch = originalName.match(/^[!$]+/);
        const prefix = prefixMatch ? prefixMatch[0] : "";
        const core = originalName.slice(prefix.length);

        if (CF_REGEX && CF_REGEX.test(core)) {
            CF_REGEX.lastIndex = 0;
            return prefix + core.replace(CF_REGEX, (match, _p1, offset, src) => {
                const prev = src[offset - 1] || "";
                return (prev === "_" ? "running_" : "_running") + match;
            });
        } else {
            return prefix + `${core}_running`;
        }
    }

    // Remove our running marker from a name (handles "_running" and "running_" before %(x), or trailing "_running")
    function stripRunningName(originalName) {
    if (!originalName) return originalName;
    const prefixMatch = originalName.match(/^[!$]+/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const core = originalName.slice(prefix.length);

    if (CF_REGEX && CF_REGEX.test(core)) {
        CF_REGEX.lastIndex = 0;
        const ex = CF_REGEX.exec(core); // has index
        if (ex) {
        const idx = ex.index;
        const before = core.slice(0, idx);
        const after  = core.slice(idx);               // starts at "%(x)"
        if (before.endsWith("_running"))  return prefix + before.slice(0, -8) + after;
        if (before.endsWith("running_"))  return prefix + before.slice(0, -8) + after;
        return prefix + core;
        }
    }
    // No %(x) tag: check simple suffix
    if (core.endsWith("_running")) return prefix + core.slice(0, -8);
    return prefix + core;
    }


    const _SetImage = Game_CharacterBase.prototype.setImage;

    Game_CharacterBase.prototype.setImage = function (characterName, characterIndex) {
    _SetImage.call(this, characterName, characterIndex);

    if (!_cgrs_isTargetChar(this)) return;
    if (this._cgrs_internalSwap) return; // our own swap

    // Determine true base vs running from the incoming name
    const incoming = characterName || "";
    const strippedBase = stripRunningName(incoming);
    const isIncomingRunning = incoming !== strippedBase;

    // Fix base and running names from the stripped base
    this._cgrs_baseName   = strippedBase;
    this._cgrs_baseIndex  = characterIndex || 0;
    this._cgrs_runningName  = makeRunningName(this._cgrs_baseName);
    this._cgrs_runningIndex = this._cgrs_baseIndex;

    // Set current state to match what was just applied
    this._cgrs_usingRunning = isIncomingRunning;

    // (Re)probe running sheet existence once per base
    this._cgrs_runningCheckDone = false;
    this._cgrs_runningExists = false;
    if (this._cgrs_runningName) {
        const bmp = ImageManager.loadCharacter(this._cgrs_runningName);
        this._cgrs_runningBitmap = bmp;
        bmp.addLoadListener(() => {
        this._cgrs_runningCheckDone = true;
        this._cgrs_runningExists = true;
        });
        const pollErr = () => {
        if (!this || !this._cgrs_runningBitmap) return;
        const b = this._cgrs_runningBitmap;
        if (b.isError && b.isError()) {
            this._cgrs_runningCheckDone = true;
            this._cgrs_runningExists = false;
        } else if (!this._cgrs_runningCheckDone) {
            setTimeout(pollErr, 60);
        }
        };
        setTimeout(pollErr, 60);
    }

    // Reset grace window
    this._cgrs_moveGrace = 0;
    };

    const _PlayerInitMembers = Game_Player.prototype.initMembers;
    const _PlayerUpdate = Game_Player.prototype.update;
    const _FollowerUpdate = Game_Follower.prototype.update;
    const _PlayerRefresh = Game_Player.prototype.refresh;
    const _FollowerRefresh = Game_Follower.prototype.refresh;
    const _CGRS_animWait = Game_CharacterBase.prototype.animationWait;
    const _GCB_initMembers = Game_CharacterBase.prototype.initMembers;
    const _CGRS_updatePattern = Game_CharacterBase.prototype.updatePattern;

    Game_CharacterBase.prototype.updatePattern = function () {
        _CGRS_updatePattern.call(this);

        if (!this._cgrs_usingRunning || !this.isMoving()) return;

        const cframes = this._cframes || 3;
        const max     = cframes + (this._spattern || 0);

        let guard = 0;
        while (this._pattern < cframes && SKIP_FRAMES.has(this._pattern) && guard < cframes) {
            this._pattern = (this._pattern + 1) % max;
            guard++;
        }
    };

    Game_CharacterBase.prototype.initMembers = function() {
        _GCB_initMembers.call(this);
        this._cgrs_baseName = null;
        this._cgrs_baseIndex = 0;

        this._cgrs_runningName = null;
        this._cgrs_runningIndex = 0;

        this._cgrs_runningCheckDone = false;
        this._cgrs_runningExists = false;
        this._cgrs_runningBitmap = null;

        this._cgrs_usingRunning = false;
        this._cgrs_internalSwap = false;
    };

    Game_CharacterBase.prototype.setImage = function(characterName, characterIndex) {
        _SetImage.call(this, characterName, characterIndex);

        if (!_cgrs_isTargetChar(this)) return;
        if (this._cgrs_internalSwap) return;

        const ch = this;
        ch._cgrs_baseName = characterName || "";
        ch._cgrs_baseIndex = characterIndex || 0;

        ch._cgrs_runningName = makeRunningName(ch._cgrs_baseName);
        ch._cgrs_runningIndex = ch._cgrs_baseIndex;
        ch._cgrs_usingRunning = false;

        ch._cgrs_runningCheckDone = false;
        ch._cgrs_runningExists = false;

        if (ch._cgrs_runningName) {
            const bmp = ImageManager.loadCharacter(ch._cgrs_runningName);
            ch._cgrs_runningBitmap = bmp;

            bmp.addLoadListener(() => {
                ch._cgrs_runningCheckDone = true;
                ch._cgrs_runningExists = true;
            });

            const pollErr = () => {
                if (!ch || !ch._cgrs_runningBitmap) return;
                const b = ch._cgrs_runningBitmap;
                if (b.isError && b.isError()) {
                    ch._cgrs_runningCheckDone = true;
                    ch._cgrs_runningExists = false;
                } else if (!ch._cgrs_runningCheckDone) {
                    setTimeout(pollErr, 60);
                }
            };
            setTimeout(pollErr, 60);
        }
    };

    // --- Ensure internal swap helper exists (player + followers) ---
    if (!Game_CharacterBase.prototype._cgrs_setImageInternal) {
        Game_CharacterBase.prototype._cgrs_setImageInternal = function(name, index) {
            this._cgrs_internalSwap = true;
            Game_CharacterBase.prototype.setImage.call(this, name, index);
            this._cgrs_internalSwap = false;
        };
    }

    Game_CharacterBase.prototype._cgrs_applyRunningStateIfNeeded = function () {
    if (!_cgrs_isTargetChar(this)) return;
    if (!this._cgrs_runningCheckDone || !this._cgrs_runningExists) return;

    // Maintain a small grace so tiny pauses don't flip back to base
    if (this.isMoving()) {
        this._cgrs_moveGrace = MOVE_GRACE;
    } else if (this._cgrs_moveGrace > 0) {
        this._cgrs_moveGrace--;
    }

    const wantsRunning = $gamePlayer.isDashing() && (this.isMoving() || this._cgrs_moveGrace > 0);

    // Only swap if the target image actually differs (prevents churn)
    if (wantsRunning && !this._cgrs_usingRunning) {
        if (this.characterName() !== this._cgrs_runningName || this.characterIndex() !== this._cgrs_runningIndex) {
        this._cgrs_setImageInternal(this._cgrs_runningName, this._cgrs_runningIndex);
        }
        this._cgrs_usingRunning = true;
    } else if (!wantsRunning && this._cgrs_usingRunning) {
        if (this.characterName() !== this._cgrs_baseName || this.characterIndex() !== this._cgrs_baseIndex) {
        this._cgrs_setImageInternal(this._cgrs_baseName, this._cgrs_baseIndex);
        }
        this._cgrs_usingRunning = false;
    }
    };

    Game_Player.prototype.update = function(sceneActive) {
        _PlayerUpdate.call(this, sceneActive);
        this._cgrs_applyRunningStateIfNeeded();
    };

    Game_Follower.prototype.update = function() {
        _FollowerUpdate.call(this);
        this._cgrs_applyRunningStateIfNeeded();
    };

    Game_Player.prototype.refresh = function() {
        _PlayerRefresh.call(this);
        _SetImage.call(this, this.characterName(), this.characterIndex());
    };

    Game_Follower.prototype.refresh = function() {
        _FollowerRefresh.call(this);
        this._cgrs_setImageInternal(this.characterName(), this.characterIndex());
        this._cgrs_usingRunning = false;
    };

    Game_CharacterBase.prototype.animationWait = function () {
        let wait = _CGRS_animWait.call(this);
        if (this._cgrs_usingRunning && RUN_WAIT_MULT !== 1) {
            wait = Math.max(1, Math.round(wait * RUN_WAIT_MULT));
        }
        return wait;
    };

})();
