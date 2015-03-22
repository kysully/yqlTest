// Create the angular app and inject the ngRoute module
var app = angular.module("yqlTest", ["ngRoute"]);

// Setup the routes used for the singlepage app
app.config(["$routeProvider", "$locationProvider", 
  function($routeProvider, $locationProvider) {
    $routeProvider.when("/home", {
      templateUrl: "/html/home.html",
      controller: "HomeController"
    }).otherwise({
      redirectTo: "/home"
    });
}]);

// Connect to the server using socket.io
var socket = io.connect();
var symbol = "";
var userName;

// This controller controls the Home screen
app.controller("HomeController", ["$scope", "$location",
  function($scope, $location) {

    $scope.posts = [];
    socket.emit("posts_request");

    // Function called when a player wishes to join a game
    $scope.getData = function() {
      symbol = $scope.stockName;
      console.log("Clicked the button");
      //console.log("Joining a game as " + userProps.getUser().name);
      socket.emit("stockSearch", symbol);
    };

    $scope.newUser = function() {
      requestedUsername = $scope.userName;
      socket.emit("newUser", requestedUsername);
      userName = requestedUsername;
    }

    $scope.newPost = function() {
      postName = $scope.postName;
      if (userName){
        socket.emit("newPost", {"userName": userName, "postName": postName}); // OTHER POST INFO HERE
      }
      else {
        console.log ("User not logged in");
      }
    }

    socket.on("post", function(post){
      console.log("Received Post");
      $scope.posts.push(post);
      $scope.$apply();
    });

    socket.on("stockFound", function(price) {
      //console.log(userInfo.gameID);
      console.log("The price of this stock is " + price);
      $scope.price = price;
      $scope.$apply();
    });

    socket.on("newUserResponse", function(response){
      $scope.userNameResponse = response;
      $scope.$apply();
      if (response == "error"){
        console.log("Error occured");
      }
      else if (response == "created"){
        console.log("User created");
      }
      else if (response == "userAlreadyExists"){
        console.log("User already exists");
      }
    });
  }
]);