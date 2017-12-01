const config = require('./../config/local');

function getIssues(jira, opts) {
    let ids = opts.ids;
    let jql = 'id in (' + ids.join() + ')';
    return jira.search.search({jql: jql, maxResults: ids.length, fields: [config.storyPointFieldName, config.targetVersionFieldName, 'summary']})
        .then((data) => {
            let issueDataList = [];
            data.issues.forEach((issue) => {
                let issueData = {
                    id: issue.id,
                    type: 'issue',
                    attributes: {
                        url: issue.self,
                        key: issue.key,
                        storyPoints: issue.fields[config.storyPointFieldName],
                        targetVersions: issue.fields[config.targetVersionFieldName],
                        summary: issue.fields.summary
                    }
                };
                issueDataList.push(issueData);
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
            console.log(issueIdList);
            return getIssues(jira, {ids: issueIdList});
        })
        .then((data) => {
            return data.sort((a, b) => {
                return issueIdList.indexOf(parseInt(a.id, 10)) < issueIdList.indexOf(parseInt(b.id, 10)) ? -1 : 1;
            });
        });
}
module.exports = getBoardIssues;