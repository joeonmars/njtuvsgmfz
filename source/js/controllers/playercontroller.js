var Utils = require( 'app/utils' );
var Events = require( 'common/events' );
var Entity = require( 'entities/entity' );
var Stat = Entity.Stat;

var _instance;


var PlayerController = function( input ) {

	this.input = input;

	this._player1 = null;
	this._player2 = null;
	this._player = null;

	this._keyMappings = {
		'LEFT': {
			hold: this.onHoldLeft,
			down: this.onPressLeft,
			up: this.onReleaseLeft
		},
		'RIGHT': {
			hold: this.onHoldRight,
			down: this.onPressRight,
			up: this.onReleaseRight
		},
		'UP': {
			hold: this.onHoldUp,
			down: this.onPressUp,
			up: this.onReleaseUp
		},
		'DOWN': {
			hold: this.onHoldDown,
			down: this.onPressDown,
			up: this.onReleaseDown
		},
		'A': {
			hold: this.onHoldA,
			down: this.onPressA,
			up: this.onReleaseA
		},
		'S': {
			hold: this.onHoldS,
			down: this.onPressS,
			up: this.onReleaseS
		},
		'D': {
			hold: this.onHoldD,
			down: this.onPressD,
			up: this.onReleaseD
		}
	};

	this._keys = [];

	this._hDirection = null;

	this._holdingDirection = {};
	this._holdingDirection[ Phaser.LEFT ] = false;
	this._holdingDirection[ Phaser.RIGHT ] = false;
	this._holdingDirection[ Phaser.UP ] = false;
	this._holdingDirection[ Phaser.DOWN ] = false;

	Events.ballCaught.add( this.onBallCaught, this );
	Events.ballPassed.add( this.onBallPassed, this );
};


PlayerController.prototype.assignPlayers = function() {

	this._player1 = arguments[ 0 ];
	this._player2 = arguments[ 1 ];
	this.setPlayer( this._player1 );
};


PlayerController.prototype.setPlayer = function( player ) {

	this._player = player;

	this.enableKeys();
};


PlayerController.prototype.unsetPlayer = function() {

	if ( this._player ) {

		this._player.setStat( Stat.STANCE );
		this._player = null;

		this.disableKeys();
	}
};


PlayerController.prototype.disableKeys = function() {

	if ( this._keys.length == 0 ) {
		return;
	}

	_.each( this._keys, function( key ) {
		key.reset( true );
		this.input.keyboard.removeKey( key.keyCode );
	}, this );

	this._keys = [];

	this._hDirection = null;
	this._holdingDirection[ Phaser.LEFT ] = false;
	this._holdingDirection[ Phaser.RIGHT ] = false;
	this._holdingDirection[ Phaser.UP ] = false;
	this._holdingDirection[ Phaser.DOWN ] = false;
};


PlayerController.prototype.enableKeys = function() {

	if ( this._keys.length > 0 ) {
		return;
	}

	this._keys = _.map( this._keyMappings, function( handlers, keyCode ) {

		var key = this.input.keyboard.addKey( Phaser.Keyboard[ keyCode ] );

		if ( handlers.hold ) {
			key.onHoldCallback = handlers.hold;
			key.onHoldContext = this;
		}

		if ( handlers.down ) {
			key.onDown.add( handlers.down, this );
		}

		if ( handlers.up ) {
			key.onUp.add( handlers.up, this );
		}

		return key;
	}, this );
};


PlayerController.prototype.onBallCaught = function( player ) {

	if ( player !== this._player1 && player !== this._player2 ) {
		return;
	}

	this.unsetPlayer();
	this.setPlayer( player );
};


PlayerController.prototype.onBallPassed = function( ball, playerA, playerB ) {

	if ( playerB === this._player1 || playerB === this._player2 ) {

		this.unsetPlayer();
		this.setPlayer( playerB );
	}
};


/**
 * Keyboard LEFT
 */
PlayerController.prototype.onPressLeft = function() {

	//console.log( 'down left' );

	if ( this._player.isInTheAir ) {
		return;
	}

	this._hDirection = Phaser.LEFT;
};


PlayerController.prototype.onReleaseLeft = function() {

	//console.log( 'up left' );

	this._holdingDirection[ Phaser.LEFT ] = false;

	if ( this._player.isInTheAir ) {
		return;
	}

	if ( this._holdingDirection[ Phaser.RIGHT ] ) {

		this._player.face( Phaser.RIGHT );
		this._hDirection = Phaser.RIGHT;

	} else if ( this._hDirection === Phaser.LEFT ) {

		this._hDirection = null;
		this._player.setStat( Stat.STANCE );
	}
};


