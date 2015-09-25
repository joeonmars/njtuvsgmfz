var inherits = require( 'inherits' );
var Events = require( 'common/events' );


/**
 * The base player class.
 * @constructor
 */
var Player = function( game, config ) {

	Phaser.Sprite.call( this, game, null, null, 'walk' );

	game.physics.enable( this, Phaser.Physics.ARCADE );

	this.config = config;
	this.id = config.id;
	this.entityType = 'player';

	this._minDragX = 0;
	this._maxDragX = this.game.physics.p2.mpx( 8 );

	this._acceleration = this.game.physics.p2.mpx( 2 );

	this.anchor.setTo( .5, 1 );
	this.height = game.physics.p2.mpx( config.height );
	this.width = this.height * ( 104 / 150 );

	this.body.mass = 1;
	this.body.allowRotation = false;
	this.body.collideWorldBounds = true;
	this.body.maxVelocity.x = this.calculateMaxSpeed( config.sprint );
	this.body.drag.x = this._maxDragX;

	this.setBodyRatio( .5, 1 );

	//
	this.hasBall = false;
	this.isInTheAir = false;
	this.canDunk = this.config.dunk;
	this.facing = Phaser.RIGHT;

	this._gameElements = {
		floor: null,
		ball: null,
		ownBasket: null,
		opponentBasket: null,
		teammate: null,
		opponents: null
	};

	this._state = null;
	this._strategy = null;

	//
	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
	Events.ballDropped.add( this.onDropped, this );
	Events.strategyChanged.add( this.onStrategyChanged, this );

	//
	this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ], 8, true );
	this.animations.add( 'stance', [ 12 ] );

	this.setState( Player.State.STANCE );
	this.setStrategy( Player.Strategy.COMPETE );
};
inherits( Player, Phaser.Sprite );


Player.prototype.setGameElements = function( gameElements ) {

	this._gameElements = _.extendOwn( this._gameElements, gameElements );
}


Player.prototype.setPosition = function( x, y ) {

	this.x = x;
	this.y = y;
	this.body.x = x;
	this.body.y = y;
}


Player.prototype.setBodyRatio = function( rx, ry ) {

	this.body.setSize( this.width / this.scale.x * rx, this.height / this.scale.y * ry );
}


Player.prototype.calculateJumpVelocity = function( jump, opt_velocityX ) {

	var velocityFraction = Math.abs( opt_velocityX || 0 ) / this.body.maxVelocity.x;
	var acceleratedJump = Phaser.Math.linearInterpolation( [ 0, this.game.physics.p2.mpx( -1 ) ], velocityFraction );

	var minJump = this.game.physics.p2.mpx( -1.5 );
	var maxJump = this.game.physics.p2.mpx( -4.5 );
	return Phaser.Math.linearInterpolation( [ minJump, maxJump ], jump ) + acceleratedJump;
}


Player.prototype.calculateMaxSpeed = function( sprint ) {

	var minSpeed = this.game.physics.p2.mpx( 2.5 );
	var maxSpeed = this.game.physics.p2.mpx( 5.5 );
	return Phaser.Math.linearInterpolation( [ minSpeed, maxSpeed ], sprint );
}


Player.prototype.calculateDampingByWeight = function( weight ) {

	var minWeight = 60;
	var maxWeight = 100;
	return Phaser.Math.linearInterpolation( [ 0, .8 ], ( weight - minWeight ) / ( maxWeight - minWeight ) );
}


Player.prototype.setStrategy = function( strategy ) {

	this._strategy = strategy;
}


Player.prototype.setState = function( state ) {

	//console.log( 'current state: ' + state );

	this._state = state;
}


Player.prototype.isState = function( state ) {

	return this._state === state;
}


Player.prototype.isStrategy = function( strategy ) {

	return this._strategy === strategy;
}


Player.prototype.getInitialVelocity = function( startPosition, finalPosition, deg ) {

	var dx = this.game.physics.p2.pxm( Math.abs( finalPosition.x - startPosition.x ) );

	var y0 = this.game.physics.p2.pxm( this.game.world.height - startPosition.y );
	var y1 = this.game.physics.p2.pxm( this.game.world.height - finalPosition.y );
	var g = 9.81;

	var rad = Phaser.Math.degToRad( deg );
	var rad2 = Phaser.Math.degToRad( deg * 2 );
	var cos2 = ( 1 + Math.cos( rad2 ) ) / 2;

	var v0 = Math.sqrt( ( Math.pow( dx, 2 ) * .5 * -g ) / ( ( y1 - y0 - dx * Math.tan( rad ) ) * cos2 ) );

	console.log( 'initial velocity: ' + v0 +
		' m/s^2, jumping distance x: ' + dx +
		' m, start y: ' + y0 +
		' m, final y: ' + y1 + ' m.' );

	return v0;
}


Player.prototype.face = function( facing ) {

	if ( this.facing === facing ) {
		return;
	}

	this.facing = facing;

	var absScaleX = Math.abs( this.scale.x );

	this.scale.x = ( facing === Phaser.LEFT ) ? -absScaleX : absScaleX;
	this.body.velocity.x = 0;

	Events.facingChanged.dispatch( this, facing );
}


Player.prototype.faceOpponentBasket = function() {

	var basket = this._gameElements.opponentBasket;
	var facing = ( this.x > basket.x ) ? Phaser.LEFT : Phaser.RIGHT;
	this.face( facing );
}


Player.prototype.stance = function() {

	this.body.acceleration.x = 0;

	this.animations.play( 'stance' );
}


