// ========== ПОЛНОЭКРАННАЯ ИГРА С HUD И СВЕТОВЫМ ЛАЗЕРОМ ==========

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ========== РАЗМЕРЫ ЭКРАНА (ВНУТРЕННЕЕ РАЗРЕШЕНИЕ) ==========
const SCREEN_W = 1100;
const SCREEN_H = 700;
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
ctx.imageSmoothingEnabled = false;

// ========== РАЗМЕРЫ КАРТЫ ==========
const MAP_W = 3000;
const MAP_H = 2500;

// ========== КАМЕРА ==========
let camera = { x: 0, y: 0, width: SCREEN_W, height: SCREEN_H };

function updateCamera() {
    let targetX = player.x - SCREEN_W / 2;
    let targetY = player.y - SCREEN_H / 2;
    camera.x = Math.min(Math.max(targetX, 0), MAP_W - SCREEN_W);
    camera.y = Math.min(Math.max(targetY, 0), MAP_H - SCREEN_H);
}

function worldToScreen(worldX, worldY) {
    return { x: worldX - camera.x, y: worldY - camera.y };
}

function isOnScreen(worldX, worldY, margin = 100) {
    return (worldX + margin > camera.x && worldX - margin < camera.x + SCREEN_W &&
            worldY + margin > camera.y && worldY - margin < camera.y + SCREEN_H);
}

// ========== ЗАГРУЗКА СПРАЙТОВ ==========
const sprites = {
    sans: new Image(), dummy: new Image(), gaster: new Image(), 
    bone: new Image(), sign: new Image(), 
    lamp_on: new Image(), lamp_off: new Image(),
    grass: new Image(), grass_flower: new Image()
};

let loadedCount = 0;
const totalSprites = 9;

