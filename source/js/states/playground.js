var inherits = require( 'inherits' );
var Events = require( 'common/events' );
var Ball = require( 'entities/ball' );
var CameraTracker = require( 'entities/cameratracker' );
var Player = require( 'entities/player' );
var PlayerController = require( 'controllers/playercontroller' );
var PlayerConfig = require( 'common/players' );
var CourtConfig = require( 'common/court' );
var Regulation = require( 'controllers/regulation' );
var Statistics = require( 'controllers/statistics' );


// Glossary: https://en.wikipedia.org/wiki/Glossary_of_basketball_terms
var Playground = function() {

};
inherits( Playground, Phaser.State );


Playground.prototype.init = function() {

	console.log( "playground init!" );
};


Playground.prototype.preload = function() {

	this.load.image( 'sky', 'images/sky2.png' );
	this.load.image( 'ball', 'images/ball.png' );
	this.load.image( 'backboard', 'images/backboard.png' );
	this.load.image( 'net', 'images/basketball-net-small.png' );
	this.load.physics( 'net', 'json/basketball-net.json' );
	this.load.spritesheet( 'walk', 'images/walk.png', 104, 150, 14 );
};


Playground.prototype.create = function() {

	//http://www.html5gamedevs.com/topic/4346-how-can-i-calculate-falling-time-when-effected-by-gravity/?hl=%2Bgravity+%2Bmeter#entry27001
	var gravity = this.physics.p2.mpx( 9.81 );
	this.physics.p2.gravity.y = gravity;
	this.physics.arcade.gravity.y = gravity;

	var courtWidth = CourtConfig.COURT_LENGTH;
	var extensionWidth = CourtConfig.EXTENSION_LENGTH;

	this.worldW = this.physics.p2.mpx( courtWidth + extensionWidth * 2 );
	this.worldH = this.physics.p2.mpx( 10 );

	this.floorH = this.physics.p2.mpx( CourtConfig.FLOOR_HEIGHT );
	this.floorY = this.worldH - this.floorH;

	this.game.world.setBounds( 0, 0, this.worldW, this.worldH );

	this.floor = this.add.sprite( 0, this.floorY );
	this.physics.enable( this.floor, Phaser.Physics.ARCADE );
	this.floor.body.allowGravity = false;
	this.floor.body.allowRotation = false;
	this.floor.body.immovable = true;
	this.floor.body.setSize( this.worldW, this.floorH );

	// create tiling sky
	var skyHeight = this.floorY - 30;
	this.sky = this.add.tileSprite( 0, 0, this.worldW, skyHeight, 'sky' );
	this.sky.tileScale.x = this.sky.tileScale.y = ( skyHeight / 1024 );

	// create floor
	this.floorP2Body = this.physics.p2.createBody( 0, this.floorY, 0, true, {}, [
		[ 0, 0 ],
		[ this.worldW, 0 ],
		[ this.worldW, this.floorH ],
		[ 0, this.floorH ]
	] );
	//this.floorP2Body.debug = true;

	// create backboard & basket
	this.backboard = this.add.sprite( 0, 0, 'backboard' );
	this.physics.p2.enable( this.backboard );

	var backboardX = extensionWidth + this.physics.p2.mpx( CourtConfig.BACKBOARD_X );
	var backboardY = this.floorY - this.physics.p2.mpx( CourtConfig.BACKBOARD_Y ) - this.backboard.height / 2;
	this.backboard.body.reset( backboardX, backboardY );
	this.backboard.body.static = true;

	this.basket = this.add.sprite( 0, 0, 'net' );
	this.physics.p2.enable( this.basket, !true );

	var basketX = backboardX + 70;
	var basketY = this.floorY - this.physics.p2.mpx( CourtConfig.RIM_Y ) + this.basket.height / 2;
	this.basket.body.reset( basketX, basketY );
	this.basket.body.static = true;
	this.basket.body.clearShapes();
	this.basket.body.loadPolygon( 'net', 'basketball-net-small' );

	var circleRadius = this.physics.p2.mpx( CourtConfig.RIM_DIAMETER / 4 );
	var circleOffsetY = circleRadius;
	var circle = this.basket.body.addCircle( circleRadius, 0, circleOffsetY );
	circle.sensor = true;

	this.basket.inputEnabled = true;
	this.basket.input.enableDrag();
	this.basket.events.onDragStart.add( this.onBasketDragStart, this );

	// create ball
	this.ball = new Ball( this.game );
	this.ball.init( this.worldW / 10, this.floorY - this.physics.p2.mpx( 1 ) );
	this.world.add( this.ball );

	// create players
	// player 1
	var playerConfig = PlayerConfig[ 'ls' ];
	var playerX = this.game.width - 200;
	var playerY = this.floorY;

	this.player1 = new Player( this.game, playerConfig );
	this.player1.init( playerX, playerY );
	this.world.add( this.player1 );

	// player 2
	var playerConfig = PlayerConfig[ 'zyw' ];
	var playerX = this.game.width + 400;
	var playerY = this.floorY;

	this.player2 = new Player( this.game, playerConfig );
	this.player2.init( playerX, playerY );
	this.world.add( this.player2 );

	// player 3
	var playerConfig = PlayerConfig[ 'yxz' ];
	var playerX = this.game.width + 100;
	var playerY = this.floorY;

	this.player3 = new Player( this.game, playerConfig );
	this.player3.init( playerX, playerY );
	this.world.add( this.player3 );

	// set game elements to entities
	this.ball.setGameElements( {
		floorBody: this.floorP2Body,
		baskets: [ this.basket ]
	} );

	this.player1.setGameElements( {
		floor: this.floor,
		ball: this.ball,
		teammate: this.player2,
		opponents: [ this.player3 ],
		opponentBasket: this.basket
	} );

	this.player2.setGameElements( {
		floor: this.floor,
		ball: this.ball,
		teammate: this.player1,
		opponents: [ this.player3 ],
		opponentBasket: this.basket
	} );

	this.player3.setGameElements( {
		floor: this.floor,
		ball: this.ball,
		teammate: null,
		opponents: [ this.player1, this.player2 ],
		opponentBasket: this.basket
	} );

	// create the player controller
	this.playerController = new PlayerController( this.input );
	this.playerController.assignPlayers( this.player1, this.player2 );

	// create materials
	this.ballMaterial = this.physics.p2.createMaterial( 'ball', this.ball.body );
	this.floorMaterial = this.physics.p2.createMaterial( 'floor', this.floorP2Body );
	this.backboardMaterial = this.physics.p2.createMaterial( 'backboard', this.backboard.body );
	this.rimMaterial = this.physics.p2.createMaterial( 'rim', this.basket.body );

	this.ballVsFloorMaterial = this.physics.p2.createContactMaterial( this.ballMaterial, this.floorMaterial );
	this.ballVsFloorMaterial.restitution = 0.85;

	this.ballVsRimMaterial = this.physics.p2.createContactMaterial( this.ballMaterial, this.rimMaterial );
	this.ballVsRimMaterial.restitution = 0.6;

	this.ballVsBackboardMaterial = this.physics.p2.createContactMaterial( this.ballMaterial, this.backboardMaterial );
	this.ballVsBackboardMaterial.restitution = 0.5;

	// camera
	this.cameraTracker = new CameraTracker( this.game, this.ball.x, this.ball.y );
	this.world.add( this.cameraTracker );

	this.cameraTracker.follow( this.ball );

	// statistics
	this.statistics = new Statistics();
	this.statistics.recordStart( this.player1, this.player2 );

	// regulation
	this.regulation = new Regulation();
	this.regulation.enable( Regulation.Rules.SCORING );

	//
	this.backboardDragOffset = null;
	this.basketDragOffset = null;

	// debug
	this.circle = null;
	this.predictX = 0;
	this.predictY = 0;

	//
	Events.ballShot.add( this.onBallShot, this );
};


