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
// ejs = require('ejs');
// set the port and view engine
app.set('port', (process.env.PORT || 5000));
// app.set('view engine', 'ejs'); 	

// client.sms.messages.create({
//     to:'+16474086077',
//     from:twilio_number,
//     body:'ahoy hoy! Testing Twilio and node.js'
// }, function(error, message) {
//     // The HTTP request to Twilio will run asynchronously. This callback
//     // function will be called when a response is received from Twilio
//     // The "error" variable will contain error information, if any.
//     // If the request was successful, this value will be "falsy"
//     if (!error) {
//         // The second argument to the callback will contain the information
//         // sent back by Twilio for the request. In this case, it is the
//         // information about the text messsage you just sent:
//         console.log('Success! The SID for this SMS message is:');
//         console.log(message.sid);
//         console.log('Message sent on:');
//         console.log(message.dateCreated);
//     } else {
//         console.log('Oops! There was an error.');
//     }
// });

app.get('/', function(req, res) {
	 
	 res.writeHead(200, {"Content-Type" : "text/html"});
	 res.write("<body>Hi</body>");
	 res.end();
});

app.get('/sms/reply/*', function(req, res) {
	var body_message = "could not find body";
	if (req.query.Body) {
		body_message = req.query.Body;
	}
	var body_message_parts = body_message.split(" ");
	//Render the TwiML document using "toString"
	res.writeHead(200, {
	    'Content-Type':'text/xml'
	});
	if(str(body_message).startsWith('directions') || str(body_message).startsWith('Directions')) {
		//console.log('directions');
		var end_from_index = 3;
		for (var i = 2; i < body_message_parts.length; i++) {
			if (body_message_parts[i] == 'to') {
				end_from_index = i;
				break;
			};
		};
		from_place = body_message_parts.slice(2, end_from_index).join('+');
		to_place = body_message_parts.slice(end_from_index + 1).join('+');
		var resp = '';
		request('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place,
			function(err, res_req, body) {
				var direction_json = JSON.parse(body);
				var steps = direction_json['routes'][0]['legs'][0]['steps'];
				var reply = '';
				for (var i = 0; i < steps.length; i++) {
					reply += i+1 + '. ' + steps[i]['html_instructions'].split('<b>').join('').split('</b>').join('').split('\n').join() + " for " + steps[i]['duration']['text'] + ' (' + steps[i]['distance']['text'] + ')'+ '\n';
				}
				resp = "<Response><Message>" + reply + "</Message></Response>";
			    res.end(resp);
			});
		
	}
	else if(body_message_parts[0].toLowerCase() == 'weather') {
       // console.log('Weather');		
        console.log(body_message_parts);
        var cityname = body_message_parts[2];
		var cityloc = body_message_parts[3];
        var resp = '';
        console.log('http://api.openweathermap.org/data/2.5/weather?q=' + cityname + ','+ cityloc + '&units=metric');
		request('http://api.openweathermap.org/data/2.5/weather?q=' + cityname + ',' + cityloc + '&units=metric', 
			function(err, res_req, body) {
				console.log('body of weather', body);
				var weather_details = JSON.parse(body);
				var country = weather_details['sys']['country'];
				var mintemp = weather_details['main']['temp_min'];
				var temp = weather_details['main']['temp'];
				var maxtemp = weather_details['main']['temp_max'];
				var humidity = weather_details['main']['humidity'];
				var windspeed = weather_details['wind']['speed'].toString() + ', ' + weather_details['wind']['deg'].toString();
				var description = weather_details['weather'][0]['main'] + ', ' + 
							weather_details['weather'][0]['description'];
				var reply = cityname + ', ' + cityloc + ', ' + country + '\n' + 'Current Temp    : ' + temp + '\n' +'Description     : ' + description + '\n' + 'Minimum         : ' + mintemp + '\n' + 'Maximum         : ' + maxtemp + '\n' +'Humidity        : ' + humidity + '\n' + 	'Speed/Direction : ' + windspeed + '\n';
				resp = "<Response><Message>" + reply + "</Message></Response>"; 
				res.end(resp);
			});
	}
	else if (str(body_message.toLowerCase()).startsWith('define')) {  
		//console.log('Definition');
		var resp = '';
		var reply = '';
		var word = body_message_parts[1];
		unirest.get("https://montanaflynn-dictionary.p.mashape.com/define?word="+word)
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
			});
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
	else if (body_message_parts[1].toLowerCase() == 'places') { //_____ places near ______ with keyword ______
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
	else if(body_message_parts[0].toLowerCase() == 'news') {
		var top_count = parseInt(body_message_parts[1]);
		var resp = '';
		request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=7b58b7fc2899c1590247b5fdad94f5c6:0:71138579',
			function(err, res_req, body) {
				var top_stories_json = JSON.parse(body);
				var stories = top_stories_json['results'];
				//console.log(stories);
				var reply = '';
				for (var i = 0; i < top_count; i++) {
					reply += i+1 + '. ' + stories[i]['title'].split('\u2019').join("'") +  '\n' + stories[i]['abstract'].split('\u2019').join("'") + '\n';
				}
				resp = "<Response><Message>" + reply + "</Message></Response>";
			    res.end(resp);
			}
		);
	}
	else {
		var resp = "<Response><Message>" + body_message +"</Message></Response>";
		res.end(resp);
	}
});

app.get('*', function(req, res) {

	 res.writeHead(200, {"Content-Type" : "text/html"});
	 res.write("<body>404</body>");
	 res.end();
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});