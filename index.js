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
