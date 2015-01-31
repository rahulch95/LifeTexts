var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    str = require('string'),
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

app.get('/', function(request, response) {
	 
	 response.writeHead(200, {"Content-Type" : "text/html"});
	 response.write("<body>Hi</body>");
	 response.end();
});

app.get('/sms/reply/*', function(request, response) {
	console.log(request.query);
	var body_message = "could not find body";
	if (request.query.Body) {
		body_message = request.query.Body;
	}
	var resp = "<Response><Message>" + body_message +"</Message></Response>";
    //Render the TwiML document using "toString"
    response.writeHead(200, {
        'Content-Type':'text/xml'
    });
    response.end(resp);
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});