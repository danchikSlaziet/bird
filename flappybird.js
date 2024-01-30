//board
let board;
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
}

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth + 100;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.2;

let gameOver = false;
let isPaused = false;
let score = 0;

let pauseKey = "Escape";
let resumeKey = "Escape"; // Можете изменить клавишу для продолжения, если хотите
let enterKey = "Enter";


let coinArray = []; // Массив для хранения монеток
let coinWidth = 34;
let coinHeight = 34;
let coinX = boardWidth + 100;
let coinY = 0;

let goldCoinImg;
let silverCoinImg;
let bronzeCoinImg;

let gameOverPage;
let scoreCountArray;
let gameRestart;
let scoreFinalPage;

let coinTypes = ["gold", "silver", "bronze"]; // Три вида монеток
let collectedCoins = { "gold": 0, "silver": 0, "bronze": 0 }; // Счетчик собранных монеток

let gameStarted = false;

function resetGame() {
    cancelAnimationFrame(animationId);  // Отмена анимации при сбросе игры
    bird.y = birdY;
    pipeArray = [];
    coinArray = [];
    score = 0;
    collectedCoins = { "gold": 0, "silver": 0, "bronze": 0 };
    gameStarted = false;
}

window.onload = function () {
    const startPage = document.querySelector('.start-page');
    const startPageButton = startPage.querySelector('.start-page__button');
    gameOverPage = document.querySelector('.game-over');
    scoreFinalPage = document.querySelector('.game-over__score');
    scoreCountArray = document.querySelectorAll('.game-over__score-num');
    board = document.getElementById("board");
    gameRestart = document.querySelector('.game-over__restart');
    function changeImagesOnStartPage() {
        let coinImages = ['./gold_coin.png', './silver_coin.png', './bronze_coin.png'];
        let currentImageIndex = 0;
        let coinElement = document.querySelector('.start-page__coin');
        
        const intervalIdImages = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % coinImages.length;
            coinElement.src = coinImages[currentImageIndex];
        }, 1200);
    
        startPageButton.addEventListener('click', () => {
            clearInterval(intervalIdImages);
        })
    }
    changeImagesOnStartPage();

    // Добавляем обработчик событий после того, как gameRestart будет найден
    if (gameRestart) {
        gameRestart.addEventListener('click', function () {
            gameOverPage.classList.remove('game-over_active');
            resetGame();  // Сброс игры
            startGame();
        });
    }
    Resize();
    window.addEventListener("resize", Resize); // Change the canvas size with the window size
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";


    goldCoinImg = new Image();
    goldCoinImg.src = "./gold_coin.png"; // Путь к изображению золотой монетки

    silverCoinImg = new Image();
    silverCoinImg.src = "./silver_coin.png"; // Путь к изображению серебрянной монетки

    bronzeCoinImg = new Image();
    bronzeCoinImg.src = "./bronze_coin.png"; // Путь к изображению бронзовой монетки
    startPageButton.addEventListener('click', () => {
        startPage.classList.remove('start-page_active');
        requestAnimationFrame(update);
        setInterval(placePipes, 1500); // Переименовано для унификации функции генерации объектов
        document.addEventListener("keydown", handleKeyPress);
    });
}

function handleRestartClick() {
    gameOverPage.classList.remove('game-over_active');
    resetGame();  // Сброс игры
    startGame();
}

function Resize() {
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    boardWidth = window.innerWidth;
    boardHeight = window.innerHeight;
}

let animationId;

function update() {
    animationId = requestAnimationFrame(update);
    if (gameOver || isPaused) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    for (let i = 0; i < coinArray.length; i++) {
        let coin = coinArray[i];
        coin.x += velocityX;

        let coinImage;
        switch (coin.type) {
            case "gold":
                coinImage = goldCoinImg;
                break;
            case "silver":
                coinImage = silverCoinImg;
                break;
            case "bronze":
                coinImage = bronzeCoinImg;
                break;
            default:
                coinImage = goldCoinImg;
        }

        // Проверка коллизии с монеткой
        if (!coin.collected && detectCollision(bird, coin)) {
            coin.collected = true;
            collectedCoins[coin.type]++;
            coinArray.splice(i, 1); // Удаление собранной монетки из массива
            i--; // Уменьшаем индекс, так как массив уменьшился
        } else {
            context.drawImage(coinImage, coin.x, coin.y, coin.width, coin.height);
        }
    }

    coinArray = coinArray.filter((coin) => coin.x > -coin.width);

    // Генерация дополнительных монеток
    if (Math.random() < 0.015) {
        placeCoins();
    }

    // Draw the number of collected coins
    context.fillStyle = "white";
    context.font = "40px Pixel";
    context.fillText(`Счёт: ${collectedCoins.gold + collectedCoins.silver + collectedCoins.bronze}`, 5, 25);

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    if (gameOver) {
        scoreCountArray.forEach((elem, index) => {
            if (index === 0) {
                elem.textContent = `${collectedCoins["gold"]}`;
            }
            else if (index === 1) {
                elem.textContent = `${collectedCoins["silver"]}`;
            }
            else if (index === 2) {
                elem.textContent = `${collectedCoins["bronze"]}`;
            }
        });
        scoreFinalPage.textContent = `${collectedCoins["gold"] + collectedCoins["silver"] + collectedCoins["bronze"]}`;
        gameOverPage.classList.add('game-over_active');       
        // Сброс счета по монеткам при проигрыше
        collectedCoins = { "gold": 0, "silver": 0, "bronze": 0 };
    }
}

