// ========== pc.js — ПК УПРАВЛЕНИЕ ==========
// GitTale v0.1.1

let mouseInCanvas = false;
let lastActionTime = 0;
const ACTION_COOLDOWN = 100; // 100 мс

// ========== АДМИН-ПАНЕЛЬ ПЕРЕМЕННЫЕ ==========
let godMode = false;
let lightingEnabled = true;
let particlesEnabled = true;
let shakeEnabled = true;
let timeScale = 1.0;
let showHitboxes = false;

function canPerformAction() {
    const now = Date.now();
    if(now - lastActionTime >= ACTION_COOLDOWN) {
        lastActionTime = now;
        return true;
    }
    return false;
}

function updateCursor(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const sx = (clientX - rect.left) * scaleX, sy = (clientY - rect.top) * scaleY;
    cursorWorld.x = Math.min(Math.max(sx + camera.x, 0), MAP_W);
    cursorWorld.y = Math.min(Math.max(sy + camera.y, 0), MAP_H);
    player.angle = Math.atan2(cursorWorld.y - player.y, cursorWorld.x - player.x);
}

// ========== FPS СЧЁТЧИК ==========
let fps = 0;
let fpsCount = 0;
let fpsLastTime = performance.now();

function updateFPS() {
    fpsCount++;
    const now = performance.now();
    if(now - fpsLastTime >= 1000) {
        fps = fpsCount;
        fpsCount = 0;
        fpsLastTime = now;
        const fpsEl = document.getElementById('fpsCounter');
        if(fpsEl) fpsEl.innerText = fps;
    }
}

function updateDebugCoords() {
    const xEl = document.getElementById('playerX');
    const yEl = document.getElementById('playerY');
    if(xEl) xEl.innerText = Math.floor(player.x);
    if(yEl) yEl.innerText = Math.floor(player.y);
}

