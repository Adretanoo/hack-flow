const fs=require('fs');
// Full CP1251 forward table (byte -> unicode codepoint)
const FWD=[];
for(let i=0;i<128;i++) FWD.push(i);
[0x402,0x403,0x201A,0x453,0x201E,0x2026,0x2020,0x2021,0x20AC,0x2030,0x409,0x2039,0x40A,0x40C,0x40B,0x40F,
 0x452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0,0x2122,0x459,0x203A,0x45A,0x45D,0x45B,0x45F,
 0xA0,0x40E,0x45E,0x408,0xA4,0x490,0xA6,0xA7,0x401,0xA9,0x404,0xAB,0xAC,0xAD,0xAE,0x407,
 0xB0,0xB1,0x406,0x456,0x491,0xB5,0xB6,0xB7,0x451,0x2116,0x454,0xBB,0x458,0x405,0x455,0x457,
 0x410,0x411,0x412,0x413,0x414,0x415,0x416,0x417,0x418,0x419,0x41A,0x41B,0x41C,0x41D,0x41E,0x41F,
 0x420,0x421,0x422,0x423,0x424,0x425,0x426,0x427,0x428,0x429,0x42A,0x42B,0x42C,0x42D,0x42E,0x42F,
 0x430,0x431,0x432,0x433,0x434,0x435,0x436,0x437,0x438,0x439,0x43A,0x43B,0x43C,0x43D,0x43E,0x43F,
 0x440,0x441,0x442,0x443,0x444,0x445,0x446,0x447,0x448,0x449,0x44A,0x44B,0x44C,0x44D,0x44E,0x44F
].forEach(v=>FWD.push(v));

// Build reverse: unicode codepoint -> byte
const REV={};
FWD.forEach((cp,byte)=>{ if(cp) REV[cp]=byte; });

function cp1251BytesToStr(bytes){
  let s='';
  for(const b of bytes) s+=String.fromCodePoint(FWD[b]||b);
  return s;
}

function getCP1251Byte(cp){
  return REV[cp]; // returns undefined if no mapping
}

// Try to decode a string by treating each unicode char as a CP1251 byte
function decodeViaCP1251(str){
  const bytes=[];
  for(let i=0;i<str.length;i++){
    const cp=str.codePointAt(i);
    if(cp>0xFFFF) i++; // surrogate pair
    const b=getCP1251Byte(cp);
    if(b===undefined) return null;
    bytes.push(b);
  }
  try{ return Buffer.from(bytes).toString('utf8'); }catch(e){return null;}
}

const path='frontend/app/src/pages/participant/dashboard-tabs/ProjectTab.tsx';
let c=fs.readFileSync(path,'utf8');

// Process character by character, collecting potential corrupted runs
let out='';
let i=0;
let fixed=0;

while(i<c.length){
  const cp=c.codePointAt(i);
  const ch=c[i];
  const isHighUni=(cp>0x7F&&cp!==0xA0)&&cp!==0x2714&&cp!==0xFE0F&&!(cp>=0x1F000&&cp<=0x1FFFF);
  
  if(cp>=0x100&&cp<=0x4FF){ // possible CP1251-originated char
    let run='',j=i;
    while(j<c.length){
      const cp2=c.codePointAt(j);
      const inc=cp2>0xFFFF?2:1;
      // Include if: high unicode that could be CP1251 char, NBSP, or regular space followed by more high-unicode
      if(cp2===0x20){
        // space: include only if next char is also high unicode
        const nxt=j+1<c.length?c.codePointAt(j+1):0;
        if(nxt>=0x100&&nxt<=0x4FF){ run+=c[j]; j+=inc; continue; }
        break;
      }
      if(cp2===0xA0){ run+=c[j]; j+=inc; continue; } // NBSP - always include
      if(cp2>=0x100&&cp2<=0x4FF){ run+=c[j]; j+=inc; continue; }
      if(cp2>=0x2000&&cp2<=0x203A){ run+=c[j]; j+=inc; continue; } // punctuation range
      if(cp2===0x2116||cp2===0x2122){ run+=c[j]; j+=inc; continue; }
      break;
    }
    if(run.length>0){
      // Try double decode (triple encoding)
      const d1=decodeViaCP1251(run);
      const d2=d1?decodeViaCP1251(d1):null;
      if(d2&&/[\u0400-\u04FF\u0020-\u007E]/.test(d2)&&!/undefined/.test(d2)){
        out+=d2; fixed++; i=j; continue;
      }
      if(d1&&/[\u0400-\u04FF]/.test(d1)){
        out+=d1; fixed++; i=j; continue;
      }
    }
  }
  
  // Handle emoji (don't touch)
  if(cp>0xFFFF){ out+=ch+c[i+1]; i+=2; continue; }
  out+=ch; i++;
}

fs.writeFileSync(path,out,'utf8');
console.log('Fixed runs:',fixed);
// Verify
const v=fs.readFileSync(path,'utf8');
['\u041f\u0440\u043e\u0454\u043a\u0442','\u041d\u0430\u0437\u0432\u0430','\u041f\u043e\u0434\u0430\u0442\u0438','\u0420\u0435\u0441\u0443\u0440\u0441','\u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430'].forEach(s=>
  console.log(s,':',v.includes(s)?'OK':'MISSING')
);
