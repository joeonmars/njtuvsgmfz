var inherits = require( 'inherits' );

/**
 * The base player class.
 * @constructor
 */
var Player = function( config, game, x, y, key, frame ) {

	Phaser.Sprite.call( this, game, x, y, key, frame );

	game.physics.enable( this, Phaser.Physics.P2JS, true );

	this.body.setRectangle( game.physics.p2.mpx( .5 ), game.physics.p2.mpx( config.height ) );
	this.body.fixedRotation = true;
	this.body.mass = config.weight;

	this.id = config.id;

	this.hasBall = false;
	this.isUnderControl = false;

	this._state = null;
};
inherits( Player, Phaser.Sprite );


Player.prototype.isInTheAir = function() {

	return;
};


Player.prototype.setState = function( state ) {

	this._state = state;
};


Player.prototype.getState = function() {

	return this._state;
};


Player.State = {
	STANCE: 'stance',
	WALKING: 'walking',
	RUNNING: 'running',
	SHOOTING: 'shooting',
	PASSING: 'passing'
};


module.exports = Player;