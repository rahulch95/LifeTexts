var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    str = require('string'),
    request = require('request'),
    json = require('json'),
    unirest = require('unirest'),
    client = require('twilio')(process.env.TWILIO_KEY, process.env.TWILIO_SECRET);

app.use(express.static(__dirname + '/public'));

// set port to heroku's defined port if it exists or make it port 5000 by default
app.set('port', (process.env.PORT || 5000));

// if lifetexts.herokuapp.com/ is accessed just type hi
app.get('/', function(req, res) {
	 
	 res.writeHead(200, {"Content-Type" : "text/html"});
	 res.write("<body>Hi</body>");
	 res.end();
});

// if lifetexts.herokuapp.com/ is accessed then return a TwiML (Twilio XML) document
app.get('/sms/reply/*', function(req, res) {

	// set default value of body_message to "could not find body"
	var body_message = "could not find body";

	// if body does exist then change body_message to the given body
	if (req.query.Body) {
		body_message = req.query.Body;
	}

	// body_message_parts is a list of all words
	var body_message_parts = body_message.split(" ");

	//Render the TwiML document using "toString"
	res.writeHead(200, {
	    'Content-Type':'text/xml'
	});

	// if body_message_parts starts with help, return instructions as the TwiML document
	if(body_message_parts[0].toLowerCase() == 'help') {
		var reply = ("For Directions, enter data in the format \"Directions from (Enter origin) to (Enter destination)\" \n" + 
					"\nFor Places, enter data in the format \"(type of) Places near (your location) with keyword (keyword)\" \n" + 
					"\nFor Weather, enter data in the format \"Weather at (name of city) (name of province/state/country)\" \n" + 
					"\nFor Stocks, enter data in the format \"Stock (4 letter stock name)\" \n" + 
					"\nFor News, enter data in the format \"News (number of articles/search) (number of articles to search) (search keyword)\" \n" + 
					"\nFor Dictionary definitions of words, enter data in the format \"Define (your word)\" \n");
		var resp = "<Response><Message>" + reply + "</Message></Response>";
		res.end(resp);
	}

	// if body of the message starts with directions then we use the google directions API after finding the origin and the destination
	// we assume that the format of the message will be "directions from <origin address> to <destination address> [optional - mode of transport]"
	else if(str(body_message_parts[0]).toLowerCase() == 'directions') {
		if (body_message_parts[1] != 'from' ||
			body_message.toLowerCase().indexOf('to') == -1 ||
			body_message.toLowerCase().indexOf('to') == 2 ||
			body_message_parts.length < 5) {

			resp = "<Response><Message>Incorrect usage, please try: directions from &lt;address1&gt; to &lt;address2&gt;</Message></Response>";
			res.end(resp);
		}

		// set default mode of transport to transit
		var end_from_index = 3;
		var mode_of_transport = 'transit';
		
		var num_of_words = body_message_parts.length - 1;

		// if last word is walking/transit/driving set mode of transport to that mode and remove it from the list
		if (body_message_parts[num_of_words].toLowerCase() == 'walking' ||
			body_message_parts[num_of_words].toLowerCase() == 'transit' ||
			body_message_parts[num_of_words].toLowerCase() == 'driving') {
			
			mode_of_transport = body_message_parts[num_of_words].toLowerCase();
			body_message_parts = body_message_parts.slice(0,num_of_words);
		}

		
		for (var i = 2; i < body_message_parts.length; i++) {
			if (body_message_parts[i].toLowerCase() == 'to') {
				end_from_index = i;
				break;
			};
		};

		// find the source address and the destination address using the indices we found above
		from_place = body_message_parts.slice(2, end_from_index).join('+');
		to_place = body_message_parts.slice(end_from_index + 1).join('+');

		// request the directions from googleapis and parse the body into json format
		var resp = '';
		
		request('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place + '&mode=' + mode_of_transport,
			function(err, res_req, body) {

				var direction_json = JSON.parse(body);
				if (direction_json['status'] == 'ZERO_RESULTS') {
					resp = "<Response><Message>No directions found, change mode of transport and make sure you specify the right city.</Message></Response>";
					res.end(resp);	
				}
				else {
					if(direction_json['status'] == 'NOT_FOUND') 
					{
						reply = 'Origin/Destination not found';
					} 
					else 
					{
						// making sure that these items exist in the json
						if (direction_json['routes'] && direction_json['routes'].length >= 1 && direction_json['routes'][0]['legs'] && direction_json['routes'][0]['legs'].length >= 1 && direction_json['routes'][0]['legs'][0]['steps']) {

							// find the steps needed to follow the directions and remove the unnecessary formatting and add it to the reply string
							var steps = direction_json['routes'][0]['legs'][0]['steps'];
							var reply = '';
							for (var i = 0; i < steps.length; i++) {
								reply += i+1 + '. ' + steps[i]['html_instructions'].split('<b>').join('').split('</b>').join('').split('\n').join('').split('<div style="font-size:0.9em">').join('') + " for " + steps[i]['duration']['text'] + ' (' + steps[i]['distance']['text'] + ')'+ '\n';
							}	
						}
						else {
							reply = "Oops something went wrong, try a more specific location";
						}
					}

					// reply to the message with required string
					resp = "<Response><Message>" + reply + "</Message></Response>";
				    res.end(resp);
				}
			}
		);
		
	}

	// assuming that the form of request is "weather at <city> <state/country>"
	else if(body_message_parts[0].toLowerCase() == 'weather') {
		if (body_message_parts.length != 4) {
				resp = "<Response><Message>Wrong syntax, Correct Usage: weather at &lt;cityname&gt; &lt;state/country &gt;</Message></Response>";
				res.end(resp);
		}

		else {

	        var cityname = body_message_parts[2];
			var cityloc = body_message_parts[3];
	        var resp = '';
	        
	        request('http://api.openweathermap.org/data/2.5/weather?q=' + cityname + ',' + cityloc + '&units=metric&appid=' + process.env.WEATHER_API, 
				function(err, res_req, body) {

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
				.header("X-Mashape-Key", process.env.MASHAPE_KEY_WORD_SEARCH)
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

		if(body_message_parts.length != 2) {
			resp = "<Response><Message>Incorrect usage, please try: Stock &lt;stock_name&gt;</Message></Response>";
			res.end(resp);	
		}
		else
		{
		var name = body_message_parts[1];
		var reply = '';
		var resp;
		unirest.get('https://www.enclout.com/api/yahoo_finance/show?' + process.env.MASHAPE_AUTH_TOKEN_YAHOO_FINANCE + name.toUpperCase())
		.header("X-Mashape-Key", process.env.MASHAPE_KEY_YAHOO_FINANCE)
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
		});}
	}
	else if (body_message_parts.indexOf('places') == 1) { //_____ places near ______ with keyword ______
		//console.log('Places');
		var type = body_message_parts[0].toLowerCase();
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
		var lng;

		request('https://maps.googleapis.com/maps/api/geocode/json?address=' + address, 
			function(err, res_req, body) {

				var toparse = JSON.parse(body);
				lat = toparse['results'][0]['geometry']['location']['lat'];
				lng = toparse['results'][0]['geometry']['location']['lng'];

				request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + lng + '&radius=1000&types=' + type + '&keyword=' + keyword + '&key=' + process.env.GOOGLE_NEARBY_PLACES_KEY, 

				function(err, res_req, body) {
					//console.log(body);
					var placeparse = JSON.parse(body);
					if (placeparse['status'] == 'ZERO_RESULTS') {
						resp = "<Response><Message>Invalid Keyword or no results found</Message></Response>";
						res.end(resp);	
					}
					else {
						console.log(placeparse);
						var number = Math.min(3, placeparse['results'].length);
						//console.log('The minimum is' + number);
						for(var i = 0; i < number; i++) {
							reply = reply + (i+1) + '. \n' + 'Name      : ' + placeparse['results'][i]['name']+'\n'+
							'Location       : ' + placeparse['results'][i]['vicinity'] + '\n';
						}
					resp = "<Response><Message>" + reply + "</Message></Response>";
					res.end(resp);	
					}
				});
			});
	}
 	else if(str(body_message_parts[0]).toLowerCase() == 'news') {
		if(body_message_parts.length == 1) {
			var resp = '';

			request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=' + process.env.NYTIMES_KEY,
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

			request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=' + process.env.NYTIMES_KEY,
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

			request('http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + search_term + '&fl=lead_paragraph,headline,pub_date&api-key=' + process.env.NYTIMES_KEY,
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
		var resp = "<Response><Message>Command '" + body_message +"' not found. Type 'Help me' for help.</Message></Response>";
		res.end(resp);
	}
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});
