
window.addEventListener("keydown", function(e){
    e.preventDefault();
    gameArea.keys = (gameArea.keys || []);
    gameArea.keys[e.key] = true;
});

window.addEventListener("keyup", function(e){
    gameArea.keys[e.key] = false;
});

//---------------------------------------------------------------------------

let div = document.getElementById('rightBox');
let scoreValue = document.getElementById('scoreValue');
let livesValue = document.getElementById('livesValue');
let speedValue = document.getElementById('speedValue');
let statusValue = document.getElementById('statusValue');

let gameArea, background, topBoundary, bottomBoundary, statusBar, player, mist;
let projectiles = [], enemies = [];
let score = 0, playerHP = 10, playerMaxHP = 10, gameSpeed = 1.0;
let defaultInterval = 20, curInterval;      // interval for running
let backgroundImages = ["resources/background.png", "resources/mist.png"];
let roleImages = ["resources/wizardDefault.png", "resources/wizardActive.png"];
let magicBallImage = "resources/magicBall.png";
let enemiesImages = [
    ["resources/greenDefault.png", "resources/greenDead.png", "resources/greenDefault.png"], 
    ["resources/redDefault.png", "resources/redDead.png", "resources/redDefault.png"],
    ["resources/blueDefault.png", "resources/blueDead.png", "resources/blueDefault.png"]
];

let isOpening, openingFrame, openingInterval;
let openingMask, wizardText, vsText, slimeText;
let openingFrameAfterHit = 1000, vsTextOpacity = 0;

function startGame(){
    gameArea = new GameArea(600, 600);
    gameArea.initiate();

    // Basic objects
    background = new BackgroundBlock(0, 0, gameArea.canvas.width, gameArea.canvas.height, true, backgroundImages[0]);
    mist = new BackgroundBlock(0, 0, gameArea.canvas.width, gameArea.canvas.height, true, backgroundImages[1]);
    topBoundary = new BackgroundBlock(0, -20, gameArea.canvas.width, 1, false, "rgba(0, 0, 0, 0)");
    bottomBoundary = new BackgroundBlock(0, 540, gameArea.canvas.width, 1, false, "rgba(0, 0, 0, 0)");
    statusBar = new BackgroundBlock(0, 540, gameArea.canvas.width, 60, false, "rgba(0, 0, 0, 1)");
    screenMask = new BackgroundBlock(0, 0, gameArea.canvas.width, gameArea.canvas.height, false, "rgba(0, 0, 0, 0.6)");
    player = new Role(255, 445, 90, 100, true, roleImages);

    // Opening
    isOpening = true;
    openingFrame = 0;
    openingMask = new BackgroundBlock(0, 0, gameArea.canvas.width, gameArea.canvas.height, false, "rgba(0, 0, 0, 1)")
    wizardText = new TextImage(30, -225, 400, 200, 0, 5, "resources/textWizard.png");
    vsText = new TextImage(50, 95, 500, 250, 0, 0, "resources/textVS.png");
    slimeText = new TextImage(300, 500, 400, 200, 0, -5, "resources/textSlime.png");
    openingInterval = setInterval(open, 20);
}

//---------------------------------------------------------------------------

function open(){
    gameArea.clear();

    wizardText.newPos();
    slimeText.newPos();

    wizardTextBrake();
    slimeTextBrake();
    vsTextEmerge();

    openingMask.display();
    wizardText.display(1);
    vsText.display(vsTextOpacity);
    slimeText.display(1);

    openingFrame += 1;
    if (openingFrame >= 150){openingEnd();}
}

function wizardTextBrake(){
    if (wizardText.y > 100){
        wizardText.y = 100;
        wizardText.speedY = 0;
    }
}

function slimeTextBrake(){
    if (slimeText.y == 160){
        slimeText.speedY *= -1;
        openingFrameAfterHit = openingFrame;
    }
    if (openingFrame > openingFrameAfterHit){
        slimeText.speedY *= 0.9;
        if (slimeText.y >= 200){
            slimeText.y = 200;
            slimeText.speedY = 0;
        }
    }
}

function vsTextEmerge(){
    if (openingFrame > openingFrameAfterHit){
        vsTextOpacity += 0.03;
        if (vsTextOpacity > 1){vsTextOpacity = 1;}
    }
}

function openingEnd(){
    isOpening = false;
    clearInterval(openingInterval);
    // setTimeout(run, 100);
    // setTimeout(gameArea.overlay, 101, "Press \"play\" to start");
    run();
    gameArea.overlay("Press \"play\" to start");
    statusValue.textContent = "Ready";
}

