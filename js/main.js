$("document").ready(function() {

// on page load, launch the modal box
var url = "http://ec2-54-200-30-78.us-west-2.compute.amazonaws.com:8080/#welcome";    
$(location).attr('href',url);

// now, let's do all the stuff with sockets and peerjs

//step 1
// when user clicks "Submit"
// they immediately get a peerjs id + a userid
// that data gets broadcast to everyone (send socket.id, peerjs.ip, userid)

//step 2
// when receiving the data of the new video connect
// find the user from their socket.id, update the client-side object (adding the peerjs id and the userid)
// then, replace the image on the page with the live video using their peerjs id

//socket controller

var socket = io.connect('http://ec2-54-200-30-78.us-west-2.compute.amazonaws.com:8080/');
var myvideo = null;
var mystream = null;
var mypeerid = null;
var userid = null;
var peer = null;
var videoUsers = [];

// now, handle all the video things

myvideo = document.getElementById('myVideo');

window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
if (navigator.getUserMedia) {

	// in the getUserMedia object, can set contraints/settings
	navigator.getUserMedia({video: true, audio: true}, function(stream) {
				mystream = stream;
				myvideo.src = window.URL.createObjectURL(stream) || stream;
				myvideo.play();
				var videoElement = document.getElementById('myVideo');
				videoElement.src = window.URL.createObjectURL(stream) || stream;
				videoElement.play();
			}, function(err) {
				console.log('Failed to get local stream' ,err);
				alert("Failed to get local stream " + err);
	});
}

	peer = new Peer({key: 'p3birrsf4cboi529'});

	peer.on('open', function(id) {
	  console.log('My peer ID is: ' + id);
	  mypeerid = id;
	});	

	peer.on('call', function(incomingCall) {
		console.log("got this!")
		incomingCall.answer(mystream);

		incomingCall.on('stream', function(remoteStream) {
	          
	          console.log("in answer");
	          console.log(incomingCall.peer);

		      var pid = incomingCall.peer;
			
			// to do this, we're going need to change their containerId to their peerjs id
			// so, we need to find their peerId based on their userid
			var currentUid; 
			var searchTerm = pid;
			var index = -1;
			for(var i = 0, len = videoUsers.length; i < len; i++) {
				console.log(videoUsers[i]);
				   if (videoUsers[i].pid === searchTerm) {
				   	console.log("found it! " + videoUsers[i])
				    index = i;
				    // now, let's remove them from the videoUsers array
				    currentUid = videoUsers[i].uid;
				    break;
				    }
			}

			$("#"+ currentUid).attr('id', pid);

			$("#" + pid +"> a > img").hide();

			  // Create the container for the new video to go in
			  var container = document.createElement('div');
			  var containerId = "videoContainer" + pid; 
			  container.setAttribute("id", containerId);
			  document.getElementById(pid).appendChild(container);

			$(container).html(
			    '<video width="85" height="85" id="video' + pid + '" >' +
			    '</video>');
		    
			// Show stream in some video/canvas element.
			
			var othervideo = document.getElementById("video"+pid);
				othervideo.src = window.URL.createObjectURL(remoteStream) || remoteStream;
				othervideo.play();

	    });					
	});

var sendmessage = function() {

	var data = {
		uid : userid,
		pid : mypeerid
	}

	// Send a messaage
	socket.emit('message', data);
};

var addUserVideo = function(newPeerId,newUserId) {

	var userId = newUserId;
	var peerId = newPeerId;

	console.log(userId);
	// now, let's create the video for the user, and hide the photo

	if(peerId != mypeerid){

		// first let's add the new user in the array so we can access all their information on the client side

		var userObj = {
			uid: newUserId,
			pid: newPeerId
		};

		videoUsers.push(userObj);
		console.log(videoUsers);
		var videoUsersNew = JSON.stringify(videoUsers);
		console.log(videoUsersNew);

		// to do this, we're going need to change their containerId to their peerjs id
		$("#"+ userId).attr('id', peerId);

		$("#" + peerId +"> a > img").hide();

		  // Create the container for the new video to go in
		  var container = document.createElement('div');
		  var containerId = "videoContainer" + peerId; 
		  container.setAttribute("id", containerId);
		  document.getElementById(peerId).appendChild(container);

		$(container).html(
		    '<video width="85" height="85" id="video' + peerId + '" >' +
		    '</video>');
	    

		//then we need place a call to them 
		var call = peer.call(peerId, mystream);
		console.log("got this here!");
		call.on('stream', function(remoteStream) {
			// Show stream in some video/canvas element.
			
				var othervideo = document.getElementById("video"+peerId);
				othervideo.src = window.URL.createObjectURL(remoteStream) || remoteStream;
				othervideo.play();

		});
	}

};

var removeUserVideo = function(userData) {

	var pid = userData.pid;
	var uid = userData.uid;
	// now that we know the peerId and userId, let's 1. remove them from the user array and 2. remove that users' video window and restoure their photo
	
	console.log(userData);

	var searchTerm = uid;
	var index = -1;
	for(var i = 0, len = videoUsers.length; i < len; i++) {
		   if (videoUsers[i].uid === searchTerm) {
		    index = i;
		    // now, let's remove them from the videoUsers array
			console.log("removing: " + videoUsers[i].uid);
		    videoUsers.splice(i,1);
		    break;
		    }
	}

	// remove their video			
	if ($("#videoContainer" + pid).length > 0) { 
	    $("#videoContainer" + pid).remove();
	    $("#" + pid +"> a > img").show();
	    // now, change their main container back to their userId
		$("#"+ pid).attr('id', uid);
	}
};

var showOwnVideo = function(userid){

	console.log("in showOwnVideo");
	$("#" + userid +"> a > img").hide();

	  // Create the container for the new video to go in
	  var container = document.createElement('div');
	  var containerId = "videoContainer" + userid; 
	  container.setAttribute("id", containerId);
	  document.getElementById(userid).appendChild(container);

	$(container).html(
	    '<video width="85" height="85" id="video' + userid + '" muted>' +
	    '</video>');

	var newvideo = document.getElementById("video"+userid);
		newvideo.src = window.URL.createObjectURL(mystream) || mystream;
		newvideo.play();

}
var sendother = function() {
	var othermessage = document.getElementById('message').value;
	console.log("sending: " + othermessage);
	
	// Send any kind of data with a custom event
	//socket.emit('otherevent',{ othermessage: othermessage });
	socket.emit('otherevent', othermessage);
};

//socket stuff

socket.on('connect', function() {
	console.log("Connected");

});

// Receive a message
socket.on('connection', function(data) {
	console.log(data);
	// set the users array to those already existing in socket.io
	videoUsers = data;
	console.log(videoUsers);
});

// Receive a message
socket.on('disconnect', function(data) {
	console.log(data);
	removeUserVideo(data);
});

// Receive a message
socket.on('message', function(data) {
	console.log("Got new user: " + data);

	var newPeerId = data.pid;
	var newUserId = data.uid;

	console.log(newPeerId + " " + newUserId)

	addUserVideo(newPeerId,newUserId);
});

// Receive from any event
socket.on('news', function (data) {
	console.log(data);
});

	$('#submitButton').click(function() {
		// first get the userId from the input
		userid = $( "input" ).val();
		console.log(userid);
		console.log(mypeerid);
	    sendmessage();
	    if(mystream != null){
	    	showOwnVideo(userid);
	    }
	});
});