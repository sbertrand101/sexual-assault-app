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

var callerId;
var i = 0;
var db = {};

app.post("/call-callback", function (req, result){		
	result.sendStatus(200);		//Send status 200 when a request is received and executed successfully

	var numbers = {
	to   : callerId,			//Caller's phone number
	from : "+13365936477" 		//YOUR HOTLINE NUMBER HERE (ie. sexual assault hotline number)
	};

	var sentence = [			//Sentences spoken to caller
		'Sentence 1',
		'Sentence 2',
		'Sentence 3'
	]

	var body = req.body;

	if(body.eventType === "incomingcall"){  
		callerId = body.from;
		db[body.callId] = {};
		db[body.callId].from = body.from;
		db[body.callId].recordings = [];	
		console.log(db);
	}
	else if (body.eventType === "answer"){		//When the hotline number automatically answers, speak sentence[i]
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

Enable recording so Bandwidth can capture the caller's responses to each sentence spoken.

```javascript
	else if (body.eventType === "speak" && body.state === "PLAYBACK_STOP"){
		
		return client.Call.enableRecording(body.callId)				//enable recording after sentence is spoken
		.then(function (res) {
			console.log("---------Recording---------");
		})
		.catch(function(err){
			console.log(err);
			console.log("Wasn't able to start recording");
		});
	}
	else if (body.eventType === "dtmf" && body.dtmfDigit === "1" && i<sentence.length){
		return client.Call.disableRecording(body.callId)			//after '1' is pressed by the caller, stop recording
		.then(function (res) {										
			console.log(body);
			console.log(res);
			console.log("-----Recording disabled and ended----")
			return res;												
		})
		.catch(function(err){
			console.log("Recording not turned off, still running")
		});
	}	
```

When the last sentence is spoken, enable 'transcription' so all recordings can get transcribed

```javascript
	else if (body.eventType === "dtmf" && body.dtmfDigit === "1"){
		client.Call.hangup(body.callId)
		.then(function () {
			console.log("----Call has been hungup---")
		})
		.then(function(res){
			return client.Call.getRecordings(body.callId)
			.then(function (recordings) {
				console.log("-----Printing the list of Recordings----")
				console.log(recordings);
				console.log("-----Done Printing the list of Recordings----")
				var transcriptionIdPromises = [];
				if(recordings.length > 1){
					for(var i=1; i<recordings.length; i++){
						for(var j=0; j<i; j++){
							var hold = recordings[j];
							if(recordings[i].endTime<recordings[j].endTime){
								recording[i] = recording[j];
								for(var k = i; k<j+1; k--){
									recordings[k] = recordings[k-1];
								}
								recordings[j+1]=hold;
							}
							break;
						}
					}
				}
				for (var i=0; i < recordings.length; i++){
					var recordingId = recordings[i].id;
					var myTranscriptionPromise = client.Recording.createTranscription(recordingId);
					transcriptionIdPromises.push(myTranscriptionPromise)
				}
				return Promise.all(transcriptionIdPromises);
			})
			.then(function(listOfTranscriptionIds) {
				console.log("-----Printing the list of transcription ids----")
				for (var i = 0; i< listOfTranscriptionIds.length; i++) {
					console.log(listOfTranscriptionIds[i]);
				}
				console.log("-----Done Printing the list of transcription ids----")
			})
			.then(function(){
				console.log("----Printing list of transcriptions-----");
				for (var i = 0; i < recordings.length; i++){
					var recordingId = recordings[id].id;
					client.Recording.getTranscriptions(recordingId)
					.then(function(transcriptions){
					});
				}
			})
	
		})
		.catch(function(err){
			console.log("Call could not be hung up")
		});
	}
```

Now that we have the transcriptions, we want to be able to send them via text back to the caller.  First, create the methods to send a text message.

```javascript
	var messagePrinter = function (message){
	console.log('Using the message printer');
	console.log(message);
}

var sendMessage = function(params){
	return client.Message.send({
		from : params.from,
		to   : params.to,
		text : params.text
	})
	.then(function(message){
		messagePrinter(message);							//Print message sent
		return client.Message.get(message.id); 				//Get message id
	})
	.then(messagePrinter)						
	.catch(function(err){
		console.log(err);
	});
}
``` 

Finally, when the phone is hung up, use the text-messaging methods above to send the transcriptions to the caller. Add these else-if statements to the ones listed before.

```javascript
	else if(body.eventType === "hangup"){
		numbers.text = numbers.text + "\n Date: " + body.time;		
		sendMessage(numbers); 											
	}
	else if(body.direction === "out" && body.state === "sending"){
		numbers.text = "Would you like to send this transcript to the police? \n yes/no";
		sendMessage(numbers);
	}			
	else{																
		console.log(body);
		console.log("------Current State--------");
	}
});
```

