var inherits = require( 'inherits' );
var Ball = require( 'entities/ball' );
var Player = require( 'entities/player' );
var PlayersConfig = require( 'configs/players' );


var Playground = function() {

	this.net = null;
};
inherits( Playground, Phaser.State );


Playground.prototype.init = function() {

	console.log( "playground init!" );
};


Playground.prototype.preload = function() {

	this.load.image( 'ball', 'images/ball.png' );
	this.load.image( 'backboard', 'images/backboard.png' );
	this.load.image( 'net', 'images/basketball-net-small.png' );
	this.load.physics( 'net', 'json/basketball-net.json' );
};


Playground.prototype.create = function() {

	//http://www.html5gamedevs.com/topic/4346-how-can-i-calculate-falling-time-when-effected-by-gravity/?hl=%2Bgravity+%2Bmeter#entry27001
	this.physics.p2.gravity.y = this.physics.p2.mpx( 9.81 );

	this.ball = new Ball( this.game, 600, 300, 'ball' );
	this.world.add( this.ball );

	var playerConfig = PlayersConfig[ 'ssz' ];
	var playerX = 500;
	var playerY = 700 - this.physics.p2.mpx( playerConfig.height / 2 );
	this.player = new Player( playerConfig, this.game, playerX, playerY );
	this.world.add( this.player );

	this.net = this.add.sprite( 70, 120, 'net' );
	this.physics.p2.enable( this.net, true );
	this.net.body.static = true;
	this.net.body.clearShapes();
	this.net.body.loadPolygon( 'net', 'basketball-net-small' );

	this.backboard = this.add.sprite( 0, 0, 'backboard' );
	this.physics.p2.enable( this.backboard, true );
	this.backboard.body.static = true;

	this.basketGroup = this.game.add.group();
	this.basketGroup.addChild( this.net );
	this.basketGroup.addChild( this.backboard );

	this.floorBody = this.physics.p2.createBody( 0, 700, 0, true, {}, [
		[ 0, 0 ],
		[ 1024, 0 ],
		[ 1024, 100 ],
		[ 0, 100 ]
	] );
	this.floorBody.debug = true;

	// materials
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

	//
	this.cursors = this.input.keyboard.createCursorKeys();
	this.spacebarKey = this.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
	this.spacebarKey.onDown.add( this.shoot, this );
};


Playground.prototype.shoot = function() {

	var targetPosition = this.net.position.clone();
	targetPosition.y -= this.net.height / 2;

	this.ball.shoot( targetPosition );
}


Playground.prototype.moveBasketGroup = function( dx, dy ) {

	_.each( this.basketGroup.children, function( sprite ) {
		sprite.body.setZeroVelocity();
		sprite.body.moveLeft( dx );
		sprite.body.moveUp( dy );
	} );
}


Playground.prototype.update = function() {

	var dx = 0,
		dy = 0;

	var velocity = this.physics.p2.mpx( 2 );

	if ( this.cursors.left.isDown ) {

		dx = velocity;

	} else if ( this.cursors.right.isDown ) {

		dx = -velocity;
	}

	if ( this.cursors.up.isDown ) {

		dy = velocity;

	} else if ( this.cursors.down.isDown ) {

		dy = -velocity;
	}

	this.moveBasketGroup( dx, dy );
};


module.exports = Playground;