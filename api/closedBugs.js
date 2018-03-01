const buildIssueUrl = require('../util/jiraUrls').buildIssueUrl;
const Json2csvParser = require('json2csv').Parser;

function getIssues(jira, start, end) {
    let jql = 'project in (RET) AND type = Bug AND status = closed AND status changed to closed after ' + start + ' AND status changed to closed before ' + end + '  AND "SalesForce Case Number" is not EMPTY';
    return jira.search.search({jql: jql, maxResults: 1000, fields: ['key', 'summary', 'priority','resolution', 'resolutiondate', 'created']});
}
module.exports = function(jira, start, end) {
    return getIssues(jira, start, end).then((data) => {

        let issueDataMapping = data.issues.map((issue) => {
            return {
                key: issue.key,
                link: buildIssueUrl(issue.key),
                resolutionStatus: issue.fields.resolution.name,
                summary: issue.fields.summary,
                createdDate: issue.fields.created,
                resolutionDate: issue.fields.resolutiondate,
                priority: issue.fields.priority && issue.fields.priority.name
            };
        });
        let parser = new Json2csvParser({fields: ['key', 'link', 'resolutionStatus', 'priority', 'summary','createdDate','resolutionDate'], delimiter: '\x09'});
        return Promise.resolve(parser.parse(issueDataMapping));
//        return Promise.resolve(data);
    });
};

