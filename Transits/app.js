let mode='single'; let reportMode='snapshot';
let nowReadingActive=false;
function pad2boot(n){ n=String(n|0); return n.length<2 ? ('0'+n) : n; }
/** Local calendar date/time — never toISOString() (that is UTC). */
function initialLocalToday(){
  const n=new Date();
  const y=n.getFullYear(), m=n.getMonth()+1, d=n.getDate();
  const hh=n.getHours(), mm=n.getMinutes();
  const iso=y+'-'+pad2boot(m)+'-'+pad2boot(d);
  const hm=pad2boot(hh)+':'+pad2boot(mm);
  return {y:y, m:m, d:d, iso:iso, hh:hh, mm:mm, hm:hm};
}
let __BOOT_TODAY__=initialLocalToday();
let startDate=__BOOT_TODAY__.iso;
let endDate=null; // single-day default; range mode sets both inputs to today
let calViewYear=__BOOT_TODAY__.y, calViewMonth=__BOOT_TODAY__.m; // left pane month (1-12)
let rangeNeedsNewStart=true; // first click in range mode always sets start
let lastHtml='';
let lastMd='';
let engReady=false;

const $ = id => document.getElementById(id);
const status = (msg, cls='') => { const s=$('status'); if(!s) return; s.textContent=msg; s.className='status '+(cls||''); };

const TIMEZONES = [
  {id:'local', label:'Local browser time'},
  {id:'UTC', label:'UTC'},
  {id:'America/New_York', label:'America/New_York'},
  {id:'America/Chicago', label:'America/Chicago'},
  {id:'America/Denver', label:'America/Denver'},
  {id:'America/Los_Angeles', label:'America/Los_Angeles'},
  {id:'America/Sao_Paulo', label:'America/Sao_Paulo'},
  {id:'Europe/London', label:'Europe/London'},
  {id:'Europe/Berlin', label:'Europe/Berlin'},
  {id:'Europe/Paris', label:'Europe/Paris'},
  {id:'Europe/Moscow', label:'Europe/Moscow'},
  {id:'Asia/Dubai', label:'Asia/Dubai'},
  {id:'Asia/Kolkata', label:'Asia/Kolkata'},
  {id:'Asia/Bangkok', label:'Asia/Bangkok'},
  {id:'Asia/Shanghai', label:'Asia/Shanghai'},
  {id:'Asia/Tokyo', label:'Asia/Tokyo'},
  {id:'Australia/Sydney', label:'Australia/Sydney'},
  {id:'Pacific/Auckland', label:'Pacific/Auckland'}
];

function iso(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

/** Convert Y-M-D + HH:MM in a timezone to a UTC Date. */

function resolveTzId(tz){
  if(!tz || tz==='local'){
    try{ return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch(e){ return 'UTC'; }
  }
  return tz;
}
function formatDisplayDateTime(date, timeZone){
  const tz=resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year:'numeric', month:'long', day:'numeric',
    hour:'numeric', minute:'2-digit', second:undefined,
    hour12:true, timeZoneName:'short'
  }).formatToParts(d);
  const get = t => (parts.find(p=>p.type===t)||{}).value || '';
  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')} (${get('timeZoneName')})`;
}
function formatDisplayDateOnly(date, timeZone){
  const tz=resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year:'numeric', month:'long', day:'numeric'
  }).format(d);
}
function formatDisplayTimeOnly(date, timeZone){
  const tz=resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour:'numeric', minute:'2-digit', hour12:true, timeZoneName:'short'
  }).formatToParts(d);
  const get = t => (parts.find(p=>p.type===t)||{}).value || '';
  return `${get('hour')}:${get('minute')} ${get('dayPeriod')} (${get('timeZoneName')})`;
}
function pad2(n){ return String(n).padStart(2,'0'); }
function syncTimeHiddenFrom12(){
  const h12 = +($('hour12')?.value || 12);
  const mi = +($('minute')?.value || 0);
  const ap = $('ampm')?.value || 'AM';
  let h24 = h12 % 12;
  if(ap==='PM') h24 += 12;
  $('timeOfDay').value = pad2(h24)+':'+pad2(mi);
  clearNowReading();
}
function setTime12From24(timeStr){
  const [hh,mm] = (timeStr||'00:00').split(':').map(Number);
  const ap = hh>=12 ? 'PM' : 'AM';
  let h12 = hh % 12; if(h12===0) h12=12;
  if($('hour12')) $('hour12').value = String(h12);
  if($('minute')) $('minute').value = pad2(mm||0);
  if($('ampm')) $('ampm').value = ap;
  $('timeOfDay').value = pad2(hh||0)+':'+pad2(mm||0);
}
function initTime12Controls(){
  const hsel=$('hour12'), msel=$('minute');
  if(!hsel || hsel.options.length) return;
  for(let h=1; h<=12; h++){ const o=document.createElement('option'); o.value=String(h); o.textContent=String(h); hsel.appendChild(o); }
  for(let m=0; m<60; m++){ const o=document.createElement('option'); o.value=pad2(m); o.textContent=pad2(m); msel.appendChild(o); }
  const sync=()=>syncTimeHiddenFrom12();
  hsel.onchange=sync; msel.onchange=sync; $('ampm').onchange=sync;
  setTime12From24(($('timeOfDay')&&$('timeOfDay').value)||initialLocalToday().hm);
}

