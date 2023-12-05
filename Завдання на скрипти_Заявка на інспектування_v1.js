function setPropertyRequired(code, required = true) {
  const control = EdocsApi.getControlProperties(code);
  if (control) {
    control.required = required;
    EdocsApi.setControlProperties(control);
  }
}

function setPropertyHidden(code, hidden = true) {
  const control = EdocsApi.getControlProperties(code);
  control.hidden = hidden;
  EdocsApi.setControlProperties(control);
}

function setPropertyDisabled(code, disabled = true) {
  const control = EdocsApi.getControlProperties(code);
  control.disabled = disabled;
  EdocsApi.setControlProperties(control);
}

function setValueAttr(code, value) {
  const attr = EdocsApi.getAttributeValue(code);
  attr.value = value;
  EdocsApi.setAttributeValue(attr);
}

//Скрипт 1. Передача результату опрацювання документа в ESIGN
function onTaskExecuteMainTask(routeStage) {
  debugger;
  if (routeStage.executionResult == "rejected") {
    sendCommand(routeStage);
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("RegDate").value || !EdocsApi.getAttributeValue("RegNumber").value) {
      throw "Спочатку зареєструйте документ!";
    }
  }
}

function sendCommand(routeStage) {
  debugger;
  var command;
  var comment;
  if (routeStage.executionResult == "executed") {
    command = "CompleteTask";
  } else {
    command = "RejectTask";
    comment = routeStage.comment;
  }
  var signatures = EdocsApi.getSignaturesAllFiles();
  var DocCommandData = {
    extSysDocID: CurrentDocument.id,
    extSysDocVersion: CurrentDocument.version,
    command: command,
    legalEntityCode: EdocsApi.getAttributeValue("HomeOrgEDRPOU").value,
    userEmail: EdocsApi.getEmployeeDataByEmployeeID(CurrentUser.employeeId).email,
    userTitle: CurrentUser.fullName,
    comment: comment,
    signatures: signatures,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processDocCommand", // метод зовнішньої системи
    data: DocCommandData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: false, // виконувати завдання асинхронно
  };
}

