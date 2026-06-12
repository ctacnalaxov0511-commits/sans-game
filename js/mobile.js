// ========== mobile.js — МОБИЛЬНОЕ УПРАВЛЕНИЕ ==========
// GitTale v0.1.0

// ОТКЛЮЧАЕМ ФЕЙЕРВЕРКИ НА МОБИЛЬНЫХ УСТРОЙСТВАХ
isMobileDevice = true;

const mobileControls = document.getElementById('mobileControls');
if(mobileControls) mobileControls.classList.add('visible');

const joystickBase = document.getElementById('joystickBase');
const joystickThumb = document.getElementById('joystickThumb');
const maxDist = 35;
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };

function getTouchPos(touch) {
    const rect = joystickBase.getBoundingClientRect();
    return { x: touch.clientX - rect.left - rect.width/2, y: touch.clientY - rect.top - rect.height/2 };
}

function updateJoystick(touchX, touchY) {
    let dx = touchX, dy = touchY;
    const dist = Math.hypot(dx, dy);
    if(dist > maxDist) { dx = dx / dist * maxDist; dy = dy / dist * maxDist; }
    joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    joystickVector.x = dx / maxDist;
    joystickVector.y = dy / maxDist;
    
    moveInput.left = joystickVector.x < -0.2;
    moveInput.right = joystickVector.x > 0.2;
    moveInput.up = joystickVector.y < -0.2;
    moveInput.down = joystickVector.y > 0.2;
    
    if(moveInput.left || moveInput.right || moveInput.up || moveInput.down) {
        let angle = Math.atan2(joystickVector.y, joystickVector.x);
        if(Math.abs(joystickVector.x) > 0.2 || Math.abs(joystickVector.y) > 0.2) {
            player.angle = angle;
        }
    }
}

function resetJoystick() {
    joystickThumb.style.transform = 'translate(0px, 0px)';
    joystickVector = { x: 0, y: 0 };
    moveInput.left = false;
    moveInput.right = false;
    moveInput.up = false;
    moveInput.down = false;
}

joystickBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const pos = getTouchPos(e.touches[0]);
    updateJoystick(pos.x, pos.y);
});

joystickBase.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(!joystickActive) return;
    const pos = getTouchPos(e.touches[0]);
    updateJoystick(pos.x, pos.y);
});

joystickBase.addEventListener('touchend', (e) => {
    e.preventDefault();
    joystickActive = false;
    resetJoystick();
});

// КНОПКИ АТАК
const skillBtns = document.querySelectorAll('.skill-btn');
skillBtns.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if(gamePaused) return;
        const skill = btn.getAttribute('data-skill');
        if(skill === '1') castBoneShot();
        if(skill === '2') castGasterBlaster();
        if(skill === '3') castBoneVolley();
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 100);
    });
});

// РЫВОК ПО ДВОЙНОМУ ТАПУ
let lastTap = 0;
joystickBase.addEventListener('touchstart', (e) => {
    const now = Date.now();
    if(now - lastTap < 300) { dashAction(); }
    lastTap = now;
});

// HUD ДЛЯ МОБИЛЬНЫХ (только здоровье)
function updateHealthUI() { 
    const el = document.getElementById('hpValue'); 
    if(el) el.innerText = player.hp; 
}

function updateDashUI() { 
    // Не отображается на мобильных
}

function updateCooldownUI() { 
    // Не отображается на мобильных
}

// ОКНО СТАТИСТИКИ
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

// Клавиша E для открытия статистики (на случай подключенной клавиатуры)
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

// МЕНЮ
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

// ========== ИНИЦИАЛИЗАЦИЯ МОБИЛЬНОЙ ВЕРСИИ ==========
function initPlatform() {
    updateHealthUI();
    console.log("Мобильная версия загружена (фейерверки ОТКЛЮЧЕНЫ, плавное движение)");
}
