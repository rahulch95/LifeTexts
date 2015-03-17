LifeTexts
=========
## What is LifeTexts?
LifeTexts is a life saving text app when you don't have any data or wifi.
If you get lost, need to check up on your stocks, want to know the weather out there or just need to find nearby places, say a bus stand or a chinese restaurant, we got you covered. 
## How do I use LifeTexts?
Just shoot a text to:
## +1(647)691-0707
Don't forget the +1, it's important.
(This will stop working at some point because we might run out of Twilio Credit)
Type 'help me' if you don't know the commands.

Type 'directions from address1&gt; to &lt;address2&gt; &lt;mode&gt;' for directions, mode can be walking, driving or transit.

Type 'stock &lt;stock code&gt;', for stock price.

Type 'weather &lt;city-name&gt; &lt;state/country&gt;' for weather.

Type '&lt;type of place&gt; places near &lt;location&gt; with keyword &lt;keyword&gt;', for nearby places. 

Type 'define &lt;your word&gt;' for definition of the word.

Type 'news &lt;number of stories&gt;' to get the top n stories.

Type 'news search &lt;number of stories&gt; &lt;search word&gt;' to get the top n stories about search.
## Can I set up my own LifeTexts?
1. Sure you can. Just download a zip of this folder including the package.json file.
2. Then command line into the directory of the folder and run npm init (after installing Node.js of course).
3. Host the server online after setting up your own API keys from Twilio, Mashape, New York Times and Yahoo Finances in server.js (instead of the current process.env keys).
4. Set up your twilio number to send a request to your server.
5. Send a text to your twilio number.
6. Receive a reply.

## Can I see it working before I start using it?
Sure here is how it goes:

Help Me

![alt tag](https://raw.github.com/rahulch95/LifeTexts/gh-pages/gifs/help_me.gif)

Directions for Driving

![alt tag](https://lifetexts.herokuapp.com/gifs/directions_driving.gif)

Directions for Transit

![alt tag](https://lifetexts.herokuapp.com/gifs/directions_transit.gif)

Places for food

![alt tag](https://lifetexts.herokuapp.com/gifs/food_places.gif)

News 

![alt tag](https://lifetexts.herokuapp.com/gifs/news_1.gif)

News Search

![alt tag](https://lifetexts.herokuapp.com/gifs/news_search.gif)

Weather

![alt tag](https://lifetexts.herokuapp.com/gifs/weather.gif)

Dictionary definitions

![alt tag](https://raw.github.com/rahulch95/LifeTexts/gh-pages/gifs/define.gif)

Stock Update

![alt tag](https://raw.github.com/rahulch95/LifeTexts/gh-pages/gifs/stocks.gif)
