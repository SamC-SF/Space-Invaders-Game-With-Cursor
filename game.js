// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'playing'; // 'playing', 'gameOver'
let score = 0;
let lives = 3;
let gameSpeed = 1;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 5,
    baseSpeed: 5,
    color: '#00ff00',
    angle: 0, // Rotation angle in radians
    centerX: canvas.width / 2,
    centerY: canvas.height - 45
};

// Player bullets
const playerBullets = [];
let lastPlayerShot = 0;
let fireRate = 200; // milliseconds between shots
let baseFireRate = 200;
let currentWing = 'left'; // Track which wing is shooting ('left' or 'right')

// Enemies
const enemies = [];
const enemyRows = 5;
const enemyCols = 10;
const enemyWidth = 40;
const enemyHeight = 30;
const enemyPadding = 10;
let enemyDirection = 1;
let enemySpeed = 1;
let enemyMoveDown = false;

// Enemy bullets
const enemyBullets = [];
let lastEnemyShot = 0;

// Boss enemies
const bosses = [];
let bossSpawnTimer = 0;
const bossSpawnInterval = 30000; // Spawn boss every 30 seconds

// Power-ups
const powerUps = [];
const powerUpTypes = ['fireRate', 'nuke', 'speed'];

// Active power-ups (with timers)
const activePowerUps = {
    fireRate: 0,
    speed: 0
};

// Input handling
const keys = {};
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse movement for rotation
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // Calculate angle from player to mouse
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    player.angle = Math.atan2(dy, dx);
});

// Mouse click for shooting
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && gameState === 'playing') { // Left click
        mouseDown = true;
        shootPlayerBullet();
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouseDown = false;
    }
});

// Initialize enemies
function initEnemies() {
    enemies.length = 0;
    const startX = (canvas.width - (enemyCols * (enemyWidth + enemyPadding) - enemyPadding)) / 2;
    const startY = 50;
    
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: startX + col * (enemyWidth + enemyPadding),
                y: startY + row * (enemyHeight + enemyPadding),
                width: enemyWidth,
                height: enemyHeight,
                color: row < 2 ? '#ff00ff' : row < 4 ? '#00ffff' : '#ffff00',
                isBoss: false
            });
        }
    }
}

// Spawn boss
function spawnBoss() {
    bosses.push({
        x: Math.random() > 0.5 ? -60 : canvas.width,
        y: 30,
        width: 80,
        height: 60,
        speed: 2,
        direction: Math.random() > 0.5 ? 1 : -1,
        health: 3,
        color: '#ff0000'
    });
}

// Player movement
function updatePlayer() {
    let moveX = 0;
    let moveY = 0;
    
    if (keys['a'] && player.x > 0) {
        moveX -= player.speed;
    }
    if (keys['d'] && player.x < canvas.width - player.width) {
        moveX += player.speed;
    }
    if (keys['w'] && player.y > 0) {
        moveY -= player.speed;
    }
    if (keys['s'] && player.y < canvas.height - player.height) {
        moveY += player.speed;
    }
    
    player.x += moveX;
    player.y += moveY;
    
    // Update player center for rotation calculations
    player.centerX = player.x + player.width / 2;
    player.centerY = player.y + player.height / 2;
    
    // Update power-up timers
    const now = Date.now();
    if (activePowerUps.fireRate > 0) {
        activePowerUps.fireRate -= 16; // ~60fps
        if (activePowerUps.fireRate <= 0) {
            fireRate = baseFireRate;
        }
    }
    if (activePowerUps.speed > 0) {
        activePowerUps.speed -= 16;
        if (activePowerUps.speed <= 0) {
            player.speed = player.baseSpeed;
        }
    }
}

// Player shooting
function shootPlayerBullet() {
    const now = Date.now();
    if (now - lastPlayerShot < fireRate) {
        return;
    }
    
    const maxBullets = activePowerUps.fireRate > 0 ? 10 : 5;
    if (playerBullets.length < maxBullets) {
        const bulletSpeed = 7;
        
        // Calculate wing cannon positions (at the ends of the X-wing wings)
        // Wing cannons are at the outer edges of the ship
        const wingOffsetX = player.width / 2; // Half width for wing position
        const wingOffsetY = 0; // At the center vertically
        
        // Calculate left and right wing cannon positions in rotated coordinates
        // Left wing: (-wingOffsetX, wingOffsetY) in rotated coords
        // Right wing: (wingOffsetX, wingOffsetY) in rotated coords
        const cosAngle = Math.cos(player.angle);
        const sinAngle = Math.sin(player.angle);
        
        let cannonX, cannonY;
        if (currentWing === 'left') {
            // Left wing cannon position
            cannonX = player.centerX + (-wingOffsetX * cosAngle - wingOffsetY * sinAngle);
            cannonY = player.centerY + (-wingOffsetX * sinAngle + wingOffsetY * cosAngle);
        } else {
            // Right wing cannon position
            cannonX = player.centerX + (wingOffsetX * cosAngle - wingOffsetY * sinAngle);
            cannonY = player.centerY + (wingOffsetX * sinAngle + wingOffsetY * cosAngle);
        }
        
        // Shoot in the direction the ship is facing
        const shootAngle = player.angle;
        
        playerBullets.push({
            x: cannonX - 2,
            y: cannonY - 2,
            width: 4,
            height: 4,
            speedX: Math.cos(shootAngle) * bulletSpeed,
            speedY: Math.sin(shootAngle) * bulletSpeed,
            speed: bulletSpeed,
            color: '#00ff00'
        });
        
        // Alternate between wings
        currentWing = currentWing === 'left' ? 'right' : 'left';
        lastPlayerShot = now;
    }
}