Player.prototype.walk = function() {

	//http://hypertextbook.com/facts/2007/charlesbarkley.shtml
	if ( this.facing === Phaser.LEFT ) {

		this.body.acceleration.x = -this._acceleration;

	} else {

		this.body.acceleration.x = this._acceleration;
	}

	this.animations.play( 'walk' );
}


Player.prototype.jump = function() {

	if ( this.isInTheAir ) {
		return;
	}

	this.isInTheAir = true;

	var jumpVelocity = this.calculateJumpVelocity( this.config.jump, this.body.velocity.x );
	this.body.velocity.y = jumpVelocity;

	this.body.acceleration.x = 0;
	this.body.velocity.x *= .5;

	this.animations.play( 'stance' );
}


Player.prototype.shoot = function() {

	if ( !this.hasBall ) {
		return;
	}

	var basket = this._gameElements.opponentBasket;
	var ball = this._gameElements.ball;
	var ballRadius = ball.width / 2;

	// adjust facing towards basket before shooting
	this.faceOpponentBasket();

	var startX = this.x;
	var startY = this.y - this.height - ballRadius;
	var targetX = basket.x;
	var targetY = basket.y - basket.height / 2;

	Events.ballShot.dispatch( ball, startX, startY, targetX, targetY );

	this.setState( Player.State.STANCE );
}


Player.prototype.dunk = function() {

	if ( !this.hasBall || this.isInTheAir || !this.canDunk ) {
		return;
	}

	this.isInTheAir = true;

	// WIP
	// adjust facing towards basket before shooting
	this.faceOpponentBasket();

	var basket = this._gameElements.opponentBasket;
	var direction = ( this.x > basket.x ) ? 1 : -1;
	var bodyOffsetX = Math.abs( this.width ) / 2 * direction;
	var bodyOffsetY = this.height;
	var finalPosition = new Phaser.Point( basket.x + bodyOffsetX, basket.y + bodyOffsetY );

	var distanceX = this.x - finalPosition.x;
	var halfDistance = distanceX / 2;
	var baseY = basket.y + this.height;
	var extraY = Phaser.Math.linearInterpolation( [ 0, this.game.physics.p2.mpx( 1 ) ], this.config.jump );
	var highestPosition = new Phaser.Point( finalPosition.x + halfDistance, baseY - extraY );

	var rad = Phaser.Math.angleBetweenPoints( highestPosition, this.position );

	var deg = Phaser.Math.radToDeg( rad );
	deg = ( deg > 90 ) ? 180 - deg : deg;

	var v = this.getInitialVelocity( this.position, finalPosition, deg );
	v = this.game.physics.p2.mpx( v );

	if ( !v ) {
		return;
	}

	rad = Phaser.Math.degToRad( deg );

	var velocityX = -v * Math.cos( rad ) * direction;
	var velocityY = -v * Math.sin( rad );

	this.body.acceleration.x = 0;

	this.body.velocity.x = velocityX;
	this.body.velocity.y = velocityY;
}


Player.prototype.update = function() {

	this.isInTheAir = !this.game.physics.arcade.collide( this, this._gameElements.floor, this.onCollideWithFloor, null, this );

	this.body.drag.x = this.isInTheAir ? this._minDragX : this._maxDragX;

	var ball = this._gameElements.ball;

	if ( ball.exists && ball.overlap( this ) ) {

		Events.ballCaught.dispatch( this );
	}

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

		case Player.State.DUNKING:
			this.dunk();
			break;

		default:
			break;
	}
}


Player.prototype.onCollideWithFloor = function() {

	if ( this.isInTheAir &&
		( this.isState( Player.State.JUMPING ) || this.isState( Player.State.DUNKING ) ) ) {

		this.setState( Player.State.STANCE );
	}
}


Player.prototype.onCaught = function( player ) {

	this.hasBall = ( this === player );

	// dispatch event
	var teammate = this._gameElements.teammate;
	var ownTeam = [ this, teammate ];

	if ( this.hasBall || player === teammate ) {

		Events.strategyChanged.dispatch( ownTeam, Player.Strategy.OFFENSE );

	} else {

		Events.strategyChanged.dispatch( ownTeam, Player.Strategy.DEFENSE );
	}
}


Player.prototype.onDropped = function( player ) {

	this.hasBall = false;

	// dispatch event
	var ownTeam = [ this, this._gameElements.teammate ];

	Events.strategyChanged.dispatch( ownTeam, Player.Strategy.COMPETE );
}


Player.prototype.onShot = function( player, x, y ) {

	this.hasBall = false;

	// dispatch event
	var ownTeam = [ this, this._gameElements.teammate ];

	Events.strategyChanged.dispatch( ownTeam, Player.Strategy.COMPETE );
}


Player.prototype.onStrategyChanged = function( team, strategy ) {

	var inTeam = _.contains( team, this );

	if ( inTeam ) {

		this.setStrategy( strategy );
	}
}


Player.State = {
	STANCE: 'stance',
	WALKING: 'walking',
	RUNNING: 'running',
	SHOOTING: 'shooting',
	PASSING: 'passing',
	JUMPING: 'jumping',
	DUNKING: 'dunking'
};


Player.Strategy = {
	OFFENSE: 'offense', // trying to score while this player or his teamate owns the ball
	DEFENSE: 'defense', // preventing the opponents from scoring
	COMPETE: 'compete' // competing for the ball control for offensing
};


module.exports = Player;