// ========== pc.js — ПК УПРАВЛЕНИЕ ==========

let mouseInCanvas = false;
let cursorWorld = { x: player.x, y: player.y };

function updateCursor(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const sx = (clientX - rect.left) * scaleX, sy = (clientY - rect.top) * scaleY;
    cursorWorld.x = Math.min(Math.max(sx + camera.x, 0), MAP_W);
    cursorWorld.y = Math.min(Math.max(sy + camera.y, 0), MAP_H);
    player.angle = Math.atan2(cursorWorld.y - player.y, cursorWorld.x - player.x);
}

// КЛАВИАТУРА
window.addEventListener('keydown', (e) => {
    if(gamePaused) return;
    const k = e.key;
    if(k === 'w' || k === 'W' || k === 'ц' || k === 'Ц') move.up = true;
    if(k === 's' || k === 'S' || k === 'ы' || k === 'Ы') move.down = true;
    if(k === 'a' || k === 'A' || k === 'ф' || k === 'Ф') move.left = true;
    if(k === 'd' || k === 'D' || k === 'в' || k === 'В') move.right = true;
    if(k === ' ') { e.preventDefault(); dashAction(); }
    if(k === '1') { e.preventDefault(); castBoneShot(); }
    if(k === '2') { e.preventDefault(); castGasterBlaster(); }
    if(k === '3') { e.preventDefault(); castBoneVolley(); }
    if(k === 'r' || k === 'R') { resetGame(); addFloatingText("❤️ ЗДОРОВЬЕ ВОССТАНОВЛЕНО", player.x-80, player.y-40, "#aaffaa", true); }
});

window.addEventListener('keyup', (e) => {
    const k = e.key;
    if(k === 'w' || k === 'W' || k === 'ц' || k === 'Ц') move.up = false;
    if(k === 's' || k === 'S' || k === 'ы' || k === 'Ы') move.down = false;
    if(k === 'a' || k === 'A' || k === 'ф' || k === 'Ф') move.left = false;
    if(k === 'd' || k === 'D' || k === 'в' || k === 'В') move.right = false;
});

// МЫШЬ
canvas.addEventListener('mousemove', (e) => { mouseInCanvas = true; updateCursor(e.clientX, e.clientY); });
canvas.addEventListener('mouseleave', () => { mouseInCanvas = false; });
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX, sy = (e.clientY - rect.top) * scaleY;
    checkLampClick(sx + camera.x, sy + camera.y);
});

// HUD
function updateHealthUI() { document.getElementById('hpValue').innerText = player.hp; }
function updateDashUI() { 
    const el = document.getElementById('dashReady');
    if(el) el.innerText = dash.active ? "РЫВОК" : (dash.cooldown > 0 ? `${Math.ceil(dash.cooldown/6)/10}с` : "ГОТОВ");
}
function updateCooldownUI() {
    const s1 = document.getElementById('skill1Hud'), s2 = document.getElementById('skill2Hud'), s3 = document.getElementById('skill3Hud');
    if(s1) s1.classList.toggle('cooldown-active', cooldowns.skill1 > 0);
    if(s2) s2.classList.toggle('cooldown-active', cooldowns.skill2 > 0);
    if(s3) s3.classList.toggle('cooldown-active', cooldowns.skill3 > 0);
}

// ОКНО СТАТИСТИКИ
const infoWindow = document.getElementById('infoWindow');
const closeBtn = document.querySelector('.ui-window-close');
function openInfoWindow() { if(!windowOpen) { updateStatsUI(); infoWindow.style.display = 'flex'; windowOpen = true; } }
function closeInfoWindow() { infoWindow.style.display = 'none'; windowOpen = false; }
closeBtn?.addEventListener('click', closeInfoWindow);
window.addEventListener('click', (e) => { if(windowOpen && !infoWindow.contains(e.target) && e.target !== canvas) closeInfoWindow(); });
window.addEventListener('keydown', (e) => { if(e.key === 'e' || e.key === 'E') { if(isPlayerNearSign() && !windowOpen) { e.preventDefault(); openInfoWindow(); } else if(windowOpen) { closeInfoWindow(); } } });

// ПОЛНОЭКРАННЫЙ РЕЖИМ
function resizeCanvas() { /* ... */ }
function toggleFullscreen() { /* ... */ }
const fullscreenBtn = document.getElementById('fullscreenBtn');
if(fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
window.addEventListener('resize', () => setTimeout(resizeCanvas, 50));
setTimeout(resizeCanvas, 100);

// МЕНЮ
const menuButton = document.getElementById('menuButton');
const menuWindow = document.getElementById('menuWindow');
const resumeBtn = document.getElementById('resumeGameBtn');
const exitBtn = document.getElementById('exitGameBtn');
let isMenuOpen = false;

function openMenu() { if(isMenuOpen) return; isMenuOpen = true; gamePaused = true; menuWindow.style.display = 'flex'; const overlay = document.createElement('div'); overlay.id = 'menuOverlay'; overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;`; document.body.appendChild(overlay); }
function closeMenu() { if(!isMenuOpen) return; isMenuOpen = false; gamePaused = false; menuWindow.style.display = 'none'; document.getElementById('menuOverlay')?.remove(); }
resumeBtn?.addEventListener('click', closeMenu);
exitBtn?.addEventListener('click', () => { if(confirm('Выйти?')) { window.close(); window.location.href = "about:blank"; } });
menuButton?.addEventListener('click', openMenu);
window.addEventListener('keydown', (e) => { if(e.key === 'Escape') { if(isMenuOpen) closeMenu(); else openMenu(); } });

function initPlatform() {
    updateHealthUI();
    updateDashUI();
    updateCooldownUI();
    console.log("ПК версия загружена");
}