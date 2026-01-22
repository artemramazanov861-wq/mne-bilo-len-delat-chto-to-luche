document.addEventListener('DOMContentLoaded', () => {
    // Элементы игры
    const gameArea = document.querySelector('.game-area');
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const restartBtn = document.getElementById('restart-btn');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    
    // Переменные игры
    let score = 0;
    let lives = 3;
    let level = 1;
    let gameRunning = false;
    let gamePaused = false;
    let playerPosition = 50; // В процентах
    let gameSpeed = 2; // Базовая скорость падения объектов
    let gameLoopId;
    let fallingObjects = [];
    let lastStarTime = 0;
    let lastAsteroidTime = 0;
    const starInterval = 1000; // Интервал появления звезд в мс
    const asteroidInterval = 1500; // Интервал появления астероидов в мс
    
    // Инициализация игры
    function initGame() {
        score = 0;
        lives = 3;
        level = 1;
        gameSpeed = 2;
        playerPosition = 50;
        fallingObjects = [];
        
        // Обновляем UI
        updateUI();
        
        // Позиционируем игрока
        player.style.left = `${playerPosition}%`;
        
        // Очищаем игровую область
        gameArea.innerHTML = '';
        gameArea.appendChild(player);
        
        // Скрываем экран окончания игры
        gameOverScreen.style.display = 'none';
    }
    
    // Обновление UI
    function updateUI() {
        scoreElement.textContent = score;
        livesElement.textContent = lives;
        levelElement.textContent = level;
    }
    
    // Движение игрока
    function movePlayer(direction) {
        if (!gameRunning || gamePaused) return;
        
        // Изменяем позицию в зависимости от направления
        if (direction === 'left' && playerPosition > 5) {
            playerPosition -= 5;
        } else if (direction === 'right' && playerPosition < 95) {
            playerPosition += 5;
        }
        
        // Применяем новую позицию
        player.style.left = `${playerPosition}%`;
    }
    
    // Создание падающего объекта
    function createFallingObject(type) {
        const object = document.createElement('div');
        const icon = document.createElement('i');
        
        if (type === 'star') {
            object.className = 'star';
            icon.className = 'fas fa-star';
            object.dataset.type = 'star';
        } else {
            object.className = 'asteroid';
            icon.className = 'fas fa-meteor';
            object.dataset.type = 'asteroid';
        }
        
        // Случайная позиция по горизонтали
        const leftPos = Math.random() * 90 + 5; // От 5% до 95%
        object.style.left = `${leftPos}%`;
        
        object.appendChild(icon);
        gameArea.appendChild(object);
        
        // Сохраняем объект для отслеживания
        fallingObjects.push({
            element: object,
            top: -40,
            left: leftPos,
            type: type,
            speed: gameSpeed + Math.random() * 2
        });
    }
    
    // Обновление позиций падающих объектов
    function updateFallingObjects() {
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            const obj = fallingObjects[i];
            
            // Двигаем объект вниз
            obj.top += obj.speed;
            obj.element.style.top = `${obj.top}px`;
            
            // Проверка на сбор игроком
            if (obj.top > gameArea.offsetHeight - 100 && obj.top < gameArea.offsetHeight - 40) {
                // Проверяем горизонтальное пересечение с игроком
                const playerLeft = playerPosition;
                if (obj.left > playerLeft - 10 && obj.left < playerLeft + 10) {
                    if (obj.type === 'star') {
                        // Собрана звезда
                        score += level; // Чем выше уровень, тем больше очков
                        if (score >= level * 10) {
                            level++;
                            gameSpeed += 0.5; // Увеличиваем скорость с каждым уровнем
                        }
                    } else {
                        // Столкновение с астероидом
                        lives--;
                        if (lives <= 0) {
                            endGame();
                            return;
                        }
                    }
                    
                    // Удаляем объект
                    obj.element.remove();
                    fallingObjects.splice(i, 1);
                    updateUI();
                    continue;
                }
            }
            
            // Удаляем объекты, упавшие за пределы экрана
            if (obj.top > gameArea.offsetHeight) {
                obj.element.remove();
                fallingObjects.splice(i, 1);
            }
        }
    }
    
    // Основной игровой цикл
    function gameLoop(timestamp) {
        if (!gameRunning || gamePaused) return;
        
        // Создание новых объектов с определенными интервалами
        if (timestamp - lastStarTime > starInterval) {
            createFallingObject('star');
            lastStarTime = timestamp;
        }
        
        if (timestamp - lastAsteroidTime > asteroidInterval) {
            createFallingObject('asteroid');
            lastAsteroidTime = timestamp;
        }
        
        // Обновление падающих объектов
        updateFallingObjects();
        
        // Продолжаем игровой цикл
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // Начало игры
    function startGame() {
        if (gameRunning) return;
        
        gameRunning = true;
        gamePaused = false;
        lastStarTime = performance.now();
        lastAsteroidTime = performance.now();
        
        // Запускаем игровой цикл
        gameLoopId = requestAnimationFrame(gameLoop);
        
        // Обновляем текст кнопок
        startBtn.innerHTML = '<i class="fas fa-play"></i> Игра идет';
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
    
    // Пауза игры
    function pauseGame() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (gamePaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Продолжить';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
            // Продолжаем игровой цикл
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Конец игры
    function endGame() {
        gameRunning = false;
        gamePaused = false;
        
        // Отменяем игровой цикл
        cancelAnimationFrame(gameLoopId);
        
        // Показываем экран окончания игры
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
        
        // Обновляем кнопки
        startBtn.innerHTML = '<i class="fas fa-play"></i> Старт';
        startBtn.disabled = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Пауза';
        pauseBtn.disabled = true;
    }
    
    // Обработчики событий для кнопок управления
    document.querySelector('.left-btn').addEventListener('click', () => movePlayer('left'));
    document.querySelector('.right-btn').addEventListener('click', () => movePlayer('right'));
    
    // Обработчики событий для сенсорного управления
    let touchStartX = 0;
    
    gameArea.addEventListener('touchstart', (e) => {
        if (!gameRunning || gamePaused) return;
        
        touchStartX = e.touches[0].clientX;
        e.preventDefault();
    });
    
    gameArea.addEventListener('touchmove', (e) => {
        if (!gameRunning || gamePaused) return;
        
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        
        // Если перемещение больше 10px, двигаем игрока
        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                movePlayer('right');
            } else {
                movePlayer('left');
            }
            touchStartX = touchX;
        }
        
        e.preventDefault();
    });
    
    // Обработчики для кнопок управления игрой
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', () => {
        if (gameRunning) {
            if (confirm('Вы уверены? Текущий прогресс будет потерян.')) {
                initGame();
                startGame();
            }
        } else {
            initGame();
        }
    });
    restartBtn.addEventListener('click', () => {
        initGame();
        startGame();
    });
    
    // Обработчики для клавиатуры (для тестирования на ПК)
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        if (e.key === 'ArrowLeft') {
            movePlayer('left');
        } else if (e.key === 'ArrowRight') {
            movePlayer('right');
        }
    });
    
    // Инициализация игры при загрузке
    initGame();
    
    // Информация о создателе игры
    console.log('Игра "Космический сборщик" создана специально для мобильных устройств!');
    console.log('Управление: кнопки влево/вправо или свайпы по игровому полю');
});