document.addEventListener("touchstart", handleTouchStart);

// Функция обработки касания
function handleTouchStart(e) {
    // Проверяем, что игра не завершена
    if (!gameOver) {
        //jump
        velocityY = -3.75;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}


function placeCoins() {
    if (gameOver || isPaused) {
        return;
    }

    // Генерация случайного типа монетки
    let randomCoinType = coinTypes[Math.floor(Math.random() * coinTypes.length)];

    // Позиция для генерации монетки
    let coinPosition = generateRandomCoinPosition();

    let coin = {
        type: randomCoinType,
        x: coinPosition.x,
        y: coinPosition.y,
        width: coinWidth,
        height: coinHeight,
        collected: false
    };

    // Проверка, чтобы монетки не перекрывались с трубами
    if (!isCoinOverlappingWithPipes(coin)) {
        coinArray.push(coin);
    }
}

function generateRandomCoinPosition() {
    // Генерация случайной позиции для монетки справа от экрана
    let minY = board.height / 4; // Минимальная координата, чтобы не генерировать монетки выше верхней трети экрана
    let maxY = board.height * 3 / 4 - coinHeight; // Максимальная координата, чтобы не генерировать монетки ниже нижней трети экрана

    let pipeGap = 180; // Минимальное расстояние между трубами

    // Выбираем случайные трубы между которыми будет генерироваться монетка
    let randomTopPipe = pipeArray[Math.floor(Math.random() * pipeArray.length)];
    let randomBottomPipe = pipeArray.find(pipe => pipe.y > randomTopPipe.y + pipeGap);

    if (!randomTopPipe || !randomBottomPipe) {
        // Если трубы отсутствуют, возвращаем случайные координаты справа от экрана
        return { x: board.width + coinWidth, y: Math.random() * (maxY - minY) + minY };
    }

    // Генерация координаты по x за пределами экрана, чтобы монетка появилась справа
    let coinX = board.width + coinWidth;

    // Генерация случайной координаты по y для монетки между трубами
    let coinY = minY + Math.random() * (maxY - minY);

    return { x: coinX, y: coinY };
}

function generateRandomCoinY() {
    // Генерация случайной координаты по y для монетки
    let minY = board.height / 4; // Минимальная координата, чтобы не генерировать монетки выше верхней трети экрана
    let maxY = board.height * 3 / 4 - coinHeight; // Максимальная координата, чтобы не генерировать монетки ниже нижней трети экрана
    return minY + Math.random() * (maxY - minY);
}

// Проверка, чтобы монетка не перекрывалась с трубами
function isCoinOverlappingWithPipes(coin) {
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        if (
            coin.x < pipe.x + pipe.width &&
            coin.x + coin.width > pipe.x &&
            coin.y < pipe.y + pipe.height &&
            coin.y + coin.height > pipe.y
        ) {
            return true;
        }
    }
    return false;
}

function placePipes() {
    if (gameOver || isPaused) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;
    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    // if (pipeArray.length >= 4) {
    //     console.log((pipeArray[pipeArray.length - 2]).x);
    //     console.log(topPipe.x)
    // } 
    if (pipeArray.length >= 4 && Math.abs(topPipe.x - pipeArray[pipeArray.length - 2].x) < 180) {
        topPipe.x += 300;
        pipeArray.push(topPipe);
    }
    else {
        pipeArray.push(topPipe);
    }

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    if (pipeArray.length >= 4 && Math.abs(bottomPipe.x - pipeArray[pipeArray.length - 2].x) < 180) {
        bottomPipe.x += 300;
        pipeArray.push(bottomPipe);
    }
    else {
        pipeArray.push(bottomPipe);
    }
    placeCoins();
}

function moveBird(e) {
    // Проверяем, что игра не завершена
    if (!gameOver) {
        // Проверяем, что событие произошло внутри окна
        if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
            // Проверяем, что игра не завершена
            if (!gameOver) {
                // Прыгаем
                velocityY = -3.75;

                // Сброс игры
                if (gameOver) {
                    bird.y = birdY;
                    pipeArray = [];
                    score = 0;
                    gameOver = false;
                }
            }
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function handleKeyPress(e) {
    if (e.code === pauseKey) {
        togglePause();
    } else {
        // Вызываем moveBird только если игра не на паузе и не завершена
        moveBird(e);
    }
}

document.addEventListener("keydown", handleKeyPress);

function togglePause() {
    if (!gameOver) {
        if (isPaused) {
            // Если игра на паузе, продолжаем ее выполнение
            isPaused = false;
            requestAnimationFrame(update);
        } else {
            // Если игра не на паузе, ставим ее на паузу
            isPaused = true;
            cancelAnimationFrame(animationId);
        }
    }
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        // Инициализируем начальные значения переменных и начинаем игру
        gameOver = false;
        bird.y = birdY;
        velocityY = -3.75;
        pipeArray = [];
        coinArray = [];
        score = 0;
        collectedCoins = { "gold": 0, "silver": 0, "bronze": 0 };
        isPaused = false;
        animationId = requestAnimationFrame(update);
    }
}
