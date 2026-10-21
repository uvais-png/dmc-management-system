const fs = require('fs');
const P = '../project/';
const scr = f => { const h = fs.readFileSync(P + f, 'utf8'); return h.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0]; };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { const prev = this.state; this.state = Object.assign({}, this.state, p); if (this.componentDidUpdate) this.componentDidUpdate(this.props, prev); } forceUpdate() {} }
const store = {};
const win = { localStorage: { getItem: k => store[k] === undefined ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }, addEventListener() {}, removeEventListener() {} };
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const mk = f => new Function('DCLogic', 'window', 'navigator', 'document', 'setTimeout', 'clearTimeout', scr(f) + '\nreturn { Component };')(DCLogic, win, { clipboard: { writeText: () => Promise.resolve() } }, { execCommand: () => true }, () => 0, () => {});
// placeholders used in templates must exist in renderVals
const holes = (f, v) => { const h = fs.readFileSync(P + f, 'utf8').split('<script type="text/x-dc"')[0]; const loops = {}; [...h.matchAll(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"/g)].forEach(m => loops[m[2]] = m[1]); const miss = []; [...h.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].forEach(m => { const root = m[1].split('.')[0]; if (!(root in loops) && !(root in v) && root !== 'true' && root !== 'false') miss.push(m[1]); }); return [...new Set(miss)]; };

// Suppliers
let S = mk('Suppliers.dc.html'); let c = new S.Component({}); let v = c.renderVals();
ok(holes('Suppliers.dc.html', v).length === 0, 'Suppliers: every placeholder has a value ' + holes('Suppliers.dc.html', v).join(','));
ok(v.list.length === 8 && v.list[0].sl === '1' && v.list[7].sl === '8', 'Suppliers: 8 rows numbered 1–8');
ok(v.heads.length === 7 && v.heads.every(h => h.sortable), 'Suppliers: 7 sortable column heads');
ok(v.tv.hasQuick && v.tv.quick.map(q => q.label).join('|') === 'All|Hotels|Transport|Activities', 'Suppliers: quick filter by type ' + v.tv.quick.map(q => q.label + ' ' + q.count).join(', '));
v.tv.quick[1].pick(); v = c.renderVals(); ok(v.list.length === 4 && v.list.every(r => r.type === 'Hotels'), 'Suppliers: Hotels chip shows 4 hotels');
v.tv.onQ({ target: { value: 'klcc' } }); v = c.renderVals(); ok(v.list.length === 1 && v.list[0].name === 'IBIS KLCC', 'Suppliers: search finds IBIS KLCC');
ok(v.list[0].chip.indexOf('Ends in') === 0, 'Suppliers: IBIS contract shows ' + v.list[0].chip);
v.tv.clear(); v = c.renderVals(); ok(v.list.length === 8, 'Suppliers: Clear brings all 8 back');
const fContract = v.tv.fields.find(f => f.label === 'Contract'); ok(fContract && fContract.isSet && fContract.opts.length >= 3, 'Suppliers: contract filter options ' + (fContract ? fContract.opts.map(o => o.label).join(', ') : ''));
fContract.opts.find(o => o.label === 'Ending soon').pick(); v = c.renderVals(); ok(v.list.length === 1 && v.tv.filterLabel === 'Filters · 1', 'Suppliers: detailed filter "Ending soon" → 1 row, button says ' + v.tv.filterLabel);
v.tv.startSave(); v = c.renderVals(); v.tv.onName({ target: { value: 'Renew soon' } }); v = c.renderVals(); v.tv.saveView(); v = c.renderVals();
ok(JSON.parse(store['flyland-views-v1'])['suppliers/directory'][0].name === 'Renew soon', 'Suppliers: saved view stored');
v.tv.clear(); v = c.renderVals(); v.tv.views[0].apply(); v = c.renderVals(); ok(v.list.length === 1 && v.tv.views[0].on, 'Suppliers: saved view re-applies');
v.tv.clear(); v = c.renderVals();
v.heads[5].sort(); v = c.renderVals(); v.heads[5].sort(); v = c.renderVals(); ok(v.heads[5].arrow === '▼' && +v.list[0].rates >= +v.list[7].rates, 'Suppliers: sort by agreed rates descending');
v.tv.clear(); v = c.renderVals();
v.list[2].pick(); v = c.renderVals(); ok(v.sel.title === v.list[2].name && v.list[2].current === 'true', 'Suppliers: clicking a row opens its details: ' + v.sel.title);
v.tv.quick[3].pick(); v = c.renderVals(); v.addSupplier(); v = c.renderVals(); ok(v.sel.type === 'Activity' && v.list[0].name === 'New supplier' && v.list[0].sl === '1', 'Suppliers: add while Activities is picked creates an activity supplier at row 1');
for (let i = 0; i < 6; i++) { v.addSupplier(); v = c.renderVals(); }
v.tv.clear(); v = c.renderVals(); ok(v.tv.hasPages && v.list.length === 10 && v.tv.showing === 'Showing 1–10 of 15', 'Suppliers: 15 rows paginate: ' + v.tv.showing);
v.tv.next(); v = c.renderVals(); ok(v.list[0].sl === '11', 'Suppliers: page 2 starts at Sl. No. 11');

// Review queue
const R = mk('ReviewQueue.dc.html'); c = new R.Component({}); v = c.renderVals();
ok(holes('ReviewQueue.dc.html', v).length === 0, 'Review: every placeholder has a value ' + holes('ReviewQueue.dc.html', v).join(','));
ok(v.list.length === 3 && v.list.map(r => r.sl).join() === '1,2,3', 'Review: 3 waiting quotes numbered');
ok(v.tv.quick.map(q => q.label + ' ' + q.count).join(', ') === 'All 3, Quote ready 2, Needs info 1', 'Review: quick filter by status: ' + v.tv.quick.map(q => q.label + ' ' + q.count).join(', '));
v.heads[6].sort(); v = c.renderVals(); ok(v.list[0].name === 'Sneha Joseph', 'Review: sort by waiting, shortest first');
v.heads[5].sort(); v = c.renderVals(); v.heads[5].sort(); v = c.renderVals(); ok(v.list[0].value === '2,092', 'Review: sort by quote value, highest first: ' + v.list.map(r => r.value).join(' | '));
v.tv.clear(); v = c.renderVals();
v.tv.onQ({ target: { value: '4499613' } }); v = c.renderVals(); ok(v.list.length === 1 && v.list[0].name === 'Meera Nair', 'Review: search by trip number');
v.list[0].pick(); v = c.renderVals(); ok(v.sel.name === 'Meera Nair', 'Review: row opens the quote');
v.tv.clear(); v = c.renderVals();
v.filters[3].pick(); v = c.renderVals(); ok(v.list.length === 1 && v.list[0].chip === 'Quoted', 'Review: Done today tab still works with the table');
v.filters[0].pick(); v = c.renderVals(); v.list[0].pick(); v = c.renderVals(); v.sel.approve(); v = c.renderVals(); ok(v.list.length === 2, 'Review: approving removes it from Waiting');
console.log(fails ? fails + ' FAILED' : 'SUPPLIERS + REVIEW TABLES GOOD');
