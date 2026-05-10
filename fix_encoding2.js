const fs = require('fs');

// Map of corrupted string -> correct Ukrainian string (as unicode escapes)
const FIXES = [
  ['\u0420 \u0421\u0459\u0420 \u0412\u00b0\u0420 \u0420\u2026\u0420\u040e\u0421\u201c\u0420 \u0412\u00b0\u0420 \u0412\u00bb', '\u041c\u0430\u043d\u0443\u0430\u043b'],
  ['\u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u0449\u043e\u0431 \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u0438', '\u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u0449\u043e\u0431 \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u0438'],
];

// Better approach: fix based on known pattern
// The corruption is: UTF-8 bytes of Ukrainian were read as CP1252, then re-encoded as UTF-8
// To reverse: read the "corrupted" char codes, pack as CP1252 bytes, decode as UTF-8

function decodeCP1252Char(cp) {
  // CP1252 special chars (0x80-0x9F)
  const cp1252Map = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026,
    0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160,
    0x8B: 0x2039, 0x8C: 0x0152, 0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153,
    0x9E: 0x017E, 0x9F: 0x0178,
  };
  if (cp >= 0x80 && cp <= 0x9F && cp1252Map[cp]) return cp1252Map[cp];
  return cp;
}

// Reverse: given a unicode char that was misread from CP1252, get the original byte
function getOriginalByte(unicodeChar) {
  const cp = unicodeChar.charCodeAt(0);
  // For chars < 0x80 or 0xA0-0xFF, the CP1252 byte == the Unicode code point
  if (cp < 0x80 || (cp >= 0xA0 && cp <= 0xFF)) return cp;
  // For CP1252 special chars 0x80-0x9F, reverse map
  const cp1252ReverseMap = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F,
  };
  if (cp1252ReverseMap[cp] !== undefined) return cp1252ReverseMap[cp];
  return -1; // can't map
}

function fixString(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    const b = getOriginalByte(s[i]);
    if (b === -1) return null; // contains unmappable char
    bytes.push(b);
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch(e) {
    return null;
  }
}

const path = 'frontend/app/src/pages/participant/dashboard-tabs/ProjectTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find and fix all sequences of non-ASCII chars that could be corrupted Ukrainian
// We'll process the content character by character, collecting non-ASCII runs
// and trying to decode them

let result = '';
let i = 0;
let fixCount = 0;

while (i < content.length) {
  const cp = content.charCodeAt(i);
  
  // Check if this is a potentially corrupted sequence (non-ASCII, non-emoji)
  // Cyrillic block (0x400-0x4FF) and CP1252 special chars (0x80-0x9F range mapped)
  // and Latin extended (0x80-0xFF range)
  const isCorruptedCandidate = (cp >= 0x80 && cp <= 0xFF) ||
    (cp >= 0x0150 && cp <= 0x017F) || // Latin Extended-A
    (cp >= 0x0391 && cp <= 0x03FF) || // Greek
    (cp >= 0x2000 && cp <= 0x20FF) || // General Punctuation
    (cp >= 0x2100 && cp <= 0x21FF) || // Letterlike Symbols etc
    (cp >= 0x0400 && cp <= 0x04FF);   // Cyrillic
  
  if (isCorruptedCandidate) {
    // Collect the run
    let run = '';
    let j = i;
    while (j < content.length) {
      const c2 = content.charCodeAt(j);
      if (c2 < 0x80 && c2 !== 0x27 && c2 !== 0x22) break; // stop at ASCII (but not quotes within run)
      // Allow space within runs? Actually Ukrainian strings may be multi-word
      if (c2 === 0x20) { // space - check if surrounded by non-ASCII
        if (j + 1 < content.length) {
          const next = content.charCodeAt(j + 1);
          if (next < 0x80) break; // space at end of non-ASCII run
        }
      }
      run += content[j];
      j++;
    }
    
    if (run.length > 0) {
      const fixed = fixString(run);
      if (fixed && /[\u0400-\u04FF]/.test(fixed)) {
        result += fixed;
        fixCount++;
        i = j;
        continue;
      }
    }
  }
  
  result += content[i];
  i++;
}

console.log('Fixed', fixCount, 'sequences');
console.log('Has Мануал:', result.includes('\u041c\u0430\u043d\u0443\u0430\u043b'));
console.log('Has \u0427\u0430\u0441:', result.includes('\u0427\u0430\u0441 \u0432\u0438\u0439\u0448\u043e\u0432'));

fs.writeFileSync(path, result, 'utf8');
console.log('Written.');