function checkAllSpritesLoaded() { 
    if(++loadedCount === totalSprites) {
        console.log("Все спрайты загружены!");
        generateTileMap();
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

// ========== ТАЙЛОВАЯ СИСТЕМА ==========
const TILE_SIZE = 32;
const TILES_WIDE = Math.ceil(MAP_W / TILE_SIZE);
const TILES_HIGH = Math.ceil(MAP_H / TILE_SIZE);
let tileMap = [];

function generateTileMap() {
    tileMap = [];
    for(let row = 0; row < TILES_HIGH; row++) {
        tileMap[row] = [];
        for(let col = 0; col < TILES_WIDE; col++) {
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;
            const distToEdge = Math.min(x, MAP_W - x, y, MAP_H - y);
            let type = 'grass';
            if(distToEdge < 200) {
                type = Math.random() < 0.5 ? 'grass_flower' : 'grass';
            } else if(Math.random() < 0.06) {
                type = 'grass_flower';
            }
            tileMap[row][col] = { type, x, y };
        }
    }
}

function drawTileFloor() {
    if(!tileMap.length) {
        ctx.fillStyle = "#4a7a4a";
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        return;
    }
    
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(TILES_WIDE, Math.ceil((camera.x + SCREEN_W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endRow = Math.min(TILES_HIGH, Math.ceil((camera.y + SCREEN_H) / TILE_SIZE) + 1);
    
    for(let row = startRow; row < endRow; row++) {
        for(let col = startCol; col < endCol; col++) {
            const tile = tileMap[row][col];
            if(!tile) continue;
            const screenPos = worldToScreen(tile.x, tile.y);
            if(screenPos.x + TILE_SIZE < 0 || screenPos.x > SCREEN_W ||
               screenPos.y + TILE_SIZE < 0 || screenPos.y > SCREEN_H) continue;
            
            let sprite = tile.type === 'grass' ? sprites.grass : sprites.grass_flower;
            if(sprite && sprite.complete && sprite.naturalWidth > 0) {
                ctx.drawImage(sprite, screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = tile.type === 'grass' ? '#4a7a4a' : '#6a9a6a';
                ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// ========== ЛАМПЫ ==========
let lamps = [
    { x: 350, y: 280, radius: 140, color: [255,220,150], baseIntensity: 0.85, phase: 0, speed: 0.02, active: true },
    { x: 850, y: 450, radius: 130, color: [255,220,150], baseIntensity: 0.8, phase: 1.5, speed: 0.025, active: true },
    { x: 1400, y: 600, radius: 140, color: [255,220,150], baseIntensity: 0.85, phase: 3, speed: 0.018, active: true },
    { x: 2100, y: 350, radius: 130, color: [255,200,120], baseIntensity: 0.75, phase: 2, speed: 0.022, active: true },
    { x: 2600, y: 800, radius: 130, color: [255,200,120], baseIntensity: 0.75, phase: 4, speed: 0.02, active: true },
    { x: 1800, y: 1800, radius: 120, color: [255,220,150], baseIntensity: 0.8, phase: 0.5, speed: 0.028, active: true },
    { x: 900, y: 2000, radius: 140, color: [255,220,150], baseIntensity: 0.85, phase: 1, speed: 0.022, active: true },
    { x: 500, y: 1500, radius: 130, color: [255,200,120], baseIntensity: 0.75, phase: 2.5, speed: 0.02, active: true },
    { x: 2200, y: 1400, radius: 130, color: [255,220,150], baseIntensity: 0.8, phase: 3.5, speed: 0.025, active: true },
    { x: 2700, y: 2100, radius: 140, color: [255,220,150], baseIntensity: 0.85, phase: 4.5, speed: 0.018, active: true },
];

let lampTime = 0;

function updateLampGradients() { lampTime += 0.016; }

function checkLampClick(worldX, worldY) {
    for(let i = 0; i < lamps.length; i++) {
        const lamp = lamps[i];
        const dx = worldX - lamp.x;
        const dy = worldY - (lamp.y - 15);
        if(Math.hypot(dx, dy) < 30) {
            lamp.active = !lamp.active;
            addFloatingText(lamp.active ? "💡 ЛАМПА ВКЛЮЧЕНА" : "💡 ЛАМПА ВЫКЛЮЧЕНА", lamp.x, lamp.y-40, lamp.active ? "#aaffaa" : "#ffaa66", true);
            break;
        }
    }
}

// ========== ЧАСТИЦЫ ПЫЛИ ==========
let dustParticles = [];

function addDustParticle(x, y) {
    dustParticles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + 15,
        life: 20,
        size: 2 + Math.random() * 4,
        alpha: 0.4 + Math.random() * 0.3
    });
}

function updateDustParticles() {
    for(let i = dustParticles.length-1; i >= 0; i--) {
        dustParticles[i].life--;
        dustParticles[i].y += 1;
        dustParticles[i].alpha -= 0.02;
        if(dustParticles[i].life <= 0 || dustParticles[i].alpha <= 0) {
            dustParticles.splice(i,1);
        }
    }
}

function drawDustParticles() {
    for(let p of dustParticles) {
        const screenPos = worldToScreen(p.x, p.y);
        if(!isOnScreen(p.x, p.y)) continue;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, p.size * (p.life/20), 0, Math.PI*2);
        ctx.fillStyle = `rgba(120, 100, 70, ${p.alpha * (p.life/20)})`;
        ctx.fill();
    }
}

// ========== ДИНАМИЧЕСКОЕ ОСВЕЩЕНИЕ ==========
let lightSources = [];
let ambientDarkness = 0.3;

function addLightSource(x, y, radius, color = [255,200,100], intensity = 0.7) {
    lightSources.push({ x, y, radius, color, intensity, life: 22, maxLife: 22 });
}

function updateLightSources() {
    for(let i = lightSources.length-1; i >= 0; i--) {
        lightSources[i].life--;
        lightSources[i].intensity = lightSources[i].life / lightSources[i].maxLife;
        if(lightSources[i].life <= 0) lightSources.splice(i,1);
    }
}

function drawDynamicLighting() {
    ctx.fillStyle = `rgba(0,0,0,${ambientDarkness})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalCompositeOperation = 'lighter';
    
    for(let i = 0; i < lamps.length; i++) {
        const lamp = lamps[i];
        if(lamp.active) {
            const screenPos = worldToScreen(lamp.x, lamp.y - 15);
            const flicker = 0.85 + Math.sin(lampTime * lamp.speed + lamp.phase) * 0.12;
            const intensity = lamp.baseIntensity * flicker;
            const grad = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, lamp.radius);
            grad.addColorStop(0, `rgba(${lamp.color[0]},${lamp.color[1]},${lamp.color[2]}, ${intensity})`);
            grad.addColorStop(0.4, `rgba(${lamp.color[0]},${lamp.color[1]},${lamp.color[2]}, ${intensity * 0.45})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
    }
    
    for(let src of lightSources) {
        const screenPos = worldToScreen(src.x, src.y);
        const grad = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, src.radius);
        grad.addColorStop(0, `rgba(${src.color[0]},${src.color[1]},${src.color[2]}, ${src.intensity * 0.8})`);
        grad.addColorStop(0.5, `rgba(${src.color[0]},${src.color[1]},${src.color[2]}, ${src.intensity * 0.3})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    
    ctx.globalCompositeOperation = 'source-over';
    
    if(!window.vignetteGrad) {
        window.vignetteGrad = ctx.createRadialGradient(SCREEN_W/2, SCREEN_H/2, 300, SCREEN_W/2, SCREEN_H/2, 550);
        window.vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        window.vignetteGrad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        window.vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    }
    ctx.fillStyle = window.vignetteGrad;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

// ========== ИГРОК ==========
let player = {
    x: MAP_W/2, y: MAP_H/2, radius: 22,
    hp: 24, maxHp: 24, invincible: 0, angle: 0
};
let move = { up: false, down: false, left: false, right: false };
let baseSpeed = 5.2;

// ========== РЫВОК (ИСПРАВЛЕННЫЙ) ==========
let dash = { 
    active: false, duration: 0, cooldown: 0, speedBoost: 16.5, 
    trailPositions: [], afterImages: [],
    canDash: true
};

// ========== МАНЕКЕН ==========
const dummyObj = { x: MAP_W - 350, y: MAP_H/2, radius: 35 };
function isHitDummy(x, y, rad) { 
    const dx = x - dummyObj.x, dy = y - dummyObj.y;
    return (dx*dx + dy*dy) < (dummyObj.radius + rad) ** 2;
}

function doesLaserHitDummy(startX, startY, angle, length) {
    const dirX = Math.cos(angle), dirY = Math.sin(angle);
    const dx = dummyObj.x - startX, dy = dummyObj.y - startY;
    const t = dx * dirX + dy * dirY;
    if(t < 0 || t > length) return false;
    const closestX = startX + dirX * t, closestY = startY + dirY * t;
    return Math.hypot(dummyObj.x - closestX, dummyObj.y - closestY) < dummyObj.radius + 15;
}

// ========== ТАБЛИЧКА ==========
const sign = { x: 350, y: 250 };
let windowOpen = false;
let stats = { hits: 0, totalDamage: 0, gasterCount: 0 };

function updateStatsUI() {
    document.getElementById('statHits').innerText = stats.hits;
    document.getElementById('statDamage').innerText = stats.totalDamage;
    document.getElementById('statGaster').innerText = stats.gasterCount;
}
function isPlayerNearSign() { 
    const dx = player.x - sign.x, dy = player.y - sign.y;
    return (dx*dx + dy*dy) < 3025;
}

// ========== СНАРЯДЫ ==========
let projectiles = [];

class BoneProjectile {
    constructor(x, y, angle, damage = 10, speedBonus = 1.0) {
        this.x = x; this.y = y; this.angle = angle;
        this.damage = damage; this.speed = 11.5 * speedBonus;
        this.radius = 14; this.life = true;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        if(this.x < -200 || this.x > MAP_W+200 || this.y < -200 || this.y > MAP_H+200) this.life = false;
    }
    draw() {
        const screenPos = worldToScreen(this.x, this.y);
        if(!isOnScreen(this.x, this.y)) return;
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.angle);
        if (sprites.bone.complete) ctx.drawImage(sprites.bone, -18, -12, 36, 24);
        else { ctx.fillStyle = "#edd6aa"; ctx.fillRect(-14, -6, 28, 12); }
        ctx.restore();
    }
}

// ========== ГАСТЕР БЛАСТЕР (СВЕТОВОЙ ЛАЗЕР) ==========
let activeGasterBlasters = [];

class GasterBlaster {
    constructor(x, y, targetX, targetY) {
        this.x = x; this.y = y;
        this.angleToTarget = Math.atan2(targetY - y, targetX - x);
        this.frame = 0; this.maxFrames = 55;
        this.beamAlpha = 0; 
        this.hasDamaged = false;
        this.size = 0;
        addLightSource(x, y, 160, [255,100,60], 0.85);
    }
    
    update() {
        this.frame++;
        if(this.frame < 22) {
            this.size = Math.min(1, this.frame / 22);
            if(this.frame >= 16 && this.frame <= 20 && !this.hasDamaged) {
                if(doesLaserHitDummy(this.x, this.y, this.angleToTarget, 600)) {
                    this.hasDamaged = true;
                    showDamageNumber(50, dummyObj.x, dummyObj.y);
                    stats.hits++; stats.totalDamage += 50;
                    updateStatsUI();
                    addLightSource(dummyObj.x, dummyObj.y, 100, [255,140,80], 0.7);
                }
            }
        } else if(this.frame < 42) {
            this.beamAlpha = Math.min(1, (this.frame - 22) / 10);
            this.size = 1;
        } else {
            this.beamAlpha = Math.max(0, 1 - (this.frame - 42) / 13);
            if(this.frame >= this.maxFrames) return false;
        }
        return true;
    }
    
    draw() {
        const screenPos = worldToScreen(this.x, this.y);
        if(!isOnScreen(this.x, this.y) && this.beamAlpha === 0) return;
        
        const dirX = Math.cos(this.angleToTarget), dirY = Math.sin(this.angleToTarget);
        const currentSize = 70 * (0.7 + this.size * 0.3);
        
        ctx.save();
        if (sprites.gaster.complete) {
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(this.angleToTarget + Math.PI/2);
            ctx.drawImage(sprites.gaster, -currentSize/2, -currentSize/2, currentSize, currentSize);
            ctx.restore();
            ctx.save();
        }
        
        // ========== СВЕТОВОЙ ЛАЗЕР ==========
        if(this.frame >= 22 && this.beamAlpha > 0) {
            const beamLength = 650;
            const endX = this.x + dirX * beamLength;
            const endY = this.y + dirY * beamLength;
            const screenEnd = worldToScreen(endX, endY);
            
            // Внешнее свечение
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenEnd.x, screenEnd.y);
            ctx.lineWidth = 32;
            ctx.strokeStyle = `rgba(255, 220, 100, ${this.beamAlpha * 0.35})`;
            ctx.stroke();
            
            // Основной луч (жёлто-белый)
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenEnd.x, screenEnd.y);
            ctx.lineWidth = 18;
            
            const gradient = ctx.createLinearGradient(screenPos.x, screenPos.y, screenEnd.x, screenEnd.y);
            gradient.addColorStop(0, `rgba(255, 240, 150, ${this.beamAlpha})`);
            gradient.addColorStop(0.5, `rgba(255, 220, 80, ${this.beamAlpha * 0.9})`);
            gradient.addColorStop(1, `rgba(255, 180, 40, ${this.beamAlpha * 0.7})`);
            ctx.strokeStyle = gradient;
            ctx.stroke();
            
            // Яркая сердцевина
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenEnd.x, screenEnd.y);
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(255, 255, 200, ${this.beamAlpha})`;
            ctx.stroke();
            
            // Вспышка в дуле бластера
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 16, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 220, 100, ${this.beamAlpha * 0.8})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 200, ${this.beamAlpha})`;
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ========== ЭФФЕКТЫ ==========
let effects = [];

function showDamageNumber(damage, x, y) {
    effects.push({ type: "damageText", text: `${damage}`, x, y, life: 25 });
}
function addFloatingText(msg, x, y, color="#fff0b5", isWorld = true) {
    effects.push({ type: "floatText", text: msg, x, y, life: 35, color, isWorld });
}
function addDashSparks(x, y) {
    for(let i = 0; i < 8; i++) {
        effects.push({
            type: "spark", x: x + (Math.random() - 0.5) * 35, y: y + (Math.random() - 0.5) * 35,
            life: 12, vx: (Math.random() - 0.5) * 3.5, vy: (Math.random() - 0.5) * 3.5 - 1.5, isWorld: true
        });
    }
}

// ========== КУЛДАУНЫ ==========
let cooldowns = { skill1: 0, skill2: 0, skill3: 0 };

// ========== КУРСОР ==========
let cursorWorld = { x: player.x, y: player.y };
let mouseInCanvas = false;

function updateCursor(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;
    cursorWorld.x = Math.min(Math.max(screenX + camera.x, 0), MAP_W);
    cursorWorld.y = Math.min(Math.max(screenY + camera.y, 0), MAP_H);
    player.angle = Math.atan2(cursorWorld.y - player.y, cursorWorld.x - player.x);
}

canvas.addEventListener('mousemove', (e) => { mouseInCanvas = true; updateCursor(e.clientX, e.clientY); });
canvas.addEventListener('mouseleave', () => { mouseInCanvas = false; });
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    checkLampClick(screenX + camera.x, screenY + camera.y);
});
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); updateCursor(e.touches[0].clientX, e.touches[0].clientY); });
canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    updateCursor(e.touches[0].clientX, e.touches[0].clientY);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const screenX = (e.touches[0].clientX - rect.left) * scaleX;
    const screenY = (e.touches[0].clientY - rect.top) * scaleY;
    checkLampClick(screenX + camera.x, screenY + camera.y);
});

// ========== АТАКИ ==========
function castBoneShot() {
    if(cooldowns.skill1 > 0) return;
    cooldowns.skill1 = 6;
    const a = player.angle;
    projectiles.push(new BoneProjectile(player.x + Math.cos(a)*20, player.y + Math.sin(a)*20, a, 10, 1));
    addLightSource(player.x, player.y, 50, [255,200,120], 0.35);
    updateCooldownUI();
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
    let sx = cursorWorld.x + Math.cos(ang) * radius, sy = cursorWorld.y + Math.sin(ang) * radius;
    sx = Math.min(Math.max(sx, 80), MAP_W - 80);
    sy = Math.min(Math.max(sy, 80), MAP_H - 80);
    activeGasterBlasters.push(new GasterBlaster(sx, sy, cursorWorld.x, cursorWorld.y));
    addFloatingText("💀 GASTER BLASTER 💀", sx-40, sy-30, "#ffaa77", true);
    updateCooldownUI();
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
    updateCooldownUI();
}

// ========== КОЛЛИЗИИ ==========
function handleCollisions() {
    for(let i = projectiles.length-1; i >= 0; i--) {
        const p = projectiles[i];
        if(isHitDummy(p.x, p.y, p.radius)) {
            stats.hits++; stats.totalDamage += p.damage;
            updateStatsUI();
            showDamageNumber(p.damage, dummyObj.x, dummyObj.y);
            addLightSource(dummyObj.x, dummyObj.y, 60, [255,160,90], 0.45);
            projectiles.splice(i,1);
        }
    }
}

// ========== ДВИЖЕНИЕ ==========
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
            dash.active = false;
            dash.cooldown = 32;
            dash.trailPositions = [];
            dash.afterImages = [];
            setTimeout(() => {
                dash.canDash = true;
                updateDashUI();
            }, 550);
        }
        isMoving = true;
    } else if(dash.cooldown > 0) {
        dash.cooldown--;
        updateDashUI();
    }
    
    let dx = (move.right ? 1 : 0) - (move.left ? 1 : 0);
    let dy = (move.down ? 1 : 0) - (move.up ? 1 : 0);
    if(dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len; dy /= len;
        isMoving = true;
    }
    
    let nx = player.x + dx * curSpeed;
    let ny = player.y + dy * curSpeed;
    const prevX = player.x, prevY = player.y;
    player.x = Math.min(Math.max(nx, player.radius+20), MAP_W - player.radius-20);
    player.y = Math.min(Math.max(ny, player.radius+20), MAP_H - player.radius-20);
    
    if(isMoving && !dash.active) {
        const moveDist = Math.hypot(player.x - prevX, player.y - prevY);
        if(moveDist > 2 && Math.random() < 0.3) addDustParticle(player.x, player.y);
    }
    if(dash.active && Math.random() < 0.5) addDustParticle(player.x, player.y);
    if(player.invincible > 0) player.invincible--;
    
    updateCamera();
}

function dashAction() {
    if(dash.active || dash.cooldown > 0 || !dash.canDash) { 
        addFloatingText("рывок перезарядка", player.x, player.y-18, "#aaa", true); 
        return; 
    }
    
    dash.canDash = false;
    dash.active = true; 
    dash.duration = 10;
    dash.trailPositions = [{x: player.x, y: player.y}];
    dash.afterImages = [{x: player.x, y: player.y}];
    player.invincible = 18;
    addDashSparks(player.x, player.y);
    addLightSource(player.x, player.y, 110, [100,200,255], 0.6);
    addFloatingText("⚡ РЫВОК! ⚡", player.x-20, player.y-22, "#88ddff", true);
    updateDashUI();
}

function updateProjectiles() { 
    for(let i = projectiles.length-1; i >= 0; i--) {
        projectiles[i].update();
        if(!projectiles[i].life) projectiles.splice(i,1);
    }
}
function updateGasterBlasters() { 
    for(let i = activeGasterBlasters.length-1; i >= 0; i--) {
        if(!activeGasterBlasters[i].update()) activeGasterBlasters.splice(i,1);
    }
}
function updateCooldowns() { 
    if(cooldowns.skill1 > 0) cooldowns.skill1--;
    if(cooldowns.skill2 > 0) cooldowns.skill2--;
    if(cooldowns.skill3 > 0) cooldowns.skill3--;
    updateCooldownUI();
}
function updateEffects() {
    for(let i = effects.length-1; i >= 0; i--) {
        effects[i].life--;
        if(effects[i].type === "spark") { 
            effects[i].x += effects[i].vx; 
            effects[i].y += effects[i].vy; 
        }
        if(effects[i].life <= 0) effects.splice(i,1);
    }
}

// ========== UI ФУНКЦИИ ==========
function updateDashUI() { 
    const dashEl = document.getElementById('dashReady');
    if(dashEl) {
        if(dash.active) dashEl.innerText = "РЫВОК";
        else if(dash.cooldown > 0) dashEl.innerText = `${Math.ceil(dash.cooldown/6)/10}с`;
        else dashEl.innerText = "ГОТОВ";
    }
}
function updateCooldownUI() {
    const skill1 = document.getElementById('skill1Hud');
    const skill2 = document.getElementById('skill2Hud');
    const skill3 = document.getElementById('skill3Hud');
    if(skill1) skill1.classList.toggle('cooldown-active', cooldowns.skill1 > 0);
    if(skill2) skill2.classList.toggle('cooldown-active', cooldowns.skill2 > 0);
    if(skill3) skill3.classList.toggle('cooldown-active', cooldowns.skill3 > 0);
}
function updateHealthUI() { 
    const hpEl = document.getElementById('hpValue');
    if(hpEl) hpEl.innerText = player.hp; 
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
    updateHealthUI(); 
    updateDashUI();
    updateCamera();
}

// ========== ТЕНЬ ==========
function drawShadowTopDown(worldX, worldY, radius, alpha = 0.35) {
    const screenPos = worldToScreen(worldX, worldY);
    ctx.beginPath();
    ctx.ellipse(screenPos.x, screenPos.y + radius * 0.35, radius * 0.85, radius * 0.4, 0, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fill();
}

// ========== ОТРИСОВКА ==========
function drawLamps() {
    for(let lamp of lamps) {
        if(!isOnScreen(lamp.x, lamp.y, 100)) continue;
        const screenPos = worldToScreen(lamp.x, lamp.y);
        const sprite = lamp.active ? sprites.lamp_on : sprites.lamp_off;
        if(sprite.complete) {
            ctx.drawImage(sprite, screenPos.x - 22, screenPos.y - 35, 44, 70);
        } else {
            ctx.fillStyle = lamp.active ? "#ffaa66" : "#5a4a3a";
            ctx.fillRect(screenPos.x - 15, screenPos.y - 30, 30, 50);
        }
    }
}

function drawSign() {
    if(!isOnScreen(sign.x, sign.y)) return;
    const screenPos = worldToScreen(sign.x, sign.y);
    if(sprites.sign.complete) ctx.drawImage(sprites.sign, screenPos.x - 32, screenPos.y - 32, 64, 64);
    if(isPlayerNearSign()) {
        ctx.font = "bold 13px monospace";
        ctx.fillStyle = "#ffffaa";
        ctx.fillText("📜 НАЖМИ E", screenPos.x-42, screenPos.y-40);
    }
}

function drawDummy() {
    if(!isOnScreen(dummyObj.x, dummyObj.y)) return;
    drawShadowTopDown(dummyObj.x, dummyObj.y, dummyObj.radius, 0.4);
    const screenPos = worldToScreen(dummyObj.x, dummyObj.y);
    if(sprites.dummy.complete) ctx.drawImage(sprites.dummy, screenPos.x - 32, screenPos.y - 32, 64, 64);
    ctx.font = "10px monospace"; 
    ctx.fillStyle = "#ffaa66"; 
    ctx.fillText("БЕССМЕРТЕН", screenPos.x-35, screenPos.y-38);
}

function drawSans() {
    const screenPos = worldToScreen(player.x, player.y);
    ctx.save();
    drawShadowTopDown(player.x, player.y, player.radius, 0.45);
    
    if(dash.active && dash.afterImages.length) {
        for(let i = 0; i < dash.afterImages.length; i++) {
            const img = dash.afterImages[i];
            const imgScreen = worldToScreen(img.x, img.y);
            const alpha = 0.3 - i * 0.045;
            if(alpha <= 0) continue;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(imgScreen.x, imgScreen.y, 20 - i*1.2, 0, Math.PI*2);
            ctx.fillStyle = `rgba(80, 200, 255, ${alpha})`;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    if(sprites.sans.complete) {
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(player.angle + Math.PI/2);
        ctx.drawImage(sprites.sans, -26, -26, 52, 52);
    }
    ctx.restore();
    
    if(player.invincible > 0 && (Math.floor(Date.now() / 50) % 4 < 2)) {
        ctx.beginPath(); ctx.arc(screenPos.x, screenPos.y-2, 30, 0, Math.PI*2);
        ctx.strokeStyle = "#ffecb3"; ctx.lineWidth = 2.5; ctx.stroke();
    }
    
    const ex = Math.cos(player.angle)*26, ey = Math.sin(player.angle)*26;
    ctx.beginPath(); 
    ctx.moveTo(screenPos.x+ex, screenPos.y-4+ey);
    ctx.lineTo(screenPos.x+ex-5, screenPos.y-4+ey-5);
    ctx.lineTo(screenPos.x+ex+5, screenPos.y-4+ey-5);
    ctx.fillStyle = "#ffcc88aa"; 
    ctx.fill();
}

function drawEffects() {
    for(let e of effects) {
        let drawX = e.x, drawY = e.y;
        if(e.isWorld !== false) {
            const screenPos = worldToScreen(e.x, e.y);
            drawX = screenPos.x; drawY = screenPos.y;
        }
        if(e.type === "floatText") { 
            ctx.font = "14px monospace"; 
            ctx.fillStyle = e.color; 
            ctx.fillText(e.text, drawX-22, drawY - (30-e.life)/1.1); 
        }
        else if(e.type === "damageText") { 
            const size = 20 - Math.floor(e.life/6);
            ctx.font = `bold ${size}px monospace`; 
            ctx.fillStyle = `rgba(255,100,50,${Math.min(1,e.life/10)})`; 
            ctx.fillText(e.text, drawX-10, drawY - 12 - (22-e.life)); 
        }
        else if(e.type === "spark") { 
            ctx.beginPath(); ctx.arc(drawX, drawY, 2.5, 0, Math.PI*2); 
            ctx.fillStyle = `rgba(255, 200, 100, ${e.life/12})`; 
            ctx.fill(); 
        }
    }
}

function drawCursorMarker() {
    if(!mouseInCanvas) return;
    const screenCursor = worldToScreen(cursorWorld.x, cursorWorld.y);
    ctx.beginPath(); ctx.arc(screenCursor.x, screenCursor.y, 7, 0, Math.PI*2); 
    ctx.strokeStyle = "#ffaa44"; ctx.lineWidth = 1.5; ctx.setLineDash([4,5]); ctx.stroke();
    ctx.beginPath(); ctx.arc(screenCursor.x, screenCursor.y, 2.5, 0, Math.PI*2); 
    ctx.fillStyle = "#ffaa66aa"; ctx.fill(); ctx.setLineDash([]);
}

function drawDirectionLine() {
    if(!mouseInCanvas) return;
    const screenPos = worldToScreen(player.x, player.y);
    const tx = screenPos.x + Math.cos(player.angle)*45, ty = screenPos.y + Math.sin(player.angle)*45;
    ctx.beginPath(); ctx.moveTo(screenPos.x, screenPos.y); ctx.lineTo(tx, ty); 
    ctx.strokeStyle = "#fffbd0aa"; ctx.lineWidth = 1.5; ctx.setLineDash([5,7]); ctx.stroke();
    ctx.setLineDash([]);
}

function updateLighting() { updateLightSources(); }

// ========== ОКНО ==========
const infoWindow = document.getElementById('infoWindow');
const closeBtn = document.getElementById('closeWindowBtn');
function openInfoWindow() { if(!windowOpen) { updateStatsUI(); infoWindow.style.display = 'flex'; windowOpen = true; } }
function closeInfoWindow() { infoWindow.style.display = 'none'; windowOpen = false; }
closeBtn.addEventListener('click', closeInfoWindow);
window.addEventListener('click', (e) => { if(windowOpen && !infoWindow.contains(e.target) && e.target !== canvas) closeInfoWindow(); });
window.addEventListener('keydown', (e) => {
    if(e.key === 'e' || e.key === 'E') {
        if(isPlayerNearSign() && !windowOpen) { e.preventDefault(); openInfoWindow(); }
        else if(windowOpen) { closeInfoWindow(); }
    }
});

// ========== УПРАВЛЕНИЕ ==========
window.addEventListener('keydown', (e) => {
    const k = e.key;
    if(k === 'w' || k === 'W') move.up = true;
    if(k === 's' || k === 'S') move.down = true;
    if(k === 'a' || k === 'A') move.left = true;
    if(k === 'd' || k === 'D') move.right = true;
    if(k === ' ') { e.preventDefault(); dashAction(); }
    if(k === '1') { e.preventDefault(); castBoneShot(); }
    if(k === '2') { e.preventDefault(); castGasterBlaster(); }
    if(k === '3') { e.preventDefault(); castBoneVolley(); }
    if(k === 'r' || k === 'R') { resetGame(); addFloatingText("❤️ ЗДОРОВЬЕ ВОССТАНОВЛЕНО", player.x-80, player.y-40, "#aaffaa", true); }
});
window.addEventListener('keyup', (e) => {
    const k = e.key;
    if(k === 'w' || k === 'W') move.up = false;
    if(k === 's' || k === 'S') move.down = false;
    if(k === 'a' || k === 'A') move.left = false;
    if(k === 'd' || k === 'D') move.right = false;
});
canvas.addEventListener('click', () => canvas.focus());
canvas.focus();

// ========== ПОЛНОЭКРАННЫЙ РЕЖИМ ==========
function resizeCanvas() {
    const gameAspect = SCREEN_W / SCREEN_H;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;
    if (newWidth / newHeight > gameAspect) {
        newWidth = newHeight * gameAspect;
    } else {
        newHeight = newWidth / gameAspect;
    }
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    canvas.style.left = `${(window.innerWidth - newWidth) / 2}px`;
    canvas.style.top = `${(window.innerHeight - newHeight) / 2}px`;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setTimeout(resizeCanvas, 100));
    } else {
        document.exitFullscreen().then(() => setTimeout(resizeCanvas, 100));
    }
}

window.addEventListener('resize', () => setTimeout(resizeCanvas, 50));
document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 50));

const fullscreenBtn = document.getElementById('fullscreenBtn');
if(fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

setTimeout(resizeCanvas, 100);

// ========== ИНИЦИАЛИЗАЦИЯ ==========
tileMap = [];
for(let row = 0; row < TILES_HIGH; row++) {
    tileMap[row] = [];
    for(let col = 0; col < TILES_WIDE; col++) {
        tileMap[row][col] = { type: 'grass', x: col * TILE_SIZE, y: row * TILE_SIZE };
    }
}
updateCamera();
updateHealthUI();
updateDashUI();

// ========== ГЛАВНЫЙ ЦИКЛ ==========
function gameUpdate() { 
    updateMovement(); 
    updateProjectiles(); 
    handleCollisions(); 
    updateGasterBlasters(); 
    updateCooldowns(); 
    updateEffects();
    updateDustParticles();
    updateLighting();
    updateLampGradients();
}

function render() { 
    drawTileFloor();
    drawEffects(); 
    for(let p of projectiles) p.draw(); 
    for(let g of activeGasterBlasters) g.draw(); 
    drawLamps();
    drawSign(); 
    drawDummy(); 
    drawSans(); 
    drawDustParticles();
    drawDirectionLine(); 
    drawCursorMarker();
    drawDynamicLighting();
}

function loop() { 
    gameUpdate(); 
    render(); 
    requestAnimationFrame(loop);
}

resetGame();
loop();