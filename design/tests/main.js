const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const src = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(p) { this.state = Object.assign({}, this.state, p); } }
const C = new (new Function('DCLogic', 'navigator', 'document', src + '\nreturn Component;')(DCLogic, { clipboard: { writeText: () => Promise.resolve() } }, {}))({});
let v = C.renderVals();
console.log('stages', v.wfStages.map(w => w.label + ' ' + w.count).join(' | '));
console.log('depts', v.depts.map(d => d.name + ':' + d.rows.map(r => r.value).join('/')).join('  '));
console.log('insights', v.insights.map(i => i.title).join(' || '));
console.log('onTrip', v.onTrip.length, 'agents', v.agentRows.length, 'rows', v.rows.length);
v.onOwner({ target: { value: 'FN' } }); v = C.renderVals();
console.log('FN stages', v.wfStages.map(w => w.count).join(','), 'insights', v.insights.length, 'noTrip', v.noTrip);
