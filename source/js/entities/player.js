var inherits = require( 'inherits' );
var Events = require( 'common/events' );


/**
 * The base player class.
 * @constructor
 */
var Player = function( config, game, gameElements ) {

	Phaser.Sprite.call( this, game );

	game.physics.enable( this, Phaser.Physics.ARCADE );

	this.anchor.setTo( .5, 1 );
	this.height = game.physics.p2.mpx( config.height );

	this.config = config;
	this.id = config.id;

	this.body.mass = 1;
	this.body.allowRotation = false;
	this.body.collideWorldBounds = true;
	this.body.maxVelocity.x = this.calculateMaxSpeed( config.sprint );
	this.body.drag.x = this.game.physics.p2.mpx( 8 );

	//
	this.hasBall = false;
	this.facing = null;

	this._gameElements = _.extendOwn( {
		ball: null,
		ownBasket: null,
		opponentBasket: null,
		teammate: null,
		opponents: null
	}, gameElements );

	this._state = null;

	//
	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
};
inherits( Player, Phaser.Sprite );


Player.prototype.setPosition = function( x, y ) {

	this.x = x;
	this.y = y;
	this.body.x = x;
	this.body.y = y;
};


Player.prototype.isInTheAir = function() {

	return Math.round( this.body.velocity.y ) !== 0;
};


Player.prototype.calculateJumpVelocity = function( jump ) {

	var minJump = this.game.physics.p2.mpx( -1.5 );
	var maxJump = this.game.physics.p2.mpx( -4.5 );
	return Phaser.Math.linearInterpolation( [ minJump, maxJump ], jump );
};


Player.prototype.calculateMaxSpeed = function( sprint ) {

	var minSpeed = this.game.physics.p2.mpx( 2.5 );
	var maxSpeed = this.game.physics.p2.mpx( 5.5 );
	return Phaser.Math.linearInterpolation( [ minSpeed, maxSpeed ], sprint );
};


Player.prototype.calculateDampingByWeight = function( weight ) {

	var minWeight = 60;
	var maxWeight = 100;
	return Phaser.Math.linearInterpolation( [ 0, .8 ], ( weight - minWeight ) / ( maxWeight - minWeight ) );
};


Player.prototype.setState = function( state ) {

	this._state = state;
};


Player.prototype.getState = function() {

	return this._state;
};


Player.prototype.isState = function( state ) {

	return this._state === state;
};


Player.prototype.face = function( facing ) {

	if ( this.facing === facing ) {
		return;
	}

	this.facing = facing;

	this.scale.x = ( facing === Phaser.LEFT ) ? 1 : -1;

	this.body.velocity.x = 0;
};


Player.prototype.stance = function() {

	this.body.acceleration.x = 0;
	this.body.acceleration.y = 0;
};


Player.prototype.walk = function() {

	//http://hypertextbook.com/facts/2007/charlesbarkley.shtml
	var acceleration = this.game.physics.p2.mpx( 2 );

	if ( this.facing === Phaser.LEFT ) {

		this.body.acceleration.x = -acceleration;

	} else {

		this.body.acceleration.x = acceleration;
	}
};


Player.prototype.jump = function() {

	if ( this.isState( Player.State.JUMPING ) ) {
		if ( this.isInTheAir() ) {
			return;
		} else {
			this.setState( Player.State.STANCE );
		}
	}

	var jumpVelocity = this.calculateJumpVelocity( this.config.jump );
	this.body.velocity.y = jumpVelocity;
};


Player.prototype.shoot = function() {

	if ( !this.hasBall ) {
		return;
	}

	var basket = this._gameElements.opponentBasket;
	var ball = this._gameElements.ball;
	var ballRadius = ball.width / 2;

	// adjust facing towards basket before shooting
	var facing = ( this.x > basket.x ) ? Phaser.LEFT : Phaser.RIGHT;
	this.face( facing );

	var startX = ( facing === Phaser.LEFT ) ? this.x - this.width / 2 - ballRadius : this.x + this.width / 2 + ballRadius;
	var startY = this.y - this.height - ballRadius;
	var targetX = basket.x;
	var targetY = basket.y - basket.height / 2;

	Events.ballShot.dispatch( ball, startX, startY, targetX, targetY );

	this.setState( Player.State.STANCE );
};


Player.prototype.update = function() {

	switch ( this._state ) {
		case Player.State.STANCE:
			this.stance();
			break;

		case Player.State.JUMPING:
			this.jump();
			break;

		case Player.State.WALKING:
			this.walk();
			break;

		case Player.State.SHOOTING:
			this.shoot();
			break;

		default:
			break;
	}

	this.game.debug.body( this );
};


Player.prototype.onCaught = function( player ) {

	this.hasBall = ( this === player );
}


Player.prototype.onShot = function( player, x, y ) {

	this.hasBall = false;
}


Player.State = {
	STANCE: 'stance',
	WALKING: 'walking',
	RUNNING: 'running',
	SHOOTING: 'shooting',
	PASSING: 'passing',
	JUMPING: 'jumping'
};


module.exports = Player;