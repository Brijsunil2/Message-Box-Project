$(document).ready(function() {
    var nameInput = $('#nameIn');
    var createBtn = $('#createBtn');
    var forumTb = $('#forumTbb');
    var forumNameH = $('#forumNameH');
    var forumMsgArea = $('#forumMsgArea');
    var enterMsgArea = $('#enterMsgArea');
    var sendBtn = $('#sendBtn');
    var allMsgArea = $('#allMsgArea');
    var msgReff;
    var currForum;

    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var conn = new WebSocket('ws://127.0.0.1:1337');

    conn.onopen = function () {
        console.log("Client: Connection has been opened.");
        do {
            var username = prompt("Enter a username", "");
        } while (username === "");

        var jsonStr = JSON.stringify({type: 'username', username: username});

        conn.send(jsonStr);
    };

    conn.onerror = function (error) {
        console.log("Client: Connection error.");
    }

    conn.onmessage = function (message) {
        try {
            var jsonMsg = JSON.parse(message.data);

        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            alert('Error');
            return;
        }

        if (jsonMsg.type === 'allForms') {
            msgReff = jsonMsg.data;
            for (var i=0; i < jsonMsg.data.length; i++) {
                addToTable(jsonMsg.data[i].username, jsonMsg.data[i].name, jsonMsg.data[i].fDateTime);
            }

        } else if (jsonMsg.type === 'forumReq') {
            forumMsgArea.show();
            allMsgArea.empty();

            for (var i=0; i < jsonMsg.data.length; i++) {
                addMessage(jsonMsg.data[i].username, jsonMsg.data[i].dateTime, jsonMsg.data[i].message);
            }

        } else if (jsonMsg.type === 'forumCreate') {
            msgReff.push(jsonMsg.data[0]);
            addToTable(jsonMsg.data[0].username, jsonMsg.data[0].name, jsonMsg.data[0].fDateTime);

        } else if (jsonMsg.type === 'forumMsg') {
            if (currForum === jsonMsg.data[0].forumID) {
                addMessage(jsonMsg.data[0].username, jsonMsg.data[0].dateTime, jsonMsg.data[0].message);
            }
        }
    }

    sendBtn.click(function() {
        var usrMsg = enterMsgArea.val();

        if (usrMsg !== "") {
            conn.send(JSON.stringify({ type: "forumMsg", msg: usrMsg }));
        } 

        enterMsgArea.val('');
    });


    forumTb.on('click', 'tr', function () {
        var fid = msgReff[$(this).index()]._id;
        currForum = fid;

        conn.send(JSON.stringify({ type: 'forumReq', fid: fid }));
        forumNameH.text(msgReff[$(this).index()].name);
    });

    createBtn.click(function() {
        var fname = nameInput.val();

        if (fname !== "") {
            conn.send(JSON.stringify({ type: 'forumCreate', fname: fname}));
        }

        nameInput.val('')
    });

    function addToTable(username, name, date) {
        forumTb.append('<tr>'
            + '<td>' + username +'</td>'
            + '<td>' + name + '</td>'
            + '<td>' + date +'</td></tr>');
    }

    function addMessage(username, dateTime, message) {
        var msg = message.replace(/\n/g, "<br />");
        allMsgArea.prepend('<h4>'
            + username + ' - ' + dateTime + '</h4>'
            + '<p>' + msg + '</p>' +'<hr>');
    }
});
