var Utils = require( 'app/utils' );
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
	this._maxDragX = this.mpx( 8 );

	this._acceleration = this.mpx( 2 );

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
	this.animations.add( 'stance', [ 12 ], 8, true );
	this.animations.add( 'jump', [ 12 ], 8, false );
	this.animations.add( 'pass', [ 12 ], 1, false );
	this.animations.add( 'shoot', [ 12 ], 1, false );
};
inherits( Player, Entity );


Player.prototype.init = function( x, y ) {

	Entity.prototype.init.call( this, x, y, Stat.STANCE );

	this.setBodyRatio( .5, 1 );

	this.setStrategy( Player.Strategy.COMPETE );

	Events.ballCaught.add( this.onBallCaught, this );
	Events.ballShot.add( this.onBallShot, this );
	Events.ballPassed.add( this.onBallPassed, this );
	Events.ballLost.add( this.onBallLost, this );
	Events.strategyChanged.add( this.onStrategyChanged, this );

	this.events.onAnimationComplete.add( this.onAnimationComplete, this );
};


Player.prototype.setStat = function( stat, opt_data ) {

	if ( this.canRouteToStat( stat ) ) {

		Entity.prototype.setStat.call( this, stat, opt_data );
	}
};


Player.prototype.setBodyRatio = function( rx, ry ) {

	this.body.setSize( this.width / this.scale.x * rx, this.height / this.scale.y * ry );
};


Player.prototype.canRouteToStat = function( stat ) {

	var currentStatRoute = Player.StatRoute[ this.getStat() ];

	var canRouteToStat;

	if ( currentStatRoute ) {

		var targetStatRoute = currentStatRoute[ stat ];

		switch ( targetStatRoute.condition ) {
			case Player.StatRouteCondition.WHENEVER:
				canRouteToStat = true;
				break;

			case Player.StatRouteCondition.NEVER:
				canRouteToStat = false;
				break;

			case Player.StatRouteCondition.FRAME_ONLY:
				canRouteToStat = false; //WIP
				break;

			case Player.StatRouteCondition.ANIMATION_COMPLETE:
				canRouteToStat = this.animations.currentAnim.isFinished;
				break;

			case Player.StatRouteCondition.LAND:
				canRouteToStat = !this.isInTheAir;
				break;

			default:
				break;
		}

	} else {

		canRouteToStat = true;
	}

	return canRouteToStat;
};


Player.prototype.calculateJumpVelocity = function( jump, opt_velocityX ) {

	var velocityFraction = Math.abs( opt_velocityX || 0 ) / this.body.maxVelocity.x;
	var acceleratedJump = Phaser.Math.linearInterpolation( [ 0, this.mpx( -1 ) ], velocityFraction );

	var minJump = this.mpx( -1.5 );
	var maxJump = this.mpx( -4.5 );
	return Phaser.Math.linearInterpolation( [ minJump, maxJump ], jump ) + acceleratedJump;
};


