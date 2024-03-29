/* global WeatherProvider */

/* Magic Mirror
 * Module: Weather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
"use strict";

Module.register("weather", {
    // Default module config.
    defaults: {
        weatherProvider: "openweathermap",
        roundTemp: false,
        type: "current", // current, forecast, daily (equivalent to forecast), hourly (only with OpenWeatherMap /onecall endpoint)
        units: config.units,
        useKmh: true,
        tempUnits: config.units,
        windUnits: config.units,
        updateInterval: 10 * 60 * 1000, // every 10 minutes
        animationSpeed: config.animation,
        timeFormat: config.timeFormat,
        showPeriod: config.period,
        showPeriodUpper: config.period,
        showWindDirection: true,
        showWindDirectionAsArrow: true,
        useBeaufort: false,
        lang: config.language,
        showSun: false,
        degreeLabel: true,
        decimalSymbol: config.decimal,
        showIndoorTemperature: false,
        showIndoorHumidity: false,
        maxNumberOfDays: 5,
        maxEntries: 5,
        ignoreToday: false,
        fade: false,
        fadePoint: 0.25, // Start on 1/4th of the list.
        initialLoadDelay: 0, // 0 seconds delay
        appendLocationNameToHeader: false,
        location: config.location,
        calendarClass: "calendar",
        tableClass: "small",
        onlyTemp: false,
        showPrecipitationAmount: true,
        colored: true,
        showHumidity: true,
        showFeelsLike: true,
        showDewPoint: true,
        showUVindex: true,
        showPressure: true,
        showVisibility: true,
        showDescription: true,
        extra: false,
        showAlerts: false,
        absoluteDates: false
    },

    // Module properties.
    weatherProvider: null,

    // Can be used by the provider to display location of event if nothing else is specified
    firstEvent: null,

    // Define required scripts.
    getStyles: function () {
        return ["weather.css", "font-awesome.css", "weather-icons.css"];
    },
    // Return the scripts that are necessary for the weather module.
    getScripts: function () {
        return ["moment.js", "weatherprovider.js", "weatherobject.js", "suncalc.js", this.file("providers/" + this.config.weatherProvider.toLowerCase() + ".js")];
    },
    // Override getHeader method.
    getHeader: function () {
        if (this.config.appendLocationNameToHeader && this.weatherProvider) {
            if (this.data.header)
                return this.data.header + " " + config.location; //this.weatherProvider.fetchedLocation();
            else
                return config.location; //this.weatherProvider.fetchedLocation();
        }
        return this.data.header ? this.data.header : "";
    },
    start: function () {
        moment.locale(this.config.lang);
        // Initialize the weather provider.
        this.weatherProvider = WeatherProvider.initialize(this.config.weatherProvider, this);
        // Let the weather provider know we are starting.
        this.weatherProvider.start();
        // Add custom filters
        this.addFilters();
        // Schedule the first update.
        this.scheduleUpdate(this.config.initialLoadDelay);
    },
    // Override notification handler.
    notificationReceived: function (notification, payload, sender) {
        if (notification === "CALENDAR_EVENTS") {
            var senderClasses = sender.data.classes.toLowerCase().split(" ");
            if (senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1) {
                this.firstEvent = null;
                for (var _i = 0; _i < payload.length; _i++) {
                    var event = payload[_i];
                    if (event.location || event.geo) {
                        this.firstEvent = event;
                        Log.debug("First upcoming event with location: ", event);
                        break;
                    }
                }
            }
        }
        else if (notification === "INDOOR_TEMPERATURE") {
            this.indoorTemperature = this.roundValue(payload);
            this.updateDom(300);
        }
        else if (notification === "INDOOR_HUMIDITY") {
            this.indoorHumidity = this.roundValue(payload);
            this.updateDom(300);
        }
    },
    // Select the template depending on the display type.
    getTemplate: function () {
        switch (this.config.type.toLowerCase()) {
            case "current":
                return "current.njk";
            case "hourly":
                return "hourly.njk";
            case "daily":
            case "forecast":
                return "forecast.njk";
            //Make the invalid values use the "Loading..." from forecast
            default:
                return "forecast.njk";
        }
    },
    // Add all the data to the template.
    getTemplateData: function () {
        var forecast = this.weatherProvider.weatherForecast()

        return {
            config: this.config,
            current: this.weatherProvider.currentWeather(),
            forecast: forecast,
            hourly: this.weatherProvider.weatherHourly(),
            indoor: {
                humidity: this.indoorHumidity,
                temperature: this.indoorTemperature
            }
        };
    },
    // What to do when the weather provider has new information available?
    updateAvailable: function () {
        //Log.log("New weather information available.");
        this.updateDom(0);
        this.scheduleUpdate();
        if (this.weatherProvider.currentWeather()) {
            this.sendNotification("CURRENTWEATHER_TYPE", { type: this.weatherProvider.currentWeather().weatherType.replace("-", "_") });
        }
    },
    scheduleUpdate: function (delay) {
        var self = this;
        if (delay === void 0) { delay = null; }
        var nextLoad = this.config.updateInterval;
        if (delay !== null && delay >= 0) {
            nextLoad = delay;
        }
        setTimeout(function () {
            switch (self.config.type.toLowerCase()) {
                case "current":
                    self.weatherProvider.fetchCurrentWeather();
                    break;
                case "hourly":
                    self.weatherProvider.fetchWeatherHourly();
                    break;
                case "daily":
                case "forecast":
                    self.weatherProvider.fetchWeatherForecast();
                    break;
                default:
                    Log.error("Invalid type " + self.config.type + " configured (must be one of 'current', 'hourly', 'daily' or 'forecast')");
            }
        }, nextLoad);
    },
    roundValue: function (temperature) {
        var decimals = this.config.roundTemp ? 0 : 1;
        var roundValue = parseFloat(temperature).toFixed(decimals);
        return roundValue === "-0" ? 0 : roundValue;
    },
    addFilters: function () {
        this.nunjucksEnvironment().addFilter("formatTime", function (date) {
            date = moment(date);
            if (this.config.timeFormat !== 24) {
                if (this.config.showPeriod) {
                    if (this.config.showPeriodUpper) {
                        return date.format("h:mm A");
                    }
                    else {
                        return date.format("h:mm a");
                    }
                }
                else {
                    return date.format("h:mm");
                }
            }
            return date.format("HH:mm");
        }.bind(this));
        this.nunjucksEnvironment().addFilter("unit", function (value, type) {
            if (type === "temperature") {
                if (this.config.tempUnits === "metric" || this.config.tempUnits === "imperial") {
                    value += "째";
                }
                if (this.config.degreeLabel) {
                    if (this.config.tempUnits === "metric") {
                        value += "C";
                    }
                    else if (this.config.tempUnits === "imperial") {
                        value += "F";
                    }
                    else {
                        value += "K";
                    }
                }
            }
            else if (type === "precip") {
                if (value === null || isNaN(value) || value === 0 || value.toFixed(2) === "0.00") {
                    value = "";
                }
                else {
                    if (this.config.weatherProvider === "ukmetoffice" || this.config.weatherProvider === "ukmetofficedatahub") {
                        value += "%";
                    }
                    else {
                        value = value.toFixed(2) + " " + (this.config.units === "imperial" ? "in" : "mm");
                    }
                }
            }
            else if (type === "humidity") {
                value += "%";
            }
            return value;
        }.bind(this));
        this.nunjucksEnvironment().addFilter("roundValue", function (value) {
            return this.roundValue(value);
        }.bind(this));
        this.nunjucksEnvironment().addFilter("decimalSymbol", function (value) {
            return value.toString().replace(/\./g, this.config.decimalSymbol);
        }.bind(this));
        this.nunjucksEnvironment().addFilter("calcNumSteps", function (forecast) {
            return Math.min(forecast.length, this.config.maxNumberOfDays);
        }.bind(this));
        this.nunjucksEnvironment().addFilter("calcNumEntries", function (dataArray) {
            return Math.min(dataArray.length, this.config.maxEntries);
        }.bind(this));
        this.nunjucksEnvironment().addFilter("opacity", function (currentStep, numSteps) {
            if (this.config.fade && this.config.fadePoint < 1) {
                if (this.config.fadePoint < 0) {
                    this.config.fadePoint = 0;
                }
                var startingPoint = numSteps * this.config.fadePoint;
                var numFadesteps = numSteps - startingPoint;
                if (currentStep >= startingPoint) {
                    return 1 - (currentStep - startingPoint) / numFadesteps;
                }
                else {
                    return 1;
                }
            }
            else {
                return 1;
            }
        }.bind(this));
    }
});