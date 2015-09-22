var inherits = require( 'inherits' );

/**
 * The base player class.
 * @constructor
 */
var Player = function( config, game, x, y, key, frame ) {

	Phaser.Sprite.call( this, game, x, y, key, frame );

	game.physics.enable( this, Phaser.Physics.P2JS, true );

	this.height = game.physics.p2.mpx( config.height );

	this.body.setRectangle( game.physics.p2.mpx( .5 ), this.height );
	this.body.fixedRotation = true;
	this.body.mass = 1;
	this.body.angularDamping = 1;
	this.body.damping = this.calculateDampingByWeight( config.weight );

	this.config = config;
	this.id = config.id;

	//
	this.hasBall = false;
	this.facing = null;

	this._state = null;
};
inherits( Player, Phaser.Sprite );


Player.prototype.isInTheAir = function() {

	return Math.round( this.body.velocity.y ) !== 0;
};


Player.prototype.calculateJumpVelocity = function( jump ) {

	return Phaser.Math.linearInterpolation( [ 1.5, 4.5 ], jump );
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

	this.scale.x = ( facing === Player.Facing.LEFT ) ? 1 : -1;
};


Player.prototype.walk = function() {

	var speed = this.game.physics.p2.mpx( 1.3 );

	if ( this.facing === Player.Facing.LEFT ) {

		this.body.moveLeft( speed );

	} else {

		this.body.moveRight( speed );
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
	var impulse = [ 0, jumpVelocity ];

	this.body.applyImpulse( impulse, this.x, this.y );
};


Player.prototype.update = function() {

	switch ( this._state ) {
		case Player.State.JUMPING:
			this.jump();
			break;

		case Player.State.WALKING:
			this.walk();
			break;

		default:
			break;
	}
};


Player.State = {
	STANCE: 'stance',
	WALKING: 'walking',
	RUNNING: 'running',
	SHOOTING: 'shooting',
	PASSING: 'passing',
	JUMPING: 'jumping'
};


Player.Facing = {
	LEFT: 'left',
	RIGHT: 'right'
};


module.exports = Player;