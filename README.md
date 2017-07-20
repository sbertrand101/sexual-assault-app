# Sexual-assault-app

This app, created using Bandwidth’s API, is a hotline number that serves to make sexual assault survivors feel more comfortable when reporting their assault.  
When a survivor calls in, they are prompted with a series of questions to collect as much knowledge and evidence about the incident as possible. They are then given suggestions about what else they can do to help build their case.  When the call is ended, a transcript of the call is sent to the survivor via text message or email, and at any time, they can submit this information to the police and create a police report.

## Demos
* Inbound calling
* DTMF functioning with audio
* Recording
* Transcribing
* Outbound text messaging

### Prerequisites
* Bandwidth Catapult Account
* Node 8.0+
* Ngrok or another port forwarding app

#### Making the App
The first code needed for this hotline number app is structure to insert the Bandwidth Catapult Account credentials.

```javascript
var Bandwidth = require("node-bandwidth");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);

var client = new Bandwidth({
	userId    : process.env.BANDWIDTH_USER_ID,  //<-- note, this is not the same as the username you used to login to the portal
	apiToken  : process.env.BANDWIDTH_API_TOKEN,
	apiSecret : process.env.BANDWIDTH_API_SECRET
});
```

Next, let’s setup the app further so that it can parse JSON, open a port (i.e.3000) through Ngrok, and create a website that has the title “SEXUAL ASSAULT HELPLINE” in port 3000 and also has a listener so it can catch any POST requests.

```javascript
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));
app.get("/", function(req, res){				//at certain address, takes in request and response
	console.log(req);							//listening FOR a GET request at the '/' (root domain)
	res.send("SEXUAL ASSAULT HELPLINE");
});
http.listen(app.get('port'), function(){
	console.log('listening on *:' + app.get('port'));
});
```

Use Bandwidth’s API so it can accept incoming calls.

```javascript
app.post("/call-callback", function (req, result){

	var body = req.body;
	result.sendStatus(200); 						//letting the invoker sending the push request say 'we're good' 

	var numbers = {
	to   : callerId,
	from : "+13365936477"
	};

	//1 sentences
	var sentence = [
		'This is a hotline number for sexual assault cases.  Our aim is to help collect evidence. A transciription of the call will be sent to you when you hang up. Please answer the questions as descriptively as you can. Please state your full name, and a number to reach you by. When finished, please press 1.',
		
		'Where did the assault occur? When finished, please press 1',
		
		'What happened? This is the final question. When finished, please press 1.'
	]


	if(body.eventType === "incomingcall"){
		callerId = body.from;
		db[body.callId] = {};
		db[body.callId].from = body.from;
		db[body.callId].recordings = [];
		console.log(db);
	}
	else if (body.eventType === "answer"){
		client.Call.speakSentence(body.callId, sentence[i])
		.then(function (res) {
			console.log(body);
			console.log(res);
 			console.log("------Introduction sentence spoken----");
 			i++;
		})
		.catch(function (err){
			console.log(err);
			console.log("Couldn't speak intro sentence")
		});
	}
```