//---------------------------------------------------------------------------

class GameArea {
    constructor(width, height){
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext("2d");
        this.isRunning = false;
        this.isOver = false;
        this.frameNo = -1;
    }

    initiate(){
        document.body.insertBefore(this.canvas, div);
        // document.body.appendChild(this.canvas);
    }

    start(){
        if (this.isRunning){return;}
        this.isRunning = true;
        this.updateInterval();
    }

    clear(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    stop(){
        if (!this.isRunning){return;}
        clearInterval(this.runningInterval);
        this.isRunning = false;
    }

    updateInterval(){
        if (this.runningInterval){clearInterval(this.runningInterval);}
        curInterval = Math.round(defaultInterval / gameSpeed);
        this.runningInterval = setInterval(run, curInterval);
        // Updating every 0.02 sec (default)
        // (10 (=0.01 sec) is the minimum)
    }

    overlay(text){
        screenMask.display();
        const ctx = gameArea.context;
        ctx.font = "25px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 1)"
        ctx.fillText(text, 140, 313);
    }
}

class BackgroundBlock {
    constructor (x, y, width, height, isImage, skin){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isImage = isImage;
        this.opacity = 1;
        
        if (isImage){
            this.image = new Image();
            this.image.src = skin;
        }else {
            this.color = skin;
        }
    }

