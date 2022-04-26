# MessageBox Deployment

Database initalization for mongodb on cmd.

mongo
use msboxdb
db.createCollection("forums")
db.createCollection("messages")
exit

Start Server and access MessageBox
In cmd, cd to the app folder and type the command: node server.js
(this will start the server)
In a browser go to http://localhost:1337/public/msgMain.html to 
access the app.