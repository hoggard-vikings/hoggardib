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
 *   4. Website → Check sheet shows exactly what will be published.
 *
 * Tabs: "Latest" (Show | Label | Title | Link) and "Instagram" (Show | Post link).
 * Tab and column names are matched loosely (any capitalisation, extra spaces,
 * header row anywhere in the first 10 rows). Only rows with Show ticked are
 * used, in sheet order: the first 2 Latest rows and the first 3 Instagram rows.
 * If there's no Show column, every filled-in row counts as shown.
 */

var GITHUB = {
  owner: 'hoggard-vikings',
  repo: 'hoggardib',
  branch: 'main',
  path: 'site/data/homepage.json'
};

// Accepted spellings for each column (compared lower-case, letters/digits only).
var COLUMNS = {
  show: ['show', 'display', 'visible', 'publish', 'active', 'on'],
  label: ['label', 'date', 'when'],
  title: ['title', 'headline', 'name', 'text', 'event'],
  link: ['link', 'url', 'page', 'href'],
  post: ['postlink', 'post', 'instagramlink', 'instagram', 'posturl', 'link', 'url']
};

// Website menu in the sheet.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Publish to website now', 'publishNow')
    .addItem('Check sheet (what will be published)', 'checkSheet')
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
  SpreadsheetApp.getUi().alert('Automatic publishing is on.\n\n' + result);
}

function publishOnEdit() {
  publish_(false);
}

function publishNow() {
  SpreadsheetApp.getUi().alert(publish_(true));
}

// Shows what the script found in each tab, without publishing.
function checkSheet() {
  var feed = buildFeed_();
  var lines = [feed.report.latest, '', feed.report.instagram, '', 'Would publish:'];
  feed.latest.forEach(function (it, i) { lines.push('  Latest ' + (i + 1) + ': ' + (it.label ? it.label + ' — ' : '') + it.title + '  →  ' + (it.link || '(no link)')); });
  feed.instagram.forEach(function (u, i) { lines.push('  Instagram ' + (i + 1) + ': ' + u); });
  if (!feed.latest.length && !feed.instagram.length) lines.push('  Nothing — see the notes above.');
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

// Writes the feed to GitHub. Skips the commit when nothing visible changed
// (unless forced from the menu), and never publishes an empty feed.
function publish_(force) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var feed = buildFeed_();
    if (!feed.latest.length && !feed.instagram.length) {
      return 'Nothing was published: no ticked rows were found.\n\n' + feed.report.latest + '\n\n' + feed.report.instagram;
    }
    var content = JSON.stringify({ latest: feed.latest, instagram: feed.instagram });
    var props = PropertiesService.getScriptProperties();
    if (!force && props.getProperty('LAST_PUBLISHED') === content) return 'No changes to publish.';

    var token = props.getProperty('GITHUB_TOKEN');
    if (!token) return 'Add GITHUB_TOKEN in Apps Script → Project Settings → Script Properties first.';

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
    if (code !== 200 && code !== 201) return 'GitHub refused the update (' + code + '): ' + res.getContentText().slice(0, 300);
    props.setProperty('LAST_PUBLISHED', content);
    return 'Published ' + feed.latest.length + ' Latest item(s) and ' + feed.instagram.length +
      ' Instagram post(s). The website updates in a minute or two.';
  } finally {
    lock.releaseLock();
  }
}

