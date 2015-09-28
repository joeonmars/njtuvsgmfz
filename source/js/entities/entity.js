var inherits = require( 'inherits' );
var Events = require( 'common/events' );


var Entity = function( game, key, entityType ) {

	Phaser.Sprite.call( this, game, null, null, key, null );

	this.entityType = entityType;

	this._gameElements = {};
	this._stat = null;
	this._statData = null;
};
inherits( Entity, Phaser.Sprite );


Entity.prototype.init = function( x, y, stat ) {

	this.setPosition( x, y );
	this.setStat( stat );
};


Entity.prototype.setStat = function( stat, opt_data ) {

	this._stat = stat;
	this._statData = opt_data;
};


Entity.prototype.getStat = function() {

	return this._stat;
};


Entity.prototype.getStatData = function() {

	return this._statData;
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


Entity.prototype.mpx = function( m ) {

	return this.game.physics.p2.mpx( m );
};


Entity.prototype.pxm = function( px ) {

	return this.game.physics.p2.pxm( px );
};


Entity.prototype.getInitialVelocity = function( startPosition, finalPosition, deg ) {

	var dx = this.pxm( Math.abs( finalPosition.x - startPosition.x ) );

	var y0 = this.pxm( this.game.world.height - startPosition.y );
	var y1 = this.pxm( this.game.world.height - finalPosition.y );
	var g = 9.81;

	var rad = Phaser.Math.degToRad( deg );
	var rad2 = Phaser.Math.degToRad( deg * 2 );
	var cos2 = ( 1 + Math.cos( rad2 ) ) / 2;

	var v0 = Math.sqrt( ( Math.pow( dx, 2 ) * .5 * -g ) / ( ( y1 - y0 - dx * Math.tan( rad ) ) * cos2 ) );

	/*
	console.log( 'initial velocity: ' + v0 +
		' m/s^2, distance x: ' + dx +
		' m, start y: ' + y0 +
		' m, final y: ' + y1 + ' m.' );
	*/
	return v0;
};


Entity.prototype.getPeakOfProjectile = function( p1, p2, p3 ) {

	var projectile = this.getProjectileByPoints( p1, p2, p3 );

	var a = projectile.a;
	var b = projectile.b;
	var c = projectile.c;

	var peakX = -b / ( a * 2 );
	var peakY = ( 4 * a * c - Math.pow( b, 2 ) ) / ( 4 * a );

	var peak = new Phaser.Point( peakX, peakY );
	return peak;
};


Entity.prototype.getProjectileByPoints = function( p1, p2, p3 ) {

	var a1 = p1.x;
	var a2 = p2.x;
	var a3 = p3.x;
	var b1 = p1.y;
	var b2 = p2.y;
	var b3 = p3.y;

	var a = ( ( a2 - a3 ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a3 - a1 ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a1 - a2 ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );
	var b = ( ( Math.pow( a3, 2 ) - Math.pow( a2, 2 ) ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a1, 2 ) - Math.pow( a3, 2 ) ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a2, 2 ) - Math.pow( a1, 2 ) ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );
	var c = ( ( Math.pow( a2, 2 ) * a3 - a2 * Math.pow( a3, 2 ) ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a1 * Math.pow( a3, 2 ) - Math.pow( a1, 2 ) * a3 ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a1, 2 ) * a2 - a1 * Math.pow( a2, 2 ) ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );

	return {
		a: a,
		b: b,
		c: c
	};
};


Entity.prototype.getYForXOfProjectile = function( a, b, c, x ) {

	return a * Math.pow( x, 2 ) + b * x + c;
};


Entity.Type = {
	PLAYER: 'PLAYER',
	BALL: 'BALL'
};


Entity.Vertical = {
	UP: 'UP',
	DOWN: 'DOWN'
};


Entity.Stat = {
	/* Player */
	STANCE: 'STANCE',
	WALKING: 'WALKING',
	JUMPING: 'JUMPING',
	DUNKING: 'DUNKING',
	/* Ball */
	NORMAL: 'NORMAL',
	POSSESSING: 'POSSESSING',
	SCORED: 'SCORED',
	/* Common */
	SHOOTING: 'SHOOTING',
	PASSING: 'PASSING'
};


module.exports = Entity;