// ========== КЛАВИАТУРА ==========
window.addEventListener('keydown', (e) => {
    if(gamePaused) return;
    const k = e.key;
    // WASD (английская раскладка)
    if(k === 'w' || k === 'W') moveInput.up = true;
    if(k === 's' || k === 'S') moveInput.down = true;
    if(k === 'a' || k === 'A') moveInput.left = true;
    if(k === 'd' || k === 'D') moveInput.right = true;
    // ЦФЫВ (русская раскладка)
    if(k === 'ц' || k === 'Ц') moveInput.up = true;
    if(k === 'ы' || k === 'Ы') moveInput.down = true;
    if(k === 'ф' || k === 'Ф') moveInput.left = true;
    if(k === 'в' || k === 'В') moveInput.right = true;
    
    // АТАКИ С КУЛДАУНОМ
    if(k === '1') { e.preventDefault(); if(canPerformAction()) castBoneShot(); }
    if(k === '2') { e.preventDefault(); if(canPerformAction()) castGasterBlaster(); }
    if(k === '3') { e.preventDefault(); if(canPerformAction()) castBoneVolley(); }
    
    // РЫВОК
    if(k === ' ') { e.preventDefault(); if(canPerformAction()) dashAction(); }
    
    // РЕГЕНЕРАЦИЯ (R - английская, К - русская)
    if(k === 'r' || k === 'R' || k === 'к' || k === 'К') { 
        e.preventDefault(); 
        if(!isDead) {
            resetGame(); 
            addFloatingText("❤️ ЗДОРОВЬЕ ВОССТАНОВЛЕНО", player.x-80, player.y-40, "#aaffaa", true);
        } else {
            addFloatingText("❌ НЕЛЬЗЯ ВОСКРЕСНУТЬ ВО ВРЕМЯ СМЕРТИ", player.x-100, player.y-40, "#ff8888", true);
        }
    }
    
    // ОТЛАДОЧНАЯ ФУНКЦИЯ: отнимаем 1 HP при нажатии G или П
    if(k === 'g' || k === 'G' || k === 'п' || k === 'П') { 
        e.preventDefault(); 
        if(!isDead) {
            player.hp = Math.max(0, player.hp - 1); 
            updateHealthUI(); 
            addFloatingText("-1 HP", player.x, player.y-30, "#ff8888", true); 
            player.invincible = 15;
        }
    }
    
    // АДМИН-ПАНЕЛЬ (F12)
    if(k === 'F12') {
        e.preventDefault();
        const panel = document.getElementById('adminPanel');
        if(panel) {
            if(panel.style.display === 'flex') {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'flex';
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key;
    // WASD
    if(k === 'w' || k === 'W') moveInput.up = false;
    if(k === 's' || k === 'S') moveInput.down = false;
    if(k === 'a' || k === 'A') moveInput.left = false;
    if(k === 'd' || k === 'D') moveInput.right = false;
    // ЦФЫВ
    if(k === 'ц' || k === 'Ц') moveInput.up = false;
    if(k === 'ы' || k === 'Ы') moveInput.down = false;
    if(k === 'ф' || k === 'Ф') moveInput.left = false;
    if(k === 'в' || k === 'В') moveInput.right = false;
});

// ========== МЫШЬ ==========
canvas.addEventListener('mousemove', (e) => { 
    mouseInCanvas = true; 
    updateCursor(e.clientX, e.clientY); 
});
canvas.addEventListener('mouseleave', () => { mouseInCanvas = false; });

// Клик по канвасу (лампы, табличка и т.д.)
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX, sy = (e.clientY - rect.top) * scaleY;
    checkLampClick(sx + camera.x, sy + camera.y);
});

// ========== HUD (ПК) ==========
function updateHealthUI() { 
    const el = document.getElementById('hpValue');
    if(el) el.innerText = player.hp; 
}

function updateDashUI() { 
    const el = document.getElementById('dashReady');
    if(el) {
        if(dash.active) el.innerText = "РЫВОК";
        else if(dash.cooldown > 0) el.innerText = `${Math.ceil(dash.cooldown/6)/10}с`;
        else el.innerText = "ГОТОВ";
    }
}

function updateCooldownUI() {
    const s1 = document.getElementById('skill1Hud');
    const s2 = document.getElementById('skill2Hud');
    const s3 = document.getElementById('skill3Hud');
    if(s1) s1.classList.toggle('cooldown-active', cooldowns.skill1 > 0);
    if(s2) s2.classList.toggle('cooldown-active', cooldowns.skill2 > 0);
    if(s3) s3.classList.toggle('cooldown-active', cooldowns.skill3 > 0);
}

// ========== ОКНО СТАТИСТИКИ ==========
const infoWindow = document.getElementById('infoWindow');
const closeBtn = document.querySelector('.ui-window-close');

function openInfoWindow() { 
    if(!windowOpen) { 
        updateStatsUI(); 
        infoWindow.style.display = 'flex'; 
        windowOpen = true; 
    } 
}

function closeInfoWindow() { 
    infoWindow.style.display = 'none'; 
    windowOpen = false; 
}

if(closeBtn) closeBtn.addEventListener('click', closeInfoWindow);

// Закрытие по клику вне окна
window.addEventListener('click', (e) => { 
    if(windowOpen && !infoWindow.contains(e.target) && e.target !== canvas) closeInfoWindow(); 
});

// Клавиша E для открытия статистики
window.addEventListener('keydown', (e) => { 
    if(e.key === 'e' || e.key === 'E') { 
        if(isPlayerNearSign() && !windowOpen) { 
            e.preventDefault(); 
            openInfoWindow(); 
        } else if(windowOpen) { 
            closeInfoWindow(); 
        } 
    } 
});

// ========== ПОЛНОЭКРАННЫЙ РЕЖИМ ==========
function resizeCanvas() { 
    const asp = SCREEN_W / SCREEN_H; 
    let w = window.innerWidth, h = window.innerHeight; 
    if(w / h > asp) { w = h * asp; } else { h = w / asp; } 
    canvas.style.width = `${w}px`; 
    canvas.style.height = `${h}px`; 
    canvas.style.left = `${(window.innerWidth - w) / 2}px`; 
    canvas.style.top = `${(window.innerHeight - h) / 2}px`; 
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

// ========== МЕНЮ ==========
const menuButton = document.getElementById('menuButton');
const menuWindow = document.getElementById('menuWindow');
const resumeBtn = document.getElementById('resumeGameBtn');
const exitBtn = document.getElementById('exitGameBtn');

let isMenuOpen = false;

function openMenu() { 
    if(isMenuOpen) return; 
    isMenuOpen = true; 
    gamePaused = true; 
    menuWindow.style.display = 'flex'; 
    const overlay = document.createElement('div'); 
    overlay.id = 'menuOverlay'; 
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;`; 
    document.body.appendChild(overlay); 
}

function closeMenu() { 
    if(!isMenuOpen) return; 
    isMenuOpen = false; 
    gamePaused = false; 
    menuWindow.style.display = 'none'; 
    const overlay = document.getElementById('menuOverlay'); 
    if(overlay) overlay.remove(); 
}

if(resumeBtn) resumeBtn.addEventListener('click', closeMenu);
if(exitBtn) exitBtn.addEventListener('click', () => { 
    if(confirm('Вы уверены, что хотите выйти из игры?')) { 
        window.close(); 
        window.location.href = "about:blank"; 
    } 
});
if(menuButton) menuButton.addEventListener('click', openMenu);

// Escape для меню
window.addEventListener('keydown', (e) => { 
    if(e.key === 'Escape') { 
        if(isMenuOpen) closeMenu(); 
        else openMenu(); 
    } 
});

// ========== АДМИН-ПАНЕЛЬ ==========
function initAdminPanel() {
    const openAdminBtn = document.getElementById('openAdminBtn');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    
    if(!openAdminBtn || !adminPanel || !closeAdminBtn) return;
    
    openAdminBtn.addEventListener('click', () => {
        adminPanel.style.display = 'flex';
    });
    
    closeAdminBtn.addEventListener('click', () => {
        adminPanel.style.display = 'none';
    });
    
    // ИГРОК
    const adminHeal = document.getElementById('adminHeal');
    const adminDamage = document.getElementById('adminDamage');
    const adminGodMode = document.getElementById('adminGodMode');
    const adminMaxSpeed = document.getElementById('adminMaxSpeed');
    const adminNormalSpeed = document.getElementById('adminNormalSpeed');
    
    if(adminHeal) adminHeal.addEventListener('click', () => {
        player.hp = Math.min(player.maxHp, player.hp + 10);
        updateHealthUI();
        addFloatingText("+10 HP", player.x, player.y-30, "#aaffaa", true);
    });
    
    if(adminDamage) adminDamage.addEventListener('click', () => {
        player.hp = Math.max(0, player.hp - 10);
        updateHealthUI();
        addFloatingText("-10 HP", player.x, player.y-30, "#ff8888", true);
        if(player.hp <= 0) checkPlayerDeath();
    });
    
    if(adminGodMode) adminGodMode.addEventListener('click', () => {
        godMode = !godMode;
        addFloatingText(godMode ? "🛡️ РЕЖИМ БЕССМЕРТИЯ ВКЛЮЧЕН" : "🛡️ РЕЖИМ БЕССМЕРТИЯ ВЫКЛЮЧЕН", 
                        player.x, player.y-40, godMode ? "#aaffaa" : "#ffaa66", true);
    });
    
    if(adminMaxSpeed) adminMaxSpeed.addEventListener('click', () => {
        maxSpeed = 12;
        acceleration = 0.8;
        addFloatingText("⚡ МАКСИМАЛЬНАЯ СКОРОСТЬ", player.x, player.y-40, "#88ddff", true);
    });
    
    if(adminNormalSpeed) adminNormalSpeed.addEventListener('click', () => {
        maxSpeed = 6.2;
        acceleration = 0.45;
        addFloatingText("🐢 НОРМАЛЬНАЯ СКОРОСТЬ", player.x, player.y-40, "#88ddff", true);
    });
    
    // ТЕЛЕПОРТЫ
    const adminTeleportSpawn = document.getElementById('adminTeleportSpawn');
    const adminTeleportDummy = document.getElementById('adminTeleportDummy');
    const adminTeleportSign = document.getElementById('adminTeleportSign');
    
    if(adminTeleportSpawn) adminTeleportSpawn.addEventListener('click', () => {
        player.x = MAP_W/2;
        player.y = MAP_H/2;
        updateCamera();
        addFloatingText("📍 ТЕЛЕПОРТ НА СПАВН", player.x, player.y-40, "#ffffaa", true);
    });
    
    if(adminTeleportDummy) adminTeleportDummy.addEventListener('click', () => {
        player.x = dummyObj.x + 50;
        player.y = dummyObj.y;
        updateCamera();
        addFloatingText("🎯 ТЕЛЕПОРТ К МАНЕКЕНУ", player.x, player.y-40, "#ffffaa", true);
    });
    
    if(adminTeleportSign) adminTeleportSign.addEventListener('click', () => {
        player.x = sign.x + 50;
        player.y = sign.y;
        updateCamera();
        addFloatingText("📜 ТЕЛЕПОРТ К ТАБЛИЧКЕ", player.x, player.y-40, "#ffffaa", true);
    });
    
    // ГРАФИКА
    const adminToggleLight = document.getElementById('adminToggleLight');
    const adminToggleParticles = document.getElementById('adminToggleParticles');
    const adminToggleShake = document.getElementById('adminToggleShake');
    
    if(adminToggleLight) adminToggleLight.addEventListener('click', () => {
        lightingEnabled = !lightingEnabled;
        addFloatingText(lightingEnabled ? "💡 ОСВЕЩЕНИЕ ВКЛЮЧЕНО" : "💡 ОСВЕЩЕНИЕ ВЫКЛЮЧЕНО", 
                        player.x, player.y-40, "#88ddff", true);
    });
    
    if(adminToggleParticles) adminToggleParticles.addEventListener('click', () => {
        particlesEnabled = !particlesEnabled;
        addFloatingText(particlesEnabled ? "✨ ЧАСТИЦЫ ВКЛЮЧЕНЫ" : "✨ ЧАСТИЦЫ ВЫКЛЮЧЕНЫ", 
                        player.x, player.y-40, "#88ddff", true);
        if(!particlesEnabled) {
            dustParticles = [];
            effects = effects.filter(e => e.type !== "fireworkParticle" && e.type !== "spark");
        }
    });
    
    if(adminToggleShake) adminToggleShake.addEventListener('click', () => {
        shakeEnabled = !shakeEnabled;
        addFloatingText(shakeEnabled ? "📳 ТРЯСКА ВКЛЮЧЕНА" : "📳 ТРЯСКА ВЫКЛЮЧЕНА", 
                        player.x, player.y-40, "#88ddff", true);
    });
    
    // ИГРОВОЙ ПРОЦЕСС
    const adminPauseGame = document.getElementById('adminPauseGame');
    const adminResumeGame = document.getElementById('adminResumeGame');
    const adminSlowMotion = document.getElementById('adminSlowMotion');
    const adminFastMotion = document.getElementById('adminFastMotion');
    const adminFirework = document.getElementById('adminFirework');
    const adminKillAll = document.getElementById('adminKillAll');
    
    if(adminPauseGame) adminPauseGame.addEventListener('click', () => {
        gamePaused = true;
        addFloatingText("⏸️ ИГРА НА ПАУЗЕ", player.x, player.y-40, "#ffaa66", true);
    });
    
    if(adminResumeGame) adminResumeGame.addEventListener('click', () => {
        gamePaused = false;
        addFloatingText("▶️ ИГРА ПРОДОЛЖЕНА", player.x, player.y-40, "#aaffaa", true);
    });
    
    if(adminSlowMotion) adminSlowMotion.addEventListener('click', () => {
        timeScale = 0.5;
        addFloatingText("🐢 SLOW MOTION", player.x, player.y-40, "#88ddff", true);
    });
    
    if(adminFastMotion) adminFastMotion.addEventListener('click', () => {
        timeScale = 1.5;
        addFloatingText("⚡ FAST MOTION", player.x, player.y-40, "#88ddff", true);
    });
    
    if(adminFirework) adminFirework.addEventListener('click', () => {
        if(!isMobileDevice) {
            createFireworkExplosion(player.x, player.y, 'chaos');
        }
        addFloatingText("🎆 ФЕЙЕРВЕРК!", player.x, player.y-40, "#ffaa77", true);
    });
    
    if(adminKillAll) adminKillAll.addEventListener('click', () => {
        killPlayer();
        addFloatingText("💀 ВЫ УБИЛИ СЕБЯ", player.x, player.y-40, "#ff6666", true);
    });
    
    // ОТЛАДКА
    const adminShowHitboxes = document.getElementById('adminShowHitboxes');
    
    if(adminShowHitboxes) adminShowHitboxes.addEventListener('click', () => {
        showHitboxes = !showHitboxes;
        addFloatingText(showHitboxes ? "🎯 ХИТБОКСЫ ВКЛЮЧЕНЫ" : "🎯 ХИТБОКСЫ ВЫКЛЮЧЕНЫ", 
                        player.x, player.y-40, "#88ddff", true);
    });
}

// Модифицируем функцию updateMovement для учёта godMode
const originalUpdateMovement = updateMovement;
updateMovement = function() {
    if(godMode) {
        player.invincible = 5;
    }
    originalUpdateMovement();
};

// Сохраняем оригинальную функцию render
let originalRender = null;

// Функция для отрисовки хитбоксов
function drawHitboxes() {
    if(!showHitboxes) return;
    
    // Хитбокс игрока
    const sx = player.x - camera.x, sy = player.y - camera.y;
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius, 0, Math.PI*2);
    ctx.strokeStyle = "#ff3366";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Хитбокс манекена
    const dsx = dummyObj.x - camera.x, dsy = dummyObj.y - camera.y;
    ctx.beginPath();
    ctx.arc(dsx, dsy, dummyObj.radius, 0, Math.PI*2);
    ctx.strokeStyle = "#33ff66";
    ctx.stroke();
    
    // Хитбоксы деревьев
    for(let tree of treeCollision) {
        const tsx = tree.x - camera.x, tsy = tree.y - camera.y;
        ctx.beginPath();
        ctx.arc(tsx, tsy, tree.radius, 0, Math.PI*2);
        ctx.strokeStyle = "#ffaa33";
        ctx.stroke();
    }
}

// Модифицируем функцию render для отрисовки хитбоксов
originalRender = render;
render = function() {
    originalRender();
    drawHitboxes();
};

// Модифицируем gameUpdate для добавления FPS и координат
const originalGameUpdate = gameUpdate;
gameUpdate = function(currentTime) {
    originalGameUpdate(currentTime);
    updateFPS();
    updateDebugCoords();
};

// Модифицируем drawDynamicLighting для учёта lightingEnabled
const originalDrawDynamicLighting = drawDynamicLighting;
drawDynamicLighting = function() {
    if(lightingEnabled) {
        originalDrawDynamicLighting();
    } else {
        // Рисуем просто виньетку без освещения
        if(window.vignetteGrad) {
            ctx.fillStyle = window.vignetteGrad;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
    }
};

// Модифицируем drawDummy для учёта shakeEnabled
const originalDrawDummy = drawDummy;
drawDummy = function() {
    if(!shakeEnabled) {
        const originalShake = dummyShake;
        dummyShake = 0;
        originalDrawDummy();
        dummyShake = originalShake;
    } else {
        originalDrawDummy();
    }
};

// Модифицируем updateEffects для учёта particlesEnabled
const originalUpdateEffects = updateEffects;
updateEffects = function() {
    if(!particlesEnabled) {
        // Очищаем частицы, но не трогаем другие эффекты
        effects = effects.filter(e => e.type !== "fireworkParticle" && e.type !== "spark");
        dustParticles = [];
        return;
    }
    originalUpdateEffects();
};

// Модифицируем addDashSparks для учёта particlesEnabled
const originalAddDashSparks = addDashSparks;
addDashSparks = function(x, y) {
    if(particlesEnabled) {
        originalAddDashSparks(x, y);
    }
};

// Модифицируем addDustParticle для учёта particlesEnabled
const originalAddDustParticle = addDustParticle;
addDustParticle = function(x, y) {
    if(particlesEnabled) {
        originalAddDustParticle(x, y);
    }
};

// ========== ИНИЦИАЛИЗАЦИЯ ПК ВЕРСИИ ==========
function initPlatform() {
    updateHealthUI();
    updateDashUI();
    updateCooldownUI();
    initAdminPanel();
    console.log("ПК версия загружена (админ-панель F12, кулдаун 0.1с, реген на R/К, смерть с респавном)");
}
