var Events = require( 'common/events' );


var Statistics = function() {

	this._records = {};

	Events.playerScored.add( this.onPlayerScored, this );
	Events.playerRebound.add( this.onPlayerRebound, this );
	Events.playerAssisted.add( this.onPlayerAssisted, this );
	Events.playerStole.add( this.onPlayerStole, this );
	Events.playerBlocked.add( this.onPlayerBlocked, this );
};


Statistics.prototype.destroy = function() {

	this._records = null;

	Events.playerScored.remove( this.onPlayerScored, this );
	Events.playerRebound.remove( this.onPlayerRebound, this );
	Events.playerAssisted.remove( this.onPlayerAssisted, this );
	Events.playerStole.remove( this.onPlayerStole, this );
	Events.playerBlocked.remove( this.onPlayerBlocked, this );
};


Statistics.prototype.getRecords = function( playerId ) {

	return this._records[ playerId ];
};


Statistics.prototype.recordStart = function() {

	_.each( arguments, function( player ) {

		this._records[ player.id ] = this._records[ player.id ] || {
			points: 0,
			rebounds: 0,
			assists: 0,
			steals: 0,
			blocks: 0,
			recording: true
		};

	}, this );
};


Statistics.prototype.recordStop = function() {

	_.each( arguments, function( player ) {

		var playerRecords = this._records[ player.id ];
		playerRecords.recording = false;

	}, this );
};


Statistics.prototype.isRecording = function( player ) {

	var records = this._records[ player.id ];
	return ( records && records.recording );
};


Statistics.prototype.onPlayerScored = function( player, points ) {

	if ( !this.isRecording( player ) ) {
		return;
	}
};


Statistics.prototype.onPlayerRebound = function( player ) {

	if ( !this.isRecording( player ) ) {
		return;
	}
};


Statistics.prototype.onPlayerAssisted = function( playerA, playerB ) {

	if ( !this.isRecording( playerA ) ) {
		return;
	}
};


Statistics.prototype.onPlayerStole = function( playerA, playerB ) {

	if ( !this.isRecording( playerA ) ) {
		return;
	}
};


Statistics.prototype.onPlayerBlocked = function( playerA, playerB ) {

	if ( !this.isRecording( playerA ) ) {
		return;
	}
};


module.exports = Statistics;