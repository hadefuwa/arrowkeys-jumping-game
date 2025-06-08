const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const playerSprite = new Image();
playerSprite.src = 'assets/player.png';
const flowerObstacle = new Image();
flowerObstacle.src = 'assets/flower.png';
const cloudObstacle = new Image();
cloudObstacle.src = 'assets/cloud.png';
const background = new Image();
background.src = 'assets/background.png';

// Game variables
const player = {
    x: 100,
    y: canvas.height - 150,
    width: 60,
    height: 80,
    isJumping: false,
    isDucking: false,
    jumpForce: 15,
    gravity: 0.6,
    velocityY: 0,
    normalHeight: 80,
    duckHeight: 40,
    sprite: playerSprite
};

// Game floor position (middle of screen)
const FLOOR_Y = canvas.height * 0.6; // 60% from the top of the screen

// Update player's initial position
player.y = FLOOR_Y - player.height;

let obstacles = [];
let score = 0;
let level = 1;
let levelTimer = 0;
const levelDuration = 1000; // 20 seconds per level
let speedMultiplier = 1;
let obstacleSpeed = 5;
let obstacleTimer = 0;
let gameOver = false;
let backgroundX = 0;
let spawnTimer = 0;
const initialSpawnDelay = 60; // Reduced from 120 to 60 frames (1 second)
let spawnDelay = initialSpawnDelay;
let firstSpawn = true; // Add flag for first spawn
let isDucking = false;
let duckTimer = 0;
const maxDuckTime = 60; // Maximum frames you can stay ducked (1 second)
let obstacleInterval = 180; // Increased from 120 to 180 for easier Level 1
let duckCooldown = 0;
const duckCooldownTime = 60; // 1 second cooldown

// Add high score functionality
let highScore = localStorage.getItem('highScore') || 0;

// Add restart functionality
function restartGame() {
    if (gameOver) {
        // Reset game state
        player.y = FLOOR_Y - player.height;
        player.isJumping = false;
        player.isDucking = false;
        player.velocityY = 0;
        player.height = player.normalHeight;
        
        obstacles = [];
        score = 0;
        level = 1;
        levelTimer = 0;
        speedMultiplier = 1;
        obstacleSpeed = 5;
        obstacleTimer = 0;
        gameOver = false;
    }
}

// Add event listeners for restart
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        restartGame();
        return;
    }
    
    if (e.key === 'ArrowUp' && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpForce;
    }
    
    if (e.key === 'ArrowDown' || e.key === 's') {
        if (!isDucking && duckCooldown === 0 && player.onGround) {
            isDucking = true;
            duckTimer = 0;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') {
        player.isDucking = false;
        player.height = player.normalHeight;
    }
});

// Add mouse click listener for restart
document.addEventListener('click', () => {
    if (gameOver) {
        restartGame();
    }
});

// Create obstacle
function createObstacle() {
    const isFlower = level < 10 ? true : level < 20 ? false : Math.random() < 0.5;
    const height = isFlower ? 50 : 90;
    const y = FLOOR_Y - height;
    
    obstacles.push({
        x: canvas.width,
        y: y,
        width: 40,
        height: height,
        isFlower: isFlower
    });
}

// Update game state
function update() {
    if (gameOver) return;

    // Update background
    backgroundX -= obstacleSpeed * 0.5;
    if (backgroundX <= -canvas.width) {
        backgroundX = 0;
    }

    // Update player
    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;

        if (player.y > FLOOR_Y - player.height) {
            player.y = FLOOR_Y - player.height;
            player.isJumping = false;
            player.velocityY = 0;
        }
    }

    // Handle ducking
    if (isDucking) {
        duckTimer++;
        if (duckTimer >= maxDuckTime) {
            isDucking = false;
            duckTimer = 0;
            duckCooldown = duckCooldownTime; // Start cooldown after ducking
        }
    } else if (duckCooldown > 0) {
        duckCooldown--;
    }

    // Update level and difficulty
    levelTimer++;
    if (levelTimer >= levelDuration) {
        level++;
        levelTimer = 0;
        speedMultiplier = 1 + (level * 0.2); // Increase speed by 20% each level
        obstacleSpeed = 5 * speedMultiplier;
        obstacleInterval = Math.max(60, 180 - (level * 15)); // Decrease interval more gradually, min 60
    }

    // Update obstacles with new speed
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;
    });

    // Remove obstacles that are off screen
    obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);

    // Create new obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
    }

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        // Check collision with more forgiving hitbox
        const hitboxMargin = 10;
        if (player.x + hitboxMargin < obstacle.x + obstacle.width - hitboxMargin &&
            player.x + player.width - hitboxMargin > obstacle.x + hitboxMargin &&
            player.y + hitboxMargin < obstacle.y + obstacle.height - hitboxMargin &&
            player.y + player.height - hitboxMargin > obstacle.y + hitboxMargin) {
            gameOver = true;
            // Update high score if current score is higher
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
            
            // Level up every 5 points
            if (score % 5 === 0) {
                level++;
                obstacleInterval = Math.max(60, obstacleInterval - 2);
            }
        }
    });

    // Spawn obstacles
    spawnTimer++;
    if (firstSpawn) {
        // First obstacle appears after 30 frames (0.5 seconds)
        if (spawnTimer >= 30) {
            createObstacle();
            firstSpawn = false;
            spawnTimer = 0;
        }
    } else if (spawnTimer >= spawnDelay) {
        createObstacle();
        spawnTimer = 0;
        // Decrease spawn delay over time
        spawnDelay = Math.max(initialSpawnDelay * 0.5, spawnDelay * 0.99);
    }
}

// Draw game
function draw() {
    // Draw scrolling background
    ctx.drawImage(background, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(background, backgroundX + canvas.width, 0, canvas.width, canvas.height);

    // Draw ground line
    ctx.strokeStyle = '#98FB98';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();

    // Draw player
    ctx.drawImage(player.sprite, player.x, player.y, player.width, player.height);

    // Draw obstacles
    obstacles.forEach(obstacle => {
        const sprite = obstacle.isFlower ? flowerObstacle : cloudObstacle;
        ctx.drawImage(sprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw score, high score and level with girly style
    ctx.fillStyle = '#FF69B4';
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`High Score: ${highScore}`, 20, 70);
    ctx.fillText(`Level: ${level}`, 20, 100);

    // Draw game over screen
    if (gameOver) {
        ctx.fillStyle = 'rgba(255, 192, 203, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF1493';
        ctx.font = 'bold 48px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 70);
        ctx.fillText('Press any key or click to restart', canvas.width / 2, canvas.height / 2 + 100);
    }

    // Draw level indicator
    ctx.fillStyle = '#ff69b4';
    ctx.font = '20px Arial';
    ctx.fillText(`Level ${level}`, 20, 40);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game when all images are loaded
let imagesLoaded = 0;
const totalImages = 4;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop();
    }
}

playerSprite.onload = imageLoaded;
flowerObstacle.onload = imageLoaded;
cloudObstacle.onload = imageLoaded;
background.onload = imageLoaded;

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = FLOOR_Y - player.height;
}); 