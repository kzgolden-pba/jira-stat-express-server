var config = require('./../config/local');

function resetTime(date){
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
}

function previousSaturday(weeksAgo) {
    let now = new Date();
    let offset = (7 - 6 + now.getDay()) + (weeksAgo * 7);
    let date = new Date(); // saturday of last week
    date.setDate(date.getDate() - offset);
    return resetTime(date);
}

function monday() {
    let now = new Date();
    let day = now.getDay();
    let diff = now.getDate() - day + (day == 0 ? -6:1);
    let monday = new Date(now.setDate(diff));
    return resetTime(monday);
}

function friday() {
    let now = new Date();
    let day = now.getDay();
    let diff = now.getDate() + (12 - now.getDay()) % 7;
    let friday = new Date(now.setDate(diff));
    return resetTime(friday);
}

function standardDeviation(values){
  var avg = average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function populateStoryPoints(kanbanBoardData, searchData) {
    kanbanBoardData.issuesData.issues.forEach((issue) => {
        let matchedIssue = searchData.issues.find((searchIssue) => {
            return parseInt(searchIssue.id, 10) === issue.id;
        });
        issue.storyPoints = matchedIssue && matchedIssue.fields[config.storyPointFieldName];
        issue.storyPoints = (issue.storyPoints && issue.storyPoints != '') ? parseInt(issue.storyPoints,10) : 0;
    });

    return kanbanBoardData;
}

function getPoints(issues){
    return issues.map(issue => {
        return issue.storyPoints;
    }).reduce((total, amt) => total + amt);
}

function filterByStatusId(issues, filterIds){
    return issues.filter(issue => {
        return filterIds.includes(issue.statusId);
    });
}

function closedCurrentWeek(kanbanBoardData, lastColIds) {
    let closedIssues = filterByStatusId(kanbanBoardData.issuesData.issues, lastColIds);

    let issuesClosedCurrentWeek = closedIssues.filter(issue => {
        return issue.timeInColumn.enteredStatus > monday() && issue.timeInColumn.enteredStatus < friday();
    });

    return {
        issues: issuesClosedCurrentWeek,
        issueTotal: issuesClosedCurrentWeek.length,
        points: getPoints(issuesClosedCurrentWeek),
    };
}

function getInProgress(kanbanBoardData, boardColumns) {
    let inProgressIds = boardColumns.filter(column => {
        return config.workingColumnIds.includes(column.id);
    }).map(column => {
        return column.statusIds;
    }).reduce((arr1, arr2) => arr1.concat(arr2));

    let inProgressIssues = filterByStatusId(kanbanBoardData.issuesData.issues, inProgressIds);

    return {
        ids: inProgressIds,
        issues: inProgressIssues,
        issueTotal: inProgressIssues.length,
        points: getPoints(inProgressIssues),
    };
}

function getStats(jira, id) {
    return jira.filter.getFilter({filterId: config.filterId})
        .then((data) => {
            return Promise.all([
                jira.greenHopper.getAllKanbanBoardData({boardId: id}),
                jira.search.search({jql: data.jql, maxResults: 1000})
            ]);
        })
        .then((data) => {
            data.push(jira.greenHopper.getControlChart({
                boardId: id,
                swimLaneIdList: data[0].swimlanesData.customSwimlanesData.swimlanes.map(function(swimLane) {
                    return swimLane.id;
                })
            }));
            return data;
        })
        .then((data) => {
            let kanbanBoardData = populateStoryPoints(data[0], data[1]);
            let boardColumns = kanbanBoardData.columnsData.columns;
            let inProgress = getInProgress(kanbanBoardData, boardColumns);
            let lastCol = boardColumns.pop();
            let lastColIds = lastCol.statusIds;
            let issuesClosedCurrentWeek = closedCurrentWeek(kanbanBoardData, lastColIds);
            let weeklyTixTotals = [];
            let weeklyPointTotals = [];
            let resObj = {};
            let attributes = {};


            attributes.weeks = 4;
            attributes.storiesWithoutPoints = 0;
            attributes.storiesWithPoints = 0;
            attributes.currentWeekPts = issuesClosedCurrentWeek.points;
            attributes.currentWeekTix = issuesClosedCurrentWeek.issueTotal;
            attributes.inProgressPts = inProgress.points;
            attributes.inProgressTix = inProgress.issueTotal;
            attributes.inProgressIds = inProgress.ids;

            for(let i = 0; i < attributes.weeks; i++) {
                let tix = kanbanBoardData.issuesData.issues.filter((issue) => {
                    return lastCol.statusIds.indexOf(issue.statusId) > -1 && issue.timeInColumn.enteredStatus < previousSaturday(i) && issue.timeInColumn.enteredStatus > previousSaturday(i + 1);
                });
                weeklyPointTotals.push(tix.reduce((a, ticket) => { return a + ticket.storyPoints;}, 0));
                weeklyTixTotals.push(tix.length);
                tix.forEach((ticket) => {
                    if(ticket.storyPoints > 0) {
                        attributes.storiesWithPoints += 1;
                    } else {
                        attributes.storiesWithoutPoints += 1;
                    }
                });
            }

            attributes.totalSamplePoints = weeklyPointTotals.reduce((a, b) => { return a + b;});
            attributes.avgPoints = average(weeklyPointTotals);
            attributes.stdDevPoints = standardDeviation(weeklyPointTotals);
            attributes.totalTix = weeklyTixTotals.reduce((a, b) => { return a + b; });
            attributes.avgNoTixPerWeek = average(weeklyTixTotals);
            attributes.stdDeviationNoTix = standardDeviation(weeklyTixTotals);
            attributes.closedIds = lastColIds;
            resObj.id = config.boardId;
            resObj.type = 'stat';
            resObj.attributes = attributes;
            return Promise.resolve(resObj);
        });
}

module.exports = getStats;