function zonedTimeToUtc(dateStr, timeStr, timeZone){
  const [y,mo,d] = dateStr.split('-').map(Number);
  const [hh,mm] = (timeStr||'00:00').split(':').map(Number);
  if(timeZone==='UTC') return new Date(Date.UTC(y,mo-1,d,hh,mm,0));
  if(timeZone==='local') return new Date(y, mo-1, d, hh, mm, 0);
  // Binary search offset for IANA zone
  const utcGuess = Date.UTC(y, mo-1, d, hh, mm, 0);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12:false,
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
  function partsInZone(ms){
    const parts = formatter.formatToParts(new Date(ms));
    const get = t => +parts.find(p=>p.type===t).value;
    return {y:get('year'), mo:get('month'), d:get('day'), h:get('hour')%24, mi:get('minute'), s:get('second')};
  }
  // Desired local wall time as minutes
  const want = ((d*24+hh)*60+mm); // rough; better compare components
  let lo = utcGuess - 36*3600*1000, hi = utcGuess + 36*3600*1000;
  for(let i=0;i<40;i++){
    const mid = Math.floor((lo+hi)/2);
    const p = partsInZone(mid);
    const cmp = (p.y-y)||(p.mo-mo)||(p.d-d)||(p.h-hh)||(p.mi-mm);
    if(cmp===0) return new Date(mid);
    if(cmp<0) lo=mid+60000; else hi=mid-60000;
  }
  // Fallback: closest
  return new Date(Math.floor((lo+hi)/2));
}

function fillTimezones(){
  const sel=$('tz');
  if(!sel) return;
  sel.innerHTML='';
  for(const z of TIMEZONES){
    const opt=document.createElement('option');
    opt.value=z.id; opt.textContent=z.label;
    sel.appendChild(opt);
  }
  sel.value='local';
}

function monthName(y, m){
  return new Date(y, m-1, 1).toLocaleString('en-US', {month:'long', year:'numeric'});
}
function shiftMonth(y, m, delta){
  const d=new Date(y, m-1+delta, 1);
  return {y:d.getFullYear(), m:d.getMonth()+1};
}
function formatFriendlyDate(isoStr){
  if(!isoStr) return '';
  const [y,m,d]=isoStr.split('-').map(Number);
  const dt=new Date(y, m-1, d);
  return dt.toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric'});
}
function selectionRangeText(){
  if(!startDate) return 'No date selected';
  if(mode==='single' || !endDate) return formatFriendlyDate(startDate);
  return formatFriendlyDate(startDate)+' to '+formatFriendlyDate(endDate);
}
function rangeDayCount(){
  if(!startDate) return 0;
  const a=startDate, b=endDate||startDate;
  const d0=new Date(a+'T12:00:00Z'), d1=new Date(b+'T12:00:00Z');
  return Math.floor(Math.abs(d1-d0)/86400000)+1;
}
function updateRangeHint(){
  const el=$('rangeHint'); if(!el) return;
  el.classList.remove('warn');
  if(mode!=='range'){ el.textContent=''; return; }
  if(!endDate){
    el.textContent='Range start selected ('+formatFriendlyDate(startDate)+'). Use ‹ › to change months — the start stays selected — then click the end date (or edit To). Clicking an earlier day swaps start/end.';
    return;
  }
  const n=rangeDayCount();
  const cap = reportMode==='timeline' ? 31 : 62;
  if(n>cap){
    el.classList.add('warn');
    el.textContent='Selected range is '+n+' days. '+(reportMode==='timeline'
      ? 'Timeline is limited to 31 days — shorten the range before running.'
      : 'This browser build allows at most 62 days — shorten the range before running.');
  } else {
    el.textContent=n+' day'+(n===1?'':'s')+' selected'+(reportMode==='timeline'?' (timeline cap 31)':'')+'.';
  }
}
function syncDateInputsFromState(){
  const from=$('dateFrom'), to=$('dateTo');
  if(from) from.value=startDate||'';
  if(to){
    to.value=(mode==='range' ? (endDate||startDate||'') : (startDate||''));
    to.disabled = (mode!=='range');
  }
}
function applyDateInputsToState(){
  clearNowReading();
  const from=($('dateFrom')?.value||'').trim();
  const to=($('dateTo')?.value||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)) return;
  if(mode==='single'){
    startDate=from; endDate=null; rangeNeedsNewStart=true;
  } else {
    let a=from, b=to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : null;
    if(b && b<a){ const t=a; a=b; b=t; }
    startDate=a; endDate=b;
    rangeNeedsNewStart = !b;
  }
  const [y,m]=startDate.split('-').map(Number);
  calViewYear=y; calViewMonth=m;
  const monthEl=$('month'); if(monthEl) monthEl.value=iso(calViewYear,calViewMonth,1).slice(0,7);
  renderCalendar();
}
function dayClassFor(id){
  const cls=['day'];
  if(mode==='single'){
    if(id===startDate) cls.push('selected');
  } else {
    if(id===startDate) cls.push('start');
    if(endDate && id===endDate) cls.push('end');
    if(endDate && id>startDate && id<endDate) cls.push('inrange');
    if(!endDate && id===startDate) cls.push('selected');
  }
  return cls.join(' ');
}
function buildMonthGrid(y, m){
  const wrap=document.createElement('div');
  wrap.className='calendar';
  const label=document.createElement('div');
  label.className='cal-month-label';
  label.textContent=monthName(y,m);
  wrap.appendChild(label);
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d=>{
    const el=document.createElement('div'); el.className='dow'; el.textContent=d; wrap.appendChild(el);
  });
  const first=new Date(y, m-1, 1);
  const startWeekday=first.getDay();
  const daysInMonth=new Date(y, m, 0).getDate();
  const prev=shiftMonth(y,m,-1);
  const prevDays=new Date(y, m-1, 0).getDate();
  for(let i=0;i<startWeekday;i++){
    const dayNum=prevDays-startWeekday+i+1;
    const id=iso(prev.y, prev.m, dayNum);
    const el=document.createElement('div');
    el.className=dayClassFor(id)+' other-month';
    el.textContent=dayNum;
    el.title=id;
    el.onclick=()=>onPick(id);
    wrap.appendChild(el);
  }
  for(let d=1;d<=daysInMonth;d++){
    const id=iso(y,m,d);
    const el=document.createElement('div');
    el.className=dayClassFor(id);
    el.textContent=d;
    el.title=id;
    el.onclick=()=>onPick(id);
    wrap.appendChild(el);
  }
  const cellsSoFar=startWeekday+daysInMonth;
  const trail=(7-(cellsSoFar%7))%7;
  const next=shiftMonth(y,m,1);
  for(let d=1;d<=trail;d++){
    const id=iso(next.y, next.m, d);
    const el=document.createElement('div');
    el.className=dayClassFor(id)+' other-month';
    el.textContent=d;
    el.title=id;
    el.onclick=()=>onPick(id);
    wrap.appendChild(el);
  }
  return wrap;
}
function renderCalendar(){
  const monthEl=$('month');
  if(monthEl && monthEl.value){
    const [ys,ms]=monthEl.value.split('-').map(Number);
    if(ys && ms){ calViewYear=ys; calViewMonth=ms; }
  }
  const cal=$('calendar'); if(!cal) return;
  cal.innerHTML='';
  const left={y:calViewYear, m:calViewMonth};
  const right=shiftMonth(calViewYear, calViewMonth, 1);
  cal.appendChild(buildMonthGrid(left.y, left.m));
  cal.appendChild(buildMonthGrid(right.y, right.m));
  const viewLab=$('calViewLabel');
  if(viewLab){
    viewLab.textContent = (left.y===right.y)
      ? (new Date(left.y,left.m-1,1).toLocaleString('en-US',{month:'long'})+' – '+new Date(right.y,right.m-1,1).toLocaleString('en-US',{month:'long'})+' '+left.y)
      : (monthName(left.y,left.m)+' – '+monthName(right.y,right.m));
  }
  const sel=$('selectionLabel');
  if(sel){
    if(sel.tagName==='INPUT') sel.value=selectionRangeText();
    else sel.textContent=selectionRangeText();
  }
  syncDateInputsFromState();
  updateRangeHint();
}


