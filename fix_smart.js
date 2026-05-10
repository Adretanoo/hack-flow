const fs=require('fs');
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
const REV={};
FWD.forEach((cp,b)=>{if(cp)REV[cp]=b;});

function decodeOnce(str){
  const bytes=[];
  for(let i=0;i<str.length;i++){
    const cp=str.codePointAt(i);
    if(cp>0xFFFF){i++;continue;}
    const b=REV[cp];
    if(b===undefined) return null;
    bytes.push(b);
  }
  if(!bytes.length) return null;
  try{return Buffer.from(bytes).toString('utf8');}catch(e){return null;}
}

// These unicode ranges only appear in corrupted CP1251 output, not in real Ukrainian
function isCorruptedChar(cp){
  return (cp>=0x450&&cp<=0x45F)||cp===0x2026||cp===0x2013||cp===0x2014||
         cp===0x2018||cp===0x2019||cp===0x201C||cp===0x201D||cp===0x2022||
         cp===0x2116||cp===0x2122||cp===0x203A||cp===0x2039||cp===0x20AC||
         (cp>=0x400&&cp<=0x40F)||cp===0xA0||cp===0x490||cp===0x491||
         (cp>=0x100&&cp<=0x17F); // Latin Extended
}

function isRegularUkrainian(cp){
  // Normal Ukrainian: А-Я а-я + ї є і ґ Ї Є І Ґ
  return (cp>=0x410&&cp<=0x44F)||cp===0x456||cp===0x457||cp===0x454||
         cp===0x491||cp===0x406||cp===0x407||cp===0x404||cp===0x490;
}

const path='frontend/app/src/pages/participant/dashboard-tabs/ProjectTab.tsx';
let c=fs.readFileSync(path,'utf8');
let out='';let i=0;let fixed=0;

while(i<c.length){
  const cp=c.codePointAt(i);
  // Start a run only if we see a corrupted indicator char
  if(isCorruptedChar(cp)||(cp===0x420&&i+1<c.length&&isCorruptedChar(c.codePointAt(i+1)))||
     (cp>=0x410&&cp<=0x42F&&i+1<c.length&&c.codePointAt(i+1)===0xA0)){
    let run='',j=i;
    let hasCorrupted=false;
    while(j<c.length){
      const cp2=c.codePointAt(j);
      if(cp2===0x0A||cp2===0x0D) break; // newline
      if(cp2<0x80&&cp2!==0x20) break;   // ASCII non-space stops run
      if(cp2===0x20){
        const nxt=j+1<c.length?c.codePointAt(j+1):0;
        if(isCorruptedChar(nxt)||isRegularUkrainian(nxt)||nxt===0xA0){run+=c[j];j++;continue;}
        break;
      }
      if(isCorruptedChar(cp2)){hasCorrupted=true;run+=c[j];j++;continue;}
      if(isRegularUkrainian(cp2)||cp2===0xA0){run+=c[j];j++;continue;}
      break;
    }
    if(run.length>0&&hasCorrupted){
      const d1=decodeOnce(run);
      const d2=d1?decodeOnce(d1):null;
      if(d2&&/[\u0410-\u044F\u0456\u0457\u0454\u0491]/.test(d2)){out+=d2;fixed++;i=j;continue;}
      if(d1&&/[\u0410-\u044F\u0456\u0457\u0454\u0491]/.test(d1)){out+=d1;fixed++;i=j;continue;}
    }
  }
  if(cp>0xFFFF){out+=c[i]+c[i+1];i+=2;}else{out+=c[i];i++;}
}

fs.writeFileSync(path,out,'utf8');
console.log('Fixed:',fixed);
const v=fs.readFileSync(path,'utf8');
['\u041f\u0440\u043e\u0454\u043a\u0442','\u041d\u0430\u0437\u0432\u0430','\u041f\u043e\u0434\u0430\u0442\u0438',
 '\u0420\u0435\u0441\u0443\u0440\u0441','\u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430','\u041c\u0430\u043d\u0443\u0430\u043b']
 .forEach(s=>console.log(s,':',v.includes(s)?'OK':'MISSING'));
