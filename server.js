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
	//console.log(req.query);
	var body_message = "could not find body";
	if (req.query.Body) {
		body_message = req.query.Body;
	}
	var body_message_parts = body_message.split(" ");

	//Render the TwiML document using "toString"
	res.writeHead(200, {
	    'Content-Type':'text/xml'
	});
	if(body_message_parts[0].toLowerCase() == 'help') {
		var reply = "For directions, enter data in the format \"Directions from (Enter origin) to (Enter destination)\" \n\nFor Places, enter data in the format \"(type of) Places near (your location) with keyword (keyword)\" \n\nFor Weather, enter data in the format \"Weather at (name of city) (name of province/state/country)\" \n\nFor Stocks, enter data in the format \"Stock (4 letter stock name)\" \n\nFor news, enter data in the format \"News (number of articles/search) (number of articles to search) (search keyword)\" \n\nFor dictionary definitions of words, enter data in the format \"Define (your word)\" \n";
		var resp = "<Response><Message>" + reply + "</Message></Response>";
		res.end(resp);
	}
	else if(str(body_message_parts[0]).toLowerCase() == 'directions' || str(body_message_parts[0]).toLowerCase() == 'direction') {
		if (body_message_parts[1] != 'from' ||
			body_message.toLowerCase().indexOf('to') == -1 ||
			body_message.toLowerCase().indexOf('to') == 2 ||
			body_message_parts.length < 5) {

			resp = "<Response><Message>Incorrect usage, please try: directions from &lt;address1&gt; to &lt;address2&gt;</Message></Response>";
			res.end(resp);
		}
		//console.log('directions');

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
		//console.log('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place);
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
						reply += i+1 + '. ' + steps[i]['html_instructions'].split('<b>').join('').split('</b>').join('').split('\n').join('').split('<div style="font-size:0.9em">').join('') + " for " + steps[i]['duration']['text'] + ' (' + steps[i]['distance']['text'] + ')'+ '\n';
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
	        //console.log('Weather');		
	        //console.log(body_message_parts);
	        var cityname = body_message_parts[2];
			var cityloc = body_message_parts[3];
	        var resp = '';
	        //console.log('http://api.openweathermap.org/data/2.5/weather?q=' + cityname + ',' + cityloc + '&units=metric');
	        request('http://api.openweathermap.org/data/2.5/weather?q=' + cityname + ',' + cityloc + '&units=metric', 
				function(err, res_req, body) {
					//console.log('body of weather', body);
					var weather_details = JSON.parse(body);
					if (!weather_details['message']) {
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
			//console.log('Definition');
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
	else if (body_message_parts[0].toLowerCase() == 'stock') {
		//console.log('Stocks');	
		var name = body_message_parts[1];
		var reply = '';
		var resp;
		unirest.get('https://www.enclout.com/api/yahoo_finance/show?auth_token=uXYQUj9KLBFrXqbqq4L7&text='+name.toUpperCase())
		.header("X-Mashape-Key", "KamTtH7Q0ymshVl5xPDnbiSWKBbpp1Reh2TjsnM36vK1b3W5jE")
		.header("Accept", "application/json")
		.end(function (result) {
  			reply = reply + 'Name            : ' + result.body[0]['symbol'] + '\n' + 
					'Ask             : ' + result.body[0]['ask'] + '\n' +
					'Bid             : ' + result.body[0]['bid'] + '\n' +
					'Last trade date : ' + result.body[0]['last_trade_date'] + '\n' +
					'Low             : ' + result.body[0]['low'] + '\n' +
					'High            : ' + result.body[0]['high'] + '\n' +
					'Low 52 Weeks    : ' + result.body[0]['low_52_weeks'] + '\n' +
					'High 52 Weeks   : ' + result.body[0]['high_52_weeks'] + '\n' +
					'Volume          : ' + result.body[0]['volume'] + '\n' +
					'Open            : ' + result.body[0]['open'] + '\n' +	
					'Close           : ' + result.body[0]['close'] + '\n';
			resp = "<Response><Message>" + reply + "</Message></Response>";
				res.end(resp);
		});
	}
	else if (body_message_parts.indexOf('places') == 1) { //_____ places near ______ with keyword ______
		//console.log('Places');
		var type = body_message_parts[0];
		var index1, index2;
		var reply = '';
		var resp;
		for(var i = 1; i < body_message_parts.length; i++) {
			if(body_message_parts[i] == 'near') 
				index1 = i;
			if(body_message_parts[i] == 'with')
				index2 = i;		
		} 
		var address = body_message_parts.slice(index1 + 1, index2);
		var keyword = body_message_parts.slice(index2 + 2);
		var lat;
		var long;
		//console.log(address);
		request('https://maps.googleapis.com/maps/api/geocode/json?address=' + address, 
			function(err, res_req, body) {
				//console.log(body);
				var toparse = JSON.parse(body);
				lat = toparse['results'][0]['geometry']['location']['lat'];
				long = toparse['results'][0]['geometry']['location']['lng'];
				//console.log(lat, long);
				request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + long + 					'&radius=1000&types=' + type + '&keyword=' + keyword + '&key=AIzaSyDewm58QznqMn6M4Bc8Lg1kyV3OjyN61F0', 
				function(err, res_req, body) {
					//console.log(body);
					var placeparse = JSON.parse(body);
					var number = Math.min(3, placeparse['results'].length);
					//console.log('The minimum is' + number);
					for(var i = 0; i < number; i++) {
						reply = reply + (i+1) + '. \n' + 'Name      : ' + placeparse['results'][i]['name']+'\n'+
						'Location       : ' + placeparse['results'][i]['vicinity'] + '\n' +
						'Open now?      : ' + placeparse['results'][i]['opening_hours']['open_now'] + '\n' + 							'Price level    : ' + placeparse['results'][i]['price_level'] + '\n';
					}
				resp = "<Response><Message>" + reply + "</Message></Response>";
				res.end(resp);	
				});
			});
	}
 	else if(str(body_message_parts[0]).toLowerCase() == 'news') {
		if(body_message_parts.length == 1) {
			var resp = '';

			request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=7b58b7fc2899c1590247b5fdad94f5c6:0:71138579',
				function(err, res_req, body) {
					var top_stories_json = JSON.parse(body);
					var stories = top_stories_json['results'];
					var reply = '';

					for (var i = 0; i < 3; i++) {
						reply += i+1 + '. ' + stories[i]['title'].split('\u2019').join("'") +  '\n' + stories[i]['abstract'].split('\u2019').join("'") + '\n';
					}

					resp = "<Response><Message>" + reply + "</Message></Response>";
			    	res.end(resp);
				}
			);	
		}
		else if(isNaN(body_message_parts[1]) != true) {
			var top_count = parseInt(body_message_parts[1]);
			var resp = '';

			request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=7b58b7fc2899c1590247b5fdad94f5c6:0:71138579',
				function(err, res_req, body) {
					var top_stories_json = JSON.parse(body);
					var stories = top_stories_json['results'];
					var reply = '';

					for (var i = 0; i < top_count; i++) {
						reply += i+1 + '. ' + stories[i]['title'].split('\u2019').join("'") +  '\n' + stories[i]['abstract'].split('\u2019').join("'") + '\n';
					}

					resp = "<Response><Message>" + reply + "</Message></Response>";
			    	res.end(resp);
				}
			);
		}
		else if(body_message_parts[1].toLowerCase() == 'search') {
			var stories_count = parseInt(body_message_parts[2]);
			var key_words = body_message_parts.slice(3);
			var search_term = '';

			for (i = 0; i < key_words.length; i++) {
				search_term += key_words[i] + '+';
			}

			search_term = search_term.slice(0, search_term.length - 1);

			var resp = '';

			request('http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + search_term + '&fl=lead_paragraph,headline,pub_date&api-key=fdcac45a0d405a7487fbd422128cb413:0:71138579',
				function(err, res_req, body) {
					var results_json = JSON.parse(body);
					var results = results_json['response']['docs'];
					var reply = '';
					//console.log(body);
					for (var i = 0; i < stories_count; i++) {
						reply+= i+1 + '. ' + results[i]['headline']['main'] + '\n' + results[i]['lead_paragraph'] + '\n';
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
