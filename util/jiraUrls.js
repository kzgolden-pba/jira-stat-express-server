const config = require('./../config/local');

module.exports.buildIssueUrl = function(issueKey) {
    return config.protocol + '://' + config.host + '/browse/' + issueKey;
}