// Watch Dogs Game - Iori Edition
// Open World with Cars, NPCs, Trees, Houses, and Buildings

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

// Player object (Iori)
const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    width: 30,
    height: 40,
    speed: 5,
    vx: 0,
    vy: 0,
    health: 100,
    maxHealth: 100,
    angle: 0,
    isMoving: false
};

// Camera
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothFactor: 0.1
};

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape') toggleMenu();
    if (e.key === 'h' || e.key === 'H') openHackMenu();
    if (e.key === 'e' || e.key === 'E') tryInteract();
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    player.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
});

// World entities
let cars = [];
let npcs = [];
let buildings = [];
let trees = [];
let houses = [];
let hackableObjects = [];

// Initialize world
function initializeWorld() {
    // Create buildings (skyscrapers)
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        buildings.push({
            x: x,
            y: y,
            width: 120 + Math.random() * 80,
            height: 150 + Math.random() * 100,
            color: '#666',
            hackable: true,
            hacked: false
        });
    }

    // Create trees
    for (let i = 0; i < 50; i++) {
        trees.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: 20 + Math.random() * 15,
            trunkHeight: 60
        });
    }

    // Create houses
    for (let i = 0; i < 30; i++) {
        houses.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            width: 80 + Math.random() * 60,
            height: 70 + Math.random() * 50,
            roofColor: ['#c41e3a', '#ff6b35', '#004e89'][Math.floor(Math.random() * 3)],
            wallColor: '#f0e5cf'
        });
    }

    // Create cars
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        cars.push({
            x: x,
            y: y,
            width: 50,
            height: 25,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            angle: Math.random() * Math.PI * 2,
            color: ['#c41e3a', '#004e89', '#ffd60a', '#000'][Math.floor(Math.random() * 4)],
            hackable: true,
            hacked: false,
            owner: `CAR_${i}`,
            speed: 2 + Math.random() * 2
        });
    }

    // Create NPCs
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_HEIGHT;
        npcs.push({
            x: x,
            y: y,
            width: 20,
            height: 30,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            angle: Math.random() * Math.PI * 2,
            color: ['#ff0000', '#0000ff', '#ffff00', '#00ff00'][Math.floor(Math.random() * 4)],
            id: `NPC_${i}`,
            speed: 1 + Math.random() * 1
        });
    }

    // Populate hackable objects
    cars.forEach(car => hackableObjects.push({...car, type: 'car', id: car.owner}));
    buildings.forEach((building, i) => hackableObjects.push({...building, type: 'building', id: `BUILDING_${i}`}));
}

// Update player movement
function updatePlayer() {
    player.vx = 0;
    player.vy = 0;

    if (keys['w']) player.vy -= player.speed;
    if (keys['s']) player.vy += player.speed;
    if (keys['a']) player.vx -= player.speed;
    if (keys['d']) player.vx += player.speed;

    player.isMoving = player.vx !== 0 || player.vy !== 0;

    player.x += player.vx;
    player.y += player.vy;

    // World boundaries
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));

    // Update camera
    camera.targetX = player.x - canvas.width / 2 + player.width / 2;
    camera.targetY = player.y - canvas.height / 2 + player.height / 2;
    camera.x += (camera.targetX - camera.x) * camera.smoothFactor;
    camera.y += (camera.targetY - camera.y) * camera.smoothFactor;

    // World boundary limits for camera
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));
}

// Update cars
function updateCars() {
    cars.forEach(car => {
        car.x += car.vx;
        car.y += car.vy;

        // Bounce off walls
        if (car.x <= 0 || car.x >= WORLD_WIDTH - car.width) car.vx *= -1;
        if (car.y <= 0 || car.y >= WORLD_HEIGHT - car.height) car.vy *= -1;

        car.angle = Math.atan2(car.vy, car.vx);

        // Randomly change direction
        if (Math.random() < 0.01) {
            car.vx = (Math.random() - 0.5) * car.speed * 2;
            car.vy = (Math.random() - 0.5) * car.speed * 2;
        }
    });
}

