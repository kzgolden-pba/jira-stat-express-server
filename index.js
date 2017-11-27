var JiraClient = require('jira-connector');
var config = require('./config/local');
var Promise = require("bluebird");
var stats = require("./api/stats");

var jira = new JiraClient({
    host: config.host,
    port: config.port,
    protocol: config.protocol,
    basic_auth: {
        base64: config.creds
    },
    promise: Promise
});

if(config) {
    stats(jira).then((data) => {
        console.log(data);
    });
} else {
    console.error('You must create a ./config/local.js file. See ./config/example.js for example');
}
