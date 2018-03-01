const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const JiraClient = require('jira-connector');
const config = require('./config/local');
const Promise = require('bluebird');
const boardElements = require('./api/boardElements');
const stats = require('./api/stats');
const boardIssues = require('./api/boardIssues');
const apiCache = require('apicache').middleware;
const closedBugs = require('./api/closedBugs');

var jira = new JiraClient({
    host: config.host,
    port: config.port,
    protocol: config.protocol,
    basic_auth: {
        base64: config.creds
    },
    promise: Promise
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/api/stats/:boardId', apiCache('12 hours'), (req, res) => {
    stats(jira, req.params.boardId).then((data) => {
        res.jsonp({data:data});
    });
});

app.get('/api/boardElements/:boardId', (req, res) => {
    boardElements(jira, req.params.boardId).then((data) => {
        res.jsonp({data:data});
    });
});

app.get('/api/boardIssues', (req, res) => {
    boardIssues(jira, req.query.boardId).then((data) => {
      res.jsonp({data:data});
    });
});

app.get('/api/closedBugs', (req, res) => {
    closedBugs(jira, req.query.start, req.query.end).then((data) => {
        res.send(data);
    });
});

app.listen(3000, () => console.log('Listening on port 3000'));
    