var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    str = require('string'),
    request = require('request'),
    json = require('json'),
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
	if(str(body_message).startsWith('directions') || str(body_message).startsWith('Directions')) {
		console.log('directions');
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
		console.log('https://maps.googleapis.com/maps/api/directions/json?origin=' + from_place + '&destination=' + to_place);
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
		
	} else {
		var resp = "<Response><Message>" + body_message +"</Message></Response>";
		res.end(resp);
	}
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});