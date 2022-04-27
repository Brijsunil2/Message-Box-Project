const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/js',
    'php': 'text/php'
}

var port = 1337;
var murl = "mongodb://localhost:27017/";
var mongo = require('mongodb');
var webSocketServer = require('websocket').server;
var http = require('http');
var fs = require('fs');
var url = require('url');
var clients = [];

/**
 * Create Server and Listening on port
 */
var server = http.createServer(function (req, resp) {
    var urlPar = url.parse(req.url, true);
    var filename = "." + urlPar.pathname;

    console.log(urlPar.pathname);

    fs.readFile(filename, function(error, data) {
        if (error) {
            resp.writeHead(404, {'Content-Type': 'text/html'});

            return resp.end("404 Not Found");
        } 

        var spl = filename.split('.');
        console.log(spl[2]);

        resp.writeHead(200, {'Content-Type': types[spl[2]] });
        resp.write(data);

        return resp.end();
    }); 
});

server.listen(port, function () {
    console.log("Server: " + (new Date()) + "Listening on port: " + port);
});


var wsServer = new webSocketServer({ httpServer: server });

wsServer.on('request', function (request) {
    var username = "";
    var currForum;
    console.log("Server: " + (new Date()) + "Connection from origin: " + request.origin);

    var conn = request.accept(null, request.origin);
    var clientIndex = clients.push(conn) - 1;

    console.log("Server: " + (new Date) + "Accepted connection from origin " + request.origin + ".");

    loadForums();

    conn.on('message', function (message) {

        var json = JSON.parse(message.utf8Data);

        if (json.type === 'username') {
            username = json.username;

        } else if (json.type === 'forumReq') {
            currForum = json.fid;
            forumReq(json.fid);

        } else if (json.type === 'forumCreate') {
            forumCreate(username, json.fname);

        } else if (json.type === 'forumMsg'){
            msgForum(username, currForum, json.msg);

        }
    });

    conn.on('close', function(conne) {
        console.log("Server: "+ (new Date()) + conne.remoteAddress + " has disconnected.");
        clients.splice(clientIndex, 1);
    }); 
    
    function loadForums() {
        var MongoClient = mongo.MongoClient;
        
        MongoClient.connect(murl, function(err, db) {
            if (err) throw err;

            var dbo = db.db("msboxdb");
            dbo.collection("forums").find({}).toArray(function(err, result) {
                if (err) throw err;

                var jsonMsg = JSON.stringify({ type: 'allForms', data: result });
                conn.sendUTF(jsonMsg);
                console.log(result);
                db.close();
            });
        });
    }

    function forumReq(id) {
        var MongoClient = mongo.MongoClient;
        
        MongoClient.connect(murl, function(err, db) {
            if (err) throw err;

            var dbo = db.db("msboxdb");

            dbo.collection("messages").find({ forumID: id }).toArray(function(err, result) {
                if (err) throw err;

                var jsonMsg = JSON.stringify({ type: 'forumReq', data: result });
                conn.sendUTF(jsonMsg);
                //console.log(result);
                db.close();
            });
        });
    }

    function forumCreate(username, fname) {
        var MongoClient = mongo.MongoClient;
       
        MongoClient.connect(murl, function(err, db) {
            if (err) throw err;

            var dbo = db.db("msboxdb");

            var date = new Date();
            var myobj = { name: fname , username: username , fDateTime: date.toString() };
            dbo.collection("forums").insertOne(myobj, function(err, res) {
                if (err) throw err;
                
                var arr = [myobj];
                dbo.collection("forums").find(myobj).toArray(function(err, result) {
                    var jsonMsg = JSON.stringify({ type: 'forumCreate', data: arr });
                    for (var i=0; i < clients.length; i++) {
                        clients[i].sendUTF(jsonMsg);
                    }
                });

                console.log(myobj);
                db.close();
            });
        });
    }

    function msgForum(username, Forumid, message) {
        var MongoClient = mongo.MongoClient;
       
        MongoClient.connect(murl, function(err, db) {
            if (err) throw err;

            var dbo = db.db("msboxdb");

            var date = new Date();
            var myobj = { username: username, forumID: Forumid, message: message, dateTime: date.toString() };
            dbo.collection("messages").insertOne(myobj, function(err, res) {
                if (err) throw err;

                var arr = [myobj];
                var jsonMsg = JSON.stringify({ type: 'forumMsg', data: arr });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(jsonMsg);
                }

                console.log(myobj);
                db.close();
            });
        });
    }
});

