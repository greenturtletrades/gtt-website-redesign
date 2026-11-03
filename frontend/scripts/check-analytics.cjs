const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

(async () => {
  const { transformWithEsbuild } = await import("vite");
  const file = path.resolve(__dirname, "../src/analytics/google-analytics.ts");
  const source = fs.readFileSync(file, "utf8").replace(/import\.meta\.env\.PROD/g, "production");
  const compiled = await transformWithEsbuild(source, file, { loader: "ts", format: "cjs" });
  const config = require("../seo.config.json");
  const id = "G-Y3WJ7KXW9V", flag = `ga-disable-${id}`, key = "gtt-analytics-consent-v1";
  const preference = choice => JSON.stringify({ choice, expires: Date.now() + 100000 });

  function create({ host = "greenturtletraders.co.uk", route = "/", saved, production = true, brokenStorage = false, inputs = false } = {}) {
    const storage = new Map(saved ? [[key, saved]] : []), listeners = new Map(), scripts = [], navigation = [];
    const cookies = new Map([["_ga", "visitor"], ["_ga_Y3WJ7KXW9V", "session"], ["essential", "keep"]]);
    const window = { location: new URL(`https://${host}${route}`), history: {},
      addEventListener(name, fn) { const list = listeners.get(name) || []; list.push(fn); listeners.set(name, list); },
      dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); },
    };
    for (const method of ["pushState", "replaceState"]) window.history[method] = (data, unused, url) => {
      navigation.push({ disabled: window[flag], url });
      if (url != null) window.location = new URL(url, window.location.href);
    };
    const document = { referrer: "https://example.com/private?email=someone@example.com#secret", head: { appendChild: script => scripts.push(script) }, createElement: () => ({}), querySelector: () => inputs ? {} : null };
    Object.defineProperty(document, "cookie", {
      get: () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
      set: value => { if (value.includes("Max-Age=0")) cookies.delete(value.split("=")[0]); },
    });
    const localStorage = {
      getItem: name => storage.get(name) || null,
      setItem(name, value) { if (brokenStorage) throw Error("Storage blocked"); storage.set(name, value); },
    };
    const module = { exports: {} };
    vm.runInNewContext(compiled.code, { module, exports: module.exports, require: () => config,
      window, document, localStorage, production, URL, Date, Event: class { constructor(type) { this.type = type; } }, console });
    const api = module.exports;
    api.initialiseAnalyticsGuard(); api.syncAnalytics();
    return { api, window, scripts, navigation, storage, cookies, document };
  }

  const visit = create();
  assert.equal(visit.scripts.length, 0, "No Google script without consent");
  assert.equal(visit.window[flag], true);
  visit.api.saveAnalyticsConsent("accepted");
  assert.equal(visit.scripts.length, 1);
  assert.equal(visit.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
  assert.equal(visit.window[flag], false);
  const commands = visit.window.dataLayer.map(args => Array.from(args));
  assert.equal(commands[0][0], "consent");
  for (const state of Object.values(commands[0][2])) assert.equal(state, "denied");
  const tagConfig = commands.find(command => command[0] === "config");
  assert.equal(tagConfig[1], id);
  assert.equal(tagConfig[2].allow_google_signals, false);
  assert.equal(tagConfig[2].allow_ad_personalization_signals, false);
  assert.equal(tagConfig[2].page_location, undefined, "Do not pin the URL: Enhanced Measurement needs the current history location");
  assert.equal(tagConfig[2].page_referrer, "https://example.com/");
  visit.api.syncAnalytics(); visit.api.initialiseAnalyticsGuard();
  assert.equal(visit.scripts.length, 1, "One tag per document");
  for (const route of ["/traders", "/professional-investors", "/copy-trading-platform"]) {
    visit.window.history.pushState({}, "", route);
    assert.equal(visit.navigation.at(-1).disabled, false, route);
  }
  for (const route of ["/traders/apply", "/professional-investors/enquire", "/contact", "/turtle-analytics", "/admin", "/unknown", "/?reset=secret", "/traders?email=someone@example.com"]) {
    visit.window.history.pushState({}, "", route);
    assert.equal(visit.navigation.at(-1).disabled, true, "Disabled before history listeners: " + route);
    visit.api.syncAnalytics(); assert.equal(visit.window[flag], true);
  }
  visit.window.location = new URL("https://greenturtletraders.co.uk/about");
  visit.window.dispatchEvent({ type: "popstate" });
  assert.equal(visit.window[flag], false);
  visit.api.setAnalyticsPaused(true);
  visit.window.history.replaceState({}, "", "/traders");
  assert.equal(visit.window[flag], true, "Authentication/modal pauses measurement");
  visit.api.setAnalyticsPaused(false);
  assert.equal(visit.window[flag], false);
  visit.api.saveAnalyticsConsent("rejected");
  assert.equal(visit.window[flag], true);
  assert.equal(visit.cookies.has("_ga"), false);
  assert.equal(visit.cookies.has("_ga_Y3WJ7KXW9V"), false);
  assert.equal(visit.cookies.has("essential"), true);
  visit.window.history.pushState({}, "", "/");
  assert.equal(visit.window[flag], true);

  const rejectFirst = create(); rejectFirst.api.saveAnalyticsConsent("rejected");
  assert.equal(rejectFirst.scripts.length, 0);
  assert.equal(create({ saved: preference("rejected") }).scripts.length, 0);
  assert.equal(create({ saved: preference("accepted"), route: "/traders" }).scripts.length, 1);
  for (const options of [{ host: "localhost" }, { production: false }, { route: "/contact" }, { route: "/?reset=secret" }]) {
    assert.equal(create({ saved: preference("accepted"), ...options }).scripts.length, 0);
  }
  for (const saved of ["broken", JSON.stringify({ choice: "accepted", expires: 1 }), preference("invalid")]) {
    assert.equal(create({ saved }).scripts.length, 0);
  }
  const blocked = create({ saved: preference("accepted"), brokenStorage: true });
  blocked.api.saveAnalyticsConsent("rejected");
  assert.equal(blocked.window[flag], true, "Withdrawal works even when preference storage fails");
  const crossTab = create({ saved: preference("accepted") });
  crossTab.storage.set(key, preference("rejected"));
  crossTab.window.dispatchEvent({ type: "storage", key });
  assert.equal(crossTab.window[flag], true);

  for (const [type, route, event] of [
    ["investor_enquiry", "/professional-investors/enquire", "investor_enquiry_submitted"],
    ["trader_application", "/traders/apply", "trader_application_submitted"],
  ]) {
    const completion = create({ route, saved: preference("accepted"), inputs: true });
    assert.equal(completion.scripts.length, 0, "No tag while editing a form");
    assert.equal(completion.api.trackLeadSuccess(type, "private-record-id"), false, "Cannot enable measurement with inputs still mounted");
    completion.document.querySelector = () => null;
    assert.equal(completion.api.trackLeadSuccess(type, ""), false, "A real acknowledgement ID is required");
    assert.equal(completion.api.trackLeadSuccess(type, "private-record-id"), true);
    assert.equal(completion.api.trackLeadSuccess(type, "private-record-id"), false, "Repeated confirmation effects do not double count");
    const events = completion.window.dataLayer.map(args => Array.from(args)).filter(args => args[0] === "event");
    assert.equal(events.length, 1);
    assert.equal(events[0][1], event);
    assert.equal(events[0][2].lead_type, type);
    assert.equal(events[0][2].page_location, "https://greenturtletraders.co.uk" + route);
    assert.deepEqual(Object.keys(events[0][2]).sort(), ["lead_type", "page_location", "page_title", "send_to"]);
    assert(!JSON.stringify(events).includes("private-record-id"), "Submission identifiers never leave the browser");
    completion.window.history.pushState({}, "", "/traders");
    completion.window.history.pushState({}, "", route);
    assert.equal(completion.window[flag], true, "Returning to the form disables measurement again");
    const rejected = create({ route, saved: preference("rejected") });
    assert.equal(rejected.api.trackLeadSuccess(type, "private-record-id"), false);
    assert.equal(rejected.scripts.length, 0);
    const unknown = create({ route });
    assert.equal(unknown.api.trackLeadSuccess(type, "private-record-id"), false);
    const query = create({ route: route + "?email=private@example.com", saved: preference("accepted") });
    assert.equal(query.api.trackLeadSuccess(type, "private-record-id"), false);
    const local = create({ route, host: "localhost", saved: preference("accepted") });
    assert.equal(local.api.trackLeadSuccess(type, "private-record-id"), false);
  }
  console.log("Analytics checks passed: consent, one tag, advertising disabled, route/query and form exclusions, modal pauses, withdrawal, cookie cleanup, persistence, expiry, blocked storage, cross-tab changes and deduplicated consented lead completions without personal data.");
})().catch(error => { console.error(error); process.exit(1); });
