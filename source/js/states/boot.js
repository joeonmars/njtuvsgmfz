var inherits = require( 'inherits' );
var PlaygroundState = require( 'states/playground' );


var Boot = function() {


};
inherits( Boot, Phaser.State );


Boot.prototype.init = function() {

	this.stage.backgroundColor = '#333';

	this.physics.startSystem( Phaser.Physics.ARCADE );
	this.physics.startSystem( Phaser.Physics.P2JS );

	// A high school basketball court is 26m
	// equivalent in pixels: 5200px
	var pxPerMeter = 182;

	this.physics.p2.mpx = function( v ) {
		return v * pxPerMeter;
	}

	this.physics.p2.pxm = function( v ) {
		return v * ( 1 / pxPerMeter );
	}

	this.physics.p2.mpxi = function( v ) {
		return v * -pxPerMeter;
	}

	this.physics.p2.pxmi = function( v ) {
		return v * -( 1 / pxPerMeter );
	}

	//
	this.game.scale.pageAlignVertically = true;
	this.game.scale.pageAlignHorizontally = true;
	this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.game.scale.setShowAll();
	this.game.scale.refresh();

	//
	this.state.add( 'Playground', PlaygroundState );
	this.state.start( 'Playground', true );
};


module.exports = Boot;