// Update bullets
function updateBullets() {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        playerBullets[i].x += playerBullets[i].speedX;
        playerBullets[i].y += playerBullets[i].speedY;
        
        // Remove if off screen
        if (playerBullets[i].x < 0 || playerBullets[i].x > canvas.width ||
            playerBullets[i].y < 0 || playerBullets[i].y > canvas.height) {
            playerBullets.splice(i, 1);
            continue;
        }
        
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(playerBullets[i], enemies[j])) {
                playerBullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10;
                updateScore();
                break;
            }
        }
        
        // Check collision with bosses
        for (let j = bosses.length - 1; j >= 0; j--) {
            if (checkCollision(playerBullets[i], bosses[j])) {
                playerBullets.splice(i, 1);
                bosses[j].health--;
                score += 50;
                updateScore();
                
                if (bosses[j].health <= 0) {
                    // Drop power-up
                    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                    powerUps.push({
                        x: bosses[j].x + bosses[j].width / 2 - 15,
                        y: bosses[j].y + bosses[j].height,
                        width: 30,
                        height: 30,
                        type: powerUpType,
                        speed: 2,
                        color: powerUpType === 'fireRate' ? '#00ffff' : 
                               powerUpType === 'nuke' ? '#ff00ff' : '#ffff00'
                    });
                    bosses.splice(j, 1);
                }
                break;
            }
        }
    }
    
    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        
        // Remove if off screen
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        // Check collision with player
        if (checkCollision(enemyBullets[i], player)) {
            enemyBullets.splice(i, 1);
            lives--;
            updateLives();
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}

// Enemy movement
function updateEnemies() {
    if (enemies.length === 0 && bosses.length === 0) {
        // All enemies destroyed - level complete
        initEnemies();
        enemySpeed += 0.2;
        return;
    }
    
    let moveDown = false;
    let newDirection = enemyDirection;
    
    // Check if enemies hit the sides
    for (let enemy of enemies) {
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            moveDown = true;
            newDirection = -enemyDirection;
            break;
        }
    }
    
    if (moveDown) {
        enemyDirection = newDirection;
        for (let enemy of enemies) {
            enemy.y += 20;
            // Check if enemies reached the player
            if (enemy.y + enemy.height >= player.y) {
                gameOver();
                return;
            }
        }
    }
    
    // Move enemies
    for (let enemy of enemies) {
        enemy.x += enemySpeed * enemyDirection;
    }
    
    // Update bosses
    for (let i = bosses.length - 1; i >= 0; i--) {
        const boss = bosses[i];
        boss.x += boss.speed * boss.direction;
        
        // Bounce off walls
        if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
            boss.direction *= -1;
        }
        
        // Check collision with player
        if (checkCollision(boss, player)) {
            lives--;
            updateLives();
            bosses.splice(i, 1);
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }
    
    // Spawn bosses
    const now = Date.now();
    if (now - bossSpawnTimer > bossSpawnInterval) {
        spawnBoss();
        bossSpawnTimer = now;
    }
    
    // Enemy shooting
    if (now - lastEnemyShot > 1000 && enemies.length > 0) {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        enemyBullets.push({
            x: randomEnemy.x + randomEnemy.width / 2 - 2,
            y: randomEnemy.y + randomEnemy.height,
            width: 4,
            height: 10,
            speed: 3,
            color: '#ff0000'
        });
        lastEnemyShot = now;
    }
    
    // Boss shooting
    for (let boss of bosses) {
        if (Math.random() < 0.02) { // 2% chance per frame
            enemyBullets.push({
                x: boss.x + boss.width / 2 - 2,
                y: boss.y + boss.height,
                width: 6,
                height: 12,
                speed: 4,
                color: '#ff0000'
            });
        }
    }
}

