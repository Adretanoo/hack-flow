const fs = require('fs');
const path = 'frontend/app/src/pages/participant/dashboard-tabs/ProjectTab.tsx';

// Step 1: decode double-encoded UTF-8 back to correct UTF-8
const rawBytes = fs.readFileSync(path);
const asLatin1 = rawBytes.toString('latin1');
let fixed = Buffer.from(asLatin1, 'latin1').toString('utf8');

// Step 2: fix TYPE_ICONS emoji values that are still corrupted
const iconFixes = [
  [/repository: '[^']*'/, "repository: '\uD83D\uDD17'"],
  [/demo: '[^']*'/, "demo: '\uD83C\uDF10'"],
  [/presentation: '[^']*'/, "presentation: '\uD83D\uDCCA'"],
  [/video: '[^']*'/, "video: '\uD83C\uDFA5'"],
  [/documentation: '[^']*'/, "documentation: '\uD83D\uDCC4'"],
  [/other: '[^']*'/, "other: '\uD83D\uDD27'"],
];
// Only fix inside the TYPE_ICONS block
const iconBlockMatch = fixed.match(/const TYPE_ICONS[^}]+}/);
if (iconBlockMatch) {
  let block = iconBlockMatch[0];
  iconFixes.forEach(([re, repl]) => { block = block.replace(re, repl); });
  fixed = fixed.replace(/const TYPE_ICONS[^}]+}/, block);
}

fs.writeFileSync(path, fixed, 'utf8');
console.log('Done. Contains Мануал:', fixed.includes('\u041c\u0430\u043d\u0443\u0430\u043b'));
console.log('Contains 🔗:', fixed.includes('\uD83D\uDD17'));
