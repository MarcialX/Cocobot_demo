var express = require('express');  
var bodyParser = require('body-parser');  
var request = require('request');  
var app = express();

app.use(bodyParser.urlencoded({extended: false}));  
app.use(bodyParser.json());  
app.listen((process.env.PORT || 5000));

// Server frontpage
app.get('/', function (req, res) {  
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {  
    if (req.query['hub.verify_token'] === cocobot_demo) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
    res.send('This is TestBot Server');
});