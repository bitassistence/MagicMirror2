/* Magic Mirror
 *
 * MIT Licensed.
 *
 * Redesigned by Răzvan Cristea
 * for iPad 3 & HD display
 * https://github.com/hangorazvan
 */
Module.register("lifecounter", {

	defaults: {
		decimalSymbol: config.decimal,
	},

	getScripts: function () {
		return ["moment.js"];
	},
	
	start: function () {
		Log.info("Starting module: " + this.name);
		var self = this;
		setInterval(function() {
		//	self.updateDom();
		}, 1000);
	},

	notificationReceived: function (notification, payload, sender) {
		if (notification === "CLOCK_SECOND") {
			this.updateDom();
		}
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		var yourtime = moment.utc().diff(this.config.birthday, this.config.counter);
		var lifecounter = this.config.before + " " + Math.abs(yourtime) + " " + this.config.after;

		if (this.config.counter == "seconds") {
			if (yourtime > 999395200 && yourtime < 1000086400) { // one week before and one day after
				wrapper.className = "bright " + this.config.cssclass;
			} else {
				wrapper.className = "normal " + this.config.cssclass;
			}
		}

		if (this.config.counter == "minutes") {
			if (yourtime > 60) {
				wrapper.className = "bright " + this.config.cssclass;
			} else {
				wrapper.className = "normal " + this.config.cssclass;
			}
		}

		if (this.config.counter == "hours") {
			if (yourtime > 24) {
				wrapper.className = "bright " + this.config.cssclass;
			} else {
				wrapper.className = "normal " + this.config.cssclass;
			}
		}

		if (this.config.counter == "days") {
			if (yourtime > 7) {
				wrapper.className = "bright " + this.config.cssclass;
			} else {
				wrapper.className = "normal " + this.config.cssclass;
			}
		}

		if (this.config.decimalSymbol == ".") {
			wrapper.innerHTML = lifecounter.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} else {
			wrapper.innerHTML = lifecounter.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		}
		
		return wrapper;
	}
});