function onPick(id){
  clearNowReading();
  if(mode==='single'){
    startDate=id; endDate=null;
  } else {
    // First click after entering range mode (or after a completed range) sets start; second sets end (swap if earlier)
    if(rangeNeedsNewStart || !startDate || (startDate && endDate)){
      startDate=id; endDate=null; rangeNeedsNewStart=false;
    } else if(id < startDate){ endDate=startDate; startDate=id; }
    else if(id === startDate){ endDate=id; }
    else endDate=id;
  }
  const [py,pm]=id.split('-').map(Number);
  const left=calViewYear*12+calViewMonth;
  const right=left+1;
  const picked=py*12+pm;
  if(picked < left || picked > right){
    calViewYear=py; calViewMonth=pm;
    const monthEl=$('month'); if(monthEl) monthEl.value=iso(py,pm,1).slice(0,7);
  }
  renderCalendar();
}
function calPrevMonth(){
  const s=shiftMonth(calViewYear, calViewMonth, -1);
  calViewYear=s.y; calViewMonth=s.m;
  const monthEl=$('month'); if(monthEl) monthEl.value=iso(s.y,s.m,1).slice(0,7);
  renderCalendar();
}
function calNextMonth(){
  const s=shiftMonth(calViewYear, calViewMonth, 1);
  calViewYear=s.y; calViewMonth=s.m;
  const monthEl=$('month'); if(monthEl) monthEl.value=iso(s.y,s.m,1).slice(0,7);
  renderCalendar();
}


function clearPerson(n){
  const ta=$(n===1?'person1':'person2');
  if(ta) ta.value='';
  const file=$('file'+n);
  if(file) file.value=''; // allow reloading the same file in this slot
  const box=$('pngBox'+n); if(box) box.style.display='none';
  const img=$('pngImg'+n); if(img){ img.removeAttribute('src'); try{ img.src=''; }catch(e){} }
  const manName=$('manName'+n); if(manName) manName.value='';
  const manGates=$('manGates'+n); if(manGates) manGates.value='';
  const st=$('chartStatus'+n); if(st){ st.textContent=''; st.className='chart-status'; }
  clearQuickLoadHighlight(n);
  status('Cleared Person '+n+' — slot is empty','ok');
}

function omitLightsOn(){ try{ return !!document.getElementById('omitLights')?.checked; }catch(e){ return false; } }
function allGateOnlyOn(){ try{ return !!document.getElementById('allGateOnly')?.checked; }catch(e){ return false; } }
function syncOmitLightsUI(){
  const omit=(typeof omitLightsOn==='function')?omitLightsOn():!!(document.getElementById('omitLights')&&document.getElementById('omitLights').checked);
  const allGate=(typeof allGateOnlyOn==='function')?allGateOnlyOn():!!(document.getElementById('allGateOnly')&&document.getElementById('allGateOnly').checked);
  const override=omit || allGate;
  for(const id of ['moonGateOnly','sunGateOnly']){
    const el=document.getElementById(id);
    if(!el) continue;
    el.disabled=!!override;
    const lab=el.closest('label');
    if(lab){ lab.style.opacity=override?'0.45':''; lab.style.pointerEvents=override?'none':''; }
  }
  for(const hid of ['moonGateOnlyHint','sunGateOnlyHint']){
    const h=document.getElementById(hid);
    if(h) h.style.opacity=override?'0.45':'';
  }
}

function syncNowBtnHighlight(){
  const btn=document.getElementById('nowBtn');
  if(!btn) return;
  btn.classList.toggle('active', !!nowReadingActive);
  btn.setAttribute('aria-pressed', nowReadingActive?'true':'false');
}
function clearNowReading(){
  nowReadingActive=false;
  syncNowBtnHighlight();
}
function markNowReading(){
  nowReadingActive=true;
  syncNowBtnHighlight();
}

function syncRangeTransitFieldOpt(){
  const show = (mode==='range');
  const box=$('rangeTransitFieldOpt');
  const hint=$('rangeTransitFieldHint');
  if(box) box.style.display = show ? '' : 'none';
  if(hint) hint.style.display = show ? '' : 'none';
}

function syncWhenModeHighlight(){
  const ms=$('modeSingle'), mr=$('modeRange');
  const isSingle = mode==='single';
  if(ms){ ms.classList.toggle('active', isSingle); ms.setAttribute('aria-pressed', isSingle?'true':'false'); }
  if(mr){ mr.classList.toggle('active', !isSingle); mr.setAttribute('aria-pressed', !isSingle?'true':'false'); }
  syncRangeTransitFieldOpt();
}

