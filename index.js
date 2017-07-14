'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuidv4 = require('uuid/v4');
const apiai = require('apiai');
const _ = require('lodash');
const moment = require('moment');
const apiaiCli = apiai(process.env.API_AI_CLIENT_TOKEN);
const userSessions = {};

io.on('connection', function(socket) {
  const uuid = uuidv4();
  userSessions[uuid] = {  };
  console.log('New Connection with ID: ', uuid);
  socket.emit('connection', 'You are connected.');

  socket.on('message', function(message) {
    console.log("Outputting : message received", message);
    const request = apiaiCli.textRequest(message, {
        sessionId: uuid
    });
    request.on('response', function(response) {
        console.log('response from Algorithm', response);
        const message = consumePayload(response);
        console.log("Outputting : message", message);
        socket.emit('message', message);
    });
    request.on('error', function(error) {
        socket.emit('message', 'There was an error in the backend..');
        throw error;
    });
    request.end();
  });

});

function consumePayload(payload) {
  const intent = _.get(payload, 'result.metadata.intentName');
  const id = _.get(payload, 'id');
  const batchId = uuidv4();
  const sessionId = _.get(payload, 'sessionId');

  console.log("Outputting : intent", intent, " sessionId: "+sessionId+" current value:", );

  if (intent === 'Summary') {
    return {
      intent: 'summary',
      batchId,
      id,
      message: {
        actions: [

        ],
        body: 'Hello'
      }
    }
  }
}

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.post('/webhook', function(req, res) {
  console.log(req.originalUrl); // '/admin/new'
  console.log(req.baseUrl); // '/admin'
  console.log(req.path); // '/new'
  console.log(req.query); // '/new'
  console.log('req.body', req.body);
});

app.get('/', function(req, res) {
    res.render('index.html');
});

http.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
