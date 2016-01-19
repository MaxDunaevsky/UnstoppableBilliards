function collisionTestWithWalls(ball, leftSideX, topSideY, rightSideX, bottomSideY, hitTableSide) {
	
	// top left pocket
	if((ball.x < 95) && (ball.y < 67)){
		collisionTestWithPockets(ball, 1);
	}
	// top center pocket
	else if((ball.y < 67) && ((ball.x < 455) && (ball.x > 395))){
		collisionTestWithPockets(ball, 2);
	}
	// top right pocket
	else if((ball.x > 755) && (ball.y < 67)){
		collisionTestWithPockets(ball, 3);
	}
	// bottom right pocket
	else if((ball.x > 755) && (ball.y > 382)){
		collisionTestWithPockets(ball, 4);
	}
	// bottom center pocket
	else if((ball.y > 382) && ((ball.x < 455) && (ball.x > 395))){
		collisionTestWithPockets(ball, 5);
	}
	// bottom left pocket
	else if((ball.x < 95) && (ball.y > 382)){
		collisionTestWithPockets(ball, 6);
	}
	
	// left side
	if (ball.x < (ball.rayon + leftSideX)) {
		hitTableSide.play();
		ball.x = ball.rayon + leftSideX;
		ball.vx *= -1;
		adjustHitProperty(ball)
	}
	// right side
	if (ball.x > rightSideX - (ball.rayon)) {
		hitTableSide.play();
		ball.x = rightSideX - (ball.rayon);
		ball.vx *= -1;
		adjustHitProperty(ball)
	}
	// top side
	if (ball.y < (ball.rayon+topSideY)) {
		hitTableSide.play();
		ball.y = ball.rayon+topSideY;
		ball.vy *= -1;
		adjustHitProperty(ball)
	}
	// bottom side
	if (ball.y > bottomSideY - (ball.rayon)) {
		hitTableSide.play();
		ball.y = bottomSideY - (ball.rayon);
		ball.vy *= -1;
		adjustHitProperty(ball)
	}
	
}

function adjustHitProperty(ball){
	ball.hit[1] = ball.hit[1]-1;
	if(ball.hit[1] < 1){ball.hit = [false, 0, 0]}
}

function collisionTestBetweenBalls(ballsArray, hitBetweenBalls) {
	var balls = ballsArray;
	for (var i = 0; i < ballsArray.length; i++) {
		if(ballsArray[i] == undefined){continue};
		for (var j = i + 1; j < ballsArray.length; j++) {
			if(ballsArray[j] == undefined){continue};
			var dx = balls[j].x - balls[i].x;
			var dy = balls[j].y - balls[i].y;
			var dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < (balls[j].rayon + balls[i].rayon)) {
				hitBetweenBalls.play();
				// is ball hit by player - trasmitting hit property from cueBall and an one ball further
				if(balls[j].hit[0] == true){
					balls[i].hit = [true, balls[j].hit[1]-1, balls[j].hit[2]-1];
					balls[j].hit[2]-=1;
					if(balls[j].hit[2] < 1){balls[j].hit = [false, 0, 0]}
				}
				
				// balls have contact so push back...
				var normalX = dx / dist; //cos
				var normalY = dy / dist; // sin
				var middleX = (balls[i].x + balls[j].x) / 2; // center between two balls x coordinate
				var middleY = (balls[i].y + balls[j].y) / 2; // center between two balls y coordinate
				
				// returns balls' radii to position just before touch
				balls[i].x = middleX - normalX * balls[i].rayon;
				balls[i].y = middleY - normalY * balls[i].rayon;
				balls[j].x = middleX + normalX * balls[j].rayon;
				balls[j].y = middleY + normalY * balls[j].rayon;
			  
				var dVector = (balls[i].vx - balls[j].vx) * normalX;
				dVector += (balls[i].vy - balls[j].vy) * normalY;
				var dvx = dVector * normalX;
				var dvy = dVector * normalY;
				
				balls[i].vx -= dvx;
				balls[i].vy -= dvy;
				balls[j].vx += dvx;
				balls[j].vy += dvy;
			}
		}
	}
}

function collisionTestBetweenCueBallAndCue(cueBall, cueTip, mousedown, cueHit){
	if(mousedown != true){return};
	if(cueBall == undefined){return}
	var distX = cueBall.x - cueTip.x;
	var distY = cueBall.y - cueTip.y;
	var signX, signY;
	if(distX > 0){signX = 1}else{signX = -1};
	if(distY > 0){signY = 1}else{signY = -1};
	var distance = Math.sqrt(distX * distX + distY * distY);
	if (distance < cueBall.rayon){
		if(cueHit.paused){cueHit.play()}
		var normalX = distX / distance; //cos
		var normalY = distY / distance; // sin
		var middleX = cueTip.x;
		var middleY = cueTip.y;
		cueBall.x = middleX + normalX * cueBall.rayon;
		cueBall.y = middleY + normalY * cueBall.rayon;
		
		// initial velocity of a cue currently defaulted to 3
		var dVector = (3-cueBall.vx)*signX*normalX;
		dVector += (3-cueBall.vy)*signY*normalY;
		var dvx = dVector * normalX;
		var dvy = dVector * normalY;
		cueBall.vx += dvx;
		cueBall.vy += dvy;
		cueBall.hit=[true, 5, 3];
	}
}

function collisionTestWithPockets(ball, pocket){
	var pocketsCenters =[[65,37],[425,37],[785,37],[785,412],[425,412],[65,412]];
	var matchingPercent;
	var distX = ball.x-pocketsCenters[pocket-1][0];
	var distY = ball.y-pocketsCenters[pocket-1][1];
	var distanceToPocket = Math.sqrt(distX*distX+distY*distY);
	
	if(distanceToPocket > 50){
		matchingPercent = 0;
	}else if((distanceToPocket > 10) && (distanceToPocket<50)){
		matchingPercent = (1-(distanceToPocket-10)/40)*100;
	}else{
		matchingPercent = 100;
	}
	// more rigorous rules for central pockets
	if((matchingPercent > 80 && ((pocket == 2) || (pocket == 5))) ||
		(matchingPercent > 50 && (pocket != 2 && pocket !=5))
		){
		ball.remove();
	}
}