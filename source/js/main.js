// global requires
window.$ = window.jQuery = require( 'jquery' );
window._ = require( 'underscore' );
window.soy = require( 'libs/soyutils' );
window.p2 = require( 'libs/p2' );
window.PIXI = require( 'libs/pixi' );
window.Phaser = require( 'libs/phaser' );
require( 'libs/gsap/TweenMax' );
require( 'libs/gsap/plugins/ScrollToPlugin' );
require( 'libs/gsap/plugins/ThrowPropsPlugin' );

var MobileDetect = require( 'mobile-detect' );
var mobileDetect = new MobileDetect( window.navigator.userAgent );
window.isMobile = mobileDetect.mobile();

var soy = require( 'libs/soyutils' );
var template = require( 'views/main.soy' );
var Boot = require( 'states/boot' );

$( document ).ready( init );

function init() {

	var frag = soy.renderAsFragment( template.Main );
	$( document.body ).append( frag );

	//var screenRatio = screen.width / screen.height;
	//var resWidth = Math.min( screen.width, 1280 );

	var resolution = {
		width: 1024, //resWidth,
		height: 768 //Math.round( resWidth / screenRatio )
	};

	this.game = new Phaser.Game( {
		width: resolution.width,
		height: resolution.height,
		parent: 'game-container',
		state: Boot
	} );
}