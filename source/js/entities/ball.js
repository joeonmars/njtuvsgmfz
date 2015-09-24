var inherits = require( 'inherits' );
var Events = require( 'common/events' );


/* Reference
http://stackoverflow.com/questions/5262240/2d-parabolic-projectile
https://www.boundless.com/physics/textbooks/boundless-physics-textbook/two-dimensional-kinematics-3/projectile-motion-42/basic-equations-and-parabolic-path-226-10952/
http://physics.stackexchange.com/questions/27992/solving-for-initial-velocity-required-to-launch-a-projectile-to-a-given-destinat
https://www.youtube.com/watch?v=DPByaJ7bpl0
*/
var Ball = function( game, x, y, key, frame ) {

	Phaser.Sprite.call( this, game, x, y, key, frame );

	game.physics.enable( this, Phaser.Physics.P2JS );

	this.entityType = 'ball';

	this.width = this.height = game.physics.p2.mpx( 0.25 );

	this.body.setCircle( this.width / 2 );
	this.body.fixedRotation = true;
	this.body.mass = 1;
	this.body.damping = 0;
	this.body.angularDamping = 1;

	this.inputEnabled = true;
	this.input.enableDrag();

	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );

	// gameplay relevant properties
	this._player = null;

	// projectile properties
	this.velocityX = 0;
	this.velocityY = 0;
	this.startX = 0;
	this.startY = 0;
};
inherits( Ball, Phaser.Sprite );


Ball.prototype.setPosition = function( x, y ) {

	this.x = x;
	this.y = y;
	this.body.x = x;
	this.body.y = y;
};


Ball.prototype.shoot = function( finalPosition ) {

	var distanceX = this.position.x - finalPosition.x;
	var halfDistance = distanceX / 2;
	var highestPosition = new Phaser.Point( finalPosition.x + halfDistance, finalPosition.y - Math.abs( halfDistance ) - this.height );

	var rad = Phaser.Math.angleBetweenPoints( highestPosition, this.position );

	var deg = Phaser.Math.radToDeg( rad );
	deg = ( deg > 90 ) ? 180 - deg : deg;

	//console.log( deg );
	//deg = 45;

	var v = this.getInitialVelocity( this.position, finalPosition, deg );

	if ( !v ) {
		return;
	}

	rad = Phaser.Math.degToRad( deg );

	var direction = ( this.position.x > finalPosition.x ) ? 1 : -1;

	this.velocityX = v * Math.cos( rad ) * direction;
	this.velocityY = v * Math.sin( rad );

	this.startX = this.x;
	this.startY = this.y;

	this.body.setZeroVelocity();

	var impulse = [ this.velocityX, this.velocityY ];
	this.body.applyImpulse( impulse, this.x, this.y );
}


Ball.prototype.getInitialVelocity = function( startPosition, finalPosition, deg ) {

	var dx = this.game.physics.p2.pxm( Math.abs( finalPosition.x - startPosition.x ) );

	var y0 = this.game.physics.p2.pxm( this.game.world.height - startPosition.y );
	var y1 = this.game.physics.p2.pxm( this.game.world.height - finalPosition.y );
	var g = 9.81;

	var rad = Phaser.Math.degToRad( deg );
	var rad2 = Phaser.Math.degToRad( deg * 2 );
	var cos2 = ( 1 + Math.cos( rad2 ) ) / 2;

	var v0 = Math.sqrt( ( Math.pow( dx, 2 ) * .5 * -g ) / ( ( y1 - y0 - dx * Math.tan( rad ) ) * cos2 ) );

	console.log( 'initial velocity: ' + v0 +
		' m/s^2, shooting distance x: ' + dx +
		' m, start y: ' + y0 +
		' m, final y: ' + y1 + ' m.' );

	return v0;
}


Ball.prototype.getPredictedY = function( worldX ) {

	if ( ( worldX < this.startX && this.velocityX < 0 ) ||
		( worldX > this.startX && this.velocityX > 0 ) ) {
		return null;
	}

	//http://www.physicsclassroom.com/class/vectors/Lesson-2/Horizontal-and-Vertical-Displacement
	var displacementX = this.game.physics.p2.pxm( Math.abs( worldX - this.startX ) );
	var t = displacementX / Math.abs( this.velocityX );
	var g = -9.81;

	var displacementY = this.velocityY * t + .5 * g * Math.pow( t, 2 );

	var worldY = this.game.physics.p2.mpx( this.game.physics.p2.pxm( this.startY ) - displacementY );

	return worldY;
}


Ball.prototype.update = function() {

	if ( this.input.isDragged ) {

		this.body.setZeroVelocity();

		var pointer = this.input.game.input.activePointer;
		this.body.reset( pointer.worldX, pointer.worldY );
	}
}


Ball.prototype.onCaught = function( player ) {

	this._player = player;

	this.exists = false;
}


Ball.prototype.onShot = function( player, startX, startY, targetX, targetY ) {

	this._player = null;

	this.setPosition( startX, startY );

	this.exists = true;

	this.shoot( {
		x: targetX,
		y: targetY
	} );
}


module.exports = Ball;