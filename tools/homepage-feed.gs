/**
 * Hoggard IB homepage feed — publishes the sheet to the website through GitHub.
 *
 * The script writes the sheet's "Latest" items and Instagram links to
 * site/data/homepage.json in the website's GitHub repo, using a personal access
 * token. That commit makes Vercel redeploy, and the homepage reads the file.
 *
 * Setup (once):
 *   1. Paste this file into Extensions → Apps Script and save.
 *   2. Project Settings (gear) → Script Properties → Add property:
 *        GITHUB_TOKEN = <personal access token with Contents read/write on the repo>
 *   3. Reload the sheet, then Website → Set up automatic publishing (approve the prompt).
 *
 * Sheet tabs (row 1 is the header, spelled exactly like this):
 *   Latest     Show | Label | Title | Link
 *   Instagram  Show | Post link
 * Only rows with Show ticked are used, in sheet order: the first 2 Latest rows
 * and the first 3 Instagram rows.
 */

var GITHUB = {
  owner: 'hoggard-vikings',
  repo: 'hoggardib',
  branch: 'main',
  path: 'site/data/homepage.json'
};

// Website menu in the sheet.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish to website now', 'publishNow')
    .addItem('Set up automatic publishing', 'setUpAutoPublish')
    .addToUi();
}

// Installs an edit trigger so every change to the sheet publishes on its own.
function setUpAutoPublish() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'publishOnEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('publishOnEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  var result = publish_(true);
  SpreadsheetApp.getActive().toast('Automatic publishing is on. ' + result, 'Website', 8);
}

function publishOnEdit() {
  publish_(false);
}

function publishNow() {
  var result = publish_(true);
  SpreadsheetApp.getActive().toast(result, 'Website', 8);
}

// Writes the feed to GitHub. Skips the commit when nothing visible changed,
// unless forced from the menu.
function publish_(force) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var feed = buildFeed_();
    var content = JSON.stringify({ latest: feed.latest, instagram: feed.instagram });
    var props = PropertiesService.getScriptProperties();
    if (!force && props.getProperty('LAST_PUBLISHED') === content) return 'No changes to publish.';

    var token = props.getProperty('GITHUB_TOKEN');
    if (!token) throw new Error('Add GITHUB_TOKEN in Project Settings → Script Properties first.');

    var url = 'https://api.github.com/repos/' + GITHUB.owner + '/' + GITHUB.repo + '/contents/' + GITHUB.path;
    var headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };

    // The current file's sha is required to update it.
    var sha = null;
    var current = UrlFetchApp.fetch(url + '?ref=' + encodeURIComponent(GITHUB.branch), { headers: headers, muteHttpExceptions: true });
    if (current.getResponseCode() === 200) sha = JSON.parse(current.getContentText()).sha;

    var body = JSON.stringify({ latest: feed.latest, instagram: feed.instagram, updated: new Date().toISOString() }, null, 2) + '\n';
    var payload = {
      message: 'Update homepage Latest and Instagram from the Google Sheet',
      content: Utilities.base64Encode(body, Utilities.Charset.UTF_8),
      branch: GITHUB.branch
    };
    if (sha) payload.sha = sha;
    var res = UrlFetchApp.fetch(url, {
      method: 'put', headers: headers, contentType: 'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code !== 200 && code !== 201) throw new Error('GitHub said ' + code + ': ' + res.getContentText().slice(0, 300));
    props.setProperty('LAST_PUBLISHED', content);
    return 'Published. The website updates in a minute or two.';
  } finally {
    lock.releaseLock();
  }
}

function buildFeed_() {
  var latest = readTab_('Latest')
    .filter(function (r) { return isShown_(r.show) && String(r.title || '').trim(); })
    .slice(0, 2)
    .map(function (r) {
      return { label: formatLabel_(r.label), title: String(r.title).trim(), link: String(r.link || '').trim() };
    });
  var instagram = readTab_('Instagram')
    .filter(function (r) { return isShown_(r.show) && String(r['post link'] || '').trim(); })
    .slice(0, 3)
    .map(function (r) { return String(r['post link']).trim(); });
  return { latest: latest, instagram: instagram };
}

// Rows as objects keyed by lower-case header name.
function readTab_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values.shift().map(function (h) { return String(h).trim().toLowerCase(); });
  return values.map(function (row) {
    var obj = {};
    header.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function isShown_(value) {
  return value === true || String(value).trim().toUpperCase() === 'TRUE';
}

// Date cells become e.g. "DEC 4, 2025"; text such as "2025–2026" is kept as typed.
function formatLabel_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MMM d, yyyy').toUpperCase();
  }
  return String(value || '').trim();
}
