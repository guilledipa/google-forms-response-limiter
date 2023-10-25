// This is a **very** limited script to provide the functionality
// that an addon like FormLimiter would provide.
// When your domain doesn't allow the installation of such public
// add-ons, you could leverage this simple script instead.

function responseLimit(maxResponses) {
 var form = FormApp.getActiveForm();
 var responses = form.getResponses();
 if(responses.length >= maxResponses) {
  form.setAcceptingResponses(false);
 }
}

function onOpen(e) {
  FormApp.getUi()
      .createAddonMenu()
      .addItem('Configure response limiter', 'showSidebar')
      .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle('Form response limiter');
  FormApp.getUi().showSidebar(ui);
}

function saveSettings(settings) {
  PropertiesService.getDocumentProperties().setProperties(settings);
  adjustFormSubmitTrigger();
}

function getSettings() {
  var settings = PropertiesService.getDocumentProperties().getProperties();

  // Get text field items in the form and compile a list
  // of their titles and IDs.
  var form = FormApp.getActiveForm();
  var textItems = form.getItems(FormApp.ItemType.TEXT);
  settings.textItems = [];
  for (var i = 0; i < textItems.length; i++) {
    settings.textItems.push({
      title: textItems[i].getTitle(),
      id: textItems[i].getId()
    });
  }
  return settings;
}

function adjustFormSubmitTrigger() {
  var form = FormApp.getActiveForm();
  var triggers = ScriptApp.getUserTriggers(form);
  var settings = PropertiesService.getDocumentProperties();
  var triggerNeeded = settings.getProperty('limitResponses') == 'true';

  // Create a new trigger if required; delete existing trigger
  //   if it is not needed.
  var existingTrigger = null;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() == ScriptApp.EventType.ON_FORM_SUBMIT) {
      existingTrigger = triggers[i];
      break;
    }
  }
  if (triggerNeeded && !existingTrigger) {
    var trigger = ScriptApp.newTrigger('respondToFormSubmit')
        .forForm(form)
        .onFormSubmit()
        .create();
  } else if (!triggerNeeded && existingTrigger) {
    ScriptApp.deleteTrigger(existingTrigger);
  }
}

function respondToFormSubmit(e) {
  var settings = PropertiesService.getDocumentProperties();
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);

  if (settings.getProperty('limitResponses') == 'true') {
    var maxResponses = parseInt(settings.getProperty('maxResponses'), 10)
    if (!isNaN(maxResponses)) {
      responseLimit(maxResponses);
    }
  }
}
