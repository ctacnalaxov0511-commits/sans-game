// ========== shared.js — ОБЩАЯ ЛОГИКА (карта, физика, атаки, отрисовка) ==========
// GitTale v0.0.5

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const SCREEN_W = 1100;
const SCREEN_H = 700;
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
ctx.imageSmoothingEnabled = false;

const MAP_W = 3000;
const MAP_H = 2500;

let lastFrameTime = 0;
const FRAME_DELAY = 1000 / 60;
let camera = { x: 0, y: 0 };
let gamePaused = false;
let windowOpen = false;

function updateCamera() {
    camera.x = Math.min(Math.max(player.x - SCREEN_W / 2, 0), MAP_W - SCREEN_W);
    camera.y = Math.min(Math.max(player.y - SCREEN_H / 2, 0), MAP_H - SCREEN_H);
}

function worldToScreen(wx, wy) { return { x: wx - camera.x, y: wy - camera.y }; }
function isOnScreen(wx, wy, margin = 100) {
    return (wx + margin > camera.x && wx - margin < camera.x + SCREEN_W &&
            wy + margin > camera.y && wy - margin < camera.y + SCREEN_H);
}

// ========== ЗАГРУЗКА СПРАЙТОВ ==========
const sprites = {
    sans: new Image(), dummy: new Image(), gaster: new Image(), 
    bone: new Image(), sign: new Image(), 
    lamp_on: new Image(), lamp_off: new Image(),
    grass: new Image(), grass_flower: new Image(),
    dirt: new Image(), fir: new Image(), fir2: new Image()
};

let loadedCount = 0;
const totalSprites = 12;

function checkAllSpritesLoaded() { 
    if(++loadedCount === totalSprites) {
        const loader = document.getElementById('loader');
        if(loader) loader.remove();
        generateTileMap();
        generatePaths();
        generateTrees();
        if(typeof initPlatform === 'function') initPlatform();
    }
}

sprites.sans.src = "sprites/sans.png"; sprites.sans.onload = checkAllSpritesLoaded;
sprites.dummy.src = "sprites/maket.png"; sprites.dummy.onload = checkAllSpritesLoaded;
sprites.gaster.src = "sprites/gaster_blaster.png"; sprites.gaster.onload = checkAllSpritesLoaded;
sprites.bone.src = "sprites/bone.png"; sprites.bone.onload = checkAllSpritesLoaded;
sprites.sign.src = "sprites/sing.png"; sprites.sign.onload = checkAllSpritesLoaded;
sprites.lamp_on.src = "sprites/lamp_on.png"; sprites.lamp_on.onload = checkAllSpritesLoaded;
sprites.lamp_off.src = "sprites/lamp_off.png"; sprites.lamp_off.onload = checkAllSpritesLoaded;
sprites.grass.src = "sprites/grass.png"; sprites.grass.onload = checkAllSpritesLoaded;
sprites.grass_flower.src = "sprites/grass_flower.png"; sprites.grass_flower.onload = checkAllSpritesLoaded;
sprites.dirt.src = "sprites/dirt.png"; sprites.dirt.onload = checkAllSpritesLoaded;
sprites.fir.src = "sprites/fir.png"; sprites.fir.onload = checkAllSpritesLoaded;
sprites.fir2.src = "sprites/fir2.png"; sprites.fir2.onload = checkAllSpritesLoaded;

// ========== ТАЙЛЫ ==========
const TILE_SIZE = 32;
const TILES_WIDE = Math.ceil(MAP_W / TILE_SIZE);
const TILES_HIGH = Math.ceil(MAP_H / TILE_SIZE);
let tileMap = [];

function generateTileMap() {
    tileMap = [];
    for(let row = 0; row < TILES_HIGH; row++) {
        tileMap[row] = [];
        for(let col = 0; col < TILES_WIDE; col++) {
            const x = col * TILE_SIZE, y = row * TILE_SIZE;
            const distToEdge = Math.min(x, MAP_W - x, y, MAP_H - y);
            let type = 'grass';
            if(distToEdge < 200) type = Math.random() < 0.5 ? 'grass_flower' : 'grass';
            else if(Math.random() < 0.06) type = 'grass_flower';
            tileMap[row][col] = { type, x, y };
        }
    }
}

