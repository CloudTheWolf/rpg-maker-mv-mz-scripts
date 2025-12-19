/*:
 * @target MZ
 * @plugindesc Shows a looping balloon icon when the player is within X tiles of an event using PROXIMITY_X comments.
 * @author CloudTheWolf
 * @version 1.0.0
 * @url https://github.com/CloudTheWolf/rpg-maker-mv-mz-scripts
 *
 * @param DefaultBalloonId
 * @text Default Balloon Icon
 * @type select
 * @option Exclamation
 * @value 1
 * @option Question
 * @value 2
 * @option Music Note
 * @value 3
 * @option Heart
 * @value 4
 * @option Anger
 * @value 5
 * @option Sweat
 * @value 6
 * @option Frustration
 * @value 7
 * @option Silence
 * @value 8
 * @option Light Bulb
 * @value 9
 * @option Zzz
 * @value 10
 * @option User-defined 1
 * @value 11
 * @option User-defined 2
 * @value 12
 * @option User-defined 3
 * @value 13
 * @option User-defined 4
 * @value 14
 * @option User-defined 5
 * @value 15
 * @default 1
 *
 * @param DefaultOverPlayer
 * @text Show Over Player By Default
 * @type boolean
 * @on Player
 * @off Event
 * @default false
 *
 * @help
 * Event Comment Tags (per page):
 *
 *   PROXIMITY_2
 *   PROXIMITY_3 BALLOON_9
 *   PROXIMITY_2 OVER_PLAYER
 *   PROXIMITY_2 OVER_EVENT
 *
 * Behaviour:
 * - Balloon animates continuously while player is in range
 * - Stops immediately when player leaves range
 * - Page change immediately re-evaluates comments
 * - If new page has no PROXIMITY tag, balloon stops
 */

(() => {
    const pluginName = "Cloud_ProximityBalloonMZ";
    const params = PluginManager.parameters(pluginName);

    const DEFAULT_BALLOON = Number(params.DefaultBalloonId || 1);
    const DEFAULT_OVER_PLAYER = params.DefaultOverPlayer === "true";

    // --------------------------------------------------
    // 8-frame balloon animation pattern (0-based)
    // --------------------------------------------------
    const BALLOON_PATTERN = [
        0,1,2,3,4,5,6,7,
        6,5,4,3,2,1,
        2,3,4,5,6,7
    ];

    const FRAME_DELAY = 6;

    // --------------------------------------------------
    // Proximity Balloon Sprite
    // --------------------------------------------------
    class Sprite_ProximityBalloon extends Sprite {
        constructor(character, balloonId) {
            super();
            this._character = character;
            this._balloonId = balloonId;
            this._patternIndex = 0;
            this._frameCounter = 0;
            this._ready = false;

            this.bitmap = ImageManager.loadSystem("Balloon");
            this.anchor.set(0.5, 1);
            this.z = 7;
        }

        update() {
            super.update();
            if (!this._character) return;
            if (!this.bitmap.isReady()) return;

            if (!this._ready) {
                this._ready = true;
                this.updateFrame();
            }

            this.updatePosition();
            this.updateAnimation();
        }

        updatePosition() {
            this.x = this._character.screenX();
            this.y = this._character.screenY()
                - $gameMap.tileHeight()
                - this._character.jumpHeight();
        }

        updateAnimation() {
            this._frameCounter++;
            if (this._frameCounter >= FRAME_DELAY) {
                this._frameCounter = 0;
                this._patternIndex =
                    (this._patternIndex + 1) % BALLOON_PATTERN.length;
                this.updateFrame();
            }
        }

        updateFrame() {
            const framesPerBalloon = 8;
            const balloonCount = 15;

            const pw = this.bitmap.width / framesPerBalloon;
            const ph = this.bitmap.height / balloonCount;

            const frame = BALLOON_PATTERN[this._patternIndex];
            const sx = frame * pw;
            const sy = (this._balloonId - 1) * ph;

            this.setFrame(sx, sy, pw, ph);
        }
    }

    // --------------------------------------------------
    // Parse proximity data from event page
    // --------------------------------------------------
    Game_Event.prototype.refreshProximityData = function () {
        this._proximityRange = null;
        this._proximityBalloon = DEFAULT_BALLOON;
        this._proximityOverPlayer = DEFAULT_OVER_PLAYER;

        const list = this.list();
        if (!list) return;

        for (const cmd of list) {
            if (cmd.code === 108 || cmd.code === 408) {
                const text = cmd.parameters[0];

                const r = text.match(/PROXIMITY_(\d+)/i);
                if (r) this._proximityRange = Number(r[1]);

                const b = text.match(/BALLOON_(\d+)/i);
                if (b) this._proximityBalloon = Number(b[1]);

                if (/OVER_PLAYER/i.test(text)) {
                    this._proximityOverPlayer = true;
                }
              
                if (/OVER_EVENT/i.test(text)) {
                    this._proximityOverPlayer = false;
                }
            }
        }
    };

    // --------------------------------------------------
    // Refresh hook
    // --------------------------------------------------
    const _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function () {
        _Game_Event_refresh.call(this);
        this.refreshProximityData();
        this.removeProximityBalloon();
    };

    // --------------------------------------------------
    // Update hook
    // --------------------------------------------------
    const _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function () {
        _Game_Event_update.call(this);
        this.updateProximityBalloon();
    };

    // --------------------------------------------------
    // Proximity logic
    // --------------------------------------------------
    Game_Event.prototype.updateProximityBalloon = function () {
        if (this._proximityRange === null) return;

        const dx = Math.abs(this.x - $gamePlayer.x);
        const dy = Math.abs(this.y - $gamePlayer.y);
        const distance = dx + dy;

        if (distance <= this._proximityRange) {
            if (!this._proximitySprite) {
                this.createProximityBalloon();
            }
        } else {
            this.removeProximityBalloon();
        }
    };

    // --------------------------------------------------
    // Sprite management
    // --------------------------------------------------
    Game_Event.prototype.createProximityBalloon = function () {
        if (this._proximitySprite) return;

        const target = this._proximityOverPlayer
            ? $gamePlayer
            : this;

        const sprite = new Sprite_ProximityBalloon(
            target,
            this._proximityBalloon
        );

        this._proximitySprite = sprite;
        SceneManager._scene._spriteset._tilemap.addChild(sprite);
    };

    Game_Event.prototype.removeProximityBalloon = function () {
        if (!this._proximitySprite) return;

        const sprite = this._proximitySprite;
        this._proximitySprite = null;

        if (sprite.parent) {
            sprite.parent.removeChild(sprite);
        }
        sprite.destroy();
    };

})();
