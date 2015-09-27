var inherits = require( 'inherits' );
var Events = require( 'common/events' );
var CourtConfig = require( 'common/court' );
var Entity = require( 'entities/entity' );
var Stat = Entity.Stat;


/* Reference
http://stackoverflow.com/questions/5262240/2d-parabolic-projectile
https://www.boundless.com/physics/textbooks/boundless-physics-textbook/two-dimensional-kinematics-3/projectile-motion-42/basic-equations-and-parabolic-path-226-10952/
http://physics.stackexchange.com/questions/27992/solving-for-initial-velocity-required-to-launch-a-projectile-to-a-given-destinat
https://www.youtube.com/watch?v=DPByaJ7bpl0
*/
var Ball = function( game ) {

	Entity.call( this, game, 'ball', Entity.Type.BALL );

	game.physics.enable( this, Phaser.Physics.P2JS );

	this.width = this.height = this.mpx( 0.25 );

	this.body.setCircle( this.width / 2 );
	this.body.mass = 1;
	this.body.damping = 0;
	this.body.angularDamping = .6;

	this.inputEnabled = true;
	this.input.enableDrag();

	// gameplay relevant properties
	this._player = null;

	this._gameElements = {
		floorBody: null,
		baskets: null
	};

	this._floorBodyId = null;
	this._basketBodyIds = null;

	this._foulShot = false;
	this._rimY = this.game.world.height - this.mpx( CourtConfig.FLOOR_HEIGHT + CourtConfig.RIM_Y );

	// projectile properties
	this.velocityX = 0;
	this.velocityY = 0;
	this.startX = 0;
	this.startY = 0;
};
inherits( Ball, Entity );


Ball.prototype.init = function( x, y ) {

	Entity.prototype.init.call( this, x, y, Stat.NORMAL );

	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
	Events.ballPassed.add( this.onPassed, this );

	this.body.onBeginContact.add( this.onBeginContact, this );
};


Ball.prototype.destroy = function() {

	Entity.prototype.destroy.call( this );

	Events.ballCaught.remove( this.onCaught, this );
	Events.ballShot.remove( this.onShot, this );
	Events.ballPassed.remove( this.onPassed, this );

	this.body.onBeginContact.remove( this.onBeginContact, this );
};


Ball.prototype.setGameElements = function( gameElements ) {

	Entity.prototype.setGameElements.call( this, gameElements );

	this._floorBodyId = this._gameElements.floorBody.id;

	this._basketBodyIds = _.map( this._gameElements.baskets, function( basket ) {
		return basket.body.id;
	} );
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

	// cap ball's max speed to 10m/s
	v = Math.min( v, 10 );

	rad = Phaser.Math.degToRad( deg );

	var direction = ( this.position.x > finalPosition.x ) ? 1 : -1;

	this.velocityX = v * Math.cos( rad ) * direction;
	this.velocityY = v * Math.sin( rad );

	this.startX = this.x;
	this.startY = this.y;

	this.body.setZeroVelocity();

	var impulse = [ this.velocityX, this.velocityY ];
	this.body.applyImpulse( impulse, this.x, this.y );

	this.body.angularVelocity = v;

	this.setStat( Stat.SHOOTING );
};


Ball.prototype.pass = function( finalPosition ) {

	var distanceX = this.position.x - finalPosition.x;
	var halfDistance = distanceX / 2;
	var highestPosition = new Phaser.Point( finalPosition.x + halfDistance, finalPosition.y - Math.abs( halfDistance / 2 ) );

	var rad = Phaser.Math.angleBetweenPoints( highestPosition, this.position );

	var deg = Phaser.Math.radToDeg( rad );
	deg = ( deg > 90 ) ? 180 - deg : deg;

	//console.log( deg );
	//deg = 45;

	var v = this.getInitialVelocity( this.position, finalPosition, deg );

	if ( !v ) {
		return;
	}

	// cap ball's max speed to 10m/s
	v = Math.min( v, 10 );

	rad = Phaser.Math.degToRad( deg );

	var direction = ( this.position.x > finalPosition.x ) ? 1 : -1;

	this.velocityX = v * Math.cos( rad ) * direction;
	this.velocityY = v * Math.sin( rad );

	this.startX = this.x;
	this.startY = this.y;

	this.body.setZeroVelocity();

	var impulse = [ this.velocityX, this.velocityY ];
	this.body.applyImpulse( impulse, this.x, this.y );

	this.body.angularVelocity = v;

	this.setStat( Stat.PASSING );
};


Ball.prototype.getPredictedY = function( worldX ) {

	if ( ( worldX < this.startX && this.velocityX < 0 ) ||
		( worldX > this.startX && this.velocityX > 0 ) ) {
		return null;
	}

	//http://www.physicsclassroom.com/class/vectors/Lesson-2/Horizontal-and-Vertical-Displacement
	var displacementX = this.pxm( Math.abs( worldX - this.startX ) );
	var t = displacementX / Math.abs( this.velocityX );
	var g = -9.81;

	var displacementY = this.velocityY * t + .5 * g * Math.pow( t, 2 );

	var worldY = this.mpx( this.pxm( this.startY ) - displacementY );

	return worldY;
};


Ball.prototype.update = function() {

	Entity.prototype.update.call( this );

	if ( this.input.isDragged ) {

		this.body.setZeroVelocity();

		var pointer = this.input.game.input.activePointer;
		this.body.reset( pointer.worldX, pointer.worldY );
	}

	if ( this.y - this.height / 2 < this._rimY ) {
		this._foulShot = false;
	}
};


Ball.prototype.onCaught = function( player ) {

	this._player = player;

	this.exists = false;

	this.setStat( Stat.POSSESSING );
};


Ball.prototype.onShot = function( player, ball, startX, startY, targetX, targetY ) {

	this._player = player;

	this.setPosition( startX, startY );

	this.exists = true;

	this._foulShot = false;

	this.shoot( {
		x: targetX,
		y: targetY
	} );
};


Ball.prototype.onPassed = function( ball, playerA, playerB, startX, startY, targetX, targetY ) {

	//WIP
	this._player = null;

	this.setPosition( startX, startY );

	this.exists = true;

	this.pass( {
		x: targetX,
		y: targetY
	} );
};


Ball.prototype.onBeginContact = function( bodyA, bodyB, shapeA, shapeB ) {

	var contactBodyId = bodyB.id;

	var hitFloor = ( contactBodyId === this._floorBodyId );
	var hitBasket = _.contains( this._basketBodyIds, contactBodyId );

	if ( hitFloor ) {

		this.setStat( Stat.NORMAL );

	} else if ( hitBasket ) {

		this.setStat( Stat.NORMAL );
	}

	// passing through basket circle sensor
	if ( shapeA.type === p2.Shape.CIRCLE && shapeB.type === p2.Shape.CIRCLE ) {

		if ( this.body.velocity.y < 0 ) {

			this._foulShot = true;

		} else if ( !this._foulShot ) {

			console.log( "Made basket!" );
			Events.basketMade.dispatch( this._player );
		}
	}
};


module.exports = Ball;