function drawTileFloor() {
    if(!tileMap.length) { ctx.fillStyle = "#4a7a4a"; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
    
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(TILES_WIDE, Math.ceil((camera.x + SCREEN_W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endRow = Math.min(TILES_HIGH, Math.ceil((camera.y + SCREEN_H) / TILE_SIZE) + 1);
    
    for(let row = startRow; row < endRow; row++) {
        for(let col = startCol; col < endCol; col++) {
            const tile = tileMap[row][col];
            if(!tile) continue;
            const sx = tile.x - camera.x, sy = tile.y - camera.y;
            if(sx + TILE_SIZE < 0 || sx > SCREEN_W || sy + TILE_SIZE < 0 || sy > SCREEN_H) continue;
            
            const sprite = tile.type === 'grass' ? sprites.grass : sprites.grass_flower;
            if(sprite.complete) ctx.drawImage(sprite, sx, sy, TILE_SIZE, TILE_SIZE);
            else { ctx.fillStyle = tile.type === 'grass' ? '#4a7a4a' : '#6a9a6a'; ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE); }
        }
    }
    drawPaths();
}

// ========== ТРОПИНКИ ==========
let pathTiles = [];

function generatePaths() {
    pathTiles = [];
    for(let x = 1500; x <= 2650; x += 32) pathTiles.push({ x: x, y: 1250 });
    for(let x = 350; x <= 2650; x += 32) pathTiles.push({ x: x, y: 1250 });
    for(let y = 250; y <= 1250; y += 32) pathTiles.push({ x: 350, y: y });
    
    const unique = [];
    for(let tile of pathTiles) {
        if(!unique.some(t => t.x === tile.x && t.y === tile.y)) unique.push(tile);
    }
    pathTiles = unique;
}

function drawPaths() {
    for(let tile of pathTiles) {
        const sx = tile.x - camera.x, sy = tile.y - camera.y;
        if(sx + 32 < 0 || sx > SCREEN_W || sy + 32 < 0 || sy > SCREEN_H) continue;
        if(sprites.dirt && sprites.dirt.complete) ctx.drawImage(sprites.dirt, sx, sy, 32, 32);
        else { ctx.fillStyle = "#8B5A2B"; ctx.fillRect(sx, sy, 32, 32); }
    }
}

// ========== ДЕРЕВЬЯ ==========
let trees = [];
let treeCollision = [];

function generateTrees() {
    trees = [];
    treeCollision = [];
    
    function isTooCloseToPath(x, y, margin = 40) {
        for(let tile of pathTiles) {
            if(Math.abs(x - tile.x) < margin && Math.abs(y - tile.y) < margin) return true;
        }
        return false;
    }
    
    function isTooCloseToOtherTrees(x, y, margin = 80) {
        for(let tree of trees) {
            if(Math.abs(x - tree.x) < margin && Math.abs(y - tree.y) < margin) return true;
        }
        return false;
    }
    
    const treeCount = 80;
    
    for(let i = 0; i < treeCount; i++) {
        let attempts = 0;
        let placed = false;
        
        while(!placed && attempts < 50) {
            const x = 80 + Math.random() * (MAP_W - 160);
            const y = 80 + Math.random() * (MAP_H - 160);
            
            if(!isTooCloseToPath(x, y, 50) && !isTooCloseToOtherTrees(x, y, 70)) {
                const distToDummy = Math.hypot(x - dummyObj.x, y - dummyObj.y);
                const distToSign = Math.hypot(x - sign.x, y - sign.y);
                const distToSpawn = Math.hypot(x - MAP_W/2, y - MAP_H/2);
                const distToLamp = lamps.some(l => Math.hypot(x - l.x, y - l.y) < 100);
                
                if(distToDummy > 100 && distToSign > 100 && distToSpawn > 100 && !distToLamp) {
                    trees.push({ x, y });
                    treeCollision.push({ x, y, radius: 28 });
                    placed = true;
                }
            }
            attempts++;
        }
    }
}

function checkTreeCollision(newX, newY) {
    for(let tree of treeCollision) {
        const dx = newX - tree.x;
        const dy = newY - tree.y;
        const dist = Math.hypot(dx, dy);
        if(dist < player.radius + tree.radius) return true;
    }
    return false;
}

function drawTrees() {
    for(let tree of trees) {
        const sx = tree.x - camera.x, sy = tree.y - camera.y;
        if(sx + 64 < -50 || sx > SCREEN_W + 50 || sy + 128 < -50 || sy > SCREEN_H + 50) continue;
        if(sprites.fir && sprites.fir.complete) ctx.drawImage(sprites.fir, sx - 16, sy - 32, 64, 64);
        if(sprites.fir2 && sprites.fir2.complete) ctx.drawImage(sprites.fir2, sx - 24, sy - 96, 80, 96);
    }
}

// ========== ЛАМПЫ ==========
let lamps = [
    { x: 350, y: 280, radius: 180, color: [255,220,150], baseIntensity: 0.85, phase: 0, speed: 0.02, active: true },
    { x: 850, y: 450, radius: 170, color: [255,220,150], baseIntensity: 0.8, phase: 1.5, speed: 0.025, active: true },
    { x: 1400, y: 600, radius: 180, color: [255,220,150], baseIntensity: 0.85, phase: 3, speed: 0.018, active: true },
    { x: 2100, y: 350, radius: 170, color: [255,200,120], baseIntensity: 0.75, phase: 2, speed: 0.022, active: true },
    { x: 2600, y: 800, radius: 170, color: [255,200,120], baseIntensity: 0.75, phase: 4, speed: 0.02, active: true },
    { x: 1800, y: 1800, radius: 160, color: [255,220,150], baseIntensity: 0.8, phase: 0.5, speed: 0.028, active: true },
    { x: 900, y: 2000, radius: 180, color: [255,220,150], baseIntensity: 0.85, phase: 1, speed: 0.022, active: true },
    { x: 500, y: 1500, radius: 170, color: [255,200,120], baseIntensity: 0.75, phase: 2.5, speed: 0.02, active: true },
    { x: 2200, y: 1400, radius: 170, color: [255,220,150], baseIntensity: 0.8, phase: 3.5, speed: 0.025, active: true },
    { x: 2700, y: 2100, radius: 180, color: [255,220,150], baseIntensity: 0.85, phase: 4.5, speed: 0.018, active: true },
];
let lampTime = 0;

function updateLampGradients() { lampTime += 0.016; }

function checkLampClick(wx, wy) {
    for(let lamp of lamps) {
        const dx = wx - lamp.x, dy = wy - (lamp.y - 15);
        if(dx*dx + dy*dy < 900) {
            lamp.active = !lamp.active;
            addFloatingText(lamp.active ? "💡 ЛАМПА ВКЛЮЧЕНА" : "💡 ЛАМПА ВЫКЛЮЧЕНА", lamp.x, lamp.y-40, lamp.active ? "#aaffaa" : "#ffaa66", true);
            break;
        }
    }
}

// ========== ОСВЕЩЕНИЕ ==========
let lightSources = [];
let ambientDarkness = 0.25;

function addLightSource(x, y, radius, color = [255,200,100], intensity = 0.7) {
    lightSources.push({ x, y, radius, color, intensity, life: 22 });
}

function updateLightSources() {
    for(let i = lightSources.length-1; i >= 0; i--) {
        lightSources[i].life--;
        lightSources[i].intensity = lightSources[i].life / 22;
        if(lightSources[i].life <= 0) lightSources.splice(i,1);
    }
}

function drawDynamicLighting() {
    ctx.fillStyle = `rgba(0, 0, 0, ${ambientDarkness})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalCompositeOperation = 'lighter';
    for(let lamp of lamps) {
        if(lamp.active) {
            const sx = lamp.x - camera.x, sy = lamp.y - 15 - camera.y;
            const radGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, lamp.radius);
            const flicker = 0.85 + Math.sin(lampTime * lamp.speed + lamp.phase) * 0.12;
            const intensity = lamp.baseIntensity * flicker;
            radGrad.addColorStop(0, `rgba(255, 220, 150, ${intensity * 0.8})`);
            radGrad.addColorStop(0.5, `rgba(255, 200, 100, ${intensity * 0.3})`);
            radGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = radGrad;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
    }
    for(let src of lightSources) {
        const sx = src.x - camera.x, sy = src.y - camera.y;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, src.radius);
        grad.addColorStop(0, `rgba(${src.color[0]},${src.color[1]},${src.color[2]}, ${src.intensity * 0.7})`);
        grad.addColorStop(0.7, `rgba(${src.color[0]},${src.color[1]},${src.color[2]}, ${src.intensity * 0.2})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    ctx.globalCompositeOperation = 'source-over';
    if(!window.vignetteGrad) {
        window.vignetteGrad = ctx.createRadialGradient(SCREEN_W/2, SCREEN_H/2, 300, SCREEN_W/2, SCREEN_H/2, 550);
        window.vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        window.vignetteGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        window.vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
    }
    ctx.fillStyle = window.vignetteGrad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

// ========== ЧАСТИЦЫ ПЫЛИ ==========
let dustParticles = [];
const MAX_DUST = 40;
function addDustParticle(x, y) {
    if(dustParticles.length > MAX_DUST) dustParticles.shift();
    dustParticles.push({ x: x + (Math.random() - 0.5) * 15, y: y + 15, life: 20, size: 2 + Math.random() * 4, alpha: 0.4 + Math.random() * 0.3 });
}
function updateDustParticles() {
    for(let i = dustParticles.length-1; i >= 0; i--) {
        const p = dustParticles[i];
        p.life--; p.y += 1; p.alpha -= 0.02;
        if(p.life <= 0 || p.alpha <= 0) dustParticles.splice(i,1);
    }
}
function drawDustParticles() {
    for(let p of dustParticles) {
        if(!isOnScreen(p.x, p.y, 50)) continue;
        const sx = p.x - camera.x, sy = p.y - camera.y;
        ctx.beginPath(); ctx.arc(sx, sy, p.size * (p.life/20), 0, Math.PI*2);
        ctx.fillStyle = `rgba(120, 100, 70, ${p.alpha * (p.life/20)})`;
        ctx.fill();
    }
}

// ========== ИГРОК ==========
let player = { x: MAP_W/2, y: MAP_H/2, radius: 22, hp: 24, maxHp: 24, invincible: 0, angle: 0 };
let move = { up: false, down: false, left: false, right: false };
let baseSpeed = 5.2;
let dash = { active: false, duration: 0, cooldown: 0, speedBoost: 16.5, trailPositions: [], afterImages: [], canDash: true };

// ========== МАНЕКЕН С ТРЯСКОЙ ==========
const dummyObj = { x: MAP_W - 350, y: MAP_H/2, radius: 35 };
let dummyShake = 0;
function isHitDummy(x, y, rad) { const dx = x - dummyObj.x, dy = y - dummyObj.y; return dx*dx + dy*dy < (dummyObj.radius + rad) ** 2; }
function doesLaserHitDummy(sx, sy, angle, length) {
    const dirX = Math.cos(angle), dirY = Math.sin(angle);
    const dx = dummyObj.x - sx, dy = dummyObj.y - sy;
    const t = dx * dirX + dy * dirY;
    if(t < 0 || t > length) return false;
    const cx = sx + dirX * t, cy = sy + dirY * t;
    const ddx = dummyObj.x - cx, ddy = dummyObj.y - cy;
    return ddx*ddx + ddy*ddy < (dummyObj.radius + 15) ** 2;
}

// ========== ТАБЛИЧКА ==========
const sign = { x: 350, y: 250 };

let stats = { hits: 0, totalDamage: 0, gasterCount: 0 };
function updateStatsUI() {
    const h = document.getElementById('statHits'), d = document.getElementById('statDamage'), g = document.getElementById('statGaster');
    if(h) h.innerText = stats.hits; if(d) d.innerText = stats.totalDamage; if(g) g.innerText = stats.gasterCount;
}
function isPlayerNearSign() { const dx = player.x - sign.x, dy = player.y - sign.y; return dx*dx + dy*dy < 3025; }

// ========== СНАРЯДЫ ==========
let projectiles = [];
let cooldowns = { skill1: 0, skill2: 0, skill3: 0 };

class BoneProjectile {
    constructor(x, y, angle, damage = 10, speedBonus = 1.0) {
        this.x = x; this.y = y; this.angle = angle; this.damage = damage;
        this.speed = 11.5 * speedBonus; this.radius = 14; this.life = true;
    }
    update() { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; if(this.x < -200 || this.x > MAP_W+200 || this.y < -200 || this.y > MAP_H+200) this.life = false; }
    draw() {
        if(!isOnScreen(this.x, this.y, 50)) return;
        const sx = this.x - camera.x, sy = this.y - camera.y;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(this.angle);
        if(sprites.bone.complete) ctx.drawImage(sprites.bone, -18, -12, 36, 24);
        else { ctx.fillStyle = "#edd6aa"; ctx.fillRect(-14, -6, 28, 12); }
        ctx.restore();
    }
}

// ========== ГАСТЕР БЛАСТЕР ==========
let activeGasterBlasters = [];
class GasterBlaster {
    constructor(x, y, tx, ty) {
        this.x = x; this.y = y; this.angle = Math.atan2(ty - y, tx - x);
        this.frame = 0; this.maxFrames = 55; this.beamAlpha = 0; this.hasDamaged = false; this.size = 0;
        addLightSource(x, y, 160, [255,100,60], 0.85);
    }
    update() {
        this.frame++;
        if(this.frame < 22) {
            this.size = Math.min(1, this.frame / 22);
            if(this.frame >= 16 && this.frame <= 20 && !this.hasDamaged) {
                if(doesLaserHitDummy(this.x, this.y, this.angle, 600)) {
                    this.hasDamaged = true;
                    showDamageNumber(50, dummyObj.x, dummyObj.y);
                    stats.hits++; stats.totalDamage += 50; updateStatsUI();
                    addLightSource(dummyObj.x, dummyObj.y, 100, [255,140,80], 0.7);
                    dummyShake = 12;
                }
            }
        } else if(this.frame < 42) {
            this.beamAlpha = Math.min(1, (this.frame - 22) / 10); this.size = 1;
        } else {
            this.beamAlpha = Math.max(0, 1 - (this.frame - 42) / 13);
            if(this.frame >= this.maxFrames) return false;
        }
        return true;
    }
    draw() {
        if(!isOnScreen(this.x, this.y, 150) && this.beamAlpha === 0) return;
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const dirX = Math.cos(this.angle), dirY = Math.sin(this.angle);
        const curSize = 70 * (0.7 + this.size * 0.3);
        ctx.save();
        if(sprites.gaster.complete) {
            ctx.translate(sx, sy); ctx.rotate(this.angle + Math.PI/2);
            ctx.drawImage(sprites.gaster, -curSize/2, -curSize/2, curSize, curSize);
            ctx.restore(); ctx.save();
        }
        if(this.frame >= 22 && this.beamAlpha > 0) {
            const len = 1300, ex = this.x + dirX * len, ey = this.y + dirY * len;
            const sex = ex - camera.x, sey = ey - camera.y;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sex, sey);
            ctx.lineWidth = 32; ctx.strokeStyle = `rgba(255, 220, 100, ${this.beamAlpha * 0.35})`; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sex, sey);
            ctx.lineWidth = 18;
            const grad = ctx.createLinearGradient(sx, sy, sex, sey);
            grad.addColorStop(0, `rgba(255, 240, 150, ${this.beamAlpha})`);
            grad.addColorStop(0.5, `rgba(255, 220, 80, ${this.beamAlpha * 0.9})`);
            grad.addColorStop(1, `rgba(255, 180, 40, ${this.beamAlpha * 0.7})`);
            ctx.strokeStyle = grad;
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sex, sey);
            ctx.lineWidth = 6; ctx.strokeStyle = `rgba(255, 255, 200, ${this.beamAlpha})`; ctx.stroke();
            ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 220, 100, ${this.beamAlpha * 0.8})`; ctx.fill();
            ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 200, ${this.beamAlpha})`; ctx.fill();
        }
        ctx.restore();
    }
}

