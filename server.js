var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app);
    // ejs = require('ejs');
// set the port and view engine
var x = 'a';
app.set('port', (process.env.PORT || 5000));
// app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	 
	 response.writeHead(200, {"Content-Type" : "text/html"});
	 response.write("<body>"+ x + "</body>");
	 response.end();
});

app.listen(app.get('port'), function() {
	
    console.log("Node app is running at localhost:" + app.get('port'));
});