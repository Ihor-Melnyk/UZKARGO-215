function onTaskExecuteMainTask(routeStage) {
  debugger;
  if (routeStage.executionResult == "rejected") {
    setHiddenReg();
  }
}

function setHiddenReg() {
  controlHidden("RegDate");
  controlHidden("RegNumber");
}

function SendOutDocTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;

  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated" || stateTask == "completed") {
    controlHidden("RegDate", false);
    controlHidden("RegNumber", false);
  } else {
    controlHidden("RegDate");
    controlHidden("RegNumber");
  }
}