// ========== ЭФФЕКТЫ ==========
let effects = [];
function showDamageNumber(dmg, x, y) { effects.push({ type: "damageText", text: `${dmg}`, x, y, life: 25 }); }
function addFloatingText(msg, x, y, color="#fff0b5", isWorld = true) { effects.push({ type: "floatText", text: msg, x, y, life: 35, color, isWorld }); }
function addDashSparks(x, y) {
    for(let i = 0; i < 6; i++) {
        effects.push({ type: "spark", x: x + (Math.random() - 0.5) * 35, y: y + (Math.random() - 0.5) * 35, life: 12, vx: (Math.random() - 0.5) * 3.5, vy: (Math.random() - 0.5) * 3.5 - 1.5, isWorld: true });
    }
}

// ========== АТАКИ ==========
function castBoneShot() {
    if(cooldowns.skill1 > 0) return;
    cooldowns.skill1 = 6;
    const a = player.angle;
    projectiles.push(new BoneProjectile(player.x + Math.cos(a)*20, player.y + Math.sin(a)*20, a, 10, 1));
    addLightSource(player.x, player.y, 50, [255,200,120], 0.35);
    if(typeof updateCooldownUI === 'function') updateCooldownUI();
}

function castGasterBlaster() {
    if(cooldowns.skill2 > 0) {
        addFloatingText(`Гастер: ${Math.ceil(cooldowns.skill2/6)/10}с`, player.x, player.y-20, "#ff8866", true);
        return;
    }
    cooldowns.skill2 = 95;
    stats.gasterCount++;
    updateStatsUI();
    const radius = 180 + Math.random() * 100, ang = Math.random() * Math.PI * 2;
    let sx = player.x + Math.cos(ang) * radius, sy = player.y + Math.sin(ang) * radius;
    sx = Math.min(Math.max(sx, 80), MAP_W - 80);
    sy = Math.min(Math.max(sy, 80), MAP_H - 80);
    activeGasterBlasters.push(new GasterBlaster(sx, sy, player.x + Math.cos(player.angle)*100, player.y + Math.sin(player.angle)*100));
    addFloatingText("💀 GASTER BLASTER 💀", sx-40, sy-30, "#ffaa77", true);
    if(typeof updateCooldownUI === 'function') updateCooldownUI();
}

