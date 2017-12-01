const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const JiraClient = require('jira-connector');
const config = require('./config/local');
const Promise = require('bluebird');
const stats = require('./api/stats');
const boardIssues = require('./api/boardIssues');

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

app.get('/api/stats', (req, res) => {
    stats(jira).then((data) => {
        res.jsonp({data:[data]});
    });
});

app.get('/api/boardIssues/:id', (req, res) => {
  boardIssues(jira, req.params.id).then((data) => {
    res.jsonp(data);
  });
});

app.listen(3000, () => console.log('Listening on port 3000'));