Playground.prototype.update = function() {

	if ( this.basket.input.isDragged ) {

		var worldX = this.input.activePointer.worldX;
		var worldY = this.input.activePointer.worldY;

		this.backboard.body.x = worldX + this.backboardDragOffset.x;
		this.backboard.body.y = worldY + this.backboardDragOffset.y;

		this.basket.body.x = worldX + this.basketDragOffset.x;
		this.basket.body.y = worldY + this.basketDragOffset.y;
	}

	if ( this.circle ) {
		this.game.debug.geom( this.circle, 'rgba(255, 255, 0, .5)' );
	}
};


Playground.prototype.render = function() {

	this.game.debug.start( 20, 20 );
	this.game.debug.line( 'Player 1 stat: ' + this.player1.getStat() );
	this.game.debug.line( 'Player 2 stat: ' + this.player2.getStat() );
	this.game.debug.line( 'Player 3 stat: ' + this.player3.getStat() );
	this.game.debug.line( 'Ball stat: ' + this.ball.getStat() );
	//this.game.debug.body( this.player1 );
	//this.game.debug.body( this.floor );
	this.game.debug.stop();
};


Playground.prototype.onBasketDragStart = function( sprite, pointer, x, y ) {

	this.backboardDragOffset = new Phaser.Point( this.backboard.x - pointer.worldX, this.backboard.y - pointer.worldY );
	this.basketDragOffset = new Phaser.Point( this.basket.x - pointer.worldX, this.basket.y - pointer.worldY );
};


Playground.prototype.onBallShot = function() {

	// test projectile prediction...
	this.predictX = this.player1.x;
	this.predictY = this.ball.getPredictedY( this.predictX );

	if ( _.isNumber( this.predictY ) ) {

		//console.log( 'predicted y of x: ' + this.predictX + ', ' + this.predictY );
		this.circle = new Phaser.Circle( this.predictX, this.predictY, 20 );

	} else {

		this.circle = null;
	}
};


module.exports = Playground;