let volleyTimer = null;
function castBoneVolley() {
    if(cooldowns.skill3 > 0) {
        addFloatingText(`Залп: ${Math.ceil(cooldowns.skill3/6)/10}с`, player.x, player.y-20, "#d4aa76", true);
        return;
    }
    cooldowns.skill3 = 100;
    const baseAngle = player.angle;
    if(volleyTimer) clearTimeout(volleyTimer);
    for(let w = 0; w < 3; w++) {
        setTimeout(() => {
            const perpX = -Math.sin(baseAngle) * 13, perpY = Math.cos(baseAngle) * 13;
            const offsets = [-14, 0, 14];
            for(let off of offsets) {
                const sx = player.x + perpX * (off/10) + Math.cos(baseAngle)*22;
                const sy = player.y + perpY * (off/10) + Math.sin(baseAngle)*22;
                const bone = new BoneProjectile(sx, sy, baseAngle, 10, 1.45);
                bone.speed = 15.5;
                projectiles.push(bone);
                addLightSource(sx, sy, 40, [255,180,100], 0.25);
            }
            addFloatingText(`ВОЛНА ${w+1} - 30 УРОНА!`, player.x-40, player.y-20 - w*15, "#ffaa66", true);
        }, w * 210);
    }
    addFloatingText("🦴 ЗАЛП КОСТЕЙ (3x30) 🦴", player.x-80, player.y-40, "#ffcd94", true);
    if(typeof updateCooldownUI === 'function') updateCooldownUI();
}

