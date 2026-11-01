const PLANET_ORDER = ["Sun","Earth","Moon","NorthNode","SouthNode","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
const DATA = window.HD_DATA;
const GATES = DATA.gates;
const CHANNELS = DATA.channels;
const CENTERS_NOT_SELF = DATA.centers_not_self || {};
const TYPE_NOT_SELF = DATA.type_not_self || {};
const ALL_CENTER_NAMES = ["Head","Ajna","Throat","G","Heart/Ego","Sacral","Solar Plexus","Spleen","Root"];

/* Rave mandala: Gate 41 begins at 302° tropical ecliptic longitude.
   Wheel order is the standard HD binary sequence around the zodiac. */
const WHEEL = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,
  27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,
  28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60
];
const GATE_SIZE = 360/64; // 5.625
const LINE_SIZE = GATE_SIZE/6; // 0.9375
const GATE41_START = 302;

function normLon(x){ x%=360; if(x<0)x+=360; return x; }

function lonToGateLine(lon){
  let x = normLon(lon - GATE41_START);
  const idx = Math.floor(x / GATE_SIZE) % 64;
  const within = x - idx * GATE_SIZE;
  const line = Math.min(6, Math.floor(within / LINE_SIZE) + 1);
  return {gate:WHEEL[idx], line, gl:WHEEL[idx]+'.'+line, lon:normLon(lon)};
}

function meanNodeLon(time){
  const t = time.tt / 36525.0;
  const t2=t*t, t3=t2*t, t4=t2*t2;
  return normLon(125.0445479 - 1934.1362891*t + 0.0020754*t2 + t3/467441 - t4/60616000);
}

/** True lunar ascending node via Moon ecliptic r × v (HD standard). */
function trueNodeLon(Astronomy, time){
  const ta = time;
  const tb = time.AddDays(0.001);
  const ma = Astronomy.EclipticGeoMoon(ta);
  const mb = Astronomy.EclipticGeoMoon(tb);
  function sphCart(lon, lat, dist){
    const lr = lon*Math.PI/180, br = lat*Math.PI/180, c=Math.cos(br);
    return {x:dist*c*Math.cos(lr), y:dist*c*Math.sin(lr), z:dist*Math.sin(br)};
  }
  const ra = sphCart(ma.lon, ma.lat, ma.dist);
  const rb = sphCart(mb.lon, mb.lat, mb.dist);
  const dt = 0.001;
  const vx=(rb.x-ra.x)/dt, vy=(rb.y-ra.y)/dt, vz=(rb.z-ra.z)/dt;
  const hx = ra.y*vz - ra.z*vy;
  const hy = ra.z*vx - ra.x*vz;
  return normLon(Math.atan2(hx, -hy) * 180/Math.PI);
}

function geoEclipticLon(Astronomy, body, time){
  if(body==='Moon') return Astronomy.EclipticGeoMoon(time).lon;
  if(body==='Earth'){
    const sun = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, time, true)).elon;
    return normLon(sun+180);
  }
  if(body==='NorthNode') return trueNodeLon(Astronomy, time);
  if(body==='SouthNode') return normLon(trueNodeLon(Astronomy, time)+180);
  const e = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body[body], time, true));
  return e.elon;
}

function computeTransitField(Astronomy, dateObj){
  const time = Astronomy.MakeTime(dateObj);
  const planets = {};
  for(const p of PLANET_ORDER){
    const lon = geoEclipticLon(Astronomy, p, time);
    const gl = lonToGateLine(lon);
    planets[p] = {gate:gl.gate, line:gl.line, gl:gl.gl, lon:gl.lon};
  }
  return {
    date: dateObj.toISOString().slice(0,10),
    datetime_utc: dateObj.toISOString(),
    time_gmt: dateObj.toISOString().slice(11,19),
    planets,
    source: 'astronomy-engine (geocentric ecliptic; True Lunar Node; Gate 41 @ 302°)',
    node_note: 'True Node (orbital r×v). Mean Node available in library internals but not used.'
  };
}

function parseGl(value){
  if(value && typeof value==='object'){
    if(value.gl && value.gate!=null) return {gate:+value.gate, line:+value.line, gl:value.gl};
    const gl = value.gl || (value.gate+'.'+value.line);
    const [g,l]=String(gl).split('.');
    return {gate:+g, line:+l, gl:(+g)+'.'+(+l)};
  }
  const m=String(value).trim().match(/^(\d{1,2})\.(\d)$/);
  if(!m) throw new Error('Invalid gate.line: '+value);
  return {gate:+m[1], line:+m[2], gl:(+m[1])+'.'+(+m[2])};
}

function normalizeChannel(ch){
  const m=String(ch).match(/(\d{1,2})\s*[–\-/\s]\s*(\d{1,2})/);
  if(!m) return null;
  const a=+m[1], b=+m[2];
  return Math.min(a,b)+'-'+Math.max(a,b);
}

