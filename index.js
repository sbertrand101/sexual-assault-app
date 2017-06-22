//------->>SEXUAL ASSAULT HELPLINE: +1336-593-6477<<--------

//CODE CHECKING:
//	-date(Is it in the body of all functions? All called date?), callerId
//	-data base for the global variables


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

var db = {};

app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));

app.get("/", function(req, res){				//at certain address, takes in request and response
	console.log(req);							//listening FOR a GET request at the '/' (root domain)
	res.send("SEXUAL ASSAULT HELPLINE");
});

var callerId;

app.post("/call-callback", function (req, result){

	var body = req.body;
	result.sendStatus(200); 						//letting the invoker sending the push request say 'we're good' 

	var numbers = {
	to   : callerId,
	from : "+13365936477"
	};

	if(body.eventType === "incomingcall"){
		callerId = body.from;
		db[body.callId] = {};
		db[body.callId].from = body.from;
		db[body.callId].recordings = [];
		console.log(db);
	}
	else if (body.eventType === "answer"){
		client.Call.speakSentence(body.callId, "If you believe you have been sexually assaulted, please give an account of what occured so we can transcribe the call. A transciription of the call will be sent to you when you hang up. Please answer the questions as descriptively as you can. Please state your full name, and a number to reach you by. When finished, please press 1.")
		.then(function (res) {
			console.log(body);
			console.log(res);
 			console.log("------Introduction sentence spoken----");
		})
		.catch(function (err){
			console.log(err);
			console.log("Couldn't speak intro sentence")
		});
	}

	else if (body.eventType === "speak" && body.state === "PLAYBACK_STOP"){
		client.Call.enableRecording(body.callId)
		.then(function (res) {
			console.log(body);
			var dbRecoding = {
				id: res.id,
				transcriptionId: undefined
			}
			db[body.callId].recordings.push(dbRecoding);
			console.log(db);
			console.log("---------Recording---------");
		})
		.catch(function(err){
			console.log(err);
			console.log("Wasn't able to start recording");
		});
	}

	else if (body.eventType === "dtmf" && body.dtmfDigit === "1"){
		return client.Call.disableRecording(body.callId)			//returns res
		.then(function (res) {										//res then get inputted into this anonymous function
			console.log(body);
			console.log(res);
			console.log("-----Recording disabled and ended----")
			return res;												//need to return res so it can be used in the .next function
		})
			// return client.Recording.createTranscription(res.recordingId)
			// .then(function(transcription){
			// 	console.log(res);
			// 	console.log("-----Transcribing-----");
			// })
			// .catch(function(err){
			// 	console.log("Sorry, something went wrong with the transcription");
			// });
		.catch(function(err){
			console.log("Recording not turned off, still running")
		});
	}
// 	else if (body.eventType === "dtmf" && body.dtmfDigit === "2"){
// 		client.Call.disableRecording(body.callId)
// 		.then(function (res) {
// //			console.log(res);
// 			console.log("-----Recording disabled and ended----")
// 		})
// 		.catch(function(err){
// 			console.log("Recording not turned off, still running")
// 		});
// 	}	
	else if (body.eventType === "recording" && body.state === "complete"){
		client.Recording.createTranscription(body.recordingId)
		.then(function(transcription){
			console.log("-----Transcribing-----");
		})
		.catch(function(err){
			console.log(err);
			console.log("Sorry, something went wrong with the transcription");
		});
	}
	else if(body.eventType === "transcription" && body.state === "completed"){
		numbers.text = numbers.text + body.text;										
//		sendMessage(numbers); 											//send transcription via text
//		console.log(callerId);
		console.log(body);
		console.log("----The transcribed text is written as follows----");
	}
	else if(body.eventType === "hangup"){
		numbers.text = numbers.text + "\n Date: " + body.time;										//+ "\n Date: " + date
		sendMessage(numbers); 											// to get the date and time for the text message
	}
	else if(body.direction === "out" && body.state === "sending"){
		numbers.text = "Would you like to send this transcript to the police? \n yes/no";
		sendMessage(numbers);
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

var sendMessage = function(params){
	return client.Message.send({
		from : params.from,
		to   : params.to,
		text : params.text
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


// Here be dragons
		// .then(function(res){
		// 	return client.Call.getRecordings(body.callId)
		// 	.then(function (recordings) {
		// 		console.log("-----Printing the list of Recordings----")
		// 		console.log(recordings);
		// 		console.log("-----Done Printing the list of Recordings----")
		// 		var transcriptionIdPromises = [];
		// 		for (var i=0; i < recordings.length; i++){
		// 			var recordingId = recordings[i].id;
		// 			var myTranscriptionPromise = client.Recording.createTranscription(recordingId);
		// 			transcriptionIdPromises.push(myTranscriptionPromise)
		// 		}
		// 		return Promise.all(transcriptionIdPromises);
		// 	})
		// 	.then(function(listOfTranscriptionIds) {
		// 		console.log("-----Printing the list of transcription ids----")
		// 		for (var i = 0; i< listOfTranscriptionIds.length; i++) {
		// 			console.log(listOfTranscriptionIds[i]);
		// 		}
		// 		console.log("-----Done Printing the list of transcription ids----")
			.then(function(){
				console.log("----Printing list of transcriptions-----");
				for (var i = 0; i < listofTranscriptionIds.length; i++)
					console.log()
			})

			client.Recording.getTranscriptions(recordingId).then(function(transcriptions){});
		// 	})