function dashAction() {
    if(dash.active || dash.cooldown > 0 || !dash.canDash) { addFloatingText("рывок перезарядка", player.x, player.y-18, "#aaa", true); return; }
    dash.canDash = false; dash.active = true; dash.duration = 10;
    dash.trailPositions = [{x: player.x, y: player.y}]; dash.afterImages = [{x: player.x, y: player.y}];
    player.invincible = 18;
    addDashSparks(player.x, player.y);
    addLightSource(player.x, player.y, 110, [100,200,255], 0.6);
    addFloatingText("⚡ РЫВОК! ⚡", player.x-20, player.y-22, "#88ddff", true);
    if(typeof updateDashUI === 'function') updateDashUI();
}

function handleCollisions() {
    for(let i = projectiles.length-1; i >= 0; i--) {
        const p = projectiles[i];
        if(isHitDummy(p.x, p.y, p.radius)) {
            stats.hits++; stats.totalDamage += p.damage; updateStatsUI();
            showDamageNumber(p.damage, dummyObj.x, dummyObj.y);
            addLightSource(dummyObj.x, dummyObj.y, 60, [255,160,90], 0.45);
            dummyShake = 10;
            projectiles.splice(i,1);
        }
    }
}

function updateMovement() {
    let curSpeed = baseSpeed;
    let isMoving = false;
    
    if(dash.active && dash.duration > 0) {
        curSpeed = dash.speedBoost;
        dash.duration--;
        dash.afterImages.unshift({x: player.x, y: player.y});
        if(dash.afterImages.length > 6) dash.afterImages.pop();
        dash.trailPositions.unshift({x: player.x, y: player.y});
        if(dash.trailPositions.length > 12) dash.trailPositions.pop();
        if(dash.duration <= 0) {
            dash.active = false; dash.cooldown = 32;
            dash.trailPositions = []; dash.afterImages = [];
            setTimeout(() => { dash.canDash = true; if(typeof updateDashUI === 'function') updateDashUI(); }, 550);
        }
        isMoving = true;
    } else if(dash.cooldown > 0) {
        dash.cooldown--;
        if(typeof updateDashUI === 'function') updateDashUI();
    }
    
    let dx = (move.right ? 1 : 0) - (move.left ? 1 : 0);
    let dy = (move.down ? 1 : 0) - (move.up ? 1 : 0);
    if(dx !== 0 || dy !== 0) { const len = Math.hypot(dx, dy); dx /= len; dy /= len; isMoving = true; }
    
    let nx = player.x + dx * curSpeed, ny = player.y + dy * curSpeed;
    const prevX = player.x, prevY = player.y;
    
    if(!checkTreeCollision(nx, ny)) {
        player.x = Math.min(Math.max(nx, player.radius+20), MAP_W - player.radius-20);
        player.y = Math.min(Math.max(ny, player.radius+20), MAP_H - player.radius-20);
    }
    
    if(isMoving && !dash.active) {
        const moveDist = (player.x - prevX)*(player.x - prevX) + (player.y - prevY)*(player.y - prevY);
        if(moveDist > 4 && Math.random() < 0.3) addDustParticle(player.x, player.y);
    }
    if(dash.active && Math.random() < 0.5) addDustParticle(player.x, player.y);
    if(player.invincible > 0) player.invincible--;
    if(dummyShake > 0) dummyShake--;
    updateCamera();
}

