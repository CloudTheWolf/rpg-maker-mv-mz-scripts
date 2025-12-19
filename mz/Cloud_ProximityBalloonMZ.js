/*:
 * @target MZ
 * @plugindesc Shows a looping balloon icon when the player is within X tiles of an event using PROXIMITY_X comments.
 * @author CloudTheWolf
 * @version 1.0.1
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
 * Event Comment Tags (PER PAGE):
 *
 *   PROXIMITY_2
 *   PROXIMITY_3 BALLOON_9
 *   PROXIMITY_2 OVER_PLAYER
 *   PROXIMITY_2 OVER_EVENT
 *
 * NOTES:
 * - Proximity behaviour is controlled via EVENT PAGES
 * - Page refreshes handle all state changes correctly
 */

(() => {
  const params = PluginManager.parameters("Cloud_ProximityBalloonMZ");
  const DEFAULT_BALLOON = Number(params.DefaultBalloonId || 1);
  const DEFAULT_OVER_PLAYER = params.DefaultOverPlayer === "true";

  const BALLOON_PATTERN = [
    0,1,2,3,4,5,6,7,
    6,5,4,3,2,1,
    2,3,4,5,6,7
  ];
  const FRAME_DELAY = 6;

  // --------------------------------------------------
  // Balloon Sprite
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
      this.visible = false;
    }

    update() {
      super.update();
      if (!this._character || !this.bitmap.isReady()) return;

      if (!this._ready) {
        this._ready = true;
        this.updateFrame();
        this.visible = true;
      }

      this.updatePosition();

      if ($gameMap.isEventRunning()) {
        this.visible = false;
        return;
      }

      this.visible = true;

      this._frameCounter++;
      if (this._frameCounter >= FRAME_DELAY) {
        this._frameCounter = 0;
        this._patternIndex =
          (this._patternIndex + 1) % BALLOON_PATTERN.length;
        this.updateFrame();
      }
    }

    updatePosition() {
      this.x = this._character.screenX();
      this.y = this._character.screenY()
        - $gameMap.tileHeight()
        - this._character.jumpHeight();
    }

    updateFrame() {
      const pw = this.bitmap.width / 8;
      const ph = this.bitmap.height / 15;
      const frame = BALLOON_PATTERN[this._patternIndex];
      this.setFrame(frame * pw, (this._balloonId - 1) * ph, pw, ph);
    }

    setBalloonId(id) {
      if (this._balloonId !== id) {
        this._balloonId = id;
        this.updateFrame();
      }
    }

    setTarget(char) {
      this._character = char;
    }
  }

  // --------------------------------------------------
  // Parse proximity data from CURRENT PAGE only
  // --------------------------------------------------
  Game_Event.prototype.refreshProximityData = function () {
    this._proximityRange = null;
    this._proximityBalloon = DEFAULT_BALLOON;
    this._proximityOverPlayer = DEFAULT_OVER_PLAYER;

    const list = this.list();
    if (!list) return;

    for (const cmd of list) {
      if ((cmd.code === 108 || cmd.code === 408) && cmd.indent === 0) {
        const text = cmd.parameters[0];

        const r = text.match(/PROXIMITY_(\d+)/i);
        if (r) this._proximityRange = Number(r[1]);

        const b = text.match(/BALLOON_(\d+)/i);
        if (b) this._proximityBalloon = Number(b[1]);

        if (/OVER_PLAYER/i.test(text)) this._proximityOverPlayer = true;
        if (/OVER_EVENT/i.test(text)) this._proximityOverPlayer = false;
      }
    }
  };

  // --------------------------------------------------
  // Hooks
  // --------------------------------------------------
  const _refresh = Game_Event.prototype.refresh;
  Game_Event.prototype.refresh = function () {
    _refresh.call(this);
    this.refreshProximityData();
    this.removeProximityBalloon();
  };

  const _update = Game_Event.prototype.update;
  Game_Event.prototype.update = function () {
    _update.call(this);
    this.updateProximityBalloon();
  };

  Game_Event.prototype.updateProximityBalloon = function () {
    if (this._proximityRange == null) {
      this.removeProximityBalloon();
      return;
    }

    const dist =
      Math.abs(this.x - $gamePlayer.x) +
      Math.abs(this.y - $gamePlayer.y);

    if (dist <= this._proximityRange && !$gameMap.isEventRunning()) {
      if (!this._proximitySprite) {
        const target = this._proximityOverPlayer ? $gamePlayer : this;
        this._proximitySprite =
          new Sprite_ProximityBalloon(target, this._proximityBalloon);
        SceneManager._scene._spriteset._tilemap.addChild(this._proximitySprite);
      } else {
        this._proximitySprite.setBalloonId(this._proximityBalloon);
        this._proximitySprite.setTarget(
          this._proximityOverPlayer ? $gamePlayer : this
        );
      }
    } else {
      this.removeProximityBalloon();
    }
  };

  Game_Event.prototype.removeProximityBalloon = function () {
    if (!this._proximitySprite) return;
    const s = this._proximitySprite;
    this._proximitySprite = null;
    if (s.parent) s.parent.removeChild(s);
    s.destroy();
  };

})();
