const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const src = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { const prev = this.state; this.state = Object.assign({}, this.state, p); if (this.componentDidUpdate) this.componentDidUpdate(this.props, prev); } }
const store = {};
const win = { localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, addEventListener() {}, removeEventListener() {} };
const Comp = new Function('DCLogic', 'window', 'document', 'setTimeout', 'clearTimeout', src + '\nreturn { Component };')(DCLogic, win, {}, () => 0, () => {});
const ok = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
// hole check
const tpl = html.split('<x-dc>')[1].split('</x-dc>')[0];
const loopVars = new Set([...tpl.matchAll(/as="(\w+)"/g)].map(m => m[1]));
const holes = new Set([...tpl.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map(m => m[1]));
const screens = ['signin', 'trips', 'today', 'trip', 'day', 'stop', 'addExpense', 'expenses', 'report', 'me'];
for (const sc of screens) {
  const C = new Comp.Component({ screen: sc });
  const V = C.renderVals();
  const missing = [];
  for (const h of holes) {
    const parts = h.split('.');
    if (loopVars.has(parts[0]) || parts[0] === '$index' || /^(true|false|\d+)$/.test(h)) continue;
    let v = V; for (const p of parts) { v = v == null ? undefined : v[p]; }
    if (v === undefined) missing.push(h);
  }
  ok(missing.length === 0, sc + ' holes ' + (missing.length ? missing.join(',') : 'all present'));
}
let C = new Comp.Component({ screen: 'signin' });
let v = C.renderVals();
v.sendCode({ preventDefault() {} }); v = C.renderVals(); ok(v.signErr, 'short phone rejected');
v.onPhone({ target: { value: '12-345 6789' } }); v = C.renderVals(); v.sendCode({ preventDefault() {} }); v = C.renderVals();
ok(v.signCode, 'code step'); v.onCode({ target: { value: '123456' } }); v = C.renderVals(); v.verify({ preventDefault() {} }); v = C.renderVals();
ok(v.isToday && v.showTabs, 'signed in to today: ' + v.greeting);
console.log('brief:', v.brief.map(b => b.text).join(' | '));
ok(v.hasNext && v.next.name === 'Batu Caves' && v.tday.progress === '1 of 5 done', 'next stop Batu Caves, 1 of 5');
ok(v.hasOffer, 'offer shown: ' + v.offerText);
v.next.tickGo(); v = C.renderVals(); ok(v.next.name === 'Genting cable car' && v.toast.indexOf('Next') > -1, 'tick & go from today: ' + v.toast);
v.next.open(); v = C.renderVals(); ok(v.isStop && v.stop.name === 'Genting cable car' && v.stop.hasOpsNote, 'stop opened: ' + v.stop.stateLabel);
v.stop.issues[0].pick(); v = C.renderVals(); ok(v.stop.hasIssue, 'issue: ' + v.stop.issueTxt);
v.stop.onNote({ target: { value: 'Guests loved it' } }); v = C.renderVals(); ok(v.stop.note === 'Guests loved it', 'note saved');
v.stop.tickGo(); v = C.renderVals(); ok(v.stop.name === 'Genting Highlands free time', 'tick & go to next stop: ' + v.toast);
v.stop.skip(); v = C.renderVals(); ok(v.stop.name === 'Drop at hotel', 'skip moves on');
ok(v.stop.tickLabel === 'Tick & finish day', 'last stop label');
v.stop.tickGo(); v = C.renderVals(); ok(v.isReport && v.rep.draft, 'finish goes to report');
console.log(v.rep.text);
v.rep.moods[2].pick(); v = C.renderVals(); ok(v.rep.unhappy, 'unhappy note');
v.rep.send(); v = C.renderVals(); ok(v.rep.sent, 'report sent at ' + v.rep.sentAt);
v.back(); v = C.renderVals(); ok(v.isDay && v.day.reportBtn === 'View day report', 'back to day: ' + v.day.progress);
v.dayChips[2].pick(); v = C.renderVals(); v.day.items[0].tick(); v = C.renderVals(); ok(v.toast.indexOf('on the day') > -1, 'future day blocked');
v.openTrip(); v = C.renderVals(); ok(v.isTrip && v.guests.length === 3 && v.hotel.checkout, 'trip info, checkout ' + v.hotel.checkout);
v.back(); v = C.renderVals(); ok(v.isDay, 'trip back to day');
v.back(); v = C.renderVals(); ok(v.isToday && v.dayDone, 'today shows day done: ' + v.reportHint);
v.openAddExpense(); v = C.renderVals(); ok(v.sheetOpen, 'sheet open');
v.saveExpense({ preventDefault() {} }); v = C.renderVals(); ok(v.expErr, 'empty amount rejected');
v.expCats[1].pick(); v = C.renderVals(); v.onExpAmount({ target: { value: '35' } }); v = C.renderVals(); ok(v.expFlag, 'AI flag: ' + v.expFlagText);
v.saveExpense({ preventDefault() {} }); v = C.renderVals(); ok(v.isExpenses && !v.sheetOpen && v.exp.items.length === 3 && v.exp.items[0].amount === 'MYR 35.00', 'expense saved, total ' + v.exp.total);
v.tTrips.pick(); v = C.renderVals(); ok(v.isTrips && v.tripGroups[0].title === 'Waiting for you', 'trips groups ' + v.tripGroups.map(g => g.title).join('/'));
v.tripGroups[0].trips[0].accept(); v = C.renderVals(); ok(!v.hasOffer && v.tripGroups.some(g => g.title === 'Coming up'), 'accepted: ' + v.toast);
v.tMe.pick(); v = C.renderVals(); ok(v.isMe && v.me.trips === '3', 'me trips ' + v.me.trips + ' waiting ' + v.me.waiting);
const D = new Comp.Component({ screen: 'today' }); const dv = D.renderVals(); ok(dv.tday.progress === '4 of 5 done · 1 skipped', 'second instance reads saved data: ' + dv.tday.progress + ' | screen ' + Object.keys(dv).filter(k => /^is[A-Z]/.test(k) && dv[k]).join(','));
const E = new Comp.Component({ screen: 'addExpense' }); const ve = E.renderVals(); ok(ve.sheetOpen && ve.expFlag, 'addExpense artboard prefilled + flagged');
console.log('store bytes', store['flyland-guide-app-v1'].length);
