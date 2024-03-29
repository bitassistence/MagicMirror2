/* global SunCalc */

/* Magic Mirror
 * Module: Clock
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("clock", {
	// Module config defaults.
	defaults: {
		displayType: "digital", // options: digital, analog, both

		timeFormat: config.timeFormat,
		timezone: config.timezone,

		displaySeconds: true,
		showPeriod: config.period,
		showPeriodUpper: config.period,
		clockBold: false,
		showDate: true,
		showTime: true, // show digital with analog clock
		showWeek: false,
		dateFormat: "dddd, LL",

		/* specific to the analog clock */
		analogSize: "200px",
		analogFace: "simple", // options: 'none', 'simple', 'face-###' (where ### is 001 to 012 inclusive)
		analogPlacement: "bottom", // OBSOLETE, can be replaced with analogPlacement and showTime, options: false, 'top', or 'bottom'
		analogShowDate: "top", // options: false, 'top', or 'bottom'
		secondsColor: "#888888",

		showSunTimes: false,
		showMoonTimes: false,
        lat: config.latitude,
		lon: config.longitude,
	},
	// Define required scripts.
	getScripts: function () {
		return ["moment.js", "moment-timezone.js", "suncalc.js"];
	},
	// Define styles.
	getStyles: function () {
		return ["clock_styles.css"];
	},
	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Schedule update interval.
		var self = this;
		this.second = moment().second();
		this.minute = moment().minute();

		//Calculate how many ms should pass until next update depending on if seconds is displayed or not
		var delayCalculator = function (reducedSeconds) {
			var EXTRA_DELAY = 50; //Deliberate imperceptable delay to prevent off-by-one timekeeping errors

			if (self.config.displaySeconds) {
				return 1000 - moment().milliseconds() + EXTRA_DELAY;
			} else {
				return (60 - reducedSeconds) * 1000 - moment().milliseconds() + EXTRA_DELAY;
			}
		};

		//A recursive timeout function instead of interval to avoid drifting
		var notificationTimer = function () {
			self.updateDom();

			//If seconds is displayed CLOCK_SECOND-notification should be sent (but not when CLOCK_MINUTE-notification is sent)
			if (self.config.displaySeconds) {
				self.second = moment().second();
				if (self.second !== 0) {
					self.sendNotification("CLOCK_SECOND", self.second);
					setTimeout(notificationTimer, delayCalculator(0));
					return;
				}
			}

			//If minute changed or seconds isn't displayed send CLOCK_MINUTE-notification
			self.minute = moment().minute();
			self.sendNotification("CLOCK_MINUTE", self.minute);
			setTimeout(notificationTimer, delayCalculator(0));
		};

		//Set the initial timeout with the amount of seconds elapsed as reducedSeconds so it will trigger when the minute changes
		setTimeout(notificationTimer, delayCalculator(self.second));

		// Set locale.
		if (config.language == "ro") {
			moment.updateLocale(config.language, {
				months : [
					"Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie",
					"August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
				],
				weekdays : [
					"Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"
				]
			});
		} else moment.locale(config.language);
	},
	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.classList.add("clockGrid");

		/************************************
		 * Create wrappers for analog and digital clock
		 */
		const analogWrapper = document.createElement("div");
		analogWrapper.className = "clockCircle";
		const digitalWrapper = document.createElement("div");
		digitalWrapper.className = "digital";
		digitalWrapper.style.gridArea = "center";

		/************************************
		 * Create wrappers for DIGITAL clock
		 */

		var dateWrapper = document.createElement("div");
		var timeWrapper = document.createElement("div");
		var secondsWrapper = document.createElement("span");
		var periodWrapper = document.createElement("span");
		var sunWrapper = document.createElement("div");
		var moonWrapper = document.createElement("div");
		var weekWrapper = document.createElement("div");
		// Style Wrappers
		dateWrapper.className = "date normal medium";
		timeWrapper.className = "time bright xlarge light";
		secondsWrapper.className = "seconds dimmed";
		sunWrapper.className = "sun dimmed medium";
		moonWrapper.className = "moon dimmed medium";
		weekWrapper.className = "week dimmed midget";

		// Set content of wrappers.
		// The moment().format("h") method has a bug on the Raspberry Pi.
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var timeString;
		var now = moment();

		if (this.config.timezone) {
			now.tz(this.config.timezone);
		}

		var hourSymbol = "HH";
		if (this.config.timeFormat !== 24) {
			hourSymbol = "h";
		}

		if (this.config.clockBold === true) {
			timeString = now.format(hourSymbol + "[<span class=\"bold\">]mm[</span>]");
		} else {
			timeString = now.format(hourSymbol + ":mm");
		}

		if (this.config.showDate) {
			dateWrapper.innerHTML = now.format(this.config.dateFormat);
			digitalWrapper.appendChild(dateWrapper);
		}

		if (this.config.displayType !== "analog" && this.config.showTime) {
			timeWrapper.innerHTML = timeString;
			secondsWrapper.innerHTML = now.format(":ss");
			if (this.config.showPeriodUpper) {
				periodWrapper.innerHTML = now.format("A");
			} else {
				periodWrapper.innerHTML = now.format("a");
			}
			if (this.config.displaySeconds) {
				timeWrapper.appendChild(secondsWrapper);
			}
			if (this.config.showPeriod && this.config.timeFormat !== 24) {
				timeWrapper.appendChild(periodWrapper);
			}
			digitalWrapper.appendChild(timeWrapper);
		}

		/**
		 * Format the time according to the config
		 *
		 * @param {object} config The config of the module
		 * @param {object} time time to format
		 * @returns {string} The formatted time string
		 */
		function formatTime(config, time) {
			var formatString = hourSymbol + ":mm";
			if (config.showPeriod && config.timeFormat !== 24) {
				formatString += config.showPeriodUpper ? "A" : "a";
			}
			return moment(time).format(formatString);
		}

		/****************************************************************
		 * Create wrappers for Sun Times, only if specified in config
		 */
		if (this.config.showSunTimes) {
			var sunTimes = SunCalc.getTimes(now, this.config.lat, this.config.lon);
			var isVisible = now.isBetween(sunTimes.sunrise, sunTimes.sunset);
			var nextEvent;
			if (now.isBefore(sunTimes.sunrise)) {
				nextEvent = sunTimes.sunrise;
			} else if (now.isBefore(sunTimes.sunset)) {
				nextEvent = sunTimes.sunset;
			} else {
				var tomorrowSunTimes = SunCalc.getTimes(now.clone().add(1, "day"), this.config.lat, this.config.lon);
				nextEvent = tomorrowSunTimes.sunrise;
			}
			var untilNextEvent = moment.duration(moment(nextEvent).diff(now));
			var untilNextEventString = untilNextEvent.hours() + "h " + untilNextEvent.minutes() + "'";

			if (untilNextEvent.hours() === 0) {untilNextEventString = untilNextEvent.minutes() + " min";}
			if (untilNextEvent.hours() === 0 && untilNextEvent.minutes() === 0 && now.hours() > 12) {untilNextEventString = this.translate("Sunset");}
			if (untilNextEvent.hours() === 0 && untilNextEvent.minutes() === 0 && now.hours() < 12) {untilNextEventString = this.translate("Sunrise");}

			sunWrapper.innerHTML = "<span class=\"" + (isVisible ? "bright" : "dimmed") + "\"><i class=\"wi wi-day-sunny\"></i> " + untilNextEventString + "</span>" +
				"<span><i class=\"wi wi-sunrise\"></i> " + formatTime(this.config, sunTimes.sunrise) + "</span>" +
				"<span><i class=\"wi wi-sunset\"></i> " + formatTime(this.config, sunTimes.sunset) + "</span>";
			digitalWrapper.appendChild(sunWrapper);
		}

		/****************************************************************
		 * Create wrappers for Moon Times, only if specified in config
		 */
		if (this.config.showMoonTimes) {
			var moonIllumination = SunCalc.getMoonIllumination(now.toDate());
			var moonTimes = SunCalc.getMoonTimes(now, this.config.lat, this.config.lon);
//			var moonRise = moonTimes.rise;
//			var moonSet;
			if (moment(moonTimes.rise).isBefore(moonTimes.set)) {
				moonRise = moonTimes.rise;
			} else {
				var nextMoonTimes = SunCalc.getMoonTimes(now.clone().add(1, "day"), this.config.lat, this.config.lon);
				moonRise = nextMoonTimes.rise;
			}
			if (moment(moonTimes.set).isAfter(moonTimes.rise)) {
				moonSet = moonTimes.set;
			} else {
				var nextMoonTimes = SunCalc.getMoonTimes(now.clone().add(1, "day"), this.config.lat, this.config.lon);
				moonSet = nextMoonTimes.set;
			}
			var isVisible = now.isBetween(moonRise, moonSet) || moonTimes.alwaysUp === true;
			var illuminatedFractionString = Math.round(moonIllumination.fraction * 100) + "%";
			if (Math.round(moonIllumination.fraction * 100) === 100) {illuminatedFractionString = this.translate("Full Moon");}
			if (Math.round(moonIllumination.fraction * 100) === 0) {illuminatedFractionString = this.translate("New Moon");}
			moonWrapper.innerHTML = "<span class=brightness \"" + (isVisible ? "bright" : "dimmed") + "\"> <i class=\"wi wi-night-clear\"></i>&nbsp; " + illuminatedFractionString + "</span>" +
				"<span>&nbsp;<i class=\"wi wi-moonrise\"></i>&nbsp; " + (moonRise ? formatTime(this.config, moonRise) : this.translate("TOMORROW")) + "</span>" +
				"<span>&nbsp;<i class=\"wi wi-moonset\"></i>&nbsp; " + (moonSet ? formatTime(this.config, moonSet) : this.translate("TOMORROW")) + "</span>";
			digitalWrapper.appendChild(moonWrapper);
		}

		if (this.config.showWeek) {
			weekWrapper.innerHTML = this.translate("WEEK", { weekNumber: now.week() }) + ", " + this.translate("DAY", { dayNumber: now.dayOfYear() }) 
			+ ", " + now.format("z") + " " + config.language.toUpperCase() + ", " + config.location;
			digitalWrapper.appendChild(weekWrapper);
		}

		/****************************************************************
		 * Create wrappers for ANALOG clock, only if specified in config
		 */

		const clockCircle = document.createElement("div");

		if (this.config.displayType !== "digital") {
			// If it isn't 'digital', then an 'analog' clock was also requested

			// Calculate the degree offset for each hand of the clock
			if (this.config.timezone) {
				now.tz(this.config.timezone);
			}
			var second = now.seconds() * 6,
				minute = now.minute() * 6 + second / 60,
				hour = ((now.hours() % 12) / 12) * 360 + 90 + minute / 12;

			// Create wrappers
			analogWrapper.style.width = this.config.analogSize;
			analogWrapper.style.height = this.config.analogSize;

			if (this.config.analogFace !== "" && this.config.analogFace !== "simple" && this.config.analogFace !== "none") {
				analogWrapper.style.background = "url(" + this.data.path + "faces/" + this.config.analogFace + ".svg)";
				analogWrapper.style.backgroundSize = "100%";

				// The following line solves issue: https://github.com/MichMich/MagicMirror/issues/611
				// analogWrapper.style.border = "1px solid black";
				analogWrapper.style.border = "rgba(0, 0, 0, 0)"; //Updated fix for Issue 611 where non-black backgrounds are used
			} else if (this.config.analogFace !== "none") {
				analogWrapper.style.border = "0";
			}
			const clockFace = document.createElement("div");
			clockFace.className = "clockFace";

			const clockHour = document.createElement("div");
			clockHour.id = "clockHour";
			clockHour.style.transform = "rotate(" + hour + "deg)";
			clockHour.className = "clockHour";
			const clockMinute = document.createElement("div");
			clockMinute.id = "clockMinute";
			clockMinute.style.transform = "rotate(" + minute + "deg)";
			clockMinute.className = "clockMinute";

			// Combine analog wrappers
			clockFace.appendChild(clockHour);
			clockFace.appendChild(clockMinute);

			if (this.config.displaySeconds) {
				const clockSecond = document.createElement("div");
				clockSecond.id = "clockSecond";
				clockSecond.style.transform = "rotate(" + second + "deg)";
				clockSecond.className = "clockSecond";
				clockSecond.style.backgroundColor = this.config.secondsColor;
				clockFace.appendChild(clockSecond);
			}
			analogWrapper.appendChild(clockFace);
		}

		/*******************************************
		 * Update placement, respect old analogShowDate even if its not needed anymore
		 */
		if (this.config.displayType === "analog") {
			// Display only an analog clock
			if (this.config.analogShowDate === "top") {
				wrapper.classList.add("clockGrid--bottom");
			} else if (this.config.analogShowDate === "bottom") {
				wrapper.classList.add("clockGrid--top");
			} else {
				//analogWrapper.style.gridArea = "center";
			}
		} else if (this.config.displayType === "both") {
			wrapper.classList.add("clockGrid--" + this.config.analogPlacement);
		}

		wrapper.appendChild(analogWrapper);
		wrapper.appendChild(digitalWrapper);

		// Return the wrapper to the dom.
		return wrapper;
	}
});