function sendComment(comment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("OrgCode").value;
  var orgShortName = EdocsApi.getAttributeValue("OrgShortName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var comment = comment;
  var methodData = {
    extSysDocId: CurrentDocument.id,
    eventType: "CommentAdded",
    comment: comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };
  EdocsApi.runExternalFunction("ESIGN1", "integration/processEvent", methodData);
}

//Скрипт 2. Зміна властивостей атрибутів при створені документа
function setInitialRequired() {
  debugger;
  if (CurrentDocument.inExtId) {
    setPropertyRequired("DataInspection");
    setPropertyRequired("Table");
    setPropertyRequired("NumberLocomotive");
    setPropertyRequired("SeriesLocomotive");
    setPropertyRequired("NumberLocom");
    setPropertyRequired("Contractor");
    setPropertyRequired("ContractorFullName");
    setPropertyRequired("ContractorShortName");
    setPropertyRequired("EDRPOUContractor");
    setPropertyRequired("ContractorIPN");
    setPropertyRequired("LegaladdressContractor");
    setPropertyRequired("ContractorRPEmail");
    setPropertyRequired("Organization");
    setPropertyRequired("HomeName");
    setPropertyRequired("OrgCode");
    setPropertyRequired("HomeOrgIPN");
    setPropertyRequired("LegaladdressOrg");
  } else {
    setPropertyRequired("DataInspection", false);
    setPropertyRequired("NumberLocomotive", false);
    setPropertyRequired("DataInspection", false);
    setPropertyRequired("SeriesLocomotive", false);
    setPropertyRequired("NumberLocom", false);
    setPropertyRequired("Table", false);
    setPropertyRequired("Contractor", false);
    setPropertyRequired("ContractorFullName", false);
    setPropertyRequired("ContractorShortName", false);
    setPropertyRequired("EDRPOUContractor", false);
    setPropertyRequired("LegaladdressContractor", false);
    setPropertyRequired("ContractorRPEmail", false);
    setPropertyRequired("Organization", false);
    setPropertyRequired("HomeName", false);
    setPropertyRequired("OrgCode", false);
    setPropertyRequired("HomeOrgIPN", false);
    setPropertyRequired("LegaladdressOrg", false);
  }
}

function onCardInitialize() {
  debugger;
  setInitialRequired();
  CreateAccountTask();
  setInitialDisabled();
  calculationRequestAmount();
  ConfirmRequestTask();
  setPropRegistration();
}

function setInitialDisabled() {
  debugger;
  const stateTaskSendOutDoc = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;
  const stateTaskMainTask = EdocsApi.getCaseTaskDataByCode("MainTask")?.state;
  if (stateTaskSendOutDoc == "completed" || stateTaskMainTask == "rejected") {
    setPropertyDisabled("DataInspection");
    setPropertyDisabled("Comment");
    setPropertyDisabled("NumberLocomotive");
    setPropertyDisabled("PlaceInspection");
    setPropertyDisabled("SeriesLocomotive");
    setPropertyDisabled("Comment");
    setPropertyDisabled("NumberLocom");
    setPropertyDisabled("Table");
    setPropertyDisabled("Contractor");
    setPropertyDisabled("Organization");
    setPropertyDisabled("Section");
    setPropertyDisabled("ContractorRPEmail");
    setPropertyDisabled("RegDate");
    setPropertyDisabled("RegNumber");
  } else {
    setPropertyDisabled("edocsIncomeDocumentNumber", false);
    setPropertyDisabled("edocsIncomeDocumentDate", false);
    setPropertyDisabled("DataInspection", false);
    setPropertyDisabled("NumberLocomotive", false);
    setPropertyDisabled("PlaceInspection", false);
    setPropertyDisabled("SeriesLocomotive", false);
    setPropertyDisabled("Comment", false);
    setPropertyDisabled("NumberLocom", false);
    setPropertyDisabled("Table", false);
    setPropertyDisabled("Contractor", false);
    setPropertyDisabled("Organization", false);
    setPropertyDisabled("Section", false);
    setPropertyDisabled("ContractorRPEmail", false);
    setPropertyDisabled("RegDate", false);
    setPropertyDisabled("RegNumber", false);
  }
}

//4. // Вирахування суми ПДВ заявки
function calculationRequestAmount() {
  debugger;
  let VATpercentage = 0;
  const attrVATAmount = EdocsApi.getAttributeValue("RequestVATAmmount");
  const attrVATpercentage = EdocsApi.getAttributeValue("RequestVATPerecent");
  const attrContractAmount = EdocsApi.getAttributeValue("edocsDocSum");
  const attrAmountOutVAT = EdocsApi.getAttributeValue("RequestAmmountOutVat");

  switch (attrVATpercentage.value) {
    case "20%": // if (x === 'если сумма НДС=20%')
      VATpercentage = 1.2;
      break;

    case "7%": // if (x === 'если сумма НДС=7%')
      VATpercentage = 1.07;
      break;
  }

  if (attrVATpercentage.value === null || attrContractAmount.value === null) {
    // если нет ставки НДС и суммы, то укажем ноль в сумме НДС и без НДС
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = 0;
  } else if (VATpercentage == 0) {
    attrVATAmount.value = 0;
    attrAmountOutVAT.value = attrContractAmount.value;
  } else {
    attrAmountOutVAT.value = Math.floor((100 * attrContractAmount.value) / VATpercentage) / 100;
    attrVATAmount.value = attrContractAmount.value - attrAmountOutVAT.value;
  }

  EdocsApi.setAttributeValue(attrVATAmount);
  EdocsApi.setAttributeValue(attrAmountOutVAT);
}

function onChangeedocsDocSum() {
  calculationRequestAmount();
}

function onChangeRequestVATPerecent() {
  calculationRequestAmount();
}

function setContractorOnCreate(portalData) {
  debugger;
  const code = portalData.tableAttributes.filter((x) => x.code == "LegalEntityCode").map((y) => y.value)[0];

  try {
    const conInfo = EdocsApi.getContractorByCode(code, "debtor");
    debugger;
    if (conInfo) {
      EdocsApi.setAttributeValue({ code: "ContractorId", value: conInfo.contractorId });
      EdocsApi.setAttributeValue({ code: "ContractorShortName", value: conInfo.shortName });
      EdocsApi.setAttributeValue({ code: "ContractorFullName", value: conInfo.fullName });
      EdocsApi.setAttributeValue({ code: "EDRPOUContractor", value: conInfo.code });
      EdocsApi.setAttributeValue({ code: "ContractorIPN", value: conInfo.taxId });
      EdocsApi.setAttributeValue({ code: "LegaladdressContractor", value: conInfo.legalAddress });
    }
  } catch (e) {
    EdocsApi.message(e);
  }
}

function onCreate() {
  setContractorOnCreate(EdocsApi.getInExtAttributes(CurrentDocument.id.toString()));
  setContractorOnCreateEsign();
  setContractorHome();
}

function setContractorOnCreateEsign() {
  debugger;
  try {
    const data = EdocsApi.getInExtAttributes(CurrentDocument.id.toString());
    EdocsApi.setAttributeValue({
      code: "ContractorRPEmail",
      value: data.tableAttributes.filter((x) => x.code == "ContactPersonEmail").map((y) => y.value)[0],
    });
  } catch (e) {
    EdocsApi.setAttributeValue({ code: "ContractorRPEmail", value: "" });
  }
}

function setContractorHome() {
  debugger;
  try {
    const code = EdocsApi.getInExtAttributes(CurrentDocument.id.toString()).attributeValues.find((x) => x.code == "HomeOrgEDRPOU").value;
    const data = EdocsApi.getContractorByCode(code, "homeOrganization");
    EdocsApi.setAttributeValue({ code: "OrganizationId", value: data.contractorId });
    EdocsApi.setAttributeValue({ code: "HomeName", value: data.fullName });
    EdocsApi.setAttributeValue({ code: "OrgShortName", value: data.shortName });
    EdocsApi.setAttributeValue({ code: "OrgCode", value: code });
    EdocsApi.setAttributeValue({ code: "HomeOrgIPN", value: data.taxId });
    EdocsApi.setAttributeValue({ code: "LegaladdressOrg", value: data.legalAddress });
  } catch (e) {
    EdocsApi.setAttributeValue({ code: "OrganizationId", value: "" });
    EdocsApi.setAttributeValue({ code: "HomeName", value: "" });
    EdocsApi.setAttributeValue({ code: "OrgShortName", value: "" });
    EdocsApi.setAttributeValue({ code: "OrgCode", value: "" });
    EdocsApi.setAttributeValue({ code: "HomeOrgIPN", value: "" });
    EdocsApi.setAttributeValue({ code: "LegaladdressOrg", value: "" });
  }
}

function CreateAccountTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("CreateAccount").state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("DateContract");
    setPropertyRequired("NumberContract");
    setPropertyRequired("edocsDocSum");
    setPropertyRequired("RequestVATPerecent");
    setPropertyDisabled("DateContract", false);
    setPropertyDisabled("NumberContract", false);
    setPropertyDisabled("edocsDocSum", false);
    setPropertyDisabled("RequestVATPerecent", false);
    setPropertyHidden("DateContract", false);
    setPropertyHidden("NumberContract", false);
    setPropertyHidden("edocsDocSum", false);
    setPropertyHidden("RequestVATPerecent", false);
    setPropertyHidden("RequestVATAmmount", false);
    setPropertyHidden("RequestAmmountOutVat", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("DateContract");
    setPropertyRequired("NumberContract");
    setPropertyRequired("edocsDocSum");
    setPropertyRequired("RequestVATPerecent");
    setPropertyDisabled("DateContract");
    setPropertyDisabled("NumberContract");
    setPropertyDisabled("edocsDocSum");
    setPropertyDisabled("RequestVATPerecent");
    setPropertyHidden("DateContract", false);
    setPropertyHidden("NumberContract", false);
    setPropertyHidden("edocsDocSum", false);
    setPropertyHidden("RequestVATPerecent", false);
    setPropertyHidden("RequestVATAmmount", false);
    setPropertyHidden("RequestAmmountOutVat", false);
  } else {
    setPropertyRequired("DateContract", false);
    setPropertyRequired("NumberContract", false);
    setPropertyRequired("edocsDocSum", false);
    setPropertyRequired("RequestVATPerecent", false);
    setPropertyDisabled("DateContract", false);
    setPropertyDisabled("NumberContract", false);
    setPropertyDisabled("edocsDocSum", false);
    setPropertyDisabled("RequestVATPerecent", false);
    setPropertyHidden("DateContract");
    setPropertyHidden("NumberContract");
    setPropertyHidden("edocsDocSum");
    setPropertyHidden("RequestVATPerecent");
    setPropertyHidden("RequestVATAmmount");
    setPropertyHidden("RequestAmmountOutVat");
  }
}

