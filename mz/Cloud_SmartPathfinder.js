/*:
 * @target MZ
 * @plugindesc v1.4 Cloud — Smart Pathfinding (A* Navigation + Memao Run Fix)
 * @author CloudTheWolf
 *
 * @help
 * Adds smarter A* pathfinding that avoids obstacles.
 * Supports Player or Event movement with optional running.
 * Fully integrated with Cloud_MemaoAnimatorMZ — Player and Events
 * now correctly use running animations.
 *
 *
 * @command SmartPathFind
 * @text Smart Pathfind
 * @desc Create a move route from source to destination avoiding obstacles
 *
 * @arg targetType
 * @type select
 * @option Player
 * @option ThisEvent
 * @option EventId
 * @default Player
 *
 * @arg eventId
 * @type number
 * @default 0
 * @desc Used if targetType = EventId
 *
 * @arg destX
 * @type number
 * @desc Target tile X
 *
 * @arg destY
 * @type number
 * @desc Target tile Y
 *
 * @arg run
 * @type boolean
 * @default false
 * @desc Whether to use running animation/speed
 *
 * @arg wait
 * @type boolean
 * @default false
 * @desc Wait until path movement completes
 */

(() => {
const pluginName = "Cloud_SmartPathfinder";

//────────────────────────────────────────────
// A* Pathfinder
//────────────────────────────────────────────
class AStarPathfinder {
    constructor(map){this.map=map;this.w=map.width();this.h=map.height();}
    findPath(sx,sy,gx,gy){
        const open=[{x:sx,y:sy,g:0,h:this.hn(sx,sy,gx,gy),p:null}],closed=new Set();
        const key=(x,y)=>`${x},${y}`,dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        while(open.length){
            open.sort((a,b)=>(a.g+a.h)-(b.g+b.h));
            const n=open.shift();
            if(n.x===gx&&n.y===gy)return this.recon(n);
            closed.add(key(n.x,n.y));
            for(const[dx,dy]of dirs){
                const nx=n.x+dx,ny=n.y+dy;
                if(nx<0||ny<0||nx>=this.w||ny>=this.h)continue;
                if(closed.has(key(nx,ny)))continue;
                if(!this.pass(n.x,n.y,dx,dy))continue;
                const g=n.g+1,h=this.hn(nx,ny,gx,gy);
                const e=open.find(o=>o.x===nx&&o.y===ny);
                if(!e||g<e.g)open.push({x:nx,y:ny,g,h,p:n});
            }
        }
        return null;
    }
    hn(x1,y1,x2,y2){return Math.abs(x1-x2)+Math.abs(y1-y2);}
    recon(n){const p=[];while(n){p.unshift({x:n.x,y:n.y});n=n.p;}return p;}
    pass(x,y,dx,dy){return this.map.isPassable(x,y,this.dir(dx,dy));}
    dir(dx,dy){if(dx>0)return 6;if(dx<0)return 4;if(dy>0)return 2;if(dy<0)return 8;return 0;}
}

//────────────────────────────────────────────
// Plugin Command
//────────────────────────────────────────────
PluginManager.registerCommand(pluginName, "SmartPathFind", function(a) {
    const t = a.targetType;
    const eid = Number(a.eventId || 0);
    const tx = Number(a.destX);
    const ty = Number(a.destY);
    const wait = a.wait === "true";
    const run = a.run === "true";

    let ch;
    if (t === "Player") ch = $gamePlayer;
    else if (t === "ThisEvent") {
        const i = SceneManager._scene?._interpreter || $gameMap._interpreter || this;
        const id = i && i.eventId ? i.eventId() : 0;
        ch = $gameMap.event(id);
    } else if (t === "EventId") ch = $gameMap.event(eid);
    if (!ch) return;

    const path = new AStarPathfinder($gameMap).findPath(ch.x, ch.y, tx, ty);
    if (!path || path.length < 2) {
        console.warn(`[${pluginName}] No valid path found`);
        return;
    }

    const origSpeed = ch.moveSpeed();
    const runSpeed = Math.min(origSpeed * 1.2, 4.5); // Controll Speed
    const isPlayer = ch instanceof Game_Player;
    const isMemao =
        typeof Sprite_Memao !== "undefined" &&
        ch.characterName?.().toLowerCase().endsWith("_$(memao)");

    // --- Apply run state ---
    let originalDashFn = null;
    if (run) {
        ch.setMoveSpeed(runSpeed);
        if (isPlayer) {
            // Force Memao/player dash state to true
            originalDashFn = $gamePlayer.isDashing;
            $gamePlayer.isDashing = () => true;
        } else if (isMemao) {
            ch._memaoForceRun = true;
        }
    } else {
        if (isMemao) delete ch._memaoForceRun;
    }

    // --- Build route ---
    const route = { list: [], repeat: false, skippable: false, wait };
    let lx = ch.x,
        ly = ch.y;
    for (let i = 1; i < path.length; i++) {
        const n = path[i];
        const d = n.x > lx ? 6 : n.x < lx ? 4 : n.y > ly ? 2 : 8;
        route.list.push({ code: Game_Character.ROUTE_MOVE_FORWARD, parameters: [], dir: d });
        lx = n.x;
        ly = n.y;
    }
    route.list.push({ code: 0 });
    ch.forceMoveRoute(route);

    // --- Restore after move ---
    const restore = () => {
        ch.setMoveSpeed(origSpeed);
        if (originalDashFn) $gamePlayer.isDashing = originalDashFn;
        if (ch._memaoForceRun) delete ch._memaoForceRun;
    };

    if (wait) {
        const _u = this.updateWaitMode;
        this.updateWaitMode = function () {
            const w = _u.call(this);
            if (!w) {
                restore();
                this.updateWaitMode = _u;
            }
            return w;
        };
    } else setTimeout(() => restore(), path.length * 10 * 16);
});

//────────────────────────────────────────────
// Move Command Override
//────────────────────────────────────────────
const _proc=Game_Character.prototype.processMoveCommand;
Game_Character.prototype.processMoveCommand=function(c){
    if(c.code===Game_Character.ROUTE_MOVE_FORWARD&&c.dir)this.moveStraight(c.dir);
    else _proc.call(this,c);
};

//────────────────────────────────────────────
// Memao Animator Integration
//────────────────────────────────────────────
if(typeof Sprite_Memao!=="undefined"){
    const _update=Sprite_Memao.prototype.update;
    Sprite_Memao.prototype.update=function(){
        const ch=this._character;
        // Force run rows when memaoForceRun is active
        if(ch&&ch._memaoForceRun){
            if(!this._mKey.includes("run:")) this._mKey="";
        }
        _update.call(this);
    };
}
})();