Player.prototype.calculateMaxSpeed = function( sprint ) {

	var minSpeed = this.mpx( 2.5 );
	var maxSpeed = this.mpx( 5.5 );
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


Player.prototype.faceTeammate = function() {

	var teammate = this._gameElements.teammate;
	var facing = ( this.x > teammate.x ) ? Phaser.LEFT : Phaser.RIGHT;
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

	this.animations.play( 'jump' );
};


Player.prototype.pass = function() {

	if ( this.animations.currentAnim.name === 'pass' || !this.hasBall ) {
		return;
	}

	this.faceTeammate();

	this.body.acceleration.x = 0;

	var ball = this._gameElements.ball;
	var teammate = this._gameElements.teammate;
	var startX = this.x;
	var startY;
	var targetX = teammate.x;
	var targetY;

	var vertical = this.getStatData().vertical;
	var angle;

	/* WIP: calculate new targetX, targetY, and angle based on vertical value */
	/* Currently this is problematic because it needs to calculate the right angle of the projectile across the custom point */
	switch ( vertical ) {
		case Entity.Vertical.UP:

			var opponents = this._gameElements.opponents;
			var tallestOppnent = _.max( opponents, function( opponent ) {
				return opponent.height;
			} );

			if ( tallestOppnent && Utils.isWithin( this.x, teammate.x, tallestOppnent.x ) ) {

				startY = this.y - this.height;
				targetY = teammate.y - teammate.height;

				var minYToPass = tallestOppnent.y - tallestOppnent.height - this.mpx( 1 );
				var minPositionToPass = new Phaser.Point( tallestOppnent.x, minYToPass );
				var startPosition = new Phaser.Point( startX, startY );
				var targetPosition = new Phaser.Point( targetX, targetY );

				var peak = this.getPeakOfProjectile( startPosition, minPositionToPass, targetPosition );

				this.game.debug.pixel( startPosition.x + this.game.world.x, startPosition.y + this.game.world.y, '#ff4400', 10 );
				this.game.debug.pixel( minPositionToPass.x + this.game.world.x, minPositionToPass.y + this.game.world.y, '#ff4400', 10 );
				this.game.debug.pixel( peak.x + this.game.world.x, peak.y + this.game.world.y, '#00ff00', 10 );

				var rad = Phaser.Math.angleBetweenPoints( peak, startPosition );
				angle = Phaser.Math.radToDeg( rad );

				angle = ( angle > 90 ) ? 180 - angle : angle;
				angle = Math.max( 30, angle );

				console.log( angle );

			} else {

				startY = this.y - this.height / 2;
				targetY = teammate.y - teammate.height * ( 2 / 3 );
				angle = 30;
			}
			break;

		case Entity.Vertical.DOWN:
			startY = this.y - this.height / 2;
			targetY = teammate.y - teammate.height * ( 2 / 3 );
			angle = 10;
			break;
	}
	/* END WIP */

	Events.ballPassed.dispatch( ball, this, teammate, startX, startY, targetX, targetY, angle );

	this.animations.play( this.isInTheAir ? 'pass' : 'pass' );
};


Player.prototype.shoot = function() {

	if ( this.animations.currentAnim.name === 'shoot' || !this.hasBall ) {
		return;
	}

	var basket = this._gameElements.opponentBasket;
	var ball = this._gameElements.ball;
	var ballRadius = ball.width / 2;

	this.faceOpponentBasket();

	if ( !this.isInTheAir ) {

		this.body.acceleration.x = 0;
		this.body.velocity.x *= .25;

		var jumpVelocity = this.calculateJumpVelocity( this.config.jump, this.body.velocity.x );
		this.body.velocity.y = jumpVelocity;
	}

	var startX = this.x;
	var startY = this.y - this.height - ballRadius;
	var targetX = basket.x;
	var targetY = basket.y - basket.height / 2;

	Events.ballShot.dispatch( this, ball, startX, startY, targetX, targetY );

	this.animations.play( 'shoot' );
};


Player.prototype.dunk = function() {

	if ( this.isInTheAir || !this.hasBall ) {
		return;
	}

	this.isInTheAir = true;

	// WIP
	this.faceOpponentBasket();

	var basket = this._gameElements.opponentBasket;
	var direction = ( this.x > basket.x ) ? 1 : -1;
	var bodyOffsetX = Math.abs( this.width ) / 2 * direction;
	var bodyOffsetY = this.height;
	var finalPosition = new Phaser.Point( basket.x + bodyOffsetX, basket.y + bodyOffsetY );

	var distanceX = this.x - finalPosition.x;
	var halfDistance = distanceX / 2;
	var baseY = basket.y + this.height;
	var extraY = Phaser.Math.linearInterpolation( [ 0, this.mpx( 1 ) ], this.config.jump );
	var highestPosition = new Phaser.Point( finalPosition.x + halfDistance, baseY - extraY );

	var rad = Phaser.Math.angleBetweenPoints( highestPosition, this.position );

	var deg = Phaser.Math.radToDeg( rad );
	deg = ( deg > 90 ) ? 180 - deg : deg;

	var v = this.getInitialVelocity( this.position, finalPosition, deg );
	v = this.mpx( v );

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
	var canCollide = ball.exists;

	if ( !ball.isStat( Stat.NORMAL ) ) {
		canCollide = false;
	}

	if ( ball.isStat( Stat.PASSING ) ) {
		canCollide = true;
	}

	if ( this.isStat( Stat.PASSING ) ) {
		canCollide = false;
	}

	/* TEMP: disable player-ball collision detection if it's the opponent player */
	if ( _.contains( this._gameElements.opponents, ball._player ) ) {
		canCollide = false;
	}

	if ( canCollide && ball.overlap( this ) ) {

		Events.ballCaught.dispatch( this );
	}
};


Player.prototype.update = function() {

	Entity.prototype.update.call( this );

	this.isInTheAir = !this.game.physics.arcade.collide( this, this._gameElements.floor, this.onCollideWithFloor, null, this );
	this.immovable = this.isStat( Stat.DUNKING );

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

		case Stat.PASSING:
			this.pass();
			break;

		default:
			break;
	}
};


Player.prototype.onCollideWithFloor = function() {

	if ( !this.isInTheAir ) {
		return;
	}

	this.isInTheAir = false;

	if ( this.canRouteToStat( Stat.STANCE ) ) {

		this.setStat( Stat.STANCE );
	}
};


Player.prototype.onBallCaught = function( player ) {

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


Player.prototype.onBallLost = function( player ) {

	this.hasBall = false;

	// dispatch event
	var ownTeam = [ this, this._gameElements.teammate ];

	Events.strategyChanged.dispatch( ownTeam, Player.Strategy.COMPETE );
};


Player.prototype.onBallPassed = function( player ) {

	this.hasBall = false;
};


Player.prototype.onBallShot = function( player, x, y ) {

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


Player.prototype.onAnimationComplete = function( sprite, animation ) {

	if ( !this.isInTheAir ) {

		this.setStat( Stat.STANCE );
	}
};


Player.Strategy = {
	OFFENSE: 'OFFENSE', // trying to score while this player or his teamate owns the ball
	DEFENSE: 'DEFENSE', // preventing the opponents from scoring
	COMPETE: 'COMPETE' // competing for ball possession
};


Player.StatRouteCondition = {
	WHENEVER: 'WHENEVER',
	NEVER: 'NEVER',
	LAND: 'LAND',
	FRAME_ONLY: 'FRAME_ONLY',
	ANIMATION_COMPLETE: 'ANIMATION_COMPLETE'
};


Player.StatRoute = {
	STANCE: {
		STANCE: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		}
	},
	WALKING: {
		STANCE: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		}
	},
	JUMPING: {
		STANCE: {
			condition: Player.StatRouteCondition.LAND,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		}
	},
	DUNKING: {
		STANCE: {
			condition: Player.StatRouteCondition.LAND,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
	},
	SHOOTING: {
		STANCE: {
			condition: Player.StatRouteCondition.LAND,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.WHENEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		}
	},
	PASSING: {
		STANCE: {
			condition: Player.StatRouteCondition.ANIMATION_COMPLETE,
			frames: []
		},
		WALKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		JUMPING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		DUNKING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		SHOOTING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		},
		PASSING: {
			condition: Player.StatRouteCondition.NEVER,
			frames: []
		}
	}
};


module.exports = Player;