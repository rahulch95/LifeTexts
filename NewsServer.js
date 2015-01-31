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

	var body_message = "Could not find body.";
	if (req.query.Body) {
		body_message = req.query.Body;
	}

	var body_message_parts = body_message.split(" ");
	res.writeHead(200, {
	    'Content-Type':'text/xml'
	});

	if(str(body_message).startsWith('News')) {
		var top_count = body_message_parts[1];
		var resp = '';
		request('http://api.nytimes.com/svc/topstories/v1/home.json?api-key=7b58b7fc2899c1590247b5fdad94f5c6:0:71138579',
			function(err, res_req, body) {
				var top_stories_json = body;
				console.log(body);
				var stories = JSON.parse(top_stories_json['results']);
				var reply = '';
				for (var i = 0; i < top_count; i++) {
					reply += i+1 + '. ' + stories[i]['title'].split('\u2019').join("'") +  '\n' + stories[i]['abstract'].split('\u2019').join("'") + '\n\n';
				}
				resp = "<Response><Message>" + reply + "</Message></Response>";
			    res.end(resp);
			});
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