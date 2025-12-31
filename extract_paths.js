const fs = require('fs');
const path = require('path');

const targetKeys = [
    'tremolo3',
    'graceNoteSlashStemUp',
    'noteheadParenthesisLeft',
    'noteheadParenthesisRight',
    'accidentalParenthesisLeft', // Fallback
    'accidentalParenthesisRight' // Fallback
];

const filePath = 'node_modules/vexflow/build/esm/src/fonts/bravura.js';

try {
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');

    targetKeys.forEach(key => {
        // Pattern: "key": { ... "d": "pathdata" ... }
        // We look for the key, then capture the "d" value nearby
        const regex = new RegExp(`"${key}":\\s*\\{[^}]*"d":\\s*"([^"]*)"`, 's');
        const match = regex.exec(content);
        if (match) {
            console.log(`FOUND ${key}`);
            console.log(match[1]);
            console.log('--------');
        } else {
            console.log(`MISSING ${key}`);
        }
    });

} catch (err) {
    console.error('Error:', err);
}
