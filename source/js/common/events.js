var Events = {

	ballCaught: new Phaser.Signal(),
	ballShot: new Phaser.Signal(),
	ballPassed: new Phaser.Signal(),
	ballDropped: new Phaser.Signal(),

	facingChanged: new Phaser.Signal(),
	strategyChanged: new Phaser.Signal(),

	playerScored: new Phaser.Signal(),
	playerRebound: new Phaser.Signal(),
	playerPassed: new Phaser.Signal(),
	playerAssisted: new Phaser.Signal(),
	playerStole: new Phaser.Signal(),
	playerBlocked: new Phaser.Signal()
}


module.exports = Events;