PlayerController.prototype.onHoldLeft = function() {

	//console.log( 'hold left' );

	this._holdingDirection[ Phaser.LEFT ] = true;

	if ( this._player.isInTheAir ) {
		return;
	}

	if ( this._hDirection === Phaser.LEFT ) {

		this._player.face( Phaser.LEFT );
		this._player.setStat( Stat.WALKING );
	}
};


/**
 * Keyboard RIGHT
 */
PlayerController.prototype.onPressRight = function() {

	//console.log( 'down right' );

	if ( this._player.isInTheAir ) {
		return;
	}

	this._hDirection = Phaser.RIGHT;
};


PlayerController.prototype.onReleaseRight = function() {

	//console.log( 'up right' );

	this._holdingDirection[ Phaser.RIGHT ] = false;

	if ( this._player.isInTheAir ) {
		return;
	}

	if ( this._holdingDirection[ Phaser.LEFT ] ) {

		this._player.face( Phaser.LEFT );
		this._hDirection = Phaser.LEFT;

	} else if ( this._hDirection === Phaser.RIGHT ) {

		this._hDirection = null;
		this._player.setStat( Stat.STANCE );
	}
};


PlayerController.prototype.onHoldRight = function() {

	//console.log( 'hold right' );

	this._holdingDirection[ Phaser.RIGHT ] = true;

	if ( this._player.isInTheAir ) {
		return;
	}

	if ( this._hDirection === Phaser.RIGHT ) {

		this._player.face( Phaser.RIGHT );
		this._player.setStat( Stat.WALKING );
	}
};


/**
 * Keyboard UP
 */
PlayerController.prototype.onPressUp = function() {

};


PlayerController.prototype.onReleaseUp = function() {

	this._holdingDirection[ Phaser.UP ] = false;
};


PlayerController.prototype.onHoldUp = function() {

	this._holdingDirection[ Phaser.UP ] = true;
};


/**
 * Keyboard Down
 */
PlayerController.prototype.onPressDown = function() {

};


PlayerController.prototype.onReleaseDown = function() {

	this._holdingDirection[ Phaser.DOWN ] = false;
};


PlayerController.prototype.onHoldDown = function() {

	this._holdingDirection[ Phaser.DOWN ] = true;
};


/**
 * Keyboard A
 * Offensing: quick jump shot (not accelerating and far from basket), slam dunk (accelerating and close to basket)
 * Defensing: jump (block & rebound)
 */
PlayerController.prototype.onPressA = function() {

	//console.log( 'down A' );

	if ( this._player.isStat( Stat.WALKING ) ) {

		if ( this._player.hasBall && !this.isInTheAir && this._player.canDunk ) {
			this._player.setStat( Stat.DUNKING );
			return;
		}
	}

	if ( !this._player.isInTheAir ) {

		this._player.setStat( Stat.JUMPING );
	}
};


PlayerController.prototype.onReleaseA = function() {

	//console.log( 'up A' );
};


PlayerController.prototype.onHoldA = function() {

	//console.log( 'hold A' );
};


/**
 * Keyboard S
 * Offensing: pass ball, combined with up/down keys to make overhead/bounce pass
 * Defensing: switch between defensing players
 * overhead pass reference: https://www.youtube.com/watch?v=F8ssExT5UKQ
 * bounce pass reference: https://www.youtube.com/watch?v=ZSmDwt8iQtg
 */
PlayerController.prototype.onPressS = function() {

	//console.log( 'down S' );

	if ( this._player.hasBall ) {

		var _vertical = Entity.Vertical.UP;

		if ( this._holdingDirection[ Phaser.DOWN ] ) {

			_vertical = Entity.Vertical.DOWN;
		}

		this._player.setStat( Stat.PASSING, {
			vertical: _vertical
		} );

	} else {

		var anotherPlayer = ( this._player === this._player1 ) ? this._player2 : this._player1;

		if ( anotherPlayer ) {

			this.unsetPlayer( this._player );
			this.setPlayer( anotherPlayer );
		}
	}
};


PlayerController.prototype.onReleaseS = function() {

	//console.log( 'up S' );
};


PlayerController.prototype.onHoldS = function() {

	//console.log( 'hold S' );
};


/**
 * Keyboard D
 * Offensing: shoot, tap to pump fake, jump shoot when accelerating
 * Defensing: steal ball, pressed continuously to shove opponents
 */
PlayerController.prototype.onPressD = function() {

	//console.log( 'down D' );

	if ( this._player.hasBall ) {
		this._player.setStat( Stat.SHOOTING );
	}
};


PlayerController.prototype.onReleaseD = function() {

	//console.log( 'up D' );
};


PlayerController.prototype.onHoldD = function() {

	//console.log( 'hold D' );
};


module.exports = PlayerController;