function parseChartText(text){
  const data={name:null, planets:{}, design_planets:{}, hanging_gates:[], defined_channels:[], activations:[]};
  if(text==null) return data;
  let raw=String(text).replace(/\u00a0/g,' ');

  let nm=raw.match(/(?:Natal\s*Name|Birth\s*Name|Chart\s*Name)\s*[:=]\s*(.+)/i)
    || raw.match(/(?:^|\n)\s*Name\s*[:=]\s*(.+)/i)
    || raw.match(/^\s*([A-Za-z][A-Za-z'\-]+)\s+Type\s*:/i);
  if(nm) data.name=nm[1].split(/\n/)[0].trim();

  const PLANET_ALIASES={
    sun:'Sun', '☉':'Sun', sol:'Sun',
    earth:'Earth', '⊕':'Earth', terra:'Earth',
    moon:'Moon', '☽':'Moon', '☾':'Moon', luna:'Moon',
    northnode:'NorthNode', 'north node':'NorthNode', 'n.node':'NorthNode', nn:'NorthNode',
    'true node':'NorthNode', rahu:'NorthNode',
    southnode:'SouthNode', 'south node':'SouthNode', 's.node':'SouthNode', sn:'SouthNode',
    ketu:'SouthNode',
    mercury:'Mercury', merc:'Mercury',
    venus:'Venus', mars:'Mars', jupiter:'Jupiter', jup:'Jupiter',
    saturn:'Saturn', sat:'Saturn', uranus:'Uranus', ura:'Uranus',
    neptune:'Neptune', nep:'Neptune', pluto:'Pluto', plu:'Pluto'
  };
  const SYM_TO_PLANET={'☉':'Sun','⊕':'Earth','☽':'Moon','☾':'Moon','☊':'NorthNode','☋':'SouthNode','☿':'Mercury','♀':'Venus','♂':'Mars','♃':'Jupiter','♄':'Saturn','♅':'Uranus','♆':'Neptune','♇':'Pluto'};

  function normPlanet(tok){
    if(!tok) return null;
    let t=String(tok).trim().replace(/\s+/g,' ');
    if(SYM_TO_PLANET[t]) return SYM_TO_PLANET[t];
    const key=t.toLowerCase();
    if(PLANET_ALIASES[key]) return PLANET_ALIASES[key];
    const nospace=key.replace(/\s+/g,'');
    if(PLANET_ALIASES[nospace]) return PLANET_ALIASES[nospace];
    for(const p of PLANET_ORDER){ if(p.toLowerCase()===nospace || p.toLowerCase()===key) return p; }
    return null;
  }
  function sideFromPrefix(prefix){
    if(!prefix) return null;
    const p=String(prefix).toLowerCase().replace(/\s+/g,'');
    if(p==='d'||p==='design'||p==='unconscious'||p==='red') return 'design';
    if(p==='p'||p==='personality'||p==='conscious'||p==='black') return 'personality';
    return null;
  }
  function store(planet, glStr, side){
    if(!planet) return;
    const m=String(glStr).trim().match(/^(\d{1,2})\.(\d)$/);
    if(!m) return;
    const gate=+m[1], line=+m[2];
    if(gate<1||gate>64||line<1||line>6) return;
    const gl=gate+'.'+line;
    const sideKey=side||'personality';
    const actKey=sideKey+'|'+planet+'|'+gl;
    if(!data._actSeen) data._actSeen=Object.create(null);
    if(!data._actSeen[actKey]){
      data._actSeen[actKey]=1;
      data.activations.push({planet, gate, line, gl, side:sideKey});
    }
    if(sideKey==='design'){
      data.design_planets[planet]=gl;
    } else if(sideKey==='personality' || !data.planets[planet]){
      data.planets[planet]=gl;
    }
  }

  // A: Personality/Design/P/D + planet + gate.line
  const reA=/\b(Personality|Design|Conscious|Unconscious|P|D)\b\s*[-:]?\s*(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN|Rahu|Ketu)\s*[-:]?\s*(\d{1,2}\.\d)(?!\d)\b/gi;
  let m;
  while((m=reA.exec(raw))) store(normPlanet(m[2]), m[3], sideFromPrefix(m[1]));

  // B: separators including slash — "Sun:13.4" / "North Node:12.5"
  const reB=/(?:^|[\n,;|/])\s*(?:(Personality|Design|P|D)\s+)?(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN|Rahu|Ketu)\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)\b/gi;
  while((m=reB.exec(raw))){
    let side=sideFromPrefix(m[1]);
    if(!side){
      const before=raw.slice(Math.max(0,m.index-220), m.index).toLowerCase();
      const lastDesign=Math.max(before.lastIndexOf('design'), before.lastIndexOf('\ndesign'));
      const lastPers=Math.max(before.lastIndexOf('personality'), before.lastIndexOf('\npersonality'));
      // Prefer the nearer side token when a planet sits alone after a wrapped "Design"/"Personality"
      if(lastDesign>lastPers && lastDesign>=0) side='design';
      else if(lastPers>lastDesign && lastPers>=0) side='personality';
    }
    store(normPlanet(m[2]), m[3], side);
  }

  // B2: explicit " / "-chunk parse (PNG manual paste)
  for(const chunk of raw.split(/\s*\/\s*/)){
    const mm=chunk.match(/^\s*(?:(Personality|Design|P|D)\s+)?(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN|Rahu|Ketu)\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)\s*$/i);
    if(mm) store(normPlanet(mm[2]), mm[3], sideFromPrefix(mm[1]));
  }

  // C: Gate N Line L with optional side+planet
  const reC=/\b(?:(Personality|Design|P|D)\s+)?(?:(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\s*[:=\-–—]?\s*)?Gate\s*(\d{1,2})\s*(?:Line|Lin\.?|L\.?)\s*(\d)\b/gi;
  let anon=0;
  while((m=reC.exec(raw))){
    const side=sideFromPrefix(m[1]);
    const planet=normPlanet(m[2]) || ('Gate'+(++anon));
    store(planet, m[3]+'.'+m[4], side);
  }

  // D: "11.5 — South Node"
  const reD=/(?:^|[^0-9.])(\d{1,2}\.\d)(?!\d)\s*(?:exalted|detriment|juxtaposed)?\s*[—\-~–]*\s*(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\b/gi;
  while((m=reD.exec(raw))){
    const before=raw.slice(Math.max(0,m.index-160), m.index).toLowerCase();
    let side=null;
    const lastDesign=Math.max(before.lastIndexOf('design hanging'), before.lastIndexOf('\ndesign'));
    const lastPers=Math.max(before.lastIndexOf('personality hanging'), before.lastIndexOf('\npersonality'));
    if(lastDesign>lastPers) side='design';
    else if(lastPers>lastDesign) side='personality';
    store(normPlanet(m[2]), m[1], side);
  }

  // E: table rows with optional side column
  const reE=/(?:(Personality|Design|P|D)\s*[|\t,]\s*)?(Sun|Earth|Moon|North\s*Node|South\s*Node|NorthNode|SouthNode|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\s*[|\t,]\s*(\d{1,2})\s*[|\t,.]\s*(\d)\b/gi;
  while((m=reE.exec(raw))) store(normPlanet(m[2]), m[3]+'.'+m[4], sideFromPrefix(m[1]));

  // F: Personality: / Design: section blocks
  function ingestSection(sectionText, side){
    const re=/(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)/gi;
    let mm; while((mm=re.exec(sectionText))) store(normPlanet(mm[1]), mm[2], side);
    for(const line of String(sectionText).split(/\n/)){
      const sm=line.match(/^\s*([☉⊕☽☾☊☋☿♀♂♃♄♅♆♇])\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)\s*$/);
      if(sm) store(normPlanet(sm[1]), sm[2], side);
    }
  }
  const persBlock=raw.match(/(?:^|\n)\s*Personality\s*(?:\(|:|\n)([\s\S]*?)(?=(?:^|\n)\s*Design\s*(?:\(|:|\n)|Defined Channels|Electromagnetic|Key placements|Personality Hanging|$)/i);
  if(persBlock) ingestSection(persBlock[1], 'personality');
  const desBlock=raw.match(/(?:^|\n)\s*Design\s*(?:\(|:|\n)([\s\S]*?)(?=(?:^|\n)\s*Personality\s*(?:\(|:|\n)|Electromagnetic|Key placements|Personality Hanging|Design Hanging|$)/i);
  if(desBlock) ingestSection(desBlock[1], 'design');

  const key=raw.match(/Key placements[\s\S]*$/i);
  if(key){
    const reK=/\b(Personality|Design)\s+(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+(\d{1,2}\.\d)(?!\d)/gi;
    while((m=reK.exec(key[0]))) store(normPlanet(m[2]), m[3], sideFromPrefix(m[1]));
  }

  // Line-scan with sticky side from headers (symbols + plain)
  let curSide=null;
  for(const line of raw.split(/\n/)){
    if(/^\s*Personality\b/i.test(line) && !/Personality\s+(Sun|Earth|Moon|Mercury)/i.test(line)) { curSide='personality'; }
    if(/^\s*Design\b/i.test(line) && !/Design\s+(Sun|Earth|Moon|North|South|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\b/i.test(line)) { curSide='design'; }
    // Trailing side token on a busy line: "... Design Neptune 48.1 Design" → next line is still Design
    if(/\bDesign\s*$/i.test(line) && !/\bPersonality\s*$/i.test(line)) curSide='design';
    if(/\bPersonality\s*$/i.test(line)) curSide='personality';
    const sm=line.match(/^\s*(?:(Personality|Design|P|D)\s+)?([☉⊕☽☾☊☋☿♀♂♃♄♅♆♇])\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)\s*$/i);
    if(sm) store(normPlanet(sm[2]), sm[3], sideFromPrefix(sm[1])||curSide);
    const wm=line.match(/^\s*(?:(Personality|Design|P|D)\s+)?(Sun|Earth|Moon|North\s*Node|South\s*Node|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN|Rahu|Ketu)\s*[:=\-–—]?\s*(\d{1,2}\.\d)(?!\d)\b/i);
    if(wm) store(normPlanet(wm[2]), wm[3], sideFromPrefix(wm[1])||curSide);
    // Gate line form on its own line: "Design Sun Gate 5 Line 2"
    const gl=line.match(/^\s*(?:(Personality|Design|P|D)\s+)?(?:(Sun|Earth|Moon|North\s*Node|South\s*Node|NorthNode|SouthNode|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|NN|SN)\s*[:=\-–—]?\s*)?Gate\s*(\d{1,2})\s*(?:Line|Lin\.?|L\.?)\s*(\d)\s*$/i);
    if(gl) store(normPlanet(gl[2])||null, gl[3]+'.'+gl[4], sideFromPrefix(gl[1])||curSide);
  }

  const chSection=raw.match(/Defined Channels:([\s\S]*?)(?=Electromagnetic|Personality Hanging|Key placements|$)/i);
  if(chSection){
    const chRe=/\b(\d{1,2})\s*[–\-—]\s*(\d{1,2})\b/g; let cm;
    while((cm=chRe.exec(chSection[1]))){
      const a=+cm[1], b=+cm[2];
      if(a>=1&&a<=64&&b>=1&&b<=64) data.defined_channels.push(a+'-'+b);
    }
  }
  const hg=raw.match(/hanging gates?\s*:?\s*([0-9,\s]+)/i);
  if(hg) data.hanging_gates=(hg[1].match(/\d+/g)||[]).map(Number);
  try{ delete data._actSeen; }catch(e){}
  return data;
}

function firstNameOnly(n){
  const s=String(n==null?'':n).trim();
  if(!s) return 'Unknown';
  return s.split(/\s+/)[0] || 'Unknown';
}
function normalizeCenterName(c){
  const s=String(c||'').trim();
  if(!s) return s;
  if(/^heart/i.test(s) || /^ego$/i.test(s)) return 'Heart/Ego';
  if(/^identity$/i.test(s) || /^g$/i.test(s)) return 'G';
  if(/^emotional$/i.test(s) || /^solar\s*plexus$/i.test(s)) return 'Solar Plexus';
  const hit=(ALL_CENTER_NAMES||[]).find(x=>x.toLowerCase()===s.toLowerCase());
  return hit||s;
}

function deepCloneChart(obj){
  if(obj==null || typeof obj!=='object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

function coerceChartObject(data){
  if(data==null) return {planets:{}, design_planets:{}};
  if(typeof data==='string'){
    const t=data.trim();
    if(!t) return {planets:{}, design_planets:{}};
    if(t.startsWith('{')){
      try{ data=JSON.parse(t); }
      catch(e){ return parseChartText(t); }
    } else {
      return parseChartText(t);
    }
  }
  // Already a chart-like object — normalize shapes without mutating caller
  data=deepCloneChart(data);
  const out={
    name: data.name || data['Natal Name'] || data.Name || null,
    planets:{},
    design_planets:{},
    hanging_gates: data.hanging_gates || data.gates || [],
    defined_channels: data.defined_channels || data.channels || [],
    defined_centers: data.defined_centers || data.DefinedCenters || [],
    activations: data.activations || []
  };
  function absorbMap(map, side){
    if(!map || typeof map!=='object') return;
    if(Array.isArray(map)){
      for(const item of map){
        if(!item) continue;
        if(typeof item==='string' && /^\d{1,2}\.\d$/.test(item)){
          const k='P'+(Object.keys(side==='design'?out.design_planets:out.planets).length+1);
          if(side==='design') out.design_planets[k]=item; else out.planets[k]=item;
          continue;
        }
        const planet=item.planet||item.name||item.body||item.Planet;
        const gl=item.gl||item.gate_line||(item.gate!=null && item.line!=null ? (item.gate+'.'+item.line) : item.value);
        if(planet && gl!=null){
          if(side==='design') out.design_planets[planet]=gl;
          else out.planets[planet]=gl;
        }
      }
      return;
    }
    for(const [k,v] of Object.entries(map)){
      if(side==='design') out.design_planets[k]=v;
      else out.planets[k]=v;
    }
  }
  absorbMap(data.planets || data.personality || data.Personality || data.conscious, 'personality');
  absorbMap(data.design_planets || data.design || data.Design || data.unconscious, 'design');
  // Nested personality.planets
  if(data.personality && typeof data.personality==='object' && data.personality.planets)
    absorbMap(data.personality.planets, 'personality');
  if(data.design && typeof data.design==='object' && data.design.planets)
    absorbMap(data.design.planets, 'design');
  // Flat "Sun": "13.4" at top level
  for(const p of PLANET_ORDER){
    if(data[p]!=null && out.planets[p]==null) out.planets[p]=data[p];
    const dk='Design '+p;
    if(data[dk]!=null && out.design_planets[p]==null) out.design_planets[p]=data[dk];
  }
  return out;
}

function formatActivationList(person){
  const rows=[];
  for(const a of (person.all_planet_activations||[])){
    rows.push((a.planet||'?')+': '+a.gl+' ('+(a.side==='design'?'D':'P')+')');
  }
  return rows;
}

function chartLoadedSummary(person){
  const n=(person.all_planet_activations||[]).length || Object.keys(person.planets||{}).length;
  const ch=[...person.defined_channels].sort().join(', ') || '(none)';
  return 'Chart loaded: '+n+' activations, channels: '+ch;
}

function validateNatalOrStop(person, label){
  const acts=person.all_planet_activations||[];
  const nPlanets=acts.length || Object.keys(person.planets||{}).length;
  if(nPlanets===0 && person.gates.size===0){
    return {ok:false, kind:'empty', message:(label||person.name)+': no natal planets/gates found in input. Stopped — cannot build a chart or report.'};
  }
  if(person.gates.size>0 && person.defined_channels.size===0){
    const raw=formatActivationList(person);
    const gateOnly=[...person.gates].sort().join(', ');
    return {ok:false, kind:'no_channels', message:(label||person.name)+': extracted '+person.gates.size+' gate(s) but zero complete natal channels. Check the input.\nRaw activations:\n'+(raw.length?raw.join('\n'):('(gates only: '+gateOnly+')'))};
  }
  return {ok:true};
}

function loadPerson(data){
  data=coerceChartObject(data);
  const fullName=data.name||data['Natal Name']||'Unknown';
  const person={
    name:firstNameOnly(fullName), fullName:fullName,
    planets:{}, design_planets:{}, all_planet_activations:[],
    hanging_gates:new Set(), defined_channels:new Set(), defined_centers:new Set(),
    gates:new Set(), raw:data, center_mismatch:null, natal_channel_list:[]
  };
  function ingestPlanet(pname, val, side){
    try{
      const gl=parseGl(val);
      if(side) gl.side=side;
      else if(val && val.side) gl.side=val.side;
      const sideKey=gl.side||side||'personality';
      gl.side=sideKey;
      if(!person._ingestSeen) person._ingestSeen=Object.create(null);
      const ik=sideKey+'|'+pname+'|'+gl.gl;
      if(person._ingestSeen[ik]){
        // Already recorded this activation; still refresh maps below
      } else {
        person._ingestSeen[ik]=1;
        person.all_planet_activations.push({planet:pname, ...gl});
      }
      // Keep a representative in planets (prefer personality)
      if(sideKey==='design'){
        person.design_planets[pname]=gl;
        if(!person.planets[pname]) person.planets[pname]=gl;
      } else {
        person.planets[pname]=gl;
      }
      person.gates.add(gl.gate);
      person.hanging_gates.add(gl.gate);
    }catch(e){}
  }
  if(Array.isArray(data.activations) && data.activations.length){
    for(const a of data.activations){
      if(a && a.planet && (a.gl!=null || (a.gate!=null && a.line!=null)))
        ingestPlanet(a.planet, (a.gl!=null?a.gl:a), a.side||'personality');
    }
  }
  for(const [pname,val] of Object.entries(data.planets||{})){
    ingestPlanet(pname, val, (val&&val.side)||'personality');
  }
  for(const [pname,val] of Object.entries(data.design_planets||data.design||{})){
    ingestPlanet(pname, val, 'design');
  }
  for(const g of (data.hanging_gates||data.gates||[])){
    person.gates.add(+g); person.hanging_gates.add(+g);
  }
  // Input-listed channels may add gates, but final channel set is recomputed from gates
  const inputChannels=new Set();
  for(const ch of (data.defined_channels||[])){
    const key=normalizeChannel(ch);
    if(key){
      inputChannels.add(key);
      const [a,b]=key.split('-').map(Number);
      person.gates.add(a); person.gates.add(b);
    }
  }
  // Channel-derived truth: both gates present
  person.defined_channels=new Set();
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(person.gates.has(a)&&person.gates.has(b)) person.defined_channels.add(chId);
  }
  person.defined_centers=new Set();
  person.hanging_gates=new Set(person.gates);
  for(const chId of person.defined_channels){
    for(const c of (CHANNELS[chId]?.centers||[])) person.defined_centers.add(normalizeCenterName(c));
    const [a,b]=CHANNELS[chId].gates;
    person.hanging_gates.delete(a); person.hanging_gates.delete(b);
  }
  person.natal_channel_list=[...person.defined_channels].sort().map(id=>{
    const info=channelInfo(id);
    return {id, name:plainChannelName(info), centers:(info.centers||[]).map(normalizeCenterName), gates:info.gates};
  });
  // Cross-check input-declared centers if present
  const inputDefined=new Set();
  for(const c of (data.defined_centers||data.DefinedCenters||[])) inputDefined.add(normalizeCenterName(c));
  if(inputDefined.size){
    const derived=[...person.defined_centers].sort().join(',');
    const declared=[...inputDefined].sort().join(',');
    if(derived!==declared){
      person.center_mismatch='Center mismatch for '+person.name+': input declared ['+declared+'] but channel-derived ['+derived+']; using channel-derived.';
    }
  }
  if(inputChannels.size){
    const der=[...person.defined_channels].sort().join(',');
    const dec=[...inputChannels].sort().join(',');
    // Allow input as subset hint; only flag if input claims a channel gates don't support
    for(const id of inputChannels){
      if(!person.defined_channels.has(id) && !person.defined_channels.has(id.split('-').reverse().join('-'))){
        const msg='Channel mismatch for '+person.name+': input listed '+id+' but both gates are not present; ignored.';
        person.center_mismatch=(person.center_mismatch?person.center_mismatch+' ':'')+msg;
      }
    }
  }
  try{ delete person._ingestSeen; }catch(e){}
  return person;
}

function isCenterDefined(person, center){
  const c=normalizeCenterName(center);
  if(person.defined_centers.has(c)) return true;
  if(c==='Heart/Ego' && (person.defined_centers.has('Heart')||person.defined_centers.has('Ego'))) return true;
  if((c==='Heart'||c==='Ego') && person.defined_centers.has('Heart/Ego')) return true;
  return false;
}

function openCentersOf(person){
  const open=[];
  for(const c of ALL_CENTER_NAMES){
    if(!isCenterDefined(person, c)) open.push(c);
  }
  return open;
}


function gateInfo(gate){
  const g=GATES[String(gate)]||{};
  return {number:gate, name:g.name||('Gate '+gate), center:g.center, description:g.description||'', lcn_intro:(g.lcn_intro||'').slice(0,8000), source:''};
}
function lineInfo(gate,line){
  const g=GATES[String(gate)]||{};
  const ld=(g.lines||{})[String(line)]||{};
  return {gate, line, gl:gate+'.'+line, title:ld.lcn_title||ld.title||('Line '+line), tcri_text:ld.text||'', lcn_title:ld.lcn_title||'', lcn_text:(ld.lcn_text||'').slice(0,8000), source:''};
}
function channelInfo(chId){
  const ch=CHANNELS[chId]||{gates:chId.split('-').map(Number), name:chId, design:'', centers:[], description:''};
  return {id:chId, name:ch.name||chId, design:ch.design||'', centers:ch.centers||[], description:ch.description||'', gates:ch.gates||chId.split('-').map(Number), source:''};
}

function analyzeDay(person, transit){
  const tplanets=transit.planets;
  const tGates=new Set(Object.values(tplanets).map(p=>p.gate));
  const tByGate={};
  for(const [pname,p] of Object.entries(tplanets)) (tByGate[p.gate]||=[]).push(pname);
  const transitChannels=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(tGates.has(a)&&tGates.has(b)) transitChannels.push(chId);
  }
  const completed=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    const natalA=person.gates.has(a), natalB=person.gates.has(b);
    const trA=tGates.has(a), trB=tGates.has(b);
    if(!((natalA&&trB)||(natalB&&trA)||(natalA&&natalB&&(trA||trB)))) continue;
    if(!(trA||trB)) continue;
    let kind;
    if((natalA&&!natalB&&trB)||(natalB&&!natalA&&trA)) kind='electromagnetic';
    else if(natalA&&natalB) kind='transit_overlay_on_natal_channel';
    else kind='completion';
    if(kind==='transit_overlay_on_natal_channel'&&!((trA&&natalA)||(trB&&natalB))) continue;
    completed.push({channel:chId, kind, info:channelInfo(chId), natal_gates:[a,b].filter(g=>person.gates.has(g)), transit_gates:[a,b].filter(g=>tGates.has(g)), transit_planets:[...new Set([a,b].filter(g=>tByGate[g]).flatMap(g=>tByGate[g]))].sort()});
  }
  const touches=[];
  for(const [pname,p] of Object.entries(tplanets)){
    if(person.gates.has(p.gate)){
      touches.push({planet:pname, transit:p, gate:gateInfo(p.gate), line:lineInfo(p.gate,p.line), natal_planets:Object.entries(person.planets).filter(([,nv])=>nv.gate===p.gate).map(([np])=>np)});
    }
  }
  const centersTransit=new Set();
  for(const chId of transitChannels) for(const c of (CHANNELS[chId]?.centers||[])) centersTransit.add(c);
  const centersWithNatal=new Set(centersTransit);
  for(const item of completed) for(const c of (item.info.centers||[])) centersWithNatal.add(c);
  return {person:person.name, date:transit.date, transit_source:transit.source, transit_planets:tplanets, transit_only_channels:transitChannels.sort().map(channelInfo), completed_channels:completed, touches, centers_defined_by_transit:[...centersTransit].sort(), centers_activated_with_natal:[...centersWithNatal].sort()};
}

function coupleDynamics(a,b,transit){
  const electro=[], compromise=[], companionship=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [ga,gb]=ch.gates;
    const aHas={[ga]:a.gates.has(ga),[gb]:a.gates.has(gb)};
    const bHas={[ga]:b.gates.has(ga),[gb]:b.gates.has(gb)};
    const aFull=aHas[ga]&&aHas[gb], bFull=bHas[ga]&&bHas[gb];
    if((aHas[ga]&&!aHas[gb]&&bHas[gb]&&!bHas[ga])||(aHas[gb]&&!aHas[ga]&&bHas[ga]&&!bHas[gb])) electro.push(chId);
    else if(aFull&&bFull) companionship.push(chId);
    else if((aFull&&(bHas[ga]||bHas[gb])&&!bFull)||(bFull&&(aHas[ga]||aHas[gb])&&!aFull)) compromise.push(chId);
  }
  const tGates=new Set(Object.values(transit.planets).map(p=>p.gate));
  const amplified=[];
  for(const chId of new Set([...electro,...compromise,...companionship])){
    const [ga,gb]=CHANNELS[chId].gates;
    if(tGates.has(ga)||tGates.has(gb)) amplified.push(chId);
  }
  const shared=[];
  for(const [pname,p] of Object.entries(transit.planets)){
    const inA=a.gates.has(p.gate), inB=b.gates.has(p.gate);
    if(inA||inB) shared.push({planet:pname, gl:p.gl, in_a:inA, in_b:inB, gate:gateInfo(p.gate), line:lineInfo(p.gate,p.line)});
  }
  return {electromagnetic:electro.sort().map(channelInfo), compromise:compromise.sort().map(channelInfo), companionship:companionship.sort().map(channelInfo), transit_amplified_channels:[...new Set(amplified)].sort().map(channelInfo), shared_transit_hooks:shared};
}

function addCalendarDays(dateStr, n){
  const [y,m,d]=dateStr.split('-').map(Number);
  const dt=new Date(Date.UTC(y, m-1, d+n));
  return dt.getUTCFullYear()+'-'+String(dt.getUTCMonth()+1).padStart(2,'0')+'-'+String(dt.getUTCDate()).padStart(2,'0');
}
function planetStepMs(planet){
  if(planet==='Moon') return 30*60*1000;
  if(planet==='Mercury'||planet==='Venus') return 2*3600*1000;
  if(planet==='Sun'||planet==='Earth'||planet==='Mars') return 4*3600*1000;
  if(planet==='NorthNode'||planet==='SouthNode'||planet==='Jupiter') return 12*3600*1000;
  return 24*3600*1000; // Saturn+
}
function getPlanetGL(Astronomy, planet, dateObj){
  const time=Astronomy.MakeTime(dateObj);
  const lon=geoEclipticLon(Astronomy, planet, time);
  return lonToGateLine(lon);
}
function bisectIngress(Astronomy, planet, tLo, tHi, glLo){
  // Find earliest ms in (tLo, tHi] where gl differs from glLo; refine to <= 60s
  let lo=tLo, hi=tHi, gLo=glLo;
  while(hi-lo > 60000){
    const mid=Math.floor((lo+hi)/2);
    const gm=getPlanetGL(Astronomy, planet, new Date(mid));
    if(gm.gate===gLo.gate && gm.line===gLo.line){ lo=mid; gLo=gm; }
    else { hi=mid; }
  }
  const glHi=getPlanetGL(Astronomy, planet, new Date(hi));
  return {tMs:hi, from:gLo, to:glHi};
}
function scanPlanetIngresses(Astronomy, planet, startMs, endMs){
  const step=planetStepMs(planet);
  const out=[];
  let t=startMs;
  let gl=getPlanetGL(Astronomy, planet, new Date(t));
  while(t < endMs){
    const t2=Math.min(t+step, endMs);
    const gl2=getPlanetGL(Astronomy, planet, new Date(t2));
    if(gl2.gate!==gl.gate || gl2.line!==gl.line){
      // may be multiple changes in a coarse step — walk with smaller probes
      let probeLo=t, gProbe=gl;
      let probeHi=t2;
      // recursively split until step small or single change found via bisection window
      const queue=[[probeLo, probeHi, gProbe]];
      while(queue.length){
        const [a,b,ga]=queue.pop();
        if(b-a<=step || b-a<=60000){
          const gb=getPlanetGL(Astronomy, planet, new Date(b));
          if(gb.gate!==ga.gate || gb.line!==ga.line){
            const ing=bisectIngress(Astronomy, planet, a, b, ga);
            if(ing.to.gate!==ing.from.gate || ing.to.line!==ing.from.line){
              out.push({planet, tMs:ing.tMs, from:ing.from, to:ing.to, gateChanged:ing.from.gate!==ing.to.gate, lineChanged:ing.from.line!==ing.to.line});
            }
          }
          continue;
        }
        const mid=Math.floor((a+b)/2);
        const gm=getPlanetGL(Astronomy, planet, new Date(mid));
        if(gm.gate!==ga.gate || gm.line!==ga.line) queue.push([a, mid, ga]);
        // right side from mid state
        const gb=getPlanetGL(Astronomy, planet, new Date(b));
        if(gb.gate!==gm.gate || gb.line!==gm.line) queue.push([mid, b, gm]);
      }
    }
    t=t2; gl=gl2;
  }
  // dedupe by planet+tMs minute
  const seen=new Set();
  const uniq=[];
  for(const ev of out.sort((a,b)=>a.tMs-b.tMs)){
    const key=ev.planet+'@'+Math.floor(ev.tMs/60000);
    if(seen.has(key)) continue;
    seen.add(key);
    // verify minute boundary
    const before=getPlanetGL(Astronomy, planet, new Date(ev.tMs-60000));
    const after=getPlanetGL(Astronomy, planet, new Date(ev.tMs));
    ev.verified = (before.gate!==after.gate || before.line!==after.line);
    ev.from = before; ev.to = after;
    ev.gateChanged = before.gate!==after.gate;
    ev.lineChanged = before.line!==after.line;
    uniq.push(ev);
  }
  return uniq;
}
function chartStateKey(person, transit){
  const day=analyzeDay(person, transit);
  const ch=day.completed_channels.map(c=>c.channel+':'+c.kind).sort().join(',');
  const touches=day.touches.map(t=>t.planet+':'+t.transit.gate+'.'+t.transit.line).sort().join(',');
  const centers=(day.centers_activated_with_natal||[]).join(',');
  return {ch, touches, centers, day};
}
function coupleStateKey(a,b,transit){
  const dyn=coupleDynamics(a,b,transit);
  return {
    amplified:dyn.transit_amplified_channels.map(c=>c.id).sort().join(','),
    shared:dyn.shared_transit_hooks.map(h=>h.planet+':'+h.gl+':'+(h.in_a?'A':'')+(h.in_b?'B':'')).sort().join(','),
    electro:dyn.electromagnetic.map(c=>c.id).join(','),
    dyn
  };
}
function cloneTransitField(field){
  return {
    date:field.date,
    datetime_utc:field.datetime_utc,
    time_gmt:field.time_gmt,
    source:field.source,
    node_note:field.node_note,
    tz:field.tz,
    display_when:field.display_when,
    display_date:field.display_date,
    display_time:field.display_time,
    planets:Object.fromEntries(Object.entries(field.planets||{}).map(([k,v])=>[k,{gate:v.gate,line:v.line,gl:v.gl,lon:v.lon}]))
  };
}
function fieldWithPlanetGL(field, planet, glObj){
  const f=cloneTransitField(field);
  f.planets[planet]={gate:glObj.gate, line:glObj.line, gl:glObj.gl|| (glObj.gate+'.'+glObj.line), lon:glObj.lon||0};
  return f;
}
function gateRoleForPerson(person, gate){
  if(person.gates.has(gate)) return 'same';
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if((person.gates.has(a)&&b===gate)||(person.gates.has(b)&&a===gate)) return 'harmonic';
  }
  return null;
}
function diffRelevant(person1, person2, beforeField, afterField){
  const reasons=[];
  const s1b=chartStateKey(person1, beforeField), s1a=chartStateKey(person1, afterField);
  if(s1b.ch!==s1a.ch) reasons.push({type:'channel', who:person1.name, before:s1b, after:s1a});
  if(s1b.touches!==s1a.touches) reasons.push({type:'touch', who:person1.name, before:s1b, after:s1a});
  if(s1b.centers!==s1a.centers) reasons.push({type:'center', who:person1.name, before:s1b, after:s1a});
  if(person2){
    const s2b=chartStateKey(person2, beforeField), s2a=chartStateKey(person2, afterField);
    if(s2b.ch!==s2a.ch) reasons.push({type:'channel', who:person2.name, before:s2b, after:s2a});
    if(s2b.touches!==s2a.touches) reasons.push({type:'touch', who:person2.name, before:s2b, after:s2a});
    if(s2b.centers!==s2a.centers) reasons.push({type:'center', who:person2.name, before:s2b, after:s2a});
    const cb=coupleStateKey(person1, person2, beforeField), ca=coupleStateKey(person1, person2, afterField);
    if(cb.amplified!==ca.amplified || cb.shared!==ca.shared){
      reasons.push({type:'couple', who:'together', before:cb, after:ca});
    }
  }
  return reasons;
}
function reasonsForPlanetIngress(person1, person2, ev, snapshotField){
  // Isolate this planet so a simultaneous Sun/Earth (or node) move is not blamed on the other body.
  const before=fieldWithPlanetGL(snapshotField, ev.planet, ev.from);
  const after=fieldWithPlanetGL(snapshotField, ev.planet, ev.to);
  const reasons=diffRelevant(person1, person2, before, after);
  const people=[person1].concat(person2?[person2]:[]);
  for(const person of people){
    for(const g of [ev.from.gate, ev.to.gate]){
      const role=gateRoleForPerson(person, g);
      if(role==='same' && !reasons.some(r=>r.who===person.name && r.type==='touch')){
        const sB=chartStateKey(person, before), sA=chartStateKey(person, after);
        reasons.push({type:'touch', who:person.name, before:sB, after:sA, role:'same'});
      }
      if(role==='harmonic' && !reasons.some(r=>r.who===person.name && (r.type==='channel'||r.type==='touch'))){
        const sB=chartStateKey(person, before), sA=chartStateKey(person, after);
        reasons.push({type:'channel', who:person.name, before:sB, after:sA, role:'harmonic'});
      }
    }
  }
  if(person2){
    const dynA=coupleDynamics(person1, person2, after);
    const electroIds=new Set((dynA.electromagnetic||[]).map(c=>c.id));
    for(const chId of electroIds){
      const ch=CHANNELS[chId]; if(!ch) continue;
      const [a,b]=ch.gates;
      if(ev.to.gate===a||ev.to.gate===b||ev.from.gate===a||ev.from.gate===b){
        if(!reasons.some(r=>r.type==='couple')){
          reasons.push({type:'couple', who:'together', before:coupleStateKey(person1,person2,before), after:coupleStateKey(person1,person2,after), role:'electro'});
        }
        break;
      }
    }
  }
  return reasons;
}
function classifyEventWho(reasons, person1, person2){
  const names=new Set(reasons.filter(r=>r.who && r.who!=='together').map(r=>r.who));
  const couple=reasons.some(r=>r.type==='couple'||r.who==='together');
  const p1=person1 && names.has(person1.name);
  const p2=person2 && names.has(person2.name);
  return {
    person1:!!p1,
    person2:!!p2,
    couple:!!couple,
    both:!!(p1&&p2),
    anyCouple:!!(couple||(p1&&p2)),
    whoNames:[...names]
  };
}
function findChartRelevantEvents(Astronomy, person1, person2, startMs, endMs, tz){
  const raw=[];
  const omitLights=omitLightsOn();
  for(const planet of PLANET_ORDER){
    if(omitLights && isLightPlanet(planet)) continue;
    raw.push(...scanPlanetIngresses(Astronomy, planet, startMs, endMs));
  }
  raw.sort((a,b)=>a.tMs-b.tMs || a.planet.localeCompare(b.planet));
  const relevant=[];
  let moonSkipped=0;
  for(const ev of raw){
    const snapshot=computeTransitField(Astronomy, new Date(ev.tMs));
    snapshot.tz=tz;
    const beforeGL=getPlanetGL(Astronomy, ev.planet, new Date(ev.tMs-60000));
    const afterGL=getPlanetGL(Astronomy, ev.planet, new Date(ev.tMs));
    ev.verified=(beforeGL.gate!==afterGL.gate||beforeGL.line!==afterGL.line);
    ev.from=beforeGL; ev.to=afterGL;
    ev.gateChanged=beforeGL.gate!==afterGL.gate;
    ev.lineChanged=beforeGL.line!==afterGL.line;
    if(omitLightsOn() && isLightPlanet(ev.planet)){
      continue; // Omit Sun, Earth & Moon
    }
    if(allGateOnlyOn() && !ev.gateChanged){
      continue; // All planets: gate changes only
    }
    if(!allGateOnlyOn() && !omitLightsOn() && moonGateOnlyOn() && ev.planet==='Moon' && !ev.gateChanged){
      continue; // suppress Moon line-only ingresses
    }
    if(!allGateOnlyOn() && !omitLightsOn() && sunGateOnlyOn() && (ev.planet==='Sun' || ev.planet==='Earth') && !ev.gateChanged){
      continue; // suppress Sun/Earth line-only ingresses
    }
    const reasons=reasonsForPlanetIngress(person1, person2, ev, snapshot);
    if(!reasons.length){
      if(ev.planet==='Moon') moonSkipped++;
      continue;
    }
    const who=classifyEventWho(reasons, person1, person2);
    relevant.push({
      ...ev,
      stamp: formatTimelineStamp(new Date(ev.tMs), tz),
      dayKey: formatDisplayDateOnly(new Date(ev.tMs), tz),
      reasons,
      who,
      afterField: fieldWithPlanetGL(snapshot, ev.planet, ev.to),
      paragraph: null
    });
  }
  return {events:relevant, moonSkipped, rawCount:raw.length};
}

function formatTimelineStamp(date, timeZone){
  const tz=resolveTzId(timeZone);
  const d=date instanceof Date?date:new Date(date);
  // Local (tz) weekday. e.g. "Thursday, Oct 29, 2026, 4:12 PM EDT"
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:tz, weekday:'long', year:'numeric', month:'short', day:'numeric',
    hour:'numeric', minute:'2-digit', hour12:true, timeZoneName:'short'
  }).formatToParts(d);
  const get=t=>(parts.find(p=>p.type===t)||{}).value||'';
  return `${get('weekday')}, ${get('month')} ${get('day')}, ${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod')} ${get('timeZoneName')}`;
}


function describeTimelineEvent(ev, reasons, person1, person2, showCodes){
  const planet=ev.planet;
  const themeTo=gateThemeName(ev.to.gate);
  const themeFrom=gateThemeName(ev.from.gate);
  const gateTo=fmtGateTheme(ev.to.gate, showCodes);
  const gateFrom=fmtGateTheme(ev.from.gate, showCodes);
  let move;
  if(ev.gateChanged){
    move=planet+' leaves '+gateFrom+' and enters '+gateTo+(showCodes?(' · '+ev.from.gl+' → '+ev.to.gl):'');
  } else {
    move=showCodes
      ? (planet+' shifts from '+ev.from.gl+' to '+ev.to.gl+' within '+gateTo)
      : (planet+' shifts emphasis within '+gateTo);
  }
  const sentences=[move+'.'];
  const people=[person1].concat(person2?[person2]:[]);
  let primaryTheme=themeTo;
  let kind='line_shift';
  for(const person of people){
    const mine=reasons.filter(r=>r.who===person.name);
    if(!mine.length) continue;
    const bits=[];
    const touch=mine.find(r=>r.type==='touch');
    if(touch){
      const hadFrom=touch.before.touches.split(',').some(x=>x.startsWith(planet+':'+ev.from.gate));
      const hasTo=touch.after.touches.split(',').some(x=>x.startsWith(planet+':'+ev.to.gate));
      if(hasTo && !hadFrom){
        bits.push('it begins activating '+gateTo+' already in '+person.name+'\'s chart');
        kind='touch_start'; primaryTheme=themeTo;
      } else if(hadFrom && !hasTo){
        bits.push('it ends an activation on '+gateFrom+' in '+person.name+'\'s chart');
        kind='touch_end'; primaryTheme=themeFrom;
      } else {
        bits.push('the emphasis on '+gateTo+' in '+person.name+'\'s chart changes');
        kind='line_shift'; primaryTheme=themeTo;
      }
    }
    const ch=mine.find(r=>r.type==='channel');
    if(ch){
      const b=new Set((ch.before.ch||'').split(',').filter(Boolean));
      const a=new Set((ch.after.ch||'').split(',').filter(Boolean));
      const started=[...a].filter(x=>!b.has(x));
      const ended=[...b].filter(x=>!a.has(x));
      const nameOf=id=>{
        const chId=id.split(':')[0];
        const info=channelInfo(chId);
        const theme=plainChannelName(info);
        return showCodes?(theme+' ('+chId+')'):('the channel of '+theme);
      };
      if(started.length){ bits.push(started.map(nameOf).join(', ')+' begins defining with the sky'); kind='shared_channel'; }
      else if(ended.length){ bits.push(ended.map(nameOf).join(', ')+' releases'); kind=kind==='touch_end'?'touch_end':'shared_channel'; }
      else if(ch.role==='harmonic'){
        // Line shift on a gate that completes a channel with natal — still personally relevant
        bits.push('sky pressure continues through '+gateTo+', the harmonic partner to a gate already in '+person.name+'\'s chart');
        kind='shared_channel'; primaryTheme=themeTo;
      }
      if(ended.length && started.length){ /* already handled */ }
    }
    if(mine.some(r=>r.type==='center')) bits.push('center definition around '+person.name+' shifts with this weather');
    if(bits.length) sentences.push('For '+person.name+', '+bits.join('; ')+'.');
  }
  const coupleR=reasons.find(r=>r.type==='couple');
  if(coupleR && person2){
    const bAmp=new Set((coupleR.before.amplified||'').split(',').filter(Boolean));
    const aAmp=new Set((coupleR.after.amplified||'').split(',').filter(Boolean));
    const started=[...aAmp].filter(x=>!bAmp.has(x));
    const ended=[...bAmp].filter(x=>!aAmp.has(x));
    const nm=id=>{const info=channelInfo(id); const theme=plainChannelName(info); return showCodes?(theme+' ('+id+')'):('the channel of '+theme);};
    const bits=[];
    if(started.length){ bits.push('amplifies '+started.map(nm).join(', ')+' between them'); kind='electro'; }
    if(ended.length){ bits.push('releases '+ended.map(nm).join(', ')+' between them'); kind='touch_end'; }
    const bSh=coupleR.before.shared||'', aSh=coupleR.after.shared||'';
    if(bSh!==aSh){
      // detect both holding same gate
      const both=/\bA\b/.test(aSh) && /\bB\b/.test(aSh);
      if(both){ bits.push('both charts hook the same transit theme around '+primaryTheme+' (mirroring)'); kind='same_gate'; }
      else bits.push('their shared transit hooks rearrange around '+primaryTheme);
    }
    if(bits.length) sentences.push('Together, '+bits.join('; ')+'.');
  }
  const line=lineInfo(ev.to.gate, ev.to.line);
  const g=gateInfo(ev.to.gate);
  const meaning=meaningForLine(line, g);
  if(meaning) sentences.push(meaning);

  // Concrete how-this-plays-out between them
  if(person2){
    const seed=(ev.tMs%97)+(ev.to.gate*13)+(ev.to.line*3)+planet.length;
    const whoTouched=[...new Set(reasons.filter(r=>r.type==='touch'||r.type==='channel').map(r=>r.who).filter(w=>w&&w!=='together'))];
    let useKind=kind;
    if(whoTouched.length===1) useKind=(kind==='touch_end'||kind==='touch_start')?kind:'one_sided';
    if(whoTouched.length===2) useKind='same_gate';
    // aName = more-hooked partner when one-sided so play-out text attributes correctly
    let aName=person1.name, bName=person2.name;
    if(whoTouched.length===1){
      if(whoTouched[0]===person2.name){ aName=person2.name; bName=person1.name; }
      else { aName=person1.name; bName=person2.name; }
    }
    const scenes=scenarioPair(seed, aName, bName, primaryTheme, useKind);
    sentences.push('How this may play out between them: '+scenes[0]);
    if(scenes[1]) sentences.push(scenes[1]);
  }
  return sentences.join(' ').replace(/\s+/g,' ').trim();
}




function renderTimelineHtml(person1, person2, meta){
  return renderStructuredTimelineHtml(person1, person2, meta||{});
  const show=codesOn();
  const wantIx=interactionsOnlyOn();
  const shortCouple=wantIx && !!person2;
  const shortSolo=wantIx && !person2;
  const shortMode=shortCouple || shortSolo;
  const parts=[];
  const names=person2?`${person1.name} & ${person2.name}`:person1.name;
  const allEvents=meta.events||[];
  // Couple short form: interaction-relevant only. Solo short form: all chart-relevant events for that person (already filtered by findChartRelevantEvents).
  let events=shortCouple ? allEvents.filter(e=>isInteractionTimelineEvent(e, person1, person2)) : allEvents.slice();
  if(omitLightsOn()){
    events=events.filter(e=>!isLightPlanet(e.planet));
  }
  if(allGateOnlyOn()){
    events=events.filter(e=>e.gateChanged);
  } else if(!omitLightsOn()){
    if(moonGateOnlyOn()){
      events=events.filter(e=>e.planet!=='Moon' || e.gateChanged);
    }
    if(sunGateOnlyOn()){
      events=events.filter(e=>(e.planet!=='Sun' && e.planet!=='Earth') || e.gateChanged);
    }
  }
  const rw=realWorldOn();
  const titlePrefix = rw
    ? (shortCouple ? 'Real-world interaction timeline: ' : (shortSolo ? 'Real-world short timeline: ' : 'Real-world influence timeline: '))
    : (shortCouple ? 'Interaction timeline: ' : (shortSolo ? 'Short transit timeline: ' : 'Transit timeline: '));
  parts.push(`<h2>${escapeHtml(titlePrefix)}${escapeHtml(names)}</h2>`);
  parts.push(`<p><em>${escapeHtml(meta.rangeLabel)}</em></p>`);
  if(shortSolo){
    parts.push(`<p><em>${escapeHtml(rw?'Short real-world form for one chart.':'Short form for one chart.')}</em></p>`);
  }
  if(rw){
    parts.push(`<p><em>${escapeHtml('Potentials only—practical not-self influence in everyday situations. Not predictions.')}</em></p>`);
  }
  if(shortCouple){
    parts.push(`<p>${escapeHtml(rw
      ? ('Stamps below are local '+meta.tzLabel+' times when the sky shifted in a way that may amplify not-self between '+person1.name+' and '+person2.name+'—open-center bridges, mirrored hooks, or one partner carrying weather the other feels. One-person-only shifts are omitted.')
      : ('Stamps below are local '+meta.tzLabel+' times when the sky shifted in a way that lands between '+person1.name+' and '+person2.name+'—shared hooks, mirrored gates, amplified channels, or one partner carrying weather the other feels through the relationship. One-person-only shifts are omitted.'))}</p>`);
  } else if(shortSolo){
    parts.push(`<p>${escapeHtml(rw
      ? ('Stamps below are local '+meta.tzLabel+' times when the sky shifted in a way that may trigger '+person1.name+'\'s not-self through open centers, channel pressure, or temporary definition. Each item is a short potential with one everyday example.')
      : ('Stamps below are local '+meta.tzLabel+' times when the sky shifted in a way that hooks '+person1.name+' directly—same-gate hits, harmonic channel pressure, or center definition. Each item is a short read with one everyday example.'))}</p>`);
  } else {
    parts.push(`<p>${escapeHtml(rw
      ? (`Below is a chronological timeline of chart-relevant sky changes across this window in ${meta.tzLabel}. Each stamp marks a minute when a planet moved gate or line in a way that may start or end practical not-self pressure for ${person1.name}${person2?' or '+person2.name:''}. Potentials only—not predictions.`)
      : (`Below is a chronological timeline of chart-relevant sky changes across this window in ${meta.tzLabel}. Each stamp marks a minute when a planet moved gate or line in a way that starts or ends an activation for ${person1.name}${person2?' or '+person2.name:''}. This is conditioning weather, not a prediction of events.`))}</p>`);
  }
  if(omitLightsOn()){
    parts.push(`<p>${escapeHtml('Lights omitted: Sun, Earth, and Moon are excluded from this timeline. Other planets still show gate and line ingresses.')}</p>`);
  }
  if(allGateOnlyOn()){
    parts.push(`<p>${escapeHtml('All-planets filter on: only gate changes are listed; line changes within the same gate are omitted for every body.')}</p>`);
  } else if(!omitLightsOn()){
    if(moonGateOnlyOn()){
      parts.push(`<p>${escapeHtml('Moon filter on: only Moon gate changes are listed; Moon line changes within the same gate are omitted. Other planets still show gate and line ingresses.')}</p>`);
    }
    if(sunGateOnlyOn()){
      parts.push(`<p>${escapeHtml('Sun/Earth filter on: only Sun and Earth gate changes are listed; their line changes within the same gate are omitted. Other planets still show gate and line ingresses.')}</p>`);
    }
  }
  if(!shortMode && meta.moonSkipped>0){
    parts.push(`<p>${escapeHtml(`The Moon changed gate or line ${meta.moonSkipped} additional time${meta.moonSkipped>1?'s':''} without directly hooking these charts; those quieter lunar shifts are omitted so the timeline stays readable.`)}</p>`);
  }
  if(!events.length){
    const emptyMsg = shortCouple
      ? ('No interaction-relevant gate or line ingresses were found in this window between '+person1.name+' and '+person2.name+'.')
      : (shortSolo
        ? ('No chart-relevant gate or line ingresses were found in this window for '+person1.name+'.')
        : 'No chart-relevant gate or line ingresses were found in this window for the activations entered.');
    parts.push(`<p>${escapeHtml(emptyMsg)}</p>`);
  } else {
    let currentDay=null;
    for(const ev of events){
      if(ev.dayKey!==currentDay){
        currentDay=ev.dayKey;
        parts.push(`<h3>${escapeHtml(currentDay)}</h3>`);
      }
      let para;
      if(rw){
        if(shortCouple) para=describeInteractionTimelineEventRW(ev, person1, person2);
        else if(shortSolo) para=describePersonShortTimelineEventRW(ev, person1);
        else para=describeTimelineEventRW(ev, ev.reasons, person1, person2, show);
      } else {
        if(shortCouple) para=describeInteractionTimelineEvent(ev, person1, person2);
        else if(shortSolo) para=describePersonShortTimelineEvent(ev, person1);
        else para=describeTimelineEvent(ev, ev.reasons, person1, person2, show);
      }
      parts.push(`<p><strong>${escapeHtml(ev.stamp)}</strong> — ${escapeHtml(para)}</p>`);
    }
  }
  const tech=[];
  tech.push('Timeline window: '+meta.rangeLabel);
  tech.push('Mode: '+(shortCouple?'interactions-only':(shortSolo?'short-solo':'full')));
  tech.push('Lights (Sun/Earth/Moon): '+(omitLightsOn()?'omitted from timeline':'included'));
  tech.push('All planets filter: '+(allGateOnlyOn()?'gate changes only (line ingresses omitted)':'off'));
  if(!allGateOnlyOn() && !omitLightsOn()){
    tech.push('Moon filter: '+(moonGateOnlyOn()?'gate changes only (line ingresses omitted)':'gate and line ingresses'));
    tech.push('Sun/Earth filter: '+(sunGateOnlyOn()?'gate changes only (line ingresses omitted)':'gate and line ingresses'));
  }
  tech.push('Events shown: '+events.length+(shortCouple?(' interaction-relevant / '+allEvents.length+' chart-relevant'):(' chart-relevant'))+' / '+meta.rawCount+' total ingresses scanned; moon-only non-hooks omitted: '+meta.moonSkipped);
  tech.push('Verification: each event checked 1 minute before vs at stamp (gate/line differs): '+events.filter(e=>e.verified).length+'/'+events.length);
  for(const ev of events){
    tech.push(`${ev.stamp} | ${ev.planet} ${ev.from.gl} → ${ev.to.gl} | ${ev.gateChanged?'gate':'line'} | reasons: ${ev.reasons.map(r=>r.type+'@'+r.who).join(', ')}`);
  }
  parts.push(`<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)</summary><pre>${escapeHtml(tech.join('\n'))}</pre></details></div>`);
  const slim=events.map(e=>({
    tMs:e.tMs, planet:e.planet, from:e.from.gl, to:e.to.gl, stamp:e.stamp, verified:!!e.verified,
    reasons:(e.reasons||[]).map(r=>({type:r.type, who:r.who, role:r.role||null})),
    who:e.who||null
  }));
  const counts={
    total:events.length,
    fullTotal:allEvents.length,
    interactionsOnly:!!wantIx,
    shortSolo:!!shortSolo,
    shortCouple:!!shortCouple,
    person1:events.filter(e=>e.who&&e.who.person1).length,
    person2:events.filter(e=>e.who&&e.who.person2).length,
    couple:events.filter(e=>e.who&&e.who.couple).length,
    both:events.filter(e=>e.who&&e.who.both).length,
    person1Name:person1?person1.name:null,
    person2Name:person2?person2.name:null
  };
  parts.push('<pre id="timelineEventsJson" style="display:none">'+escapeHtml(JSON.stringify({counts, events:slim}))+'</pre>');
  return parts.join('\n');
}



function plainChannelName(ch){
  return (ch.name||ch.id||'').replace(/^The\s+/i,'');
}
function clip(s,n){
  // Clean control chars / page markers; keep full meaning text (n is a soft cap only for pathological length).
  s=(s||'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\bPage\s+\d+\b/gi,' ').replace(/…/g,' ').replace(/\.{3,}/g,'. ').replace(/\s+/g,' ').trim();
  if(!n || s.length<=n) return s;
  // Prefer ending on a sentence boundary without adding an ellipsis.
  const cut=s.slice(0,n);
  const m=cut.match(/^[\s\S]*[.!?](?=\s|$)/);
  if(m && m[0].length>Math.min(200, n*0.4)) return m[0].trim();
  // Fall back to last word boundary — still no ellipsis so greps stay clean.
  return cut.replace(/\s+\S*$/,'').trim();
}
function gateThemeName(gateNum){
  const g=gateInfo(gateNum);
  const raw=(g && g.name) ? g.name : ('gate '+gateNum);
  return plainChannelName({name:raw}) || raw;
}
function fmtGateTheme(gateNum, showCodes){
  const theme=gateThemeName(gateNum);
  return showCodes ? (theme+' (gate '+gateNum+')') : theme;
}
function everydayHook(theme){
  const t=(theme||'this pressure').toLowerCase().replace(/^the\s+/,'');
  const pool=[
    `At work, a small request can suddenly feel like a referendum on ${t}.`,
    `In conversation, tone can harden before either person means to defend ${t}.`,
    `Mood may swing toward needing space to sort what ${t} is actually asking for.`,
    `Decisions can feel urgent—as if waiting would betray ${t}.`,
    `Affection lands differently: a hug may soothe ${t}, or feel like one more demand on it.`,
    `Conflict can flare when one person tries to fix ${t} while the other only wants it witnessed.`
  ];
  let h=0; for(const ch of t) h=(h+ch.charCodeAt(0))%pool.length;
  return pool[h];
}
function scenarioPair(seed, aName, bName, theme, kind){
  // 1–2 everyday couple scenarios, varied by seed/kind/theme — no identical boilerplate.
  const t=(theme||'this weather').replace(/^the\s+/i,'').trim();
  const s=Math.abs(seed)||1;
  const packs={
    same_gate:[
      [`In a planning talk, ${aName} and ${bName} may mirror the same ${t} urgency—both insisting the calendar must bend—then soften once they notice they are arguing the same fear aloud.`,
       `At dinner, a throwaway comment about effort can bounce between them: each hears criticism of ${t} in the other, though both are tired of carrying it alone.`],
      [`On a work call they share the screen for, both reach for control of ${t} details; the fix is to assign one decision owner for the next hour.`,
       `Affection gets literal—${aName} offers help with tasks while ${bName} wants quiet presence—until they name that both are trying to care through ${t}.`]
    ],
    shared_channel:[
      [`${aName} feels the ${t} channel “click on” as pressure to act; ${bName}, already wired for that circuit, can amplify it by finishing sentences or racing ahead—pause and ask who is leading for the next ten minutes.`,
       `In conflict, one pushes for resolution while the other holds the defined side of ${t}; naming the shared channel keeps it from becoming a character verdict.`],
      [`A logistics snag (keys, timing, a bill) becomes a full ${t} drama; they do better when one holds the practical step and the other holds the emotional weather.`,
       `Later, affection returns quickly once the bargain is clear—space, a walk, or a single completed chore—because the channel pressure has somewhere to go.`]
    ],
    electro:[
      [`${aName}'s open side of the connection drinks in ${bName}'s defined ${t}; what feels like chemistry can also feel like being pulled off strategy—check body yes/no before agreeing.`,
       `In a hard talk, the electromagnetic pull toward ${t} can make silence feel rejecting; a short “I need two minutes, then I am back” protects the bond.`],
      [`At work-adjacent decisions (who emails, who drives), the pull of ${t} between them can look like mind-reading; say the ask out loud instead of testing whether the other will just know.`,
       `When the transit eases, the craving to merge around ${t} softens—good time to renegotiate habits that only made sense under that pull.`]
    ],
    touch_start:[
      [`${aName} may suddenly feel ${t} as body-level weather; ${bName} can mistake it for a new opinion about the relationship. A check-in—“is this the sky or us?”—prevents a fake fight.`,
       `Decision-making speeds up for ${aName}; ${bName}'s steadier pace can feel like friction unless they agree what can wait until morning.`],
      [`In affection, ${aName} might seek more reassurance around ${t} while ${bName} offers solutions; trade one validation for one practical step.`,
       `At work, ${aName}'s tone about ${t} can spill into the couple chat; ${bName} helps by reflecting the theme without taking the assignment.`]
    ],
    touch_end:[
      [`As ${t} releases for ${aName}, energy that looked like withdrawal was often just the transit unhooking—${bName} can meet the easing with curiosity instead of chasing.`,
       `A conflict that felt stuck around ${t} may suddenly have room for humor; use the lull to make one clear agreement while neither is flooded.`],
      [`Affection may feel simpler once ${t} stops pressing ${aName}'s chart; ${bName} should not take the quieter need for contact as rejection.`,
       `Shared plans made under that activation can be reviewed gently—keep what still feels true without the sky's volume.`]
    ],
    line_shift:[
      [`The flavor of ${t} changes more than the topic: ${aName} may go from careful to blunt (or the reverse) while ${bName} is still answering the earlier tone—reset with “same theme, new emphasis.”`,
       `In a money or schedule talk, the line-shift can make yesterday's compromise feel wrong; revisit one detail, not the whole bond.`],
      [`Work stress colored by ${t} can change pitch mid-afternoon; ${bName} notices first in voice and body. A short walk beats a full autopsy.`,
       `Affection may need a different language after the shift—less pep talk, more listening, or the opposite—ask which lands now.`]
    ],
    one_sided:[
      [`${aName} is more hooked by ${t} while ${bName} stays clearer; compassion beats fairness—extra recovery time for the hooked partner is not scorekeeping.`,
       `When ${aName} spirals on ${t}, ${bName}'s open centers can amplify it by catching the mood; grounding (food, outside air, fewer texts) helps both.`]
    ]
  };
  const list=packs[kind]||packs.line_shift;
  const pair=list[s%list.length];
  return pair.slice(0,2);
}

function codesOn(){ try{ return !!document.getElementById('includeCodes')?.checked; }catch(e){ return false; } }

function interactionsOnlyOn(){ return false; }
function includeRangeTransitFieldOn(){
  try{ return !!document.getElementById('includeRangeTransitField')?.checked; }catch(e){ return false; }
}
function includeRangeOverviewTransitFieldOn(){
  try{
    if(typeof window!=='undefined' && window.__INCLUDE_OVERVIEW_TRANSIT_FIELD__===true) return true;
    if(typeof window!=='undefined' && window.__INCLUDE_OVERVIEW_TRANSIT_FIELD__===false) return false;
    return !!document.getElementById('includeRangeOverviewField')?.checked;
  }catch(e){ return false; }
}
function isRangeWhenActive(){
  try{
    const mr=document.getElementById('modeRange');
    if(mr && mr.classList && mr.classList.contains('active')) return true;
    // When range is active, syncRangeTransitFieldOpt sets display to '' (visible); when single, 'none'.
    const opt=document.getElementById('rangeTransitFieldOpt');
    if(opt && opt.style && opt.style.display!=='none'){
      // Visible (display '' or 'block'/flex) means range mode.
      return true;
    }
  }catch(e){}
  return false;
}
/** Should any Transit field / positions table / gate.line field list appear? */
function wantTransitFieldSections(meta){
  meta = meta || {};
  if(meta.includePositions === true || meta.includeTransitField === true) return true;
  if(meta.includePositions === false || meta.includeTransitField === false) return false;
  // Runtime flag set by runAnalysis from the effective checkbox for this report mode
  try{
    if(typeof window!=='undefined' && window.__INCLUDE_TRANSIT_FIELD__===true) return true;
    if(typeof window!=='undefined' && window.__INCLUDE_TRANSIT_FIELD__===false) return false;
  }catch(e){}
  // Callers that forgot the flag: range mode picks overview vs narrative field box
  if(isRangeWhenActive()){
    if(wantRangeOverview(meta)) return includeRangeOverviewTransitFieldOn();
    return includeRangeTransitFieldOn();
  }
  return true; // single day / Now
}
/** Raw planet/gate.line stamps (the "field") — off when range checkbox unchecked. */
function showTransitFieldPositions(meta){
  return wantTransitFieldSections(meta);
}
function rangeTransitFieldMode(dayCount){
  // Choice: per-day tables when range is short (<=7 days); otherwise start+end only.
  // When Overview is on, the overview-field checkbox governs; otherwise the upper narrative field box.
  if(!(dayCount>1)) return 'single';
  const ovOn = (typeof wantRangeOverview==='function') ? wantRangeOverview({}) : includeRangeOverviewOn();
  const fieldOn = ovOn ? includeRangeOverviewTransitFieldOn() : includeRangeTransitFieldOn();
  if(!fieldOn) return 'omit';
  return dayCount <= 7 ? 'per-day' : 'start-end';
}
function includeRangeOverviewOn(){
  try{
    if(typeof window!=='undefined' && window.__INCLUDE_RANGE_OVERVIEW__===true) return true;
    if(typeof window!=='undefined' && window.__INCLUDE_RANGE_OVERVIEW__===false) return false;
    return !!document.getElementById('includeRangeOverview')?.checked;
  }catch(e){ return false; }
}
function wantRangeOverview(meta){
  meta = meta || {};
  if(meta.rangeOverview === true) return true;
  if(meta.rangeOverview === false) return false;
  try{
    if(typeof window!=='undefined' && window.__INCLUDE_RANGE_OVERVIEW__===true) return true;
    if(typeof window!=='undefined' && window.__INCLUDE_RANGE_OVERVIEW__===false) return false;
  }catch(e){}
  return isRangeWhenActive() && includeRangeOverviewOn();
}
/** First sentence / short clause — no lookbehind (iOS-safe). */
function firstSentencePlain(text, maxLen){
  maxLen = maxLen || 220;
  let s = String(text||'').replace(/\s+/g,' ').trim();
  if(!s) return '';
  // Drop source-y tokens without naming them in output
  s = s.replace(/\b(LCN|TCRI|Ra\s*Uru\s*Hu|Rave\s+I\s*Ching|Black\s+Book)\b/gi,'').replace(/\s+/g,' ').trim();
  let cut = -1;
  const lim = Math.min(s.length, maxLen + 40);
  for(let i=0;i<lim;i++){
    const ch = s.charAt(i);
    if(ch==='.' || ch==='!' || ch==='?'){ cut=i; break; }
  }
  if(cut>=12) s = s.slice(0, cut+1);
  else s = s.slice(0, maxLen);
  s = s.replace(/[,:;\-—]+\s*$/,'').trim();
  if(s && !/[.!?]$/.test(s)) s += '.';
  return s;
}
function lineDescriptionBrief(line){
  if(!line) return '';
  const title = cleanLineTitle(line);
  const body = firstSentencePlain(line.lcn_text || line.tcri_text || '', 200);
  return {title: title || '', body: body};
}
function realWorldOn(){ try{ return !!document.getElementById('realWorldInfluence')?.checked; }catch(e){ return false; } }
function moonGateOnlyOn(){ try{ return !!document.getElementById('moonGateOnly')?.checked; }catch(e){ return true; } }
function sunGateOnlyOn(){ try{ return !!document.getElementById('sunGateOnly')?.checked; }catch(e){ return true; } }
function allGateOnlyOn(){ try{ return !!document.getElementById('allGateOnly')?.checked; }catch(e){ return false; } }
function omitLightsOn(){ try{ return !!document.getElementById('omitLights')?.checked; }catch(e){ return false; } }
function directOnlyOn(){ return false; }
const LIGHT_PLANETS = ['Sun','Earth','Moon'];
function isLightPlanet(p){ return LIGHT_PLANETS.includes(p); }
function transitWithoutLights(transit){
  if(!omitLightsOn() || !transit || !transit.planets) return transit;
  const planets={};
  for(const [k,v] of Object.entries(transit.planets)){
    if(isLightPlanet(k)) continue;
    planets[k]=v;
  }
  return Object.assign({}, transit, {planets});
}


function centerNotSelfInfo(center){
  const map=CENTERS_NOT_SELF||{};
  if(map[center]) return map[center];
  if(center==='Heart' && map['Heart/Ego']) return map['Heart/Ego'];
  if(center==='Ego' && map['Heart/Ego']) return map['Heart/Ego'];
  if(center==='Identity' && map['G']) return map['G'];
  if(center==='Emotional' && map['Solar Plexus']) return map['Solar Plexus'];
  return null;
}
function typeNotSelfInfo(person){
  const raw=person && person.raw ? person.raw : {};
  let t=raw.type||raw.hd_type||raw.Type||raw['HD Type']||null;
  if(!t) return null;
  const key=String(t).trim();
  const map=TYPE_NOT_SELF||{};
  if(map[key]) return Object.assign({type:key}, map[key]);
  const lower=key.toLowerCase();
  for(const [k,v] of Object.entries(map)){
    if(k.toLowerCase()===lower) return Object.assign({type:k}, v);
    if(lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return Object.assign({type:k}, v);
  }
  if(/manifesting\s*generator|mg\b/i.test(key)) return Object.assign({type:'Manifesting Generator'}, map['Manifesting Generator']||{});
  if(/\bgenerator\b/i.test(key)) return Object.assign({type:'Generator'}, map['Generator']||{});
  if(/\bprojector\b/i.test(key)) return Object.assign({type:'Projector'}, map['Projector']||{});
  if(/\bmanifestor\b/i.test(key)) return Object.assign({type:'Manifestor'}, map['Manifestor']||{});
  if(/\breflector\b/i.test(key)) return Object.assign({type:'Reflector'}, map['Reflector']||{});
  return null;
}
function transitCentersTouched(transit){
  const tGates=new Set(Object.values(transit.planets||{}).map(p=>p.gate));
  const centers=new Set();
  for(const g of tGates){
    const gi=gateInfo(g);
    if(gi && gi.center) centers.add(gi.center);
  }
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(tGates.has(a)&&tGates.has(b)) for(const c of (ch.centers||[])) centers.add(c);
  }
  return [...centers];
}
function openCentersConditioned(person, transit, day){
  const open=new Set(openCentersOf(person));
  const hit=new Set();
  for(const c of transitCentersTouched(transit)) if(open.has(c)) hit.add(c);
  for(const c of (day && day.centers_activated_with_natal)||[]) if(open.has(c)) hit.add(c);
  for(const item of (day && day.completed_channels)||[]){
    for(const c of (item.info && item.info.centers)||[]) if(open.has(c)) hit.add(c);
  }
  for(const t of (day && day.touches)||[]){
    const c=t.gate && t.gate.center;
    if(c && open.has(c)) hit.add(c);
  }
  return [...hit];
}
function codesFrag(show, theme, code){
  if(!show) return theme;
  return code ? (theme+' ('+code+')') : theme;
}
function scenarioRW(seed, name, theme, kind){
  const t=(theme||'this pressure').replace(/^the\s+/i,'').trim();
  const s=Math.abs(seed)||1;
  const packs={
    open_center:[
      `At work, ${name} may notice ${t} and rush a reply that could wait—one slow breath before send.`,
      `At home, ${name} can treat ${t} as a life rule; naming it as temporary weather keeps dinner kinder.`,
      `In conversation, ${name} may defend against ${t} as if it were personal criticism—ask “is this mine?” first.`
    ],
    channel:[
      `A logistics snag can feel like proof of ${t} for ${name}; finish one small next step, then reassess.`,
      `${name} may speed up decisions under ${t}—write the choice down and revisit after a short walk.`,
      `In a meeting, ${name}'s tone can sharpen around ${t}; one clarifying question beats a hard close.`
    ],
    partner:[
      `When ${name} catches a partner's defined energy as ${t}, the room can feel suddenly “about me”—pause before matching volume.`,
      `${name} may borrow certainty from the other person and call it ${t}; check the body's yes/no before agreeing.`,
      `A shared chore list can become a referendum on ${t}; split one task and leave the verdict for later.`
    ],
    type:[
      `${name}'s not-self signature (${t}) can flare when the sky pushes initiation—return to strategy before another yes.`,
      `If ${t} shows up mid-day for ${name}, treat it as a signal to slow the next commitment, not to force a breakthrough.`
    ]
  };
  const list=packs[kind]||packs.open_center;
  return list[s%list.length];
}
function scenarioRWPair(seed, aName, bName, theme, kind){
  const t=(theme||'this pressure').replace(/^the\s+/i,'').trim();
  const s=Math.abs(seed)||1;
  const packs={
    open_bridge:[
      `When ${aName} brings defined ${t}, ${bName}'s open side can amplify it—agree on a 10-minute cool-off before problem-solving.`,
      `At home, ${aName}'s certainty about ${t} can become ${bName}'s emergency; name who owns the feeling before assigning chores.`,
      `In a money or calendar talk, ${bName} may absorb ${aName}'s ${t} and over-agree; one “let me check” buys clarity.`
    ],
    electro:[
      `${aName} and ${bName} can spark around ${t}—chemistry rises, but so can not-self proving. Trade one honest need, not a verdict.`,
      `A short text thread can escalate ${t} between them; switch to voice or wait until both have eaten.`
    ],
    shared:[
      `Both can feel ${t} at once and argue the content while the weather is loud—park the decision until the charge drops.`,
      `Shared ${t} can make a grocery run feel like a values fight; pick one aisle, one choice, move on.`
    ]
  };
  const list=packs[kind]||packs.open_bridge;
  return list[s%list.length];
}

function narrativePersonShortRW(person, day, transit){
  const items=[];
  const show=codesOn();
  const conditioned=openCentersConditioned(person, transit, day);
  const covered=new Set();

  for(const center of conditioned.slice(0,4)){
    const info=centerNotSelfInfo(center);
    const theme=info?info.not_self_theme:('open '+center+' conditioning');
    const q=info&&info.not_self_question?(' Not-self check: '+info.not_self_question):'';
    const pull=info&&info.everyday_pull?info.everyday_pull:('everyday pressure around the '+center+' center');
    const label=codesFrag(show, center+' center', center);
    const example=scenarioRW((center.length*9+(transit.planets.Sun?.gate||1)), person.name, center, 'open_center');
    items.push(
      'Potential: this sky can fill '+person.name+'\'s open '+label+', amplifying not-self themes around '+theme+'.'+q+
      ' In plain terms, watch for '+pull+'. '+example
    );
    covered.add(center);
  }

  for(const item of (day.completed_channels||[]).slice(0,4)){
    const theme=plainChannelName(item.info);
    const label=codesFrag(show, 'channel of '+theme, item.channel);
    const how=item.kind==='electromagnetic'?'temporarily completes an open side with the sky':(item.kind==='transit_overlay_on_natal_channel'?'overlays a known channel':'completes with the sky');
    const centers=((item.info&&item.info.centers)||[]).filter(c=>openCentersOf(person).includes(c));
    const ns=centers.map(c=>centerNotSelfInfo(c)).filter(Boolean);
    const nsBit=ns.length?(' Open '+centers.join('/')+' may show: '+(ns[0].not_self_theme)+'.'):'';
    const example=scenarioRW((item.channel||'').length*11+(transit.planets.Sun?.gate||1), person.name, theme, 'channel');
    items.push(
      'Potential: '+person.name+' '+how+' through the '+label+', so channel pressure can feel like a personal flaw even when it is transit weather.'+nsBit+' '+example
    );
  }

  for(const t of (day.touches||[]).slice(0,3)){
    if(covered.has(t.gate&&t.gate.center)) {/* still allow */}
    const theme=t.gate?.name||gateThemeName(t.transit.gate);
    const hook=show?(t.planet+' at '+t.transit.gl+' ('+theme+')'):(t.planet+' around '+theme);
    const c=t.gate&&t.gate.center;
    const info=c?centerNotSelfInfo(c):null;
    const nsBit=info?(' If '+c+' is open in the chart, not-self may sound like: '+info.not_self_question):'';
    const example=scenarioRW((t.transit.gate||1)*13+(t.transit.line||1), person.name, theme, 'channel');
    items.push(
      'Potential: '+hook+' lands on a gate already in '+person.name+'\'s chart, which can personalize the sky.'+nsBit+' '+example
    );
  }

  const typeInfo=typeNotSelfInfo(person);
  if(typeInfo && typeInfo.signature){
    const example=scenarioRW(31, person.name, typeInfo.signature, 'type');
    items.push(
      'Potential: if '+person.name+' is moving as a '+typeInfo.type+', the not-self signature of '+typeInfo.signature+' can get louder under this conditioning—'+typeInfo.theme+'. '+example
    );
  }

  if(!items.length){
    items.push('With the activations entered, '+person.name+' does not show a loud not-self hook into this exact sky. Treat the day as lighter conditioning through open centers, and keep practical choices slow when pressure feels borrowed.');
  }
  return items.map(s=>s.replace(/\s+/g,' ').trim());
}

function narrativeInteractionsOnlyRW(p1, p2, dyn, transit, day1, day2){
  const items=[];
  const show=codesOn();
  const opens=openCenterAmplifications(p1, p2, transit);

  for(const n of opens.slice(0,3)){
    const info=centerNotSelfInfo(n.center);
    const theme=info?info.not_self_theme:('conditioning through '+n.center);
    const label=codesFrag(show, n.center+' center', n.center);
    const q=info&&info.not_self_question?(' '+n.open+' not-self check: '+info.not_self_question):'';
    const example=scenarioRWPair(11+n.center.length, n.amplifier, n.open, n.center, 'open_bridge');
    items.push(
      'Potential: '+n.amplifier+'\'s definition (with this sky) can fill '+n.open+'\'s open '+label+', amplifying not-self themes around '+theme+'.'+q+' '+example
    );
  }

  // Temporary definition via transit+natal completions: one chart "lights" a center the other still has open
  const bridgeSeen=new Set(opens.map(n=>n.center+'|'+n.open));
  let tempBridgeCount=0;
  function pushTempBridge(amplifier, openPerson, center, seed){
    if(tempBridgeCount>=3) return;
    const key=center+'|'+openPerson.name;
    if(bridgeSeen.has(key)) return;
    if(!openCentersOf(openPerson).includes(center)) return;
    bridgeSeen.add(key);
    tempBridgeCount++;
    const info=centerNotSelfInfo(center);
    const theme=info?info.not_self_theme:('conditioning through '+center);
    const label=codesFrag(show, center+' center', center);
    const q=info&&info.not_self_question?(' '+openPerson.name+' not-self check: '+info.not_self_question):'';
    const example=scenarioRWPair(seed, amplifier.name, openPerson.name, center, 'open_bridge');
    items.push(
      'Potential: as this sky completes channels with '+amplifier.name+', '+center+' can feel temporarily defined for '+amplifier.name+' while staying open in '+openPerson.name+'—so '+openPerson.name+' may amplify not-self themes around '+theme+'.'+q+' '+example
    );
  }
  for(const item of (day1?.completed_channels||[]).slice(0,4)){
    for(const c of (item.info&&item.info.centers)||[]) pushTempBridge(p1, p2, c, 41+c.length);
  }
  for(const item of (day2?.completed_channels||[]).slice(0,4)){
    for(const c of (item.info&&item.info.centers)||[]) pushTempBridge(p2, p1, c, 53+c.length);
  }

  const map1=new Map((day1?.completed_channels||[]).map(i=>[i.channel,i]));
  const map2=new Map((day2?.completed_channels||[]).map(i=>[i.channel,i]));
  const sharedCh=[...map1.keys()].filter(id=>map2.has(id));
  for(const id of sharedCh.slice(0,3)){
    const a=map1.get(id), ch=a.info;
    const theme=plainChannelName(ch);
    const label=codesFrag(show, 'channel of '+theme, ch.id||id);
    const example=scenarioRWPair((transit.planets.Sun?.gate||1)*17+id.length, p1.name, p2.name, theme, 'shared');
    items.push(
      'Potential: both '+p1.name+' and '+p2.name+' hook the '+label+' with the sky, so the same not-self pressure can rise in both charts at once—volume is weather, not a final verdict on the relationship. '+example
    );
  }

  if(dyn && dyn.transit_amplified_channels && dyn.transit_amplified_channels.length){
    const electroIds=new Set((dyn.electromagnetic||[]).map(c=>c.id||c));
    for(const c of dyn.transit_amplified_channels.slice(0,3)){
      const theme=plainChannelName(c);
      const label=codesFrag(show, theme, c.id);
      const kind=electroIds.has(c.id)?'electro':'shared';
      const link=electroIds.has(c.id)?'electromagnetic chemistry':'a familiar link';
      const example=scenarioRWPair(23+(c.id||'').length, p1.name, p2.name, theme, kind);
      items.push(
        'Potential: transit turns up '+label+' on '+link+' between them. Not-self proving or people-pleasing can hitch a ride on the chemistry—name the need without forcing agreement. '+example
      );
    }
  } else if(dyn && dyn.electromagnetic && dyn.electromagnetic.length){
    const c=dyn.electromagnetic[0];
    const theme=plainChannelName(c);
    const label=codesFrag(show, theme, c.id);
    items.push(
      'Potential: '+p1.name+' and '+p2.name+' still carry electromagnetic charge through '+label+'. Even without a loud transit spotlight, not-self can show up as trying to win the difference instead of letting chemistry stay interesting.'
    );
  }

  const bothHooks=(dyn && dyn.shared_transit_hooks)?dyn.shared_transit_hooks.filter(h=>h.in_a&&h.in_b):[];
  for(const h of bothHooks.slice(0,2)){
    const theme=h.gate.name||gateThemeName(h.gate.number||h.line.gate);
    const hook=show?(h.planet+' at '+h.gl+' ('+theme+')'):(h.planet+' around '+theme);
    const example=scenarioRWPair((h.gate.number||7)*11, p1.name, p2.name, theme, 'shared');
    items.push(
      'Potential: they mirror each other on '+hook+', which can amplify not-self urgency on both sides. '+example
    );
  }

  // One-sided hook conditioning the open partner
  if(!bothHooks.length && dyn && dyn.shared_transit_hooks){
    const aOnly=dyn.shared_transit_hooks.filter(h=>h.in_a&&!h.in_b);
    const bOnly=dyn.shared_transit_hooks.filter(h=>h.in_b&&!h.in_a);
    if(aOnly.length || bOnly.length){
      const hooked=aOnly.length?aOnly[0]:bOnly[0];
      const hookedName=aOnly.length?p1.name:p2.name;
      const otherName=aOnly.length?p2.name:p1.name;
      const theme=hooked.gate.name||gateThemeName(hooked.line.gate);
      const hook=show?(hooked.planet+' at '+hooked.gl+' · '+theme):(hooked.planet+' around '+theme);
      const example=scenarioRWPair(19, hookedName, otherName, theme, 'open_bridge');
      items.push(
        'Potential: '+hookedName+' is more directly hooked by '+hook+', while '+otherName+' may take it in through open centers and relationship empathy—borrowed pressure can look like a personal emergency. '+example
      );
    }
  }

  if(!items.length){
    items.push('With these charts and this sky, no loud not-self bridge stands out. Keep practical agreements light, and watch for borrowed urgency before locking plans.');
  }
  return items.map(s=>s.replace(/\s+/g,' ').trim());
}

function narrativePersonRW(person, day, transit){
  // Full long-form real-world story
  const paras=[];
  const show=codesOn();
  const items=(day.completed_channels||[]).slice();
  const coveredGates=new Set();
  for(const item of items){
    for(const g of item.transit_gates||[]) coveredGates.add(g);
  }
  const extras=(day.touches||[]).filter(t=>!coveredGates.has(t.transit.gate));
  const conditioned=openCentersConditioned(person, transit, day);
  const openList=openCentersOf(person);

  if(!items.length && !extras.length && !conditioned.length){
    paras.push(person.name+' does not show a loud practical hook into this exact sky from the activations entered. Open centers can still drink ambient conditioning, so keep pace slow when urgency feels borrowed rather than chosen.');
    return paras;
  }

  const chNames=items.map(i=>plainChannelName(i.info));
  const openBits=conditioned.length
    ? (' Open '+conditioned.slice(0,4).map(c=>codesFrag(show, c+' center', c)).join(', ')+' may temporarily fill, which is where not-self themes usually get louder in ordinary rooms.')
    : '';
  if(chNames.length){
    paras.push('For '+person.name+', this sky is practical conditioning weather—not fate. Temporary completions around '+chNames.join(', ')+' can make work pace, home tone, and small decisions feel suddenly personal.'+openBits+' Naming the pressure as transit weather before acting keeps the day from turning into a character verdict.');
  } else if(conditioned.length){
    paras.push('For '+person.name+', the louder story today is open-center conditioning'+openBits+' Everyday life—inbox, kitchen, a partner\'s mood—can amplify not-self questions even without a full channel click. The useful move is to treat urgency as weather and return to strategy before the next yes.');
  }

  for(const item of items){
    const ch=item.info;
    const theme=plainChannelName(ch);
    const tGate=item.transit_gates[0];
    const tPlanet=item.transit_planets[0]||'a transit';
    const pval=transit.planets[tPlanet]||Object.values(transit.planets).find(p=>p.gate===tGate);
    const line=pval?lineInfo(tGate, pval.line):lineInfo(tGate,1);
    const gInfo=gateInfo(tGate);
    const natalBits=item.natal_gates.map(g=>{
      const np=Object.entries(person.planets).filter(([,v])=>v.gate===g).map(([k])=>k);
      return (np.length?np.join('/')+' at ':'')+'gate '+g;
    }).join(' and ');
    const natalPlain=fmtNatalRef(person.name, natalBits, item.natal_gates);
    const meaning=meaningForLine(line, gInfo);
    const design=ch.design?(' ('+ch.design.replace(/^A design /i,'a design ')+')'):'';
    const subj=fmtGL(tPlanet, line.gl, theme||gInfo.name||'');
    const chRef=fmtChannel(ch)+design;
    const how=item.kind==='electromagnetic'?'temporarily completes an open side with the sky':(item.kind==='transit_overlay_on_natal_channel'?'overlays a familiar circuit':'completes with the sky');
    const centers=((ch&&ch.centers)||[]).filter(c=>openList.includes(c));
    const ns=centers.map(c=>centerNotSelfInfo(c)).filter(Boolean);
    let nsBit='';
    if(ns.length){
      const n0=ns[0];
      nsBit=' Because '+centers.join('/')+' can open under this weather, not-self may sound like "'+(n0.not_self_question||n0.not_self_theme)+'" and pull toward '+(n0.everyday_pull||('pressure around '+centers[0]))+'.';
    }
    const ex1=scenarioRW((item.channel||'').length*11+(transit.planets.Sun?.gate||1), person.name, theme, 'channel');
    const ex2=scenarioRW((item.channel||'').length*11+(transit.planets.Sun?.gate||1)+3, person.name, ns.length?ns[0].not_self_theme:theme, centers.length?'open_center':'channel');
    paras.push(subj+' '+how+' through '+chRef+' with '+natalPlain+'. '+(meaning?meaning+' ':'')+'In real life that can feel like a sudden need to fix, prove, or hurry.'+nsBit+' How this may play out: '+ex1+' '+ex2);
  }

  for(const touch of extras.slice(0,8)){
    const line=touch.line, g=touch.gate;
    const meaning=meaningForLine(line, g);
    const subj=fmtGL(touch.planet, line.gl, g.name||'');
    const natalP=(touch.natal_planets||[]).join('/')||'activation';
    const where=show?(person.name+'\'s '+natalP+' in gate '+g.number+' ('+g.name+')'):(person.name+'\'s '+natalP+' in '+g.name);
    const c=g&&g.center;
    const info=(c&&openList.includes(c))?centerNotSelfInfo(c):null;
    const nsBit=info?(' If the '+c+' center is open, watch for not-self: '+info.not_self_theme+' ('+(info.not_self_question||'is this mine?')+').'):'';
    const ex1=scenarioRW((touch.transit.gate||1)*13+(touch.transit.line||1), person.name, g.name||'this theme', 'channel');
    const ex2=scenarioRW((touch.transit.gate||1)*13+(touch.transit.line||1)+5, person.name, info?info.not_self_theme:(g.name||'this theme'), info?'open_center':'channel');
    paras.push(subj+' also brushes '+where+', more as a mood or filter than a full channel click. '+(meaning?meaning+' ':'')+'It can color ordinary errands, messages, and tone at the table.'+nsBit+' How this may play out: '+ex1+' '+ex2);
  }

  const mentioned=new Set();
  for(const item of items){
    for(const c of (item.info&&item.info.centers)||[]) mentioned.add(c);
  }
  for(const center of conditioned){
    if(mentioned.has(center)) continue;
    const info=centerNotSelfInfo(center);
    const theme=info?info.not_self_theme:('open '+center+' conditioning');
    const q=info&&info.not_self_question?info.not_self_question:'Is this pressure actually mine?';
    const pull=info&&info.everyday_pull?info.everyday_pull:('everyday pressure around the '+center+' center');
    const label=codesFrag(show, center+' center', center);
    const ex1=scenarioRW(center.length*9+(transit.planets.Sun?.gate||1), person.name, theme, 'open_center');
    const ex2=scenarioRW(center.length*9+(transit.planets.Sun?.gate||1)+7, person.name, theme, 'open_center');
    paras.push('Meanwhile the open '+label+' can fill with ambient sky and other people\'s certainty, amplifying not-self around '+theme+'. The lived question is often "'+q+'"—watch for '+pull+'. How this may play out: '+ex1+' '+ex2);
    if(paras.length>14) break;
  }

  const typeInfo=typeNotSelfInfo(person);
  if(typeInfo && typeInfo.signature){
    const ex1=scenarioRW(31+(transit.planets.Sun?.gate||1), person.name, typeInfo.signature, 'type');
    const ex2=scenarioRW(37+(transit.planets.Sun?.gate||1), person.name, typeInfo.signature, 'type');
    paras.push('Under this conditioning, if '+person.name+' is moving as a '+typeInfo.type+', the not-self signature of '+typeInfo.signature+' can get louder—'+typeInfo.theme+'. Returning to strategy and authority before the next commitment keeps the sky from writing the schedule. How this may play out: '+ex1+' '+ex2);
  }

  return paras.map(s=>String(s).replace(/\s+/g,' ').trim());
}

function narrativeCoupleRW(p1, p2, dyn, transit, day1, day2){
  // Full long-form real-world couple story
  const paras=[];
  const show=codesOn();
  const map1=new Map((day1?.completed_channels||[]).map(i=>[i.channel,i]));
  const map2=new Map((day2?.completed_channels||[]).map(i=>[i.channel,i]));
  const sharedCh=[...map1.keys()].filter(id=>map2.has(id));

  paras.push('Between '+p1.name+' and '+p2.name+', treat this sky as practical relationship weather: one person\'s definition plus transit can fill the other\'s open centers, shared hooks can mirror urgency, and familiar channels can get temporarily louder at work or at home. The point is not to predict conflict—it is to notice when not-self is being amplified through each other and to slow the next reaction.');

  if(sharedCh.length){
    const bits=sharedCh.map(id=>{
      const a=map1.get(id), b=map2.get(id), ch=a.info;
      const theme=plainChannelName(ch);
      if(show){
        return theme+' ('+ch.id+': '+p1.name+' via gate '+a.natal_gates.join('/')+' and '+p2.name+' via gate '+b.natal_gates.join('/')+')';
      }
      return 'the channel of '+theme+' ('+p1.name+' and '+p2.name+' each holding a side)';
    }).join('; ');
    const theme0=plainChannelName(map1.get(sharedCh[0]).info);
    const centers=((map1.get(sharedCh[0]).info&&map1.get(sharedCh[0]).info.centers)||[]);
    const openSide=[];
    for(const c of centers){
      if(openCentersOf(p1).includes(c)) openSide.push(p1.name+'\'s open '+c);
      if(openCentersOf(p2).includes(c)) openSide.push(p2.name+'\'s open '+c);
    }
    const nsBit=openSide.length?(' Open-center bridges on '+openSide.slice(0,3).join(' / ')+' are where borrowed urgency often sneaks in.'):'';
    paras.push('Together they are both conditioned through the same channel weather—'+bits+'. That compresses the exchange: each may feel the pressure as personal, yet the sky is asking both nervous systems to process one motif.'+nsBit);
    const scenes=scenarioRWPair((transit.planets.Sun?.gate||1)*17+(sharedCh[0].length), p1.name, p2.name, theme0, 'shared');
    const scenes2=scenarioPair((transit.planets.Sun?.gate||1)*17+(sharedCh[0].length)+3, p1.name, p2.name, theme0, 'shared_channel');
    paras.push('How this may play out between them: '+scenes+' '+scenes2[0]+(scenes2[1]?(' '+scenes2[1]):''));
  }

  const both=(dyn.shared_transit_hooks||[]).filter(h=>h.in_a&&h.in_b);
  if(both.length){
    const h=both[0];
    const meaning=meaningForLine(h.line, h.gate);
    const theme=h.gate.name||gateThemeName(h.gate.number||h.line.gate);
    const hook=show?(h.planet+' '+h.gl+' ('+theme+')'):(h.planet+"'s theme around "+theme);
    const c=h.gate&&h.gate.center;
    const info=c?centerNotSelfInfo(c):null;
    const openWho=[];
    if(c){
      if(openCentersOf(p1).includes(c)) openWho.push(p1.name);
      if(openCentersOf(p2).includes(c)) openWho.push(p2.name);
    }
    const nsBit=(info&&openWho.length)?(' Watch '+openWho.join(' and ')+' for open '+c+' not-self around '+info.not_self_theme+'.'):'';
    paras.push('They also share a direct hook at '+hook+'. '+(meaning?meaning+' ':'')+'When two charts plug into the same transit theme, tone can escalate quickly at the kitchen table or on a shared work thread—pause and reflect the weather before solving the content.'+nsBit);
    const scenes=scenarioRWPair((h.gate.number||7)*11+h.line.line, p1.name, p2.name, info?info.not_self_theme:theme, 'shared');
    const scenes2=scenarioPair((h.gate.number||7)*11+h.line.line+2, p1.name, p2.name, theme, 'same_gate');
    paras.push('How this may play out between them: '+scenes+' '+scenes2[0]+(scenes2[1]?(' '+scenes2[1]):''));
  } else if(!sharedCh.length){
    const either=dyn.shared_transit_hooks||[];
    if(either.length){
      const aOnly=either.filter(h=>h.in_a&&!h.in_b);
      const bOnly=either.filter(h=>h.in_b&&!h.in_a);
      const fmtH=h=>{
        const theme=h.gate.name||gateThemeName(h.line.gate);
        return show?(h.planet+' '+h.gl+' · '+theme):(h.planet+' around '+theme);
      };
      paras.push('The couple field is uneven today: '+(aOnly.length?p1.name+' is more personally hooked ('+aOnly.map(fmtH).join(', ')+')':p1.name+' is less directly hooked')+', while '+(bOnly.length?p2.name+' feels '+bOnly.map(fmtH).join(', '):p2.name+' has fewer direct hooks')+'. Compassion works better than symmetry—one person may need more recovery time, and the less-hooked partner can still absorb charge through open centers.');
      const hooked=aOnly.length?aOnly[0]:bOnly[0];
      const theme=hooked?(hooked.gate.name||'this weather'):'this weather';
      const hookedName=aOnly.length?p1.name:p2.name;
      const otherName=aOnly.length?p2.name:p1.name;
      const scenes=scenarioRWPair(19, hookedName, otherName, theme, 'open_bridge');
      const scenes2=scenarioPair(19, hookedName, otherName, theme, 'one_sided');
      paras.push('How this may play out between them: '+scenes+' '+scenes2[0]+(scenes2[1]?(' '+scenes2[1]):''));
    }
  }

  if((dyn.transit_amplified_channels||[]).length){
    const names=dyn.transit_amplified_channels.map(c=>{
      const theme=plainChannelName(c);
      return show?(c.id+' '+theme):theme;
    }).join(', ');
    paras.push('Relationship channels already living between them that the transit is amplifying include '+names+'. Treat friction as temporary volume on a familiar circuit—especially where one partner\'s definition fills the other\'s openness. Agree who holds logistics, who gets quiet, and what can wait until the weather softens.');
    const theme=plainChannelName(dyn.transit_amplified_channels[0]);
    const electroIds=new Set((dyn.electromagnetic||[]).map(c=>c.id||c));
    const kind=dyn.transit_amplified_channels.some(c=>electroIds.has(c.id))?'electro':'shared_channel';
    const scenes=scenarioRWPair(23, p1.name, p2.name, theme, 'open_bridge');
    const scenes2=scenarioPair(23, p1.name, p2.name, theme, kind);
    paras.push('How this may play out between them: '+scenes+' '+scenes2[0]+(scenes2[1]?(' '+scenes2[1]):''));
  } else if((dyn.electromagnetic||[]).length && !sharedCh.length){
    paras.push('Natal electromagnetic links between '+p1.name+' and '+p2.name+' remain part of their chemistry; today\'s sky may not be spotlighting them as strongly. Keep inviting difference without forcing agreement, and notice when open centers borrow the other\'s certainty as if it were a personal emergency.');
  } else if(!sharedCh.length && !(dyn.shared_transit_hooks||[]).length){
    paras.push('With the activations entered, the couple\'s shared mechanical story for this exact sky is lighter. Focus on independent strategy and authority, meet in the middle only where both feel a bodily yes, and treat leftover urgency as ambient conditioning rather than a relationship verdict.');
  }

  // Cross-condition: each partner's open centers that the other's definition / transit may fill
  const bridges=[];
  for(const [whoOpen, whoDef, dayDef] of [[p1,p2,day2],[p2,p1,day1]]){
    const open=openCentersOf(whoOpen);
    for(const item of (dayDef.completed_channels||[]).slice(0,3)){
      for(const c of (item.info&&item.info.centers)||[]){
        if(open.includes(c)){
          const info=centerNotSelfInfo(c);
          bridges.push({openName:whoOpen.name, defName:whoDef.name, center:c, theme:info?info.not_self_theme:c, q:info&&info.not_self_question});
        }
      }
    }
  }
  const seen=new Set();
  for(const b of bridges){
    const key=b.openName+'|'+b.center;
    if(seen.has(key)) continue;
    seen.add(key);
    const label=codesFrag(show, b.center+' center', b.center);
    paras.push(b.defName+'\'s temporary definition plus this sky can fill '+b.openName+'\'s open '+label+', so '+b.openName+' may take on not-self themes around '+b.theme+(b.q?('—inner question: "'+b.q+'"'):'')+'. Naming the bridge (“this may be your weather in my open '+b.center+'”) keeps the room from turning the charge into blame.');
    if(seen.size>=3) break;
  }

  return paras.map(s=>String(s).replace(/\s+/g,' ').trim());
}

function describePersonShortTimelineEventRW(ev, person){
  const show=codesOn();
  const planet=ev.planet;
  const to=ev.to||{};
  const theme=gateThemeName(to.gate)||('gate '+to.gate);
  const hook=show?(planet+' to '+to.gl+' ('+theme+')'):(planet+' into '+theme);
  const centers=[];
  const gi=gateInfo(to.gate);
  if(gi && gi.center && openCentersOf(person).includes(gi.center)) centers.push(gi.center);
  for(const r of (ev.reasons||[])){
    if(r.type==='center' && r.after && r.after.centers){/* ignore */}
  }
  const info=centers.length?centerNotSelfInfo(centers[0]):null;
  const ns=info?(' Open '+centers[0]+' not-self potential: '+info.not_self_theme+'.'):'';
  const example=scenarioRW((to.gate||1)*7+(to.line||1), person.name, info?info.not_self_theme:theme, centers.length?'open_center':'channel');
  return hook+' may turn up practical pressure for '+person.name+'.'+ns+' '+example;
}

function describeInteractionTimelineEventRW(ev, person1, person2){
  const show=codesOn();
  const planet=ev.planet;
  const to=ev.to||{};
  const theme=gateThemeName(to.gate)||('gate '+to.gate);
  const hook=show?(planet+' to '+to.gl+' ('+theme+')'):(planet+' into '+theme);
  const who=ev.who||{};
  let bridge='';
  if(who.both) bridge='Both charts can feel this at once, so not-self urgency may mirror.';
  else if(who.couple) bridge='The shift lands in the relationship field—open centers can amplify what the other is carrying.';
  else if(who.person1 && !who.person2) bridge=person1.name+' is more directly hooked; '+person2.name+' may absorb it through openness.';
  else if(who.person2 && !who.person1) bridge=person2.name+' is more directly hooked; '+person1.name+' may absorb it through openness.';
  else bridge='The relationship can transmit the charge even when only one chart is directly hooked.';
  const gi=gateInfo(to.gate);
  const c=gi&&gi.center;
  const openSide=[];
  if(c){
    if(openCentersOf(person1).includes(c)) openSide.push(person1.name);
    if(openCentersOf(person2).includes(c)) openSide.push(person2.name);
  }
  const info=c?centerNotSelfInfo(c):null;
  const ns=info&&openSide.length?(' Watch '+openSide.join(' and ')+' for open '+c+' not-self: '+info.not_self_theme+'.'):'';
  const example=scenarioRWPair((to.gate||1)*5+(to.line||1), person1.name, person2.name, info?info.not_self_theme:theme, who.both?'shared':'open_bridge');
  return hook+' — '+bridge+ns+' '+example;
}

function describeTimelineEventRW(ev, reasons, person1, person2, show){
  // Full long-form real-world timeline stamp
  const planet=ev.planet;
  const themeTo=gateThemeName(ev.to.gate);
  const themeFrom=gateThemeName(ev.from.gate);
  const gateTo=fmtGateTheme(ev.to.gate, show);
  const gateFrom=fmtGateTheme(ev.from.gate, show);
  let move;
  if(ev.gateChanged){
    move=planet+' leaves '+gateFrom+' and enters '+gateTo+(show?(' · '+ev.from.gl+' → '+ev.to.gl):'');
  } else {
    move=show
      ? (planet+' shifts from '+ev.from.gl+' to '+ev.to.gl+' within '+gateTo)
      : (planet+' shifts emphasis within '+gateTo);
  }
  const sentences=[move+'.'];
  const people=[person1].concat(person2?[person2]:[]);
  let primaryTheme=themeTo;
  let kind='line_shift';
  const openNotes=[];
  for(const person of people){
    const mine=reasons.filter(r=>r.who===person.name);
    if(!mine.length) continue;
    const bits=[];
    const touch=mine.find(r=>r.type==='touch');
    if(touch){
      const hadFrom=touch.before.touches.split(',').some(x=>x.startsWith(planet+':'+ev.from.gate));
      const hasTo=touch.after.touches.split(',').some(x=>x.startsWith(planet+':'+ev.to.gate));
      if(hasTo && !hadFrom){
        bits.push('it begins activating '+gateTo+' already in '+person.name+'\'s chart');
        kind='touch_start'; primaryTheme=themeTo;
      } else if(hadFrom && !hasTo){
        bits.push('it ends an activation on '+gateFrom+' in '+person.name+'\'s chart');
        kind='touch_end'; primaryTheme=themeFrom;
      } else {
        bits.push('the emphasis on '+gateTo+' in '+person.name+'\'s chart changes');
        kind='line_shift'; primaryTheme=themeTo;
      }
    }
    const ch=mine.find(r=>r.type==='channel');
    if(ch){
      const b=new Set((ch.before.ch||'').split(',').filter(Boolean));
      const a=new Set((ch.after.ch||'').split(',').filter(Boolean));
      const started=[...a].filter(x=>!b.has(x));
      const ended=[...b].filter(x=>!a.has(x));
      const nameOf=id=>{
        const chId=id.split(':')[0];
        const info=channelInfo(chId);
        const theme=plainChannelName(info);
        return show?(theme+' ('+chId+')'):('the channel of '+theme);
      };
      if(started.length){ bits.push(started.map(nameOf).join(', ')+' begins defining with the sky'); kind='shared_channel'; }
      else if(ended.length){ bits.push(ended.map(nameOf).join(', ')+' releases'); kind=kind==='touch_end'?'touch_end':'shared_channel'; }
      else if(ch.role==='harmonic'){
        bits.push('sky pressure continues through '+gateTo+', the harmonic partner to a gate already in '+person.name+'\'s chart');
        kind='shared_channel'; primaryTheme=themeTo;
      }
    }
    if(mine.some(r=>r.type==='center')) bits.push('center definition around '+person.name+' shifts with this weather');
    if(bits.length) sentences.push('For '+person.name+', '+bits.join('; ')+'.');

    const gi=gateInfo(ev.to.gate);
    const c=gi&&gi.center;
    if(c && openCentersOf(person).includes(c)){
      const info=centerNotSelfInfo(c);
      if(info) openNotes.push(person.name+'\'s open '+c+' may amplify not-self around '+info.not_self_theme);
    }
  }
  const coupleR=reasons.find(r=>r.type==='couple');
  if(coupleR && person2){
    const bAmp=new Set((coupleR.before.amplified||'').split(',').filter(Boolean));
    const aAmp=new Set((coupleR.after.amplified||'').split(',').filter(Boolean));
    const started=[...aAmp].filter(x=>!bAmp.has(x));
    const ended=[...bAmp].filter(x=>!aAmp.has(x));
    const nm=id=>{const info=channelInfo(id); const theme=plainChannelName(info); return show?(theme+' ('+id+')'):('the channel of '+theme);};
    const bits=[];
    if(started.length){ bits.push('amplifies '+started.map(nm).join(', ')+' between them'); kind='electro'; }
    if(ended.length){ bits.push('releases '+ended.map(nm).join(', ')+' between them'); kind='touch_end'; }
    const bSh=coupleR.before.shared||'', aSh=coupleR.after.shared||'';
    if(bSh!==aSh){
      const both=/\bA\b/.test(aSh) && /\bB\b/.test(aSh);
      if(both){ bits.push('both charts hook the same transit theme around '+primaryTheme+' (mirroring)'); kind='same_gate'; }
      else bits.push('their shared transit hooks rearrange around '+primaryTheme);
    }
    if(bits.length) sentences.push('Together, '+bits.join('; ')+'.');
  }
  if(openNotes.length){
    sentences.push('Practical not-self watch: '+openNotes.slice(0,3).join('; ')+'.');
  }
  const line=lineInfo(ev.to.gate, ev.to.line);
  const g=gateInfo(ev.to.gate);
  const meaning=meaningForLine(line, g);
  if(meaning) sentences.push(meaning);

  if(person2){
    const seed=(ev.tMs%97)+(ev.to.gate*13)+(ev.to.line*3)+planet.length;
    const whoTouched=[...new Set(reasons.filter(r=>r.type==='touch'||r.type==='channel').map(r=>r.who).filter(w=>w&&w!=='together'))];
    let useKind=kind;
    if(whoTouched.length===1) useKind=(kind==='touch_end'||kind==='touch_start')?kind:'one_sided';
    if(whoTouched.length===2) useKind='same_gate';
    let aName=person1.name, bName=person2.name;
    if(whoTouched.length===1){
      if(whoTouched[0]===person2.name){ aName=person2.name; bName=person1.name; }
      else { aName=person1.name; bName=person2.name; }
    }
    const scenes=scenarioPair(seed, aName, bName, primaryTheme, useKind);
    const rwBit=scenarioRWPair(seed+5, aName, bName, primaryTheme, whoTouched.length===2?'shared':'open_bridge');
    sentences.push('How this may play out between them: '+scenes[0]);
    if(scenes[1]) sentences.push(scenes[1]);
    if(rwBit) sentences.push(rwBit);
  } else {
    const seed=(ev.tMs%97)+(ev.to.gate*13)+(ev.to.line*3)+planet.length;
    const gi=gateInfo(ev.to.gate);
    const c=gi&&gi.center;
    const open=c && openCentersOf(person1).includes(c);
    const info=open?centerNotSelfInfo(c):null;
    const theme=info?info.not_self_theme:primaryTheme;
    const ex1=scenarioRW(seed, person1.name, theme, open?'open_center':'channel');
    const ex2=scenarioRW(seed+4, person1.name, theme, open?'open_center':'channel');
    sentences.push('How this may play out in everyday life: '+ex1+' '+ex2);
  }
  return sentences.join(' ').replace(/\s+/g,' ').trim();
}


function isInteractionTimelineEvent(ev, person1, person2){
  if(!person2 || !ev) return false;
  const who=ev.who||{};
  if(who.couple || who.both || who.anyCouple) return true;
  if(who.person1 && who.person2) return true;
  if((ev.reasons||[]).some(r=>r.type==='couple' || r.who==='together')) return true;
  const gTo=ev.to && (ev.to.gate!=null?ev.to.gate:parseInt(String(ev.to.gl||ev.to).split('.')[0],10));
  const gFrom=ev.from && (ev.from.gate!=null?ev.from.gate:parseInt(String(ev.from.gl||ev.from).split('.')[0],10));
  for(const g of [gTo, gFrom]){
    if(g==null || isNaN(g)) continue;
    if(person1.gates.has(g) && person2.gates.has(g)) return true;
  }
  // Natal electromagnetic / compromise channel involving this gate + transit hit
  try{
    const dyn=coupleDynamics(person1, person2, ev.afterField || {planets:{}});
    const rel=[...(dyn.electromagnetic||[]), ...(dyn.compromise||[]), ...(dyn.transit_amplified_channels||[])];
    for(const c of rel){
      const ch=CHANNELS[c.id||c]; if(!ch) continue;
      const [a,b]=ch.gates;
      if(gTo===a||gTo===b||gFrom===a||gFrom===b) return true;
    }
  }catch(e){}
  return false;
}

function openCenterAmplifications(p1, p2, transit){
  // Transit-defined centers: one partner holds the center natal, the other is open → conditioning bridge
  const tGates=new Set(Object.values(transit.planets||{}).map(p=>p.gate));
  const tCenters=new Set();
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(tGates.has(a)&&tGates.has(b)) for(const c of (ch.centers||[])) tCenters.add(c);
  }
  for(const g of tGates){ const gi=gateInfo(g); if(gi&&gi.center) tCenters.add(gi.center); }
  const notes=[];
  for(const center of tCenters){
    const aHas=p1.defined_centers.has(center), bHas=p2.defined_centers.has(center);
    if(aHas && !bHas) notes.push({amplifier:p1.name, open:p2.name, center});
    if(bHas && !aHas) notes.push({amplifier:p2.name, open:p1.name, center});
  }
  return notes;
}

function clipInteractionMeaning(line, gInfo, maxSentences){
  // Keep interaction blurbs short: first sentence(s) of line meaning, no ellipsis
  const full=meaningForLine(line, gInfo)||'';
  if(!full) return '';
  const n=Math.max(1, maxSentences||1);
  const parts=full.match(/[^.!?]+[.!?]+/g) || [full];
  let out=parts.slice(0,n).join(' ').replace(/\s+/g,' ').trim();
  // Soft length guard without ellipsis
  if(out.length>320){
    const cut=out.slice(0,320);
    const m=cut.match(/^[\s\S]*[.!?](?=\s|$)/);
    out=(m && m[0].length>80 ? m[0] : cut.replace(/\s+\S*$/,'')).trim();
  }
  return out;
}

function scenarioSolo(seed, name, theme, kind){
  const t=(theme||'this weather').replace(/^the\s+/i,'').trim();
  const s=Math.abs(seed)||1;
  const packs={
    touch_start:[
      `At the start of a task, ${name} may feel ${t} switch on—pause one breath before agreeing to more.`,
      `A message lands and ${name} hears ${t} in it; naming the sky theme keeps it from becoming a character flaw.`
    ],
    touch_end:[
      `As ${t} eases for ${name}, the urge to finish every loose end can linger a beat longer than the weather—let one thing wait.`,
      `${name} may notice the room feels quieter once ${t} releases; use the window for a walk or a simple meal.`
    ],
    line_shift:[
      `Midday, ${name} can feel the flavor of ${t} shift without a new crisis—change the soundtrack, not the whole plan.`,
      `In a meeting, ${name}'s emphasis inside ${t} moves; one clarifying sentence beats a full redo.`
    ],
    shared_channel:[
      `${name} may feel a channel of ${t} “click on” as pressure to act—check body yes/no before speeding up.`,
      `When ${t} defines through ${name}'s chart with the sky, logistics snags can feel personal; one completed chore often clears the charge.`
    ],
    center:[
      `${name}'s ${t} center weather can color tone for an hour—food, outside air, or fewer texts usually helps more than a debate.`,
      `If ${name} suddenly cares harder about ${t}, treat it as temporary definition from the sky, not a new life rule.`
    ]
  };
  const list=packs[kind]||packs.line_shift;
  return list[s%list.length];
}

function narrativePersonShort(person, day, transit){
  const items=[];
  const show=codesOn();
  const covered=new Set();

  for(const item of (day.completed_channels||[]).slice(0,6)){
    const theme=plainChannelName(item.info);
    const label=show?(theme+' ('+item.channel+')'):('the channel of '+theme);
    const how=item.kind==='electromagnetic'?'completes with the sky on an open side':(item.kind==='transit_overlay_on_natal_channel'?'overlays a channel already in the chart':'completes with the sky');
    const seed=(item.channel||'').length*11+(transit.planets.Sun?.gate||1);
    const example=scenarioSolo(seed, person.name, theme, 'shared_channel');
    items.push(
      person.name+' '+how+' through '+label+'. That is direct conditioning—pressure can feel personal even when it is weather. '+
      example
    );
    for(const g of (item.transit_gates||[])) covered.add(g);
  }

  for(const t of (day.touches||[]).slice(0,6)){
    if(covered.has(t.transit.gate)) continue;
    const theme=t.gate?.name||gateThemeName(t.transit.gate);
    const hook=show?(t.planet+' at '+t.transit.gl+' ('+theme+')'):(t.planet+"'s theme around "+theme);
    const bit=clipInteractionMeaning(t.line, t.gate, 1);
    const example=scenarioSolo((t.transit.gate||1)*13+(t.transit.line||1), person.name, theme, 'line_shift');
    items.push(
      hook+' lands on a gate already in '+person.name+'\'s chart. '+(bit?bit+' ':'')+
      example
    );
    covered.add(t.transit.gate);
  }

  const centers=(day.centers_activated_with_natal||[]).slice(0,3);
  if(centers.length){
    const cList=centers.join(', ');
    const example=scenarioSolo(cList.length*7, person.name, cList.split(',')[0].trim()||'this center', 'center');
    items.push(
      'With '+person.name+'\'s design, this sky helps define '+cList+'. Open places can take the tone in as if it were permanent—it is not. '+
      example
    );
  }

  if(!items.length){
    items.push(
      'With the activations entered, '+person.name+' does not show a loud direct hook into this exact sky. Treat the day as lighter conditioning through open centers, and keep decisions on strategy and authority rather than transit urgency.'
    );
  }
  return items.map(s=>s.replace(/\s+/g,' ').trim());
}

function describePersonShortTimelineEvent(ev, person){
  const show=codesOn();
  const themeTo=gateThemeName(ev.to.gate);
  const gateTo=fmtGateTheme(ev.to.gate, show);
  const planet=ev.planet;
  const reasons=(ev.reasons||[]).filter(r=>r.who===person.name);
  const touch=reasons.find(r=>r.type==='touch');
  const ch=reasons.find(r=>r.type==='channel');
  const center=reasons.find(r=>r.type==='center');

  let lead;
  if(ev.gateChanged){
    lead=planet+' moves into '+gateTo+(show?(' ('+ev.from.gl+' → '+ev.to.gl+')'):'');
  } else {
    lead=show?(planet+' shifts '+ev.from.gl+' → '+ev.to.gl+' within '+gateTo):(planet+' shifts emphasis within '+gateTo);
  }

  let mechanic='This shift hooks '+person.name+'\'s chart.';
  let kind='line_shift';
  if(touch){
    const hadFrom=(touch.before?.touches||'').split(',').some(x=>x.startsWith(planet+':'+ev.from.gate));
    const hasTo=(touch.after?.touches||'').split(',').some(x=>x.startsWith(planet+':'+ev.to.gate));
    if(hasTo && !hadFrom){ mechanic='It begins activating '+gateTo+' already in '+person.name+'\'s chart.'; kind='touch_start'; }
    else if(hadFrom && !hasTo){ mechanic='It ends an activation on '+gateThemeName(ev.from.gate)+' in '+person.name+'\'s chart.'; kind='touch_end'; }
    else { mechanic='The emphasis on '+gateTo+' in '+person.name+'\'s chart changes.'; kind='line_shift'; }
  } else if(ch){
    if(ch.role==='harmonic'){
      mechanic='Sky pressure continues through '+gateTo+', the harmonic partner to a gate already in '+person.name+'\'s chart.';
      kind='shared_channel';
    } else {
      mechanic='A channel definition around '+person.name+' shifts with this weather.';
      kind='shared_channel';
    }
  } else if(center){
    mechanic='Center definition around '+person.name+' shifts with this weather.';
    kind='center';
  }

  const line=lineInfo(ev.to.gate, ev.to.line);
  const g=gateInfo(ev.to.gate);
  const bit=clipInteractionMeaning(line, g, 1);
  const seed=(ev.tMs%97)+(ev.to.gate*13)+(ev.to.line*3)+planet.length;
  const example=scenarioSolo(seed, person.name, themeTo, kind);

  const parts=[lead+'. '+mechanic];
  if(bit) parts.push(bit);
  parts.push(example);
  return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}

function narrativeInteractionsOnly(p1, p2, dyn, transit, day1, day2){
  const items=[];
  const show=codesOn();
  const map1=new Map((day1?.completed_channels||[]).map(i=>[i.channel,i]));
  const map2=new Map((day2?.completed_channels||[]).map(i=>[i.channel,i]));
  const sharedCh=[...map1.keys()].filter(id=>map2.has(id));

  // Shared channel completions (both charts hooked into same channel weather)
  for(const id of sharedCh.slice(0,4)){
    const a=map1.get(id), b=map2.get(id), ch=a.info;
    const theme=plainChannelName(ch);
    const label=show?(theme+' ('+ch.id+')'):('the channel of '+theme);
    const scenes=scenarioPair((transit.planets.Sun?.gate||1)*17+id.length, p1.name, p2.name, theme, 'shared_channel');
    items.push(
      p1.name+' and '+p2.name+' are both under '+label+' today—each chart completes a side with the sky, so the same motif can feel personal to both at once. '+
      scenes[0]
    );
  }

  // Mirroring same transit gates
  const bothHooks=dyn.shared_transit_hooks.filter(h=>h.in_a&&h.in_b);
  for(const h of bothHooks.slice(0,3)){
    const theme=h.gate.name||gateThemeName(h.gate.number||h.line.gate);
    const hook=show?(h.planet+' at '+h.gl+' ('+theme+')'):(h.planet+"'s theme around "+theme);
    const bit=clipInteractionMeaning(h.line, h.gate, 2);
    const scenes=scenarioPair((h.gate.number||7)*11+h.line.line, p1.name, p2.name, theme, 'same_gate');
    items.push(
      'They mirror each other on '+hook+'. '+(bit?bit+' ':'')+
      'When both charts plug into the same sky theme, volume rises fast—name the weather before debating the content. '+
      scenes[0]
    );
  }

  // Uneven hook that still shapes the couple (one hooked, other open)
  if(!bothHooks.length){
    const aOnly=dyn.shared_transit_hooks.filter(h=>h.in_a&&!h.in_b);
    const bOnly=dyn.shared_transit_hooks.filter(h=>h.in_b&&!h.in_a);
    if(aOnly.length || bOnly.length){
      const hooked=aOnly.length?aOnly[0]:bOnly[0];
      const hookedName=aOnly.length?p1.name:p2.name;
      const otherName=aOnly.length?p2.name:p1.name;
      const theme=hooked.gate.name||gateThemeName(hooked.line.gate);
      const hook=show?(hooked.planet+' at '+hooked.gl+' · '+theme):(hooked.planet+' around '+theme);
      const scenes=scenarioPair(19, hookedName, otherName, theme, 'one_sided');
      items.push(
        hookedName+' is more directly hooked by '+hook+', while '+otherName+' meets it mostly through openness and empathy. '+
        scenes[0]
      );
    }
  }

  // Electromagnetic / compromise amplified by transit
  if(dyn.transit_amplified_channels && dyn.transit_amplified_channels.length){
    const electroIds=new Set((dyn.electromagnetic||[]).map(c=>c.id||c));
    const compromiseIds=new Set((dyn.compromise||[]).map(c=>c.id||c));
    for(const c of dyn.transit_amplified_channels.slice(0,3)){
      const theme=plainChannelName(c);
      const label=show?(theme+' ('+c.id+')'):theme;
      let kind='shared_channel';
      let link='a familiar link between them';
      if(electroIds.has(c.id)){ kind='electro'; link='their electromagnetic chemistry'; }
      else if(compromiseIds.has(c.id)){ kind='shared_channel'; link='a compromise pattern they already know'; }
      const scenes=scenarioPair(23+(c.id||'').length, p1.name, p2.name, theme, kind);
      items.push(
        'Transit is turning up '+label+' on '+link+'. Friction here is usually volume on a known circuit, not a new verdict about the relationship. '+
        scenes[0]
      );
    }
  } else if(dyn.electromagnetic && dyn.electromagnetic.length){
    const c=dyn.electromagnetic[0];
    const theme=plainChannelName(c);
    const label=show?(theme+' ('+c.id+')'):theme;
    items.push(
      p1.name+' and '+p2.name+' still carry natal electromagnetic charge through '+label+', even if today’s sky is not spotlighting it as loudly. Keep inviting difference without forcing a single answer—chemistry does not require agreement.'
    );
  }

  // Open-center amplification across the pair
  const opens=openCenterAmplifications(p1, p2, transit);
  for(const n of opens.slice(0,2)){
    items.push(
      n.amplifier+' holds more fixed definition in the '+n.center+' while '+n.open+' is open there, and today’s sky is activating that center—so '+n.open+' can take in '+n.amplifier+'’s tone as if it were their own. '+
      'In everyday life this can look like '+n.open+' suddenly arguing '+n.amplifier+'’s point mid-conversation, then wondering whose feeling it was. A short body check (“Is this mine?”) before answering keeps the bridge useful instead of confusing.'
    );
  }

  // Channels completed for one that involve the other’s electro side (already partly in amplified)
  // Cross completions: channel completed for p1 that is electro with p2
  const electroIds=new Set((dyn.electromagnetic||[]).map(c=>c.id||c));
  for(const item of (day1?.completed_channels||[])){
    if(!electroIds.has(item.channel)) continue;
    if(sharedCh.includes(item.channel)) continue;
    const theme=plainChannelName(item.info);
    const label=show?(theme+' ('+item.channel+')'):('the channel of '+theme);
    const scenes=scenarioPair(31, p1.name, p2.name, theme, 'electro');
    items.push(
      'Sky pressure on '+label+' lights the bridge where '+p1.name+' and '+p2.name+' already magnetize each other. '+
      scenes[0]+' '+(scenes[1]||'')
    );
  }
  for(const item of (day2?.completed_channels||[])){
    if(!electroIds.has(item.channel)) continue;
    if(sharedCh.includes(item.channel)) continue;
    // avoid duplicate if already covered from day1
    if((day1?.completed_channels||[]).some(x=>x.channel===item.channel)) continue;
    const theme=plainChannelName(item.info);
    const label=show?(theme+' ('+item.channel+')'):('the channel of '+theme);
    const scenes=scenarioPair(37, p2.name, p1.name, theme, 'electro');
    items.push(
      'Sky pressure on '+label+' lights the bridge where '+p2.name+' and '+p1.name+' already magnetize each other. '+
      scenes[0]+' '+(scenes[1]||'')
    );
  }

  if(!items.length){
    items.push(
      'With the activations entered, today’s sky does not spotlight a strong mechanical bridge between '+p1.name+' and '+p2.name+'. Stay with independent authority and meet in the middle only where both feel a bodily yes—quiet couple weather is still useful weather.'
    );
  }
  return items.map(s=>s.replace(/\s+/g,' ').trim());
}

function describeInteractionTimelineEvent(ev, person1, person2){
  const show=codesOn();
  const themeTo=gateThemeName(ev.to.gate);
  const gateTo=fmtGateTheme(ev.to.gate, show);
  const planet=ev.planet;
  const reasons=ev.reasons||[];
  const who=ev.who||{};
  const namesTouched=[...new Set(reasons.filter(r=>r.who&&r.who!=='together').map(r=>r.who))];
  const couple=reasons.some(r=>r.type==='couple')||!!who.couple;
  const both=!!who.both || namesTouched.length>=2;

  let lead;
  if(ev.gateChanged){
    lead=planet+' moves into '+gateTo+(show?(' ('+ev.from.gl+' → '+ev.to.gl+')'):'');
  } else {
    lead=show?(planet+' shifts '+ev.from.gl+' → '+ev.to.gl+' within '+gateTo):(planet+' shifts emphasis within '+gateTo);
  }

  let mechanic;
  if(both){
    mechanic='Both '+person1.name+' and '+person2.name+' hook this theme—mirroring can escalate tone quickly.';
  } else if(couple && namesTouched.length===1){
    mechanic=namesTouched[0]+' is more directly hooked while '+(namesTouched[0]===person1.name?person2.name:person1.name)+' meets it through the relationship field; compassion beats fairness.';
  } else if(couple){
    mechanic='This shift rearranges their shared hooks or turns up a channel they already share.';
  } else {
    mechanic='This lands on a bridge between their charts.';
  }

  const line=lineInfo(ev.to.gate, ev.to.line);
  const g=gateInfo(ev.to.gate);
  const bit=clipInteractionMeaning(line, g, 1);

  let useKind='line_shift';
  if(both) useKind='same_gate';
  else if(namesTouched.length===1) useKind='one_sided';
  else if(reasons.some(r=>r.type==='couple'&&r.role==='electro')||reasons.some(r=>r.type==='channel'&&r.role==='harmonic'&&both)) useKind='electro';
  else if(couple) useKind='shared_channel';

  let aName=person1.name, bName=person2.name;
  if(namesTouched.length===1){
    aName=namesTouched[0];
    bName=(aName===person1.name)?person2.name:person1.name;
  }
  const seed=(ev.tMs%97)+(ev.to.gate*13)+(ev.to.line*3)+planet.length;
  const scenes=scenarioPair(seed, aName, bName, themeTo, useKind);
  const example=scenes[0]||'';

  // Target 2–4 sentences: lead+mechanic, optional meaning, one everyday example
  const parts=[lead+'. '+mechanic];
  if(bit) parts.push(bit);
  if(example) parts.push(example);
  return parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
}

function fmtGate(n, withWord){
  if(codesOn()) return (withWord!==false?'gate ':'')+n;
  return 'this gate';
}
function fmtGL(planet, gl, themeName){
  if(codesOn()) return planet+' at '+gl;
  return themeName ? (planet+"'s theme around "+themeName) : ('the '+planet+' theme');
}
function fmtChannel(ch){
  const theme=plainChannelName(ch);
  if(codesOn()) return 'the '+ch.id+' channel of '+theme;
  return 'the channel of '+theme;
}
function fmtNatalRef(person, natalBits, gates){
  if(codesOn()) return person+"'s "+(natalBits||('gate '+gates.join('/')));
  // natalBits like "Mercury at gate 38" -> "Mercury"
  if(natalBits){
    return person+"'s "+natalBits.replace(/\s*at\s*gate\s*\d+/gi,'').replace(/\bgate\s*\d+/gi,'').replace(/\s+/g,' ').trim();
  }
  return person+"'s chart";
}
function meaningForLine(line, gInfo){
  function scrub(body){
    body=(body||'').trim();
    if(line && line.title){
      const t=String(line.title).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      body=body.replace(new RegExp('^(The\\s+)?'+t+'[.:\\s\\-]*','i'),'').trim();
      body=body.replace(new RegExp('This line is called '+t+'[.:\\s]*','ig'),'');
      if(!codesOn()){
        body=body.replace(new RegExp('\\bthe line of '+t+'\\b','ig'),'this theme');
        // keep line title words in prose only when codes on; when off, soften repeated title echoes
        body=body.replace(new RegExp('\\b'+t+'\\b','g'),'this theme');
      }
    }
    if(!codesOn()){
      body=body.replace(/\b\d{1,2}\.\d\b/g,'');
      body=body.replace(/\bgates?\s*(\d{1,2})\b/gi, function(_, n){ return gateThemeName(+n); });
      body=body.replace(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/g, function(_, a, b){
        try{
          const ch=channelInfo(a+'-'+b) || channelInfo(b+'-'+a);
          if(ch && ch.name) return 'the channel of '+plainChannelName(ch);
        }catch(e){}
        return 'a channel';
      });
      body=body.replace(/\s+/g,' ').trim();
    }
    return body;
  }
  // Soft cap high enough to hold full embedded line text without ellipsis truncation.
  const CAP=20000;
  if(line && line.lcn_text){
    const body=clip(scrub(line.lcn_text), CAP);
    if(codesOn() && line.title) return 'The line of '+line.title+': '+body;
    return body;
  }
  if(line && line.tcri_text){
    const body=clip(scrub(line.tcri_text), CAP);
    if(codesOn() && line.title) return 'The line of '+line.title+': '+body;
    return body;
  }
  if(gInfo && gInfo.description){
    let d=gInfo.description;
    if(!codesOn()){
      d=d.replace(/\b\d{1,2}\.\d\b/g,'').replace(/\bgates?\s*(\d{1,2})\b/gi, function(_, n){ return gateThemeName(+n); }).replace(/\s+/g,' ').trim();
    }
    return clip(d, CAP);
  }
  return '';
}


function narrativePerson(person, day, transit){
  const paras=[];
  const items=day.completed_channels.slice();
  const covered=new Set();
  for(const item of items){
    for(const g of item.transit_gates) covered.add(g);
  }
  const extras=day.touches.filter(t=>!covered.has(t.transit.gate));
  const show=codesOn();

  if(!items.length && !extras.length){
    paras.push(`${person.name} does not show a direct hook into this transit field from the activations entered for their chart. The day’s weather still moves through open centers as general conditioning, but without a specific natal “socket” lighting up in the data provided.`);
    return paras;
  }

  const chNames=items.map(i=>plainChannelName(i.info));
  if(chNames.length){
    paras.push(`For ${person.name}, the sky is plugging into open places in the design and briefly completing themes of ${chNames.join(', ')}. That does not mean destiny is forced; it means the body and mind are more likely to feel those motifs as “on,” the way weather makes certain rooms of a house colder or warmer.`);
  }

  for(const item of items){
    const ch=item.info;
    const theme=plainChannelName(ch);
    const tGate=item.transit_gates[0];
    const tPlanet=item.transit_planets[0]||'a transit';
    const pval=transit.planets[tPlanet]||Object.values(transit.planets).find(p=>p.gate===tGate);
    const line=pval?lineInfo(tGate, pval.line):lineInfo(tGate,1);
    const gInfo=gateInfo(tGate);
    const natalBits=item.natal_gates.map(g=>{
      const np=Object.entries(person.planets).filter(([,v])=>v.gate===g).map(([k])=>k);
      return (np.length?np.join('/')+' at ':'')+'gate '+g;
    }).join(' and ');
    const natalPlain=fmtNatalRef(person.name, natalBits, item.natal_gates);
    const meaning=meaningForLine(line, gInfo);
    const design=ch.design?` (${ch.design.replace(/^A design /i,'a design ')})`:'';
    const subj=fmtGL(tPlanet, line.gl, theme||gInfo.name||'');
    const chRef=fmtChannel(ch)+design;
    const touchLabel=show?(natalBits||('gate '+item.natal_gates.join('/'))):'chart';
    paras.push(`${subj} is completing ${chRef} with ${natalPlain}. ${meaning} ${everydayHook(theme)} Naming the mechanic—“this is ${theme} weather touching my ${touchLabel}”—often softens blame and opens a cleaner next step.`);
  }

  for(const touch of extras.slice(0,8)){
    const line=touch.line, g=touch.gate;
    const meaning=meaningForLine(line, g);
    const subj=fmtGL(touch.planet, line.gl, g.name||'');
    const natalP=(touch.natal_planets||[]).join('/')||'activation';
    const where=show?(`${person.name}'s ${natalP} in gate ${g.number} (${g.name})`):(`${person.name}'s ${natalP} in ${g.name}`);
    paras.push(`${subj} also brushes ${where}. ${meaning} It may show up less as a full channel “click” and more as a mood or mental filter coloring ordinary errands and messages.`);
  }
  return paras;
}

function narrativeCouple(p1,p2,dyn,transit,day1,day2){
  const paras=[];
  const show=codesOn();
  const map1=new Map((day1?.completed_channels||[]).map(i=>[i.channel,i]));
  const map2=new Map((day2?.completed_channels||[]).map(i=>[i.channel,i]));
  const sharedCh=[...map1.keys()].filter(id=>map2.has(id));
  if(sharedCh.length){
    const bits=sharedCh.map(id=>{
      const a=map1.get(id), b=map2.get(id), ch=a.info;
      const theme=plainChannelName(ch);
      if(show){
        return theme+' ('+ch.id+': '+p1.name+' via gate '+a.natal_gates.join('/')+' and '+p2.name+' via gate '+b.natal_gates.join('/')+')';
      }
      return 'the channel of '+theme+' ('+p1.name+' and '+p2.name+' each holding a side)';
    }).join('; ');
    const theme0=plainChannelName(map1.get(sharedCh[0]).info);
    paras.push('Together, '+p1.name+' and '+p2.name+' are both being conditioned through the same channel weather—'+bits+'. That is a classic setup for a compressed exchange: each person feels the pressure as personal, yet the sky is asking both nervous systems to process one motif.');
    const scenes=scenarioPair((transit.planets.Sun?.gate||1)*17+(sharedCh[0].length), p1.name, p2.name, theme0, 'shared_channel');
    paras.push('How this may play out between them: '+scenes[0]+' '+scenes[1]);
  }
  const both=dyn.shared_transit_hooks.filter(h=>h.in_a&&h.in_b);
  if(both.length){
    const h=both[0];
    const meaning=meaningForLine(h.line, h.gate);
    const theme=h.gate.name||gateThemeName(h.gate.number||h.line.gate);
    const hook=show?(h.planet+' '+h.gl+' ('+theme+')'):(h.planet+"'s theme around "+theme);
    paras.push('They also share a direct hook at '+hook+'. '+(meaning?meaning+' ':'')+'When two charts plug into the same transit theme, tone can escalate quickly—pause and reflect the weather before solving the content.');
    const scenes=scenarioPair((h.gate.number||7)*11+h.line.line, p1.name, p2.name, theme, 'same_gate');
    paras.push('How this may play out between them: '+scenes[0]+' '+scenes[1]);
  } else if(!sharedCh.length){
    const either=dyn.shared_transit_hooks;
    if(either.length){
      const aOnly=either.filter(h=>h.in_a&&!h.in_b);
      const bOnly=either.filter(h=>h.in_b&&!h.in_a);
      const fmtH=h=>{
        const theme=h.gate.name||gateThemeName(h.line.gate);
        return show?(h.planet+' '+h.gl+' · '+theme):(h.planet+' around '+theme);
      };
      paras.push('The couple field is uneven today: '+(aOnly.length?p1.name+' is more personally hooked ('+aOnly.map(fmtH).join(', ')+')':p1.name+' is less directly hooked')+', while '+(bOnly.length?p2.name+' feels '+bOnly.map(fmtH).join(', '):p2.name+' has fewer direct hooks')+'. Compassion works better than symmetry—one person may need more recovery time than the other.');
      const hooked=aOnly.length?aOnly[0]:bOnly[0];
      const theme=hooked?(hooked.gate.name||'this weather'):'this weather';
      const hookedName=aOnly.length?p1.name:p2.name;
      const otherName=aOnly.length?p2.name:p1.name;
      const scenes=scenarioPair(19, hookedName, otherName, theme, 'one_sided');
      paras.push('How this may play out between them: '+scenes[0]+' '+scenes[1]);
    }
  }
  if(dyn.transit_amplified_channels.length){
    const names=dyn.transit_amplified_channels.map(c=>{
      const theme=plainChannelName(c);
      return show?(c.id+' '+theme):theme;
    }).join(', ');
    paras.push('Relationship channels already living between them that the transit is amplifying include '+names+'. Treat friction as temporary volume on a familiar circuit. Agree who holds logistics, who gets quiet, and what can wait.');
    const theme=plainChannelName(dyn.transit_amplified_channels[0]);
    const electroIds=new Set((dyn.electromagnetic||[]).map(c=>c.id||c));
    const kind=dyn.transit_amplified_channels.some(c=>electroIds.has(c.id))?'electro':'shared_channel';
    const scenes=scenarioPair(23, p1.name, p2.name, theme, kind);
    paras.push('How this may play out between them: '+scenes[0]+' '+scenes[1]);
  } else if(dyn.electromagnetic.length && !sharedCh.length){
    paras.push('Natal electromagnetic links between '+p1.name+' and '+p2.name+' remain part of their chemistry; today’s sky may not be spotlighting them as strongly. Keep inviting difference without forcing agreement.');
  } else if(!sharedCh.length && !dyn.shared_transit_hooks.length){
    paras.push('With the activations entered, the couple’s shared mechanical story for this exact sky is lighter. Focus on independent strategy and authority, and meet in the middle only where both feel a bodily yes.');
  }
  return paras;
}


function narrativeOverview(transit, days){
  const show=codesOn();
  const tGates=new Set(Object.values(transit.planets).map(p=>p.gate));
  const tCh=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(tGates.has(a)&&tGates.has(b)) tCh.push(show?`${plainChannelName(ch)} (${chId})`:plainChannelName(ch));
  }
  const centers=new Set();
  for(const p of Object.values(transit.planets)){
    const g=gateInfo(p.gate); if(g && g.center) centers.add(g.center);
  }
  const sun=transit.planets.Sun, earth=transit.planets.Earth;
  const sunBit=show?`Sun sits at ${sun.gl} and Earth at ${earth.gl}`:`The Sun and Earth set a basic polarity`;
  const chBit=tCh.length?`carries ${tCh.slice(0,4).join(', ')}`:`is relatively quiet in closed channels`;
  const cBit=[...centers].slice(0,5).join(', ');
  return `On ${transit.display_when||formatDisplayDateTime(transit.datetime_utc, transit.tz||'local')}, the collective sky ${chBit}${cBit?`, with ${cBit} feeling more “defined” in the transit field`:''}. ${sunBit}, so the day’s basic polarity is already a conversation between those two themes. What follows is not a prediction of events; it is a reading of conditioning weather—how this sky can amplify themes already latent in each design.`;
}

function technicalBlock(transit, peopleDays, couple, opts){
  opts = opts || {};
  const lines=[];
  lines.push('When: '+(transit.display_when||formatDisplayDateTime(transit.datetime_utc, transit.tz||'local')));
  const showField = (opts.includeTransitField !== undefined)
    ? !!opts.includeTransitField
    : wantTransitFieldSections({});
  if(showField){
    const planetKeys=omitLightsOn()?PLANET_ORDER.filter(p=>!isLightPlanet(p)):PLANET_ORDER;
    lines.push('Transit field (gate.line): '+planetKeys.filter(p=>transit.planets[p]).map(p=>p+': '+transit.planets[p].gl).join(' | ')+(omitLightsOn()?' | (Sun/Earth/Moon omitted)':''));
  }
  lines.push('Ephemeris: '+transit.source);
  lines.push('Node: True Lunar Node (r×v from Moon ecliptic positions).');
  const tGates=new Set(Object.values(transit.planets).map(p=>p.gate));
  const tOnly=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(tGates.has(a)&&tGates.has(b)) tOnly.push(chId+' '+(ch.name||''));
  }
  lines.push('Transit-only channels: '+(tOnly.join('; ')||'(none)'));
  for(const day of peopleDays){
    lines.push('');
    lines.push(day.person+':');
    for(const item of day.completed_channels){
      lines.push(`  ${item.info.id} ${item.info.name} (${item.kind}) natal[${item.natal_gates}] transit ${item.transit_planets.join(',')}`);
    }
    for(const t of day.touches){
      lines.push(`  touch ${t.planet} ${t.transit.gl} (${t.line.title})`);
    }
  }
  if(couple){
    lines.push('');
    lines.push('Couple shared hooks: '+couple.shared_transit_hooks.map(h=>h.planet+' '+h.gl).join(', '));
    lines.push('Amplified: '+couple.transit_amplified_channels.map(c=>c.id).join(', '));
  }
  return lines.join('\n');
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function directRwBit(theme, center){
  if(!realWorldOn()) return '';
  const info=center?centerNotSelfInfo(center):null;
  if(info && info.everyday_pull) return ' — '+info.everyday_pull;
  if(info && info.not_self_theme) return ' — '+info.not_self_theme;
  return theme ? (' — practical pressure around '+theme) : '';
}

function directTouchItem(person, t, show){
  const theme=t.gate?.name||gateThemeName(t.transit.gate);
  const hook=show?(t.planet+' '+t.transit.gl+' ('+theme+')'):(t.planet+' on '+theme);
  const natal=(t.natal_planets||[]).join('/')||'natal gate';
  return person.name+': '+hook+' activates chart '+natal+directRwBit(theme, t.gate&&t.gate.center);
}

function directChannelItem(person, item, show){
  const theme=plainChannelName(item.info);
  const label=codesFrag(show, 'channel of '+theme, item.channel);
  const planets=(item.transit_planets||[]).join(', ')||'transit';
  const kind=(item.kind||'completion').replace(/_/g,' ');
  const centers=(item.info&&item.info.centers)||[];
  return person.name+': '+planets+' completes '+label+' ('+kind+')'+directRwBit(theme, centers[0]);
}

function directCenterItem(person, center, show){
  const label=codesFrag(show, center+' center', center);
  return person.name+': '+label+' defined/activated with transit'+directRwBit(center, center);
}

function directCoupleHookItem(p1, p2, h, show){
  const theme=h.gate?.name||gateThemeName(h.line?.gate||h.gate?.number);
  const hook=show?(h.planet+' '+h.gl+' ('+theme+')'):(h.planet+' on '+theme);
  let who;
  if(h.in_a&&h.in_b) who=p1.name+' & '+p2.name+' (shared)';
  else if(h.in_a) who=p1.name+' (hits '+p1.name+'; bridge to '+p2.name+')';
  else who=p2.name+' (hits '+p2.name+'; bridge to '+p1.name+')';
  const c=h.gate&&h.gate.center;
  return 'Together: '+hook+' — '+who+directRwBit(theme, c);
}

function directAmplifiedItem(p1, p2, ch, show){
  const theme=plainChannelName(ch);
  const label=codesFrag(show, 'channel of '+theme, ch.id);
  const centers=(ch.centers)||[];
  return 'Together: transit amplifies '+label+' between '+p1.name+' & '+p2.name+directRwBit(theme, centers[0]);
}

function collectDirectEffectItems(person1, person2, transit){
  const show=codesOn();
  const items=[];
  const tUse=transitWithoutLights(transit);
  const d1=analyzeDay(person1, tUse);
  const seenCenter=new Set();
  for(const t of (d1.touches||[])) items.push(directTouchItem(person1, t, show));
  for(const item of (d1.completed_channels||[])) items.push(directChannelItem(person1, item, show));
  for(const c of (d1.centers_activated_with_natal||[])){
    // only centers that appear via completed channels or transit definition — skip dup clutter if already implied? keep factual list
    if(seenCenter.has(c)) continue;
    seenCenter.add(c);
    items.push(directCenterItem(person1, c, show));
  }
  let d2=null, couple=null;
  if(person2){
    d2=analyzeDay(person2, tUse);
    const seen2=new Set();
    for(const t of (d2.touches||[])) items.push(directTouchItem(person2, t, show));
    for(const item of (d2.completed_channels||[])) items.push(directChannelItem(person2, item, show));
    for(const c of (d2.centers_activated_with_natal||[])){
      if(seen2.has(c)) continue;
      seen2.add(c);
      items.push(directCenterItem(person2, c, show));
    }
    couple=coupleDynamics(person1, person2, tUse);
    for(const h of (couple.shared_transit_hooks||[])){
      if(h.in_a||h.in_b) items.push(directCoupleHookItem(person1, person2, h, show));
    }
    for(const ch of (couple.transit_amplified_channels||[])){
      items.push(directAmplifiedItem(person1, person2, ch, show));
    }
  }
  return {items:items.map(s=>String(s).replace(/\s+/g,' ').trim()), d1, d2, couple, tUse};
}


function reportStyleMode(){ return 'full'; }

function makeProseTracker(){
  return {
    usedExamples:new Set(),
    usedThemes:new Set(),
    usedRel:new Set(),
    usedFrames:new Set(),
    usedNgrams:new Set(),
    usedMeanings:new Set(),
    seq:0,
    relCount:0
  };
}

const ORDINAL_LINE = {1:'first',2:'second',3:'third',4:'fourth',5:'fifth',6:'sixth'};

const BANNED_FRAGMENTS = [
  'throwaway comment','urgent decision','slack reply','kitchen louder','sleep on it',
  'still worth a slower yes','different room of life','ambient weather than a direct hook',
  'is the strongest practical shift','is the next clear shift','feel briefly',
  'hear the other as the source','speaks for a hexagram','this first line is called',
  'activates a gate already in the design','completes a channel with the chart',
  'can press for a cleaner yes or no before moving on','may color tone and small choices',
  'may land through open','rather than a natal hit','can feel temporarily online',
  'example:'
];

const ILLUSTRATION_POOL = [
  'a shared calendar invite can feel like a loyalty test',
  'sorting laundry can carry more weight than the pile deserves',
  'a grocery-list tweak mid-aisle can spark a longer debate than the item needs',
  'reviewing a draft email twice before sending can keep the tone clean',
  'choosing who drives can become a quiet power check',
  'a neighbor’s small request can land heavier than it would on a quieter day',
  'picking a restaurant can feel like choosing a side',
  'a missed call can get replayed as meaning more than it does',
  'folding a sweater while talking can keep hands busy and tone softer',
  'agreeing on a bedtime or a pet walk can expose mismatched pace',
  'a budget line on a spreadsheet can look like a verdict instead of a number',
  'waiting for a package can stretch patience thinner than the delay warrants',
  'offering to cook can be heard as control unless the ask is clear',
  'a group chat going quiet can feel personal when it is only timing',
  'rearranging a shelf can stand in for a larger need to reset the room',
  'saying no to a weekend plan may need one clean sentence, not a defense',
  'a workout playlist change can mirror a bigger mood swing',
  'proofreading a form can catch the urge to rush the signature',
  'splitting a bill evenly can feel unfair when the energy spent was not',
  'walking the long way home can give the nervous system a buffer',
  'watering a plant can become the day’s small caretaking win',
  'rewatching a familiar show can be recovery rather than avoidance—if named',
  'drafting a to-do list in three bullets can beat a sprawling brain dump',
  'letting a podcast finish before speaking can keep the next ask kinder',
  'moving a meeting by twenty minutes can relieve more pressure than expected',
  'choosing seats at a table can quietly assign who leads the talk',
  'a password-reset loop can amplify irritation that belongs elsewhere',
  'wiping the counter once and stopping can be enough for now',
  'texting “on my way” without extras can prevent a spiral',
  'leaving shoes by the door instead of mid-room can cut recurring friction',
  'asking for five quiet minutes before logistics can change the evening',
  'a returns line at the store can test patience more than the purchase did',
  'naming one chore each can beat debating fairness in the abstract',
  'closing extra browser tabs can cue the mind that the work block ended',
  'a short stretch between calls can keep the next voice softer',
  'parking farther away on purpose can buy a useful decompression walk',
  'writing the worry on paper once can shrink its hold on the afternoon',
  'skipping a second coffee can steady a jittery decision window',
  'letting the other person pick the playlist first can lower the stakes',
  'a clear “I need until 4 PM” can protect focus without a speech',
  'reheating leftovers together can become a tiny negotiation about effort',
  'choosing which bill to pay first can expose competing priorities',
  'a rain delay can force a softer plan without making it a character issue',
  'labeling leftovers in the fridge can stand in for wanting clearer agreements',
  'a slow elevator ride can make an unfinished conversation feel louder',
  'picking a movie without scrolling for twenty minutes can be the win',
  'charging phones in another room can protect the last hour of the day',
  'asking “is this urgent or just loud?” can shrink a false emergency'
];

function nextIllustration(tracker){
  for(let i=0;i<ILLUSTRATION_POOL.length;i++){
    const idx=(tracker.seq+i*11)%ILLUSTRATION_POOL.length;
    const ex=ILLUSTRATION_POOL[idx];
    if(!tracker.usedExamples.has(ex)){
      tracker.usedExamples.add(ex);
      tracker.seq++;
      return ex;
    }
  }
  return '';
}

function claimTheme(tracker, theme){
  const key=String(theme||'').toLowerCase().replace(/^the\s+/,'').trim();
  if(!key || tracker.usedThemes.has(key)) return false;
  tracker.usedThemes.add(key);
  return true;
}

function normalizePhrase(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9\s']/g,' ').replace(/\s+/g,' ').trim();
}

function ngramsOf(text, n){
  const words=normalizePhrase(text).split(' ').filter(Boolean);
  const out=[];
  for(let i=0;i+n<=words.length;i++) out.push(words.slice(i,i+n).join(' '));
  return out;
}

// Words allowed to repeat even inside 5-grams (names/planets/themes handled separately by stripping)
const NGRAM_STOP = new Set(['dennis','eike','the','a','an','and','or','to','of','in','on','for','with','may','can','as','at','by','is','it','this','that','than','from','into','their','them','they','his','her','both','while','when','who','what','around','through','between']);

function registerAndFilterSentence(tracker, sentence){
  let s=String(sentence||'').replace(/\s+/g,' ').trim();
  if(!s) return '';
  const low=s.toLowerCase();
  for(const b of BANNED_FRAGMENTS){
    if(low.includes(b)) return '';
  }
  const content=normalizePhrase(s).split(' ').filter(w=>w && !NGRAM_STOP.has(w) && w.length>2);
  // Block repeated 4+ content-word n-grams (names/planets already stripped via NGRAM_STOP)
  for(let n=4;n<=5;n++){
    for(let i=0;i+n<=content.length;i++){
      const key=content.slice(i,i+n).join(' ');
      if(tracker.usedNgrams.has(key)) return '';
    }
  }
  for(let n=4;n<=5;n++){
    for(let i=0;i+n<=content.length;i++){
      tracker.usedNgrams.add(content.slice(i,i+n).join(' '));
    }
  }
  const frame=content.slice(0,6).join(' ');
  if(frame && tracker.usedFrames.has(frame)) return '';
  if(frame) tracker.usedFrames.add(frame);
  return s;
}

function pickUnused(tracker, keyPrefix, options){
  for(const opt of options){
    const k=keyPrefix+':'+normalizePhrase(opt).slice(0,80);
    if(!tracker.usedFrames.has(k)){
      tracker.usedFrames.add(k);
      return opt;
    }
  }
  return options[0]||'';
}

function prettyTheme(theme){
  const t=String(theme||'').replace(/^the\s+/i,'').trim();
  if(!t) return 'this theme';
  let out=t;
  if(t===t.toUpperCase() && /[A-Z]/.test(t)){
    out=t.toLowerCase().replace(/\b\w/g, c=>c.toUpperCase());
  }
  out=out.replace(/\b(Of|And|The|Or|To|In|On|For|A|An)\b/g, function(w){
    const small={Of:'of',And:'and',The:'the',Or:'or',To:'to',In:'in',On:'on',For:'for',A:'a',An:'an'};
    return small[w]||w;
  });
  return out.replace(/^[a-z]/, c=>c.toUpperCase());
}

function lineOrdinal(n){ return ORDINAL_LINE[+n]||((''+n)+'th'); }

function cleanLineTitle(line){
  let title=String((line&& (line.title||line.lcn_title))||'').trim().replace(/^The\s+/i,'').trim();
  if(!title || title.length>48) return '';
  if(/\d+\.\d/.test(title)) return '';
  if(/speaks for a hexagram|this (first|second|third) line is called|we have lines that/i.test(title)) return '';
  if(/^(and|or|but)\b/i.test(title)) return '';
  return title;
}

function themeKeynoteSentence(theme, line, gInfo, channelTheme, tracker, channelDesign){
  const gateTheme=prettyTheme((gInfo&&gInfo.name)||theme);
  const chTheme=channelTheme?prettyTheme(channelTheme):'';
  const title=cleanLineTitle(line);
  const wantLine=!!(line && (codesOn() || line.lineMatters || line.line));
  const designCue=String(channelDesign||'').replace(/^A\s+design\s+(of\s+|where\s+)?/i,'').replace(/\.$/,'').trim();
  const hexCue=String((gInfo&& (gInfo.hexagram_keynote||gInfo.lcn_title||''))||'').replace(/^The\s+/i,'').trim();
  const options=[];
  if(wantLine && line && title){
    const ord=lineOrdinal(line.line);
    options.push('In '+gateTheme+', the '+ord+'-line “'+title+'” quality asks for a slower read before reacting');
    options.push('The '+ord+'-line shade of '+gateTheme+' (“'+title+'”) favors precision over push');
    options.push(gateTheme+' in its '+ord+' line leans toward “'+title+'”—useful when the room speeds up');
  } else if(wantLine && line){
    const ord=lineOrdinal(line.line);
    options.push('In '+gateTheme+', the '+ord+'-line quality asks for restraint rather than reaction');
  }
  if(chTheme && designCue && designCue.length<90){
    options.push(chTheme+' (design: '+designCue+') asks to keep the motif named rather than personal');
    options.push('Under '+chTheme+', the chart’s design of '+designCue+' can briefly feel online');
  } else if(chTheme){
    options.push(chTheme+' is about how energy moves between commitment and expression—keep the motif named');
    options.push('Under '+chTheme+', the practical ask is cleaner contact without borrowed urgency');
  }
  if(hexCue && hexCue.length<60 && hexCue.toLowerCase()!==gateTheme.toLowerCase()){
    options.push(gateTheme+' carries a “'+hexCue+'” keynote—treat the charge as weather, not verdict');
  }
  if(!options.length){
    options.push(gateTheme+' highlights a temporary focus—name the pressure before treating it as character');
    options.push(gateTheme+' can make ordinary choices feel more charged than they are');
  }
  for(const o of options){
    const sent=o.endsWith('.')?o:(o+'.');
    const k=normalizePhrase(sent);
    if(!tracker.usedMeanings.has(k)){
      tracker.usedMeanings.add(k);
      return sent;
    }
  }
  return '';
}

function planetThemeLead(planet, theme, gl){
  if(codesOn() && gl) return planet+' at '+gl+' ('+theme+')';
  return planet+' around '+theme;
}

function parseStampSortKey(stamp){
  const m=String(stamp||'').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if(!m) return 0;
  let h=+m[1]%12; if(/PM/i.test(m[3])) h+=12;
  return h*60+(+m[2]);
}
function formatTimeShort(stamp){
  const m=String(stamp||'').match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
  return m?m[1].replace(/\s+/g,' '):'';
}

function channelWhoseLabel(shift, person1, person2){
  const theme=prettyTheme(shift.theme);
  const who=[];
  if(shift.who&&shift.who.p1) who.push(person1.name);
  if(person2 && shift.who&&shift.who.p2) who.push(person2.name);
  if(!who.length) who.push(person1.name);
  if(who.length===2) return 'the channel of '+theme+' with both '+who[0]+'’s and '+who[1]+'’s charts';
  return 'the channel of '+theme+' with '+who[0]+'’s chart';
}

function leadSentence(shift, person1, person2, tracker, timePrefix){
  const theme=prettyTheme(shift.theme);
  const planet=shift.planet;
  const t=timePrefix||'';
  let options;
  if(shift.kind==='channel'){
    const ch=channelWhoseLabel(shift, person1, person2);
    const glBit=(codesOn() && shift.gl)?(' at '+shift.gl):'';
    options=[
      t+planet+glBit+' around '+theme+' completes '+ch+'.',
      t+planet+' closes '+ch+'.',
      t+planet+' plugs into '+ch+'.',
      t+'With '+planet+' on '+theme+', '+ch+' comes online.'
    ];
  } else if(shift.kind==='center'){
    options=[
      t+planet+' around '+theme+' helps define '+theme+' for a stretch of the day.',
      t+planet+' temporarily lights '+theme+'.',
      t+planet+' fills definition around '+theme+'.',
      t+planet+' can condition '+theme+' without needing a full channel story.'
    ];
  } else {
    options=[
      t+planet+' around '+theme+' touches a gate already in the design.',
      t+planet+' brushes a natal gate at '+theme+'.',
      t+planet+' revisits '+theme+' as a known gate theme.',
      t+planet+' lights a familiar gate socket around '+theme+'.'
    ];
  }
  for(const opt of options){
    const filtered=registerAndFilterSentence(tracker, opt);
    if(filtered) return filtered;
  }
  // Last-resort lead: must still name channel + whose chart when kind is channel
  if(shift.kind==='channel'){
    const ch=channelWhoseLabel(shift, person1, person2);
    const fb=(t+planet+' activates '+ch+'.');
    // Force-register lightly
    const content=normalizePhrase(fb).split(' ').filter(w=>w && !NGRAM_STOP.has(w) && w.length>2);
    for(let n=4;n<=5;n++) for(let i=0;i+n<=content.length;i++) tracker.usedNgrams.add(content.slice(i,i+n).join(' '));
    return fb;
  }
  return '';
}

function personSentence(person, shift, tracker, isDirect, person1, person2){
  const theme=prettyTheme(shift.theme);
  const gInfo=shift.gInfo;
  let meaning=themeKeynoteSentence(theme, shift.line, gInfo, shift.kind==='channel'?shift.theme:'', tracker, shift.channelDesign||'');
  if(meaning) meaning=meaning.replace(/\.$/,'');
  function lowerFirst(s){
    if(!s) return s;
    return s.charAt(0).toLowerCase()+s.slice(1);
  }
  const ill=nextIllustration(tracker);
  let options=[];
  if(isDirect){
    if(meaning){
      const mid=lowerFirst(meaning);
      options=[
        'For '+person.name+', '+mid+(ill?('—as when '+ill):'')+'.',
        person.name+' may notice '+mid+(ill?(' (for instance, '+ill+')'):'')+'.',
        'In '+person.name+'’s day, '+mid+(ill?(', like when '+ill):'')+'.'
      ];
    }
    if(shift.kind==='channel' && shift.channelDesign){
      const cue=String(shift.channelDesign).replace(/^A\s+design\s+(of\s+|where\s+)?/i,'').replace(/\.$/,'').trim();
      if(cue && cue.length<90){
        options.push('For '+person.name+', '+theme+' (design: '+cue+') can show up in ordinary logistics'+(ill?('—'+ill):'')+'.');
      }
    }
    options.push('For '+person.name+', '+shift.planet+' on '+theme+' is a direct hook—keep the next yes small enough to reverse.');
    options.push(person.name+' gets '+theme+' from '+shift.planet+' as a natal-side hit, not just background weather.');
    options.push(shift.planet+' gives '+person.name+' a brief '+theme+' emphasis worth naming out loud.');
  } else if(shift.asymmetric && shift.asymmetric.open===person.name){
    const c=shift.asymmetric.center;
    options=[
      'For '+person.name+', open '+c+' can take in '+theme+' from the field'+(ill?('—'+ill):'')+'.',
      person.name+' may absorb '+theme+' via open '+c+' more than via a natal hit'+(ill?(' ('+ill+')'):'')+'.',
      theme+' can arrive for '+person.name+' through open '+c+(ill?(', as when '+ill):'')+'.',
      'For '+person.name+', open '+c+' is the intake path for '+theme+' while '+shift.planet+' is active.'
    ];
  } else {
    return '';
  }
  for(const o of options){
    const filtered=registerAndFilterSentence(tracker, o);
    if(filtered) return filtered;
  }
  return '';
}

function relationshipBit(person1, person2, shift, tracker){
  if(!person2) return '';
  if((tracker.relCount||0)>=1) return '';
  let raw='';
  if(shift.sharedChannel || (shift.who&&shift.who.p1&&shift.who.p2&&shift.kind==='channel')){
    const theme=prettyTheme(shift.theme);
    const opts=[
      'Between them, both meet '+theme+' as a completed channel, so pace can sync without turning into blame.',
      'Between them, sharing '+theme+' can speed agreement—or friction—because each holds a side.',
      'Between them, the mutual '+theme+' completion is mechanical weather, not a verdict on character.',
      'Between them, '+theme+' coming online for both can shrink the need to argue who is “right.”'
    ];
    raw=pickUnused(tracker, 'relshared', opts);
  } else if(shift.asymmetric){
    const a=shift.asymmetric;
    const opts=[
      'Between them, '+a.hooked+' gets the mechanical hit; '+a.open+' mostly feels the fill through open '+a.center+'.',
      'Between them, '+a.open+'’s open '+a.center+' can borrow '+a.hooked+'’s temporary definition of this theme.',
      'Between them, the split is structural: '+a.hooked+' is hooked, '+a.open+' is permeable at '+a.center+'.',
      'Between them, name who is defined and who is open at '+a.center+' before treating tone as personality.',
      'Between them, '+a.hooked+' may speak from the activation while '+a.open+' echoes it via open '+a.center+'.'
    ];
    raw=pickUnused(tracker, 'relasym', opts);
  }
  if(!raw) return '';
  const filtered=registerAndFilterSentence(tracker, raw);
  if(!filtered) return '';
  tracker.relCount=(tracker.relCount||0)+1;
  return filtered;
}

function describeShiftOnce(person1, person2, shift, tracker, timePrefix){
  if(!claimTheme(tracker, shift.themeKey||shift.theme)) return '';
  const parts=[];
  const lead=leadSentence(shift, person1, person2, tracker, timePrefix);
  if(lead) parts.push(lead);
  const p1Direct=!!(shift.who&&shift.who.p1);
  const p2Direct=!!(person2 && shift.who&&shift.who.p2);
  // Center-only shifts: lead is enough unless there is a clear open/hooked asymmetry
  if(shift.kind==='center' && !shift.asymmetric){
    const rel=relationshipBit(person1, person2, shift, tracker);
    if(rel) parts.push(rel);
    return parts.join(' ').replace(/\s+/g,' ').trim();
  }
  if(p1Direct || (person2 && shift.asymmetric && shift.asymmetric.open===person1.name)){
    const s=personSentence(person1, shift, tracker, p1Direct && shift.kind!=='center', person1, person2);
    if(s) parts.push(s);
  }
  if(person2 && (p2Direct || (shift.asymmetric && shift.asymmetric.open===person2.name))){
    const s=personSentence(person2, shift, tracker, p2Direct && shift.kind!=='center', person1, person2);
    if(s) parts.push(s);
  }
  const rel=relationshipBit(person1, person2, shift, tracker);
  if(rel) parts.push(rel);
  return parts.join(' ').replace(/\s+/g,' ').trim();
}

function packParagraphs(sentences){
  const usable=sentences.filter(Boolean);
  if(!usable.length) return [];
  // Prefer 2–4 paragraphs. If only one shift sentence, split on sentence boundaries when long.
  if(usable.length===1){
    const bits=usable[0].match(/[^.!?]+[.!?]+/g) || [usable[0]];
    const cleaned=bits.map(s=>s.trim()).filter(Boolean);
    if(cleaned.length>=2){
      const mid=Math.ceil(cleaned.length/2);
      return [cleaned.slice(0,mid).join(' '), cleaned.slice(mid).join(' ')].filter(Boolean).slice(0,4);
    }
    return usable;
  }
  let target=2;
  if(usable.length>=4) target=3;
  if(usable.length>=6) target=4;
  target=Math.min(4, Math.max(2, target));
  const paras=[];
  const per=Math.ceil(usable.length/target);
  for(let i=0;i<usable.length;i+=per) paras.push(usable.slice(i,i+per).join(' '));
  while(paras.length>4){
    const last=paras.pop();
    paras[paras.length-1]+=' '+last;
  }
  return paras;
}

function collectDayShiftsFromTransit(person1, person2, transit){
  const d1=analyzeDay(person1, transit);
  const d2=person2?analyzeDay(person2, transit):null;
  const couple=person2?coupleDynamics(person1, person2, transit):null;
  const shifts=[];
  function pushShift(opts){ shifts.push(opts); }

  for(const item of (d1.completed_channels||[])){
    const theme=plainChannelName(item.info);
    const tGate=(item.transit_gates||[])[0];
    const tPlanet=(item.transit_planets||[])[0]||'Transit';
    const pval=transit.planets[tPlanet];
    const line=pval?lineInfo(tGate,pval.line):lineInfo(tGate,1);
    const gInfo=gateInfo(tGate);
    const centers=((item.info&&item.info.centers)||[]);
    pushShift({
      rank:1, kind:'channel', theme, themeKey:theme, planet:tPlanet,
      gl:pval?pval.gl:(tGate+'.1'), line, gInfo,
      center:centers.find(c=>openCentersOf(person1).includes(c))||centers[0],
      who:{p1:true,p2:false}, channelId:item.channel, channelDesign:(item.info&&item.info.design)||'', sort:0, timeKey:0
    });
  }
  for(const t of (d1.touches||[])){
    const theme=t.gate?.name||gateThemeName(t.transit.gate);
    pushShift({
      rank:3, kind:'touch', theme, themeKey:theme, planet:t.planet, gl:t.transit.gl,
      line:t.line, gInfo:t.gate, center:t.gate&&t.gate.center, who:{p1:true,p2:false}, sort:1, timeKey:0
    });
  }
  if(d2){
    for(const item of (d2.completed_channels||[])){
      const theme=plainChannelName(item.info);
      const tGate=(item.transit_gates||[])[0];
      const tPlanet=(item.transit_planets||[])[0]||'Transit';
      const pval=transit.planets[tPlanet];
      const line=pval?lineInfo(tGate,pval.line):lineInfo(tGate,1);
      const gInfo=gateInfo(tGate);
      const centers=((item.info&&item.info.centers)||[]);
      const existing=shifts.find(s=>s.planet===tPlanet && s.themeKey===theme && s.kind==='channel');
      if(existing){ existing.who.p2=true; existing.sharedChannel=true; }
      else {
        pushShift({
          rank:1, kind:'channel', theme, themeKey:theme, planet:tPlanet,
          gl:pval?pval.gl:(tGate+'.1'), line, gInfo,
          center:centers.find(c=>openCentersOf(person2).includes(c))||centers[0],
          who:{p1:false,p2:true}, channelId:item.channel, channelDesign:(item.info&&item.info.design)||'', sort:0, timeKey:0
        });
      }
    }
    for(const t of (d2.touches||[])){
      const theme=t.gate?.name||gateThemeName(t.transit.gate);
      const existing=shifts.find(s=>s.planet===t.planet && s.themeKey===theme);
      if(existing){ existing.who.p2=true; }
      else {
        pushShift({
          rank:3, kind:'touch', theme, themeKey:theme, planet:t.planet, gl:t.transit.gl,
          line:t.line, gInfo:t.gate, center:t.gate&&t.gate.center, who:{p1:false,p2:true}, sort:1, timeKey:0
        });
      }
    }
  }
  for(const s of shifts){
    if(!person2) continue;
    const c=s.center;
    if(s.who.p1 && !s.who.p2 && c && openCentersOf(person2).includes(c)) s.asymmetric={hooked:person1.name, open:person2.name, center:c};
    if(s.who.p2 && !s.who.p1 && c && openCentersOf(person1).includes(c)) s.asymmetric={hooked:person2.name, open:person1.name, center:c};
    if(s.who.p1 && s.who.p2 && s.kind==='channel') s.sharedChannel=true;
  }
  shifts.sort((a,b)=>a.rank-b.rank || a.sort-b.sort);
  return {shifts, d1, d2, couple};
}

function resolveChannelFromReason(reason, gateNum){
  try{
    const afterCh=((reason.after&&reason.after.ch)||'');
    const beforeCh=((reason.before&&reason.before.ch)||'');
    const afterSet=new Set(afterCh.split(',').filter(Boolean).map(x=>x.split(':')[0]));
    const beforeSet=new Set(beforeCh.split(',').filter(Boolean).map(x=>x.split(':')[0]));
    let added=[...afterSet].filter(id=>!beforeSet.has(id));
    if(!added.length) added=[...afterSet];
    if(gateNum!=null){
      const hit=added.find(id=>{
        const ch=CHANNELS[id];
        return ch && ch.gates && (ch.gates[0]==gateNum || ch.gates[1]==gateNum);
      });
      if(hit) return hit;
    }
    return added[0]||null;
  }catch(e){ return null; }
}

function collectTimelineDayShifts(events, person1, person2){
  const out=[];
  for(const ev of events){
    if(!ev.gateChanged){
      const reasons=ev.reasons||[];
      if(!reasons.some(r=>r.type==='channel'||r.type==='center'||r.type==='touch')) continue;
    }
    const to=ev.to||{};
    const theme=gateThemeName(to.gate);
    const reasons=ev.reasons||[];
    const who={p1:false,p2:false};
    let rank=3, kind='touch';
    let channelId=null, channelTheme=null, channelDesign='';
    for(const r of reasons){
      if(r.who===person1.name) who.p1=true;
      if(person2 && r.who===person2.name) who.p2=true;
      if(r.type==='channel'){
        rank=1; kind='channel';
        const id=r.channel||r.id||resolveChannelFromReason(r, to.gate);
        if(id){
          channelId=id;
          try{
            const info=channelInfo(id);
            channelTheme=plainChannelName(info)||channelTheme;
            channelDesign=info.design||'';
          }catch(e){}
        } else if(r.theme) channelTheme=r.theme;
      } else if(r.type==='center'){ rank=Math.min(rank,2); if(kind!=='channel') kind='center'; }
    }
    // Also try harmonic lookup from gate if still missing
    if(kind==='channel' && !channelId && to.gate!=null){
      for(const person of [person1].concat(person2?[person2]:[])){
        for(const [chId,ch] of Object.entries(CHANNELS)){
          const [a,b]=ch.gates;
          if((person.gates.has(a)&&b===to.gate)||(person.gates.has(b)&&a===to.gate)){
            channelId=chId;
            channelTheme=plainChannelName(channelInfo(chId));
            channelDesign=channelInfo(chId).design||'';
            break;
          }
        }
        if(channelId) break;
      }
    }
    if(!who.p1 && !who.p2){
      if((ev.who||{}).both){ who.p1=true; if(person2) who.p2=true; }
      else who.p1=true;
    }
    const line=lineInfo(to.gate, to.line);
    if(line) line.lineMatters=!ev.gateChanged;
    const gInfo=gateInfo(to.gate);
    let themeOut=theme;
    if(kind==='channel' && channelTheme) themeOut=channelTheme;
    out.push({
      rank, kind, theme:themeOut, themeKey:themeOut, planet:ev.planet, gl:to.gl, line, gInfo,
      center:gInfo&&gInfo.center, who, stamp:ev.stamp, timeKey:parseStampSortKey(ev.stamp),
      lineMatters:!ev.gateChanged, sharedChannel:!!(who.p1&&who.p2&&kind==='channel'),
      channelId, channelDesign, asymmetric:null
    });
  }
  const map=new Map();
  for(const s of out){
    const key=s.planet+'|'+String(s.themeKey).toLowerCase();
    const prev=map.get(key);
    if(!prev){ map.set(key,s); continue; }
    if(s.timeKey<prev.timeKey){
      s.who.p1=s.who.p1||prev.who.p1; s.who.p2=s.who.p2||prev.who.p2;
      if(!s.channelDesign && prev.channelDesign) s.channelDesign=prev.channelDesign;
      map.set(key,s);
    } else {
      prev.who.p1=prev.who.p1||s.who.p1; prev.who.p2=prev.who.p2||s.who.p2;
      if(s.rank<prev.rank){ prev.rank=s.rank; prev.kind=s.kind; prev.theme=s.theme; prev.themeKey=s.themeKey; }
      if(s.channelDesign && !prev.channelDesign) prev.channelDesign=s.channelDesign;
      if(s.channelId && !prev.channelId) prev.channelId=s.channelId;
    }
  }
  const merged=[...map.values()];
  if(person2){
    for(const s of merged){
      const c=s.center;
      if(s.who.p1 && !s.who.p2 && c && openCentersOf(person2).includes(c)) s.asymmetric={hooked:person1.name, open:person2.name, center:c};
      if(s.who.p2 && !s.who.p1 && c && openCentersOf(person1).includes(c)) s.asymmetric={hooked:person2.name, open:person1.name, center:c};
      if(s.who.p1 && s.who.p2 && s.kind==='channel') s.sharedChannel=true;
    }
  }
  merged.sort((a,b)=>a.timeKey-b.timeKey || a.rank-b.rank);
  return merged;
}

function weaveDayParagraphs(person1, person2, shifts, tracker, opts){
  opts=opts||{};
  tracker.relCount=0;
  const chronological=shifts.slice().sort((a,b)=>(a.timeKey||0)-(b.timeKey||0)||a.rank-b.rank);
  const picked=[];
  for(const s of chronological){
    if(picked.length>=4) break;
    const key=String(s.themeKey||s.theme).toLowerCase();
    if(tracker.usedThemes.has(key)) continue;
    picked.push(s);
  }
  const sentences=[];
  for(let i=0;i<picked.length;i++){
    const s=picked[i];
    let timePrefix='';
    if(opts.withTimes && s.stamp){
      const t=formatTimeShort(s.stamp);
      if(t) timePrefix=(i===0?'By ': (i===picked.length-1?'Later, by ':'By '))+t+', ';
    }
    const sent=describeShiftOnce(person1, person2, s, tracker, timePrefix);
    if(sent) sentences.push(sent);
  }
  let paras=packParagraphs(sentences);
  if(!paras.length){
    paras=['With the activations entered, this sky does not show a loud practical hook into '+(person2?(person1.name+' or '+person2.name):person1.name)+'’s design. Keep decisions on strategy and authority.'];
  }
  return paras.slice(0,4);
}

function natalCarriersOnGate(person, gate){
  const hits=[];
  const acts=person.all_planet_activations&&person.all_planet_activations.length
    ? person.all_planet_activations
    : Object.entries(person.planets||{}).map(([planet,pval])=>({planet,...pval}));
  for(const a of acts){
    if(a && +a.gate===+gate){
      hits.push({planet:a.planet, gl:a.gl|| (a.gate+'.'+a.line), side:a.side||null});
    }
  }
  // Also design_planets if not already in acts
  for(const [pname,pval] of Object.entries(person.design_planets||{})){
    if(pval && +pval.gate===+gate && !hits.some(h=>h.planet===pname && h.side==='design')){
      hits.push({planet:pname, gl:pval.gl|| (pval.gate+'.'+pval.line), side:'design'});
    }
  }
  return hits;
}

function hangingOnlyGate(person, gate){
  return person.hanging_gates && person.hanging_gates.has(+gate) && natalCarriersOnGate(person, gate).length===0;
}

function channelsNeedingGate(person, gate){
  const out=[];
  for(const [chId,ch] of Object.entries(CHANNELS)){
    const [a,b]=ch.gates;
    if(+gate!==a && +gate!==b) continue;
    const other=(+gate===a)?b:a;
    if(person.gates.has(other) && !person.gates.has(+gate)){
      out.push({id:chId, info:channelInfo(chId), missing:+gate, held:other});
    }
  }
  return out;
}

function centerDefinedByCompleted(person, transit, completedItem){
  return (completedItem.info && completedItem.info.centers)||[];
}

function collectDirectHits(person, transit){
  const day=analyzeDay(person, transit);
  const hits=[];
  const seen=new Set();

  // Touches: transit planet on natal gate
  for(const t of (day.touches||[])){
    const key='touch:'+t.planet+':'+t.transit.gate;
    if(seen.has(key)) continue;
    seen.add(key);
    const carriers=natalCarriersOnGate(person, t.transit.gate);
    // Verify against chart
    if(!person.gates.has(+t.transit.gate)) continue;
    hits.push({
      kind:'touch',
      planet:t.planet,
      gl:t.transit.gl,
      gate:+t.transit.gate,
      line:+t.transit.line,
      gateInfo:t.gate||gateInfo(t.transit.gate),
      lineInfo:t.line||lineInfo(t.transit.gate,t.transit.line),
      carriers,
      hangingOnly:hangingOnlyGate(person, t.transit.gate),
      channels:channelsNeedingGate(person, t.transit.gate)
    });
  }

  // Channel completions: transit supplies missing gate (or overlays)
  for(const item of (day.completed_channels||[])){
    const tGates=item.transit_gates||[];
    const tPlanets=item.transit_planets||[];
    for(const tg of tGates){
      for(const pname of tPlanets){
        const pval=transit.planets[pname];
        if(!pval || +pval.gate!==+tg) continue;
        const key='ch:'+pname+':'+item.channel;
        if(seen.has(key)) continue;
        // Skip pure touch already covered if same planet/gate and not a completion role
        const natalHolds=person.gates.has(+tg);
        const supplies=!natalHolds;
        if(!supplies && item.kind!=='transit_overlay_on_natal_channel'){
          // still note overlay
        }
        seen.add(key);
        const carriers=natalCarriersOnGate(person, tg);
        hits.push({
          kind: supplies?'channel_supply':(item.kind==='electromagnetic'?'channel_em':'channel_overlay'),
          planet:pname,
          gl:pval.gl,
          gate:+tg,
          line:+pval.line,
          gateInfo:gateInfo(tg),
          lineInfo:lineInfo(tg,pval.line),
          carriers,
          hangingOnly:hangingOnlyGate(person, tg),
          channel:item,
          channelId:item.channel,
          channelInfo:item.info,
          suppliesMissing:supplies,
          centers:(item.info&&item.info.centers)||[]
        });
      }
    }
  }

  // Centers temporarily defined via completed channels that light open centers
  const open=new Set(openCentersOf(person));
  for(const item of (day.completed_channels||[])){
    for(const c of ((item.info&&item.info.centers)||[])){
      if(!open.has(c) && !(c==='Heart/Ego' && (open.has('Heart')||open.has('Ego')))) continue;
      // already covered via channel hits; center definition noted in weather section
    }
  }

  // Deduplicate: prefer channel_supply over touch for same planet+gate
  const byPG=new Map();
  for(const h of hits){
    const k=h.planet+'|'+h.gate;
    const prev=byPG.get(k);
    if(!prev){ byPG.set(k,h); continue; }
    const rank={channel_supply:0, channel_em:1, channel_overlay:2, touch:3};
    if((rank[h.kind]??9)<(rank[prev.kind]??9)) byPG.set(k,h);
  }
  return {day, hits:[...byPG.values()].sort((a,b)=>PLANET_ORDER.indexOf(a.planet)-PLANET_ORDER.indexOf(b.planet))};
}

function verifyHitAgainstChart(person, hit){
  if(hit.kind==='touch' || hit.kind==='channel_overlay'){
    return person.gates.has(+hit.gate);
  }
  if(hit.kind==='channel_supply' || hit.kind==='channel_em'){
    // Must complete a real channel with a natal gate
    if(!hit.channel) return false;
    const [a,b]=hit.channel.info.gates || CHANNELS[hit.channelId].gates;
    const natalHolds=(person.gates.has(a)?1:0)+(person.gates.has(b)?1:0);
    const supplies=!person.gates.has(+hit.gate);
    return natalHolds>=1 && (supplies || person.gates.has(+hit.gate));
  }
  return true;
}

function describeHitParagraph(person, hit, tracker){
  if(!verifyHitAgainstChart(person, hit)) return '';
  const theme=prettyTheme((hit.gateInfo&&hit.gateInfo.name)||gateThemeName(hit.gate));
  const center=(hit.gateInfo&&hit.gateInfo.center)||'';
  const planet=planetLabel(hit.planet);
  const gl=hit.gl;
  let touchClause='';
  if(hit.carriers && hit.carriers.length){
    const bits=hit.carriers.map(c=>{
      const side=c.side?(' ('+c.side+')'):'';
      return planetLabel(c.planet)+side+(c.gl?(' '+c.gl):'');
    });
    touchClause='It lands on natal '+bits.join(' and ')+' in this design';
  } else if(hit.suppliesMissing && hit.channelInfo){
    const chName=plainChannelName(hit.channelInfo);
    const held=(hit.channel.natal_gates||[]).filter(g=>g!==hit.gate)[0];
    touchClause='It supplies the missing gate for the channel of '+prettyTheme(chName)+(held?(' (natal gate '+held+' waiting)'):'');
  } else if(hit.channelInfo){
    touchClause='It meets the channel of '+prettyTheme(plainChannelName(hit.channelInfo))+' already held in the chart';
  } else if(person.gates.has(+hit.gate)){
    touchClause='It activates hanging gate '+hit.gate+' already in the design';
  } else {
    return '';
  }

  const defined=center && isCenterDefined(person, center);
  const centerOpts=center?(defined?[
    theme+' touches/feeds the defined '+center+' center—consistent energy amplified rather than new definition',
    'In this chart '+theme+' sits in defined '+center+', so the transit amplifies what is already reliable',
    'Defined '+center+' receives '+theme+' as a feed into established circuitry'
  ]:[
    theme+' lives in the '+center+' center, which is open in this chart',
    'In this chart '+theme+' sits in open '+center,
    'Open '+center+' is where '+theme+' operates for '+person.name+' under this sky'
  ]):[];

  let lineBit='';
  const title=cleanLineTitle(hit.lineInfo);
  if(title){
    const ord=lineOrdinal(hit.line);
    const lineOpts=[
      'The '+ord+'-line “'+title+'” quality asks for a slower read before reacting',
      'In the '+ord+' line (“'+title+'”), the practical flavor favors precision over push',
      'Line '+hit.line+' (“'+title+'”) tilts '+theme+' toward restraint rather than reaction',
      'A '+ord+'-line pass (“'+title+'”) changes how '+theme+' shows up in small choices'
    ];
    for(const opt of lineOpts){
      const filtered=registerAndFilterSentence(tracker, opt);
      if(filtered){ lineBit=filtered.replace(/\.$/,''); break; }
    }
    if(!lineBit) lineBit=lineOpts[tracker.seq % lineOpts.length];
  }

  let designBit='';
  if(hit.channelInfo && hit.channelInfo.design){
    const cue=String(hit.channelInfo.design).replace(/^A\s+design\s+(of\s+|where\s+)?/i,'').replace(/\.$/,'').trim();
    if(cue && cue.length<100){
      const dOpts=[
        'Channel design note: '+cue,
        'The channel’s design of '+cue+' colors the tone',
        'Mechanically this is a design of '+cue
      ];
      for(const opt of dOpts){
        const filtered=registerAndFilterSentence(tracker, opt);
        if(filtered){ designBit=filtered.replace(/\.$/,''); break; }
      }
      if(!designBit) designBit=dOpts[0];
    }
  }

  const ill=nextIllustration(tracker);
  const leadOpts=[
    showTransitFieldPositions()
      ? (planet+' at '+gl+' ('+theme+') is a direct hit for '+person.name)
      : (planet+' ('+theme+') is a direct hit for '+person.name),
    showTransitFieldPositions()
      ? (planet+' at '+gl+' ('+theme+') hooks '+person.name+'’s design')
      : (planet+' ('+theme+') hooks '+person.name+'’s design'),
    showTransitFieldPositions()
      ? ('For '+person.name+', '+planet+' at '+gl+' ('+theme+') is the active contact')
      : ('For '+person.name+', '+planet+' ('+theme+') is the active contact'),
    showTransitFieldPositions()
      ? (planet+' at '+gl+' brings '+theme+' into '+person.name+'’s chart now')
      : (planet+' brings '+theme+' into '+person.name+'’s chart now')
  ];
  let lead='';
  const start=tracker.seq % leadOpts.length;
  for(let i=0;i<leadOpts.length;i++){
    const opt=leadOpts[(start+i)%leadOpts.length];
    const filtered=registerAndFilterSentence(tracker, opt);
    if(filtered){ lead=filtered.replace(/\.$/,''); tracker.seq++; break; }
  }
  if(!lead){ lead=leadOpts[start]; tracker.seq++; }

  let centerBit='';
  for(const opt of centerOpts){
    const filtered=registerAndFilterSentence(tracker, opt);
    if(filtered){ centerBit=filtered.replace(/\.$/,''); break; }
  }
  if(!centerBit && centerOpts.length) centerBit=centerOpts[0];

    let illSentence='';
  if(ill){
    const illFrames=[
      'In ordinary life: '+ill+'.',
      'A concrete beat: '+ill+'.',
      'On the ground: '+ill+'.',
      'Practically, watch for this: '+ill+'.'
    ];
    const picked=pickUnused(tracker, 'illframe', illFrames.map((fr,i)=>String(i)));
    const fr=illFrames[+picked]||illFrames[0];
    illSentence=registerAndFilterSentence(tracker, fr)||fr;
  }
  const parts=[lead+'.', touchClause+'.', centerBit?centerBit+'.':'', lineBit?lineBit+'.':'', designBit?designBit+'.':'', illSentence];
  let para=parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  para=para.replace(/\.\./g,'.');
  registerAndFilterSentence(tracker, para);
  return para;
}

function describeChannelWeather(person, day, tracker){
  const sentences=[];
  for(const item of (day.completed_channels||[])){
    const name=prettyTheme(plainChannelName(item.info));
    const cue=String((item.info&&item.info.design)||'').replace(/^A\s+design\s+(of\s+|where\s+)?/i,'').replace(/\.$/,'').trim();
    const planetList=(item.transit_planets||[]).map(planetLabel);
    const planets=planetList.join(' and ');
    const verb=planetList.length>1?' complete':' completes';
    const verbOverlay=planetList.length>1?' overlay':' overlays';
    const verbJoin=planetList.length>1?' join':' joins';
    const centers=((item.info&&item.info.centers)||[]).join('–');
    let tone;
    if(item.kind==='electromagnetic'){
      tone=planets+verb+' the channel of '+name+' with '+person.name+'’s hanging side'+(cue?(' — a design of '+cue):'')+(centers?(' (lighting '+centers+')'):'')+'.';
    } else if(item.kind==='transit_overlay_on_natal_channel'){
      tone=planets+verbOverlay+' the already-defined channel of '+name+(centers?(' across '+centers):'')+'.';
    } else {
      tone=planets+verbJoin+' '+person.name+' in the channel of '+name+(cue?(' (design: '+cue+')'):'')+'.';
    }
    const filtered=registerAndFilterSentence(tracker, tone);
    if(filtered) sentences.push(filtered);
    else sentences.push(tone);
  }
  const litSet=new Set();
  for(const item of (day.completed_channels||[])){
    for(const c of ((item.info&&item.info.centers)||[])) litSet.add(c);
  }
  const lit=[...litSet];
  if(lit.length){
    const open=new Set(openCentersOf(person));
    const newly=lit.filter(c=>open.has(c) || (c==='Heart/Ego' && (open.has('Heart')||open.has('Ego')||open.has('Heart/Ego'))));
    const definedLit=lit.filter(c=>!newly.includes(c));
    if(newly.length){
      const s='Centers receiving temporary definition with this sky: '+newly.join(', ')+'.';
      sentences.push(registerAndFilterSentence(tracker,s)||s);
    }
    if(definedLit.length){
      const s='Already-defined centers touched by transit channels: '+definedLit.join(', ')+'.';
      sentences.push(registerAndFilterSentence(tracker,s)||s);
    }
  }
  if(!sentences.length){
    return 'No channel completions or center light-ups show for '+person.name+' with this sky.';
  }
  return sentences.join(' ');
}

function describeOpenCenterConditioning(person, day, otherPerson, otherDay, transit, tracker){
  const open=openCentersOf(person);
  const activated=new Set();
  for(const item of (day.completed_channels||[])){
    for(const c of ((item.info&&item.info.centers)||[])) activated.add(c);
  }
  const sentences=[];
  let idx=0;
  for(const c of open){
    const aliases=[c];
    if(c==='Heart/Ego') aliases.push('Heart','Ego');
    if(c==='G') aliases.push('Identity');
    if(c==='Solar Plexus') aliases.push('Emotional');
    const lit=aliases.some(a=>activated.has(a)) || activated.has(c);
    let fromPartner=false;
    if(otherPerson && otherDay){
      for(const item of (otherDay.completed_channels||[])){
        const centers=(item.info&&item.info.centers)||[];
        if(centers.some(x=>aliases.includes(x)||x===c)) { fromPartner=true; break; }
      }
      if(otherPerson.defined_centers){
        for(const a of aliases){ if(otherPerson.defined_centers.has(a)||otherPerson.defined_centers.has(c)) fromPartner=true; }
      }
    }
    if(!lit && !fromPartner) continue;
    const info=centerNotSelfInfo(c);
    const q=info && (info.not_self_question||info.question);
    const theme=info && (info.not_self_theme||info.theme);
    const partnerBit=fromPartner?(' (also fillable from '+(otherPerson?otherPerson.name:'the other chart')+')'):'';
    const frameOpts=[
      person.name+'’s open '+c+' receives temporary definition under this sky'+partnerBit+'.',
      'Open '+c+' in '+person.name+' lights while the transit holds'+partnerBit+'.',
      'This sky briefly defines '+person.name+'’s open '+c+partnerBit+'.',
      person.name+' can feel conditioning through open '+c+' right now'+partnerBit+'.',
      'With '+c+' open, '+person.name+' is permeable to this transit definition'+partnerBit+'.'
    ];
    let s=frameOpts[idx % frameOpts.length];
    idx++;
    const filtered=registerAndFilterSentence(tracker, s);
    if(filtered) s=filtered;
    else {
      // try others
      let got='';
      for(const fr of frameOpts){
        const f=registerAndFilterSentence(tracker, fr);
        if(f){ got=f; break; }
      }
      s=got||s;
    }
    if(theme){
      const themeOpts=[
        ' The not-self theme for '+c+' is '+theme+'.',
        ' Conditioning flavor in '+c+': '+theme+'.',
        ' Amplified '+c+' pressure can look like '+theme+'.'
      ];
      let tb='';
      for(const t of themeOpts){
        const f=registerAndFilterSentence(tracker, t.trim());
        if(f){ tb=' '+f; break; }
      }
      s+=(tb||themeOpts[idx%themeOpts.length]);
    }
    if(q){
      const qOpts=[
        ' Useful check: “'+q+'”.',
        ' Ask: “'+q+'”.',
        ' A clean question here is “'+q+'”.'
      ];
      let qb='';
      for(const t of qOpts){
        const f=registerAndFilterSentence(tracker, t.trim());
        if(f){ qb=' '+f; break; }
      }
      s+=(qb||qOpts[idx%qOpts.length]);
    }
    sentences.push(s.replace(/\s+/g,' ').trim());
  }
  if(!sentences.length){
    return 'None of '+person.name+'’s open centers are clearly lit by this transit field.';
  }
  return sentences.join(' ');
}

function describeCoupleComparison(person1, person2, day1, day2, couple, tracker){
  const bits=[];
  const shared=(couple&&couple.shared_transit_hooks)||[];
  const both=shared.filter(h=>h.in_a&&h.in_b);
  const only1=shared.filter(h=>h.in_a&&!h.in_b);
  const only2=shared.filter(h=>h.in_b&&!h.in_a);
  if(both.length){
    const s='Shared hooks under this sky: '+both.map(h=>planetLabel(h.planet)+(showTransitFieldPositions()?(' '+h.gl):'')+' ('+prettyTheme((h.gate&&h.gate.name)||gateThemeName((h.gl||'').split('.')[0]))+')').join('; ')+'.';
    bits.push(registerAndFilterSentence(tracker,s)||s);
  }
  if(only1.length){
    const s=person1.name+'-only hits: '+only1.map(h=>planetLabel(h.planet)+(showTransitFieldPositions()?(' '+h.gl):'')).join(', ')+', while '+person2.name+' may feel them through open centers rather than natal gates.';
    bits.push(registerAndFilterSentence(tracker,s)||s);
  }
  if(only2.length){
    const s=person2.name+'-only hits: '+only2.map(h=>planetLabel(h.planet)+(showTransitFieldPositions()?(' '+h.gl):'')).join(', ')+', with '+person1.name+' more likely to receive them as conditioning.';
    bits.push(registerAndFilterSentence(tracker,s)||s);
  }
  const electro=(couple&&couple.electromagnetic)||[];
  const amplified=(couple&&couple.transit_amplified_channels)||[];
  if(amplified.length){
    const s='Bridge channels the transit amplifies: '+amplified.map(c=>prettyTheme(plainChannelName(c))).join(', ')+'.';
    bits.push(registerAndFilterSentence(tracker,s)||s);
  } else if(electro.length){
    const s='Electromagnetic bridges between them (natal): '+electro.map(c=>prettyTheme(plainChannelName(c))).join(', ')+'.';
    bits.push(registerAndFilterSentence(tracker,s)||s);
  }
  if(!bits.length){
    return 'Under this sky the two charts do not show a loud shared hook or amplified bridge; keep reading each person’s direct hits on their own terms.';
  }
  return bits.join(' ');
}

function packHitParagraphs(hitParas){
  if(!hitParas.length) return [];
  // Group into 2-4 continuous paragraphs
  if(hitParas.length<=2) return hitParas;
  const target=Math.min(4, Math.max(2, Math.ceil(hitParas.length/2)));
  const per=Math.ceil(hitParas.length/target);
  const out=[];
  for(let i=0;i<hitParas.length;i+=per) out.push(hitParas.slice(i,i+per).join(' '));
  return out.slice(0,4);
}

function renderPersonIndepthSections(person, transit, tracker, otherPerson, otherDay){
  const parts=[];
  const pack=collectDirectHits(person, transit);
  const day=pack.day;
  parts.push('<h3>'+escapeHtml(person.name)+'</h3>');
  const defList=[...person.defined_centers].sort();
  const openList=openCentersOf(person);
  const chBits=(person.natal_channel_list||[]).map(c=>prettyTheme(c.name)+' ('+c.centers.join('–')+')');
  const gateCount=(person.gates && person.gates.size)||0;
  let centerLine;
  if(gateCount>0 && !chBits.length){
    const rawActs=formatActivationList(person);
    centerLine='Extracted '+gateCount+' natal gate(s) but zero complete channels — not reporting empty centers. Raw: '+(rawActs.length?rawActs.join('; '):[...person.gates].sort().join(', '))+'. Check the input.';
  } else {
    centerLine='Defined centers: '+(defList.length?defList.join(', '):(gateCount?'(deriving…)':'none'))+'. Open centers: '+(openList.length?openList.join(', '):'none')+'.'
      +(chBits.length?(' Natal channels: '+chBits.join('; ')+'.'):(gateCount?'':' No natal channels.'));
  }
  parts.push('<p><em>'+escapeHtml(centerLine)+'</em></p>');

  parts.push('<h4>'+escapeHtml('Direct hits on the chart')+'</h4>');
  const hitParas=[];
  for(const hit of pack.hits){
    if(!verifyHitAgainstChart(person, hit)) continue;
    const p=describeHitParagraph(person, hit, tracker);
    if(p) hitParas.push(p);
  }
  if(!hitParas.length){
    parts.push('<p>'+escapeHtml('No transit planet currently lands on a natal gate, completes a channel, or temporarily defines a center for '+person.name+' under this sky.')+'</p>');
  } else {
    for(const para of packHitParagraphs(hitParas)) parts.push('<p>'+escapeHtml(para)+'</p>');
  }

  parts.push('<h4>'+escapeHtml('Channel and center weather')+'</h4>');
  parts.push('<p>'+escapeHtml(describeChannelWeather(person, day, tracker))+'</p>');

  parts.push('<h4>'+escapeHtml('Open-center conditioning')+'</h4>');
  parts.push('<p>'+escapeHtml(describeOpenCenterConditioning(person, day, otherPerson, otherDay, transit, tracker))+'</p>');

  if(realWorldOn()){
    parts.push('<h4>'+escapeHtml('Not-self landscape (full chart)')+'</h4>');
    for(const para of describeExpandedNotSelf(person, day, otherPerson, otherDay, transit, tracker)){
      if(para) parts.push('<p>'+escapeHtml(para)+'</p>');
    }
  }

  return {html:parts.join('\n'), day, hits:pack.hits};
}

function renderIndepthDayHtml(person1, person2, transitRaw, tracker, meta){
  meta=meta||{};
  const transit=transitWithoutLights(transitRaw);
  const parts=[];
  const when=transitRaw.display_when||transitRaw.display_date||transitRaw.date||'';
  if(meta && meta.dayHeading) parts.push('<h3>'+escapeHtml(meta.dayHeading)+'</h3>');
  if(meta && meta.ingressNote) parts.push('<p><em>'+escapeHtml(meta.ingressNote)+'</em></p>');

  // Sections 2-5 first (person sections + comparison), positions LAST
  const otherDayPre=person2?analyzeDay(person2, transit):null;
  const r1=renderPersonIndepthSections(person1, transit, tracker, person2, otherDayPre);
  parts.push(r1.html);
  let r2=null;
  if(person2){
    r2=renderPersonIndepthSections(person2, transit, tracker, person1, r1.day);
    parts.push(r2.html);
    const couple=coupleDynamics(person1, person2, transit);
    parts.push('<h3>'+escapeHtml('Between '+person1.name+' and '+person2.name)+'</h3>');
    parts.push('<p>'+escapeHtml(describeCoupleComparison(person1, person2, r1.day, r2.day, couple, tracker))+'</p>');
    if(realWorldOn()){
      parts.push('<h4>'+escapeHtml('How they condition each other under this sky')+'</h4>');
      for(const para of describeExpandedCoupleNotSelf(person1, person2, r1.day, r2.day, couple, tracker)){
        if(para) parts.push('<p>'+escapeHtml(para)+'</p>');
      }
    }
  }

  // Positions table / Transit field section at BOTTOM (optional for multi-day ranges)
  const showField = wantTransitFieldSections(meta);
  if(showField){
    parts.push(renderTransitPositionsHtml(transitRaw, meta));
  }

  if(showField){
    let tech=technicalBlock(transit, [r1.day].concat(r2?[r2.day]:[]), person2?coupleDynamics(person1,person2,transit):null, {includeTransitField: true});
    const mismatches=[];
    if(person1.center_mismatch) mismatches.push(person1.center_mismatch);
    if(person2 && person2.center_mismatch) mismatches.push(person2.center_mismatch);
    function centerTechLine(p){
      const def=[...p.defined_centers].sort().join(', ')||'none';
      const open=openCentersOf(p).join(', ')||'none';
      const ch=(p.natal_channel_list||[]).map(c=>c.id+' '+c.name+' → '+c.centers.join('+')).join('; ')||'none';
      return p.name+' centers (channel-derived): defined ['+def+']; open ['+open+']; natal channels ['+ch+']';
    }
    tech += '\n'+centerTechLine(person1);
    if(person2) tech += '\n'+centerTechLine(person2);
    if(mismatches.length) tech += '\n'+mismatches.join('\n');
    parts.push('<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)</summary><pre>'+escapeHtml(tech)+'</pre></details></div>');
  }
  return parts.join('\n');
}


function briefTouchExplanation(person, hit){
  const name = firstNameOnly(person.name);
  const theme = prettyTheme((hit.gateInfo&&hit.gateInfo.name)||gateThemeName(hit.gate));
  const center = (hit.gateInfo&&hit.gateInfo.center)||'';
  const open = openCentersOf(person);
  const isOpen = center && open.indexOf(center)>=0;
  const lineBits = lineDescriptionBrief(hit.lineInfo);
  const lineTitle = lineBits.title;
  const meaning = lineBits.body;
  const planet = planetLabel(hit.planet);
  let how = '';
  if(hit.kind==='channel_supply' || hit.kind==='channel_em'){
    const chInfo = hit.channelInfo || (hit.channel && hit.channel.info) || null;
    const chName = prettyTheme(chInfo ? plainChannelName(chInfo) : ((hit.channelId)||'a channel'));
    how = name+' gets a temporary complete '+chName+' while '+planet+' holds '+theme+'.';
  } else if(hit.kind==='channel_overlay'){
    how = planet+' overlays '+name+'’s already-defined '+theme+' circuitry—same gate, louder weather.';
  } else if(isOpen){
    how = planet+' lands in '+name+'’s open '+(center||'center')+' on '+theme+', so the theme is felt as conditioning rather than native definition.';
  } else {
    how = planet+' activates '+theme+' in '+name+'’s defined '+(center||'circuitry')+', amplifying what is already reliable.';
  }
  if(lineTitle){
    how += ' Line quality: '+lineTitle+(meaning?(' — '+meaning.replace(/\.$/,'')):'')+'.';
  } else if(meaning){
    how += ' '+meaning;
  }
  // Keep to ~2 sentences
  const parts = [];
  let buf = '';
  for(let i=0;i<how.length;i++){
    buf += how.charAt(i);
    if('.!?'.indexOf(how.charAt(i))>=0){
      parts.push(buf.trim());
      buf='';
      if(parts.length>=2) break;
    }
  }
  if(parts.length<2 && buf.trim()) parts.push(buf.trim());
  return parts.slice(0,2).join(' ');
}

function oneBridgeLine(person, day){
  const name = firstNameOnly(person.name);
  const completed = (day&&day.completed_channels)||[];
  for(const item of completed){
    const kind = String(item.kind||'');
    if(kind.indexOf('electromagnetic')>=0 || kind.indexOf('supply')>=0 || kind==='channel_em' || kind==='channel_supply'){
      const chName = prettyTheme(item.info ? plainChannelName(item.info) : (item.channel||'channel'));
      return name+': temporary '+chName+' channel completes.';
    }
  }
  return '';
}

function renderOverviewHitItem(person, hit){
  if(!verifyHitAgainstChart(person, hit)) return '';
  const theme = prettyTheme((hit.gateInfo&&hit.gateInfo.name)||gateThemeName(hit.gate));
  const lineBits = lineDescriptionBrief(hit.lineInfo);
  const lineTitle = lineBits.title || ('Line '+hit.line);
  const gl = hit.gl || (hit.gate+'.'+hit.line);
  const planet = planetLabel(hit.planet);
  const showPos = showTransitFieldPositions();
  const head = showPos
    ? ('<span class="ov-gl">'+escapeHtml(planet+' '+gl)+'</span> — '+escapeHtml(theme)+' · '+escapeHtml(lineTitle))
    : (escapeHtml(planet)+' — '+escapeHtml(theme)+' · '+escapeHtml(lineTitle));
  const brief = briefTouchExplanation(person, hit);
  return '<li>'+head+': '+escapeHtml(brief)+'</li>';
}

function renderRangeOverviewDayHtml(person1, person2, transitRaw, meta){
  meta = meta||{};
  const transit = transitWithoutLights(transitRaw);
  const parts = [];
  const when = transitRaw.display_when || transitRaw.display_date || transitRaw.date || '';
  parts.push('<div class="ov-day">');
  parts.push('<h3>'+escapeHtml(when)+'</h3>');

  let bridgeUsed = false;
  function addPerson(person){
    const pack = collectDirectHits(person, transit);
    const items = [];
    for(const hit of (pack.hits||[])){
      const li = renderOverviewHitItem(person, hit);
      if(li) items.push(li);
    }
    parts.push('<div class="ov-person">'+escapeHtml(firstNameOnly(person.name))+'</div>');
    if(items.length){
      parts.push('<ul class="ov-hits">'+items.join('')+'</ul>');
    } else {
      parts.push('<p><em>'+escapeHtml('No chart-relevant gate/line activations at this stamp for '+firstNameOnly(person.name)+'.')+'</em></p>');
    }
    if(!bridgeUsed){
      const br = oneBridgeLine(person, pack.day);
      if(br){
        parts.push('<p class="ov-bridge"><em>'+escapeHtml(br)+'</em></p>');
        bridgeUsed = true;
      }
    }
  }
  addPerson(person1);
  if(person2) addPerson(person2);

  const showField = wantTransitFieldSections(meta);
  if(showField){
    parts.push(renderTransitPositionsHtml(transitRaw, meta));
  }
  parts.push('</div>');
  return parts.join('\n');
}

function renderRangeOverviewHtml(person1, person2, transits, meta){
  meta = meta||{};
  const parts = [];
  const names = person2 ? (firstNameOnly(person1.name)+' & '+firstNameOnly(person2.name)) : firstNameOnly(person1.name);
  let titleDates;
  if(transits.length===1) titleDates = transits[0].display_when||meta.timeLabel||'';
  else {
    const a = transits[0].display_date||transits[0].date;
    const b = transits[transits.length-1].display_date||transits[transits.length-1].date;
    const t = transits[0].display_time||'';
    titleDates = a+' to '+b+(t?(' · '+t):'');
  }
  parts.push('<h2>'+escapeHtml('Transit overview: '+names)+'</h2>');
  parts.push('<p><em>'+escapeHtml(titleDates)+'</em></p>');
  parts.push('<p><em>'+escapeHtml('Brief gate & line activations that touch the chart—not a full narrative reading.')+'</em></p>');
  if(omitLightsOn()) parts.push('<p><em>'+escapeHtml('Sun, Earth, and Moon are omitted from this analysis.')+'</em></p>');

  const fieldMode = (meta && meta.rangeTransitFieldMode) || rangeTransitFieldMode(transits.length);
  parts.push('<div class="range-overview">');
  for(let ti=0; ti<transits.length; ti++){
    const t = transits[ti];
    let includePositions = false;
    if(fieldMode==='per-day') includePositions = true;
    else if(fieldMode==='start-end') includePositions = (ti===0 || ti===transits.length-1);
    else if(fieldMode==='single') includePositions = true;
    parts.push(renderRangeOverviewDayHtml(person1, person2, t, {
      includePositions: includePositions,
      includeTransitField: includePositions
    }));
  }
  parts.push('</div>');
  return parts.join('\n');
}

function renderStructuredSnapshotHtml(person1, person2, transits, meta){
  meta = meta||{};
  // Range overview mode: compact gate/line list (multi-day only). Single day stays full reading.
  if(transits.length>1 && wantRangeOverview(meta)){
    return renderRangeOverviewHtml(person1, person2, transits, meta);
  }
  const tracker=makeProseTracker();
  const parts=[];
  const names=person2?(person1.name+' & '+person2.name):person1.name;
  let titleDates;
  if(transits.length===1) titleDates=transits[0].display_when||meta.timeLabel||'';
  else {
    const a=transits[0].display_date||transits[0].date;
    const b=transits[transits.length-1].display_date||transits[transits.length-1].date;
    const t=transits[0].display_time||'';
    titleDates=a+' to '+b+(t?(' · '+t):'');
  }
  parts.push('<h2>'+escapeHtml((realWorldOn()?'Real-world transit reading: ':'Transit reading: ')+names)+'</h2>');
  parts.push('<p><em>'+escapeHtml(titleDates)+'</em></p>');
  parts.push('<p><em>'+escapeHtml('In-depth potentials from natal activations plus this sky—not predictions.')+'</em></p>');
  if(omitLightsOn()) parts.push('<p><em>'+escapeHtml('Sun, Earth, and Moon are omitted from this analysis.')+'</em></p>');

  if(transits.length===1){
    // Single day / Now: always include transit field
    parts.push(renderIndepthDayHtml(person1, person2, transits[0], tracker, {includePositions:true, includeTransitField:true}));
  } else {
    // Multi-day range: optional transit field (checkbox, default off).
    // Choice: <=7 days → per-day table at bottom of each day; longer → start+end only.
    // When omit: no positions table, no "Transit field" heading, no gate.line field list in tech.
    const fieldMode = (meta && meta.rangeTransitFieldMode) || rangeTransitFieldMode(transits.length);
    if(fieldMode==='start-end'){
      parts.push('<p><em>'+escapeHtml('Positions table: first and last day of the range only (range longer than 7 days).')+'</em></p>');
    }
    // No omit note — leave the report clean when unchecked.
    for(let ti=0; ti<transits.length; ti++){
      const t=transits[ti];
      const dayTracker=makeProseTracker();
      dayTracker.usedExamples=tracker.usedExamples;
      dayTracker.usedNgrams=tracker.usedNgrams;
      dayTracker.usedFrames=tracker.usedFrames;
      dayTracker.usedMeanings=tracker.usedMeanings;
      dayTracker.seq=tracker.seq;
      let includePositions=false;
      if(fieldMode==='per-day') includePositions=true;
      else if(fieldMode==='start-end') includePositions=(ti===0 || ti===transits.length-1);
      // else omit → false
      parts.push(renderIndepthDayHtml(person1, person2, t, dayTracker, {
        dayHeading:t.display_when||t.display_date||t.date,
        includePositions:includePositions,
        includeTransitField:includePositions
      }));
      tracker.seq=dayTracker.seq;
    }
  }
  return parts.join('\n');
}

function renderStructuredTimelineHtml(person1, person2, meta){
  const tracker=makeProseTracker();
  const parts=[];
  const names=person2?(person1.name+' & '+person2.name):person1.name;
  let events=(meta.events||[]).slice();
  if(omitLightsOn()) events=events.filter(e=>!isLightPlanet(e.planet));
  if(allGateOnlyOn()) events=events.filter(e=>e.gateChanged);
  else if(!omitLightsOn()){
    if(moonGateOnlyOn()) events=events.filter(e=>e.planet!=='Moon'||e.gateChanged);
    if(sunGateOnlyOn()) events=events.filter(e=>(e.planet!=='Sun'&&e.planet!=='Earth')||e.gateChanged);
  }
  if(!person2){
    events=events.filter(e=>{
      const rs=e.reasons||[];
      if(!rs.length) return true;
      return rs.some(r=>r.who===person1.name);
    }).map(e=>{
      const rs=(e.reasons||[]).filter(r=>r.who===person1.name);
      return Object.assign({}, e, {reasons:rs, who:{both:false, couple:false}});
    });
  }

  parts.push('<h2>'+escapeHtml((realWorldOn()?'Real-world transit timeline: ':'Transit timeline: ')+names)+'</h2>');
  parts.push('<p><em>'+escapeHtml(meta.rangeLabel||'')+'</em></p>');
  parts.push('<p><em>'+escapeHtml('In-depth day readings with ingress notes—not a one-line event list.')+'</em></p>');
  if(omitLightsOn()) parts.push('<p><em>'+escapeHtml('Sun, Earth, and Moon are omitted from this analysis.')+'</em></p>');

  const byDay=new Map();
  for(const ev of events){
    const k=ev.dayKey||'Day';
    if(!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(ev);
  }

  // Prefer startField as key moment; else first event's afterField per day
  if(!byDay.size && meta.startField){
    const dayTracker=makeProseTracker();
    dayTracker.usedExamples=tracker.usedExamples;
    dayTracker.usedNgrams=tracker.usedNgrams;
    dayTracker.usedFrames=tracker.usedFrames;
    dayTracker.usedMeanings=tracker.usedMeanings;
    dayTracker.seq=tracker.seq;
    const _tlShow = wantTransitFieldSections({includePositions: isRangeWhenActive() ? includeRangeTransitFieldOn() : true});
    parts.push(renderIndepthDayHtml(person1, person2, meta.startField, dayTracker, {
      dayHeading:meta.startField.display_when||'Range start',
      includePositions:_tlShow,
      includeTransitField:_tlShow
    }));
  }

  for(const [day, list] of byDay){
    list.sort((a,b)=>parseStampSortKey(a.stamp)-parseStampSortKey(b.stamp));
    const field=list.find(e=>e.afterField)&&list.find(e=>e.afterField).afterField
      || meta.startField
      || null;
    // Build a transit field for the day: use afterField of last ingress or startField
    let dayField=field;
    if(!dayField && list.length){
      const last=list[list.length-1];
      dayField=last.afterField||null;
    }
    if(!dayField || !dayField.planets){
      parts.push('<h3>'+escapeHtml(day)+'</h3>');
      parts.push('<p>'+escapeHtml('No full positions snapshot was available for this day.')+'</p>');
      continue;
    }
    if(!dayField.display_when) dayField.display_when=day;
    const _showIngGl = showTransitFieldPositions();
    const ingressNote=list.length
      ? ('Significant ingresses: '+list.map(e=>{
          const t=(String(e.stamp).match(/(\d{1,2}:\d{2}\s*[AP]M)/i)||[''])[0];
          const glBit=_showIngGl ? (' '+(e.from&&e.from.gl)+'→'+(e.to&&e.to.gl)) : '';
          return (t?t+' ':'')+planetLabel(e.planet)+glBit;
        }).join('; ')+'.')
      : '';
    const dayTracker=makeProseTracker();
    dayTracker.usedExamples=tracker.usedExamples;
    dayTracker.usedNgrams=tracker.usedNgrams;
    dayTracker.usedFrames=tracker.usedFrames;
    dayTracker.usedMeanings=tracker.usedMeanings;
    dayTracker.seq=tracker.seq;
        const _tlShowDay = wantTransitFieldSections({includePositions: isRangeWhenActive() ? includeRangeTransitFieldOn() : true});
    parts.push(renderIndepthDayHtml(person1, person2, dayField, dayTracker, {
      dayHeading:day,
      ingressNote,
      includePositions:_tlShowDay,
      includeTransitField:_tlShowDay
    }));
    tracker.seq=dayTracker.seq;
  }

  return parts.join('\n');
}


function planetLabel(p){
  if(p==='NorthNode') return 'North Node';
  if(p==='SouthNode') return 'South Node';
  return p;
}

function renderTransitPositionsHtml(transit, meta){
  // List all 13 bodies with gate.line + name (ignore omit / codes / direct filters).
  // Range + unchecked "Include transit field" → never emit this block.
  if(!wantTransitFieldSections(meta)) return '';
  if(!transit || !transit.planets) return '';
  const when=transit.display_when || transit.display_date || transit.date || '';
  const rows=[];
  rows.push('<div class="transit-positions">');
  rows.push('<h3>Transit field</h3>');
  if(when) rows.push('<p class="pos-when">Reading time: '+escapeHtml(when)+'</p>');
  rows.push('<table><thead><tr><th>Planet</th><th>Gate.Line</th><th>Gate</th></tr></thead><tbody>');
  for(const p of PLANET_ORDER){
    const glObj=transit.planets[p];
    if(!glObj){
      rows.push('<tr><td>'+escapeHtml(planetLabel(p))+'</td><td class="gl">—</td><td>—</td></tr>');
      continue;
    }
    const gl=glObj.gl || ((glObj.gate!=null && glObj.line!=null) ? (glObj.gate+'.'+glObj.line) : '—');
    const gName=gateThemeName(glObj.gate) || ((gateInfo(glObj.gate)||{}).name) || ('Gate '+glObj.gate);
    rows.push('<tr><td>'+escapeHtml(planetLabel(p))+'</td><td class="gl">'+escapeHtml(String(gl))+'</td><td>'+escapeHtml(gName)+'</td></tr>');
  }
  rows.push('</tbody></table></div>');
  return rows.join('\n');
}

function renderDirectEffectsNarrativeHtml(person1, person2, transits, meta){
  const parts=[];
  const names=person2?(person1.name+' & '+person2.name):person1.name;
  let titleDates;
  if(transits.length===1){
    titleDates = transits[0].display_when || meta.timeLabel || '';
  } else {
    const a=transits[0].display_date||transits[0].date;
    const b=transits[transits.length-1].display_date||transits[transits.length-1].date;
    const t=transits[0].display_time||'';
    titleDates = a+' to '+b+(t?(' · '+t):'');
  }
  parts.push('<h2>'+escapeHtml('Direct effects: '+names)+'</h2>');
  parts.push('<p><em>'+escapeHtml(titleDates)+'</em></p>');
  const allTech=[];
  for(const transit of transits){
    if(transits.length===1){
      parts.push(renderTransitPositionsHtml(transit));
    } else {
      parts.push('<h3>'+escapeHtml(transit.display_when||transit.display_date||transit.date)+'</h3>');
      parts.push(renderTransitPositionsHtml(transit));
    }
    const collected=collectDirectEffectItems(person1, person2, transit);
    if(!collected.items.length){
      parts.push('<p>'+escapeHtml('No direct transit hits'+(person2?' or transit-triggered interactions':'')+' for the activations entered.')+'</p>');
    } else {
      parts.push('<ul class="direct-effects">');
      for(const it of collected.items){
        parts.push('<li>'+escapeHtml(it)+'</li>');
      }
      parts.push('</ul>');
    }
    const days=[collected.d1].concat(collected.d2?[collected.d2]:[]);
    allTech.push(technicalBlock(collected.tUse, days, collected.couple));
  }
  parts.push('<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)</summary><pre>'+escapeHtml(allTech.join('\n\n---\n\n'))+'</pre></details></div>');
  return parts.join('\n');
}

function isDirectTimelineEvent(ev, person1, person2){
  const reasons=ev.reasons||[];
  if(!reasons.length) return false;
  for(const r of reasons){
    if(r.type==='touch' || r.type==='channel' || r.type==='center') return true;
    if(person2 && r.type==='couple') return true;
  }
  return false;
}

function describeDirectTimelineEvent(ev, person1, person2){
  const show=codesOn();
  const planet=ev.planet;
  const to=ev.to||{};
  const theme=gateThemeName(to.gate);
  const hook=show?(planet+' '+to.gl+' ('+theme+')'):(planet+' on '+theme);
  const bits=[];
  const reasons=ev.reasons||[];
  for(const person of [person1].concat(person2?[person2]:[])){
    const mine=reasons.filter(r=>r.who===person.name);
    for(const r of mine){
      if(r.type==='touch') bits.push(person.name+': activates chart gate');
      else if(r.type==='channel') bits.push(person.name+': channel completion/pressure');
      else if(r.type==='center') bits.push(person.name+': center definition');
    }
  }
  const coupleR=reasons.find(r=>r.type==='couple');
  if(coupleR && person2) bits.push('interaction '+person1.name+'/'+person2.name);
  if(!bits.length) bits.push('direct chart hook');
  const gi=gateInfo(to.gate);
  const rw=directRwBit(theme, gi&&gi.center);
  return hook+' — '+bits.join('; ')+rw;
}

function renderDirectEffectsTimelineHtml(person1, person2, meta){
  const parts=[];
  const names=person2?(person1.name+' & '+person2.name):person1.name;
  let events=(meta.events||[]).filter(e=>isDirectTimelineEvent(e, person1, person2));
  if(omitLightsOn()){
    events=events.filter(e=>!isLightPlanet(e.planet));
  }
  if(allGateOnlyOn()){
    events=events.filter(e=>e.gateChanged);
  } else if(!omitLightsOn()){
    if(moonGateOnlyOn()) events=events.filter(e=>e.planet!=='Moon' || e.gateChanged);
    if(sunGateOnlyOn()) events=events.filter(e=>(e.planet!=='Sun' && e.planet!=='Earth') || e.gateChanged);
  }
  parts.push('<h2>'+escapeHtml('Direct effects timeline: '+names)+'</h2>');
  parts.push('<p><em>'+escapeHtml(meta.rangeLabel||'')+'</em></p>');
  if(!events.length){
    parts.push('<p>'+escapeHtml('No direct-effect gate/line ingresses in this window.')+'</p>');
  } else {
    let currentDay=null;
    for(const ev of events){
      if(ev.dayKey!==currentDay){
        currentDay=ev.dayKey;
        parts.push('<h3>'+escapeHtml(currentDay)+'</h3>');
      }
      const para=describeDirectTimelineEvent(ev, person1, person2);
      parts.push('<p><strong>'+escapeHtml(ev.stamp)+'</strong> — '+escapeHtml(para)+'</p>');
    }
  }
  const tech=[];
  tech.push('Timeline window: '+meta.rangeLabel);
  tech.push('Mode: direct-effects-only');
  tech.push('Events shown: '+events.length);
  for(const ev of events){
    tech.push(ev.stamp+' | '+ev.planet+' '+ev.from.gl+' → '+ev.to.gl+' | '+(ev.gateChanged?'gate':'line')+' | reasons: '+(ev.reasons||[]).map(r=>r.type+'@'+r.who).join(', '));
  }
  parts.push('<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)</summary><pre>'+escapeHtml(tech.join('\n'))+'</pre></details></div>');
  return parts.join('\n');
}

function renderNarrativeHtml(person1, person2, transits, meta){
  return renderStructuredSnapshotHtml(person1, person2, transits, meta||{});
  const parts=[];
  const wantIx=interactionsOnlyOn();
  const shortCouple=wantIx && !!person2;
  const shortSolo=wantIx && !person2;
  const shortMode=shortCouple || shortSolo;
  const names=person2? `${person1.name} & ${person2.name}` : person1.name;
  let titleDates;
  if(transits.length===1){
    titleDates = transits[0].display_when || meta.timeLabel || '';
  } else {
    const a=transits[0].display_date||transits[0].date;
    const b=transits[transits.length-1].display_date||transits[transits.length-1].date;
    const t=transits[0].display_time||'';
    titleDates = `${a} to ${b}`+(t?` · ${t}`:'');
  }
  const rw=realWorldOn();
  const titlePrefix = rw
    ? (shortCouple ? 'Real-world interaction potentials: ' : (shortSolo ? 'Real-world short potentials: ' : 'Real-world influence: '))
    : (shortCouple ? 'Interaction story: ' : (shortSolo ? 'Short transit story: ' : 'Transit story: '));
  parts.push(`<h2>${escapeHtml(titlePrefix)}${escapeHtml(names)}</h2>`);
  parts.push(`<p><em>${escapeHtml(titleDates)}</em></p>`);
  if(shortSolo){
    parts.push(`<p><em>${escapeHtml(rw?'Short real-world form for one chart.':'Short form for one chart.')}</em></p>`);
  }
  if(rw){
    parts.push(`<p><em>${escapeHtml('Potentials only—how this sky may amplify not-self patterns in everyday situations. Not predictions.')}</em></p>`);
  }
  if(omitLightsOn()){
    parts.push(`<p><em>${escapeHtml('Sun, Earth, and Moon are omitted from this analysis.')}</em></p>`);
  }

  const themeCount={};
  const allTech=[];

  for(const transitRaw of transits){
    const transit=transitWithoutLights(transitRaw);
    if(transits.length===1){
      parts.push(renderTransitPositionsHtml(transitRaw));
    }
    const days=[];
    const d1=analyzeDay(person1, transit); days.push(d1);
    let d2=null, couple=null;
    if(person2){ d2=analyzeDay(person2, transit); days.push(d2); couple=coupleDynamics(person1, person2, transit); }
    for(const d of days){
      for(const item of d.completed_channels) themeCount[item.channel]=(themeCount[item.channel]||0)+1;
    }
    if(transits.length>1){
      parts.push(`<h3>${escapeHtml(transitRaw.display_when||transitRaw.display_date||transitRaw.date)}</h3>`);
      parts.push(renderTransitPositionsHtml(transitRaw));
    }

    if(shortCouple){
      parts.push(`<p>${escapeHtml(rw
        ? ('A short real-world read of how this sky may amplify not-self between '+person1.name+' and '+person2.name+'—open-center conditioning, shared hooks, and everyday pressure at work or home.')
        : ('A short read of how this sky lands between '+person1.name+' and '+person2.name+'—shared hooks, channels, and amplification—not a full sky overview or separate personal sections.'))}</p>`);
      const items=rw?narrativeInteractionsOnlyRW(person1, person2, couple, transit, d1, d2):narrativeInteractionsOnly(person1, person2, couple, transit, d1, d2);
      for(const para of items) parts.push(`<p>${escapeHtml(para)}</p>`);
    } else if(shortSolo){
      parts.push(`<p>${escapeHtml(rw
        ? ('A short real-world read of how this sky may trigger or amplify '+person1.name+'\'s not-self through open centers, channel completions, and everyday decisions.')
        : ('A short read of how this sky hooks '+person1.name+' directly—same-gate hits, channels completed with the transit, and center weather—not a full sky overview.'))}</p>`);
      const items=rw?narrativePersonShortRW(person1, d1, transit):narrativePersonShort(person1, d1, transit);
      for(const para of items) parts.push(`<p>${escapeHtml(para)}</p>`);
    } else {
      if(rw){
        parts.push(`<p>${escapeHtml('This sky is treated as practical conditioning weather for the chart(s) below—how not-self may get louder in work, home, conversation, and decisions—not as a forecast of events.')}</p>`);
      } else {
        parts.push(`<p>${escapeHtml(narrativeOverview(transit, days))}</p>`);
      }
      parts.push(`<h3>${escapeHtml(person1.name)}</h3>`);
      for(const para of (rw?narrativePersonRW(person1, d1, transit):narrativePerson(person1, d1, transit))) parts.push(`<p>${escapeHtml(para)}</p>`);
      if(person2){
        parts.push(`<h3>${escapeHtml(person2.name)}</h3>`);
        for(const para of (rw?narrativePersonRW(person2, d2, transit):narrativePerson(person2, d2, transit))) parts.push(`<p>${escapeHtml(para)}</p>`);
        parts.push(`<h3>Together</h3>`);
        for(const para of (rw?narrativeCoupleRW(person1, person2, couple, transit, d1, d2):narrativeCouple(person1, person2, couple, transit, d1, d2))) parts.push(`<p>${escapeHtml(para)}</p>`);
      }
    }
    allTech.push(technicalBlock(transit, days, couple));
  }

  if(transits.length>1 && !shortMode){
    parts.push(`<h3>How the themes shift across the range</h3>`);
    const top=Object.entries(themeCount).sort((a,b)=>b[1]-a[1]).slice(0,6);
    if(top.length){
      const list=top.map(([id,n])=>{
        const ch=channelInfo(id);
        const theme=plainChannelName(ch);
        return codesOn()?`${theme} (${id}, on ${n} day${n>1?'s':''})`:`${theme} (on ${n} day${n>1?'s':''})`;
      }).join('; ');
      parts.push(`<p>Across these dates, the weather keeps returning to ${escapeHtml(list)}. Days where those channels close in the sky—or complete with someone’s natal gates—tend to feel louder on the same motifs in work, caretaking, and conversation. Use the quieter days in the range to rest the nervous system and to make agreements that do not need the pressure of a peak transit to hold.</p>`);
    } else {
      parts.push(`<p>Across this range the entered charts do not show a single dominant repeating completion. Treat the period as a sequence of lighter conditioning days, and watch for the one or two dates above where a paragraph felt especially “loud.”</p>`);
    }
  }

  parts.push(`<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)</summary><pre>${escapeHtml(allTech.join('\n\n---\n\n'))}</pre></details></div>`);
  return parts.join('\n');
}



function renderNarrativeMarkdown(person1, person2, transits, meta){
  // Derive markdown from a simplified parallel structure for export
  const tmp=renderNarrativeHtml(person1, person2, transits, meta);
  return tmp
    .replace(/<h2>/g,'# ').replace(/<\/h2>/g,'\n')
    .replace(/<h3>/g,'## ').replace(/<\/h3>/g,'\n')
    .replace(/<p><em>/g,'').replace(/<\/em><\/p>/g,'\n')
    .replace(/<p>/g,'').replace(/<\/p>/g,'\n\n')
    .replace(/<div class="tech"><details class="tech"><summary>Technical details (gates, channels, ephemeris)<\/summary><pre>/g,'\n\n<details><summary>Technical details</summary>\n\n```\n')
    .replace(/<\/pre><\/details><\/div>/g,'\n```\n</details>\n')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
}

function dateRangeList(start, end){
  const out=[];
  let d0=new Date(start+'T12:00:00Z');
  let d1=new Date((end||start)+'T12:00:00Z');
  if(d1<d0) [d0,d1]=[d1,d0];
  for(let d=new Date(d0); d<=d1; d.setUTCDate(d.getUTCDate()+1)) out.push(d.toISOString().slice(0,10));
  return out;
}


const MOTOR_CENTERS = ['Sacral','Solar Plexus','Heart/Ego','Root'];

function centerAdjacencyFromPerson(person){
  const adj={};
  function add(a,b){
    a=normalizeCenterName(a); b=normalizeCenterName(b);
    if(!a||!b||a===b) return;
    (adj[a]||(adj[a]=new Set())).add(b);
    (adj[b]||(adj[b]=new Set())).add(a);
  }
  for(const chId of (person.defined_channels||[])){
    const info=CHANNELS[chId]||channelInfo(chId);
    const centers=(info.centers||[]).map(normalizeCenterName);
    for(let i=0;i<centers.length;i++){
      for(let j=i+1;j<centers.length;j++) add(centers[i], centers[j]);
    }
  }
  return adj;
}

function centersConnected(adj, start, goal){
  start=normalizeCenterName(start); goal=normalizeCenterName(goal);
  if(start===goal) return true;
  if(!adj[start]) return false;
  const seen=new Set([start]);
  const q=[start];
  while(q.length){
    const cur=q.shift();
    for(const n of (adj[cur]||[])){
      if(seen.has(n)) continue;
      if(n===goal) return true;
      seen.add(n); q.push(n);
    }
  }
  return false;
}

function countDefinitionAreas(person){
  const adj=centerAdjacencyFromPerson(person);
  const defined=[...new Set([...person.defined_centers].map(normalizeCenterName))];
  const seen=new Set();
  let areas=0;
  for(const c of defined){
    if(seen.has(c)) continue;
    areas++;
    const q=[c]; seen.add(c);
    while(q.length){
      const cur=q.shift();
      for(const n of (adj[cur]||[])){
        if(seen.has(n)) continue;
        if(defined.includes(n)){ seen.add(n); q.push(n); }
      }
    }
  }
  return areas;
}

function deriveHdProfile(person){
  const defined=new Set([...person.defined_centers].map(normalizeCenterName));
  const has=c=>defined.has(normalizeCenterName(c)) || isCenterDefined(person, c);
  const adj=centerAdjacencyFromPerson(person);
  const areas=countDefinitionAreas(person);
  let type, strategy, authority;
  if(defined.size===0){
    type='Reflector'; strategy='Wait a Lunar Cycle'; authority='Lunar';
  } else {
    const sacral=has('Sacral');
    const throat=has('Throat');
    const sacralToThroat = sacral && throat && centersConnected(adj, 'Sacral', 'Throat');
    if(sacral){
      type = sacralToThroat ? 'Manifesting Generator' : 'Generator';
      strategy = 'To Respond';
    } else {
      const motorsNoSacral=['Heart/Ego','Solar Plexus','Root'];
      let motorToThroat=false;
      if(throat){
        for(const m of motorsNoSacral){
          if(has(m) && centersConnected(adj, m, 'Throat')){ motorToThroat=true; break; }
        }
      }
      if(motorToThroat){ type='Manifestor'; strategy='To Inform'; }
      else { type='Projector'; strategy='Wait for the Invitation'; }
    }
    if(has('Solar Plexus')) authority='Solar Plexus';
    else if(has('Sacral')) authority='Sacral';
    else if(has('Spleen')) authority='Splenic';
    else if(has('Heart/Ego')){
      authority = (throat && centersConnected(adj,'Heart/Ego','Throat')) ? 'Ego Manifested' : 'Ego Projected';
    } else if(has('G') && throat && centersConnected(adj,'G','Throat')) authority='Self-Projected';
    else if(type==='Reflector') authority='Lunar';
    else authority='Mental';
  }
  const typeInfo=(TYPE_NOT_SELF||{})[type]||{};
  let definition='No Definition';
  if(areas===1) definition='Single';
  else if(areas===2) definition='Split';
  else if(areas===3) definition='Triple Split';
  else if(areas>=4) definition='Quadruple Split';
  return {
    type, strategy, authority, definition, areas,
    signature: typeInfo.signature||'',
    theme: typeInfo.theme||'',
    everyday_pull: typeInfo.everyday_pull||''
  };
}

function hangingGatesList(person){
  return [...(person.hanging_gates||[])].sort((a,b)=>a-b);
}

function freshOpenCenterExample(person, center, tracker, salt){
  const name=person.name;
  const pools={
    'Head':[
      'At work, a colleague drops an unsolved puzzle into '+name+'\'s inbox and the mind stays up late arranging answers that were never assigned.',
      'At home, a news clip raises a question that is not '+name+'\'s to settle, yet the pressure to settle it crowds out rest.',
      'In conversation, someone else\'s unfinished thought loops in '+name+'\'s head after the talk ends, as if that inspiration were a personal deadline.'
    ],
    'Ajna':[
      'In a meeting, '+name+' restates a borrowed opinion until it sounds like certainty, then feels stuck defending a concept that was never fixed.',
      'Choosing a school or doctor, '+name+' collects three conflicting theories and tries to force one into permanent truth before the body has settled.',
      'Rewriting a note again and again, '+name+' hunts for wording that feels airtight rather than honest about still thinking.'
    ],
    'Throat':[
      'In a standup, '+name+' speaks just to register presence, then notices the words were for attention more than a clean action.',
      'At dinner, a pause opens and '+name+' fills it with a status update nobody asked for, hoping to be seen.',
      'Sending a chat that could have waited, '+name+' announces a plan before timing or invitation is clear.'
    ],
    'G':[
      'Scrolling profiles or advice threads, '+name+' tries on someone else\'s direction as if the next identity were one click away.',
      'After a move or job change, '+name+' asks friends who they should be here, mistaking borrowed maps for home.',
      'In romance talk, '+name+' looks for confirmation of belonging in the other person\'s certainty instead of sensing place in the body.'
    ],
    'Heart/Ego':[
      'Volunteering for the hard deliverable, '+name+' overcommits to prove worth, then resents the bargain.',
      'At home, '+name+' insists on covering the bill or the favor to feel valuable, even when support was not requested.',
      'In a review, '+name+' argues for credit louder than the work needs, trying to lock willpower into identity.'
    ],
    'Sacral':[
      'Saying yes to one more task after the body already hummed no, '+name+' keeps generating past enough.',
      'At the gym or desk, '+name+' pushes another set or hour because stopping feels like failure rather than satisfaction.',
      'In a group project, '+name+' absorbs everyone else\'s open loops and cannot tell when the tank is empty.'
    ],
    'Solar Plexus':[
      'Avoiding a hard talk, '+name+' absorbs the room\'s mood and calls it keeping peace, then cannot name a personal feeling.',
      'A partner\'s wave rides through '+name+'\'s evening; decisions get postponed not from clarity but from borrowed emotion.',
      'In a charged meeting, '+name+' nods along with the emotional weather instead of waiting out the wave before answering.'
    ],
    'Spleen':[
      'Staying in a chatty group that feels off, '+name+' overrides a quiet intuitive no to avoid seeming difficult.',
      'Holding a role or friendship past its health, '+name+' clings because familiarity feels safer than the body\'s alert.',
      'A spontaneous fear spike from the room makes '+name+' freeze a good choice that intuition already cleared.'
    ],
    'Root':[
      'Racing through errands to shake off pressure that belongs to the calendar, not the body, '+name+' hurries without arrival.',
      'At work, artificial deadlines inflate adrenal rush; '+name+' starts five things to feel free of the pressure.',
      'On a quiet Sunday, borrowed urgency still pushes '+name+' to get ahead, as if rest were unsafe.'
    ]
  };
  const list=pools[center]||['In ordinary choices, '+name+' can feel '+center+' pressure as if it were personal fuel.'];
  const keyPrefix='oc:'+name+':'+center+':';
  for(let i=0;i<list.length;i++){
    const idx=(Math.abs(salt)+i)%list.length;
    const ex=list[idx];
    const key=keyPrefix+idx;
    if(tracker && tracker.usedExamples && tracker.usedExamples.has(key)) continue;
    if(tracker && tracker.usedExamples) tracker.usedExamples.add(key);
    const filtered=typeof registerAndFilterSentence==='function' ? registerAndFilterSentence(tracker, ex) : ex;
    if(filtered) return filtered;
  }
  const ex=list[Math.abs(salt)%list.length];
  if(tracker && tracker.usedExamples) tracker.usedExamples.add(keyPrefix+'fb');
  return (typeof registerAndFilterSentence==='function' ? registerAndFilterSentence(tracker, ex) : null) || ex;
}

function describeExpandedNotSelf(person, day, otherPerson, otherDay, transit, tracker){
  const profile=deriveHdProfile(person);
  const open=openCentersOf(person);
  const defSorted=[...new Set([...person.defined_centers].map(normalizeCenterName))].sort();
  const paras=[];
  const name=person.name;
  const filt=(s)=>{
    if(typeof registerAndFilterSentence==='function'){
      const f=registerAndFilterSentence(tracker, s);
      return f||s;
    }
    return s;
  };

  let p1=name+' is a '+profile.type+' with Strategy "'+profile.strategy+'" and '+profile.authority+' Authority'
    +(profile.definition && profile.definition!=='No Definition' ? (' ('+profile.definition+' definition)') : '')+'. '
    +'Defined centers: '+(defSorted.length?defSorted.join(', '):'none')+'. '
    +'Open centers: '+(open.length?open.join(', '):'none')+'.';
  if(profile.signature){
    p1+=' The Type signature to watch is '+profile.signature+(profile.theme?(' — '+profile.theme):'')+'.';
  }
  paras.push(filt(p1));

  const hanging=hangingGatesList(person).slice(0,8);
  let p2='Under this sky, transit weather can amplify not-self themes that already live in '+name+'\'s design through open centers and Type pressure, not only through planets landing on natal gates.';
  if(hanging.length){
    p2+=' Hanging gates such as '+hanging.map(g=>'Gate '+g+' ('+prettyTheme(gateThemeName(g))+')').join(', ')+' stay sensitive even when a full channel is not completed.';
  }
  if(profile.everyday_pull){
    p2+=' For a '+profile.type+', that can look like '+profile.everyday_pull+'.';
  }
  p2+=' The present field keeps that background available even in centers the sky is not lighting directly.';
  paras.push(filt(p2));

  if(open.length){
    const bits=[];
    open.forEach((c,i)=>{
      const info=centerNotSelfInfo(c)||{};
      const q=info.not_self_question||'';
      const ex=freshOpenCenterExample(person, c, tracker, ((tracker&&tracker.seq)||0)+i*5+name.length);
      bits.push('Open '+c+(q?(' ('+q+')'):'')+': '+ex);
    });
    const mid=Math.ceil(bits.length/2) || bits.length;
    paras.push(bits.slice(0,mid).join(' '));
    if(bits.length>mid) paras.push(bits.slice(mid).join(' '));
  }

  const hits=[];
  for(const t of (day.touches||[])){
    hits.push(planetLabel(t.planet)+' on Gate '+t.transit.gate+' ('+prettyTheme((t.gate&&t.gate.name)||gateThemeName(t.transit.gate))+')');
  }
  for(const item of (day.completed_channels||[])){
    if(item.kind==='electromagnetic'||item.kind==='completion'){
      hits.push(prettyTheme(plainChannelName(item.info||item.channel))+' ('+String(item.kind).replace(/_/g,' ')+')');
    }
  }
  let patternBit;
  if(profile.type==='Manifesting Generator'||profile.type==='Generator')
    patternBit='skipping sacral response and forcing motion until '+profile.signature+' rises';
  else if(profile.type==='Projector')
    patternBit='offering guidance without invitation until bitterness gathers';
  else if(profile.type==='Manifestor')
    patternBit='initiating without informing until anger gathers';
  else
    patternBit='rushing decisions in an unhealthy field until disappointment gathers';

  let p4;
  if(hits.length){
    p4='Hits that are present — '+hits.slice(0,6).join('; ')+(hits.length>6?'…':'')
      +' — are not isolated events. They plug into '+name+'\'s larger not-self pattern: '+patternBit
      +', especially where open centers borrow definition from this sky.';
  } else {
    p4='Even without a direct gate hit, '+name+' can still feel this sky as background conditioning through open centers and hanging gates, feeding the same '+(profile.signature||'not-self')+' pattern the Type already knows.';
  }
  paras.push(filt(p4));
  return paras.filter(Boolean);
}

function describeExpandedCoupleNotSelf(person1, person2, day1, day2, couple, tracker){
  const a=deriveHdProfile(person1);
  const b=deriveHdProfile(person2);
  const open1=openCentersOf(person1);
  const open2=openCentersOf(person2);
  const paras=[];
  const filt=(s)=>{
    if(typeof registerAndFilterSentence==='function'){
      const f=registerAndFilterSentence(tracker, s);
      return f||s;
    }
    return s;
  };
  const def1=[...person1.defined_centers].map(normalizeCenterName);
  const def2=[...person2.defined_centers].map(normalizeCenterName);
  const fillFor1=def2.filter(c=>open1.includes(c));
  const fillFor2=def1.filter(c=>open2.includes(c));

  let p1=person1.name+' ('+a.type+', '+a.authority+' Authority) and '+person2.name+' ('+b.type+', '+b.authority+' Authority) condition each other through definition the other leaves open.';
  if(fillFor1.length){
    p1+=' '+person2.name+'\'s defined '+fillFor1.slice(0,4).join(', ')+' can flood '+person1.name+'\'s open '+fillFor1.slice(0,4).join('/')+' under this sky.';
  }
  if(fillFor2.length){
    p1+=' '+person1.name+'\'s defined '+fillFor2.slice(0,4).join(', ')+' can likewise press '+person2.name+' where those centers are open.';
  }
  paras.push(filt(p1));
  paras.push(filt(person1.name+' may take '+person2.name+'\'s certainty or pace as a cue to skip Strategy ("'+a.strategy+'"), then notice '+a.signature+' afterward.'));
  paras.push(filt(person2.name+' may treat '+person1.name+'\'s defined output as an invitation that was never cleanly given, feeding '+b.signature+'.'));
  paras.push(filt('In a shared decision — work deadline, evening plan, or money talk — the person with definition in a center can sound like truth, while the open partner borrows that weather and only later hears Authority.'));

  const electro=(couple&&couple.electromagnetic)||[];
  const amplified=(couple&&couple.transit_amplified_channels)||[];
  if(amplified.length||electro.length){
    const names=(amplified.length?amplified:electro).slice(0,4).map(c=>prettyTheme(plainChannelName(c))).join(', ');
    paras.push(filt('Bridge channels between them'+(amplified.length?' the transit amplifies: ':' (electromagnetic): ')+names+'. Those bridges can make one person\'s open-center questions louder precisely when the other is defined there.'));
  }
  return paras.filter(Boolean);
}


window.HD = {
  PLANET_ORDER, lonToGateLine, computeTransitField, loadPerson, parseChartText, parseGl,
  analyzeDay, coupleDynamics, renderNarrativeHtml, renderNarrativeMarkdown, dateRangeList,
  trueNodeLon, meanNodeLon, GATE41_START, WHEEL,
  coerceChartObject, deepCloneChart, chartLoadedSummary, validateNatalOrStop, formatActivationList,
  openCentersOf, isCenterDefined, deriveHdProfile, describeExpandedNotSelf, describeExpandedCoupleNotSelf
};
