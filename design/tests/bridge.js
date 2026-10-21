// Run the Trip desk flow to confirm AMAL RAJ, then check the back office picks it up
const fs = require('fs');
const P = '../project/';
const scr = f => { const h = fs.readFileSync(P + f, 'utf8'); return h.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0]; };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { const prev = this.state; this.state = Object.assign({}, this.state, p); if (this.componentDidUpdate) this.componentDidUpdate(this.props, prev); } forceUpdate() {} }
const store = {};
const win = { localStorage: { getItem: k => store[k] === undefined ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, addEventListener() {}, removeEventListener() {} };
const L = new Function('DCLogic', 'window', 'navigator', 'document', 'setTimeout', 'clearTimeout', scr('Lead.dc.html') + '\nreturn { Component };')(DCLogic, win, { clipboard: { writeText: () => Promise.resolve() } }, { execCommand: () => true }, () => 0, () => {});
const D = new L.Component({});
D.setState({ selected: D.state.enquiries[1].id });
let v = D.renderVals(); v.generate(); v = D.renderVals(); v.markSent(); v = D.renderVals(); v.openConfirm(); v = D.renderVals(); v.confOpts[0].pick(); v = D.renderVals(); v.confirmGo();
console.log('desk confirmed:', D.state.enquiries[1].trip, !!D.state.enquiries[1].confirmed, 'store', !!store['flyland-trip-desk-v3']);
const B = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', scr('Backoffice.dc.html') + '\nreturn { Component };')(DCLogic, win, () => 0, () => {});
const C = new B.Component({ module: 'files' });
let bv = C.renderVals();
const b0 = bv.blocks[0];
console.log(b0.title, b0.rows.length, b0.rows[0] && b0.rows[0].cells.map(c => c.t).join(' | '));
b0.rows[0].cells[6].acts[0].go(); bv = C.renderVals();
console.log(bv.toast, '| selected', bv.j.id, bv.j.name, bv.j.chip, '| next', bv.j.nextText);
console.log('first block now:', bv.blocks[0].isNote ? 'note' : bv.blocks[0].title);
const PU = new B.Component({ module: 'purchasing' }); const pv = PU.renderVals();
console.log('purchasing requests for 4499612:', pv.blocks[0].rows.filter(r => r.cells[2].sub.indexOf('4499612') > -1).length);
