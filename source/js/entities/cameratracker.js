var inherits = require( 'inherits' );
var Events = require( 'common/events' );


var CameraTracker = function( game, x, y ) {

	Phaser.Image.call( this, game, x, y );

	this._camera = game.camera;
	this._object = null;

	this._minEase = 0;
	this._maxEase = 1;
	this._ease = this._maxEase;

	this._offsetX = 0;
	this._offsetY = 0;

	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
	Events.facingChanged.add( this.onFacingChanged, this );
};
inherits( CameraTracker, Phaser.Image );


CameraTracker.prototype.follow = function( displayObject ) {

	this._camera.follow( this );

	if ( this._object !== displayObject ) {

		this._object = displayObject;

		this.updateOffsets();

		var easingDuration = ( this._object.entityType === 'player' ) ? 10 : 5;
		this.restartEasing( easingDuration );
	}
}


CameraTracker.prototype.unfollow = function() {

	this._camera.unfollow();
}


CameraTracker.prototype.restartEasing = function( duration ) {

	TweenMax.fromTo( this, duration, {
		_ease: this._minEase
	}, {
		_ease: this._maxEase,
		ease: Linear.easeNone
	} );
}


CameraTracker.prototype.updateOffsets = function() {

	if ( this._object.entityType === 'ball' ) {

		this._offsetX = 0;
		this._offsetY = 0;

	} else if ( this._object.entityType === 'player' ) {

		var direction = ( this._object.facing === Phaser.LEFT ) ? -1 : 1;
		this._offsetX = Math.round( this.game.width / 5 ) * direction;
		this._offsetY = 0;
	}
}


CameraTracker.prototype.update = function() {

	if ( this._object ) {

		// limit the focus not to exceed half screen size
		var gameHalfW = this.game.width / 2;
		var clampedFocusX = Phaser.Math.clamp( this._object.x + this._offsetX,
			gameHalfW, this.game.world.width - gameHalfW );

		//this.game.debug.pixel( clampedFocusX + this.game.world.x, 400, '#ff4400', 10 );

		var offsetX = clampedFocusX - this._object.x;
		var offsetY = this._offsetY;

		this.x += ( this._object.x - this.x + offsetX ) * this._ease;
		this.y += ( this._object.y - this.y + offsetY ) * this._ease;
	}
}


CameraTracker.prototype.onCaught = function( player ) {

	this.follow( player );
}


CameraTracker.prototype.onShot = function( ball ) {

	this.follow( ball );
}


CameraTracker.prototype.onFacingChanged = function( player, facing ) {

	this.updateOffsets();
	this.restartEasing( 10 );
}


module.exports = CameraTracker;