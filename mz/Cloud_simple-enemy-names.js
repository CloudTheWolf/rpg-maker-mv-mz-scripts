//=============================================================================
// CloudTheWolf - Simple Enemy Names
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Remove the A,B,C suffix from enemies
 * @author CloudTheWolf
 * @url https://cloudthewolf.com
 *
 * @help This plugin has no settings 😀
 */

(() => {
    const _Game_Enemy_name = Game_Enemy.prototype.name;
    Game_Enemy.prototype.name = function() {
        let originalName = _Game_Enemy_name.call(this);
        let nameParts = originalName.split(' ');
        if (nameParts.length > 1 && /^[A-Z]$/i.test(nameParts[nameParts.length - 1])) {
            nameParts.pop();
        }
        return nameParts.join(' ');
    };
})();
