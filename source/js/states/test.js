var inherits = require( 'inherits' );


var Test = function() {

	this.p1 = new Phaser.Point( 100, 400 );
	this.p2 = new Phaser.Point( 200, 300 );
	this.p3 = new Phaser.Point( 600, 600 );

	this.k0 = null;
	this.k1 = null;
	this.k2 = null;
};
inherits( Test, Phaser.State );


Test.prototype.init = function() {

	console.log( "init test state!" );
};


Test.prototype.getYByX = function( x ) {

	var a1 = this.p1.x;
	var a2 = this.p2.x;
	var a3 = this.p3.x;
	var b1 = this.p1.y;
	var b2 = this.p2.y;
	var b3 = this.p3.y;

	this.k0 = ( ( a2 - a3 ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a3 - a1 ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a1 - a2 ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );
	this.k1 = ( ( Math.pow( a3, 2 ) - Math.pow( a2, 2 ) ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a1, 2 ) - Math.pow( a3, 2 ) ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a2, 2 ) - Math.pow( a1, 2 ) ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );
	this.k2 = ( ( Math.pow( a2, 2 ) * a3 - a2 * Math.pow( a3, 2 ) ) * b1 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( a1 * Math.pow( a3, 2 ) - Math.pow( a1, 2 ) * a3 ) * b2 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 ) + ( ( Math.pow( a1, 2 ) * a2 - a1 * Math.pow( a2, 2 ) ) * b3 ) / ( a2 * Math.pow( a1, 2 ) - a3 * Math.pow( a1, 2 ) - Math.pow( a2, 2 ) * a1 + Math.pow( a3, 2 ) * a1 - a2 * Math.pow( a3, 2 ) + Math.pow( a2, 2 ) * a3 );

	//console.log( this.k0, this.k1, this.k2 );

	return this.k0 * Math.pow( x, 2 ) + this.k1 * x + this.k2;
};


Test.prototype.update = function() {

};


Test.prototype.render = function() {

	for ( var x = this.p1.x; x < this.p3.x; x += 10 ) {
		var y = this.getYByX( x );
		this.game.debug.pixel( x - 1, y - 1, '#00ff00', 2 );
	}

	this.game.debug.pixel( this.p1.x - 1, this.p1.y - 1, '#ff0000', 2 );
	this.game.debug.pixel( this.p2.x - 1, this.p2.y - 1, '#ff0000', 2 );
	this.game.debug.pixel( this.p3.x - 1, this.p3.y - 1, '#ff0000', 2 );

	var highestX = -this.k1 / ( this.k0 * 2 );
	var highestY = ( 4 * this.k0 * this.k2 - Math.pow( this.k1, 2 ) ) / ( 4 * this.k0 );
	this.game.debug.pixel( highestX - 4, highestY - 4, '#ff0000', 8 );
};


module.exports = Test;