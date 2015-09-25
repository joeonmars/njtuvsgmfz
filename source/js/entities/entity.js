var inherits = require( 'inherits' );
var Events = require( 'common/events' );


var Entity = function( game, key, entityType ) {

	Phaser.Sprite.call( this, game, null, null, key, null );

	this.entityType = entityType;

	this._gameElements = {};
	this._stat = null;
};
inherits( Entity, Phaser.Sprite );


Entity.prototype.init = function( x, y, stat ) {

	this.setPosition( x, y );
	this.setStat( stat );
};


Entity.prototype.setStat = function( stat ) {

	this._stat = stat;
};


Entity.prototype.getStat = function() {

	return this._stat;
};


Entity.prototype.isStat = function( stat ) {

	return this._stat === stat;
};


Entity.prototype.setPosition = function( x, y ) {

	this.x = x;
	this.y = y;
	this.reset( x, y );
};


Entity.prototype.setGameElements = function( gameElements ) {

	this._gameElements = _.extendOwn( this._gameElements, gameElements );
};


Entity.prototype.getInitialVelocity = function( startPosition, finalPosition, deg ) {

	var dx = this.game.physics.p2.pxm( Math.abs( finalPosition.x - startPosition.x ) );

	var y0 = this.game.physics.p2.pxm( this.game.world.height - startPosition.y );
	var y1 = this.game.physics.p2.pxm( this.game.world.height - finalPosition.y );
	var g = 9.81;

	var rad = Phaser.Math.degToRad( deg );
	var rad2 = Phaser.Math.degToRad( deg * 2 );
	var cos2 = ( 1 + Math.cos( rad2 ) ) / 2;

	var v0 = Math.sqrt( ( Math.pow( dx, 2 ) * .5 * -g ) / ( ( y1 - y0 - dx * Math.tan( rad ) ) * cos2 ) );

	console.log( 'initial velocity: ' + v0 +
		' m/s^2, distance x: ' + dx +
		' m, start y: ' + y0 +
		' m, final y: ' + y1 + ' m.' );

	return v0;
};


Entity.Type = {
	PLAYER: 'player',
	BALL: 'ball'
};

Entity.Stat = {
	NORMAL: 'normal',
	STANCE: 'stance',
	WALKING: 'walking',
	RUNNING: 'running',
	JUMPING: 'jumping',
	DUNKING: 'dunking',
	SHOOTING: 'shooting',
	PASSING: 'passing',
	POSSESSING: 'possessing',
	SCORED: 'scored'
};


module.exports = Entity;