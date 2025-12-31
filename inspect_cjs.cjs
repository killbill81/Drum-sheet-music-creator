const fs = require('fs');
const p = 'node_modules/vexflow/build/cjs/vexflow-bravura.js';
try {
    if (fs.existsSync(p)) {
        const d = fs.readFileSync(p, 'utf8');
        console.log('--- START OF FILE ---');
        console.log(d.substring(0, 500));
        console.log('--- END OF HEAD ---');
    } else {
        console.log('File does not exist at:', p);
    }
} catch (e) { console.error(e); }
