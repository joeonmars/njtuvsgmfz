var inherits = require( 'inherits' );
var Ball = require( 'entities/ball' );
var Player = require( 'entities/player' );
var CameraTracker = require( 'entities/cameratracker' );
var PlayerController = require( 'controllers/playercontroller' );
var PlayerConfig = require( 'common/players' );
var Events = require( 'common/events' );

// Glossary: https://en.wikipedia.org/wiki/Glossary_of_basketball_terms
var Playground = function() {

	this.net = null;
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
};


Playground.prototype.create = function() {

	//http://www.html5gamedevs.com/topic/4346-how-can-i-calculate-falling-time-when-effected-by-gravity/?hl=%2Bgravity+%2Bmeter#entry27001
	var gravity = this.physics.p2.mpx( 9.81 );
	this.physics.p2.gravity.y = gravity;
	this.physics.arcade.gravity.y = gravity;

	this.worldW = this.physics.p2.mpx( 26 );
	this.worldH = this.physics.p2.mpx( 10 );

	this.floorH = this.physics.p2.mpx( .55 );
	this.floorY = this.worldH - this.floorH;

	this.game.world.setBounds( 0, 0, this.worldW, this.worldH );
	this.physics.arcade.bounds.height = this.floorY;

	// create tiling sky
	this.sky = this.add.tileSprite( 0, 0, this.worldW, this.floorY, 'sky' );
	this.sky.tileScale.x = this.sky.tileScale.y = ( this.floorY / 1024 );

	// create floor
	this.floorBody = this.physics.p2.createBody( 0, this.floorY, 0, true, {}, [
		[ 0, 0 ],
		[ this.worldW, 0 ],
		[ this.worldW, this.floorH ],
		[ 0, this.floorH ]
	] );
	this.floorBody.debug = true;

	// create net & backboard
	this.net = this.add.sprite( 0, 0, 'net' );
	this.physics.p2.enable( this.net, true );

	this.netY = this.floorY - this.physics.p2.mpx( 3.048 ) + this.net.height / 2;
	this.net.body.reset( 70, this.netY );
	this.net.body.static = true;
	this.net.body.clearShapes();
	this.net.body.loadPolygon( 'net', 'basketball-net-small' );

	this.net.inputEnabled = true;
	this.net.input.enableDrag();
	this.net.events.onDragStart.add( this.onBasketDragStart, this );

	this.backboard = this.add.sprite( 0, this.netY - this.physics.p2.mpx( .5 ), 'backboard' );
	this.physics.p2.enable( this.backboard, true );
	this.backboard.body.static = true;

	this.basketGroup = this.game.add.group();
	this.basketGroup.addChild( this.net );
	this.basketGroup.addChild( this.backboard );

	// create ball
	this.ball = new Ball( this.game, 0, 0, 'ball' );
	this.ball.setPosition( this.worldW / 10, this.floorY - this.physics.p2.mpx( 1 ) );
	this.world.add( this.ball );

	// create player
	var playerConfig = PlayerConfig[ 'zcw' ];
	var playerX = 600;
	var playerY = this.floorY;

	this.player = new Player( playerConfig, this.game, {
		ball: this.ball,
		opponentBasket: this.net
	} );

	this.player.setPosition( playerX, playerY );
	this.world.add( this.player );

	this.playerController = new PlayerController( this.input );
	this.playerController.setPlayer( this.player );

	// create materials
	this.ballMaterial = this.physics.p2.createMaterial( 'ball', this.ball.body );
	this.floorMaterial = this.physics.p2.createMaterial( 'floor', this.floorBody );
	this.backboardMaterial = this.physics.p2.createMaterial( 'backboard', this.backboard.body );
	this.rimMaterial = this.physics.p2.createMaterial( 'rim', this.net.body );

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

	//
	this.backboardDragOffset = null;
	this.netDragOffset = null;

	this.spacebarKey = this.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
	this.spacebarKey.onDown.add( this.shoot, this );

	// debug
	this.circle = null;
	this.predictX = 0;
	this.predictY = 0;

	//
	Events.ballShot.add( this.onBallShot, this );
};


Playground.prototype.shoot = function() {

	var target = this.net.position.clone();
	target.y -= this.net.height / 2;

	if ( !this.player.hasBall ) {
		Events.ballShot.dispatch( this.ball, this.ball.x, this.ball.y, target.x, target.y );
	}
};


Playground.prototype.update = function() {

	if ( this.net.input.isDragged ) {

		var worldX = this.input.activePointer.worldX;
		var worldY = this.input.activePointer.worldY;

		this.backboard.body.x = worldX + this.backboardDragOffset.x;
		this.backboard.body.y = worldY + this.backboardDragOffset.y;

		this.net.body.x = worldX + this.netDragOffset.x;
		this.net.body.y = worldY + this.netDragOffset.y;
	}

	if ( this.ball.overlap( this.player ) ) {
		Events.ballCaught.dispatch( this.player );
	}
};


Playground.prototype.render = function() {

	if ( this.circle ) {
		this.game.debug.geom( this.circle, 'rgba(255, 255, 0, .5)' );
	}
};


Playground.prototype.onBasketDragStart = function( sprite, pointer, x, y ) {

	this.backboardDragOffset = new Phaser.Point( this.backboard.x - pointer.worldX, this.backboard.y - pointer.worldY );
	this.netDragOffset = new Phaser.Point( this.net.x - pointer.worldX, this.net.y - pointer.worldY );
};


Playground.prototype.onBallShot = function() {

	// test projectile prediction...
	this.predictX = this.player.x;
	this.predictY = this.ball.getPredictedY( this.predictX );

	if ( _.isNumber( this.predictY ) ) {

		console.log( 'predicted y of x: ' + this.predictX + ', ' + this.predictY );
		this.circle = new Phaser.Circle( this.predictX, this.predictY, 20 );

	} else {

		this.circle = null;
	}
};


module.exports = Playground;