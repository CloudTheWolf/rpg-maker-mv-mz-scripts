/*:
 * @target MZ
 * @plugindesc [Addon] Auto-swap to running charset (eg $player_running_%(8)) while player is dashing (Galv CF compatible)
 * @author CloudTheWolf
 * @version 1.0.0
 * @pluginver
 * @help
 * Place this plugin BELOW "GALV_CharacterFramesMZ.js".
 *
 * If base is "$teo_%(8)", running should be "$teo_running_%(8)".
 * If base is "MainHero%(8)", running is "MainHero_running%(8)".
 *
 * No plugin commands.
 *
 * @param Affect Followers
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 * @desc Also apply running-swap to party followers.
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

    const _SetImage = Game_CharacterBase.prototype.setImage; // (if not already hoisted)
    Game_CharacterBase.prototype._cgrs_setImageInternal = function(name, index) {
        this._cgrs_internalSwap = true;
        _SetImage.call(this, name, index);
        this._cgrs_internalSwap = false;
    };
    const _PlayerInitMembers = Game_Player.prototype.initMembers;
    const _PlayerUpdate = Game_Player.prototype.update;
    const _FollowerUpdate = Game_Follower.prototype.update;
    const _PlayerRefresh = Game_Player.prototype.refresh;
    const _FollowerRefresh = Game_Follower.prototype.refresh;

    const _GCB_initMembers = Game_CharacterBase.prototype.initMembers;
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

    Game_Player.prototype._cgrs_setImageInternal = function(name, index) {
        this._cgrs_internalSwap = true;
        _SetImage.call(this, name, index);
        this._cgrs_internalSwap = false;
    };

    Game_CharacterBase.prototype._cgrs_applyRunningStateIfNeeded = function() {
        if (!_cgrs_isTargetChar(this)) return;
        if (!this._cgrs_runningCheckDone || !this._cgrs_runningExists) return;

        const shouldUseRunning = this.isMoving() && $gamePlayer.isDashing();

        if (shouldUseRunning && !this._cgrs_usingRunning) {
            this._cgrs_setImageInternal(this._cgrs_runningName, this._cgrs_runningIndex);
            this._cgrs_usingRunning = true;
        } else if (!shouldUseRunning && this._cgrs_usingRunning) {
            this._cgrs_setImageInternal(this._cgrs_baseName, this._cgrs_baseIndex);
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

})();