function buildFeed_() {
  var latestTab = readTab_('Latest', ['title'], ['show', 'label', 'title', 'link']);
  var latest = latestTab.rows
    .filter(function (r) { return r.shown && String(r.title || '').trim(); })
    .slice(0, 2)
    .map(function (r) {
      return { label: formatLabel_(r.label), title: String(r.title).trim(), link: normalizeLink_(r.link) };
    });

  var instaTab = readTab_('Instagram', ['post'], ['show', 'post']);
  var instagram = instaTab.rows
    .filter(function (r) { return r.shown && /instagram\.com\//i.test(String(r.post || '')); })
    .slice(0, 3)
    .map(function (r) { return String(r.post).trim(); });

  return {
    latest: latest,
    instagram: instagram,
    report: { latest: latestTab.report + '\n→ ' + latest.length + ' to publish.', instagram: instaTab.report + '\n→ ' + instagram.length + ' to publish.' }
  };
}

// Finds a tab by name (any capitalisation / extra spaces), finds its header
// row, and returns rows as { shown, <column>: value } plus a plain report.
function readTab_(tabName, required, wanted) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var target = norm_(tabName);
  var sheet = ss.getSheets().filter(function (s) { return norm_(s.getName()) === target; })[0] ||
              ss.getSheets().filter(function (s) { return norm_(s.getName()).indexOf(target) === 0; })[0];
  if (!sheet) {
    return { rows: [], report: tabName + ' tab: NOT FOUND. Tabs in this sheet: ' +
      ss.getSheets().map(function (s) { return '"' + s.getName() + '"'; }).join(', ') };
  }
  var values = sheet.getDataRange().getValues();

  // Header row = first of the first 10 rows that names every required column.
  var headerRow = -1, map = {};
  for (var r = 0; r < Math.min(10, values.length) && headerRow < 0; r++) {
    var m = matchColumns_(values[r], wanted);
    if (required.every(function (k) { return m[k] !== undefined; })) { headerRow = r; map = m; }
  }
  if (headerRow < 0) {
    return { rows: [], report: '"' + sheet.getName() + '" tab: could not find a header row with a ' +
      required.map(function (k) { return '"' + k + '"'; }).join(' / ') + ' column. Row 1 reads: ' +
      (values[0] || []).filter(String).map(function (v) { return '"' + v + '"'; }).join(', ') };
  }

  var rows = [], filled = 0, ticked = 0;
  for (var i = headerRow + 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    Object.keys(map).forEach(function (k) { obj[k] = row[map[k]]; });
    var hasContent = required.some(function (k) { return String(obj[k] || '').trim(); });
    if (!hasContent) continue;
    filled++;
    obj.shown = map.show === undefined ? true : isShown_(obj.show);
    if (obj.shown) ticked++;
    rows.push(obj);
  }
  var cols = Object.keys(map).map(function (k) { return k + '=' + colLetter_(map[k]); }).join(', ');
  return { rows: rows, report: '"' + sheet.getName() + '" tab: header in row ' + (headerRow + 1) + ' (' + cols + '); ' +
    filled + ' filled row(s), ' + ticked + ' ticked' + (map.show === undefined ? ' (no Show column, so all count)' : '') + '.' };
}

// Which column index holds each wanted field, using the accepted spellings.
function matchColumns_(headerCells, wanted) {
  var found = {};
  var cells = headerCells.map(function (c) { return norm_(c); });
  wanted.forEach(function (key) {
    for (var a = 0; a < COLUMNS[key].length && found[key] === undefined; a++) {
      var idx = cells.indexOf(COLUMNS[key][a]);
      // "link"/"url" can't double as both the Latest link and something else.
      if (idx >= 0 && Object.keys(found).every(function (k) { return found[k] !== idx; })) found[key] = idx;
    }
  });
  return found;
}

function norm_(v) {
  return String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isShown_(value) {
  if (value === true) return true;
  var v = String(value == null ? '' : value).trim().toLowerCase();
  return ['true', 'yes', 'y', 'x', '1', '✓', '✔', '☑'].indexOf(v) >= 0;
}

function colLetter_(i) {
  var s = '';
  for (i = i + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s;
  return s;
}

// Repairs common link typos: "https;//", "https//", or no "https://" at all.
// Pages on this site ("apply.html", "cas.html#cas-projects") are left alone.
function normalizeLink_(value) {
  var href = String(value || '').trim().replace(/\s+/g, '');
  if (!href) return '';
  href = href.replace(/^(https?)[;:]*\/+/i, '$1://');
  if (/^https?:\/\//i.test(href) || /\.html(#[\w\-]+)?$/i.test(href) || /^#/.test(href)) return href;
  if (/^(www\.)?[a-z0-9\-]+(\.[a-z0-9\-]+)+(\/\S*)?$/i.test(href)) return 'https://' + href;
  return href;
}

// Date cells become e.g. "DEC 4, 2025"; text such as "2025–2026" is kept as typed.
function formatLabel_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'MMM d, yyyy').toUpperCase();
  }
  return String(value || '').trim();
}
