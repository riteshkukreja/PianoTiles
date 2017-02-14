var PianoTiles = function(config) {

	// Canvas Element Reference
	var canvas, 
		// Context Object Reference
		context, 
		// Width and height of each tile onthe canvas
		tile_width, 
		tile_height;

	// Number of tiles in each row of the canvas
	// The canvas will be divided into this many pieces horizontally
	var numTilesInRow = 4;

	// Array to store the tiles to drow on the canvas
	var tiles = [];

	// Array of size numTilesInRow denoting whether a row is available for tile insertion or not
	// O stands for empty while 1 stands for full
	var blocks = [];

	// Score of the player
	var score = 0;

	// Speed of the tile 
	// The tile will move vertically upwards with this speed
	var speed = 5;

	// Game Speed Incremenet
	var speedIncrement = 0.005;

	// Number of frames to wait before a tile completely shown to player from the moment it is added
	var framesToWait;

	// Number of frames to wait before adding a new tile
	// Object containing min and max frames for random distribution
	var framesBetweenTiles;

	// Keep track of current frames passed
	var currentFramesPassed = 0;

	// Number of frames to wait before adding a tile
	// Automatically updated after adding each tile to a random number
	var randomFramesBetweenTiles;

	// Flag to denote if the game is over
	var gameOver = false;

	// Flag to allow button click on retry button
	var gameOverButtonClick = false;

	// Background color of the canvas
	var background = "#212121";

	// Colors to be used for tiles
	var colors = [	"#ecf0f1", "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#f39c12", "#e74c3c", "#2980b9", "#8e44ad",
	"#d35400", "#c0392b", "#c0392b", "#2980b9", "#e67e22" ];


	// If configuration object is not provided, then create empty
	config = config || {};

	// If canvas is given, use it
	if(config.canvas) canvas = config.canvas;
	else {
		// if no canvas is given, then create a canvas object and append to body
		canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
	}
		
	// Retrieve canvas 2 context
	context = canvas.getContext("2d");

	// Set the canvas width and height
	canvas.width = config.width || window.innerWidth;
	canvas.height = config.height || window.innerHeight;

	/**
	 *	random Method
	 *	Returns a random integer between min and max
	 *
	 *	@Param: min - The lowest number possible
	 *	@Param: max - The highest number possible
	**/
	var random = function(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	};

	/**
	 *	clear Method
	 *	Utility method to clear the canvas with the specified background
	 *
	 *	@Param: background - The color of the canvas background
	**/
	var clear = function(background) {
		context.fillStyle = background;
		context.fillRect(0, 0, canvas.width, canvas.height);
	};

	/**
	 *	Vector Constructor
	 *	Utility method to store locations as two dimensional vector
	 *
	 *	@Param: x - The x position on the canvas
	 *	@Param: y - The y position on the canvas
	**/
	var Vector = function(x, y) {
		this.x = x;
		this.y = y;

		/**
		 * 	add Method
		 *	Add the values of another vector to the current vector
		 *
		 *	@Param: vec - Vector Object
		**/
		this.add = function(vec) {
			this.x += vec.x;
			this.y += vec.y;
		};

		/**
		 * 	clone Method
		 *	Returns a copy of the current vector object
		**/
		this.clone = function() {
			return new Vector(this.x, this.y);
		}
	};

	/**
	 *	getCanvasMouse Method
	 *	Utility method to modify the mouse positions to fit the canvas
	 *
	 *	@Param: e - Event Object
	**/
	var getCanvasMouse = function(e) {
		var rect = canvas.getBoundingClientRect();
		var x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
		var y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;

		return new Vector(x, y);
	};

	/**
	 *	Tiles Constructor
	 *	Creates a tile and allow location updation and drawing of the tile on the canvas
	 *
	 *	@Param: config - Configuration Object
	**/
	var Tiles = function(config) {

		// If config objet doesn't exists, initialize it with empty object
		config = config || {};

		// Set the position of the tile on the canvas
		this.position = config.position || new Vector(0, 0);

		// Set the dimensions ( Width and Height ) of the tile on the canvas
		this.dimension = config.dimension || new Vector(50, 50);

		// Set the color of the tile
		this.color = config.color || "red";

		/**
		 *	update Method
		 *	Update the position of the tile on the canvas
		 *
		 *	@Param: speed - Vector object defining the speed with which the tile is moving
		**/
		this.update = function(speed) {
			this.position.add(speed);
		};

		/**
		 *	draw Method
		 *	Draw the tile on the canvas
		**/
		this.draw = function() {
			context.fillStyle = this.color;
			context.fillRect(this.position.x, this.position.y, this.dimension.x, this.dimension.y);
		};

		/**
		 *	changeColor Method
		 *	Update the color of the tile
		 *
		 *	@Param: color - String defining the new color
		**/
		this.changeColor = function(color) {
			this.color = color;
		}

		/**
		 *	collision Method
		 *	Returns true if the given vector lies inside the tile
		 *
		 *	@Param: vec - Vector object defining the clicked location
		**/
		this.collision = function(vec) {
			if(vec.x <= this.position.x + this.dimension.x && vec.x >= this.position.x && vec.y <= this.position.y + this.dimension.y && vec.y >= this.position.y)
				return true;
			return false;
		};
	};
	
	/**
	 *	speedHandler Method
	 *	Update the speed of the tiles to increase the speed of the game
	**/
	var speedHandler = function() {
		// Increment speed
		speed += speedIncrement;

		// Update framesBetweenTiles object 
		framesBetweenTiles = { min: tile_height/ speed, max: tile_height*2/ speed };
	};

	/**
	 *	addTiles Method
	 *	Add a tile to the tiles array after randomFramesBetweenTIles
	**/
	var addTiles = function() {
		// Make sure to add delay between tile creation
		if(currentFramesPassed >= randomFramesBetweenTiles) {

			// Find a random block to put the tile in
			var pos = random(0, blocks.length);

			// If block is empty
			if(blocks[pos] == 0) {

				// Add the tile to the block
				tiles.push(new Tiles({
					position: new Vector(pos*tile_width, canvas.height),
					dimension: new Vector(tile_width, tile_height),
					color: colors[random(0, colors.length)]
				}));

				// and set it to occupied
				blocks[pos] = 1;

				// Clear the block after sometime
				setTimeout(function() {
					blocks[pos] = 0;
				}, 1000 / framesToWait + 1000 / randomFramesBetweenTiles);
			}

			// Update speed
			speedHandler();

			// Reset all the delay conditions
			currentFramesPassed = 0;
			randomFramesBetweenTiles = random(framesBetweenTiles.min, framesBetweenTiles.max);
		} else {
			// If yet to wait, the wait we shall
			currentFramesPassed++;
		}
	};

	/**
	 *	update Method
	 *	Update all the tiles positions and Handle addTiles method
	**/
	var update = function() {
		// add more tiles
		addTiles();

		// Update all the tiles
		for(var i = tiles.length-1; i >= 0; i--) {
			// If tile is out of canvas window, then remove it
			if(tiles[i].position.y + tiles[i].dimension.y < 0)
				tiles.splice(i, 1);
			else
				// else move it up
				tiles[i].update(new Vector(0, -speed));
		}
	};

	/**
	 *	scoreDraw Method
	 *	Shows the current score of the player
	**/
	var scoreDraw = function() {
	 	context.fillStyle = "#ffffff";
	 	context.font="50px Georgia";
	 	context.textAlign = "center";
	 	context.textBaseline = "middle";
	 	context.fillText(score, canvas.width/2, 30);
	};

	/**
	 *	drawGameOverWindow Method
	 *	Create a colorful window allowing user to score final result and start a new game
	**/
	var drawGameOverWindow = function() {
	 	var winWidth = canvas.width / 2;
	 	var winHeight = canvas.height / 2;

	 	clear("rgba(0, 0, 0, .5)");

		// draw container
		context.fillStyle = colors[7];
		context.fillRect(canvas.width / 4, canvas.height / 4, winWidth, winHeight);

		// write score if won else write you lose
		context.fillStyle = "#FFF";
		context.textAlign = "center";
		context.font = "100 20px calibri";
		context.fillText("Your Score is", canvas.width / 2, canvas.height / 4 + 40);
		context.font = "100 80px calibri";
		context.fillText(score, canvas.width / 2, canvas.height / 4 + 120);

		// Allow user to click retry button after certain interval
		setTimeout(function() {
			gameOverButtonClick = true;
		}, 500);

		// play again button
		var play_btn = new Button(init, canvas.width / 3, canvas.height / 4 + 200, canvas.width / 3, 60, "Play again?");
	};

	/**
	 *	draw Method
	 *	Draw all the objects to the canvas
	**/
	var draw = function() {
		// if game is not over
		if(!gameOver) {
			requestAnimationFrame(draw);

			// Update everything
			update();

			// Clear the canvas and give it a background
			clear(background);

			// Draw all the tiles
			for(var i = 0; i < tiles.length; i++) {
				tiles[i].draw();
			}

			// Show score
			scoreDraw();

			//setTimeout(draw, 1000/25);
		} else {
			// if game over, then draw game over window
			drawGameOverWindow();
		}
	};

	/**
	 *	Button Method
	 *	Create a colorful rounded button and allow executing a method on click event.
	 *
	 * 	@Param callback - Method to execute on button click
	 * 	@Param x - position from left of the canvas
	 * 	@Param y - position from top of the canvas
	 * 	@Param width - width of the button
	 * 	@Param height - height of the button
	 * 	@Param text - integer defining the text in the button
	**/
	var Button = function(callback, x, y, width, height, text) {

		// Method to draw the button
		var draw = function() {
			context.fillStyle = colors[3];

			// left circle
			context.arc(x + height/2, y + height/2, height/2, 0, 2*Math.PI);
			context.fill();

			// right circle
			context.arc(x + width - height/2, y + height/2, height/2, 0, 2*Math.PI);
			context.fill();

			// middle box
			context.fillRect(x + height/2, y, width - height, height);

			// text drawing
			context.fillStyle = "#FFF";
			context.textAlign = "center";
			context.textBaseline = "middle"; 
			context.font = "20px calibri";
			context.fillText(text, x + width / 2, y + height / 2);
		};

		// Draw the button
		draw();

		// Listen for the click event
		window.addEventListener("click", function(e) {
			if(!gameOverButtonClick) return;

			var pos = getCanvasMouse(e);

			// Test if the mouse click happened inside the button, call callback method if it did.
			if(pos.x <= x + width && pos.x >= x && pos.y >= y && pos.y <= y + height) {
				callback();
				gameOverButtonClick = false;
			}
		});
	};

	// Handle mouse click by user
	canvas.addEventListener("mousedown", function(e) {
		// Convert mouse position to canvas coordinates
		var pos = getCanvasMouse(e);

		// Keep track of successful hit
		var hit = false;

		// Loop through all the tiles and check if any one contains the given mouse coordinates inside them
		for(var i in tiles) {
			if(tiles[i].collision(pos)) {
				// Remove the tile
				tiles.splice(i, 1);

				// Update score
				score++;

				// Set hit to true
				hit = true;
				break;
			}
		}

		// Clicked outside all the tiles
		if(!hit) {
			// clicked outside game over
			gameOver = true;
		}
	});

	/**
	 *	init Method
	 *	Initialize all the constants based on user configurations object
	**/
	var init = function() {
		// Retrive number of tiles blocks to add in the game
		numTilesInRow = config.numTilesInRow || numTilesInRow;

		// Calculate tile width and height
		tile_width = canvas.width / numTilesInRow;
		tile_height = tile_width;

		// Handle speed configuration
		speed = config.speed || 5;

		// Get Background color of the canvas
		background = config.background || background;

		// Get colors array to store all the colors to use for tile creation
		colors = config.colors || colors;

		// Reset score
		score = 0;

		// Reset gameOver flag
		gameOver = false;

		// Reset framesBetweenTiles flag
		framesBetweenTiles = { min: tile_height/ speed, max: tile_height*2/ speed };
		currentFramesPassed = 0;
		randomFramesBetweenTiles = random(framesBetweenTiles.min, framesBetweenTiles.max);
		framesToWait = tile_height / speed;

		// Clear tiles and blocks array
		tiles = [];
		blocks = [];

		// Initialize blocks array to store numTilesInRow columns
		for(var i = 0; i < numTilesInRow; i++) {
			blocks.push(0);
		}

		// Start drawing
		draw();
	};

	// Start the application
	init();
};