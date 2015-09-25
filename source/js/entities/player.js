var inherits = require( 'inherits' );
var Events = require( 'common/events' );
var Entity = require( 'entities/entity' );
var Stat = Entity.Stat;

/**
 * The player class.
 * @constructor
 */
var Player = function( game, config ) {

	Entity.call( this, game, 'walk', Entity.Type.PLAYER );

	game.physics.enable( this, Phaser.Physics.ARCADE );

	this.config = config;
	this.id = config.id;

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

	this._strategy = null;

	this.animations.add( 'walk', [ 0, 1, 2, 3, 4, 5 ], 8, true );
	this.animations.add( 'stance', [ 12 ] );
};
inherits( Player, Entity );


Player.prototype.init = function( x, y ) {

	Entity.prototype.init.call( this, x, y, Stat.STANCE );

	this.setBodyRatio( .5, 1 );

	this.setStrategy( Player.Strategy.COMPETE );

	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
	Events.ballDropped.add( this.onDropped, this );
	Events.strategyChanged.add( this.onStrategyChanged, this );
};


Player.prototype.setBodyRatio = function( rx, ry ) {

	this.body.setSize( this.width / this.scale.x * rx, this.height / this.scale.y * ry );
};


Player.prototype.calculateJumpVelocity = function( jump, opt_velocityX ) {

	var velocityFraction = Math.abs( opt_velocityX || 0 ) / this.body.maxVelocity.x;
	var acceleratedJump = Phaser.Math.linearInterpolation( [ 0, this.game.physics.p2.mpx( -1 ) ], velocityFraction );

	var minJump = this.game.physics.p2.mpx( -1.5 );
	var maxJump = this.game.physics.p2.mpx( -4.5 );
	return Phaser.Math.linearInterpolation( [ minJump, maxJump ], jump ) + acceleratedJump;
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


Player.prototype.setStrategy = function( strategy ) {

	this._strategy = strategy;
};


Player.prototype.isStrategy = function( strategy ) {

	return this._strategy === strategy;
};


Player.prototype.face = function( facing ) {

	if ( this.facing === facing ) {
		return;
	}

	this.facing = facing;

	var absScaleX = Math.abs( this.scale.x );

	this.scale.x = ( facing === Phaser.LEFT ) ? -absScaleX : absScaleX;
	this.body.velocity.x = 0;

	Events.facingChanged.dispatch( this, facing );
};


Player.prototype.faceOpponentBasket = function() {

	var basket = this._gameElements.opponentBasket;
	var facing = ( this.x > basket.x ) ? Phaser.LEFT : Phaser.RIGHT;
	this.face( facing );
};


Player.prototype.stance = function() {

	this.body.acceleration.x = 0;

	this.animations.play( 'stance' );
};


Player.prototype.walk = function() {

	//http://hypertextbook.com/facts/2007/charlesbarkley.shtml
	if ( this.facing === Phaser.LEFT ) {

		this.body.acceleration.x = -this._acceleration;

	} else {

		this.body.acceleration.x = this._acceleration;
	}

	this.animations.play( 'walk' );
};


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
};


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

	this.setStat( Stat.STANCE );
};


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
};


Player.prototype.detectBallCollision = function() {

	var ball = this._gameElements.ball;
	var canCollide = ball.exists && ball.isStat( Stat.NORMAL );

	if ( canCollide && ball.overlap( this ) ) {

		Events.ballCaught.dispatch( this );
	}
};


Player.prototype.update = function() {

	Entity.prototype.update.call( this );

	this.isInTheAir = !this.game.physics.arcade.collide( this, this._gameElements.floor, this.onCollideWithFloor, null, this );

	this.body.drag.x = this.isInTheAir ? this._minDragX : this._maxDragX;

	this.detectBallCollision();

	//
	switch ( this.getStat() ) {
		case Stat.STANCE:
			this.stance();
			break;

		case Stat.JUMPING:
			this.jump();
			break;

		case Stat.WALKING:
			this.walk();
			break;

		case Stat.SHOOTING:
			this.shoot();
			break;

		case Stat.DUNKING:
			this.dunk();
			break;

		default:
			break;
	}
};


Player.prototype.onCollideWithFloor = function() {

	if ( this.isInTheAir &&
		( this.isStat( Stat.JUMPING ) || this.isStat( Stat.DUNKING ) ) ) {

		this.setStat( Stat.STANCE );
	}
};


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
};


Player.prototype.onDropped = function( player ) {

	this.hasBall = false;

	// dispatch event
	var ownTeam = [ this, this._gameElements.teammate ];

	Events.strategyChanged.dispatch( ownTeam, Player.Strategy.COMPETE );
};


Player.prototype.onShot = function( player, x, y ) {

	this.hasBall = false;

	// dispatch event
	var ownTeam = [ this, this._gameElements.teammate ];

	Events.strategyChanged.dispatch( ownTeam, Player.Strategy.COMPETE );
};


Player.prototype.onStrategyChanged = function( team, strategy ) {

	var inTeam = _.contains( team, this );

	if ( inTeam ) {

		this.setStrategy( strategy );
	}
};


Player.Strategy = {
	OFFENSE: 'offense', // trying to score while this player or his teamate owns the ball
	DEFENSE: 'defense', // preventing the opponents from scoring
	COMPETE: 'compete' // competing for the ball control for offensing
};


module.exports = Player;