var config = require('./../config/local');

function pareColumnData(columns) {
    return columns.map(column => {
        return {
            columnId: column.id,
            name: column.name,
            statusIds: column.statusIds,
        }
    });
}

function pareSwimlaneData(swimlanes) {
    return swimlanes.map(swimlane => {
        return {
            swimlaneId: swimlane.id,
            name: swimlane.name,
            jqlQuery: swimlane.query,
            issuesInSwimlane: swimlane.issueIds
        }
    });
}

function getBoardElements(jira, id) {
    return jira.filter.getFilter({filterId: config.filterId})
        .then((data) => {
            return jira.greenHopper.getAllKanbanBoardData({boardId: id});
        })
        .then((data) => {
            let resObj = {};
            let attributes = {
                columns: pareColumnData(data.columnsData.columns),
                swimlanes: pareSwimlaneData(data.swimlanesData.customSwimlanesData.swimlanes),
                issuesOnBoard: data.issuesData.issues.length
            };

            resObj.boardId = id;
            resObj.type = 'info';
            resObj.attributes = attributes;
            return Promise.resolve(resObj);
        });
}

module.exports = getBoardElements;
