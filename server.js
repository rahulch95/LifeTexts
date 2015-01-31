var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    str = require('string'),
    request = require('request'),
    json = require('json'),
    unirest = require('unirest'),
    client = require('twilio')('AC3ae44eef70072c95f5d52e57d39df1bc', 'dcd95a9a35f303ac6da486d994e130de');

var twilio_number = '+16476910676';
app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
	 
	 res.writeHead(200, {"Content-Type" : "text/html"});
	 res.write("<body>Hi</body>");
	 res.end();
});

app.get('/sms/reply/*', function(req, res) {
	console.log(req.query);
	var body_message = "could not find body";
	if (req.query.Body) {
		body_message = req.query.Body;
	}
	var body_message_parts = body_message.split(" ");

	//Render the TwiML document using "toString"
	res.writeHead(200, {
	    'Content-Type':'text/xml'
	});
	if(str(body_message_parts[0]).toLowerCase() == 'directions' || str(body_message_parts[0]).toLowerCase() == 'direction') {
		if (body_message_parts[1] != 'from' ||
			body_message.toLowerCase().indexOf('to') == -1 ||
			body_message.toLowerCase().indexOf('to') == 2 ||
			body_message_parts.length < 5) {

			resp = "<Response><Message>Incorrect usage, please try: directions from &lt;address1&gt; to &lt;address2&gt;</Message></Response>";
			res.end(resp);
		}
		console.log('directions');

		var end_from_index = 3;
		for (var i = 2; i < body_message_parts.length; i++) {
			if (body_message_parts[i].toLowerCase() == 'to') {
				end_from_index = i;
				break;
			};
		};
		from_place = body_message_parts.slice(2, end_from_index).join('+');
		to_place = body_message_parts.slice(end_from_index + 1).join('+');
		var resp = '';
		console.log('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place);
		request('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place,
			function(err, res_req, body) {
				var direction_json = JSON.parse(body);
				if(direction_json['status'] == 'NOT_FOUND') 
				{
					reply = 'Origin/Destination not found';
				} 
				else 
				{
					var steps = direction_json['routes'][0]['legs'][0]['steps'];
					var reply = '';
					for (var i = 0; i < steps.length; i++) {
						reply += i+1 + '. ' + steps[i]['html_instructions'].split('<b>').join('').split('</b>').join('').split('\n').join() + " for " + steps[i]['duration']['text'] + ' (' + steps[i]['distance']['text'] + ')'+ '\n';
					}
				}
				resp = "<Response><Message>" + reply + "</Message></Response>";
			    res.end(resp);
			});
		
	} 
		else if(body_message_parts[0].toLowerCase() == 'weather') {
		if (body_message_parts.length != 4) {
				resp = "<Response><Message>Wrong syntax, Correct Usage: weather at &lt;cityname&gt; &lt;state/country &gt;</Message></Response>";
				res.end(resp);
		}
		else {
	        console.log('Weather');		
	        console.log(body_message_parts);
	        var cityname = body_message_parts[2];
			var cityloc = body_message_parts[3];
	        var resp = '';
	        console.log('http://api.openweathermap.crg/data/2.5/weather?q=' + cityname + ',' + cityloc + '&units=metric', 
				function(err, res_req, body) {
					console.log('body of weather', body);
					var weather_details = JSON.parse(body);
					if (weather_details['list'].length > 0) {
						var country = weather_details['sys']['country'];
						var mintemp = weather_details['main']['temp_min'];
						var temp = weather_details['main']['temp'];
						var maxtemp = weather_details['main']['temp_max'];
						var humidity = weather_details['main']['humidity'];
						var windspeed = weather_details['wind']['speed'].toString() + ' m/s, ' + weather_details['wind']['deg'].toString();
						var description = weather_details['weather'][0]['main'] + ', ' + 
									weather_details['weather'][0]['description'];
						var reply = cityname[0].toUpperCase() + cityname.slice(1).toLowerCase() + 
									', ' + cityloc[0].toUpperCase() + cityloc.slice(1).toLowerCase() + ', ' + country + '\n' + 
									'Current Temp    : ' + temp + ' C\n' +
									'Description     : ' + description + '\n' + 
									'Minimum         : ' + mintemp + 'C\n' + 
									'Maximum         : ' + maxtemp + 'C\n' +
									'Humidity        : ' + humidity + '%\n' + 	
									'Speed/Direction : ' + windspeed + ' m/s\n';
						resp = "<Response><Message>" + reply + "</Message></Response>"; 
						res.end(resp);
					}
					else {
						resp = "<Response><Message>City Not Found</Message></Response>"; 
						res.end(resp);						
					}
				}
			);
		}
	}
	else if (str(body_message.toLowerCase()).startsWith('define')) {  
		if (body_message_parts.length != 2) 
		{
			resp = "<Response><Message>Incorrect usage, please try: Define &lt;word&gt;</Message></Response>";
			res.end(resp);
		}
		else 
		{
			console.log('Definition');
			var resp = '';
			var reply = '';
			var word = body_message_parts[1];
			unirest.get("https://montanaflynn-dictionary.p.mashape.com/define?word=" + word)
				.header("X-Mashape-Key", "KamTtH7Q0ymshVl5xPDnbiSWKBbpp1Reh2TjsnM36vK1b3W5jE")
				.header("Accept", "application/json")
				.end(function (result) {
					//console.log('definition', result.body);
					var toparse = result.body;
					for(var i = 0; i < Math.min(toparse['definitions'].length, 3); i++) {
						reply = reply + (i+1) + '. ' + toparse['definitions'][i]['text'] + '\n';
					}
					resp = "<Response><Message>" + reply + "</Message></Response>";
					res.end(resp);
				}
			);			
		}
 	}
	else {
		var resp = "<Response><Message>Command '" + body_message +"' not found</Message></Response>";
		res.end(resp);
	}
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});