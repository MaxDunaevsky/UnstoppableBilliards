function addListeners(inputStates, canvas, ctx, gameStates) {
		//add the listener to the main, window object, and update the states
        window.addEventListener('keydown', function (event) {
            if (event.keyCode === 32) {
                inputStates.space = true;
            }
        }, false);

        //if the key will be released, change the states object 
        window.addEventListener('keyup', function (event) {
            if (event.keyCode === 32) {
                inputStates.space = false;
            }
        }, false);

        // Mouse event listeners
		// to determine coordinates to draw a cue
        canvas.addEventListener('mousemove', function (evt) {
			inputStates.mousePos = getMousePos(evt, canvas);
        }, false);

        canvas.addEventListener('mousedown', function (evt) {
            inputStates.mousedown = true;
            inputStates.mouseButton = evt.button;
			if(gameStates.cueBall != undefined){
				gameStates.cueBall.vx = 0;
				gameStates.cueBall.vy = 0;
			}
        }, false);

        canvas.addEventListener('mouseup', function (evt) {
            inputStates.mousedown = false;
        }, false);
}

function addListenersForButtons(mainLoop, phoneMusic){
	document.getElementById('startButton').addEventListener('click', function(evt) {
				evt.target.style.display="none";
				document.getElementById('instruction').style.display = "none";
				requestAnimationFrame(mainLoop);
			}, false);
	document.getElementById('note').addEventListener('click', function(evt) {
			if(!phoneMusic.paused){
				phoneMusic.pause();
				evt.target.style.backgroundPosition="-30px 0px";
			}else{
				phoneMusic.play();
				evt.target.style.backgroundPosition="0px 0px";
			}
		}, false);
}

function getMousePos(evt, canvas) {
    // necessary to take into account CSS boudaries
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}