    display(){
        const ctx = gameArea.context;
        ctx.save();
        if (this.opacity < 0){this.opacity = 0;}
        if (this.opacity > 1){this.opacity = 1;}
        ctx.globalAlpha = this.opacity;
        if (this.isImage){
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}

class TextImage {
    constructor(x, y, width, height, speedX, speedY, skin){
        this.oriX = x;
        this.oriY = y;
        this.oriW = width;
        this.oriH = height;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = speedX;
        this.speedY = speedY;

        this.image = new Image();
        this.image.src = skin;
    }

    display(opacity){
        const ctx = gameArea.context;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    newPos(){
        this.x += this.speedX;
        this.y += this.speedY;
    }

    scaling(factor){
        this.width = this.oriW * factor;
        this.height = this.oriH * factor;
        this.x = this.oriX - ((this.width - this.oriW) / 2);
        this.y = this.oriY - (this.height - this.oriH);
        // this.y = this.oriY;
    }
}

class Role {
    constructor(x, y, width, height, isImage, skins){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = 0;
        this.isImage = isImage;
        this.skins = skins;
        this.skinIndex = 0;
        this.skinTimer = 0;

        this.normalAttack = new Ability(25);

        if (isImage){
            this.image = new Image();
            this.image.src = this.skins[this.skinIndex];
        }else {
            this.color = this.skins[this.skinIndex];
        }
    }

    display(){
        this.changeSkin(0, 0);
        const ctx = gameArea.context;
        if (this.isImage){
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    newPos(){
        this.x += this.speedX;
        this.meetWall();
    }

    meetWall(){
        if (this.x < 0){
            this.x = 0;
            this.speedX = 0;
        }
        if (this.x > (gameArea.canvas.width - this.width)){
            this.x = gameArea.canvas.width - this.width;
            this.speedX = 0;
        }
    }

    changeSkin(index, duration){
        if (this.skinIndex == index){
            return;
        }
        if (this.skinTimer > 0){
            this.skinTimer -= 1;
            return;
        }
        this.skinTimer = duration;
        this.skinIndex = index;
        this.image.src = this.skins[this.skinIndex];
    }

    coolDown(){
        this.normalAttack.coolDown();
    }

    useNormalAttack(){
        if (this.normalAttack.isReady()){
            let proSide = 20;
            let proX = this.x + (this.width / 2) - (proSide / 2);
            let proY = this.y - proSide;
            projectiles.push(new Projectile(proX, proY, proSide, proSide, -3, true, magicBallImage, 1))
            this.normalAttack.reset();
            this.changeSkin(1, 10);
        }
    }
}

class Ability {
    constructor(maxCD){
        this.maxCD = maxCD;
        this.remainingCD = 0;
    }

    coolDown(){
        if (this.remainingCD > 0){
            this.remainingCD -= 1;
        }
        if (this.remainingCD <= 0){
            this.remainingCD = 0;
        }
    }

    reset(){
        this.remainingCD = this.maxCD;
    }

    isReady(){
        return (this.remainingCD == 0);
    }
}

class Projectile {
    constructor(x, y, width, height, speedY, isImage, skin, damage){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedY = speedY;
        this.isImage = isImage;
        this.damage = damage;

        if (isImage){
            this.image = new Image();
            this.image.src = skin;
        }else {
            this.color = skin;
        }
    }

    display(){
        const ctx = gameArea.context;
        if (this.isImage){
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // ctx.fillStyle = this.color;
            // ctx.fillRect(this.x, this.y, this.width, this.height);

            let grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width/2);
            grd.addColorStop(0, "rgba(255, 255, 255, 1)");
            grd.addColorStop(1, this.color);

            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, 2*Math.PI);
            ctx.fill();
        }
    }

    newPos(){
        this.y += this.speedY;
    }

    isMeet(object){
        return (
            (this.y + this.height) > object.y &&
            this.y < (object.y + object.height) &&
            (this.x + this.width) > object.x &&
            this.x < (object.x + object.width)
        );
    }
}

class Enemy {
    constructor(x, y, width, height, speedY, isImage, skins, maxHP, moveDuration, idleDuration){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedY = speedY;
        this.isImage = isImage;
        this.skins = skins;
        this.skinIndex = 0;
        this.skinTimer = 0;

        this.remainingHP = maxHP;
        this.moveDuration = moveDuration;
        this.idleDuration = idleDuration;
        this.moveTimer = moveDuration;
        this.isMoving = true;
        this.fadeTimer = 50;

        if (isImage){
            this.image = new Image();
            this.image.src = this.skins[this.skinIndex];
        }else {
            this.color = this.skins[this.skinIndex];
        }
    }

    display(){
        const ctx = gameArea.context;
        if (this.isDead()){
            this.changeSkin(1, 0);
            ctx.save();
            ctx.globalAlpha = this.fadeTimer * 0.02;
        } else {
            if (this.isMoving){this.changeSkin(0, 0);}
            else {this.changeSkin(2, 0);}
        }

        if (this.isImage){
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.isDead()){ctx.restore();}
    }

    newPos(){
        this.moveTimer -= 1;
        if (this.isMoving){this.y += this.speedY;}

        if (this.moveTimer <= 0){
            if (this.isMoving){
                this.isMoving = false;
                this.moveTimer = this.idleDuration;
            }else {
                this.isMoving = true;
                this.moveTimer = this.moveDuration;
            }
        }
    }

    isMeet(object){
        return (
            (this.y + this.height) > object.y &&
            this.y < (object.y + object.height) &&
            (this.x + this.width) > object.x &&
            this.x < (object.x + object.width)
        );
    }

    changeSkin(index, duration){
        if (this.skinIndex == index){
            return;
        }
        if (this.skinTimer > 0){
            this.skinTimer -= 1;
            return;
        }
        this.skinTimer = duration;
        this.skinIndex = index;
        this.image.src = this.skins[this.skinIndex];
    }

    takeDamage(damage){
        this.remainingHP -= damage;
        if (this.remainingHP <= 0){
            this.remainingHP = 0;
        }
    }

    isDead(){
        return (this.remainingHP <= 0);
    }

    canFadeAway(){
        if (this.fadeTimer > 0){
            this.fadeTimer -= 1;
            return false;
        }
        return true;
    }
}

//---------------------------------------------------------------------------

function play(){
    if (!gameArea.isOver && !isOpening){
        gameArea.start();
        statusValue.textContent = "Playing";
    }
}

function pause(){
    if (gameArea.isRunning){
        gameArea.stop();
        gameArea.overlay("Press \"play\" to continue");
        statusValue.textContent = "Paused";
    }
}

function reset(){
    if (!isOpening){
        gameArea.stop();

        // Reset all values
        player = new Role(255, 445, 90, 100, true, roleImages);
        projectiles = [], enemies = [];
        score = 0, playerHP = playerMaxHP, gameSpeed = 1.0;
        gameArea.frameNo = -1;
        gameArea.isOver = false;

        // Update inside object
        run();
        gameArea.overlay("Press \"play\" to start");

        // Update outside info
        speedValue.textContent = gameSpeed.toFixed(1) + " x";
        statusValue.textContent = "Ready";
    }
}

function speedUp(){
    gameSpeed = Math.round(gameSpeed * 10 + 1) / 10;
    if (gameSpeed > 1.5){gameSpeed = 1.5;}
    if (gameArea.isRunning){gameArea.updateInterval();}
    speedValue.textContent = gameSpeed.toFixed(1) + " x";
}

function speedDown(){
    gameSpeed = Math.round(gameSpeed * 10 - 1) / 10;
    if (gameSpeed < 0.5){gameSpeed = 0.5;}
    if (gameArea.isRunning){gameArea.updateInterval();}
    speedValue.textContent = gameSpeed.toFixed(1) + " x";
}

//---------------------------------------------------------------------------

function run(){
    updateGameArea();
    updateEnemies();
    updateProjectiles();
    updatePlayer();
    processHits();


    mist.opacity = Math.floor(gameArea.frameNo / 900) * 0.1;
    mist.display();
    
    updateStatus();
    gameArea.frameNo += 1;
}

function updateGameArea() {
    gameArea.clear();
    background.display();
}

function updatePlayer(){
    playerControl();
    player.coolDown();
    player.newPos();
    player.display();
}

function updateProjectiles(){
    for (let i = (projectiles.length - 1); i >= 0; i--){
        if (projectiles[i].isMeet(topBoundary)){
            projectiles.splice(i, 1);
        } else {
            projectiles[i].newPos();
            projectiles[i].display();
        }
    }
}

function updateEnemies(){
    let generateInterval = 40 - Math.floor(gameArea.frameNo / 250);
    if (generateInterval < 30){generateInterval = 30;}
    if (gameArea.frameNo % generateInterval == 1){generateEnemies();}

    for (let i = (enemies.length - 1); i >= 0; i--){
        if (!enemies[i].isDead()){
            enemies[i].newPos();
            enemies[i].display();   
        } else {
            if (enemies[i].canFadeAway()){
                enemies.splice(i, 1);
            } else {
                enemies[i].display();
            }
        }
    }
}

function processHits(){
    projectilesHitEnemies();
    enemiesHitBottom();
}

function updateStatus(){
    statusBar.display();
    const ctx = gameArea.context;

    if (playerHP < 0){playerHP = 0;}
    let hpPercent = playerHP / playerMaxHP;
    displayHPBar(450, 555, 125, 30, "rgba(255, 79, 79, 1)", hpPercent);

    // Display score
    ctx.font = "20px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 1)"
    ctx.fillText("Score: " + score, 20, 577);

    // Display playerHP
    ctx.fillText("HP:", 410, 577);
    ctx.fillText(playerHP + "/" + playerMaxHP, 485, 577);

    if (playerHP <= 0){gameOver();}

    // Outside Info
    scoreValue.textContent = score;
    livesValue.textContent = playerHP + "/"+ playerMaxHP;
}

//---------------------------------------------------------------------------

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function playerControl() {
    player.speedX = 0;
    player.speedY = 0;

    if (gameArea.keys){
        if (gameArea.keys['ArrowLeft']){player.speedX = -8;}
        if (gameArea.keys['ArrowRight']){player.speedX = 8;}
        if (gameArea.keys[' ']){player.useNormalAttack();}
    }
}

function generateEnemies(){
    let x, y, width = 75, height = 75, speedY, isImage = true, skins, hp = 1, moveDuration, idleDuration= 10;
    x = randomInt(0, gameArea.canvas.width - width);
    y = -height;
    speedY = randomInt(100, 200) / 200 * (Math.floor(gameArea.frameNo / 500) * 0.1 + 1);
    skins = enemiesImages[randomInt(0, enemiesImages.length - 1)];
    moveDuration = randomInt(40, 60);
    enemies.push(new Enemy(x, y, width, height, speedY, isImage, skins, hp, moveDuration, idleDuration));
}

function projectilesHitEnemies(){
    for (let i = (enemies.length - 1); i >= 0; i--){
        for (let j = (projectiles.length - 1); j >= 0; j--){
            if (!enemies[i].isDead()){
                if (enemies[i].isMeet(projectiles[j])){
                    enemies[i].takeDamage(projectiles[j].damage);
                    projectiles.splice(j, 1);
                }
                if (enemies[i].isDead()){
                    score += 10;
                    break;
                }
            }
        }
    }
}

function enemiesHitBottom(){
    for (let i = (enemies.length - 1); i >= 0; i--){
        if (enemies[i].isMeet(bottomBoundary) || enemies[i].isMeet(player)){
            enemies.splice(i, 1);
            playerHP -= 1;
        }
    }
}

function displayHPBar(x, y, width, height, color, percentage){
    const ctx = gameArea.context;
    ctx.save();

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * percentage, height);

    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
}

function gameOver(){
    gameArea.isOver = true;
    gameArea.stop();
    gameArea.overlay("Press \"reset\" to ready again");
    statusValue.textContent = "Game Over";
}