function clearDates(){
  const now=new Date();
  const y=now.getFullYear(), m=now.getMonth()+1, d=now.getDate();
  startDate=iso(y,m,d);
  endDate=null;
  rangeNeedsNewStart=true;
  mode='single';
  clearNowReading();
  syncWhenModeHighlight();
  calViewYear=y; calViewMonth=m;
  const monthEl=$('month'); if(monthEl) monthEl.value=iso(y,m,1).slice(0,7);
  renderCalendar();
  status('Date selection reset to today (single day)','ok');
}
function parseInput(text){
  text=(text||'').trim();
  if(!text) return null;
  if(text.startsWith('{')) return JSON.parse(text);
  return text;
}
function setQuickLoadHighlight(n, sampleKey){
  const root=$('quickLoad'+n);
  if(!root) return;
  root.querySelectorAll('button.quick-sample').forEach(btn=>{
    const on=!!sampleKey && btn.getAttribute('data-sample')===sampleKey;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on?'true':'false');
  });
}
function clearQuickLoadHighlight(n){ setQuickLoadHighlight(n, null); }
function loadSampleInto(n, sampleKey){
  const src=(window.DATA&&DATA.samples&&DATA.samples[sampleKey]) || (window.HD_DATA&&HD_DATA.samples&&HD_DATA.samples[sampleKey]);
  if(!src){ status('Sample "'+sampleKey+'" not found','err'); return; }
  const clone=JSON.parse(JSON.stringify(src));
  setPersonText(n, clone, sampleKey);
}
function setPersonText(n,obj,sampleKey){
  const ta=$(n===1?'person1':'person2');
  const fresh = (typeof obj==='string') ? obj : JSON.stringify(obj,null,2);
  ta.value=fresh;
  updateChartStatus(n);
  if(sampleKey) setQuickLoadHighlight(n, sampleKey);
  else clearQuickLoadHighlight(n);
}
function updateChartStatus(n){
  const el=$('chartStatus'+n);
  const ta=$(n===1?'person1':'person2');
  if(!el||!ta) return;
  const raw=(ta.value||'').trim();
  if(!raw){ el.textContent=''; el.className='chart-status'; return; }
  try{
    if(typeof HD==='undefined' || !HD || typeof HD.loadPerson!=='function'){
      el.textContent='Chart engine not loaded yet — refresh the page.';
      el.className='chart-status err';
      return;
    }
    const person=HD.loadPerson(parseInput(raw) || raw);
    const v=HD.validateNatalOrStop ? HD.validateNatalOrStop(person, 'Person '+n) : {ok:true};
    if(!person.gates.size && !(person.all_planet_activations||[]).length){
      el.textContent='No natal planets/gates found in this input.';
      el.className='chart-status err';
      return;
    }
    const summary = (typeof chartLoadedSummary==='function' ? chartLoadedSummary(person) : null)
      || ('Chart loaded: '+(person.all_planet_activations||[]).length+' activations, channels: '+[...person.defined_channels].sort().join(', '));
    // chartLoadedSummary is inside HD engine — use HD if exported
    const line = (window.HD && HD.chartLoadedSummary) ? HD.chartLoadedSummary(person) : summary;
    if(person.gates.size && person.defined_channels.size===0){
      el.textContent=line+' — zero complete channels; check input.';
      el.className='chart-status warn';
    } else {
      el.textContent=line;
      el.className='chart-status';
    }
  }catch(e){
    el.textContent='Could not parse chart: '+(e&&e.message?e.message:e);
    el.className='chart-status err';
  }
}


function readFileAsText(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsText(file); }); }
function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function readFileAsArrayBuffer(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsArrayBuffer(file); }); }

function zipU16(view, off){ return view.getUint16(off, true); }
function zipU32(view, off){ return view.getUint32(off, true); }

async function inflateRawBytes(bytes){
  if(typeof DecompressionStream==='undefined'){
    throw new Error('This browser cannot unzip .docx (missing DecompressionStream). Use a current Chrome, Edge, or Firefox, or save the chart as .txt / .json.');
  }
  const ds=new DecompressionStream('deflate-raw');
  const stream=new Blob([bytes]).stream().pipeThrough(ds);
  const ab=await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

async function unzipDocxEntry(buf, entryName){
  const view=new DataView(buf);
  let eocd=-1;
  const minSearch=Math.max(0, buf.byteLength-65557);
  for(let i=buf.byteLength-22; i>=minSearch; i--){
    if(zipU32(view,i)===0x06054b50){ eocd=i; break; }
  }
  if(eocd<0) throw new Error('Not a valid .docx (ZIP) package');
  const totalEntries=zipU16(view, eocd+10);
  let cdOff=zipU32(view, eocd+16);
  for(let n=0;n<totalEntries;n++){
    if(zipU32(view, cdOff)!==0x02014b50) throw new Error('Corrupt .docx central directory');
    const method=zipU16(view, cdOff+10);
    const compSize=zipU32(view, cdOff+20);
    const nameLen=zipU16(view, cdOff+28);
    const extraLen=zipU16(view, cdOff+30);
    const commentLen=zipU16(view, cdOff+32);
    const localOff=zipU32(view, cdOff+42);
    const name=new TextDecoder('utf-8').decode(new Uint8Array(buf, cdOff+46, nameLen));
    if(name===entryName){
      if(zipU32(view, localOff)!==0x04034b50) throw new Error('Corrupt .docx local header');
      const lNameLen=zipU16(view, localOff+26);
      const lExtraLen=zipU16(view, localOff+28);
      const dataOff=localOff+30+lNameLen+lExtraLen;
      const compressed=new Uint8Array(buf, dataOff, compSize);
      if(method===0) return compressed;
      if(method===8) return await inflateRawBytes(compressed);
      throw new Error('Unsupported compression inside .docx (method '+method+')');
    }
    cdOff += 46+nameLen+extraLen+commentLen;
  }
  throw new Error('word/document.xml not found inside .docx');
}

function docxXmlToPlainText(xml){
  let t=String(xml)
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<w:tab\b[^>]*\/>/gi, '\t')
    .replace(/<w:br\b[^>]*\/>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCharCode(parseInt(h,16)))
    .replace(/\r\n/g,'\n');
  return t;
}

