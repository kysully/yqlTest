// Import all necessary NodeJS modules
var YQL = require('yql');
    http = require('http');
    path = require('path');
    socketio = require('socket.io');
    express = require('express');
    colors = require("colors/safe");
    mysql = require('mysql');

var databaseUrl = "mydb"; // "username:password@example.com/mydb"
var collections = ["users", "posts"]
var db = require("mongojs").connect(databaseUrl, collections);
var userList = db.collection('users');
var postList = db.collection('posts');
userList.find(function(err, docs) {
  console.log(docs); // Could error check
});
//userList.insert({"id": 1, "username": "ken"});

    // Start express, the server, and socket.io
var router = express();
    server = http.createServer(router);
    io = socketio.listen(server);

/*
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
*/

// Wraps a post into a JSON object. Only contents and username required. 
function wrapPost(content, username, upvotes, downvotes, date, comments){
  console.log("Wrap Post content is " + content);
  if (comments === undefined){
    comments = [];
  }
  if (upvotes === undefined){
    upvotes = 0;
  }
  if (downvotes === undefined){
    downvotes = 0;
  }
  if (date === undefined){
    date = new Date(); // Not entirely sure this will work
  }
  return {"content": content, "username": username, "date": date, 
  "upvotes": upvotes, "downvotes": downvotes, "comments": comments};
}

// Function to call when adding a user adds a post
// NOT TESTED (because I haven't decided what postData is yet)
// Currently just alters userList to reflect post history
// Assumes postData has at least a username and is in JSON format
function addPost(postData){
  var post = wrapPost(postData.postName, postData.username);
  console.log(post);
  console.log(post.username);
  var mongoQuery = {"username": postData.username};
  userList.update(
    mongoQuery, // Get the right username
    {
      $push: {"posts": post} // Add the post to this users posts
    }
  );
  postList.insert(post); // Add the post to the posts database
  /*
  userList.find({"username": postData.username}, function(err, docs) {
    console.log(docs[0].posts);
  });
  
  postList.find(function(err, docs) {
    console.log(docs);
  });
*/
}

// Sends literally all the posts
// If our database were to get big, this is a terrible idea
function sendPosts(socket){
  var posts = postList.find();
  posts.forEach(function(err, doc) {
    socket.emit("post", doc);
    console.log("sent post " + doc);
  });
}

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
  
  socket.on("posts_request", function(){
    sendPosts(socket);
  });

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

  socket.on("newUser", function(username){
    //var sql = "SELECT * FROM usernames WHERE Username = " + username;
    console.log("New user with requested user name " + username);
    var mongoQuery = {"username": username};
    userList.find(mongoQuery, function(err, docs){
      if (err) {
        console.log(err);
        socket.emit("newUserResponse", "error");
      }
      else {
        if (docs.length !== 0){
          console.log("User already exists");
          socket.emit("newUserResponse", "userAlreadyExists");
        }
        else {
          console.log("Create user here");
          userList.insert({"username": username});
          console.log("User " + username + " created");
          socket.emit("newUserResponse", "created");
        }
      }
    });
  });

/*
  socket.on("login", function(username){
    var sql = "SELECT * FROM usernames WHERE Username = " + username;
    db.query(sql, function(err, docs){
      if (err) {
        console.log(err);
      }
      else {
        if (docs.length !== 0){
          console.log("User did not exist");
        }
        else {
          console.log("User " + username + "logged in");
        }
      }
    });
  });
*/

  socket.on("newPost", function(postData){
    console.log("Received new post request");
    addPost(postData);
    socket.emit("post", postData);
    // newPost logic to go here
  });

  socket.on("newComment", function(commentData){

  });

});

// Start the server (taken from Andy which is taken from Cloud9)
server.listen(process.env.PORT || 3200, process.env.IP || "0.0.0.0", function() {
  var address = server.address();
  console.log("Server is now started on ", address.address + ":" + address.port);
});