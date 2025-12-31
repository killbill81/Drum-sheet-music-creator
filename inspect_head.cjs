const fs = require('fs');
const p = 'node_modules/vexflow/build/esm/src/fonts/bravura.js';
try {
    if (fs.existsSync(p)) {
        const d = fs.readFileSync(p, 'utf8');
        console.log('--- START OF FILE ---');
        console.log(d.substring(0, 500));
        console.log('--- END OF HEAD ---');
        console.log('Length:', d.length);
    } else {
        console.log('File does not exist at:', p);
        // List dir to be sure
        const dir = 'node_modules/vexflow/build/esm/src/fonts/';
        if (fs.existsSync(dir)) {
            console.log('Dir exists, contents:', fs.readdirSync(dir));
        } else {
            console.log('Dir does not exist:', dir);
        }
    }
} catch (e) { console.error(e); }
