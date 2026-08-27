/* Official signatory list. The optional Google Sheet update path reads only
   columns D, E, F (name / role / pavilion or organisation), never email.
   Set LIVE_UPDATE to true only when the sheet should replace the static list. */

var CSV_URL = "https://docs.google.com/spreadsheets/d/192PiLQA7J_N8hA4VwinRCdySIv6eet9pkX7UHWvRW5o/gviz/tq?tqx=out:csv&tq=select%20D,E,F";
var LIVE_UPDATE = false;

/* ---------- language ---------- */

var LANGS = ["en", "zh", "ko"];

function setLang(lang) {
  var html = document.documentElement;
  html.setAttribute("data-lang", lang);
  html.setAttribute("lang", lang === "zh" ? "zh-Hant" : lang);
  var buttons = document.querySelectorAll("#lang button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute("aria-current", buttons[i].dataset.langSet === lang ? "true" : "false");
  }
  try { localStorage.setItem("lang", lang); } catch (e) {}
}

function initLang() {
  var saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  var nav = (navigator.language || "").toLowerCase();
  var guess = nav.indexOf("zh") === 0 ? "zh" : nav.indexOf("ko") === 0 ? "ko" : "en";
  setLang(LANGS.indexOf(saved) !== -1 ? saved : guess);

  document.getElementById("lang").addEventListener("click", function (e) {
    if (e.target.dataset.langSet) setLang(e.target.dataset.langSet);
  });
}

/* ---------- CSV ---------- */

function parseCsv(text) {
  var rows = [], row = [], field = "", quoted = false, i = 0;
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  while (i < text.length) {
    var c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { quoted = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function toSignatories(rows) {
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var name = clean(rows[i][0]);
    var role = clean(rows[i][1]).replace(/^participating\s+/i, "");
    var category = classify(rows[i][2]);

    if ((name + role + category).indexOf("@") !== -1) continue;
    if (!name || /^untitled short answer field$/i.test(name)) continue;

    out.push({ name: name, occupation: (role || "Other") + " · " + category });
  }
  out.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { sensitivity: "base" }); });
  return out;
}

function clean(value) {
  return (value || "").trim().replace(/^["“”']+|["“”']+$/g, "").trim();
}

function classify(value) {
  var raw = clean(value);
  var lower = raw.toLowerCase();
  if (!raw) return "Other";
  if (lower === "main" || lower === "main exhibition") return "Main";
  if (lower.indexOf("poland") !== -1) return "Poland Pavilion";
  if (lower.indexOf("malta") !== -1) return "Malta Pavilion";
  if (lower.indexOf("indonesia") !== -1) return "Indonesia Pavilion";
  if (lower.indexOf("italy") !== -1 || lower.indexOf("italian") !== -1) return "Italy Pavilion";
  if (lower.indexOf("taiwan") !== -1) return "Taiwan Pavilion";
  if (lower.indexOf("brazil") !== -1 || lower.indexOf("brazilian") !== -1) return "Brazil Pavilion";
  if (lower.indexOf("france") !== -1) return "France Pavilion";
  if (lower.indexOf("asakusa") !== -1) return "Asakusa";
  if (lower.indexOf("1646") !== -1) return "1646";
  if (lower.indexOf("uccn") !== -1) return "UCCN";
  if (lower.indexOf("koganecho") !== -1) return "Koganecho";
  if (lower.indexOf("ivae") !== -1) return "IVAE";
  if (lower.indexOf("stateless") !== -1) return "Stateless";
  return raw;
}

/* ---------- render ---------- */

function render(people) {
  var list = document.getElementById("list");

  // a poll that comes back empty is treated as a bad read, not as "nobody signed"
  if (!people.length && list.children.length) return;

  list.textContent = "";

  people.forEach(function (p) {
    var li = document.createElement("li");
    li.tabIndex = 0;

    var n = document.createElement("span");
    n.className = "name";
    n.textContent = p.name;

    var occ = document.createElement("span");
    occ.className = "occupation";
    occ.textContent = p.occupation;

    li.appendChild(n);
    li.appendChild(occ);
    list.appendChild(li);
  });
}

function setStatus(en, zh, ko) {
  var s = document.getElementById("status");
  s.textContent = "";
  [["en", en], ["zh", zh], ["ko", ko]].forEach(function (pair) {
    var span = document.createElement("span");
    span.className = pair[0];
    span.textContent = pair[1];
    s.appendChild(span);
  });
}

function load() {
  if (CSV_URL.indexOf("http") !== 0) {
    setStatus("The list is not connected yet.", "名單尚未連結。", "명단이 아직 연결되지 않았습니다.");
    return;
  }
  if (!document.getElementById("list").children.length) setStatus("Loading…", "載入中…", "불러오는 중…");

  fetch(CSV_URL + (CSV_URL.indexOf("?") === -1 ? "?" : "&") + "cb=" + Date.now(),
        { cache: "no-store", referrerPolicy: "no-referrer" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (text) {
      render(toSignatories(parseCsv(text)));
      document.getElementById("status").textContent = "";
    })
    .catch(function () {
      setStatus("Could not load the list. Please reload.",
                "無法載入名單，請重新整理。",
                "명단을 불러오지 못했습니다. 새로고침해 주세요.");
    });
}

/* ---------- init ---------- */

var POLL_MS = 30000;      // re-read the sheet every 30s while the tab is visible

initLang();
if (document.getElementById("list")) {
  if (LIVE_UPDATE) {
    load();
    setInterval(function () { if (!document.hidden) load(); }, POLL_MS);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) load(); });
  }
}
