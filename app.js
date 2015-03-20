// Import all necessary NodeJS modules
var YQL = require('yql');
    http = require('http');
    path = require('path');
    socketio = require('socket.io');
    express = require('express');
    colors = require("colors/safe");
    mysql = require('mysql');

    // Start express, the server, and socket.io
var router = express();
    server = http.createServer(router);
    io = socketio.listen(server);

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Skywalker21',
    database: 'node'
});

db.connect(function(err){
    if (err){ console.log(err);}
});

var sql = "SELECT * FROM notes WHERE id = 100";
db.query(sql, function(err, results){
  if (err) {
    console.log(err);
  }
  else {
    if (results.length !==0){
      console.log(results);
    }
    else {
      console.log("No results");
    }
  }
});

// Quick example on how to query with QYL
new YQL.exec('select * from yahoo.finance.quote where symbol in ("YHOO","AAPL","GOOG","MSFT")', function(response) {

  if (response.error) {
    console.log("Example #1... Error: " + response.error.description);
  }
  else {
        var symbol  = response.query.results.quote[0].symbol;
        console.log("First symbol is " + symbol);
  }
});

// Set the static file path to the public directory
router.use(express.static(path.resolve(__dirname, "public")));

// Catch anything that tries to connect to the server and serve up the single
// page app located at public/index.html
router.get("/*", function(req, res) {
  res.sendFile(path.resolve(__dirname, "public/html/index.html"));
});

// Catch anything that might want to see all of the components that way in case 
// we need to change the above route this still prvents people from peeking
router.get("/components/*", function(req, res) {
  res.sendFile(path.resolve(__dirname, "public/index.html"));
});

//*** SOCKET IO STUFF ***//
// Begin the socket.io logic
// connection event is called for every new client thus this code occurs once for
// each client
io.sockets.on("connection", function(socket) {
  console.log("New client from " + colors.green(socket.request.connection.remoteAddress));

  socket.on("stockSearch", function(symbol){
    console.log (colors.green(socket.request.connection.remoteAddress) + " wants stock " + symbol);
    new YQL.exec('select * from yahoo.finance.quote where symbol in ("'+symbol+'")', function(response) {

      if (response.error) {
        console.log("Stock Search Error: " + response.error.description);
      }
      else {
        //console.log(response.query.results);
        var price  = response.query.results.quote.LastTradePriceOnly;
        console.log("Requested stock's price is " + price);
        socket.emit("stockFound", price);
      }
    });
  });

  socket.on("newUser", function(userName){
    var sql = "SELECT * FROM usernames WHERE Username = " + userName;
    db.query(sql, function(err, results){
      if (err) {
        console.log(err);
      }
      else {
        if (results.length !==0){
          console.log("User already exists");
        }
        else {
          console.log("Create user here");
        }
      }
    });
  });

  socket.on("login", function(userName){
    var sql = "SELECT * FROM usernames WHERE Username = " + userName;
    db.query(sql, function(err, results){
      if (err) {
        console.log(err);
      }
      else {
        if (results.length !==0){
          console.log("User did not exist");
        }
        else {
          console.log("User " + userName + "logged in");
        }
      }
    });
  });

});

// Start the server (taken from Andy which is taken from Cloud9)
server.listen(process.env.PORT || 3200, process.env.IP || "0.0.0.0", function() {
  var address = server.address();
  console.log("Server is now started on ", address.address + ":" + address.port);
});