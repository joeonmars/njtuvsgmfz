var Events = require( 'common/events' );


var Regulation = function() {

	this._checkScoring = false;
	this._checkOutOfBounds = false;
	this._checkShotClock = false;
	this._checkGoaltending = false;

	this._isMatch = false;

	Events.basketMade.add( this.onBasketMade, this );
};


Regulation.prototype.destroy = function() {

};


/**
 * Enables regulations of the game with custom rules, or all rules.
 * @param {...string} opt_rules - A rule string.
 */
Regulation.prototype.enable = function( opt_rules ) {

	var rules = arguments.length ? arguments : _.values( Regulation.Rules );

	this.setRulesEnabled( rules, true );
};


/**
 * Disables regulations of the game with custom rules, or all rules.
 * @param {...string} opt_rules - A rule string.
 */
Regulation.prototype.disable = function( opt_rules ) {

	var rules = arguments.length ? arguments : _.values( Regulation.Rules );

	this.setRulesEnabled( rules, false );
};


Regulation.prototype.setRulesEnabled = function( rules, enabled ) {

	if ( _.contains( rules, Regulation.Rules.SCORING ) ) {
		this._checkScoring = enabled;
	}

	if ( _.contains( rules, Regulation.Rules.OUT_OF_BOUNDS ) ) {
		this._checkOutOfBounds = enabled;
	}

	if ( _.contains( rules, Regulation.Rules.SHOT_CLOCK ) ) {
		this._checkShotClock = enabled;
	}

	if ( _.contains( rules, Regulation.Rules.GOALTENDING ) ) {
		this._checkGoaltending = enabled;
	}

	if ( _.contains( rules, Regulation.Rules.TWO_QUARTERS ) ) {
		this._isMatch = enabled;
	}

	if ( _.contains( rules, Regulation.Rules.FOUR_QUARTERS ) ) {
		this._isMatch = enabled;
	}
};


Regulation.prototype.update = function() {

};


Regulation.prototype.onBasketMade = function( player ) {

	if ( !this._checkScoring ) {
		return;
	}

	console.log( player.id + ' scored!' );
};


Regulation.Rules = {
	SCORING: 'SCORING',
	OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',
	SHOT_CLOCK: 'SHOT_CLOCK',
	GOALTENDING: 'GOALTENDING',
	TWO_QUARTERS: 'TWO_QUARTERS',
	FOUR_QUARTERS: 'FOUR_QUARTERS'
};


module.exports = Regulation;