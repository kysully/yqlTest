# YQL Test
This is a simple app that can be used to get current stock prices using yahoo finance data and the yahoo query language. It will also implement a user database, so that eventually a trading simulation can be run. 

This app will use a NodeJS server that is running express and socket.io to listen to HTTP requests and open up channels between clients and the server. For the frontend of the application will use AngularJS, to display pages in a single-page app.

* * *

### Installation

To run this application clone the repo to the machine you wish to run it on and then run `npm install` followed by `bower install` (install bower using `npm install -g bower`) to install all necessary NodeJS libraries and static dependencies. Then simply run `node app.js` to start the server.

* * * 

### TO DO:
* Implement a server-side mongo db
* Flesh out the querying from YQL
* Design a user "game" screen (ugh css)