var inherits = require( 'inherits' );
var Events = require( 'common/events' );


var CameraTracker = function( game, x, y ) {

	Phaser.Image.call( this, game, x, y );

	this._camera = game.camera;
	this._object = null;

	this._minEase = 0;
	this._maxEase = 1;
	this._ease = this._maxEase;

	Events.ballCaught.add( this.onCaught, this );
	Events.ballShot.add( this.onShot, this );
};
inherits( CameraTracker, Phaser.Image );


CameraTracker.prototype.follow = function( displayObject ) {

	this._camera.follow( this );

	if ( this._object !== displayObject ) {

		this._object = displayObject;

		TweenMax.fromTo( this, 5, {
			_ease: this._minEase
		}, {
			_ease: this._maxEase,
			ease: Linear.easeNone
		} );
	}
}


CameraTracker.prototype.unfollow = function() {

	this._camera.unfollow();
}


CameraTracker.prototype.update = function() {

	if ( this._object ) {

		this.x += ( this._object.x - this.x ) * this._ease;
		this.y += ( this._object.y - this.y ) * this._ease;
	}
}


CameraTracker.prototype.onCaught = function( player ) {

	this.follow( player );
}


CameraTracker.prototype.onShot = function( ball ) {

	this.follow( ball );
}


module.exports = CameraTracker;