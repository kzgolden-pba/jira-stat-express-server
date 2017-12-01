var config = require('./../config/local');

function previousSaturday(weeksAgo) {
    let now = new Date();
    let offset = (7 - 6 + now.getDay()) + (weeksAgo * 7);
    let date = new Date(); // saturday of last week
    date.setDate(date.getDate() - offset);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
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
function getStats(jira) {
    return jira.filter.getFilter({filterId: config.filterId})
        .then((data) => {
            return Promise.all([
                jira.greenHopper.getAllKanbanBoardData({boardId: config.boardId}),
                jira.search.search({jql: data.jql, maxResults: 1000})
            ]);
        })
        .then((data) => {
            let kanbanBoardData = populateStoryPoints(data[0], data[1]);
            let lastCol = kanbanBoardData.columnsData.columns.pop();
            let weeklyTixTotals = [];
            let weeklyPointTotals = [];
            let resObj = {};
            let attributes = {};
            
            attributes.weeks = 4;
            attributes.storiesWithoutPoints = 0;
            attributes.storiesWithPoints = 0;

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

            //resObj.averageCycleTime = calcAverageCycleTime(kanbanBoardData);
            
            attributes.totalSamplePoints = weeklyPointTotals.reduce((a, b) => { return a + b;});
            attributes.avgPoints = average(weeklyPointTotals);
            attributes.stdDevPoints = standardDeviation(weeklyPointTotals);
            attributes.totalTix = weeklyTixTotals.reduce((a, b) => { return a + b; });
            attributes.avgNoTixPerWeek = average(weeklyTixTotals);
            attributes.stdDeviationNoTix = standardDeviation(weeklyTixTotals);
            resObj.id = config.boardId;
            resObj.type = 'stat';
            resObj.attributes = attributes;
            return Promise.resolve(resObj);
        });
}

module.exports = getStats;
