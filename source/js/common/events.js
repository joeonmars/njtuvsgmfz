var Events = {

	ballCaught: new Phaser.Signal(),
	ballShot: new Phaser.Signal(),
	ballDropped: new Phaser.Signal(),
	facingChanged: new Phaser.Signal(),
	strategyChanged: new Phaser.Signal()
}


module.exports = Events;