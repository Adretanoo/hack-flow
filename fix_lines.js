const fs=require('fs');
const p='frontend/app/src/pages/participant/dashboard-tabs/ProjectTab.tsx';
let lines=fs.readFileSync(p,'utf8').split('\n');

// Line-by-line replacements (0-indexed)
const fixes={
  121: `    onSuccess: () => { toast.success('\u041f\u0440\u043e\u0454\u043a\u0442 \u0441\u0442\u0432\u043e\u0440\u0435\u043d\u043e'); invalidate() },`,
  122: `    onError: (e: any) => toast.error(e?.response?.data?.message ?? '\u041f\u043e\u043c\u0438\u043b\u043a\u0430'),`,
  127: `    onSuccess: () => { toast.success('\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e'); setEditMode(false); invalidate() },`,
  128: `    onError: (e: any) => toast.error(e?.response?.data?.message ?? '\u041f\u043e\u043c\u0438\u043b\u043a\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f'),`,
  133: `    onSuccess: () => { toast.success('\uD83C\uDF89 \u041f\u0440\u043e\u0454\u043a\u0442 \u043f\u043e\u0434\u0430\u043d\u043e!'); setShowConfirm(false); invalidate() },`,
  134: `    onError: (e: any) => { toast.error(e?.response?.data?.message ?? '\u041f\u043e\u043c\u0438\u043b\u043a\u0430 \u043f\u043e\u0434\u0430\u0447\u0456'); setShowConfirm(false) },`,
  139: `    onSuccess: () => { toast.success('\u041f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0434\u043e\u0434\u0430\u043d\u043e'); setShowResForm(false); resForm.reset(); invalidate() },`,
  140: `    onError: (e: any) => toast.error(e?.response?.data?.message ?? '\u041f\u043e\u043c\u0438\u043b\u043a\u0430'),`,
  156: `    <div className="text-4xl">\u274c</div>`,
  157: `    <h3 className="text-xl font-bold text-red-800">\u041a\u043e\u043c\u0430\u043d\u0434\u0443 \u0432\u0456\u0434\u0445\u0438\u043b\u0435\u043d\u043e / \u0434\u0438\u0441\u043a\u0432\u0430\u043b\u0456\u0444\u0456\u043a\u043e\u0432\u0430\u043d\u043e</h3>`,
  163: `      {/* No project */}`,
  170: `        <p className="font-semibold text-lg">\u041f\u0440\u043e\u0454\u043a\u0442 \u043c\u043e\u0436\u043d\u0430 \u043f\u043e\u0434\u0430\u0442\u0438 \u043f\u0456\u0434 \u0447\u0430\u0441 \u0435\u0442\u0430\u043f\u0443 Hacking</p>`,
  182: `          <h3 className="font-bold text-lg">\u041d\u043e\u0432\u0438\u0439 \u043f\u0440\u043e\u0454\u043a\u0442</h3>`,
  186: `          <label className="block text-sm font-medium mb-1.5">\u041d\u0430\u0437\u0432\u0430 *</label>`,
  187: `          <input {...register('title', { required: true })} placeholder="\u0412\u0432\u0435\u0434\u0456\u0442\u044c \u043d\u0430\u0437\u0432\u0443 \u043f\u0440\u043e\u0454\u043a\u0442\u0443..."`,
  208: `  {/* Status config */}`,
  210: `    DRAFT:     { icon: '\u270f\uFE0F', label: '\u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430',       cls: 'border-amber-200 bg-amber-50 text-amber-900' },`,
  211: `    SUBMITTED: { icon: '\u2705', label: '\u041f\u0440\u043e\u0454\u043a\u0442 \u043f\u043e\u0434\u0430\u043d\u043e',   cls: 'border-blue-200 bg-blue-50 text-blue-900' },`,
  212: `    REVIEWED:  { icon: '\uD83D\uDC41\uFE0F', label: '\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u043e',     cls: 'border-purple-200 bg-purple-50 text-purple-900' },`,
  213: `    APPROVED:  { icon: '\uD83C\uDFC6', label: '\u0421\u0445\u0432\u0430\u043b\u0435\u043d\u043e!',       cls: 'border-green-200 bg-green-50 text-green-900' },`,
  214: `    REJECTED:  { icon: '\u274c', label: '\u0412\u0456\u0434\u0445\u0438\u043c\u043b\u0435\u043d\u043e',       cls: 'border-red-200 bg-red-50 text-red-900' },`,
  228: `          <h3 className="font-bold text-lg">\u041f\u043e\u0434\u0430\u0442\u0438 \u043f\u0440\u043e\u0454\u043a\u0442?</h3>`,
  239: `              {submitMut.isPending ? '\u041f\u043e\u0434\u0430\u0454\u043c\u043e...' : '\u0422\u0430\u043a, \u043f\u043e\u0434\u0430\u0442\u0438'}`,
  256: `            <Clock className="h-3.5 w-3.5" /> \u0414\u043e \u043a\u0456\u043d\u0446\u044f \u0445\u0430\u043a\u0456\u043d\u0433\u0443: <Countdown endDate={hackingEndDate!} />`,
  265: `          <p className="text-xs">\u041a\u043e\u043c\u0435\u043d\u0442\u0430\u0440: &quot;{project.comment}&quot;</p>`,
  300: `          <label className="block text-sm font-medium mb-1.5">\u041d\u0430\u0437\u0432\u0430 *</label>`,
  326: `              <Plus className="h-3.5 w-3.5" /> \u0414\u043e\u0434\u0430\u0442\u0438 \u0440\u0435\u0441\u0443\u0440\u0441`,
  334: `            <p>\u0420\u0435\u0441\u0443\u0440\u0441\u0456\u0432 \u0449\u0435 \u043d\u0435\u043c\u0430\u0454. \u0414\u043e\u0434\u0430\u0439\u0442\u0435 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0430 \u0440\u0435\u043f\u043e\u0437\u0438\u0442\u043e\u0440\u0456\u0439.</p>`,
  342: `              <span className="text-lg shrink-0">{TYPE_ICONS[(res.type?.name ?? '')] ?? '\uD83D\uDD17'}</span>`,
};

Object.entries(fixes).forEach(([lineStr, replacement])=>{
  const n=parseInt(lineStr);
  if(lines[n]!==undefined){
    lines[n]=replacement;
  } else {
    console.warn('Line',n,'not found (file has',lines.length,'lines)');
  }
});

// Also fix resources section header line
const resSectionIdx=lines.findIndex(l=>l.includes('font-semibold flex items-center')&&l.includes('LinkIcon'));
if(resSectionIdx>=0){
  lines[resSectionIdx]=`          <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" /> \u0420\u0435\u0441\u0443\u0440\u0441\u0438 \u043f\u0440\u043e\u0454\u043a\u0442\u0443</h3>`;
  console.log('Fixed resources header at line',resSectionIdx+1);
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');

// Verify
const v=fs.readFileSync(p,'utf8');
['\u041f\u0440\u043e\u0454\u043a\u0442','\u041d\u0430\u0437\u0432\u0430','\u041f\u043e\u0434\u0430\u0442\u0438','\u0420\u0435\u0441\u0443\u0440\u0441','\u0414\u043e \u043a\u0456\u043d\u0446\u044f']
  .forEach(s=>console.log(s,':',v.includes(s)?'OK':'MISSING'));
console.log('Total lines:',v.split('\n').length);
