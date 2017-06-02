//------->>NUMBER TO CALL: +13365936477

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

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));

app.get("/", function(req, res){				//at certain address, takes in request and resposne
	console.log(req);
	res.send("SEXUAL ASSAULT HELPLINE");
});

var text;
var date;
var callerId;
app.post("/call-callback", function (req, res){
	var body = req.body;
	res.sendStatus(200); 

	var numbers = {
	to   : callerId, 
	from : "+13365936477"
	};

	if (body.eventType === "answer"){
		client.Call.speakSentence(body.callId, "If you believe you have been sexually assaulted, please give an account of what occured so we can transcribe the call. A transciription of the call will be sent to you when you hang up. Please begin.")
		.then(function (res) {
			console.log(body);
			console.log("------Introductory message sent----");
			
		})
		.catch(function (err){
			console.log(err);
		});
	}
	else if (body.eventType === "speak" && body.state === "PLAYBACK_STOP"){
		client.Call.enableRecording(body.callId)
		.then(function (recording) {
			console.log(body);
			console.log("--------Recording-------");
		})
		.catch(function(err){
			console.log("Can't record numnuts");
			console.log(err);
		});
	}
	else if (body.eventType === "recording" && body.state === "complete"){
		client.Recording.createTranscription(body.recordingId)
		.then(function(transcription){
			console.log("----Transcribing-----");
		})
		.catch(function(err){
			console.log("Sorry, something went wrong with the transcription");
		});
	}
	else if(body.eventType === "transcription" && body.state === "completed"){
		text = body.text + "\n Date: " + date;
		sendMesage(numbers); //send transcription via text
		console.log(callerId);
		console.log(body);
		console.log("----The transcribed text is written as follows----");
	}
	else if(body.eventType === "hangup"){
		date = body.time; // to get the date and time for the text message
	}
	else if(body.direction === "out" && body.state === "sending"){
		text = "Would you like to send this transcript to the police? \n yes/no";
		sendMesage(numbers);
	}
	else if(body.eventType === "incomingcall"){
		callerId = body.from;
	}
	else{
		console.log(body);
		console.log("------JUST PRINTED BODY--------");
	}
});


var messagePrinter = function (message){
	console.log('Using the message printer');
	console.log(message);
}

var sendMesage = function(params){
	return client.Message.send({
		from : params.from,
		to   : params.to,
		text : text
	})
	.then(function(message){
		messagePrinter(message);				//print message sent
		return client.Message.get(message.id); 	//get message id
	})
	.then(messagePrinter)						//else, print error message
	.catch(function(err){
		console.log(err);
	});
}


http.listen(app.get('port'), function(){
	console.log('listening on *:' + app.get('port'));
});










