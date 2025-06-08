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
let level = 0;
let gameSpeed = 4;
let obstacleTimer = 0;
let obstacleInterval = 150;
let gameOver = false;
let backgroundX = 0;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    if (e.key === 'ArrowUp' && !player.isJumping) {
        player.isJumping = true;
        player.velocityY = -player.jumpForce;
    }
    
    if (e.key === 'ArrowDown' && !player.isDucking) {
        player.isDucking = true;
        player.height = player.duckHeight;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') {
        player.isDucking = false;
        player.height = player.normalHeight;
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
    backgroundX -= gameSpeed * 0.5;
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

    // Update obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        // Check collision with more forgiving hitbox
        const hitboxMargin = 10;
        if (player.x + hitboxMargin < obstacle.x + obstacle.width - hitboxMargin &&
            player.x + player.width - hitboxMargin > obstacle.x + hitboxMargin &&
            player.y + hitboxMargin < obstacle.y + obstacle.height - hitboxMargin &&
            player.y + player.height - hitboxMargin > obstacle.y + hitboxMargin) {
            gameOver = true;
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++;
            
            // Level up every 5 points instead of 15
            if (score % 5 === 0) {
                level++;
                gameSpeed += 0.2; // Reduced from 0.3 to 0.2 for smoother progression
                obstacleInterval = Math.max(120, obstacleInterval - 2); // Reduced interval decrease and increased minimum
            }
        }
    });

    // Create new obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
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

    // Draw score and level with girly style
    ctx.fillStyle = '#FF69B4';
    ctx.font = 'bold 24px Comic Sans MS';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Level: ${level}`, 20, 70);

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
        ctx.fillText('Press F5 to restart', canvas.width / 2, canvas.height / 2 + 80);
    }
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