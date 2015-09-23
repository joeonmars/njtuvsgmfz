var Utils = require( 'app/utils' );
var Player = require( 'entities/player' );

var _instance;


var PlayerController = function( input ) {

	this.input = input;

	this._player = null;

	this._keyMappings = {
		'LEFT': {
			hold: this.onHoldLeft,
			down: this.onDownLeft,
			up: this.onUpLeft
		},
		'RIGHT': {
			hold: this.onHoldRight,
			down: this.onDownRight,
			up: this.onUpRight
		},
		'A': {
			hold: this.onHoldA,
			down: this.onDownA,
			up: this.onUpA
		},
		'S': {
			hold: this.onHoldS,
			down: this.onDownS,
			up: this.onUpS
		},
		'D': {
			hold: this.onHoldD,
			down: this.onDownD,
			up: this.onUpD
		}
	};

	this._keys = [];

	this._currentDirection = null;

	this._holdingDirection = {};
	this._holdingDirection[ Phaser.LEFT ] = false;
	this._holdingDirection[ Phaser.RIGHT ] = false;
};


PlayerController.prototype.setPlayer = function( player ) {

	this._player = player;

	this.enableKeys();
};


PlayerController.prototype.unsetPlayer = function() {

	this._player = null;

	this.disableKeys();
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

/**
 * Keyboard LEFT
 */
PlayerController.prototype.onDownLeft = function() {

	//console.log( 'down left' );

	this._player.face( Phaser.LEFT );
	this._currentDirection = Phaser.LEFT;
};


PlayerController.prototype.onUpLeft = function() {

	//console.log( 'up left' );

	this._holdingDirection[ Phaser.LEFT ] = false;

	if ( this._holdingDirection[ Phaser.RIGHT ] ) {

		this._player.face( Phaser.RIGHT );
		this._currentDirection = Phaser.RIGHT;

	} else if ( this._currentDirection === Phaser.LEFT ) {

		this._currentDirection = null;
		this._player.setState( Player.State.STANCE );
	}
};


PlayerController.prototype.onHoldLeft = function() {

	//console.log( 'hold left' );

	this._holdingDirection[ Phaser.LEFT ] = true;

	if ( this._currentDirection === Phaser.LEFT ) {

		this._player.setState( Player.State.WALKING );
	}
};


/**
 * Keyboard RIGHT
 */
PlayerController.prototype.onDownRight = function() {

	//console.log( 'down right' );

	this._player.face( Phaser.RIGHT );

	this._currentDirection = Phaser.RIGHT;
};


PlayerController.prototype.onUpRight = function() {

	//console.log( 'up right' );

	this._holdingDirection[ Phaser.RIGHT ] = false;

	if ( this._holdingDirection[ Phaser.LEFT ] ) {

		this._player.face( Phaser.LEFT );
		this._currentDirection = Phaser.LEFT;

	} else if ( this._currentDirection === Phaser.RIGHT ) {

		this._currentDirection = null;
		this._player.setState( Player.State.STANCE );
	}
};


PlayerController.prototype.onHoldRight = function() {

	//console.log( 'hold right' );

	this._holdingDirection[ Phaser.RIGHT ] = true;

	if ( this._currentDirection === Phaser.RIGHT ) {

		this._player.setState( Player.State.WALKING );
	}
};


/**
 * Keyboard A
 * Offensing: quick jump shot
 * Defensing: jump (block & rebound)
 */
PlayerController.prototype.onDownA = function() {

	//console.log( 'down A' );

	this._player.setState( Player.State.JUMPING );
};


PlayerController.prototype.onUpA = function() {

	//console.log( 'up A' );
};


PlayerController.prototype.onHoldA = function() {

	//console.log( 'hold A' );
};


/**
 * Keyboard S
 * Offensing: pass ball, used in combination with arrow keys
 * Defensing: switch between defensing players
 */
PlayerController.prototype.onDownS = function() {

	//console.log( 'down S' );
};


PlayerController.prototype.onUpS = function() {

	//console.log( 'up S' );
};


PlayerController.prototype.onHoldS = function() {

	//console.log( 'hold S' );
};


/**
 * Keyboard D
 * Offensing: shoot, tap to pump fake
 * Defensing: steal ball, pressed continuously to shove opponents
 */
PlayerController.prototype.onDownD = function() {

	//console.log( 'down D' );

	if ( this._player.hasBall ) {
		this._player.setState( Player.State.SHOOTING );
	}
};


PlayerController.prototype.onUpD = function() {

	//console.log( 'up D' );
};


PlayerController.prototype.onHoldD = function() {

	//console.log( 'hold D' );
};


module.exports = PlayerController;