function resetGame() { 
    player.hp = player.maxHp; 
    player.x = MAP_W/2; 
    player.y = MAP_H/2; 
    player.invincible = 0; 
    dash.active = false;
    dash.duration = 0;
    dash.cooldown = 0;
    dash.canDash = true;
    dash.trailPositions = [];
    dash.afterImages = [];
    if(typeof updateHealthUI === 'function') updateHealthUI(); 
    if(typeof updateDashUI === 'function') updateDashUI();
    updateCamera();
}

// ========== ОТРИСОВКА ==========
function drawShadowTopDown(wx, wy, rad, alpha = 0.35) {
    const sx = wx - camera.x, sy = wy - camera.y;
    ctx.beginPath(); ctx.ellipse(sx, sy + rad * 0.35, rad * 0.85, rad * 0.4, 0, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fill();
}

function drawLamps() {
    for(let lamp of lamps) {
        if(!isOnScreen(lamp.x, lamp.y, 100)) continue;
        const sx = lamp.x - camera.x, sy = lamp.y - camera.y;
        const sprite = lamp.active ? sprites.lamp_on : sprites.lamp_off;
        if(sprite.complete) ctx.drawImage(sprite, sx - 22, sy - 35, 44, 70);
        else { ctx.fillStyle = lamp.active ? "#ffaa66" : "#5a4a3a"; ctx.fillRect(sx - 15, sy - 30, 30, 50); }
    }
}

function drawSign() {
    if(!isOnScreen(sign.x, sign.y)) return;
    const sx = sign.x - camera.x, sy = sign.y - camera.y;
    if(sprites.sign.complete) ctx.drawImage(sprites.sign, sx - 32, sy - 32, 64, 64);
    if(isPlayerNearSign()) { ctx.font = "bold 13px monospace"; ctx.fillStyle = "#ffffaa"; ctx.fillText("📜 НАЖМИ E", sx-42, sy-40); }
}

function drawDummy() {
    if(!isOnScreen(dummyObj.x, dummyObj.y)) return;
    let shakeX = 0, shakeY = 0;
    if(dummyShake > 0) { const intensity = dummyShake / 3; shakeX = (Math.random() - 0.5) * intensity * 4; shakeY = (Math.random() - 0.5) * intensity * 3; }
    const sx = dummyObj.x - camera.x + shakeX, sy = dummyObj.y - camera.y + shakeY;
    drawShadowTopDown(dummyObj.x + shakeX, dummyObj.y + shakeY, dummyObj.radius, 0.4);
    if(sprites.dummy.complete) ctx.drawImage(sprites.dummy, sx - 32, sy - 32, 64, 64);
    ctx.font = "10px monospace"; ctx.fillStyle = "#ffaa66"; ctx.fillText("БЕССМЕРТЕН", sx-35, sy-38);
}

function drawSans() {
    const sx = player.x - camera.x, sy = player.y - camera.y;
    ctx.save();
    drawShadowTopDown(player.x, player.y, player.radius, 0.45);
    if(dash.active && dash.afterImages.length) {
        for(let i = 0; i < dash.afterImages.length; i++) {
            const img = dash.afterImages[i], isx = img.x - camera.x, isy = img.y - camera.y;
            const alpha = 0.3 - i * 0.045; if(alpha <= 0) continue;
            ctx.globalAlpha = alpha;
            ctx.beginPath(); ctx.arc(isx, isy, 20 - i*1.2, 0, Math.PI*2);
            ctx.fillStyle = `rgba(80, 200, 255, ${alpha})`; ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    if(sprites.sans.complete) { ctx.translate(sx, sy); ctx.rotate(player.angle + Math.PI/2); ctx.drawImage(sprites.sans, -26, -26, 52, 52); }
    ctx.restore();
    if(player.invincible > 0 && (Math.floor(Date.now() / 50) % 4 < 2)) { ctx.beginPath(); ctx.arc(sx, sy-2, 30, 0, Math.PI*2); ctx.strokeStyle = "#ffecb3"; ctx.lineWidth = 2.5; ctx.stroke(); }
    const ex = Math.cos(player.angle)*26, ey = Math.sin(player.angle)*26;
    ctx.beginPath(); ctx.moveTo(sx+ex, sy-4+ey); ctx.lineTo(sx+ex-5, sy-4+ey-5); ctx.lineTo(sx+ex+5, sy-4+ey-5);
    ctx.fillStyle = "#ffcc88aa"; ctx.fill();
}

function drawEffects() {
    for(let e of effects) {
        let dx = e.x, dy = e.y;
        if(e.isWorld !== false) { if(!isOnScreen(e.x, e.y, 150)) continue; dx = e.x - camera.x; dy = e.y - camera.y; }
        if(e.type === "floatText") { ctx.font = "14px monospace"; ctx.fillStyle = e.color; ctx.fillText(e.text, dx-22, dy - (30-e.life)/1.1); }
        else if(e.type === "damageText") { const size = 20 - Math.floor(e.life/6); ctx.font = `bold ${size}px monospace`; ctx.fillStyle = `rgba(255,100,50,${Math.min(1,e.life/10)})`; ctx.fillText(e.text, dx-10, dy - 12 - (22-e.life)); }
        else if(e.type === "spark") { ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, Math.PI*2); ctx.fillStyle = `rgba(255, 200, 100, ${e.life/12})`; ctx.fill(); }
    }
}

function updateProjectiles() { let i = projectiles.length; while(i--) { projectiles[i].update(); if(!projectiles[i].life) projectiles.splice(i,1); } }
function updateGasterBlasters() { let i = activeGasterBlasters.length; while(i--) { if(!activeGasterBlasters[i].update()) activeGasterBlasters.splice(i,1); } }
function updateCooldowns() { if(cooldowns.skill1 > 0) cooldowns.skill1--; if(cooldowns.skill2 > 0) cooldowns.skill2--; if(cooldowns.skill3 > 0) cooldowns.skill3--; if(typeof updateCooldownUI === 'function') updateCooldownUI(); }

function gameUpdate() { 
    updateMovement(); 
    updateProjectiles(); 
    handleCollisions(); 
    updateGasterBlasters(); 
    updateCooldowns(); 
    updateEffects();
    updateDustParticles();
    updateLightSources();
    updateLampGradients();
}

function render() { 
    drawTileFloor();
    drawEffects(); 
    for(let p of projectiles) p.draw(); 
    for(let g of activeGasterBlasters) g.draw(); 
    drawTrees(); 
    drawSign(); 
    drawLamps(); 
    drawDummy(); 
    drawSans(); 
    drawDustParticles();
    drawDynamicLighting();
}

function loop(currentTime) {
    requestAnimationFrame(loop);
    if(currentTime - lastFrameTime < FRAME_DELAY) return;
    lastFrameTime = currentTime;
    if(!gamePaused) gameUpdate();
    render();
}

window.addEventListener('load', () => {
    resetGame();
    loop(0);
});