// Update NPCs
function updateNPCs() {
    npcs.forEach(npc => {
        npc.x += npc.vx;
        npc.y += npc.vy;

        // Bounce off walls
        if (npc.x <= 0 || npc.x >= WORLD_WIDTH - npc.width) npc.vx *= -1;
        if (npc.y <= 0 || npc.y >= WORLD_HEIGHT - npc.height) npc.vy *= -1;

        // Randomly change direction
        if (Math.random() < 0.02) {
            npc.vx = (Math.random() - 0.5) * npc.speed * 2;
            npc.vy = (Math.random() - 0.5) * npc.speed * 2;
        }

        npc.angle = Math.atan2(npc.vy, npc.vx);
    });
}

// Draw functions
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x - camera.x, player.y - camera.y);
    ctx.rotate(player.angle);

    // Body
    ctx.fillStyle = '#333';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Head
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(0, -player.height / 2 + 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-3, -player.height / 2 + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -player.height / 2 + 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Name indicator
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IORI', 0, player.height / 2 + 20);

    ctx.restore();
}

function drawCars() {
    cars.forEach(car => {
        if (isInViewport(car.x, car.y, car.width, car.height)) {
            ctx.save();
            ctx.translate(car.x - camera.x, car.y - camera.y);
            ctx.rotate(car.angle);

            // Body
            ctx.fillStyle = car.hacked ? '#ffff00' : car.color;
            ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

            // Windows
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-car.width / 2 + 5, -car.height / 2 + 2, 10, 8);
            ctx.fillRect(car.width / 2 - 15, -car.height / 2 + 2, 10, 8);

            // Wheels
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-car.width / 3, car.height / 2 + 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(car.width / 3, car.height / 2 + 3, 4, 0, Math.PI * 2);
            ctx.fill();

            // Hack indicator
            if (car.hacked) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(-car.width / 2 - 2, -car.height / 2 - 2, car.width + 4, car.height + 4);
            }

            ctx.restore();
        }
    });
}

