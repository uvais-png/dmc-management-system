const fs = require('fs');
const P = '../project/';
const scr = f => { const h = fs.readFileSync(P + f, 'utf8'); return h.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0]; };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { const prev = this.state; this.state = Object.assign({}, this.state, p); if (this.componentDidUpdate) this.componentDidUpdate(this.props, prev); } }
const store = {};
const win = { localStorage: { getItem: k => store[k] === undefined ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, addEventListener() {}, removeEventListener() {} };
// guide store from the guide app seed
const G = new Function('DCLogic', 'window', 'document', 'setTimeout', 'clearTimeout', scr('GuideApp.dc.html') + '\nreturn { seed };')(DCLogic, win, {}, () => 0, () => {});
const gs = G.seed(); gs.trips[0].days[1].items[1].issue = 'Running late'; gs.trips[0].days[1].items[1].issueAt = '09:40';
gs.trips[0].expenses.push({ id: 'e9', day: 4, cat: 'Parking', amount: 35, note: 'Batu Caves car park', status: 'pending', time: '09:50', photo: '' });
store['flyland-guide-app-v1'] = JSON.stringify(gs);
const B = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', scr('Backoffice.dc.html') + '\nreturn { Component, MODS, stageOf, seed };')(DCLogic, win, () => 0, () => {});
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const need = (o, keys, where) => keys.forEach(k => { if (o[k] === undefined) { fails++; console.log('MISSING', where, k); } });
function checkBlock(b, where) {
  need(b, ['isTable', 'isBars', 'isCal', 'isCards', 'isBoard', 'isForm', 'isNote', 'hasHead', 'title', 'note', 'hasFoot', 'foot'], where);
  if (b.isTable) { need(b, ['minW', 'grid', 'cols', 'rows', 'empty', 'emptyText'], where); b.rows.forEach((r, i) => { need(r, ['bg', 'cells'], where + ' row' + i); if (r.cells.length !== b.cols.length) { fails++; console.log('COLS', where, 'row', i, r.cells.length, 'vs', b.cols.length); } r.cells.forEach(c => { need(c, ['isText', 'isChip', 'isInput', 'isActs', 'align', 'items', 'hasSub', 'sub'], where); if (c.isText) need(c, ['t', 'w', 'ink'], where); if (c.isChip) need(c, ['t', 'bg', 'fg'], where); if (c.isActs) { need(c, ['acts', 'justify'], where); c.acts.forEach(a => need(a, ['isBtn', 'isLink', 'label', 'bg', 'ink', 'border', a.isBtn ? 'go' : 'href'], where + ' act')); } if (c.isInput) need(c, ['type', 'v', 'set', 'aria', 'ph'], where); }); }); }
  if (b.isBars) b.bars.forEach(x => need(x, ['label', 'sub', 'value', 'pct', 'color'], where));
  if (b.isCal) { need(b, ['heads', 'days'], where); b.days.forEach(d => { need(d, ['n', 'bg', 'w', 'ink', 'items'], where); d.items.forEach(i => need(i, ['t', 'tip', 'bg', 'fg', 'go'], where)); }); }
  if (b.isCards) { need(b, ['cards', 'cardMin'], where); b.cards.forEach(k => { need(k, ['title', 'sub', 'hasChip', 'border', 'lines', 'hasBar', 'hasActs'], where); if (k.hasChip) need(k, ['chip', 'chipBg', 'chipFg'], where); if (k.hasBar) need(k, ['pct', 'barColor'], where); if (k.hasActs) k.acts.forEach(a => need(a, ['isBtn', 'isLink', 'label'], where)); }); }
  if (b.isBoard) b.columns.forEach(col => { need(col, ['title', 'team', 'color', 'count', 'cards'], where); col.cards.forEach(c => need(c, ['id', 'name', 'sub', 'chip', 'chipBg', 'chipFg', 'value', 'next', 'nextInk', 'current', 'border', 'pick'], where)); });
  if (b.isForm) { need(b, ['fields', 'submit', 'submitLabel', 'hasErr', 'err', 'hasResult', 'result'], where); b.fields.forEach(f => { need(f, ['id', 'label', 'isInput', 'isChoice', 'type', 'v', 'ph', 'set', 'options'], where); f.options.forEach(o => need(o, ['label', 'on', 'bg', 'ink', 'border', 'pick'], where)); }); }
  if (b.isNote) need(b, ['text'], where);
}
for (const mod of Object.keys(B.MODS)) {
  const C = new B.Component({ module: mod });
  for (const [tab] of B.MODS[mod].tabs) {
    C.setState({ tab });
    let v;
    try { v = C.renderVals(); } catch (e) { fails++; console.log('THROW', mod, tab, e.message); continue; }
    need(v, ['title', 'intro', 'j', 'tabs', 'blocks', 'hasAi', 'ai', 'hasKpis', 'kpis', 'pickList'], mod);
    need(v.j, ['id', 'name', 'sub', 'chip', 'chipBg', 'chipInk', 'nextText', 'nextTeam', 'hasAct', 'actLabel', 'act', 'hasLink', 'nextHref', 'nextScreen', 'steps'], mod + ' j');
    v.blocks.forEach((b, i) => checkBlock(b, mod + '/' + tab + '#' + i));
    console.log('     ', mod + '/' + tab, '→ blocks', v.blocks.length, v.blocks.map(b => b.isTable ? 't' + b.rows.length : b.isCards ? 'c' + b.cards.length : b.isBoard ? 'board' : b.isForm ? 'form' : b.isCal ? 'cal' : b.isBars ? 'bars' : 'note').join(','), '| ai', v.ai.length);
  }
}
// stages
const d0 = B.seed();
console.log('stages:', d0.files.map(f => f.id + ':' + B.stageOf(f, d0)).join(' '));
// workflow: Royal sky proforma → advance via journey act in finance
let C = new B.Component({ module: 'finance' });
let v = C.renderVals();
ok(v.j.id === '4499560' && v.j.chip === 'Advance due' && v.j.hasAct, 'Royal sky at advance due, finance can act: ' + v.j.actLabel);
v.j.act(); v = C.renderVals(); ok(v.j.chip === 'Advance in', 'advance recorded → ' + v.j.chip + ' | ' + v.toast);
ok(v.j.hasLink && v.j.nextHref === 'Lead.dc.html', 'next step links to Trip desk');
C = new B.Component({ module: 'bookings' }); C.setState({ tab: 'itin' }); v = C.renderVals();
ok(v.j.hasAct && v.j.actLabel === 'Mark itinerary shared', 'bookings sees the same file state (shared store)');
v.j.act(); v = C.renderVals(); ok(v.j.chip === 'Ready to travel', 'itinerary shared → ' + v.j.chip);
// purchasing confirm Divya
C = new B.Component({ module: 'purchasing' }); v = C.renderVals();
const row = v.blocks[0].rows.find(r => r.cells[2].sub.indexOf('Divya') > -1);
ok(!!row, 'Divya hotel request listed'); row.cells[4]; C.state.form['cf-4499580s0'] = 'SG-H-881';
row.cells[6].acts[0].go(); v = C.renderVals(); ok(v.toast.indexOf('Booked') > -1, 'confirm → ' + v.toast);
// finance proforma for Rahul + Divya
C = new B.Component({ module: 'finance' }); v = C.renderVals();
ok(v.blocks[0].rows.length === 2, 'two files ready for proforma: ' + v.blocks[0].rows.map(r => r.cells[1].t).join(', '));
v.blocks[0].rows[0].cells[5].acts[0].go(); v = C.renderVals(); ok(v.toast.indexOf('issued') > -1, v.toast);
C.setState({ tab: 'exp' }); v = C.renderVals();
const pend = v.blocks[0].rows.filter(r => r.cells[6].t === 'Waiting');
ok(pend.length >= 1, 'guide expenses waiting: ' + pend.length); pend[pend.length - 1].cells[7].acts[0].go(); v = C.renderVals();
ok(JSON.parse(store['flyland-guide-app-v1']).trips[0].expenses.some(e => e.status === 'approved' && e.id === 'e9'), 'approval written back to guide app: ' + v.toast);
C.setState({ tab: 'bills' }); v = C.renderVals(); const tot = b => parseInt(b.tv.showing.split(' of ')[1], 10); const before = tot(v.blocks[0]); v.blocks[0].rows[0].cells[4].acts[0].go(); v = C.renderVals(); ok(tot(v.blocks[0]) === before - 1, 'bill entered: ' + before + ' → ' + tot(v.blocks[0]) + ' waiting');
C.setState({ tab: 'spay' }); v = C.renderVals(); const unpaid = v.blocks[0].rows.length; v.blocks[0].rows[0].cells[6].acts[0].go(); v = C.renderVals(); ok(v.blocks[0].rows.length === unpaid - 1, 'bill paid');
// lakshmi balance → paid → close in reports
C.setState({ tab: 'inv' }); v = C.renderVals(); const lak = v.blocks[1].rows.find(r => r.cells[2].t === 'Lakshmi Iyer'); lak.cells[7].acts[0].go(); v = C.renderVals(); ok(v.toast.indexOf('Paid') > -1, v.toast);
C = new B.Component({ module: 'reports' }); C.pick('4499455'); v = C.renderVals(); ok(v.j.hasAct && v.j.actLabel === 'Close file', 'reports can close Lakshmi'); v.j.act(); v = C.renderVals(); ok(v.j.chip === 'Closed', 'closed');
// ops
C = new B.Component({ module: 'ops' }); C.setState({ tab: 'incidents' }); v = C.renderVals(); ok(v.blocks[0].rows[0].cells[5].t === 'Open', 'guide app issue appears as incident: ' + v.blocks[0].rows[0].cells[4].t);
v.blocks[0].rows[0].cells[6].acts[0].go(); v = C.renderVals(); ok(v.blocks[0].rows[0].cells[5].t === 'Resolved', 'resolved');
C.setState({ tab: 'dispatch' }); v = C.renderVals(); const un = v.blocks[0].rows.find(r => r.cells[6].t === 'Unassigned'); un.cells[7].acts[0].go(); v = C.renderVals(); ok(v.toast.indexOf('assigned') > -1, v.toast);
// amendments date change → booking again
C = new B.Component({ module: 'bookings' }); C.setState({ tab: 'amend' }); v = C.renderVals(); v.blocks[0].rows[0].cells[6].acts[0].go(); v = C.renderVals(); C.pick('4499580'); v = C.renderVals(); ok(v.j.chip === 'Booking', 'date change sent Divya back to booking: ' + v.toast);
// nav from sidebar
store['flyland-nav'] = 'fi-bank'; C = new B.Component({ module: 'finance' }); ok(C.state.tab === 'bank' && store['flyland-nav'] === undefined, 'sidebar nav opens Bank tab');
console.log(fails ? fails + ' problems' : 'ALL GOOD', '| store', store['flyland-backoffice-v1'].length);
// portal
store['flyland-nav'] = 'ap-quote';
let PP = new B.Component({ module: 'portal' }); let pv = PP.renderVals();
ok(pv.showJourney === false && pv.showTabs && PP.state.tab === 'quote', 'portal hides staff journey, opens self-quote');
pv.blocks.forEach((b, i) => checkBlock(b, 'portal#' + i));
console.log(pv.blocks[0].result);
pv.blocks[0].submit({ preventDefault() {} }); pv = PP.renderVals(); ok(pv.blocks[0].hasErr, 'lead name required');
PP.setForm('apLead')({ target: { value: 'Anand Varghese' } }); pv = PP.renderVals(); pv.blocks[0].submit({ preventDefault() {} }); pv = PP.renderVals();
ok(PP.state.tab === 'bookings' && /Trip 44995\d\d is with/.test(pv.toast), pv.toast);
pv.blocks.forEach((b, i) => checkBlock(b, 'portal-bk#' + i));
const PU = new B.Component({ module: 'purchasing' }); const puv = PU.renderVals();
ok(puv.blocks[0].rows.some(r => r.cells[2].sub.indexOf('Anand Varghese') > -1), 'agent request shows up in Purchasing');
for (const t of ['pay', 'stmt']) { PP.setState({ tab: t }); const x = PP.renderVals(); x.blocks.forEach((b, i) => checkBlock(b, 'portal-' + t + '#' + i)); console.log('      portal/' + t, x.blocks.map(b => b.isTable ? 't' + b.rows.length : 'c').join(',')); }
PP.setState({ portalOut: true }); pv = PP.renderVals(); ok(pv.showTabs === false && pv.blocks[0].isForm, 'signed out shows login');
console.log(fails ? fails + ' problems' : 'PORTAL GOOD');

// ---- table standard
let T1 = new B.Component({ module: 'bookings' }); T1.setState({ tab: 'vouchers' }); let tv = T1.renderVals();
let tb = tv.blocks[0];
ok(tb.std && tb.cols[0].label === 'Sl. No.' && tb.rows.length === 10 && tb.tv.hasPages && tb.tv.pages.length === 3, 'vouchers: Sl. No., 10 per page, 3 pages · ' + tb.tv.showing);
ok(tb.rows[0].cells[0].t === '1' && tb.rows[9].cells[0].t === '10', 'Sl. No. counts 1–10');
tb.tv.pages[1].go(); tv = T1.renderVals(); tb = tv.blocks[0]; ok(tb.rows[0].cells[0].t === '11', 'page 2 starts at 11 · ' + tb.tv.showing);
tb.tv.sizes[1].pick(); tv = T1.renderVals(); tb = tv.blocks[0]; ok(tb.rows.length === 27 || tb.rows.length === 25, 'page size 25 → ' + tb.rows.length);
tb.tv.onQ({ target: { value: 'IBIS' } }); tv = T1.renderVals(); tb = tv.blocks[0]; ok(tb.rows.every(r => JSON.stringify(r.cells).indexOf('IBIS') > -1) && tb.rows.length > 0, 'search IBIS → ' + tb.rows.length + ' rows');
T1 = new B.Component({ module: 'files' }); T1.setState({ tab: 'list' }); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
ok(tb.tv.hasQuick, 'quick filter chips on stage: ' + tb.tv.quick.map(q => q.label + ' ' + q.count).join(', '));
tb.tv.quick[1].pick(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files'); ok(tb.rows.every(r => r.cells[4].t === tb.tv.quick.find(q => q.on).label), 'quick filter narrows to one stage: ' + tb.rows.length);
tb.tv.clear(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
const valCol = tb.cols.findIndex(c => c.label === 'Value'); tb.cols[valCol].sort(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
const vals = tb.rows.map(r => parseFloat(r.cells[valCol].t.replace(/[^0-9.]/g, ''))); ok(vals.every((x, i) => i === 0 || vals[i - 1] <= x), 'sort by value ascending: ' + vals.join(','));
ok(tb.cols[valCol].ariaSort === 'ascending' && tb.cols[valCol].arrow === '▲', 'header shows sort state');
tb.tv.togglePanel(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
ok(tb.tv.panel && tb.tv.fields.length >= 4, 'detailed filter panel fields: ' + tb.tv.fields.map(f => f.label + ':' + (f.isText ? 'text' : f.isNum ? 'num' : f.isDate ? 'date' : 'set')).join(', '));
const fv = tb.tv.fields.find(f => f.isNum); fv.onMin({ target: { value: '3000' } }); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
ok(tb.rows.every(r => parseFloat(r.cells[valCol].t.replace(/[^0-9.]/g, '')) >= 3000), 'value from 3000 → ' + tb.rows.length + ' rows · ' + tb.tv.filterLabel);
const fd = tb.tv.fields.find(f => f.isDate); ok(!!fd, 'dates filter by range');
tb.tv.startSave(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files'); tb.tv.onName({ target: { value: 'Big files' } }); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files'); tb.tv.saveView(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
ok(tb.tv.hasViews && tb.tv.views[0].label === 'Big files' && tb.tv.views[0].on && JSON.parse(store['flyland-views-v1'])['files/list/All files'], 'saved view stored: ' + tv.toast);
tb.tv.clear(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files'); const all = tb.rows.length; tb.tv.views[0].apply(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files');
ok(tb.rows.length < all && tb.tv.views[0].on, 'applying the saved view restores the filter: ' + tb.rows.length + ' of ' + all);
const T2 = new B.Component({ module: 'files' }); T2.setState({ tab: 'list' }); const tv2 = T2.renderVals(); ok(tv2.blocks.find(b => b.title === 'All files').tv.hasViews, 'saved view survives a reload');
tb.tv.views[0].del(); tv = T1.renderVals(); tb = tv.blocks.find(b => b.title === 'All files'); ok(!tb.tv.hasViews, 'saved view deleted');
const R = new B.Component({ module: 'reports' }); R.setState({ tab: 'pl' }); const rv = R.renderVals(); ok(rv.blocks.every(b => !b.std), 'P&L statements stay plain');
console.log(fails ? fails + ' problems' : 'TABLE STANDARD GOOD');
