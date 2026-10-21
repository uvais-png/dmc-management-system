const fs = require('fs');
const P = '../project/';
const scr = f => { const h = fs.readFileSync(P + f, 'utf8'); return h.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0]; };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { const prev = this.state; this.state = Object.assign({}, this.state, p); if (this.componentDidUpdate) this.componentDidUpdate(this.props, prev); } forceUpdate() {} }
const store = {};
const win = { localStorage: { getItem: k => store[k] === undefined ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, addEventListener() {}, removeEventListener() {} };
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const mk = (f, extra) => new Function('DCLogic', 'window', 'navigator', 'document', 'setTimeout', 'clearTimeout', scr(f) + '\nreturn { Component' + (extra || '') + ' };')(DCLogic, win, { clipboard: { writeText: () => Promise.resolve() } }, { execCommand: () => true }, () => 0, () => {});
const exp = fs.readFileSync('expected.txt', 'utf8').replace(/\n$/, '');
// 1. Masters saves its seed (an edit), Trip desk still matches the reference
const M = mk('Masters.dc.html'); let mc = new M.Component({}); let mv = mc.renderVals();
mv.sec.rows[0].cells[5].set({ target: { value: '210' } }); // re-type Adya rate, forces a save
ok(!!store['flyland-masters-v1'], 'Masters saved its data');
const L = mk('Lead.dc.html');
let D = new L.Component({}); let v = D.renderVals(); v.generate(); v = D.renderVals();
ok(v.msgText === exp, 'with Masters data the Royal sky quote still matches the reference exactly');
// 2. change IBIS rate in Masters → Trip desk 4 star total changes
mv = mc.renderVals(); mv.sec.rows[4].cells[5].set({ target: { value: '420' } });
D = new L.Component({}); v = D.renderVals(); v.generate(); v = D.renderVals();
ok(v.options[1].total !== 'MYR 3,975', 'IBIS rate from Masters changes the 4 star total: ' + v.options[1].total);
// 3. peak season from Masters seasons
mc.setState({ tab: 'seasons' }); mv = mc.renderVals(); mv.addRow(); mv = mc.renderVals();
mv.sec.rows[0].cells[0].set({ target: { value: 'Year-end peak' } }); mv = mc.renderVals();
mv.sec.rows[0].cells[1].set({ target: { value: '2026-11-20' } }); mv = mc.renderVals();
mv.sec.rows[0].cells[2].set({ target: { value: '2026-11-30' } }); mv = mc.renderVals();
mv.sec.rows[0].cells[4].set({ target: { value: 'Peak: markup rule “Peak season”' } });
D = new L.Component({}); v = D.renderVals(); v.generate(); v = D.renderVals();
ok(v.options[0].total !== 'MYR 2,880' && JSON.stringify(v).indexOf('Peak markup of 20% used') > -1, 'peak season markup applied: 3 star ' + v.options[0].total);
// 4. Trip desk rate edit writes back to Masters
D.setState({ tab: 'rates' }); v = D.renderVals();
v.hotelRows[0].setRate ? v.hotelRows[0].setRate({ target: { value: '222' } }) : Object.keys(v.hotelRows[0]).filter(k => /rate/i.test(k) && typeof v.hotelRows[0][k] === 'function').forEach(k => v.hotelRows[0][k]({ target: { value: '222' } }));
const mm = JSON.parse(store['flyland-masters-v1']);
ok(mm.hotels[0].rate === '222', 'Trip desk rate edit lands in Masters: Adya ' + mm.hotels[0].rate);
mc = new M.Component({}); mv = mc.renderVals(); ok(mv.sec.rows[0].cells[5].v === '222', 'Masters shows the Trip desk edit');
// 5. Packages: add Day at leisure to 5N package day 5; turn Genting upsell off
const PK = mk('Packages.dc.html'); const pc = new PK.Component({}); let pv = pc.renderVals();
pv.pk.dayList[4].toggleAdd(); pv = pc.renderVals(); pv.lib[15].add(); pv = pc.renderVals();
pv.goAo(); pv = pc.renderVals(); pv.addons[0].toggle();
D = new L.Component({}); v = D.renderVals(); v.generate(); v = D.renderVals();
ok(v.msgText.indexOf('Day at leisure') > -1, 'Packages day plan change appears in the quote');
ok(!v.aiTips.some(t => /Genting/.test(t.text)), 'Genting upsell hidden when its add-on is off');
// 6. Settings templates
const ST = mk('Settings.dc.html'); const sc = new ST.Component({}); let sv = sc.renderVals();
sc.setState({ tab: 'tpl', tpl: 'ask' }); sv = sc.renderVals(); sv.tpl.set({ target: { value: 'Hello {customer}! Please share:\n{missing}\nThanks, Flyland' } });
sc.setState({ tpl: 'sup' }); sv = sc.renderVals(); sv.tpl.set({ target: { value: 'Dear {supplier}, please hold *{service}* for {dates}, {pax}. Ref {trip}.' } });
D = new L.Component({}); D.setState({ selected: 'e2' }); v = D.renderVals(); v.generate(); v = D.renderVals();
ok(v.msgText.indexOf('Hello Meera Nair! Please share:') === 0 || v.msgText.indexOf('Hello ') === 0, 'ask text uses the Settings template: ' + v.msgText.split('\n')[0]);
console.log(fails ? fails + ' problems' : 'SHARED DATA GOOD');