async function extractDocxText(fileOrBuf){
  const buf = fileOrBuf instanceof ArrayBuffer ? fileOrBuf : await readFileAsArrayBuffer(fileOrBuf);
  const u8=new Uint8Array(buf);
  if(u8.length>=4 && u8[0]===0xD0 && u8[1]===0xCF && u8[2]===0x11 && u8[3]===0xE0){
    const err=new Error('LEGACY_DOC');
    throw err;
  }
  if(!(u8.length>=2 && u8[0]===0x50 && u8[1]===0x4B)){
    throw new Error('Not a .docx Word file');
  }
  const xmlBytes=await unzipDocxEntry(buf, 'word/document.xml');
  const xml=new TextDecoder('utf-8').decode(xmlBytes);
  return docxXmlToPlainText(xml);
}

function chartObjectFromLoadedText(text, fallbackName){
  const trimmed=(text||'').trim();
  if(!trimmed) throw new Error('No chart text found in file');
  if(trimmed.startsWith('{')) return JSON.parse(trimmed);
  const parsed=HD.parseChartText(trimmed);
  if(!parsed.name) parsed.name=fallbackName||'Unknown';
  return parsed;
}

async function handleFile(n,file){
  if(!file) return;
  const name=(file.name||'').toLowerCase();
  const ta=$(n===1?'person1':'person2');
  const box=$('pngBox'+n); const img=$('pngImg'+n);
  const fallbackName=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
  if(name.endsWith('.doc') && !name.endsWith('.docx')){
    status('Legacy .doc files are not supported. Please re-save as .docx in Word (File → Save As → Word Document *.docx), then upload again.','err');
    return;
  }
  if(name.endsWith('.json')||name.endsWith('.txt')){
    box.style.display='none';
    const text=await readFileAsText(file);
    ta.value=JSON.stringify(chartObjectFromLoadedText(text, fallbackName),null,2);
    updateChartStatus(n);
    clearQuickLoadHighlight(n);
    status('Loaded '+file.name,'ok'); return;
  }
  if(name.endsWith('.docx') || (file.type||'')==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
    box.style.display='none';
    try{
      const text=await extractDocxText(file);
      ta.value=JSON.stringify(chartObjectFromLoadedText(text, fallbackName),null,2);
      updateChartStatus(n);
      clearQuickLoadHighlight(n);
      status('Loaded '+file.name,'ok');
    }catch(e){
      if(e && e.message==='LEGACY_DOC'){
        status('Legacy .doc files are not supported. Please re-save as .docx in Word (File → Save As → Word Document *.docx), then upload again.','err');
      } else {
        status('Could not read .docx: '+(e && e.message ? e.message : e),'err');
      }
    }
    return;
  }
  if(name.endsWith('.png')|| (file.type||'').startsWith('image/')){
    img.src=await readFileAsDataURL(file);
    box.style.display='block';
    let current; try{ current=parseInput(ta.value)||{}; }catch(e){ current={}; }
    if(typeof current==='string') current=HD.parseChartText(current);
    current=current||{};
    if(!current.name) current.name=fallbackName;
    current.planets=current.planets||{};
    current.notes=(current.notes||'')+' PNG loaded — enter gate.line values manually from the image.';
    ta.value=JSON.stringify(current,null,2);
    clearQuickLoadHighlight(n);
    status('PNG shown beside manual entry (no OCR bundled).','ok'); return;
  }
  status('Use .json, .txt, .docx, or .png (re-save legacy .doc as .docx)','err');
}

function applyManualGates(n){
  const name=$('manName'+n).value.trim();
  const raw=$('manGates'+n).value.trim();
  if(!raw&&!name){ status('Enter name and/or gates','err'); return; }
  let data=HD.parseChartText((name?('Name: '+name+'\n'):'')+raw.replace(/,/g,' / '));
  if(!Object.keys(data.planets||{}).length){
    const gls=raw.match(/\d{1,2}\.\d/g)||[];
    data.planets={}; gls.forEach((gl,i)=>data.planets['P'+(i+1)]=gl);
    data.hanging_gates=gls.map(gl=>+gl.split('.')[0]);
  }
  if(name) data.name=name;
  if(!data.name) data.name='Person '+n;
  setPersonText(n,data);
  status('Applied manual gates','ok');
}

