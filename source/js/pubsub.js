var Utils = require( 'app/utils' );
var Signal = require( 'signals' );

var _instance;


var PubSub = function() {

	this.routed = new Signal();
	this.loaded = new Signal();

	this.logoRendered = new Signal();
	this.logoRendered.memorize = true;
};


module.exports = Utils.createSingletonNow( _instance, PubSub );