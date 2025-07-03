class MazeGame {
    constructor() {
        this.mazeSize = 15;
        this.cellSize = 40;
        this.wallHeight = 60;
        this.playerPos = {
            x: 1,
            y: 1
        };
        this.goalPos = {
            x: 13,
            y: 13
        };
        this.cameraRotation = {
            x: -30,
            y: 0,
            z: 0
        };
        this.maze = [];
        this.gameWon = false;
        this.startTime = Date.now();

        this.mazeElement = document.getElementById('maze');
        this.gameContainer = document.getElementById('gameContainer');

        this.initControls();
        this.generateMaze();
        this.renderMaze();
        this.updateCamera();
        this.startTimer();
    }

    generateMaze() {
        // Создаем пустой лабиринт (все стены)
        this.maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(1));

        // Генерируем лабиринт с помощью алгоритма "поиск в глубину"
        const stack = [];
        const current = {
            x: 1,
            y: 1
        };
        this.maze[1][1] = 0; // Стартовая позиция

        const getNeighbors = (x, y) => {
            const neighbors = [];
            const directions = [
                [0, -2],
                [2, 0],
                [0, 2],
                [-2, 0]
            ];

            for (let [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 1 && nx < this.mazeSize - 1 &&
                    ny >= 1 && ny < this.mazeSize - 1 &&
                    this.maze[ny][nx] === 1) {
                    neighbors.push({
                        x: nx,
                        y: ny,
                        dx,
                        dy
                    });
                }
            }
            return neighbors;
        };

        stack.push(current);

        while (stack.length > 0) {
            const neighbors = getNeighbors(current.x, current.y);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];

                // Убираем стену между текущей и следующей клеткой
                this.maze[current.y + next.dy / 2][current.x + next.dx / 2] = 0;
                this.maze[next.y][next.x] = 0;

                stack.push({
                    x: current.x,
                    y: current.y
                });
                current.x = next.x;
                current.y = next.y;
            } else if (stack.length > 0) {
                const prev = stack.pop();
                current.x = prev.x;
                current.y = prev.y;
            }
        }

        // Убеждаемся, что цель доступна
        this.maze[this.goalPos.y][this.goalPos.x] = 0;
    }

    renderMaze() {
        this.mazeElement.innerHTML = '';

        // Создаем пол
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                if (this.maze[y][x] === 0) {
                    const floor = document.createElement('div');
                    floor.className = 'floor';
                    floor.style.width = `${this.cellSize}px`;
                    floor.style.height = `${this.cellSize}px`;
                    floor.style.left = `${x * this.cellSize}px`;
                    floor.style.top = `${y * this.cellSize}px`;
                    floor.style.transform = `translateZ(0px)`;
                    this.mazeElement.appendChild(floor);
                }
            }
        }

        // Создаем стены
        for (let y = 0; y < this.mazeSize; y++) {
            for (let x = 0; x < this.mazeSize; x++) {
                if (this.maze[y][x] === 1) {
                    const wall = document.createElement('div');
                    wall.className = 'wall';
                    wall.style.width = `${this.cellSize}px`;
                    wall.style.height = `${this.wallHeight}px`;
                    wall.style.left = `${x * this.cellSize}px`;
                    wall.style.top = `${y * this.cellSize}px`;
                    wall.style.transform = `translateZ(${this.wallHeight/2}px) rotateX(90deg)`;
                    this.mazeElement.appendChild(wall);
                }
            }
        }

        // Создаем игрока
        const player = document.createElement('div');
        player.className = 'player';
        player.id = 'player';
        this.mazeElement.appendChild(player);

        // Создаем цель
        const goal = document.createElement('div');
        goal.className = 'goal';
        goal.id = 'goal';
        this.mazeElement.appendChild(goal);

        this.updatePlayerPosition();
        this.updateGoalPosition();
    }

    updatePlayerPosition() {
        const player = document.getElementById('player');
        const x = this.playerPos.x * this.cellSize + this.cellSize / 2 - 10;
        const y = this.playerPos.y * this.cellSize + this.cellSize / 2 - 10;
        player.style.left = `${x}px`;
        player.style.top = `${y}px`;
        player.style.transform = `translateZ(20px)`;
    }

    updateGoalPosition() {
        const goal = document.getElementById('goal');
        const x = this.goalPos.x * this.cellSize + this.cellSize / 2 - 10;
        const y = this.goalPos.y * this.cellSize + this.cellSize / 2 - 10;
        goal.style.left = `${x}px`;
        goal.style.top = `${y}px`;
        goal.style.transform = `translateZ(20px)`;
    }

    updateCamera() {
        const centerX = (this.mazeSize * this.cellSize) / 2;
        const centerY = (this.mazeSize * this.cellSize) / 2;

        this.mazeElement.style.transform = `
                    translate(-50%, -50%)
                    translateX(-${centerX}px)
                    translateY(-${centerY}px)
                    rotateX(${this.cameraRotation.x}deg)
                    rotateY(${this.cameraRotation.y}deg)
                    rotateZ(${this.cameraRotation.z}deg)
                `;
    }

    movePlayer(dx, dy) {
        if (this.gameWon) return;

        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        // Проверяем границы и стены
        if (newX >= 0 && newX < this.mazeSize &&
            newY >= 0 && newY < this.mazeSize &&
            this.maze[newY][newX] === 0) {

            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.updatePlayerPosition();

            // Проверяем победу
            if (this.playerPos.x === this.goalPos.x &&
                this.playerPos.y === this.goalPos.y) {
                this.winGame();
            }
        }
    }

    winGame() {
        this.gameWon = true;
        const victory = document.createElement('div');
        victory.className = 'victory';
        victory.innerHTML = 'ПОБЕДА!<br><small>Нажми "Новый лабиринт"</small>';
        document.body.appendChild(victory);
    }

    resetGame() {
        this.gameWon = false;
        this.playerPos = {
            x: 1,
            y: 1
        };
        this.goalPos = {
            x: this.mazeSize - 2,
            y: this.mazeSize - 2
        };
        this.cameraRotation = {
            x: -30,
            y: 0,
            z: 0
        };
        this.startTime = Date.now();

        // Удаляем сообщение о победе
        const victory = document.querySelector('.victory');
        if (victory) victory.remove();

        this.generateMaze();
        this.renderMaze();
        this.updateCamera();
    }

    startTimer() {
        setInterval(() => {
            if (!this.gameWon) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                document.getElementById('timer').textContent = `Час: ${elapsed}с`;
            }
        }, 1000);
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.movePlayer(0, -1);
                    break;
                case 's':
                case 'arrowdown':
                    this.movePlayer(0, 1);
                    break;
                case 'a':
                case 'arrowleft':
                    this.movePlayer(-1, 0);
                    break;
                case 'd':
                case 'arrowright':
                    this.movePlayer(1, 0);
                    break;
                case 'q':
                    this.cameraRotation.y -= 15;
                    this.updateCamera();
                    break;
                case 'e':
                    this.cameraRotation.y += 15;
                    this.updateCamera();
                    break;
                case 'r':
                    this.cameraRotation = {
                        x: -30,
                        y: 0,
                        z: 0
                    };
                    this.updateCamera();
                    break;
            }
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }
}