function onTaskExecuteCreateAccount(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    sendCommand(routeStage);
    sendComment(`Ваш заявка прийнята та зареєстрована за № ${EdocsApi.getAttributeValue("RegNumber").value} від ${moment(new Date(EdocsApi.getAttributeValue("RegDate").value)).format("DD.MM.YYYY")}на суму ${EdocsApi.getAttributeValue("edocsDocSum").value} грн.`);
  }
}

//передача коментара в єСайн, додаткових функцій не потрібно
function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var orgShortName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = CurrentDocument.id;
  //EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}

function ConfirmRequestTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("ConfirmRequest")?.state;
  if (stateTask == "assigned" || stateTask == "inProgress" || stateTask == "delegated") {
    setPropertyRequired("StatusRequest");
    setPropertyHidden("StatusRequest", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("StatusRequest");
    setPropertyHidden("StatusRequest", false);
    setPropertyDisabled("StatusRequest");
  } else {
    setPropertyRequired("StatusRequest", false);
    setPropertyHidden("StatusRequest");
  }
}

function onTaskExecuteConfirmRequest(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("StatusRequest").value) throw `Внесіть значення в поле "Статус виконання заявки на інспектування"`;
  }
}

function onTaskExecutedCreateAccount(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    ConfirmRequestTask();
  }
}

function setPropRegistration() {
  debugger;
  var stateTaskSendOutDoc = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;
  var stateTaskMainTask = EdocsApi.getCaseTaskDataByCode("MainTask")?.state;

  if (stateTaskSendOutDoc == "assigned" || stateTaskSendOutDoc == "inProgress" || stateTaskSendOutDoc == "delegated" || stateTaskSendOutDoc == "completed" || stateTaskMainTask == "rejected") {
    setPropertyHidden("Regisration", false);
    setPropertyHidden("RegDate", false);
    setPropertyHidden("RegNumber", false);
  } else {
    setPropertyHidden("Regisration");
    setPropertyHidden("RegDate");
    setPropertyHidden("RegNumber");
  }
}
