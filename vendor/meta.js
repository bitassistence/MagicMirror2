/* Magic Mirror
 *
 * Meta injector
 * MIT Licensed.
 *
 * Redesigned by Răzvan Cristea
 * for iPad 3 & HD display
 * https://github.com/hangorazvan
 */
function Injector() { var meta = document.createElement("meta");
	document.head.innerHTML 
+=	"<meta http-equiv=\"Copyright\" content=\"Răzvan Cristea, Bucharest, Romania. © " + new Date().getFullYear() + ", MIT LIcense.\">"
+ 	"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=yes, user-scalable=no\">"
+ 	"<meta name=\"Keywords\" content=\"magic,smart,mirror,modular,core,framework,open,source,platform,info,board,web,html,css,script,ipad\">"
+ 	"<meta name=\"Description\" content=\"Custom redesigned personal (not to much) smart mirror for iPad 3, iOS 9 & ES5 compatibile / HD monitor + Windows 8.1 HP mini netbook / eventually Windows 10 PC stick + IKEA frame + see-thru acrylic mirror, powered by consistent css & js, fonts sizes, icons & well structured folders, based on MagicMirror² open source core framework unfortunately full of bugs from amateur developers, especially the calendar, newsfeed and the new weather version.\">"
+ 	"<meta name=\"Authoring\" content=\"Some modified default original modules: Compliments https://github.com/hangorazvan/compliments_plus, Currentweather https://github.com/hangorazvan/weather_plus, Weatherforecast https://github.com/hangorazvan/forecast_plus, Clock https://github.com/hangorazvan/clock_plus; Some 3rd party modified modules: monthly calendar, quotes, lunartic, traffic; Own developed test modules: swatch.beat https://github.com/hangorazvan/swatch, lifecounter https://github.com/hangorazvan/lifecounter, notification & timer https://github.com/hangorazvan/notification, yframe https://github.com/hangorazvan/yframe\">"
+ 	"<meta name=\"Project\" content=\"Without fucking stupid Retardberry Pi, without any donation, without pointless or religious nonsens modules and other wierd software from so-called developers struggling to break into a world that has nothing to do with their IQ level, with their free time achievements which remain hidden on an obscure server, like an idiot asian nazi asshole. And most important without any help from amateur dudes of forum community. When I needed support, no one gave me an answer. They are sometimes so fucking ignorant and incompetent that they don't understand what you're simple asking them, even if it's obvious and not very complicated, but you have to follow they stupid rules, don't be reckless or rude to comment on something, just talking about how supposed to do things in the fucking right way, no fucking hacking, no fucking cheating. NO FUCKING THANK YOU FART OLD MAN! I HATE STUPID PEOPLE AND I HAVE MY OWN FUCKING RULES!\">"; 
	document.getElementsByTagName("head")[0].appendChild(meta);
} 

Injector();