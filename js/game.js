window.onload = function init(){
		var game = new GF();
		game.start();
	};

	// GAME FRAMEWORK
	var GF = function () {
		var canvas, ctx, width, height, canvasWidth, canvasHeight;
		var levelsWon = document.querySelector("#levelsWon");
		var ballsCurrently = document.querySelector('#ballsCurrently');
		var levelsWon = document.querySelector("#levelsWon");
		var startButton = document.querySelector('#startButton');
		
		// definitely it is better way for assets loading 
		// but currently short hack with autoplay
		var phoneMusic = new Audio('sounds/GrantGeissmanGipsies.ogg');
		phoneMusic.autoplay = true;
		phoneMusic.loop = true;
		var cueHit = new Audio('sounds/cueHit.ogg');
		cueHit.autoplay = true;
		cueHit.pause();
		var hitBetweenBalls = new Audio('sounds/hitBetweenBalls.ogg');
		hitBetweenBalls.autoplay = true;
		hitBetweenBalls.pause();
		var hitTableSide = new Audio('sounds/hitTableSide.ogg');
		hitTableSide.autoplay = true;
		hitTableSide.pause();
		var ballInPocket = new Audio('sounds/ballInPocket.ogg');
		ballInPocket.autoplay = true;
		ballInPocket.pause();
		
		var inputStates = {};
		var gameStates = {
			gameRunning: 1,
			gameOver: 2,
			currentLevel: 1,
			cursorCenter:{},
			cueTip:{},
			cueBall:{},
			ballsInPockets:{byJavaScript:0, byPlayer:0},
			levelsWon:{byJavaScript:0, byPlayer:0}
		};
		var cueBall = gameStates.cueBall;
		var ballsColors = [['#0000E1','#5959FF'],['#D50000','#FF5353'],['#FFFF00','#FFFF6C'],['#D70000','#FF2B2B'],['#D605B1','#FB55DE'],['#007100','#00C600'],['#05B19C','#15F9DC'],['#343469','#5757AC'],['#E67300','#FFA54A']];
		
		// number of balls and velocity for each level
		var gameLevels = [[5,0.2],[7,0.4],[9,0.6]];
		
		var currentGameState = gameStates.gameRunning;
		
		// array of balls to animate
		var ballsArray = [];
		
		// clears the table
		function clearCanvas() {
			ctx.clearRect(leftSideX, topSideY, width, height);
		}
		
		var mainLoopAnimationFrameID;
		//main function, called each frame
		var mainLoop = function (time) {
			if(1 == 1){cancelAnimationFrame(mainLoopAnimationFrameID)}
			ctx.clearRect(0,0,canvasWidth,canvasHeight);
			
			switch (currentGameState) {
				case gameStates.gameRunning:
					drawTable();
					drawPockets();
					// For each ball in the array
					for(var i=0; i < ballsArray.length; i++) {
						if(ballsArray[i] == undefined){continue};
						var ball = ballsArray[i];
						ball.move();   
						collisionTestWithWalls(ball, leftSideX, topSideY, rightSideX, bottomSideY, hitTableSide);
						ball.draw();
					}
					cueBall = gameStates.cueBall = ballsArray[ballsArray.length-1];
					drawCue();
					collisionTestBetweenCueBallAndCue(cueBall, gameStates.cueTip, inputStates.mousedown, cueHit);
					collisionTestBetweenBalls(ballsArray, hitBetweenBalls);
				break;
				
				case gameStates.gameOver:
					drawTable();
					drawPockets();
					ctx.fillStyle = "white";
					if(gameStates.levelsWon.byJavaScript > gameStates.levelsWon.byPlayer){
						ctx.fillText("GAME OVER  : (", 270, 200);
					}else{
						ctx.fillText("You won !!!", 320, 200);
					}
					ctx.fillText("Press SPACE to start again", 170, 300);
					if (inputStates.space) {
						startNewGame();
					}
				break;
			}
			requestAnimationFrame(mainLoop);
		};
		
		function createBalls(numberOfBalls) {
			for(var i=0; i < numberOfBalls; i++) {
				var positionX, positionY; 
				// triangle of balls
				if(i/2 == 0){sign = 1} else {sign = -1};
				if (i==0){
					positionX = 0.6*width+leftSideX;
					positionY = 0.5*height+topSideY;
				}else if (i%2!=0){
					positionX = (0.6*width)*(1-(i/numberOfBalls))+leftSideX;
					positionY = (0.5*height)+0.5*height*(i/numberOfBalls)+topSideY;
				}else{
					positionY = (0.5*height)-0.5*height*((i-1)/numberOfBalls)+topSideY;
				}
				var ball =  new Ball(positionX,
								  positionY,
								  gameLevels[gameStates.currentLevel-1][1],
								  gameLevels[gameStates.currentLevel-1][1],
								  40, ballsColors[i%ballsColors.length]); 
				ball.ID = i;
				ball.draw();
				ballsArray[i] = ball;
			}
			// create player's ball
			ball = new Ball (0.70*width+leftSideX,0.5*height+topSideY,0,0,42,['#E5E5E5','white']);
			ball.ID = numberOfBalls;
			ball.draw();
			ballsArray[numberOfBalls] = ball;
		}               
		
		function Ball(x, y, vx, vy, diameter, color) {
			this.ID;
			this.x = x;
			this.y = y;
			this.vx = vx;
			this.vy = vy;
			this.rayon = diameter/2;
			
			// hit property - to determine whether ball was hit by player
			// balls remain hit up to 3 collisions with other balls
			// or up to 5 collisions with table sides
			// hit property of ball becomes true if it is hit with ball whose hit property is true
			// @array hit[hitOrNot, transmissionToTableSides, transmissionToBalls]
			this.hit = [false, 0, 0];
			var radialGradient;
			
			this.draw = function() {
				ctx.save();
				addShadows();
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.rayon, 0, 2*Math.PI);
				var radialGradient = ctx.createRadialGradient(this.x,this.y,20,this.x-5,this.y-5,4); 
				radialGradient.addColorStop(0, color[0]);
				radialGradient.addColorStop(1, color[1]);
				ctx.fillStyle = radialGradient;
				ctx.fill();
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 0.3;
				ctx.stroke();
				ctx.restore();
			};

			this.move = function() {
				this.x += this.vx;
				this.y += this.vy;
			};
			
			this.remove = function(){
				ballInPocket.play();
				if(this.hit[0] == true){
					gameStates.ballsInPockets.byPlayer+=1;
				}else{
					gameStates.ballsInPockets.byJavaScript+=1;
				}
				updateCurrentBalls();
				ballsArray[this.ID] =  undefined;
				
				// if cue ball in pocket go to next level
				if(this.ID == cueBall.ID){
					gameStates.levelsWon.byJavaScript += 1;
					updateLevelsWon();
					goToNextLevel();
					return;
				}
				
				// if all balls in pockets go to next level
				if ((gameStates.ballsInPockets.byJavaScript + gameStates.ballsInPockets.byPlayer) == 
					gameLevels[gameStates.currentLevel-1][0]){
					if(gameStates.ballsInPockets.byJavaScript > gameStates.ballsInPockets.byPlayer){
						gameStates.levelsWon.byJavaScript += 1;
					}else{
						gameStates.levelsWon.byPlayer+=1;
					}
					updateLevelsWon();
					goToNextLevel();
				}
			}
		}
		
		function updateLevelsWon(){
			levelsWon.innerHTML = gameStates.levelsWon.byJavaScript + " : " + gameStates.levelsWon.byPlayer;
		}
		
		function goToNextLevel() {
			gameStates.ballsInPockets = {byJavaScript: 0, byPlayer: 0};
			ballsArray = [];
			updateCurrentBalls();
			gameStates.currentLevel += 1;
			if (gameStates.currentLevel < 4){
				createBalls(gameLevels[gameStates.currentLevel-1][0]);
			}else{
				currentGameState = gameStates.gameOver;
			}
		}
		
		function updateCurrentBalls(){
			ballsCurrently.innerHTML = gameStates.ballsInPockets.byJavaScript + " : " + gameStates.ballsInPockets.byPlayer;
		}
		
		function startNewGame() {
			gameStates.currentLevel = 1;
			gameStates.levelsWon = {byJavaScript:0, byPlayer:0};
			updateLevelsWon();
			currentGameState = gameStates.gameRunning;
			start();
		}

		function drawTable(){
			ctx.save();
			ctx.strokeStyle = '#BB420F';
			ctx.lineWidth = 15;
			ctx.strokeRect(leftSideX,topSideY,width, height);
			ctx.fillStyle = "rgb(0, 240, 0)";
			ctx.fillRect (leftSideX, topSideY, width, height);
			ctx.restore();
		}
		
		function drawPockets(){
			ctx.save();
			ctx.strokeStyle = '#BB420F';
			ctx.fillStyle='#696969';
			ctx.lineWidth = 7;
			
			// top left corner
			ctx.beginPath();
			ctx.arc(65, 37, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(65, 37, 30, 1.76, 1.94*Math.PI);
			ctx.stroke();
			
			// top center
			ctx.beginPath();
			ctx.arc(425, 37, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(425, 37, 30, 1.06*Math.PI, 1.94*Math.PI);
			ctx.stroke();
			
			// top right corner
			ctx.beginPath();
			ctx.arc(785, 37, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(785, 37, 30, 1.06*Math.PI, 2.45*Math.PI);
			ctx.stroke();
			
			// bottom left corner
			ctx.beginPath();
			ctx.arc(65, 412, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(65, 412, 30, 0.2, 1.43*Math.PI);
			ctx.stroke();
			
			// bottom center corner
			ctx.beginPath();
			ctx.arc(425, 412, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(425, 412, 30, 2.08*Math.PI, 0.93*Math.PI);
			ctx.stroke();
			
			// bottom right corner
			ctx.beginPath();
			ctx.arc(785, 412, 30, 0, 2*Math.PI);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(785, 412, 30, 1.57*Math.PI, 0.93*Math.PI);
			ctx.stroke();
			ctx.restore();
		}
		
		function drawCue(){
			if(startButton.style.display != "none"){return}
			if(cueBall == undefined){return}
			var cueTip = {};
			var cursorCenter = gameStates.cursorCenter={x:inputStates.mousePos.x,y:inputStates.mousePos.y};
			var distanceX = cueBall.x-cursorCenter.x;
			var distanceY = cueBall.y-cursorCenter.y;
			var distanceToBall = Math.sqrt(distanceX*distanceX + distanceY*distanceY);
			var angle = Math.atan2(distanceY,distanceX);
			
			// should be more elegant way to avoid overbalancing
			if(distanceToBall < 75){return;}
			
			ctx.save();
			if(inputStates.mousedown != true){addShadows()}else{addShadows(1,3)}
			ctx.lineWidth = 6;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.strokeStyle = '#FC9A23';
			ctx.moveTo(cursorCenter.x-100*Math.cos(angle),cursorCenter.y-100*Math.sin(angle));
			ctx.lineTo(cursorCenter.x+65*Math.cos(angle),cursorCenter.y+65*Math.sin(angle));
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = '#939393';
			ctx.moveTo(cursorCenter.x+65*Math.cos(angle),cursorCenter.y+65*Math.sin(angle));
			cueTip.x = gameStates.cueTip.x=cursorCenter.x+75*Math.cos(angle);
			cueTip.y = gameStates.cueTip.y=cursorCenter.y+75*Math.sin(angle);
			ctx.lineTo(cueTip.x,cueTip.y);
			ctx.stroke();
			ctx.restore();
		}
		
		function addShadows(shadowOffsetX,shadowOffsetY){
			if(shadowOffsetX == undefined){shadowOffsetX =3;}
			if(shadowOffsetY == undefined){shadowOffsetY =5;}
			ctx.shadowColor = "rgba(0,0,0, 1)";
			ctx.shadowBlur = 10;      
			ctx.shadowOffsetX = shadowOffsetX;
			ctx.shadowOffsetY = shadowOffsetY;
		}
		
		var start = function () {
			canvas = document.querySelector("#myCanvas");
			canvasWidth = canvas.width;
			canvasHeight = canvas.height;
			width = 0.86*canvasWidth;
			height = 0.86*canvasHeight;
			ctx = canvas.getContext('2d');
			// default font
			ctx.font = "40pt Monotype Corsiva";
			
			// table field
			leftSideX = 0.07*canvasWidth;
			rightSideX = leftSideX+width;
			topSideY = 0.07*canvasHeight;
			bottomSideY = topSideY+height;
			
			drawTable();
			drawPockets();
			
			createBalls(gameLevels[0][0]);
			
			// Create different key and mouse listeners
			addListeners(inputStates, canvas, ctx, gameStates);
			
			addListenersForButtons(mainLoop, phoneMusic);
		};

		// public API of GameFramework
		return {
			start: start
		};
	};