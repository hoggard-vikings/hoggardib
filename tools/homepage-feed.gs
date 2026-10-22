/**
 * Hoggard IB homepage feed.
 *
 * Paste this into the Google Sheet's Extensions → Apps Script editor, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Send the /exec URL so it can be set as FEED_URL in build.py.
 *
 * Sheet tabs (row 1 is the header, spelled exactly like this):
 *   Latest     Show | Label | Title | Link
 *   Instagram  Show | Post link
 *
 * Only rows with Show ticked are used, in sheet order: the first 2 Latest
 * rows and the first 3 Instagram rows.
 */

var CACHE_KEY = 'homepage-feed';
var CACHE_SECONDS = 300;

function doGet() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEY);
  var body = cached || buildFeed_();
  if (!cached) cache.put(CACHE_KEY, body, CACHE_SECONDS);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

// Simple trigger: any edit clears the cache so changes show up right away.
function onEdit() {
  CacheService.getScriptCache().remove(CACHE_KEY);
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
  return JSON.stringify({ latest: latest, instagram: instagram, updated: new Date().toISOString() });
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
