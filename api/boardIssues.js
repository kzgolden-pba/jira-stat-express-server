const config = require('./../config/local');
const buildIssueUrl = require('./../util/jiraUrls').buildIssueUrl;

function getIssues(jira, opts) {
    let ids = opts.ids;
    let jql = 'id in (' + ids.join() + ')';
    return jira.search.search({jql: jql, maxResults: ids.length, fields: [config.storyPointFieldName, config.targetVersionFieldName, 'summary', 'rank']})
        .then((data) => {
            let issueDataList = data.issues.map((issue) => {
                return issueData = {
                    id: issue.id,
                    type: 'board-issue',
                    attributes: {
                        url: buildIssueUrl(issue.key),
                        key: issue.key,
                        storyPoints: issue.fields[config.storyPointFieldName],
                        targetVersions: issue.fields[config.targetVersionFieldName],
                        summary: issue.fields.summary
                    }
                };
            });
            return Promise.resolve(issueDataList);
        });
}

function getBoardIssues(jira, boardId) {
    let issueIdList = [];
    return jira.greenHopper.getAllKanbanBoardData({boardId: boardId})
        .then((data) => {
            data.swimlanesData.customSwimlanesData.swimlanes.forEach((swimlane) => {
                issueIdList = issueIdList.concat(swimlane.issueIds);
            });
            return getIssues(jira, {ids: issueIdList});
        })
        .then((data) => {
            return data.sort((a, b) => {
                return issueIdList.indexOf(parseInt(a.id, 10)) < issueIdList.indexOf(parseInt(b.id, 10)) ? -1 : 1;
            });
        });
}
module.exports = getBoardIssues;