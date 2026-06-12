// ========== pc.js — ПК УПРАВЛЕНИЕ ==========
// GitTale v0.1.0

let mouseInCanvas = false;
let lastActionTime = 0;
const ACTION_COOLDOWN = 100; // 100 мс

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

// ========== ИНИЦИАЛИЗАЦИЯ ПК ВЕРСИИ ==========
function initPlatform() {
    updateHealthUI();
    updateDashUI();
    updateCooldownUI();
    console.log("ПК версия загружена (кулдаун 0.1с, реген на R/К, смерть с респавном)");
}
