// Physics-Based Tetris Game with Realistic Rotation and Physics
class TetrisGame {
    constructor(canvasId, nextCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById(nextCanvasId);
        this.nextCtx = this.nextCanvas.getContext('2d');

        // Game dimensions
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = this.canvas.width / this.gridWidth;

        // Game state
        this.grid = this.createGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;

        // Physics parameters
        this.gravity = 0.008; // Acceleration downward
        this.velocity = { x: 0, y: 0 }; // Current velocity (x and y)
        this.dropSpeed = 0.1; // Hard drop speed
        this.friction = 0.98; // Friction when hitting ground
        this.rotation = 0; // Current rotation in radians
        this.rotationVelocity = 0; // Rotation speed
        this.angularDamping = 0.98; // Damping for rotation velocity
        this.lateralDamping = 0.95; // Damping for horizontal velocity

        // Input handling
        this.keys = {};
        this.previousKeys = {};
        this.setupInputHandlers();

        // Game loop
        this.frameCount = 0;
        this.lastLineCheck = 0;
        this.moveFrameCooldown = 0; // Cooldown for horizontal movement
    }

    createGrid() {
        return Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(0));
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameRunning && !this.gamePaused) {
                    this.velocity.y = this.dropSpeed;
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').textContent = this.gamePaused ? 'Resume' : 'Pause';
    }

    start() {
        this.grid = this.createGrid();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        this.rotationVelocity = 0;
        this.moveFrameCooldown = 0;

        this.nextPiece = this.createRandomPiece();
        this.spawnNewPiece();

        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('gameOverScreen').classList.add('hidden');

        this.gameLoop();
    }

    reset() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.grid = this.createGrid();
        this.currentPiece = null;
        this.moveFrameCooldown = 0;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        this.updateDisplay();
    }

    createRandomPiece() {
        const pieces = [
            { type: 'I', color: '#00f0f0', blocks: [[0, 0], [1, 0], [2, 0], [3, 0]] },
            { type: 'O', color: '#f0f000', blocks: [[0, 0], [1, 0], [0, 1], [1, 1]] },
            { type: 'T', color: '#a000f0', blocks: [[1, 0], [0, 1], [1, 1], [2, 1]] },
            { type: 'S', color: '#00f000', blocks: [[1, 0], [2, 0], [0, 1], [1, 1]] },
            { type: 'Z', color: '#f00000', blocks: [[0, 0], [1, 0], [1, 1], [2, 1]] },
            { type: 'J', color: '#f0a000', blocks: [[0, 0], [0, 1], [1, 1], [2, 1]] },
            { type: 'L', color: '#0000f0', blocks: [[2, 0], [0, 1], [1, 1], [2, 1]] }
        ];
        return JSON.parse(JSON.stringify(pieces[Math.floor(Math.random() * pieces.length)]));
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = this.gridWidth / 2 - 2;
        this.currentPiece.y = 0;

        // Calculate piece center for rotation
        let sumX = 0, sumY = 0;
        for (let block of this.currentPiece.blocks) {
            sumX += block[0];
            sumY += block[1];
        }
        this.currentPiece.centerX = sumX / this.currentPiece.blocks.length;
        this.currentPiece.centerY = sumY / this.currentPiece.blocks.length;

        this.rotation = 0;
        this.velocity = { x: 0, y: 0 };
        this.rotationVelocity = 0;

        this.nextPiece = this.createRandomPiece();
        this.drawNextPiece();

        // Check if spawn position is blocked
        if (this.checkCollision()) {
            this.endGame();
        }
    }

    // Get the bounding box of the rotated piece
    getBoundingBox(x, y, rotation) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (let block of this.currentPiece.blocks) {
            let rotatedX = block[0] * cos - block[1] * sin;
            let rotatedY = block[0] * sin + block[1] * cos;

            let worldX = x + rotatedX;
            let worldY = y + rotatedY;

            minX = Math.min(minX, worldX);
            maxX = Math.max(maxX, worldX);
            minY = Math.min(minY, worldY);
            maxY = Math.max(maxY, worldY);
        }

        return { minX, maxX, minY, maxY };
    }

    checkCollision(x = null, y = null, blocks = null, rotation = null) {
        x = x !== null ? x : this.currentPiece.x;
        y = y !== null ? y : this.currentPiece.y;
        blocks = blocks || this.currentPiece.blocks;
        rotation = rotation !== null ? rotation : this.rotation;

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        for (let block of blocks) {
            // Apply rotation transformation with floating point precision
            let rotatedX = block[0] * cos - block[1] * sin;
            let rotatedY = block[0] * sin + block[1] * cos;

            let worldX = x + rotatedX;
            let worldY = y + rotatedY;

            // Floor check (y >= gridHeight)
            if (worldY >= this.gridHeight) {
                return true;
            }

            // Wall check (x outside bounds)
            if (worldX < 0 || worldX >= this.gridWidth) {
                return true;
            }

            // Check collision with settled blocks (round for grid lookup)
            let gridX = Math.round(worldX);
            let gridY = Math.round(worldY);
            if (gridY >= 0 && gridY < this.gridHeight && gridX >= 0 && gridX < this.gridWidth && this.grid[gridY][gridX] !== 0) {
                return true;
            }
        }
        return false;
    }

    rotatePiece(direction) {
        // Apply rotational velocity instead of instant rotation
        this.rotationVelocity += direction * 0.003; // Add angular acceleration
    }

    updatePiece() {
        if (!this.currentPiece || this.gamePaused) return;

        // Horizontal movement with cooldown
        if (this.moveFrameCooldown <= 0) {
            const moveLeft = this.keys['ArrowLeft'];
            const moveRight = this.keys['ArrowRight'];

            if (moveLeft && !this.checkCollision(this.currentPiece.x - 0.5, this.currentPiece.y)) {
                this.velocity.x -= 0.15; // Add leftward velocity
                this.moveFrameCooldown = 3;
            }
            if (moveRight && !this.checkCollision(this.currentPiece.x + 0.5, this.currentPiece.y)) {
                this.velocity.x += 0.15; // Add rightward velocity
                this.moveFrameCooldown = 3;
            }
        } else {
            this.moveFrameCooldown--;
        }

        // Handle rotation
        const rotateUp = this.keys['ArrowUp'];
        const rotateDown = this.keys['ArrowDown'];

        if (rotateUp) {
            this.rotatePiece(1);
        }
        if (rotateDown) {
            this.rotatePiece(-1);
        }

        // Apply angular damping to rotation velocity
        this.rotationVelocity *= this.angularDamping;

        // Update rotation based on velocity
        let newRotation = this.rotation + this.rotationVelocity;

        // Check if rotation causes collision - if so, bounce back
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, null, newRotation)) {
            this.rotationVelocity *= -0.5; // Reverse and dampen rotation
        } else {
            this.rotation = newRotation;
        }

        // Normalize rotation to 0-2π
        this.rotation = this.rotation % (2 * Math.PI);
        if (this.rotation < 0) this.rotation += 2 * Math.PI;

        // Apply gravity
        this.velocity.y += this.gravity;

        // Apply lateral damping
        this.velocity.x *= this.lateralDamping;

        // Calculate new position
        let newX = this.currentPiece.x + this.velocity.x;
        let newY = this.currentPiece.y + this.velocity.y;

        // Check horizontal collision
        if (this.checkCollision(newX, this.currentPiece.y)) {
            // Hit a wall, bounce back
            this.velocity.x *= -0.3; // Reverse and dampen
            newX = this.currentPiece.x;
        }

        // Check vertical collision
        if (this.checkCollision(newX, newY)) {
            // Hit something below

            // If moving down significantly, settle the piece
            if (this.velocity.y > 0.05) {
                this.settlePiece();
                return;
            } else {
                // Gentle landing - stop vertical movement
                this.velocity.y = 0;
                newY = this.currentPiece.y;

                // If piece is stable (low velocities), settle it
                if (Math.abs(this.velocity.x) < 0.05 && Math.abs(this.rotationVelocity) < 0.01) {
                    this.settlePiece();
                    return;
                }
            }
        }

        // Update position
        this.currentPiece.x = newX;
        this.currentPiece.y = newY;

        // If piece is at an angle and touching ground, apply physics
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y + 0.1)) {
            // Piece is on ground - try to straighten out
            // Find the nearest 90-degree angle (0, π/2, π, 3π/2)
            const targetAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI];
            let nearestAngle = targetAngles[0];
            let minDiff = Math.abs(this.rotation - targetAngles[0]);

            for (let angle of targetAngles) {
                let diff = Math.abs(this.rotation - angle);
                if (diff < minDiff) {
                    minDiff = diff;
                    nearestAngle = angle;
                }
            }

            // Apply torque to rotate towards nearest 90-degree angle
            let angleDiff = nearestAngle - this.rotation;

            // Handle wrap-around (e.g., rotating from 350° to 10°)
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Apply corrective rotation force
            this.rotationVelocity += angleDiff * 0.01;

            // Convert some rotation into lateral movement for realism
            const rotationEffect = Math.sin(this.rotation) * 0.015;
            this.velocity.x += rotationEffect;

            // Apply stronger friction to rotation when on ground
            this.rotationVelocity *= 0.85;
        }
    }

    settlePiece() {
        // Convert piece to grid cells, allowing rotation offset
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        for (let block of this.currentPiece.blocks) {
            // Apply rotation transformation
            let rotatedX = block[0] * cos - block[1] * sin;
            let rotatedY = block[0] * sin + block[1] * cos;

            let gridX = Math.round(this.currentPiece.x + rotatedX);
            let gridY = Math.round(this.currentPiece.y + rotatedY);

            if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
                this.grid[gridY][gridX] = this.currentPiece.color;
            }
        }

        // Check for line clears with leeway
        this.checkLineClears();

        this.score += 10;
        this.spawnNewPiece();
    }

    checkLineClears() {
        let cleared = 0;

        for (let y = this.gridHeight - 1; y >= 0; y--) {
            let filled = 0;
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] !== 0) {
                    filled++;
                }
            }

            // Line clear with leeway: need 8+ filled cells out of 10 (80%)
            if (filled >= 8) {
                cleared++;
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.gridWidth).fill(0));
                y++; // Check this line again
            }
        }

        if (cleared > 0) {
            this.lines += cleared;
            const points = [0, 40, 100, 300, 1200]; // Line clear bonuses
            this.score += points[Math.min(cleared, 4)] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }

        // Draw settled blocks
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] !== 0) {
                    this.drawBlock(x, y, this.grid[y][x]);
                }
            }
        }

        // Draw current piece as a solid rotated shape
        if (this.currentPiece) {
            this.ctx.save();

            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);

            // Draw each block of the piece
            for (let block of this.currentPiece.blocks) {
                let rotatedX = block[0] * cos - block[1] * sin;
                let rotatedY = block[0] * sin + block[1] * cos;

                let screenX = (this.currentPiece.x + rotatedX) * this.cellSize;
                let screenY = (this.currentPiece.y + rotatedY) * this.cellSize;

                this.ctx.fillStyle = this.currentPiece.color;
                this.ctx.globalAlpha = 0.9;
                this.ctx.fillRect(screenX + 1, screenY + 1, this.cellSize - 2, this.cellSize - 2);

                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(screenX + 1, screenY + 1, this.cellSize - 2, this.cellSize - 2);
            }

            // Draw connecting lines between blocks to show they're connected
            this.ctx.strokeStyle = this.currentPiece.color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.5;

            for (let i = 0; i < this.currentPiece.blocks.length; i++) {
                for (let j = i + 1; j < this.currentPiece.blocks.length; j++) {
                    let block1 = this.currentPiece.blocks[i];
                    let block2 = this.currentPiece.blocks[j];

                    let rotatedX1 = block1[0] * cos - block1[1] * sin;
                    let rotatedY1 = block1[0] * sin + block1[1] * cos;
                    let rotatedX2 = block2[0] * cos - block2[1] * sin;
                    let rotatedY2 = block2[0] * sin + block2[1] * cos;

                    let screenX1 = (this.currentPiece.x + rotatedX1) * this.cellSize + this.cellSize / 2;
                    let screenY1 = (this.currentPiece.y + rotatedY1) * this.cellSize + this.cellSize / 2;
                    let screenX2 = (this.currentPiece.x + rotatedX2) * this.cellSize + this.cellSize / 2;
                    let screenY2 = (this.currentPiece.y + rotatedY2) * this.cellSize + this.cellSize / 2;

                    // Only draw lines between adjacent blocks
                    let distance = Math.sqrt(Math.pow(rotatedX2 - rotatedX1, 2) + Math.pow(rotatedY2 - rotatedY1, 2));
                    if (distance < 1.5) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(screenX1, screenY1);
                        this.ctx.lineTo(screenX2, screenY2);
                        this.ctx.stroke();
                    }
                }
            }

            this.ctx.restore();
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#1a1a1a';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const cellSize = 20;
            const offsetX = 40 - 20;
            const offsetY = 40 - 20;

            this.nextCtx.fillStyle = this.nextPiece.color;
            for (let block of this.nextPiece.blocks) {
                this.nextCtx.fillRect(
                    offsetX + block[0] * cellSize + 1,
                    offsetY + block[1] * cellSize + 1,
                    cellSize - 2,
                    cellSize - 2
                );
            }
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    gameLoop = () => {
        if (!this.gameRunning) return;

        this.updatePiece();
        this.draw();
        this.updateDisplay();

        requestAnimationFrame(this.gameLoop);
    }
}

// Initialize game
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame('gameCanvas', 'nextCanvas');

    document.getElementById('startBtn').addEventListener('click', () => game.start());
    document.getElementById('pauseBtn').addEventListener('click', () => game.togglePause());
    document.getElementById('resetBtn').addEventListener('click', () => game.reset());
    document.getElementById('restartBtn').addEventListener('click', () => {
        game.reset();
        game.start();
    });

    // Speed control sliders
    const gravitySlider = document.getElementById('gravitySlider');
    const dropSpeedSlider = document.getElementById('dropSpeedSlider');

    gravitySlider.addEventListener('input', (e) => {
        game.gravity = parseFloat(e.target.value);
        document.getElementById('gravityValue').textContent = game.gravity.toFixed(3) + 'x';
    });

    dropSpeedSlider.addEventListener('input', (e) => {
        game.dropSpeed = parseFloat(e.target.value);
        document.getElementById('dropSpeedValue').textContent = game.dropSpeed.toFixed(2) + 'x';
    });

    // Initial draw
    game.draw();
    game.drawNextPiece();
});