// Update power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.speed;
        
        // Remove if off screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
            continue;
        }
        
        // Check collision with player
        if (checkCollision(powerUp, player)) {
            activatePowerUp(powerUp.type);
            powerUps.splice(i, 1);
        }
    }
}

// Activate power-up
function activatePowerUp(type) {
    if (type === 'fireRate') {
        fireRate = baseFireRate / 2; // Double fire rate
        activePowerUps.fireRate = 10000; // 10 seconds
    } else if (type === 'nuke') {
        // Destroy all enemies
        score += enemies.length * 10;
        enemies.length = 0;
        updateScore();
    } else if (type === 'speed') {
        player.speed = player.baseSpeed * 1.5; // 50% faster
        activePowerUps.speed = 10000; // 10 seconds
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Drawing functions
function drawPlayer() {
    ctx.save();
    ctx.translate(player.centerX, player.centerY);
    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    
    // Draw X-wing shape
    const centerWidth = 8; // Width of center body
    const wingLength = player.width / 2; // Length of wings
    const wingWidth = 6; // Width of wings
    const cannonSize = 4; // Size of wing cannons (rectangles)
    
    // Draw center body (vertical rectangle)
    ctx.fillRect(-centerWidth / 2, -player.height / 2, centerWidth, player.height);
    
    // Draw top wing (left side)
    ctx.fillRect(-wingLength, -player.height / 2 - wingWidth / 2, wingLength, wingWidth);
    // Draw top wing cannon (rectangle at end)
    ctx.fillRect(-wingLength - cannonSize, -player.height / 2 - cannonSize / 2, cannonSize, cannonSize);
    
    // Draw top wing (right side)
    ctx.fillRect(0, -player.height / 2 - wingWidth / 2, wingLength, wingWidth);
    // Draw top wing cannon (rectangle at end)
    ctx.fillRect(wingLength, -player.height / 2 - cannonSize / 2, cannonSize, cannonSize);
    
    // Draw bottom wing (left side)
    ctx.fillRect(-wingLength, player.height / 2 - wingWidth / 2, wingLength, wingWidth);
    // Draw bottom wing cannon (rectangle at end)
    ctx.fillRect(-wingLength - cannonSize, player.height / 2 - cannonSize / 2, cannonSize, cannonSize);
    
    // Draw bottom wing (right side)
    ctx.fillRect(0, player.height / 2 - wingWidth / 2, wingLength, wingWidth);
    // Draw bottom wing cannon (rectangle at end)
    ctx.fillRect(wingLength, player.height / 2 - cannonSize / 2, cannonSize, cannonSize);
    
    ctx.restore();
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6);
    }
    
    // Draw bosses
    for (let boss of bosses) {
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        // Draw boss details
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(boss.x + 10, boss.y + 10, 15, 15);
        ctx.fillRect(boss.x + boss.width - 25, boss.y + 10, 15, 15);
        // Draw health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(boss.x, boss.y - 10, (boss.health / 3) * boss.width, 5);
    }
}

function drawBullets() {
    // Player bullets
    for (let bullet of playerBullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Enemy bullets
    for (let bullet of enemyBullets) {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawPowerUps() {
    for (let powerUp of powerUps) {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // Draw icon based on type
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (powerUp.type === 'fireRate') {
            ctx.fillText('⚡', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        } else if (powerUp.type === 'nuke') {
            ctx.fillText('💣', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        } else if (powerUp.type === 'speed') {
            ctx.fillText('🚀', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        }
    }
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 53) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

// UI updates
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

function restartGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    enemySpeed = 1;
    enemyDirection = 1;
    playerBullets.length = 0;
    enemyBullets.length = 0;
    bosses.length = 0;
    powerUps.length = 0;
    activePowerUps.fireRate = 0;
    activePowerUps.speed = 0;
    fireRate = baseFireRate;
    player.speed = player.baseSpeed;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 60;
    currentWing = 'left'; // Reset wing alternation
    bossSpawnTimer = Date.now();
    initEnemies();
    updateScore();
    updateLives();
    document.getElementById('gameOver').classList.add('hidden');
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();
    
    if (gameState === 'playing') {
        // Update game objects
        updatePlayer();
        updateBullets();
        updateEnemies();
        updatePowerUps();
        
        // Auto-shoot if mouse is held down
        if (mouseDown) {
            shootPlayerBullet();
        }
        
        // Draw game objects
        drawEnemies();
        drawPlayer();
        drawBullets();
        drawPowerUps();
    }
    
    requestAnimationFrame(gameLoop);
}

// Restart button
document.getElementById('restartBtn').addEventListener('click', restartGame);

// Initialize game
initEnemies();
updateScore();
updateLives();
bossSpawnTimer = Date.now();
gameLoop();



}); // End DOMContentLoaded