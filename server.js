// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
httpServer.listen(8080);

function requestHandler(req, res) {
	// Read index.html
	fs.readFile(__dirname + '/index.html', 
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
}


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);
var videoUsers = new Array ();

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {
	
		console.log("We have a new client: " + socket.id);

		//let's first send them an array of all current users

		// To all clients, on io.sockets instead
		io.sockets.emit('connection', videoUsers);	

		// When this user "send" from clientside javascript, we get a "message"
		// client side: socket.send("the message");  or socket.emit('message', "the message");
		socket.on('message', 
			// Run this function when a message is sent
			function (data) {
				console.log("message: " + data);
				
				// lets add them to the videoUsers array, now that know they are part of the video
				// we will create an object of their socket.io id, their userid, and their peerhjs id

				var userid = data.uid;
				var peerid = data.pid;

				var userObj = {
					sid: socket.id,
					uid: userid,
					pid: peerid
				};

    			videoUsers.push(userObj);

				// To all clients, on io.sockets instead
				io.sockets.emit('message', data);
			}
		);
		
		// When this user emits, client side: socket.emit('otherevent',some data);
		socket.on('otherevent', function(data) {
			// Data comes in as whatever was sent, including objects
			console.log("Received: 'otherevent' " + data);
		});
		
		
		socket.on('disconnect', function() {
			console.log("Client has disconnected");


			var searchTerm = socket.id;
    		var index = -1;
			for(var i = 0, len = videoUsers.length; i < len; i++) {
 			   if (videoUsers[i].sid === searchTerm) {
    			    index = i;
    			    	//let's let everyone know who the disconnecting user is!
						var data = videoUsers[i];
						io.sockets.emit('disconnect', data);
    			    // now, let's remove them from the videoUsers array
    			    videoUsers.splice(i,1);
					console.log("disconnected/removed: " + socket.id);
    			    break;
  			    }
			}
		});
	}
);