function drawNPCs() {
    npcs.forEach(npc => {
        if (isInViewport(npc.x, npc.y, npc.width, npc.height)) {
            ctx.save();
            ctx.translate(npc.x - camera.x, npc.y - camera.y);
            ctx.rotate(npc.angle);

            // Body
            ctx.fillStyle = npc.color;
            ctx.fillRect(-npc.width / 2, -npc.height / 2, npc.width, npc.height);

            // Head
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(0, -npc.height / 2 - 8, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });
}

function drawBuildings() {
    buildings.forEach(building => {
        if (isInViewport(building.x, building.y, building.width, building.height)) {
            ctx.fillStyle = building.hacked ? '#ffff00' : building.color;
            ctx.fillRect(building.x - camera.x, building.y - camera.y, building.width, building.height);

            // Windows
            ctx.fillStyle = '#ffff99';
            const windowSize = 15;
            for (let row = 0; row < building.height / (windowSize + 5); row++) {
                for (let col = 0; col < building.width / (windowSize + 5); col++) {
                    ctx.fillRect(
                        building.x - camera.x + col * (windowSize + 5) + 5,
                        building.y - camera.y + row * (windowSize + 5) + 5,
                        windowSize, windowSize
                    );
                }
            }

            // Hack indicator
            if (building.hacked) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(building.x - camera.x, building.y - camera.y, building.width, building.height);
            }
        }
    });
}

function drawTrees() {
    trees.forEach(tree => {
        if (isInViewport(tree.x, tree.y, tree.radius * 2, tree.radius * 2)) {
            // Trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(tree.x - camera.x - 8, tree.y - camera.y, 16, tree.trunkHeight);

            // Foliage
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(tree.x - camera.x, tree.y - camera.y, tree.radius, 0, Math.PI * 2);
            ctx.fill();

            // Darker shade
            ctx.fillStyle = '#1a6b1a';
            ctx.beginPath();
            ctx.arc(tree.x - camera.x - 5, tree.y - camera.y + 5, tree.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawHouses() {
    houses.forEach(house => {
        if (isInViewport(house.x, house.y, house.width, house.height)) {
            // Walls
            ctx.fillStyle = house.wallColor;
            ctx.fillRect(house.x - camera.x, house.y - camera.y, house.width, house.height);

            // Roof
            ctx.fillStyle = house.roofColor;
            ctx.beginPath();
            ctx.moveTo(house.x - camera.x, house.y - camera.y);
            ctx.lineTo(house.x - camera.x + house.width / 2, house.y - camera.y - 30);
            ctx.lineTo(house.x - camera.x + house.width, house.y - camera.y);
            ctx.fill();

            // Door
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(house.x - camera.x + house.width / 2 - 10, house.y - camera.y + house.height - 25, 20, 25);

            // Door handle
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(house.x - camera.x + house.width / 2 + 8, house.y - camera.y + house.height - 12, 3, 0, Math.PI * 2);
            ctx.fill();

            // Windows
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(house.x - camera.x + 10, house.y - camera.y + 15, 20, 20);
            ctx.fillRect(house.x - camera.x + house.width - 30, house.y - camera.y + 15, 20, 20);

            // Border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(house.x - camera.x, house.y - camera.y, house.width, house.height);
        }
    });
}

function isInViewport(x, y, width, height) {
    return x + width > camera.x &&
           x < camera.x + canvas.width &&
           y + height > camera.y &&
           y < camera.y + canvas.height;
}

// Draw map
function drawMap() {
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw world elements
    drawTrees();
    drawHouses();
    drawBuildings();
    drawCars();
    drawNPCs();
    drawPlayer();
}

// Draw minimap
function updateMinimap() {
    minimapCtx.fillStyle = '#001a00';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    // Scale factor
    const scaleX = minimapCanvas.width / WORLD_WIDTH;
    const scaleY = minimapCanvas.height / WORLD_HEIGHT;

    // Draw buildings
    minimapCtx.fillStyle = '#666';
    buildings.forEach(building => {
        minimapCtx.fillRect(building.x * scaleX, building.y * scaleY, building.width * scaleX, building.height * scaleY);
    });

    // Draw trees
    minimapCtx.fillStyle = '#228B22';
    trees.forEach(tree => {
        minimapCtx.beginPath();
        minimapCtx.arc(tree.x * scaleX, tree.y * scaleY, 3, 0, Math.PI * 2);
        minimapCtx.fill();
    });

    // Draw cars
    minimapCtx.fillStyle = '#ff0000';
    cars.forEach(car => {
        minimapCtx.fillRect(car.x * scaleX, car.y * scaleY, 5, 5);
    });

    // Draw NPCs
    minimapCtx.fillStyle = '#ffff00';
    npcs.forEach(npc => {
        minimapCtx.fillRect(npc.x * scaleX, npc.y * scaleY, 3, 3);
    });

    // Draw player
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.fillRect(player.x * scaleX - 3, player.y * scaleY - 3, 6, 6);

    // Border
    minimapCtx.strokeStyle = '#00ff00';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(0, 0, minimapCanvas.width, minimapCanvas.height);
}

// Interaction and hacking
let selectedObject = null;
let hackProgress = 0;
let isHacking = false;

function tryInteract() {
    const interactRange = 100;
    let closest = null;
    let closestDist = interactRange;

    hackableObjects.forEach(obj => {
        const dist = Math.hypot(obj.x - player.x, obj.y - player.y);
        if (dist < closestDist) {
            closest = obj;
            closestDist = dist;
        }
    });

    if (closest) {
        selectedObject = closest;
        updateInteractionPrompt(closest);
    }
}

function updateInteractionPrompt(obj) {
    const prompt = document.getElementById('interaction-prompt');
    const text = document.getElementById('prompt-text');
    text.textContent = `[E] Interact with ${obj.type.toUpperCase()} | [H] Hack`;
    prompt.style.display = 'block';
}

function openHackMenu() {
    const interactRange = 100;
    let closest = null;
    let closestDist = interactRange;

    hackableObjects.forEach(obj => {
        const dist = Math.hypot(obj.x - player.x, obj.y - player.y);
        if (dist < closestDist) {
            closest = obj;
            closestDist = dist;
        }
    });

    if (closest) {
        selectedObject = closest;
        document.getElementById('hack-menu').style.display = 'block';
    }
}

function closeHackMenu() {
    document.getElementById('hack-menu').style.display = 'none';
}

function toggleMenu() {
    const menu = document.getElementById('hack-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    
    const hackView = document.getElementById('hack-view');
    if (hackView.style.display !== 'none') {
        hackView.style.display = 'none';
        isHacking = false;
    }
}

// Hack options
document.querySelectorAll('.hack-option').forEach(option => {
    option.addEventListener('click', () => {
        const target = option.getAttribute('data-target');
        startHacking(target);
    });
});

function startHacking(target) {
    closeHackMenu();
    document.getElementById('hack-view').style.display = 'block';
    isHacking = true;
    hackProgress = 0;

    const hackView = document.getElementById('hack-view');
    const title = document.getElementById('hack-title');
    const info = document.getElementById('hack-info');

    title.textContent = `HACKING ${target.toUpperCase()}...`;

    switch(target) {
        case 'camera':
            info.innerHTML = `
                <p>🎥 <strong>SECURITY CAMERA</strong></p>
                <p>Locating camera feeds...</p>
                <p>Range: 500m radius</p>
            `;
            break;
        case 'car':
            if (selectedObject && selectedObject.type === 'car') {
                info.innerHTML = `
                    <p>🚗 <strong>VEHICLE SYSTEM</strong></p>
                    <p>Vehicle ID: ${selectedObject.owner}</p>
                    <p>Engine Status: Running</p>
                    <p>Options: Crash/Control</p>
                `;
            }
            break;
        case 'building':
            if (selectedObject && selectedObject.type === 'building') {
                info.innerHTML = `
                    <p>🏢 <strong>BUILDING ACCESS</strong></p>
                    <p>Bypassing security...</p>
                    <p>Firewall Level: Medium</p>
                `;
            }
            break;
        case 'bank':
            info.innerHTML = `
                <p>🏦 <strong>BANK SYSTEM</strong></p>
                <p>Accessing accounts...</p>
                <p>Security: HIGH</p>
            `;
            break;
    }

    // Simulate hacking progress
    const hackInterval = setInterval(() => {
        if (!isHacking) {
            clearInterval(hackInterval);
            return;
        }

        hackProgress += Math.random() * 15;
        const fill = document.getElementById('hack-progress-fill');
        fill.style.width = Math.min(hackProgress, 100) + '%';

        if (hackProgress >= 100) {
            hackSuccess(target);
            clearInterval(hackInterval);
        }
    }, 300);
}

function hackSuccess(target) {
    isHacking = false;
    const status = document.getElementById('hack-status');
    status.textContent = '✓ HACK SUCCESSFUL';
    status.style.color = '#00ff00';

    if (selectedObject && selectedObject.type === 'car') {
        selectedObject.hacked = true;
        cars.forEach(car => {
            if (car === selectedObject) car.hacked = true;
        });
    } else if (selectedObject && selectedObject.type === 'building') {
        selectedObject.hacked = true;
        buildings.forEach(building => {
            if (building === selectedObject) building.hacked = true;
        });
    }

    addNotification(`${target.toUpperCase()} HACKED!`, 'success');

    setTimeout(() => {
        document.getElementById('hack-view').style.display = 'none';
    }, 2000);
}

function addNotification(text, type = 'info') {
    const notifContainer = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = text;
    notifContainer.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// Update UI
function updateUI() {
    // Health
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-bar').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `${player.health}/${player.maxHealth}`;

    // Hack progress
    document.getElementById('hack-bar').style.width = hackProgress + '%';
    document.getElementById('hack-text').textContent = Math.round(hackProgress) + '%';

    // Location
    const location = Math.floor(player.x / 300) + ',' + Math.floor(player.y / 300);
    document.getElementById('location').textContent = location;

    // Objectives
    const objectiveList = document.getElementById('objective-list');
    if (objectiveList.innerHTML === '') {
        objectiveList.innerHTML = `
            <div class="objective-item">1. Explore the open world</div>
            <div class="objective-item">2. Find and hack a car</div>
            <div class="objective-item">3. Hack a building</div>
            <div class="objective-item">4. Hack the bank</div>
            <div class="objective-item">5. Escape the area</div>
        `;
    }
}

// Close hack view
document.getElementById('hack-close').addEventListener('click', () => {
    document.getElementById('hack-view').style.display = 'none';
    isHacking = false;
});

// Game loop
function gameLoop() {
    updatePlayer();
    updateCars();
    updateNPCs();
    drawMap();
    updateMinimap();
    updateUI();

    requestAnimationFrame(gameLoop);
}

// Initialize and start
initializeWorld();
gameLoop();

// Show initial notification
addNotification('Welcome IORI - Welcome to the Open World', 'success');