function setNow(){
  const now=new Date();
  const tz=$('tz').value;
  // Display in selected zone
  let y,m,d,h,mi;
  if(tz==='local'){
    y=now.getFullYear(); m=now.getMonth()+1; d=now.getDate(); h=now.getHours(); mi=now.getMinutes();
  } else {
    const fmt=new Intl.DateTimeFormat('en-CA',{timeZone: tz==='UTC'?'UTC':tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false});
    const parts=Object.fromEntries(fmt.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
    y=+parts.year; m=+parts.month; d=+parts.day; h=+parts.hour%24; mi=+parts.minute;
  }
  startDate=iso(y,m,d); endDate=null; mode='single';
  $('month').value=`${y}-${String(m).padStart(2,'0')}`;
  setTime12From24(`${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`);
  syncWhenModeHighlight();
  markNowReading();
  renderCalendar();
  status('Set to now ('+tz+')','ok');
}

function buildTransitsForSelection(Astronomy){
  syncTimeHiddenFrom12();
  const timeStr=$('timeOfDay').value||'15:00';
  const tz=$('tz').value||'local';
  const dates = mode==='range' ? HD.dateRangeList(startDate, endDate||startDate) : [startDate];
  if(dates.length>62) throw new Error('Date ranges are limited to 62 days in this browser build (you selected '+dates.length+'). Shorten From/To or click a nearer end date.');
  return dates.map(ds=>{
    const utcDate=zonedTimeToUtc(ds, timeStr, tz);
    const field=HD.computeTransitField(Astronomy, utcDate);
    field.date=ds;
    field.tz=tz;
    field.display_when=formatDisplayDateTime(utcDate, tz);
    field.display_date=formatDisplayDateOnly(utcDate, tz);
    field.display_time=formatDisplayTimeOnly(utcDate, tz);
    return field;
  });
}

function runAnalysis(){
  try{
    if(!engReady || !window.Astronomy){ status('Ephemeris library not loaded','err'); return; }
    const p1=parseInput($('person1').value);
    const p2raw=$('person2').value.trim();
    const p2=p2raw?parseInput(p2raw):null;
    if(!p1){
      const friendly = (!p2raw)
        ? 'Add a chart to get started — paste JSON or text, upload a file, or load a sample for Person 1 (Person 2 is optional for a couple report).'
        : 'Person 1 is empty — add a chart in Person 1, or clear Person 2 and use Person 1 for a solo report.';
      const wrap=$('report');
      if(wrap) wrap.innerHTML='<p class="empty-hint">'+friendly+'</p>';
      lastHtml = wrap ? wrap.innerHTML : '';
      lastMd = friendly;
      status(friendly,'err');
      return;
    }
    // Deep-independent loads (loadPerson clones); never share/mutate across slots
    const person1=HD.loadPerson(p1);
    const person2=p2?HD.loadPerson(p2):null;
    updateChartStatus(1);
    if(p2) updateChartStatus(2);
    function stopChart(msg){
      const wrap=$('report');
      const htmlMsg='<p class="empty-hint">'+String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</p>';
      if(wrap) wrap.innerHTML=htmlMsg;
      lastHtml = wrap ? wrap.innerHTML : '';
      lastMd = msg;
      status(msg.split('\n')[0],'err');
    }
    const v1=HD.validateNatalOrStop(person1, person1.name||'Person 1');
    if(!v1.ok){ stopChart(v1.message); return; }
    if(person2){
      const v2=HD.validateNatalOrStop(person2, person2.name||'Person 2');
      if(!v2.ok){ stopChart(v2.message); return; }
    }
    const tz=$('tz').value||'local';

    if(reportMode==='timeline'){
      status('Scanning chart-relevant ingresses…');
      syncTimeHiddenFrom12();
      const dates = mode==='range' ? HD.dateRangeList(startDate, endDate||startDate) : [startDate];
      if(dates.length>31) throw new Error('Timeline ranges are limited to 31 days (you selected '+dates.length+'). Shorten From/To or click a nearer end date.');
      const startMs=zonedTimeToUtc(dates[0],'00:00',tz).getTime();
      const endMs=zonedTimeToUtc(addCalendarDays(dates[dates.length-1],1),'00:00',tz).getTime();
      const found=findChartRelevantEvents(window.Astronomy, person1, person2, startMs, endMs, tz);
      const rangeLabel = dates.length===1
        ? (formatDisplayDateOnly(new Date(startMs), tz)+' · full local day')
        : (formatDisplayDateOnly(new Date(startMs), tz)+' to '+formatDisplayDateOnly(new Date(endMs-60000), tz));
      const tzLabel = resolveTzId(tz);
      const startField=computeTransitField(window.Astronomy, new Date(startMs));
      startField.tz=tz;
      try{
        startField.display_when=formatDisplayDateTime(new Date(startMs), tz);
        startField.display_date=formatDisplayDateOnly(new Date(startMs), tz);
      }catch(e){}
      const meta={events:found.events, moonSkipped:found.moonSkipped, rawCount:found.rawCount, rangeLabel, tzLabel, tz, startField};
      lastHtml=renderTimelineHtml(person1, person2, meta);
      lastMd = lastHtml
        .replace(/<script[\s\S]*?<\/script>/gi,'')
        .replace(/<h2>/gi,'# ').replace(/<\/h2>/gi,'\n')
        .replace(/<h3>/gi,'## ').replace(/<\/h3>/gi,'\n')
        .replace(/<p><em>/gi,'').replace(/<\/em><\/p>/gi,'\n')
        .replace(/<p>/gi,'').replace(/<\/p>/gi,'\n\n')
        .replace(/<strong>/gi,'**').replace(/<\/strong>/gi,'**')
        .replace(/<br\s*\/?>/gi,'\n')
        .replace(/<div class="tech"><details class="tech"><summary>Technical details \(gates, channels, ephemeris\)<\/summary><pre>/gi,'\n\n<details><summary>Technical details</summary>\n\n```\n')
        .replace(/<\/pre><\/details><\/div>/gi,'\n```\n</details>\n')
        .replace(/<[^>]+>/g,'')
        .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
      $('report').innerHTML=lastHtml;
      let _shownN=found.events.length;
      if(interactionsOnlyOn() && person2){
        _shownN=found.events.filter(e=>isInteractionTimelineEvent(e, person1, person2)).length;
        $('ephemNote').textContent = 'Interaction timeline: '+_shownN+' interaction events ('+found.events.length+' chart-relevant)'+(found.moonSkipped?(' · '+found.moonSkipped+' quiet Moon shifts omitted'):'')+' · '+rangeLabel;
      } else {
        $('ephemNote').textContent = 'Timeline: '+found.events.length+' chart-relevant events'+(found.moonSkipped?(' · '+found.moonSkipped+' quiet Moon shifts omitted'):'')+' · '+rangeLabel;
      }
      status('Done — '+_shownN+' events','ok');
      window.__LAST_REPORT_MD__ = lastMd;
      window.__LAST_TRANSIT__ = found.events[0]?found.events[0].afterField:null;
      window.__LAST_EVENTS__ = found.events;
      return;
    }

    status('Computing live ephemeris…');
    const transits=buildTransitsForSelection(window.Astronomy);
    const field0=transits[0];
    const timeLabel=field0.display_when;
    lastHtml=HD.renderNarrativeHtml(person1, person2, transits, {timeLabel, tz: field0.tz});
    lastMd=HD.renderNarrativeMarkdown(person1, person2, transits, {timeLabel, tz: field0.tz});
    $('report').innerHTML=lastHtml;
    const field=transits[0];
    $('ephemNote').textContent = `Live field @ ${field.display_when}: Sun ${field.planets.Sun.gl}, Moon ${field.planets.Moon.gl}, NN(true) ${field.planets.NorthNode.gl}`;
    status('Done','ok');
    window.__LAST_REPORT_MD__ = lastMd;
    window.__LAST_TRANSIT__ = field;
    window.__LAST_EVENTS__ = null;
  }catch(e){
    status(String(e.message||e),'err');
    console.error(e);
  }
}

function downloadBlob(filename,text,mime){
  const blob=new Blob([text],{type:mime||'text/plain'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function exportMd(){ if(!lastMd){ status('Run analysis first','err'); return;} downloadBlob('transit-report.md', lastMd, 'text/markdown'); }
function exportHtml(){
  if(!lastHtml){ status('Run analysis first','err'); return;}
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Transit Report</title>
  <style>body{font-family:Georgia,serif;max-width:820px;margin:2rem auto;padding:0 1rem;line-height:1.6} h2,h3{margin-top:1.4rem} details{margin-top:2rem} pre{white-space:pre-wrap;font-size:.85rem;background:#f4f4f4;padding:1rem}</style></head>
  <body>${lastHtml}</body></html>`;
  downloadBlob('transit-report.html', html, 'text/html');
}

function loadCoupleSample(){
  loadSampleInto(1, 'dennis');
  loadSampleInto(2, 'eike');
  mode='single';
  syncWhenModeHighlight();
  applyBootTodayToInputs();
  const tzEl=$('tz'); if(tzEl) tzEl.value='America/New_York';
  renderCalendar();
  runAnalysis();
}

function showCdnFail(msg){
  const b=$('cdnBanner');
  b.textContent = msg || 'Could not load the astronomy-engine library from the CDN. Check your internet connection and reopen this file (or try again). Live transit positions cannot be calculated offline.';
  b.classList.add('show');
  $('runBtn').disabled=true;
  $('loadCouple').disabled=true;
  engReady=false;
}

function loadAstronomy(){
  return new Promise((resolve,reject)=>{
    if(window.Astronomy){ resolve(window.Astronomy); return; }
    const urls=[
      'astronomy.browser.min.js',
      './astronomy.browser.min.js',
      'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js',
      'https://unpkg.com/astronomy-engine@2.1.19/astronomy.browser.min.js'
    ];
    let i=0;
    function tryNext(){
      if(i>=urls.length){ reject(new Error('CDN load failed')); return; }
      const s=document.createElement('script');
      s.src=urls[i++];
      s.async=true;
      s.onload=()=>{
        // browser build may expose Astronomy global
        const A = window.Astronomy || window.astronomy || null;
        if(A && A.MakeTime){ window.Astronomy=A; resolve(A); }
        else if(typeof Astronomy!=='undefined'){ window.Astronomy=Astronomy; resolve(Astronomy); }
        else reject(new Error('Library loaded but Astronomy global missing'));
      };
      s.onerror=()=>tryNext();
      document.head.appendChild(s);
    }
    tryNext();
  });
}


function printReport(){
  const report=$('report');
  if(!report || !(report.textContent||'').trim() || /Load the ephemeris/.test(report.textContent||'')){
    status('Run an analysis first — then Print / Save as PDF prints only the report.','err');
    return;
  }
  // Ensure positions table (if present) stays in the print DOM; expand nothing else
  try{ window.print(); }catch(e){ status('Print failed: '+(e&&e.message?e.message:e),'err'); }
}

function applyBootTodayToInputs(){
  const t=initialLocalToday();
  __BOOT_TODAY__=t;
  startDate=t.iso;
  // Range defaults: From/To both today. In single mode endDate stays null for logic,
  // but the To input still shows today so switching to range is ready.
  endDate = (mode==='range') ? t.iso : null;
  calViewYear=t.y; calViewMonth=t.m;
  const monthEl=$('month'); if(monthEl) monthEl.value=t.iso.slice(0,7);
  const df=$('dateFrom'); if(df) df.value=t.iso;
  const dt=$('dateTo'); if(dt) dt.value=t.iso;
  const tod=$('timeOfDay');
  if(tod) tod.value=t.hm;
  try{ setTime12From24(t.hm); }catch(e){}
  try{ syncDateInputsFromState && syncDateInputsFromState(); }catch(e){}
  try{ if(typeof updateRangeHint==='function') updateRangeHint(); }catch(e){}
}
function wire(){
  const safe=(label,fn)=>{ try{ fn(); }catch(err){ console.error('wire:'+label, err); try{ status('Init warning ('+label+'): '+(err&&err.message?err.message:err),'err'); }catch(_e){} } };
  safe('tz', fillTimezones);
  safe('time12', initTime12Controls);
  safe('today', applyBootTodayToInputs);
  const monthEl=$('month'); if(monthEl) monthEl.onchange=()=>{ renderCalendar(); };
  const calPrev=$('calPrev'), calNext=$('calNext');
  if(calPrev) calPrev.onclick=calPrevMonth;
  if(calNext) calNext.onclick=calNextMonth;
  const dateFrom=$('dateFrom'), dateTo=$('dateTo');
  if(dateFrom) dateFrom.onchange=applyDateInputsToState;
  if(dateTo) dateTo.onchange=applyDateInputsToState;
  const ms=$('modeSingle'), mr=$('modeRange');
  if(ms) ms.onclick=()=>{mode='single';endDate=null;rangeNeedsNewStart=true;syncWhenModeHighlight();renderCalendar();};
  if(mr) mr.onclick=()=>{mode='range';endDate=null;rangeNeedsNewStart=true;clearNowReading();syncWhenModeHighlight();renderCalendar();};
  const f1=$('file1'), f2=$('file2');
  if(f1) f1.onchange=e=>handleFile(1,e.target.files&&e.target.files[0]);
  if(f2) f2.onchange=e=>handleFile(2,e.target.files&&e.target.files[0]);
  const cp1=$('clearPerson1'), cp2=$('clearPerson2'), cd=$('clearDates');
  if(cp1) cp1.onclick=()=>clearPerson(1);
  if(cp2) cp2.onclick=()=>clearPerson(2);
  if(cd) cd.onclick=()=>clearDates();
  document.querySelectorAll('button.quick-sample').forEach(btn=>{
    if(!btn.getAttribute('type')) btn.setAttribute('type','button');
    btn.addEventListener('click', ()=>loadSampleInto(+btn.getAttribute('data-slot'), btn.getAttribute('data-sample')));
  });
  ;[1,2].forEach(n=>{
    const ta=$(n===1?'person1':'person2');
    if(ta){ ta.addEventListener('input', ()=>clearQuickLoadHighlight(n)); ta.addEventListener('change', ()=>clearQuickLoadHighlight(n)); }
  });
  const lc=$('loadCouple'); if(lc) lc.onclick=loadCoupleSample;
  const rs=$('reportSnapshot'), rt=$('reportTimeline'), th=$('timelineHint');
  function setReportMode(m){
    reportMode=m;
    if(rs){ rs.classList.toggle('active', m==='snapshot'); rs.setAttribute('aria-pressed', m==='snapshot'?'true':'false'); }
    if(rt){ rt.classList.toggle('active', m==='timeline'); rt.setAttribute('aria-pressed', m==='timeline'?'true':'false'); }
    if(th) th.style.display = m==='timeline'?'block':'none';
    updateRangeHint();
  }
  if(rs) rs.onclick=()=>setReportMode('snapshot');
  if(rt) rt.onclick=()=>setReportMode('timeline');
  safe('reportMode', ()=>setReportMode(reportMode));

    const rangeFieldCb=$('includeRangeTransitField');
  if(rangeFieldCb) rangeFieldCb.onchange=()=>{ if(window.__LAST_TRANSIT__) runAnalysis(); };
  syncRangeTransitFieldOpt();
  const ic=$('includeCodes'); if(ic) ic.onchange=()=>{ if(window.__LAST_TRANSIT__) runAnalysis(); };
  const rwCb=$('realWorldInfluence'); if(rwCb) rwCb.onchange=()=>{ if(window.__LAST_TRANSIT__) runAnalysis(); };
  const moonCb=$('moonGateOnly'); if(moonCb) moonCb.onchange=()=>{ if(window.__LAST_TRANSIT__) runAnalysis(); };
  const sunCb=$('sunGateOnly'); if(sunCb) sunCb.onchange=()=>{ if(window.__LAST_TRANSIT__) runAnalysis(); };
  const allGateCb=$('allGateOnly'); if(allGateCb) allGateCb.onchange=()=>{ syncOmitLightsUI(); if(window.__LAST_TRANSIT__) runAnalysis(); };
  const omitCb=$('omitLights'); if(omitCb) omitCb.onchange=()=>{ syncOmitLightsUI(); if(window.__LAST_TRANSIT__) runAnalysis(); };
  safe('omitUI', syncOmitLightsUI);
  /* syncDirectOnlyUI removed */
  safe('nowBtn', syncNowBtnHighlight);
  const runBtn=$('runBtn'); if(runBtn) runBtn.onclick=runAnalysis;
  const nowBtn=$('nowBtn'); if(nowBtn) nowBtn.onclick=setNow;
  const am1=$('applyMan1'); if(am1) am1.onclick=()=>applyManualGates(1);
  const am2=$('applyMan2'); if(am2) am2.onclick=()=>applyManualGates(2);
  const em=$('exportMd'); if(em) em.onclick=exportMd;
  const eh=$('exportHtml'); if(eh) eh.onclick=exportHtml;
  const pb=$('printBtn'); if(pb) pb.onclick=()=>printReport();
  safe('whenMode', syncWhenModeHighlight);
  safe('reportMode2', ()=>setReportMode(reportMode));
  safe('calendar', renderCalendar);

  status('Loading ephemeris library…');
  loadAstronomy().then(()=>{
    engReady=true;
    status('Ephemeris ready (True Node · Gate 41 @ 302°)','ok');
    const q=new URLSearchParams(location.search);
    if(q.get('codes')==='1'){ const c=$('includeCodes'); if(c) c.checked=true; }
    if(q.get('codes')==='0'){ const c=$('includeCodes'); if(c) c.checked=false; }
    if(q.get('report')==='timeline'){ setReportMode('timeline'); }
    if(q.get('report')==='snapshot'){ setReportMode('snapshot'); }
    if(q.get('autorun')==='1'){
      // Autorun: load Dennis/Eike couple sample at current local date/time (tz set in loadCoupleSample)
      loadCoupleSample();
      if(q.get('range')==='7'){
        mode='range'; endDate=addCalendarDays(startDate,6);
        syncWhenModeHighlight();
        renderCalendar();
        runAnalysis();
      }
    }
  }).catch(err=>{
    showCdnFail();
    status(String(err.message||err),'err');
  });
}

window.__CAL_TEST__={getState:()=>({mode,startDate,endDate,calViewYear,calViewMonth,label:selectionRangeText(),days:rangeDayCount()}), setMode:(m)=>{mode=m; if(m==='single'){endDate=null; rangeNeedsNewStart=true;} else {endDate=null; rangeNeedsNewStart=true;} renderCalendar();}, pick:onPick, prev:calPrevMonth, next:calNextMonth, render:renderCalendar, applyInputs:applyDateInputsToState, clearPerson, clearDates};
function bootApp(){
  wire();
}
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bootApp); }
else { bootApp(); }
// iOS/Safari bfcache: re-apply local now when page is restored
(function(){
  var root=null;
  try{ root = (typeof window!=='undefined' && window) || (typeof self!=='undefined' && self) || null; }catch(e){ root=null; }
  if(!root || typeof root.addEventListener!=='function') return;
  try{
    root.addEventListener('pageshow', function(ev){
      try{
        applyBootTodayToInputs();
        if(typeof renderCalendar==='function') renderCalendar();
      }catch(e){ try{ console.error('pageshow today', e); }catch(_e){} }
    });
  }catch(e){ /* jsdom/vm hosts may reject window.addEventListener across realms */ }
})();
