let mode = "range";
let reportMode = "timeline";
let nowReadingActive = false;
function pad2boot(n) {
  n = String(n | 0);
  return n.length < 2 ? "0" + n : n;
}
function initialLocalToday() {
  const n = /* @__PURE__ */ new Date();
  const y = n.getFullYear(), m = n.getMonth() + 1, d = n.getDate();
  const hh = n.getHours(), mm = n.getMinutes();
  const iso2 = y + "-" + pad2boot(m) + "-" + pad2boot(d);
  const hm = pad2boot(hh) + ":" + pad2boot(mm);
  return { y, m, d, iso: iso2, hh, mm, hm };
}
let __BOOT_TODAY__;
try {
  __BOOT_TODAY__ = initialLocalToday();
} catch (e) {
  __BOOT_TODAY__ = { y: 2026, m: 1, d: 1, iso: "2026-01-01", hh: 12, mm: 0, hm: "12:00" };
}
let startDate = __BOOT_TODAY__ && __BOOT_TODAY__.iso || "2026-01-01";
let endDate = null;
let calViewYear = __BOOT_TODAY__ && __BOOT_TODAY__.y || 2026, calViewMonth = __BOOT_TODAY__ && __BOOT_TODAY__.m || 1;
let rangeNeedsNewStart = true;
let lastHtml = "";
let lastMd = "";
let engReady = false;
const $ = (id) => document.getElementById(id);
function personBoxId(n) {
  return "person" + n;
}
const PERSON_SLOT_MAX = 6;
const personRawStore = { 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };
function getPersonRaw(n) {
  const v = personRawStore[n];
  return v == null ? "" : String(v);
}
function setPersonRaw(n, text) {
  personRawStore[n] = text == null ? "" : String(text);
  try {
    syncPersonInputLabel(n);
  } catch (e) {
  }
}
function personInputIsFilled(n) {
  return !!String(getPersonRaw(n) || "").trim();
}
function syncPersonInputLabel(n) {
  const lab = document.getElementById("personLabel" + n) || document.querySelector('label[for="person' + n + '"]');
  if (!lab) return;
  const filled = personInputIsFilled(n);
  lab.classList.toggle("is-filled", filled);
  lab.classList.toggle("is-empty", !filled);
  try {
    syncPersonGenderFromName(n);
  } catch (e) {
  }
}
function syncAllPersonInputLabels() {
  for (let i = 1; i <= PERSON_SLOT_MAX; i++) {
    try {
      syncPersonInputLabel(i);
    } catch (e) {
    }
  }
}
const KNOWN_MEMBER_GENDER = { dennis: "male", eike: "female", judy: "female", milena: "female", teresa: "female", carolyn: "female" };
const COMMON_FIRST_NAME_GENDER = (function() {
  const map = {};
  const female = "aaliyah,abigail,aisha,aisling,alana,alanna,alejandra,alessandra,alessia,alexa,alexandra,alexia,alia,alice,alicia,alina,alisa,alison,allie,allison,alma,alondra,alyson,alyssa,amanda,amber,ambra,amelia,amina,amira,amy,ana,anastasia,anaya,angela,anika,anisa,anissa,anita,anja,anke,ann,anna,annabelle,anne,annette,annie,annika,antoinette,antonia,anya,aoife,april,aria,ariadna,ariadne,ariana,arianna,arielle,arlene,asha,ashlee,ashleigh,ashley,ashlyn,astrid,athena,audra,audrey,aura,aurelia,aurora,autumn,ava,aviva,ayla,barbara,beate,beatrice,beatrix,beatriz,bela,belen,belinda,bella,bernadette,bernice,bertha,bessie,beth,bethany,betsy,bette,betty,beulah,beverly,bianca,birgit,bonnie,brenda,briana,brianna,bridget,britta,brittany,brittney,bronwyn,caitlin,caitlyn,camila,camilla,camille,candace,candice,candida,cara,carina,carissa,carla,carlotta,carmela,carmella,carmen,carol,carole,carolina,caroline,carolyn,carrie,cassandra,cassie,catalina,catherine,cathy,cecelia,cecile,cecilia,celeste,celia,celina,chana,chantal,chantel,charity,charlene,charlotte,chelsea,cheryl,chiara,chloe,christa,christi,christie,christina,christine,christy,ciara,cicely,cindy,claire,clara,clare,clarissa,claudette,claudia,coleen,colleen,concepcion,connie,constance,consuelo,cora,cordelia,corinne,cristina,crystal,cynthia,dagmar,daisy,danica,daniela,danielle,daphne,daria,darlene,davina,dawn,deanna,deanne,debbie,debora,deborah,debra,dela,delia,delilah,delores,dena,denise,desiree,diana,diane,diann,dianna,dilys,dolores,donatella,donna,dora,doreen,doris,dorothea,dorothy,edith,edna,eike,eileen,ekaterina,elaina,elaine,eleanor,elena,eliana,elisa,elisabeth,elise,eliza,elizabeth,ella,ellen,ellie,elodie,eloise,elsa,elsie,elvira,elyse,emilia,emilie,emily,emma,enid,erica,erika,erin,erminia,esme,esmeralda,esperanza,essie,esther,ethel,ettie,eugenia,eugenie,eunice,eva,evangelina,evangeline,eve,evelyn,evie,fabiola,faith,fannie,fanny,fatima,fay,faye,felicia,fernanda,fiona,flavie,flora,florence,fran,frances,francesca,francisca,frauke,freda,freya,gabi,gabriela,gabriella,gabrielle,gail,gemma,gena,geneva,genevieve,georgia,georgina,geraldine,gertrude,gilda,gina,ginny,giovanna,gisela,giselle,giulia,giuseppina,gladys,glenda,gloria,grace,gracia,gracie,graciela,greta,gretchen,gudrun,gwen,gwendolyn,hailey,halle,hallie,hana,hannah,harriet,hattie,hayley,hazel,heather,heidi,heike,helen,helena,helene,hilary,hilda,hildegard,hilke,hillary,hollie,holly,hope,hortense,ida,ilana,ileana,ilene,ilona,imelda,imogene,ina,ines,ingrid,irene,irina,iris,irma,irmgard,isabel,isabela,isabella,isabelle,isla,iva,ivana,ivy,izabella,jacinta,jacqueline,jade,jane,janelle,janet,janette,janice,janie,janine,janis,jasmin,jasmine,jayla,jayne,jeanette,jeanie,jeanine,jeanne,jeannette,jeannie,jemima,jenifer,jenna,jennifer,jenny,jessica,jill,jillian,joan,joann,joanna,joanne,jocelyn,jodi,johanna,josefa,josefina,josephine,josie,joyce,juana,juanita,judith,judy,julia,juliana,julianna,julie,june,justine,jutta,kaia,kaitlin,kaitlyn,kaleigh,kali,karen,kari,karin,karina,karla,katarina,kate,katelin,katelyn,katharine,katherine,kathie,kathleen,kathrine,kathryn,kathy,katie,katja,katrina,katy,kay,kayla,kaylee,keira,keisha,kendra,kenya,kerstin,kimberly,kira,kirsten,krista,kristen,kristi,kristie,kristin,kristina,kristine,krystal,kyla,kylie,lacey,laila,lana,lara,larissa,latoya,laura,laurel,lauren,laurie,layla,lea,leah,leann,leanna,leanne,leila,leilani,lena,leona,leonora,leticia,lidia,lila,liliana,lillian,lillie,lily,linda,lisa,liselotte,lisette,liz,liza,lizzie,lois,lola,lora,lorena,loretta,lori,lorraine,louise,lourdes,luann,lucia,luciana,lucille,lucy,luisa,luz,lydia,lynda,lynette,lynne,mabel,mable,maddalena,madeline,madelyn,madge,madison,magda,magdalena,maggie,makayla,mallory,mamie,mandy,manon,manuela,mara,marcela,marcella,marcia,margaret,margarete,margarita,margherita,margie,margo,margot,maria,mariah,marian,mariana,marianne,maribel,marie,mariel,mariela,marilyn,marina,marine,marisa,marisol,marissa,maritza,marjorie,marlene,marta,martha,martina,mary,maryann,maryanne,maryellen,mathilde,matilda,maureen,mavis,maxine,may,maya,meagan,megan,meghan,melan,melanie,melinda,melissa,melodie,melody,mercedes,mia,michaela,michela,michelle,mildred,milena,millicent,millie,mindy,minnie,mira,miranda,miriam,misty,mitzi,molly,mona,monica,monika,monique,montserrat,muriel,myra,myrtle,nadia,nadine,nancy,naomi,natalia,natalie,nell,nellie,nettie,nia,niamh,nicole,nicoletta,nieves,nikki,nina,noelle,nola,nora,noreen,norma,nydia,oceane,olga,olivia,opal,ophelia,ornella,ortensia,paige,paloma,pamela,paola,patricia,patsy,paula,paulette,paulina,pauline,pearl,peggy,penelope,petra,phyllis,pia,pilar,polly,prima,priscilla,queen,rachel,rachelle,rae,raffaella,ramona,raquel,rebeca,rebecca,rebekah,regina,renate,renee,rhea,rhoda,rhonda,rita,roberta,rochel,rochelle,ronda,rosa,rosalie,rosalind,rosalinda,rosalyn,roseann,rosemary,rosette,rosie,rossella,rowena,roxana,roxanne,ruby,ruth,sabine,sabrina,saidee,sally,samantha,sandra,sara,sarah,sarai,sarina,scarlett,selena,selene,selma,serena,shakira,shania,shanna,sharon,shauna,shawna,sheila,shelley,shelly,sheri,sherri,sherrie,sherry,sheryl,shirley,silke,silvia,simone,sinead,siobhan,sofia,soledad,solene,sonia,sonja,sonya,sophia,sophie,stacey,stacy,stefania,steffi,stella,stephanie,stephany,sue,susan,susana,susanna,susanne,susie,suzanne,suzette,sybil,sylvia,tabitha,talia,tamara,tami,tammie,tammy,tania,tanja,tanya,tara,tasha,teresa,teri,terra,terri,tess,tessa,thelma,theresa,therese,tia,tiana,tiara,tiffany,tina,tiziana,tonya,traci,tricia,trina,ulla,ulrike,ursula,uta,ute,valentina,valeria,valerie,vandana,vanessa,vera,veronica,vicki,vickie,victoria,vida,viola,violet,virginia,vivian,viviana,waltraud,wanda,wendy,whitney,wiebke,wilhelmina,willa,willow,wilma,winifred,winnie,yolanda,yvette,yvonne,zahra,zara,zelda,zoe,zoey,zofia,zola".split(",");
  const male = "aaron,abdullah,adam,ahmed,alan,albert,alberto,alessandro,alexander,alfonso,alvaro,amir,andre,andreas,andres,andrew,angelo,anthony,antoine,anton,antonio,arnaud,arnie,arno,arnold,art,arthur,arturo,augustus,austin,axel,barney,bart,bartholomew,basil,ben,benito,benjamin,bennie,benny,benoit,bernard,bernardo,bernd,bernhard,bert,bertram,bill,billy,bjorn,bob,brad,bradford,bradley,brandon,brandt,brendan,bret,brian,brock,broderick,bruce,bruno,bryant,bryce,byron,caesar,caleb,calvin,carl,carlo,carlos,carlton,cesar,cesare,chad,charles,chester,christian,christoph,christophe,christopher,cian,cillian,clarence,clark,claude,clay,clayton,cliff,clifford,clifton,clint,clinton,clyde,colin,collin,colm,colton,conrad,craig,curtis,cyril,cyrus,damian,damien,damon,daniel,danny,dante,darius,darrell,darren,darryl,dave,david,davide,dean,declan,denis,dennis,derek,desmond,detlef,dick,diego,dieter,dirk,dmitri,dmitry,domenico,dominic,dominick,don,donald,doug,douglas,duane,duke,duncan,dustin,dwayne,dwight,eamon,eamonn,earl,eddie,edgar,edmond,edmund,eduardo,edward,edwin,ekkehard,eli,elias,elijah,elmer,elton,elvis,emil,emilio,emmanuel,emmett,enrico,enrique,eoin,eric,ernesto,erwin,esteban,ethan,etienne,eugene,evan,everett,ezekiel,ezra,fabian,fabien,fabio,federico,felipe,felix,ferdinand,fergus,fernando,fidel,filippo,fionn,florian,floyd,forrest,francesco,francis,francisco,franck,franco,frank,franklin,fred,freddie,frederic,frederick,fredrick,fritz,gabriel,gael,garrett,gary,gaston,gavin,gene,geoffrey,george,gerald,gerard,gerd,gerhard,giacomo,gilles,gino,giovanni,giuseppe,glen,glenn,gonzalo,gordon,graham,grant,greg,gregg,gregory,guillaume,guillermo,gunter,gunther,gustav,gustavo,gwyn,hamza,hans,hari,harold,harry,harvey,hassan,hector,heinrich,heinz,henri,henry,herbert,herman,hernan,hernando,herve,hiroshi,holger,horace,horacio,howard,hubert,hugh,hugo,humberto,hussein,ian,ibrahim,ignacio,igor,immanuel,irvin,irving,isaac,isaiah,ishmael,ismael,ismail,israel,ivan,ivo,jacek,jack,jacob,jacques,jake,jakob,james,jared,jarrod,jason,javier,jay,jeff,jefferson,jeffrey,jens,jeremy,jerome,jerry,jesus,jim,jimmy,joachim,joaquin,joe,joel,joey,johan,johannes,john,johnny,jon,jonathan,jonathon,jorge,jose,josef,joseph,joshua,josiah,jozef,juan,juergen,julien,julio,julius,jurgen,justin,karim,karl,keith,ken,kenji,kenneth,kenny,kent,kevin,khaled,khalid,kirk,klaus,konrad,kurt,kyle,lamar,lance,larry,lars,laurence,laurent,lawrence,leo,leon,leonard,leonardo,leroy,les,lester,levi,lewis,liam,lloyd,lorenzo,lou,louis,luc,luca,lucas,luigi,luis,luka,luke,malcolm,mandela,manuel,marc,marco,marcus,mario,mark,markus,marshall,martin,marvin,mason,massimo,mateo,mathew,mathias,matteo,matthew,matthias,maurice,max,maxim,maximilian,maximiliano,michael,michel,miguel,mike,milton,mitch,mitchell,mohamed,mohammad,mohammed,morris,moses,mustafa,nathan,nathanael,nathaniel,neal,neil,nelson,niall,nicholas,nick,nicolas,nigel,niklas,niko,nikos,noah,nolan,norman,odhran,olaf,oleg,oliver,olivier,omar,orlando,oscar,osvaldo,othman,otto,owen,pablo,padraig,paolo,pascal,patrick,paul,pavel,peter,petr,phil,philip,philippe,phillip,pierre,pieter,pietro,piotr,preston,qasim,quentin,rafael,ralf,ralph,ramon,randal,randall,randy,raul,ray,raymond,ricardo,richard,rick,ricky,riku,robert,roberto,rod,roderick,rodney,roger,roland,rolando,roman,ron,ronald,ronan,roy,ruairi,ruben,rudolph,rudy,rufus,rupert,russ,russell,ryan,salvador,salvatore,sam,samuel,santiago,saul,scott,sean,sebastian,sebastien,serge,sergei,sergey,sergio,seth,seymour,shane,simon,solomon,stanley,stefan,stefano,stephen,steve,steven,stewart,stuart,sven,sylvain,tadashi,takeshi,ted,teddy,theodore,thierry,thomas,tim,timothy,tobias,todd,tom,tomas,tommaso,tommy,tony,trevor,tyler,tyrone,tyson,udo,ulf,ulrich,ulysses,umberto,uri,uriah,vicente,victor,vincent,vincenzo,virgil,vladimir,volker,wallace,walter,warren,wayne,werner,wilbert,wilbur,wilfred,wilhelm,will,william,willie,wilson,winfried,wolfgang,woody,wyatt,xavier,yahir,yahya,yann,yosef,youssef,yuri,yury,yusuf,yves,zach,zachariah,zachary,zack,zain,zoltan".split(",");
  for (let i = 0; i < female.length; i++) {
    if (female[i]) map[female[i]] = "female";
  }
  for (let i = 0; i < male.length; i++) {
    if (male[i]) map[male[i]] = "male";
  }
  for (const k in KNOWN_MEMBER_GENDER) {
    if (Object.prototype.hasOwnProperty.call(KNOWN_MEMBER_GENDER, k)) map[k] = KNOWN_MEMBER_GENDER[k];
  }
  return map;
})();
const lastGenderNameBySlot = {};
function normalizeGenderValue(v) {
  const s = String(v == null ? "" : v).toLowerCase().trim().replace(/\s+/g, "");
  if (s === "female" || s === "woman" || s === "f" || s === "she" || s === "she/her" || s === "sexf" || s === "f/female") return "female";
  if (s === "male" || s === "man" || s === "m" || s === "he" || s === "he/him" || s === "sexm" || s === "m/male") return "male";
  return "";
}
function normalizeNameKey(name) {
  let s = String(name == null ? "" : name).trim();
  if (!s) return "";
  if (s.indexOf(",") >= 0) {
    const after = s.split(",")[1];
    if (after && after.trim()) s = after.trim();
  }
  s = s.split(/\s+/)[0] || "";
  s = s.replace(/[.'’`´"“”]/g, "");
  try {
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
  }
  return s.toLowerCase();
}
function firstNameMember(n) {
  let s = String(n == null ? "" : n).trim();
  if (!s) return "";
  if (s.indexOf(",") >= 0) {
    const after = s.split(",")[1];
    if (after && after.trim()) s = after.trim();
  }
  return s.split(/\s+/)[0] || "";
}
function knownGenderForName(name) {
  const k = normalizeNameKey(name);
  if (!k) return "";
  if (KNOWN_MEMBER_GENDER[k]) return KNOWN_MEMBER_GENDER[k];
  if (COMMON_FIRST_NAME_GENDER[k]) return COMMON_FIRST_NAME_GENDER[k];
  return "";
}
function genderFromChartFields(raw) {
  if (!raw || typeof raw !== "object") return "";
  return normalizeGenderValue(raw.gender || raw.Gender || raw.sex || raw.Sex || raw.pronouns || raw.Pronouns || raw.pronoun || raw.Pronoun);
}
function getPersonGenderOverride(n) {
  try {
    const el = document.getElementById("personGender" + n);
    return normalizeGenderValue(el && el.value);
  } catch (e) {
    return "";
  }
}
function detectPersonGender(n) {
  try {
    const raw = typeof loadParsedFromBox === "function" ? loadParsedFromBox(n) : null;
    const fromFile = genderFromChartFields(raw);
    if (fromFile) return fromFile;
    const name = (typeof firstNameForSlot === "function" ? firstNameForSlot(n) : "") || raw && rawNameFields(raw) || "";
    return knownGenderForName(name);
  } catch (e) {
    return "";
  }
}
function resolvePersonGender(n) {
  return getPersonGenderOverride(n) || detectPersonGender(n) || "";
}
function getPersonGender(n) {
  return resolvePersonGender(n);
}
function setPersonGenderSelect(n, gender) {
  const el = document.getElementById("personGender" + n);
  if (el) {
    const v = normalizeGenderValue(gender);
    el.value = v || "";
  }
  try {
    updateGenderChip(n);
  } catch (e) {
  }
}
function updateGenderAutoLabel(n) {
  try {
    updateGenderChip(n);
  } catch (e) {
  }
}
function pronounBasisAria(n) {
  const g = resolvePersonGender(n);
  if (g === "female") return "pronoun basis: female, tap to change";
  if (g === "male") return "pronoun basis: male, tap to change";
  return "pronoun basis not set, tap to change";
}
function closeGenderMenu(n) {
  try {
    const menu = document.getElementById("personGenderMenu" + n);
    const chip = document.getElementById("personGenderChip" + n);
    const wrap = document.getElementById("personGenderWrap" + n);
    if (menu) menu.hidden = true;
    if (chip) chip.setAttribute("aria-expanded", "false");
    if (wrap) wrap.classList.remove("is-open");
  } catch (e) {
  }
}
function closeAllGenderMenus(except) {
  const max = typeof PERSON_SLOT_MAX === "number" ? PERSON_SLOT_MAX : 6;
  for (var i = 1; i <= max; i++) {
    if (except && i === except) continue;
    closeGenderMenu(i);
  }
}
function syncGenderMenuState(n) {
  const menu = document.getElementById("personGenderMenu" + n);
  if (!menu) return;
  const over = getPersonGenderOverride(n);
  const btns = menu.querySelectorAll("button[data-gender]");
  for (let i = 0; i < btns.length; i++) {
    const v = btns[i].getAttribute("data-gender") || "";
    const cur = over ? normalizeGenderValue(v) === over : v === "";
    btns[i].classList.toggle("is-current", cur);
    btns[i].setAttribute("aria-pressed", cur ? "true" : "false");
  }
}
function openGenderMenu(n) {
  try {
    if (typeof personInputIsFilled === "function" && !personInputIsFilled(n)) return;
    closeAllGenderMenus(n);
    updateGenderChip(n);
    syncGenderMenuState(n);
    const menu = document.getElementById("personGenderMenu" + n);
    const chip = document.getElementById("personGenderChip" + n);
    const wrap = document.getElementById("personGenderWrap" + n);
    if (menu) menu.hidden = false;
    if (chip) chip.setAttribute("aria-expanded", "true");
    if (wrap) wrap.classList.add("is-open");
  } catch (e) {
  }
}
function toggleGenderMenu(n) {
  const chip = document.getElementById("personGenderChip" + n);
  const open = chip && chip.getAttribute("aria-expanded") === "true";
  if (open) closeGenderMenu(n);
  else openGenderMenu(n);
}
function updateGenderChip(n) {
  try {
    const wrap = document.getElementById("personGenderWrap" + n);
    const chip = document.getElementById("personGenderChip" + n);
    if (!chip) return;
    const filled = typeof personInputIsFilled === "function" && personInputIsFilled(n);
    if (!filled) {
      chip.hidden = true;
      chip.textContent = "";
      closeGenderMenu(n);
      if (wrap) wrap.classList.add("is-vacant");
      return;
    }
    if (wrap) wrap.classList.remove("is-vacant");
    chip.hidden = false;
    const g = resolvePersonGender(n);
    chip.classList.toggle("is-unknown", !g);
    chip.textContent = g ? g : "\u2014";
    chip.setAttribute("aria-label", pronounBasisAria(n));
    if (chip.getAttribute("aria-expanded") === "true") syncGenderMenuState(n);
  } catch (e) {
  }
}
function applyPersonGenderChoice(n, gender) {
  setPersonGenderSelect(n, gender || "");
  closeGenderMenu(n);
  try {
    const chip = document.getElementById("personGenderChip" + n);
    if (chip && chip.focus) chip.focus();
  } catch (e) {
  }
}
function clearGenderNeeded(n) {
  try {
    const wrap = document.getElementById("personGenderWrap" + n);
    if (wrap) wrap.classList.remove("gender-needed");
    const sel = document.getElementById("personGender" + n);
    if (sel) {
      sel.classList.remove("gender-needed");
      sel.removeAttribute("aria-invalid");
    }
    const msg = document.getElementById("genderNeeded" + n);
    if (msg) msg.hidden = true;
  } catch (e) {
  }
}
function markGenderNeeded(n, on) {
  try {
    if (!on) clearGenderNeeded(n);
  } catch (e) {
  }
}
function firstNameForSlot(n) {
  try {
    const raw = loadParsedFromBox(n);
    return firstNameFromRaw(raw, "") || "";
  } catch (e) {
    return "";
  }
}
function syncPersonGenderFromName(n) {
  try {
    clearGenderNeeded(n);
    if (!personInputIsFilled(n)) {
      lastGenderNameBySlot[n] = "";
      setPersonGenderSelect(n, "");
      return;
    }
    const name = firstNameForSlot(n);
    const key = normalizeNameKey(name);
    const prev = lastGenderNameBySlot[n] || "";
    if (key !== prev) {
      lastGenderNameBySlot[n] = key;
      if (prev) setPersonGenderSelect(n, "");
    }
    updateGenderAutoLabel(n);
  } catch (e) {
  }
}
function applyGenderToChart(raw, n) {
  if (!raw || typeof raw !== "object") return raw;
  const g = resolvePersonGender(n);
  const out = {};
  for (const k in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) out[k] = raw[k];
  }
  try {
    delete out.gender;
    delete out.Gender;
    delete out.sex;
    delete out.Sex;
    delete out.pronouns;
    delete out.Pronouns;
    delete out.pronoun;
    delete out.Pronoun;
  } catch (e) {
  }
  if (g) {
    out.gender = g;
    out.pronouns = g === "male" ? "he/him" : "she/her";
  }
  return out;
}
function listFilledMemberSlots() {
  const out = [];
  const max = typeof PERSON_SLOT_MAX === "number" ? PERSON_SLOT_MAX : 6;
  for (var n = 1; n <= max; n++) {
    if (!personInputIsFilled(n)) continue;
    const g = resolvePersonGender(n);
    out.push({
      slot: n,
      name: firstNameForSlot(n) || "Input " + n,
      gender: g,
      pronouns: g === "male" ? "he/him" : g === "female" ? "she/her" : "",
      nameOnly: !g
    });
  }
  return out;
}
function membersMissingGender() {
  return [];
}
function collectMemberGenders() {
  return listFilledMemberSlots().map(function(m) {
    return {
      name: m.name,
      gender: m.gender || "",
      pronouns: m.pronouns || "",
      nameOnly: !!m.nameOnly
    };
  });
}
function promptMissingGender() {
  return "";
}
function wirePersonGenderSelects() {
  const max = typeof PERSON_SLOT_MAX === "number" ? PERSON_SLOT_MAX : 6;
  for (var n = 1; n <= max; n++) {
    (function(slot) {
      const chip = document.getElementById("personGenderChip" + slot);
      const menu = document.getElementById("personGenderMenu" + slot);
      if (chip) {
        chip.addEventListener("click", function(ev) {
          try {
            ev.preventDefault();
            ev.stopPropagation();
          } catch (e) {
          }
          toggleGenderMenu(slot);
        });
        chip.addEventListener("keydown", function(ev) {
          const key = ev && ev.key;
          if (key === "Escape") {
            closeGenderMenu(slot);
            return;
          }
          if (key === "ArrowDown" || key === "Enter" || key === " ") {
            if (chip.getAttribute("aria-expanded") !== "true") {
              if (key === "ArrowDown") {
                ev.preventDefault();
                openGenderMenu(slot);
              }
            }
            if (key === "ArrowDown" && menu) {
              ev.preventDefault();
              const first = menu.querySelector("button");
              if (first && first.focus) first.focus();
            }
          }
        });
      }
      if (menu) {
        menu.addEventListener("click", function(ev) {
          try {
            ev.stopPropagation();
          } catch (e) {
          }
          const btn = ev.target && ev.target.closest ? ev.target.closest("button[data-gender]") : null;
          if (!btn) return;
          applyPersonGenderChoice(slot, btn.getAttribute("data-gender") || "");
        });
        menu.addEventListener("keydown", function(ev) {
          const key = ev && ev.key;
          const btns = Array.prototype.slice.call(menu.querySelectorAll("button[data-gender]"));
          const i = btns.indexOf(document.activeElement);
          if (key === "Escape") {
            ev.preventDefault();
            closeGenderMenu(slot);
            if (chip && chip.focus) chip.focus();
            return;
          }
          if (key === "ArrowRight" || key === "ArrowDown") {
            ev.preventDefault();
            const next = btns[(i < 0 ? 0 : i + 1) % btns.length];
            if (next && next.focus) next.focus();
          }
          if (key === "ArrowLeft" || key === "ArrowUp") {
            ev.preventDefault();
            const prev = btns[(i < 0 ? 0 : i - 1 + btns.length) % btns.length];
            if (prev && prev.focus) prev.focus();
          }
        });
      }
    })(n);
    try {
      syncPersonGenderFromName(n);
    } catch (e) {
    }
  }
  if (!wirePersonGenderSelects._docWired) {
    wirePersonGenderSelects._docWired = true;
    document.addEventListener("click", function(ev) {
      try {
        const t = ev.target;
        if (t && t.closest && t.closest(".person-gender-wrap")) return;
        closeAllGenderMenus();
      } catch (e) {
      }
    });
    document.addEventListener("keydown", function(ev) {
      if (ev && ev.key === "Escape") closeAllGenderMenus();
    });
  }
}
function loadParsedFromBox(n) {
  try {
    const raw = String(getPersonRaw(n) || "").trim();
    if (!raw) return null;
    return parseInput(raw) || null;
  } catch (e) {
    return null;
  }
}
function selectedPeopleFromBoxes() {
  const p1 = loadParsedFromBox(1);
  const extras = [];
  for (let n = 2; n <= 6; n++) {
    const raw = loadParsedFromBox(n);
    if (raw) extras.push({ raw, slot: n });
  }
  return {
    p1,
    p2: extras[0] ? extras[0].raw : null,
    p3: extras[1] ? extras[1].raw : null,
    extrasRaw: extras.map(function(e) {
      return e.raw;
    }),
    extraSlots: extras.map(function(e) {
      return e.slot;
    }),
    p2slot: extras[0] ? extras[0].slot : null,
    p3slot: extras[1] ? extras[1].slot : null,
    extraCount: extras.length,
    anyExtra: extras.length > 0
  };
}
function rawNameFields(raw) {
  let obj = raw;
  if (obj == null) return "";
  if (typeof obj === "string") {
    const t = obj.trim();
    if (!t) return "";
    if (t.charAt(0) === "{") {
      try {
        obj = JSON.parse(t);
      } catch (e) {
        return "";
      }
    } else return "";
  }
  if (typeof obj !== "object") return "";
  const keys = ["name", "Natal Name", "Name", "fullName", "label", "displayName", "firstName", "First Name", "natalName", "personName"];
  for (let i = 0; i < keys.length; i++) {
    const v = obj[keys[i]];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}
function firstNameFromRaw(raw, fallback) {
  try {
    const n = firstNameMember(rawNameFields(raw));
    if (n) return n;
  } catch (e) {
  }
  return fallback || "Member";
}
function listSelectedMemberSlots() {
  const sel = selectedPeopleFromBoxes();
  const out = [];
  if (sel.p1) out.push({ slot: 1, raw: sel.p1, name: firstNameFromRaw(sel.p1, "Person 1") });
  (sel.extraSlots || []).forEach(function(slot, i) {
    const raw = sel.extrasRaw[i];
    out.push({ slot, raw, name: firstNameFromRaw(raw, "Person " + slot) });
  });
  return out;
}
function memberPairKey(slotA, slotB) {
  return String(slotA) + "-" + String(slotB);
}
function listPossiblePairs(members) {
  const list = members || listSelectedMemberSlots();
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push({
        a: list[i],
        b: list[j],
        key: memberPairKey(list[i].slot, list[j].slot),
        label: (list[i].name || "Member") + " & " + (list[j].name || "Member")
      });
    }
  }
  return pairs;
}
function renderBetweenPairSelector() {
  const wrap = $("betweenPairWrap");
  const listEl = $("betweenPairList");
  if (!wrap || !listEl) return;
  const members = listSelectedMemberSlots();
  const pairs = listPossiblePairs(members);
  const show = members.length >= 2;
  wrap.hidden = !show;
  if (!show) {
    listEl.innerHTML = "";
    return;
  }
  const prev = {};
  listEl.querySelectorAll("input[data-pair-key]").forEach(function(cb) {
    prev[cb.getAttribute("data-pair-key")] = !!cb.checked;
  });
  const parts = [];
  for (let i = 0; i < pairs.length; i++) {
    const pr = pairs[i];
    const checked = prev[pr.key] === void 0 ? true : prev[pr.key];
    parts.push('<label class="check"><input type="checkbox" data-pair-key="' + pr.key + '" id="betweenPair-' + pr.key + '"' + (checked ? " checked" : "") + " /> " + pr.label + "</label>");
  }
  listEl.innerHTML = parts.join("");
  const hint = $("betweenPairHint");
  if (hint) {
    hint.textContent = members.length > 3 ? "Choose which pairs to include. All pairs are selected by default. With more than three members, Between uses a shorter form per pair per day." : "Choose which pairs to include. All pairs are selected by default.";
  }
}
function getSelectedBetweenPairKeys() {
  const listEl = $("betweenPairList");
  const boxes = listEl ? listEl.querySelectorAll("input[data-pair-key]") : [];
  if (!boxes.length) {
    return listPossiblePairs().map(function(pr) {
      return pr.key;
    });
  }
  const keys = [];
  boxes.forEach(function(cb) {
    if (cb.checked) keys.push(cb.getAttribute("data-pair-key"));
  });
  return keys;
}
function ensureMemberSlotVisible(n) {
  if (n >= 4) {
    const d = $("moreMembers");
    if (d) d.open = true;
  }
}
const status = (msg, cls = "") => {
  const s = $("status");
  if (!s) return;
  s.textContent = msg;
  s.className = "status " + (cls || "");
};
const TIMEZONES = [
  { id: "local", label: "Local browser time" },
  { id: "UTC", label: "UTC" },
  { id: "America/New_York", label: "America/New_York" },
  { id: "America/Chicago", label: "America/Chicago" },
  { id: "America/Denver", label: "America/Denver" },
  { id: "America/Los_Angeles", label: "America/Los_Angeles" },
  { id: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { id: "Europe/London", label: "Europe/London" },
  { id: "Europe/Berlin", label: "Europe/Berlin" },
  { id: "Europe/Paris", label: "Europe/Paris" },
  { id: "Europe/Moscow", label: "Europe/Moscow" },
  { id: "Asia/Dubai", label: "Asia/Dubai" },
  { id: "Asia/Kolkata", label: "Asia/Kolkata" },
  { id: "Asia/Bangkok", label: "Asia/Bangkok" },
  { id: "Asia/Shanghai", label: "Asia/Shanghai" },
  { id: "Asia/Tokyo", label: "Asia/Tokyo" },
  { id: "Australia/Sydney", label: "Australia/Sydney" },
  { id: "Pacific/Auckland", label: "Pacific/Auckland" }
];
function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function resolveTzId(tz) {
  if (!tz || tz === "local") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (e) {
      return "UTC";
    }
  }
  return tz;
}
function formatDisplayDateTime(date, timeZone) {
  const tz = resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: void 0,
    hour12: true,
    timeZoneName: "short"
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")} at ${get("hour")}:${get("minute")} ${get("dayPeriod")} (${get("timeZoneName")})`;
}
function formatDisplayDateOnly(date, timeZone) {
  const tz = resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}
function formatDisplayTimeOnly(date, timeZone) {
  const tz = resolveTzId(timeZone);
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).formatToParts(d);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  return `${get("hour")}:${get("minute")} ${get("dayPeriod")} (${get("timeZoneName")})`;
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function normalizeHm(s, fallback) {
  const m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallback || "00:00";
  let h = +m[1], mi = +m[2];
  if (!(h >= 0 && h <= 23)) h = 0;
  if (!(mi >= 0 && mi <= 59)) mi = 0;
  return pad2(h) + ":" + pad2(mi);
}
function formatHm12(hm) {
  const parts = normalizeHm(hm, "00:00").split(":");
  const h = +parts[0], mi = +parts[1];
  const ap = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + ":" + pad2(mi) + " " + ap;
}
function getRangeStartHm() {
  const el = $("timeFrom");
  return normalizeHm(el && el.value, typeof initialLocalToday === "function" && initialLocalToday().hm || "12:00");
}
function getRangeEndHm() {
  const el = $("timeTo");
  return normalizeHm(el && el.value, "23:59");
}
function updateTimeReadout(inputId, labelId) {
  const el = $(inputId), lab = $(labelId);
  if (!lab) return;
  lab.textContent = el && el.value ? formatHm12(el.value) : "";
}
function syncRangeTimeReadouts() {
  updateTimeReadout("timeFrom", "timeFromLabel");
  updateTimeReadout("timeTo", "timeToLabel");
}
function setRangeTimeInputs(startHm, endHm) {
  const a = $("timeFrom"), b = $("timeTo");
  if (a) a.value = normalizeHm(startHm, "12:00");
  if (b) b.value = normalizeHm(endHm, "23:59");
  syncRangeTimeReadouts();
}
function getQueryWindow(tz) {
  tz = tz || ($("tz") && $("tz").value || "local");
  if (mode !== "range") {
    const startMs2 = zonedTimeToUtc(startDate, "00:00", tz).getTime();
    const endExclusiveMs = zonedTimeToUtc(typeof addCalendarDays === "function" ? addCalendarDays(startDate, 1) : startDate, "00:00", tz).getTime();
    return { tz, startMs: startMs2, endMs: endExclusiveMs - 6e4, endExclusiveMs, startDate, endDate: startDate, startHm: "00:00", endHm: "23:59", isRange: false };
  }
  const from = startDate;
  const to = endDate || startDate;
  const startHm = getRangeStartHm();
  const endHm = getRangeEndHm();
  const startMs = zonedTimeToUtc(from, startHm, tz).getTime();
  const endMs = zonedTimeToUtc(to, endHm, tz).getTime();
  return { tz, startMs, endMs, endExclusiveMs: endMs + 6e4, startDate: from, endDate: to, startHm, endHm, isRange: true };
}
function queryWindowIsValid(w) {
  return !!(w && w.startMs != null && w.endMs != null && w.endMs > w.startMs);
}
function formatQueryWindowLabel(w) {
  if (!w) return "";
  if (!w.isRange) return formatDisplayDateOnly(new Date(w.startMs), w.tz) + " \xB7 full local day";
  return formatDisplayDateTime(new Date(w.startMs), w.tz) + " to " + formatDisplayDateTime(new Date(w.endMs), w.tz);
}
function applyQueryWindowGlobal(w) {
  try {
    if (w && w.isRange) {
      window.__RANGE_WINDOW__ = {
        startMs: w.startMs,
        endMs: w.endMs,
        endExclusiveMs: w.endExclusiveMs,
        tz: w.tz,
        startLabel: formatDisplayDateTime(new Date(w.startMs), w.tz),
        endLabel: formatDisplayDateTime(new Date(w.endMs), w.tz)
      };
    } else {
      window.__RANGE_WINDOW__ = null;
    }
  } catch (e) {
    try {
      window.__RANGE_WINDOW__ = null;
    } catch (_e) {
    }
  }
}
function syncTimeHiddenFrom12() {
  var _a, _b, _c;
  const h12 = +(((_a = $("hour12")) == null ? void 0 : _a.value) || 12);
  const mi = +(((_b = $("minute")) == null ? void 0 : _b.value) || 0);
  const ap = ((_c = $("ampm")) == null ? void 0 : _c.value) || "AM";
  let h24 = h12 % 12;
  if (ap === "PM") h24 += 12;
  $("timeOfDay").value = pad2(h24) + ":" + pad2(mi);
  clearNowReading();
}
function setTime12From24(timeStr) {
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  const ap = hh >= 12 ? "PM" : "AM";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  if ($("hour12")) $("hour12").value = String(h12);
  if ($("minute")) $("minute").value = pad2(mm || 0);
  if ($("ampm")) $("ampm").value = ap;
  $("timeOfDay").value = pad2(hh || 0) + ":" + pad2(mm || 0);
}
function initTime12Controls() {
  const hsel = $("hour12"), msel = $("minute");
  if (!hsel || hsel.options.length) return;
  for (let h = 1; h <= 12; h++) {
    const o = document.createElement("option");
    o.value = String(h);
    o.textContent = String(h);
    hsel.appendChild(o);
  }
  for (let m = 0; m < 60; m++) {
    const o = document.createElement("option");
    o.value = pad2(m);
    o.textContent = pad2(m);
    msel.appendChild(o);
  }
  const sync = () => syncTimeHiddenFrom12();
  hsel.onchange = sync;
  msel.onchange = sync;
  $("ampm").onchange = sync;
  setTime12From24($("timeOfDay") && $("timeOfDay").value || initialLocalToday().hm);
}
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  if (timeZone === "UTC") return new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
  if (timeZone === "local") return new Date(y, mo - 1, d, hh, mm, 0);
  const utcGuess = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  function partsInZone(ms) {
    const parts = formatter.formatToParts(new Date(ms));
    const get = (t) => +parts.find((p) => p.type === t).value;
    return { y: get("year"), mo: get("month"), d: get("day"), h: get("hour") % 24, mi: get("minute"), s: get("second") };
  }
  const want = (d * 24 + hh) * 60 + mm;
  let lo = utcGuess - 36 * 3600 * 1e3, hi = utcGuess + 36 * 3600 * 1e3;
  for (let i = 0; i < 40; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const p = partsInZone(mid);
    const cmp = p.y - y || p.mo - mo || p.d - d || p.h - hh || p.mi - mm;
    if (cmp === 0) return new Date(mid);
    if (cmp < 0) lo = mid + 6e4;
    else hi = mid - 6e4;
  }
  return new Date(Math.floor((lo + hi) / 2));
}
function fillTimezones() {
  const sel = $("tz");
  if (!sel) return;
  sel.innerHTML = "";
  for (const z of TIMEZONES) {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = z.label;
    sel.appendChild(opt);
  }
  sel.value = "local";
}
function monthName(y, m) {
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}
function shiftMonth(y, m, delta) {
  const d = new Date(y, m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}
function formatFriendlyDate(isoStr) {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).formatToParts(dt);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}
function selectionRangeText() {
  if (!startDate) return "No date selected";
  if (mode === "single" || !endDate) return formatFriendlyDate(startDate);
  return formatFriendlyDate(startDate) + " at " + formatHm12(getRangeStartHm()) + " to " + formatFriendlyDate(endDate) + " at " + formatHm12(getRangeEndHm());
}
function rangeDayCount() {
  if (!startDate) return 0;
  const a = startDate, b = endDate || startDate;
  const d0 = /* @__PURE__ */ new Date(a + "T12:00:00Z"), d1 = /* @__PURE__ */ new Date(b + "T12:00:00Z");
  return Math.floor(Math.abs(d1 - d0) / 864e5) + 1;
}
function updateRangeHint() {
  const el = $("rangeHint");
  if (!el) return;
  el.classList.remove("warn");
  if (mode !== "range") {
    el.textContent = "";
    return;
  }
  if (!endDate) {
    el.textContent = "Range start selected (" + formatFriendlyDate(startDate) + "). Use \u2039 \u203A to change months \u2014 the start stays selected \u2014 then click the end date (or edit To). Clicking an earlier day swaps start/end.";
    return;
  }
  const n = rangeDayCount();
  const cap = reportMode === "timeline" ? 31 : 62;
  if (n > cap) {
    el.classList.add("warn");
    el.textContent = "Selected range is " + n + " days. " + (reportMode === "timeline" ? "Timeline is limited to 31 days \u2014 shorten the range before running." : "This browser build allows at most 62 days \u2014 shorten the range before running.");
  } else {
    let msg = n + " day" + (n === 1 ? "" : "s") + " selected" + (reportMode === "timeline" ? " (timeline cap 31)" : "") + ".";
    try {
      const w = getQueryWindow();
      if (w && w.isRange) {
        msg += " Window: " + formatHm12(w.startHm) + " to " + formatHm12(w.endHm) + " (local to the selected timezone).";
        if (!queryWindowIsValid(w)) {
          el.classList.add("warn");
          el.textContent = "The end date and time must be after the start date and time. Please adjust From/To.";
          return;
        }
      }
    } catch (e) {
    }
    el.textContent = msg;
  }
}
function syncDateInputsFromState() {
  const from = $("dateFrom"), to = $("dateTo");
  if (from) from.value = startDate || "";
  if (to) {
    to.value = mode === "range" ? endDate || startDate || "" : startDate || "";
    to.disabled = mode !== "range" || typeof timeTransitBasedOn === "function" && !timeTransitBasedOn();
  }
}
function applyDateInputsToState() {
  var _a, _b;
  clearNowReading();
  const from = (((_a = $("dateFrom")) == null ? void 0 : _a.value) || "").trim();
  const to = (((_b = $("dateTo")) == null ? void 0 : _b.value) || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return;
  if (mode === "single") {
    startDate = from;
    endDate = null;
    rangeNeedsNewStart = true;
  } else {
    let a = from, b = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : null;
    if (b && b < a) {
      const t = a;
      a = b;
      b = t;
    }
    startDate = a;
    endDate = b;
    rangeNeedsNewStart = !b;
  }
  const [y, m] = startDate.split("-").map(Number);
  calViewYear = y;
  calViewMonth = m;
  const monthEl = $("month");
  if (monthEl) monthEl.value = iso(calViewYear, calViewMonth, 1).slice(0, 7);
  renderCalendar();
}
function dayClassFor(id) {
  const cls = ["day"];
  if (mode === "single") {
    if (id === startDate) cls.push("selected");
  } else {
    if (id === startDate) cls.push("start");
    if (endDate && id === endDate) cls.push("end");
    if (endDate && id > startDate && id < endDate) cls.push("inrange");
    if (!endDate && id === startDate) cls.push("selected");
  }
  return cls.join(" ");
}
function buildMonthGrid(y, m) {
  const wrap = document.createElement("div");
  wrap.className = "calendar";
  const label = document.createElement("div");
  label.className = "cal-month-label";
  label.textContent = monthName(y, m);
  wrap.appendChild(label);
  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "dow";
    el.textContent = d;
    wrap.appendChild(el);
  });
  const first = new Date(y, m - 1, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prev = shiftMonth(y, m, -1);
  const prevDays = new Date(y, m - 1, 0).getDate();
  for (let i = 0; i < startWeekday; i++) {
    const dayNum = prevDays - startWeekday + i + 1;
    const id = iso(prev.y, prev.m, dayNum);
    const el = document.createElement("div");
    el.className = dayClassFor(id) + " other-month";
    el.textContent = dayNum;
    el.title = id;
    el.onclick = () => onPick(id);
    wrap.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const id = iso(y, m, d);
    const el = document.createElement("div");
    el.className = dayClassFor(id);
    el.textContent = d;
    el.title = id;
    el.onclick = () => onPick(id);
    wrap.appendChild(el);
  }
  const cellsSoFar = startWeekday + daysInMonth;
  const trail = (7 - cellsSoFar % 7) % 7;
  const next = shiftMonth(y, m, 1);
  for (let d = 1; d <= trail; d++) {
    const id = iso(next.y, next.m, d);
    const el = document.createElement("div");
    el.className = dayClassFor(id) + " other-month";
    el.textContent = d;
    el.title = id;
    el.onclick = () => onPick(id);
    wrap.appendChild(el);
  }
  return wrap;
}
function renderCalendar() {
  const monthEl = $("month");
  if (monthEl && monthEl.value) {
    const [ys, ms] = monthEl.value.split("-").map(Number);
    if (ys && ms) {
      calViewYear = ys;
      calViewMonth = ms;
    }
  }
  const cal = $("calendar");
  if (!cal) return;
  cal.innerHTML = "";
  const left = { y: calViewYear, m: calViewMonth };
  const right = shiftMonth(calViewYear, calViewMonth, 1);
  cal.appendChild(buildMonthGrid(left.y, left.m));
  cal.appendChild(buildMonthGrid(right.y, right.m));
  const viewLab = $("calViewLabel");
  if (viewLab) {
    viewLab.textContent = left.y === right.y ? new Date(left.y, left.m - 1, 1).toLocaleString("en-US", { month: "long" }) + " \u2013 " + new Date(right.y, right.m - 1, 1).toLocaleString("en-US", { month: "long" }) + " " + left.y : monthName(left.y, left.m) + " \u2013 " + monthName(right.y, right.m);
  }
  const sel = $("selectionLabel");
  if (sel) {
    if (sel.tagName === "INPUT") sel.value = selectionRangeText();
    else sel.textContent = selectionRangeText();
  }
  syncDateInputsFromState();
  updateRangeHint();
}
function onPick(id) {
  clearNowReading();
  if (mode === "single") {
    startDate = id;
    endDate = null;
  } else {
    if (rangeNeedsNewStart || !startDate || startDate && endDate) {
      startDate = id;
      endDate = null;
      rangeNeedsNewStart = false;
    } else if (id < startDate) {
      endDate = startDate;
      startDate = id;
    } else if (id === startDate) {
      endDate = id;
    } else endDate = id;
  }
  const [py, pm] = id.split("-").map(Number);
  const left = calViewYear * 12 + calViewMonth;
  const right = left + 1;
  const picked = py * 12 + pm;
  if (picked < left || picked > right) {
    calViewYear = py;
    calViewMonth = pm;
    const monthEl = $("month");
    if (monthEl) monthEl.value = iso(py, pm, 1).slice(0, 7);
  }
  renderCalendar();
}
function calPrevMonth() {
  const s = shiftMonth(calViewYear, calViewMonth, -1);
  calViewYear = s.y;
  calViewMonth = s.m;
  const monthEl = $("month");
  if (monthEl) monthEl.value = iso(s.y, s.m, 1).slice(0, 7);
  renderCalendar();
}
function calNextMonth() {
  const s = shiftMonth(calViewYear, calViewMonth, 1);
  calViewYear = s.y;
  calViewMonth = s.m;
  const monthEl = $("month");
  if (monthEl) monthEl.value = iso(s.y, s.m, 1).slice(0, 7);
  renderCalendar();
}
function clearPerson(n) {
  setPersonRaw(n, "");
  const file = $("file" + n);
  if (file) file.value = "";
  const box = $("pngBox" + n);
  if (box) box.style.display = "none";
  const img = $("pngImg" + n);
  if (img) {
    img.removeAttribute("src");
    try {
      img.src = "";
    } catch (e) {
    }
  }
  const manName = $("manName" + n);
  if (manName) manName.value = "";
  const manGates = $("manGates" + n);
  if (manGates) manGates.value = "";
  const st = $("chartStatus" + n);
  if (st) {
    st.textContent = "";
    st.className = "chart-status";
  }
  clearQuickLoadHighlight(n);
  try {
    if (typeof syncExtraOutputOpts === "function") syncExtraOutputOpts();
  } catch (e) {
  }
  status("Cleared Person " + n + " \u2014 slot is empty", "ok");
}
function omitLightsOn() {
  var _a;
  try {
    return !!((_a = document.getElementById("omitLights")) == null ? void 0 : _a.checked);
  } catch (e) {
    return false;
  }
}
function allGateOnlyOn() {
  var _a;
  try {
    return !!((_a = document.getElementById("allGateOnly")) == null ? void 0 : _a.checked);
  } catch (e) {
    return false;
  }
}
function syncOmitLightsUI() {
  const omit = typeof omitLightsOn === "function" ? omitLightsOn() : !!(document.getElementById("omitLights") && document.getElementById("omitLights").checked);
  const allGate = typeof allGateOnlyOn === "function" ? allGateOnlyOn() : !!(document.getElementById("allGateOnly") && document.getElementById("allGateOnly").checked);
  const override = omit || allGate;
  for (const id of ["moonGateOnly", "sunGateOnly"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.disabled = !!override;
    const lab = el.closest("label");
    if (lab) {
      lab.style.opacity = override ? "0.45" : "";
      lab.style.pointerEvents = override ? "none" : "";
    }
  }
  for (const hid of ["moonGateOnlyHint", "sunGateOnlyHint"]) {
    const h = document.getElementById(hid);
    if (h) h.style.opacity = override ? "0.45" : "";
  }
}
function syncNowBtnHighlight() {
  const btn = document.getElementById("nowBtn");
  if (!btn) return;
  btn.classList.toggle("active", !!nowReadingActive);
  btn.setAttribute("aria-pressed", nowReadingActive ? "true" : "false");
}
function clearNowReading() {
  nowReadingActive = false;
  syncNowBtnHighlight();
}
function markNowReading() {
  nowReadingActive = true;
  syncNowBtnHighlight();
}
function syncRangeTransitFieldOpt() {
  const show = mode === "range";
  const wrap = $("rangeReportOpts");
  if (wrap) wrap.style.display = show ? "" : "none";
  ["rangeFullDescOpt", "rangeFullDescHint", "rangeBriefDescOpt", "rangeBriefDescHint", "rangeTransitFieldOpt", "rangeTransitFieldHint"].forEach((id) => {
    const el = $(id);
    if (el && !wrap) el.style.display = show ? "" : "none";
  });
}
function syncWhenModeHighlight() {
  const ms = $("modeSingle"), mr = $("modeRange");
  const isSingle = mode === "single";
  if (ms) {
    ms.classList.toggle("active", isSingle);
    ms.setAttribute("aria-pressed", isSingle ? "true" : "false");
  }
  if (mr) {
    mr.classList.toggle("active", !isSingle);
    mr.setAttribute("aria-pressed", !isSingle ? "true" : "false");
  }
  try {
    document.body.classList.toggle("when-mode-single", isSingle);
    document.body.classList.toggle("when-mode-range", !isSingle);
  } catch (e) {
  }
  try {
    syncRangeTimeReadouts();
  } catch (e) {
  }
  try {
    if (typeof updateRangeHint === "function") updateRangeHint();
  } catch (e) {
  }
  syncRangeTransitFieldOpt();
}
function clearDates() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  startDate = iso(y, m, d);
  endDate = null;
  rangeNeedsNewStart = true;
  mode = "single";
  clearNowReading();
  syncWhenModeHighlight();
  calViewYear = y;
  calViewMonth = m;
  const monthEl = $("month");
  if (monthEl) monthEl.value = iso(y, m, 1).slice(0, 7);
  renderCalendar();
  status("Date selection reset to today (single day)", "ok");
}
function parseInput(text) {
  text = (text || "").trim();
  if (!text) return null;
  if (text.startsWith("{")) return JSON.parse(text);
  return text;
}
const BUILTIN_QUICK_KEYS = ["dennis", "eike", "judy", "carolyn", "milena", "teresa"];
const USER_QUICK_STORAGE_KEY = "ta_user_quick_slots_v1";
const USER_QUICK_SLOT_COUNT = 6;
function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function safeLocalStorageSet(key, val) {
  try {
    localStorage.setItem(key, val);
    return true;
  } catch (e) {
    return false;
  }
}
function safeLocalStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}
function emptyUserSlotArray() {
  const a = [];
  for (let i = 0; i < USER_QUICK_SLOT_COUNT; i++) a.push(null);
  return a;
}
function loadUserQuickSlots() {
  const raw = safeLocalStorageGet(USER_QUICK_STORAGE_KEY);
  if (!raw) return emptyUserSlotArray();
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.slots) ? parsed.slots : null;
    if (!arr) return emptyUserSlotArray();
    const out = emptyUserSlotArray();
    for (let i = 0; i < USER_QUICK_SLOT_COUNT; i++) {
      const s = arr[i];
      if (!s || typeof s !== "object" || !s.chart) {
        out[i] = null;
        continue;
      }
      const label = String(s.label || s.name || "Saved").trim() || "Saved";
      const key = String(s.key || "user_" + i + "_" + label).trim();
      out[i] = { key, label, chart: s.chart };
    }
    return out;
  } catch (e) {
    return emptyUserSlotArray();
  }
}
function saveUserQuickSlots(slots) {
  const clean = [];
  for (let i = 0; i < USER_QUICK_SLOT_COUNT; i++) {
    const s = slots[i];
    if (!s || !s.chart) {
      clean.push(null);
      continue;
    }
    clean.push({ key: s.key, label: s.label, chart: s.chart });
  }
  const ok = safeLocalStorageSet(USER_QUICK_STORAGE_KEY, JSON.stringify(clean));
  if (!ok) status("Could not save quick-load slot (browser storage blocked or full). Chart is still in the input.", "err");
  return ok;
}
function findUserQuickSlotByKey(key) {
  if (!key) return null;
  const slots = loadUserQuickSlots();
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] && slots[i].key === key) return { index: i, slot: slots[i] };
  }
  return null;
}
function firstNameFromChartOrFile(chart, fallbackName) {
  let nm = chart && chart.name ? String(chart.name).trim() : "";
  if (!nm && fallbackName) nm = String(fallbackName).trim();
  if (!nm) return "Saved";
  return nm.split(/\s+/)[0] || "Saved";
}
function slugUserQuickKey(label) {
  const base = String(label || "saved").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return "user_" + (base || "s" + Date.now());
}
function builtinKeyForLabel(label) {
  const want = String(label || "").trim().toLowerCase();
  if (!want) return null;
  const root = sampleDataRoot();
  for (const key of BUILTIN_QUICK_KEYS) {
    const lab = sampleButtonLabel(key);
    if (String(lab).trim().toLowerCase() === want) return key;
    if (key === want) return key;
  }
  return null;
}
function rememberUploadedChart(chart, fallbackName) {
  if (!chart || typeof chart !== "object") return { ok: false, reason: "nochart" };
  const label = firstNameFromChartOrFile(chart, fallbackName);
  const builtin = builtinKeyForLabel(label);
  if (builtin) {
    return { ok: true, builtin: true, key: builtin, label: sampleButtonLabel(builtin) };
  }
  const slots = loadUserQuickSlots();
  const chartClone = JSON.parse(JSON.stringify(chart));
  if (!chartClone.name) chartClone.name = label;
  const dupIdx = slots.findIndex((s) => s && String(s.label).trim().toLowerCase() === label.toLowerCase());
  if (dupIdx >= 0) {
    let replace = true;
    try {
      replace = confirm('A saved quick-load slot named "' + label + '" already exists. Replace it with this chart?');
    } catch (e) {
      replace = true;
    }
    if (!replace) return { ok: false, cancelled: true, key: slots[dupIdx].key, label: slots[dupIdx].label };
    const key2 = slots[dupIdx].key || slugUserQuickKey(label);
    slots[dupIdx] = { key: key2, label, chart: chartClone };
    saveUserQuickSlots(slots);
    renderQuickLoadGrids();
    return { ok: true, key: key2, label, replaced: true };
  }
  const emptyIdx = slots.findIndex((s) => !s);
  if (emptyIdx < 0) {
    status("All 6 custom quick-load slots (positions 7\u201312) are full. Remove one with \xD7 before saving another. The chart is still loaded in the input.", "err");
    return { ok: false, full: true };
  }
  let key = slugUserQuickKey(label);
  const used = new Set(slots.filter(Boolean).map((s) => s.key));
  if (used.has(key)) key = key + "_" + Date.now().toString(36);
  slots[emptyIdx] = { key, label, chart: chartClone };
  saveUserQuickSlots(slots);
  renderQuickLoadGrids();
  return { ok: true, key, label, slotIndex: emptyIdx };
}
function removeUserQuickSlot(key) {
  const found = findUserQuickSlotByKey(key);
  if (!found) return false;
  if (BUILTIN_QUICK_KEYS.indexOf(key) >= 0) return false;
  const label = found.slot.label || "this chart";
  let ok = true;
  try {
    ok = confirm("Remove saved chart \u201C" + label + "\u201D from quick load?");
  } catch (e) {
    ok = true;
  }
  if (!ok) return false;
  const slots = loadUserQuickSlots();
  slots[found.index] = null;
  saveUserQuickSlots(slots);
  renderQuickLoadGrids();
  for (const n of [1, 2]) {
    const root = $("quickLoad" + n);
    if (!root) continue;
    const active = root.querySelector("button.quick-sample.active");
    if (active && active.getAttribute("data-sample") === key) clearQuickLoadHighlight(n);
  }
  status("Removed \u201C" + label + "\u201D from quick load.", "ok");
  return true;
}
function sampleDataRoot() {
  return window.HD_DATA && window.HD_DATA || window.DATA && window.DATA || {};
}
function sampleOrderList() {
  const root = sampleDataRoot();
  let builtins;
  const order = root.sampleOrder;
  if (Array.isArray(order) && order.length) {
    builtins = order.slice(0, 6);
    while (builtins.length < 6) builtins.push(BUILTIN_QUICK_KEYS[builtins.length] || null);
  } else {
    builtins = BUILTIN_QUICK_KEYS.slice();
  }
  for (let i = 0; i < 6; i++) {
    if (!builtins[i]) builtins[i] = BUILTIN_QUICK_KEYS[i];
  }
  const users = loadUserQuickSlots().map((s) => s ? s.key : null);
  return builtins.concat(users);
}
function sampleButtonLabel(key) {
  if (!key) return "Empty";
  const root = sampleDataRoot();
  if (root.sampleLabels && root.sampleLabels[key]) return root.sampleLabels[key];
  if (root.samples && root.samples[key] && root.samples[key].name) {
    const nm = String(root.samples[key].name).trim().split(/\s+/)[0];
    if (nm) return nm;
  }
  const user = findUserQuickSlotByKey(key);
  if (user && user.slot && user.slot.label) return user.slot.label;
  if (key.indexOf("user_") === 0) {
    const rest = key.slice(5).replace(/_/g, " ");
    if (rest) return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}
function renderQuickLoadGrids() {
  try {
    const order = sampleOrderList();
    for (let n = 1; n <= 6; n++) {
      try {
        const grid = $("quickLoadGrid" + n) || $("quickLoad" + n) && $("quickLoad" + n).querySelector(".quick-load-grid");
        if (!grid) continue;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 12; i++) {
          const key = order[i];
          const isUserSlot = i >= 6;
          const wrap = document.createElement("div");
          wrap.className = "ql-slot" + (key ? "" : " empty-slot");
          wrap.setAttribute("data-index", String(i + 1));
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "secondary quick-sample" + (key ? "" : " empty");
          btn.setAttribute("data-slot", String(n));
          btn.setAttribute("data-index", String(i + 1));
          btn.setAttribute("aria-pressed", "false");
          if (key) {
            btn.setAttribute("data-sample", key);
            btn.id = "ql" + n + "-" + String(key).replace(/[^a-zA-Z0-9_-]/g, "_");
            btn.textContent = sampleButtonLabel(key);
            btn.addEventListener("click", (ev) => {
              if (ev && ev.target && ev.target.closest && ev.target.closest(".ql-remove")) return;
              try {
                if (ev && ev.stopPropagation) ev.stopPropagation();
              } catch (e) {
              }
              try {
                loadSampleInto(n, key);
              } catch (e) {
                try {
                  console.error("loadSampleInto", e);
                } catch (_e) {
                }
              }
            });
          } else {
            btn.setAttribute("data-sample", "");
            btn.id = "ql" + n + "-empty" + (i + 1);
            btn.textContent = "Empty";
            btn.disabled = true;
            btn.title = isUserSlot ? "Empty custom slot \u2014 upload a .docx / .json / .txt chart to save here" : "Placeholder";
          }
          wrap.appendChild(btn);
          if (key && isUserSlot && BUILTIN_QUICK_KEYS.indexOf(key) < 0) {
            const rm = document.createElement("button");
            rm.type = "button";
            rm.className = "ql-remove";
            rm.setAttribute("aria-label", "Remove " + sampleButtonLabel(key) + " from quick load");
            rm.title = "Remove saved chart";
            rm.textContent = "\xD7";
            rm.addEventListener("click", (ev) => {
              try {
                ev.preventDefault();
                ev.stopPropagation();
              } catch (e) {
              }
              try {
                removeUserQuickSlot(key);
              } catch (e) {
              }
            });
            rm.addEventListener("pointerdown", (ev) => {
              try {
                ev.stopPropagation();
              } catch (e) {
              }
            });
            wrap.appendChild(rm);
          }
          frag.appendChild(wrap);
        }
        while (grid.firstChild) grid.removeChild(grid.firstChild);
        grid.appendChild(frag);
        grid.setAttribute("data-ready", "1");
        try {
          void grid.offsetHeight;
        } catch (e) {
        }
      } catch (err) {
        try {
          console.error("renderQuickLoadGrids slot " + n, err);
        } catch (_e) {
        }
      }
    }
  } catch (err) {
    try {
      console.error("renderQuickLoadGrids", err);
    } catch (_e) {
    }
  }
}
function setQuickLoadHighlight(n, sampleKey) {
  const root = $("quickLoad" + n) || $("quickLoadGrid" + n);
  if (!root) return;
  try {
    root.querySelectorAll("button.quick-sample").forEach((btn) => {
      const on = !!sampleKey && btn.getAttribute("data-sample") === sampleKey;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  } catch (e) {
  }
}
function clearQuickLoadHighlight(n) {
  setQuickLoadHighlight(n, null);
}
function loadSampleInto(n, sampleKey) {
  if (!sampleKey) return;
  try {
    const data = window.HD_DATA && window.HD_DATA.samples || window.DATA && window.DATA.samples || {};
    const rootSrc = data[sampleKey];
    if (rootSrc) {
      const clone = JSON.parse(JSON.stringify(rootSrc));
      setPersonText(n, clone, sampleKey);
      return;
    }
    const user = findUserQuickSlotByKey(sampleKey);
    if (user && user.slot && user.slot.chart) {
      const clone = JSON.parse(JSON.stringify(user.slot.chart));
      setPersonText(n, clone, sampleKey);
      return;
    }
    status('Sample "' + sampleKey + '" not found', "err");
  } catch (e) {
    try {
      status('Could not load sample "' + sampleKey + '": ' + (e && e.message ? e.message : e), "err");
    } catch (_e) {
    }
  }
}
function setPersonText(n, obj, sampleKey) {
  const fresh = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  setPersonRaw(n, fresh);
  updateChartStatus(n);
  if (sampleKey) setQuickLoadHighlight(n, sampleKey);
  else clearQuickLoadHighlight(n);
  try {
    if (typeof ensureMemberSlotVisible === "function") ensureMemberSlotVisible(n);
  } catch (e) {
  }
  try {
    if (typeof syncExtraOutputOpts === "function") syncExtraOutputOpts();
  } catch (e) {
  }
}
function updateChartStatus(n) {
  const el = $("chartStatus" + n);
  if (!el) return;
  const raw = String(getPersonRaw(n) || "").trim();
  if (!raw) {
    el.textContent = "";
    el.className = "chart-status";
    try {
      syncPersonInputLabel(n);
    } catch (e) {
    }
    try {
      if (typeof syncExtraOutputOpts === "function") syncExtraOutputOpts();
    } catch (e) {
    }
    return;
  }
  try {
    if (typeof HD === "undefined" || !HD || typeof HD.loadPerson !== "function") {
      el.textContent = "Chart engine not loaded yet \u2014 refresh the page.";
      el.className = "chart-status err";
      return;
    }
    const person = HD.loadPerson(parseInput(raw) || raw);
    const v = HD.validateNatalOrStop ? HD.validateNatalOrStop(person, "Person " + n) : { ok: true };
    if (!person.gates.size && !(person.all_planet_activations || []).length) {
      el.textContent = "No natal planets/gates found in this input.";
      el.className = "chart-status err";
      return;
    }
    const summary = (typeof chartLoadedSummary === "function" ? chartLoadedSummary(person) : null) || "Chart loaded: " + (person.all_planet_activations || []).length + " activations, channels: " + [...person.defined_channels].sort().join(", ");
    const line = window.HD && HD.chartLoadedSummary ? HD.chartLoadedSummary(person) : summary;
    if (person.gates.size && person.defined_channels.size === 0) {
      el.textContent = line + " \u2014 zero complete channels; check input.";
      el.className = "chart-status warn";
    } else {
      el.textContent = line;
      el.className = "chart-status";
    }
  } catch (e) {
    el.textContent = "Could not parse chart: " + (e && e.message ? e.message : e);
    el.className = "chart-status err";
  }
  try {
    if (typeof syncExtraOutputOpts === "function") syncExtraOutputOpts();
  } catch (e) {
  }
}
function readFileAsText(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsText(file);
  });
}
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function readFileAsArrayBuffer(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}
function zipU16(view, off) {
  return view.getUint16(off, true);
}
function zipU32(view, off) {
  return view.getUint32(off, true);
}
async function inflateRawBytes(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot unzip .docx (missing DecompressionStream). Use a current Chrome, Edge, or Firefox, or save the chart as .txt / .json.");
  }
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}
async function unzipDocxEntry(buf, entryName) {
  const view = new DataView(buf);
  let eocd = -1;
  const minSearch = Math.max(0, buf.byteLength - 65557);
  for (let i = buf.byteLength - 22; i >= minSearch; i--) {
    if (zipU32(view, i) === 101010256) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a valid .docx (ZIP) package");
  const totalEntries = zipU16(view, eocd + 10);
  let cdOff = zipU32(view, eocd + 16);
  for (let n = 0; n < totalEntries; n++) {
    if (zipU32(view, cdOff) !== 33639248) throw new Error("Corrupt .docx central directory");
    const method = zipU16(view, cdOff + 10);
    const compSize = zipU32(view, cdOff + 20);
    const nameLen = zipU16(view, cdOff + 28);
    const extraLen = zipU16(view, cdOff + 30);
    const commentLen = zipU16(view, cdOff + 32);
    const localOff = zipU32(view, cdOff + 42);
    const name = new TextDecoder("utf-8").decode(new Uint8Array(buf, cdOff + 46, nameLen));
    if (name === entryName) {
      if (zipU32(view, localOff) !== 67324752) throw new Error("Corrupt .docx local header");
      const lNameLen = zipU16(view, localOff + 26);
      const lExtraLen = zipU16(view, localOff + 28);
      const dataOff = localOff + 30 + lNameLen + lExtraLen;
      const compressed = new Uint8Array(buf, dataOff, compSize);
      if (method === 0) return compressed;
      if (method === 8) return await inflateRawBytes(compressed);
      throw new Error("Unsupported compression inside .docx (method " + method + ")");
    }
    cdOff += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error("word/document.xml not found inside .docx");
}
function docxXmlToPlainText(xml) {
  let t = String(xml).replace(/<\/w:p>/gi, "\n").replace(/<w:tab\b[^>]*\/>/gi, "	").replace(/<w:br\b[^>]*\/>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\r\n/g, "\n");
  return t;
}
async function extractDocxText(fileOrBuf) {
  const buf = fileOrBuf instanceof ArrayBuffer ? fileOrBuf : await readFileAsArrayBuffer(fileOrBuf);
  const u8 = new Uint8Array(buf);
  if (u8.length >= 4 && u8[0] === 208 && u8[1] === 207 && u8[2] === 17 && u8[3] === 224) {
    const err = new Error("LEGACY_DOC");
    throw err;
  }
  if (!(u8.length >= 2 && u8[0] === 80 && u8[1] === 75)) {
    throw new Error("Not a .docx Word file");
  }
  const xmlBytes = await unzipDocxEntry(buf, "word/document.xml");
  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  return docxXmlToPlainText(xml);
}
function chartObjectFromLoadedText(text, fallbackName) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("No chart text found in file");
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const parsed = HD.parseChartText(trimmed);
  if (!parsed.name) parsed.name = fallbackName || "Unknown";
  return parsed;
}
async function handleFile(n, file) {
  if (!file) return;
  const name = (file.name || "").toLowerCase();
  const box = $("pngBox" + n);
  const img = $("pngImg" + n);
  const fallbackName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  if (name.endsWith(".doc") && !name.endsWith(".docx")) {
    status("Legacy .doc files are not supported. Please re-save as .docx in Word (File \u2192 Save As \u2192 Word Document *.docx), then upload again.", "err");
    return;
  }
  if (name.endsWith(".json") || name.endsWith(".txt")) {
    box.style.display = "none";
    const text = await readFileAsText(file);
    const chart = chartObjectFromLoadedText(text, fallbackName);
    setPersonRaw(n, JSON.stringify(chart, null, 2));
    updateChartStatus(n);
    const mem = rememberUploadedChart(chart, fallbackName);
    if (mem && mem.ok && mem.key) setQuickLoadHighlight(n, mem.key);
    else clearQuickLoadHighlight(n);
    if (mem && mem.full) {
    } else if (mem && mem.ok && !mem.builtin) status("Loaded " + file.name + " \xB7 saved \u201C" + mem.label + "\u201D to quick-load slot " + (mem.replaced ? "(updated)" : mem.slotIndex + 7) + " (all member inputs).", "ok");
    else status("Loaded " + file.name, "ok");
    return;
  }
  if (name.endsWith(".docx") || (file.type || "") === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    box.style.display = "none";
    try {
      const text = await extractDocxText(file);
      const chart = chartObjectFromLoadedText(text, fallbackName);
      setPersonRaw(n, JSON.stringify(chart, null, 2));
      updateChartStatus(n);
      const mem = rememberUploadedChart(chart, fallbackName);
      if (mem && mem.ok && mem.key) setQuickLoadHighlight(n, mem.key);
      else clearQuickLoadHighlight(n);
      if (mem && mem.full) {
      } else if (mem && mem.ok && !mem.builtin) status("Loaded " + file.name + " \xB7 saved \u201C" + mem.label + "\u201D to quick-load slot " + (mem.replaced ? "(updated)" : mem.slotIndex + 7) + " (all member inputs).", "ok");
      else status("Loaded " + file.name, "ok");
    } catch (e) {
      if (e && e.message === "LEGACY_DOC") {
        status("Legacy .doc files are not supported. Please re-save as .docx in Word (File \u2192 Save As \u2192 Word Document *.docx), then upload again.", "err");
      } else {
        status("Could not read .docx: " + (e && e.message ? e.message : e), "err");
      }
    }
    return;
  }
  if (name.endsWith(".png") || (file.type || "").startsWith("image/")) {
    img.src = await readFileAsDataURL(file);
    box.style.display = "block";
    let current;
    try {
      current = parseInput(getPersonRaw(n)) || {};
    } catch (e) {
      current = {};
    }
    if (typeof current === "string") current = HD.parseChartText(current);
    current = current || {};
    if (!current.name) current.name = fallbackName;
    current.planets = current.planets || {};
    current.notes = (current.notes || "") + " PNG loaded \u2014 enter gate.line values manually from the image.";
    setPersonRaw(n, JSON.stringify(current, null, 2));
    clearQuickLoadHighlight(n);
    status("PNG shown beside manual entry (no OCR bundled).", "ok");
    return;
  }
  status("Use .json, .txt, .docx, or .png (re-save legacy .doc as .docx)", "err");
}
function applyManualGates(n) {
  const name = $("manName" + n).value.trim();
  const raw = $("manGates" + n).value.trim();
  if (!raw && !name) {
    status("Enter name and/or gates", "err");
    return;
  }
  let data = HD.parseChartText((name ? "Name: " + name + "\n" : "") + raw.replace(/,/g, " / "));
  if (!Object.keys(data.planets || {}).length) {
    const gls = raw.match(/\d{1,2}\.\d/g) || [];
    data.planets = {};
    gls.forEach((gl, i) => data.planets["P" + (i + 1)] = gl);
    data.hanging_gates = gls.map((gl) => +gl.split(".")[0]);
  }
  if (name) data.name = name;
  if (!data.name) data.name = "Person " + n;
  setPersonText(n, data);
  status("Applied manual gates", "ok");
}
function setNow() {
  const now = /* @__PURE__ */ new Date();
  const tz = $("tz").value;
  let y, m, d, h, mi;
  if (tz === "local") {
    y = now.getFullYear();
    m = now.getMonth() + 1;
    d = now.getDate();
    h = now.getHours();
    mi = now.getMinutes();
  } else {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz === "UTC" ? "UTC" : tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    const parts = Object.fromEntries(fmt.formatToParts(now).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
    y = +parts.year;
    m = +parts.month;
    d = +parts.day;
    h = +parts.hour % 24;
    mi = +parts.minute;
  }
  startDate = iso(y, m, d);
  endDate = null;
  mode = "single";
  $("month").value = `${y}-${String(m).padStart(2, "0")}`;
  setTime12From24(`${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
  syncWhenModeHighlight();
  markNowReading();
  renderCalendar();
  status("Set to now (" + tz + ")", "ok");
}
function buildTransitsForSelection(Astronomy2) {
  syncTimeHiddenFrom12();
  const timeStr = $("timeOfDay").value || "15:00";
  const tz = $("tz").value || "local";
  const w = mode === "range" ? getQueryWindow(tz) : null;
  const dates = mode === "range" ? HD.dateRangeList(startDate, endDate || startDate) : [startDate];
  if (dates.length > 62) throw new Error("Date ranges are limited to 62 days in this browser build (you selected " + dates.length + "). Shorten From/To or click a nearer end date.");
  return dates.map((ds, i, arr) => {
    let hm = timeStr;
    if (w && w.isRange) {
      if (arr.length === 1 || i === 0) hm = w.startHm;
      else if (i === arr.length - 1) hm = w.endHm;
      else hm = w.startHm;
    }
    const utcDate = zonedTimeToUtc(ds, hm, tz);
    const field = HD.computeTransitField(Astronomy2, utcDate);
    field.date = ds;
    field.tz = tz;
    field._atMs = utcDate.getTime();
    field.display_when = formatDisplayDateTime(utcDate, tz);
    field.display_date = formatDisplayDateOnly(utcDate, tz);
    field.display_time = formatDisplayTimeOnly(utcDate, tz);
    return field;
  });
}
function computeIncludeTransitFieldFlag() {
  try {
    if (mode !== "range") return true;
    const cb = document.getElementById("includeRangeTransitField");
    return !!(cb && cb.checked);
  } catch (e) {
    return mode !== "range";
  }
}
function computeIncludeRangeBriefFlag() {
  try {
    if (mode !== "range") return false;
    const cb = document.getElementById("includeRangeBriefDesc");
    return !!(cb && cb.checked);
  } catch (e) {
    return false;
  }
}
function computeIncludeRangeFullFlag() {
  try {
    if (mode !== "range") return true;
    const full = document.getElementById("includeRangeFullDesc");
    const brief = document.getElementById("includeRangeBriefDesc");
    const fullOn = !!(full && full.checked);
    const briefOn = !!(brief && brief.checked);
    if (briefOn && !fullOn) return false;
    return true;
  } catch (e) {
    return true;
  }
}
function computeIncludeRangeOverviewFlag() {
  return computeIncludeRangeBriefFlag();
}
function computeIncludeOverviewTransitFieldFlag() {
  return computeIncludeTransitFieldFlag();
}
function computeEffectiveTransitFieldFlag(_includeOverview) {
  if (mode !== "range") return true;
  return computeIncludeTransitFieldFlag();
}
function describeDescriptionConfig() {
  const brief = !!(document.getElementById("includeRangeBriefDesc") && document.getElementById("includeRangeBriefDesc").checked);
  const full = !!(document.getElementById("includeRangeFullDesc") && document.getElementById("includeRangeFullDesc").checked);
  const field = !!(document.getElementById("includeRangeTransitField") && document.getElementById("includeRangeTransitField").checked);
  const mode2 = brief && !full ? "Brief" : "Full";
  return mode2 + " \xB7 Transit field " + (field ? "on" : "off");
}
function describeReportConfig() {
  const on = function(id) {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  };
  const bits = [];
  bits.push(on("includeCodes") ? "Gates & lines" : "Gates & lines off");
  bits.push(on("realWorldInfluence") ? "RWI" : "RWI off");
  if (on("omitLights")) bits.push("Omit Sun/Earth/Moon");
  else if (on("allGateOnly")) bits.push("All planets gate only");
  else {
    if (on("moonGateOnly")) bits.push("Moon gate");
    if (on("sunGateOnly")) bits.push("Sun/Earth gate");
    if (!on("moonGateOnly") && !on("sunGateOnly")) bits.push("Line changes kept");
  }
  return bits.join(" \xB7 ");
}
function updateConfigSummaries() {
  const d = document.getElementById("descConfigSummary");
  if (d) d.textContent = describeDescriptionConfig();
  const r = document.getElementById("reportConfigSummary");
  if (r) r.textContent = describeReportConfig();
}
function toggleConfigPanel(btnId, panelId) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  if (!btn || !panel) return;
  const next = btn.getAttribute("aria-expanded") !== "true";
  btn.setAttribute("aria-expanded", next ? "true" : "false");
  if (next) panel.removeAttribute("hidden");
  else panel.setAttribute("hidden", "");
}
function wireConfigPanels() {
  function bind(btnId, panelId) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.getAttribute("data-config-wired") === "1") return;
    btn.setAttribute("data-config-wired", "1");
    btn.addEventListener("click", function() {
      toggleConfigPanel(btnId, panelId);
    });
  }
  bind("descConfigBtn", "descConfigPanel");
  bind("reportConfigBtn", "reportConfigPanel");
  [
    "includeRangeFullDesc",
    "includeRangeBriefDesc",
    "includeRangeTransitField",
    "includeCodes",
    "realWorldInfluence",
    "moonGateOnly",
    "sunGateOnly",
    "allGateOnly",
    "omitLights"
  ].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el || el.getAttribute("data-summary-wired") === "1") return;
    el.setAttribute("data-summary-wired", "1");
    el.addEventListener("change", updateConfigSummaries);
    el.addEventListener("click", function() {
      setTimeout(updateConfigSummaries, 0);
    });
  });
  try {
    updateConfigSummaries();
  } catch (e) {
  }
}
let runPulseTimer = null;
function pulseRunButton() {
  const btn = document.getElementById("runBtn");
  if (!btn) return;
  btn.classList.remove("run-pulse");
  try {
    void btn.offsetWidth;
  } catch (e) {
  }
  btn.classList.add("run-pulse");
  if (runPulseTimer) {
    try {
      clearTimeout(runPulseTimer);
    } catch (e) {
    }
  }
  runPulseTimer = setTimeout(function() {
    const b = document.getElementById("runBtn");
    if (b) b.classList.remove("run-pulse");
    runPulseTimer = null;
  }, 2e3);
}
function wireRunPulse() {
  const btn = document.getElementById("runBtn");
  if (!btn || btn.getAttribute("data-pulse-wired") === "1") return;
  btn.setAttribute("data-pulse-wired", "1");
  let last = 0;
  const go = function() {
    const now = Date.now();
    if (now - last < 40) return;
    last = now;
    pulseRunButton();
  };
  btn.addEventListener("pointerdown", go, { passive: true });
  btn.addEventListener("touchstart", go, { passive: true });
  btn.addEventListener("click", go);
}
function enforceRangeDescMutualExclusion(changedId) {
  const full = document.getElementById("includeRangeFullDesc");
  const brief = document.getElementById("includeRangeBriefDesc");
  if (!full || !brief) return;
  if (changedId === "includeRangeFullDesc" && full.checked) brief.checked = false;
  if (changedId === "includeRangeBriefDesc" && brief.checked) full.checked = false;
  try {
    updateConfigSummaries();
  } catch (e) {
  }
}
function rerunFromRefine() {
  return;
}
function timeTransitBasedOn() {
  const el = document.getElementById("timeTransitBased");
  if (!el) return true;
  return !!el.checked;
}
function reportAlreadyGenerated() {
  try {
    if (window.__LAST_TRANSIT__ || window.__NATAL_ONLY__) return true;
  } catch (e) {
  }
  return false;
}
var lastRunSignature = null;
var staleUiVisible = false;
var __hdtaRunInProgress = false;
var RESULT_CONTROL_IDS = {
  includeRangeFullDesc: 1,
  includeRangeBriefDesc: 1,
  includeRangeTransitField: 1,
  timeTransitBased: 1,
  dateFrom: 1,
  dateTo: 1,
  timeFrom: 1,
  timeTo: 1,
  timeOfDay: 1,
  hour12: 1,
  minute: 1,
  ampm: 1,
  tz: 1,
  includeCodes: 1,
  realWorldInfluence: 1,
  moonGateOnly: 1,
  sunGateOnly: 1,
  allGateOnly: 1,
  omitLights: 1,
  notSelfLandscape: 1,
  betweenMembers: 1
};
function hashText(s) {
  s = String(s || "");
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
function checkboxSig(id) {
  var el = document.getElementById(id);
  return el && el.checked ? "1" : "0";
}
function collectResultSignature() {
  var parts = [];
  try {
    var max = typeof PERSON_SLOT_MAX === "number" ? PERSON_SLOT_MAX : 6;
    for (var n = 1; n <= max; n++) {
      var raw = "";
      try {
        raw = typeof getPersonRaw === "function" ? getPersonRaw(n) : "";
      } catch (e) {
        raw = "";
      }
      parts.push("p" + n + ":" + hashText(raw));
      try {
        parts.push("g" + n + ":" + (typeof getPersonGender === "function" ? getPersonGender(n) : ""));
      } catch (e) {
        parts.push("g" + n + ":");
      }
    }
  } catch (e) {
  }
  try {
    parts.push("mode:" + String(typeof mode !== "undefined" ? mode : ""));
  } catch (e) {
  }
  try {
    parts.push("start:" + String(typeof startDate !== "undefined" && startDate ? startDate : ""));
  } catch (e) {
  }
  try {
    parts.push("end:" + String(typeof endDate !== "undefined" && endDate ? endDate : ""));
  } catch (e) {
  }
  try {
    parts.push("tFrom:" + (typeof getRangeStartHm === "function" ? getRangeStartHm() : ""));
  } catch (e) {
  }
  try {
    parts.push("tTo:" + (typeof getRangeEndHm === "function" ? getRangeEndHm() : ""));
  } catch (e) {
  }
  try {
    var tod = document.getElementById("timeOfDay");
    parts.push("tod:" + (tod && tod.value ? tod.value : ""));
  } catch (e) {
  }
  try {
    var tz = document.getElementById("tz");
    parts.push("tz:" + (tz && tz.value ? tz.value : ""));
  } catch (e) {
  }
  try {
    parts.push("reportMode:" + String(typeof reportMode !== "undefined" ? reportMode : ""));
  } catch (e) {
  }
  var ids = ["timeTransitBased", "includeRangeFullDesc", "includeRangeBriefDesc", "includeRangeTransitField", "includeCodes", "realWorldInfluence", "moonGateOnly", "sunGateOnly", "allGateOnly", "omitLights", "notSelfLandscape", "betweenMembers"];
  for (var i = 0; i < ids.length; i++) parts.push(ids[i] + ":" + checkboxSig(ids[i]));
  try {
    var betweenOn = checkboxSig("betweenMembers") === "1";
    if (betweenOn && typeof getSelectedBetweenPairKeys === "function") {
      parts.push("pairs:" + getSelectedBetweenPairKeys().slice().sort().join(","));
    } else {
      parts.push("pairs:");
    }
  } catch (e) {
    parts.push("pairs:");
  }
  return parts.join("|");
}
function resultNeedsRunBeforeAsk() {
  if (!lastRunSignature) return true;
  try {
    return collectResultSignature() !== lastRunSignature;
  } catch (e) {
    return true;
  }
}
function captureLastRunSignature() {
  try {
    lastRunSignature = collectResultSignature();
  } catch (e) {
    lastRunSignature = "captured";
  }
  clearReportStaleUi();
}
function ensureStaleUiElements() {
  var hint = document.getElementById("runStaleHint");
  if (!hint) {
    var btn = document.getElementById("runBtn");
    if (btn && btn.parentNode) {
      hint = document.createElement("p");
      hint.className = "run-stale-hint no-print";
      hint.id = "runStaleHint";
      hint.hidden = true;
      hint.textContent = "Changes made \u2014 Press to Update";
      btn.parentNode.insertBefore(hint, btn);
    }
  }
  var banner = document.getElementById("reportStaleBanner");
  if (!banner) {
    var wrap = document.getElementById("reportWrap");
    if (wrap) {
      banner = document.createElement("button");
      banner.type = "button";
      banner.className = "report-stale-banner no-print";
      banner.id = "reportStaleBanner";
      banner.hidden = true;
      banner.textContent = "Out of date \u2014 Press to Update";
      if (wrap.firstChild) wrap.insertBefore(banner, wrap.firstChild);
      else wrap.appendChild(banner);
    }
  }
  if (banner && banner.getAttribute("data-stale-wired") !== "1") {
    banner.setAttribute("data-stale-wired", "1");
    banner.addEventListener("click", function() {
      try {
        scrollToRunButton();
      } catch (e) {
      }
    });
  }
  return { hint, banner };
}
function scrollToRunButton() {
  var hint = document.getElementById("runStaleHint");
  var btn = document.getElementById("runBtn");
  var el = hint && !hint.hidden ? hint : btn || hint;
  if (!el) return;
  try {
    if (typeof syncStickyOffsets === "function") syncStickyOffsets();
  } catch (e) {
  }
  var header = document.querySelector("header");
  var offset = (header ? header.getBoundingClientRect().height : 0) + 16;
  var top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - offset;
  try {
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } catch (e) {
    try {
      window.scrollTo(0, Math.max(0, top));
    } catch (_e) {
    }
  }
}
function clearReportStaleUi() {
  staleUiVisible = false;
  try {
    document.body.classList.remove("report-stale");
  } catch (e) {
  }
  try {
    var hint = document.getElementById("runStaleHint");
    if (hint) hint.hidden = true;
    var banner = document.getElementById("reportStaleBanner");
    if (banner) banner.hidden = true;
  } catch (e) {
  }
}
function showReportStaleUi(doScroll) {
  ensureStaleUiElements();
  staleUiVisible = true;
  try {
    document.body.classList.add("report-stale");
  } catch (e) {
  }
  try {
    var hint = document.getElementById("runStaleHint");
    if (hint) hint.hidden = false;
    var banner = document.getElementById("reportStaleBanner");
    if (banner) banner.hidden = false;
  } catch (e) {
  }
  if (doScroll) {
    try {
      scrollToRunButton();
    } catch (e) {
    }
  }
}
var pendingReturnToAsk = false;
var askReadyPulseTimer = null;
function promptRunBeforeAsk() {
  try {
    pendingReturnToAsk = !!lastRunSignature || typeof reportAlreadyGenerated === "function" && reportAlreadyGenerated();
  } catch (e) {
    pendingReturnToAsk = false;
  }
  showReportStaleUi(true);
  try {
    setAskStatus("Changes made \u2014 Press to Update, then ask again.");
  } catch (e) {
  }
}
function iosBottomReserve() {
  var safe = 0;
  try {
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;left:-9999px;visibility:hidden;pointer-events:none;height:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(probe);
    safe = probe.getBoundingClientRect().height || 0;
    if (probe.parentNode) probe.parentNode.removeChild(probe);
  } catch (e) {
    safe = 0;
  }
  return Math.max(safe + 8, 72);
}
function scrollToAskControls() {
  var label = document.querySelector('label[for="askGrokQuestion"]');
  var btn = document.getElementById("askGrokBtn");
  var el = label || btn || document.getElementById("askGrokPanel");
  if (!el) return;
  try {
    if (typeof syncStickyOffsets === "function") syncStickyOffsets();
  } catch (e) {
  }
  var header = document.querySelector("header");
  var bar = document.getElementById("storyToolbar");
  var topOffset = (header ? header.getBoundingClientRect().height : 0) + (bar ? bar.getBoundingClientRect().height : 0) + 10;
  var bottomReserve = iosBottomReserve();
  var vh = window.innerHeight || 0;
  var y = window.pageYOffset || document.documentElement.scrollTop || 0;
  var labelTop = el.getBoundingClientRect().top + y;
  var btnBottom = btn ? btn.getBoundingClientRect().bottom + y : el.getBoundingClientRect().bottom + y;
  var blockH = btnBottom - labelTop;
  var available = vh - topOffset - bottomReserve;
  var target;
  if (blockH <= available) {
    target = labelTop - topOffset;
  } else {
    target = btnBottom - (vh - bottomReserve);
  }
  try {
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  } catch (e) {
    try {
      window.scrollTo(0, Math.max(0, target));
    } catch (_e) {
    }
  }
}
function pulseAskButton() {
  var btn = document.getElementById("askGrokBtn");
  if (!btn) return;
  btn.classList.remove("ask-ready-pulse");
  try {
    void btn.offsetWidth;
  } catch (e) {
  }
  btn.classList.add("ask-ready-pulse");
  if (askReadyPulseTimer) {
    try {
      clearTimeout(askReadyPulseTimer);
    } catch (e) {
    }
  }
  askReadyPulseTimer = setTimeout(function() {
    var b = document.getElementById("askGrokBtn");
    if (b) b.classList.remove("ask-ready-pulse");
    askReadyPulseTimer = null;
  }, 2e3);
}
function scheduleReturnToAsk() {
  pendingReturnToAsk = false;
  function go() {
    try {
      scrollToAskControls();
    } catch (e) {
    }
    try {
      pulseAskButton();
    } catch (e) {
    }
    try {
      setAskStatus("Press Ask to continue.");
    } catch (e) {
    }
  }
  try {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        setTimeout(go, 80);
      });
    });
  } catch (e) {
    setTimeout(go, 160);
  }
}
function scrollToReportStart() {
  try {
    if (typeof syncStickyOffsets === "function") syncStickyOffsets();
  } catch (e) {
  }
  var header = document.querySelector("header");
  var offset = (header ? header.getBoundingClientRect().height : 0) + 8;
  var el = document.getElementById("storyPanel") || document.getElementById("storyToolbar") || document.getElementById("reportWrap") || document.getElementById("report");
  if (!el) return;
  var top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - offset;
  try {
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } catch (e) {
    try {
      window.scrollTo(0, Math.max(0, top));
    } catch (_e) {
    }
  }
}
function scheduleScrollToReportStart() {
  function go() {
    try {
      scrollToReportStart();
    } catch (e) {
    }
  }
  try {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        setTimeout(go, 80);
      });
    });
  } catch (e) {
    setTimeout(go, 160);
  }
}
function wireReportStale() {
  try {
    ensureStaleUiElements();
  } catch (e) {
  }
}
function natalControlsToDisable() {
  return ["modeSingle", "modeRange", "dateFrom", "dateTo", "timeFrom", "timeTo", "month", "clearDates", "hour12", "minute", "ampm", "tz", "nowBtn", "includeRangeTransitField", "calPrev", "calNext"];
}
function syncNatalOnlyUI() {
  try {
    keepTimeTransitBasedVisible();
  } catch (e) {
  }
  const natal = !timeTransitBasedOn();
  try {
    if (natal) document.body.classList.add("natal-only-mode");
    else document.body.classList.remove("natal-only-mode");
  } catch (e) {
  }
  const ids = natalControlsToDisable();
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.disabled = natal;
  }
  const wraps = [];
  function addWrap(el) {
    if (el && wraps.indexOf(el) < 0) wraps.push(el);
  }
  try {
    addWrap(document.getElementById("whenModeToggle"));
  } catch (e) {
  }
  try {
    addWrap(document.querySelector(".cal-wrap"));
  } catch (e) {
  }
  try {
    addWrap(document.getElementById("timeSingleWrap"));
  } catch (e) {
  }
  try {
    addWrap(document.getElementById("rangeTransitFieldOpt"));
  } catch (e) {
  }
  try {
    addWrap(document.getElementById("rangeTransitFieldHint"));
  } catch (e) {
  }
  try {
    const tz = document.getElementById("tz");
    if (tz && tz.parentElement) addWrap(tz.parentElement);
  } catch (e) {
  }
  try {
    addWrap(document.getElementById("nowBtn"));
  } catch (e) {
  }
  for (let i = 0; i < wraps.length; i++) {
    if (natal) wraps[i].classList.add("time-controls-disabled");
    else wraps[i].classList.remove("time-controls-disabled");
  }
}
function natalReportMeta(base) {
  const meta = Object.assign({}, base || {});
  try {
    const brief = $("includeRangeBriefDesc");
    const full = $("includeRangeFullDesc");
    meta.brief = !!(brief && brief.checked && !(full && full.checked));
  } catch (e) {
    meta.brief = false;
  }
  try {
    const want = typeof extraOutputRequested === "function" ? extraOutputRequested() : {};
    meta.wantNotSelf = !!want.landscape;
    meta.wantBetween = !!want.between;
  } catch (e) {
    meta.wantNotSelf = false;
    meta.wantBetween = false;
  }
  meta.natalOnly = true;
  return meta;
}
function finishNatalOnlyReport(people, meta) {
  if (!window.HD || typeof HD.renderNatalOnlyHtml !== "function") {
    status("Natal-only view is not available in this build.", "err");
    return;
  }
  const html = HD.renderNatalOnlyHtml(people, meta || {});
  lastHtml = html;
  lastMd = typeof HD.renderNatalOnlyMarkdown === "function" ? HD.renderNatalOnlyMarkdown(people, meta || {}) : "";
  window.__NATAL_ONLY__ = true;
  window.__LAST_TRANSIT__ = null;
  window.__LAST_EVENTS__ = null;
  window.__LAST_DAY_TRANSITS__ = [];
  window.__LAST_REPORT_MD__ = lastMd;
  const wrap = $("report");
  parkThenSetReportHtml(lastHtml);
  try {
    rememberReportBase();
  } catch (e) {
  }
  try {
    if (typeof applyGrokAnswerToReport === "function") applyGrokAnswerToReport();
  } catch (e) {
  }
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  const n = (people || []).filter(Boolean).length;
  status("Done \u2014 natal designs" + (n > 1 ? " and interactions" : ""), "ok");
  try {
    syncExtraOutputOpts();
  } catch (e) {
  }
  try {
    if (typeof syncAnswerShareButtons === "function") syncAnswerShareButtons();
  } catch (e) {
  }
  try {
    syncNatalOnlyUI();
  } catch (e) {
  }
}
function rerunIfReportExists() {
  return;
}
function hasGeneratedReport() {
  try {
    return reportAlreadyGenerated();
  } catch (e) {
    return false;
  }
}
function updateRefineSummary() {
  try {
    const el = document.getElementById("refineConfigSummary");
    if (!el) return;
    const on = function(id) {
      const n = document.getElementById(id);
      return !!(n && n.checked);
    };
    const bits = [];
    bits.push(on("notSelfLandscape") ? "Not-Self" : "Not-Self off");
    bits.push(on("betweenMembers") ? "Between" : "Between off");
    const hl = [];
    if (on("hlAffectedMembers")) hl.push("Bold");
    if (on("hlBetweenInteractions")) hl.push("Bold italic");
    if (on("hlUnderlineInfluences")) hl.push("Underline");
    bits.push(hl.length ? "Highlights: " + hl.join(", ") : "Highlights off");
    el.textContent = bits.join(" \xB7 ");
  } catch (e) {
  }
}
function isRefineConfigOpen() {
  const modal = document.getElementById("refineConfigModal");
  return !!(modal && !modal.hidden && !modal.hasAttribute("hidden"));
}
let refinePrevOverflow = "";
let refinePrevFocus = null;
function closeRefineConfig() {
  const modal = document.getElementById("refineConfigModal");
  const btn = document.getElementById("refineConfigBtn");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  modal.setAttribute("aria-hidden", "true");
  if (btn) btn.setAttribute("aria-expanded", "false");
  try {
    document.body.style.overflow = refinePrevOverflow || "";
  } catch (e) {
  }
  try {
    if (refinePrevFocus && refinePrevFocus.focus) refinePrevFocus.focus();
  } catch (e) {
  }
}
function openRefineConfig() {
  const modal = document.getElementById("refineConfigModal");
  const btn = document.getElementById("refineConfigBtn");
  if (!modal) return;
  try {
    refinePrevFocus = document.activeElement;
  } catch (e) {
    refinePrevFocus = null;
  }
  try {
    refinePrevOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  } catch (e) {
  }
  modal.hidden = false;
  modal.removeAttribute("hidden");
  modal.setAttribute("aria-hidden", "false");
  if (btn) btn.setAttribute("aria-expanded", "true");
  try {
    updateRefineSummary();
  } catch (e) {
  }
  try {
    const closer = document.getElementById("refineConfigClose");
    if (closer) closer.focus();
  } catch (e) {
  }
}
function toggleRefineConfig() {
  if (isRefineConfigOpen()) closeRefineConfig();
  else openRefineConfig();
}
function wireRefineConfigModal() {
  const btn = document.getElementById("refineConfigBtn");
  if (btn && btn.getAttribute("data-refine-wired") !== "1") {
    btn.setAttribute("data-refine-wired", "1");
    btn.addEventListener("click", function(ev) {
      if (ev) ev.preventDefault();
      toggleRefineConfig();
    });
  }
  const close = document.getElementById("refineConfigClose");
  if (close && close.getAttribute("data-refine-wired") !== "1") {
    close.setAttribute("data-refine-wired", "1");
    close.addEventListener("click", function(ev) {
      if (ev) ev.preventDefault();
      closeRefineConfig();
    });
  }
  const backdrop = document.getElementById("refineConfigBackdrop");
  if (backdrop && backdrop.getAttribute("data-refine-wired") !== "1") {
    backdrop.setAttribute("data-refine-wired", "1");
    backdrop.addEventListener("click", function() {
      closeRefineConfig();
    });
  }
  if (!window.__refineEscWired) {
    window.__refineEscWired = true;
    document.addEventListener("keydown", function(ev) {
      if (!ev || ev.key !== "Escape") return;
      if (!isRefineConfigOpen()) return;
      ev.preventDefault();
      closeRefineConfig();
    });
  }
  ["notSelfLandscape", "betweenMembers", "hlAffectedMembers", "hlBetweenInteractions", "hlUnderlineInfluences"].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el || el.getAttribute("data-refine-summary-wired") === "1") return;
    el.setAttribute("data-refine-summary-wired", "1");
    el.addEventListener("change", updateRefineSummary);
    el.addEventListener("click", function() {
      setTimeout(updateRefineSummary, 0);
    });
  });
  try {
    updateRefineSummary();
  } catch (e) {
  }
}
function syncStickyOffsets() {
  try {
    const header = document.querySelector("header");
    const safe = parseFloat((window.getComputedStyle(document.documentElement).getPropertyValue("--sat") || "").replace("px", "")) || 0;
    const hh = header ? Math.round(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--hdta-sticky-offset", Math.max(0, hh) + "px");
  } catch (e) {
  }
}
function wireStickyToolbar() {
  try {
    syncStickyOffsets();
  } catch (e) {
  }
  if (window.__stickyToolbarWired) return;
  window.__stickyToolbarWired = true;
  window.addEventListener("resize", syncStickyOffsets);
  window.addEventListener("orientationchange", function() {
    setTimeout(syncStickyOffsets, 150);
  });
}
function keepTimeTransitBasedVisible() {
  try {
    const wrap = document.getElementById("timeTransitBasedWrap");
    if (!wrap) return;
    wrap.hidden = false;
    wrap.removeAttribute("hidden");
    if (wrap.style && wrap.style.display === "none") wrap.style.display = "";
  } catch (e) {
  }
}
function scrollAskProcessingIntoView() {
  const el = document.getElementById("askProcessingMsg") || document.querySelector('label[for="askGrokQuestion"]');
  if (!el) return;
  try {
    if (typeof syncStickyOffsets === "function") syncStickyOffsets();
  } catch (e) {
  }
  const header = document.querySelector("header");
  const bar = document.getElementById("storyToolbar");
  const offset = (header ? header.getBoundingClientRect().height : 0) + (bar ? bar.getBoundingClientRect().height : 0) + 10;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  const fullyVisible = r.top >= offset && r.bottom <= vh - 8 && r.height > 0;
  if (fullyVisible) return;
  const top = r.top + (window.pageYOffset || document.documentElement.scrollTop || 0) - offset;
  try {
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } catch (e) {
    try {
      window.scrollTo(0, Math.max(0, top));
    } catch (_e) {
    }
  }
}
function setAskProcessing(on) {
  const el = document.getElementById("askProcessingMsg");
  if (!el) return;
  if (on) {
    el.removeAttribute("hidden");
    el.hidden = false;
    el.classList.add("is-pulsing");
    try {
      scrollAskProcessingIntoView();
    } catch (e) {
    }
  } else {
    el.setAttribute("hidden", "");
    el.hidden = true;
    el.classList.remove("is-pulsing");
  }
}
function parkAskAnswerActions() {
  const row = document.getElementById("askAnswerActions");
  const park = document.getElementById("askAnswerActionsPark");
  if (!row || !park) return;
  if (row.parentNode !== park) park.appendChild(row);
}
function ensureAskAnswerSlot() {
  const ans = document.querySelector("#report .grok-answer");
  if (!ans) return null;
  let slot = ans.querySelector(".ask-answer-actions-slot");
  if (slot) return slot;
  let header = ans.querySelector(".grok-answer-header");
  if (!header) {
    header = document.createElement("div");
    header.className = "grok-answer-header";
    const h2 = ans.querySelector("h2");
    if (h2 && h2.parentNode) {
      h2.parentNode.insertBefore(header, h2);
      header.appendChild(h2);
    } else if (ans.firstChild) {
      ans.insertBefore(header, ans.firstChild);
    } else {
      ans.appendChild(header);
    }
  }
  slot = document.createElement("div");
  slot.className = "ask-answer-actions-slot no-print";
  header.appendChild(slot);
  return slot;
}
function placeAskAnswerActions() {
  const row = document.getElementById("askAnswerActions");
  if (!row) return;
  const slot = ensureAskAnswerSlot();
  if (slot && typeof hasSuccessfulGrokAnswer === "function" && hasSuccessfulGrokAnswer()) {
    if (row.parentNode !== slot) slot.appendChild(row);
    row.removeAttribute("hidden");
    row.hidden = false;
  } else {
    parkAskAnswerActions();
  }
}
function scrollToGrokAnswer() {
  const el = document.querySelector("#report .grok-answer");
  if (!el) return;
  try {
    syncStickyOffsets();
  } catch (e) {
  }
  const header = document.querySelector("header");
  const bar = document.getElementById("storyToolbar");
  const offset = (header ? header.getBoundingClientRect().height : 0) + (bar ? bar.getBoundingClientRect().height : 0) + 10;
  const top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - offset;
  try {
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } catch (e) {
    try {
      window.scrollTo(0, Math.max(0, top));
    } catch (_e) {
    }
  }
}
function extraOutputOptsShouldShow() {
  return true;
}
function filledMemberCount() {
  try {
    if (typeof selectedPeopleFromBoxes === "function") {
      const sel = selectedPeopleFromBoxes();
      return (sel.p1 ? 1 : 0) + (sel.extraCount || 0);
    }
  } catch (e) {
  }
  let n = 0;
  for (let i = 1; i <= 6; i++) {
    try {
      if (String(getPersonRaw(i) || "").trim()) n++;
    } catch (e) {
    }
  }
  return n;
}
function syncExtraOutputOpts() {
  const wrap = $("extraOutputOpts");
  if (!wrap) return;
  wrap.style.display = "block";
  wrap.removeAttribute("hidden");
  const ready = hasGeneratedReport();
  const needHint = $("extraOutputNeedReportHint");
  if (needHint) {
    if (ready) needHint.setAttribute("hidden", "hidden");
    else needHint.removeAttribute("hidden");
  }
  const between = $("betweenMembers");
  const betweenLab = $("betweenMembersLabel") || between && between.closest && between.closest("label");
  const needTwo = filledMemberCount() < 2;
  if (between) {
    between.disabled = !!needTwo;
    if (needTwo) {
      between.checked = false;
      between.setAttribute("aria-disabled", "true");
      between.title = "Select a second or third member to compare.";
    } else {
      between.removeAttribute("aria-disabled");
      between.removeAttribute("title");
    }
  }
  if (betweenLab) {
    if (needTwo) betweenLab.classList.add("is-disabled");
    else betweenLab.classList.remove("is-disabled");
  }
  const disHint = $("betweenMembersDisabledHint");
  if (disHint) {
    if (needTwo) disHint.removeAttribute("hidden");
    else disHint.setAttribute("hidden", "hidden");
  }
  try {
    renderBetweenPairSelector();
  } catch (e) {
  }
  if (typeof syncAskGrokPanel === "function") syncAskGrokPanel();
  try {
    if (typeof syncHighlightChecks === "function") syncHighlightChecks();
  } catch (e) {
  }
  try {
    updateRefineSummary();
  } catch (e) {
  }
}
function highlightPlanetLabel(p) {
  if (p === "NorthNode") return "North Node";
  if (p === "SouthNode") return "South Node";
  return String(p || "");
}
function highlightFirstName(person) {
  try {
    if (typeof firstNameOnly === "function") return firstNameOnly(person && person.name);
  } catch (e) {
  }
  const n = String(person && (person.name || person.fullName) || "").trim();
  return n.split(/\s+/)[0] || "";
}
function highlightGateCenter(gate) {
  try {
    const g = window.HD_DATA && window.HD_DATA.gates && window.HD_DATA.gates[String(gate)];
    return g && g.center || "";
  } catch (e) {
    return "";
  }
}
function highlightGateTheme(gate) {
  try {
    const g = window.HD_DATA && window.HD_DATA.gates && window.HD_DATA.gates[String(gate)];
    return g && g.name || "";
  } catch (e) {
    return "";
  }
}
function highlightChannelName(info) {
  if (!info) return "";
  const n = (info.name || info.id || "").replace(/^The\s+/i, "");
  return n;
}
function collectLoadedPeople() {
  const out = [];
  if (!window.HD || typeof HD.loadPerson !== "function") return out;
  try {
    const sel = selectedPeopleFromBoxes();
    const raws = [];
    if (sel.p1) raws.push(sel.p1);
    if (sel.extrasRaw && sel.extrasRaw.length) {
      for (let i = 0; i < sel.extrasRaw.length; i++) raws.push(sel.extrasRaw[i]);
    } else {
      if (sel.p2) raws.push(sel.p2);
      if (sel.p3) raws.push(sel.p3);
    }
    for (let i = 0; i < raws.length; i++) {
      try {
        const p = HD.loadPerson(raws[i]);
        if (p) out.push(p);
      } catch (e) {
      }
    }
  } catch (e) {
  }
  return out;
}
function collectReportTransits() {
  const out = [];
  const seen = {};
  function add(t) {
    if (!t || !t.planets) return;
    const keys = Object.keys(t.planets).sort();
    let key = "";
    for (let i = 0; i < keys.length; i++) {
      const p = t.planets[keys[i]];
      key += keys[i] + ":" + (p && (p.gl || p.gate)) + ";";
    }
    if (!key || seen[key]) return;
    seen[key] = 1;
    out.push(t);
  }
  try {
    const days = window.__LAST_DAY_TRANSITS__;
    if (days && days.length) {
      for (let i = 0; i < days.length; i++) add(days[i]);
    }
  } catch (e) {
  }
  try {
    const ev = window.__LAST_EVENTS__;
    if (ev && ev.length) {
      for (let i = 0; i < ev.length; i++) add(ev[i].afterField || ev[i].transit || ev[i].field);
    }
  } catch (e) {
  }
  try {
    add(window.__LAST_TRANSIT__);
  } catch (e) {
  }
  if (!out.length && typeof buildTransitsForSelection === "function" && window.Astronomy) {
    try {
      const days = buildTransitsForSelection(window.Astronomy) || [];
      for (let i = 0; i < days.length; i++) add(days[i]);
    } catch (e) {
    }
  }
  return out;
}
function memberAffectedRecords(person, transit) {
  const recs = [];
  if (!person || !transit || !transit.planets) return recs;
  function hasGate(g) {
    try {
      return !!(person.gates && person.gates.has && person.gates.has(g));
    } catch (e) {
      return false;
    }
  }
  const open = {};
  try {
    const oc = window.HD && HD.openCentersOf ? HD.openCentersOf(person) : [];
    for (let i = 0; i < oc.length; i++) open[String(oc[i])] = 1;
  } catch (e) {
  }
  const pnames = Object.keys(transit.planets);
  for (let i = 0; i < pnames.length; i++) {
    const pname = pnames[i];
    const p = transit.planets[pname];
    if (!p) continue;
    const gate = p.gate;
    if (hasGate(gate)) recs.push({ kind: "natal-gate", planet: pname, gate, gl: p.gl || "" });
    const center = highlightGateCenter(gate);
    if (center && open[center]) recs.push({ kind: "open-center", planet: pname, gate, center, gl: p.gl || "" });
  }
  try {
    if (window.HD && typeof HD.analyzeDay === "function") {
      const day = HD.analyzeDay(person, transit);
      const chs = day.completed_channels || [];
      for (let c = 0; c < chs.length; c++) {
        const item = chs[c];
        recs.push({
          kind: "channel",
          channel: highlightChannelName(item.info || item),
          planets: item.transit_planets || [],
          gates: item.transit_gates || []
        });
      }
      const temp = day.centers_defined_by_transit || [];
      for (let t = 0; t < temp.length; t++) recs.push({ kind: "temp-defined", center: temp[t] });
      const amp = day.centers_activated_with_natal || [];
      for (let t = 0; t < amp.length; t++) recs.push({ kind: "amplified-center", center: amp[t] });
      const touches = day.touches || [];
      for (let t = 0; t < touches.length; t++) {
        const hit = touches[t];
        recs.push({ kind: "touch", planet: hit.planet, gate: hit.transit && hit.transit.gate });
      }
    }
  } catch (e) {
  }
  return recs;
}
function recordMatchesMention(rec, mention) {
  if (!rec || !mention) return false;
  if (mention.planet) {
    const a = highlightPlanetLabel(rec.planet || "");
    const b = highlightPlanetLabel(mention.planet);
    if (rec.planet && (rec.planet === mention.planet || a === b)) {
      if (!mention.gate || rec.gate == null || Number(rec.gate) === Number(mention.gate)) return true;
    }
    if (rec.planets) {
      for (let i = 0; i < rec.planets.length; i++) {
        if (rec.planets[i] === mention.planet || highlightPlanetLabel(rec.planets[i]) === b) return true;
      }
    }
  }
  if (mention.gate != null) {
    if (rec.gate != null && Number(rec.gate) === Number(mention.gate)) return true;
    if (rec.gates) {
      for (let i = 0; i < rec.gates.length; i++) {
        if (Number(rec.gates[i]) === Number(mention.gate)) return true;
      }
    }
  }
  if (mention.channel && rec.channel) {
    if (String(rec.channel).toLowerCase() === String(mention.channel).toLowerCase()) return true;
  }
  if (mention.center && rec.center && String(rec.center) === String(mention.center)) return true;
  return false;
}
function isMemberAffectedByMentions(member, mentions) {
  if (!member || !mentions || !mentions.length) return false;
  const recs = member.records || [];
  for (let i = 0; i < recs.length; i++) {
    for (let j = 0; j < mentions.length; j++) {
      if (recordMatchesMention(recs[i], mentions[j])) return true;
    }
  }
  return false;
}
function pairHasInteraction(a, b, transit) {
  if (!a || !b || !transit || !window.HD || typeof HD.coupleDynamics !== "function") return null;
  try {
    const dyn = HD.coupleDynamics(a, b, transit);
    const amplified = dyn.transit_amplified_channels || [];
    const hooks = dyn.shared_transit_hooks || [];
    const both = hooks.filter(function(h) {
      return h.in_a && h.in_b;
    });
    let bridge = false;
    try {
      let bridges2 = function(day, openOther) {
        const chs = day.completed_channels || [];
        for (let i = 0; i < chs.length; i++) {
          const centers = chs[i].info && chs[i].info.centers || [];
          for (let j = 0; j < centers.length; j++) {
            if (openOther[centers[j]]) return true;
          }
        }
        return false;
      };
      var bridges = bridges2;
      const d1 = HD.analyzeDay(a, transit);
      const d2 = HD.analyzeDay(b, transit);
      const openB = {};
      const openA = {};
      (HD.openCentersOf(b) || []).forEach(function(c) {
        openB[c] = 1;
      });
      (HD.openCentersOf(a) || []).forEach(function(c) {
        openA[c] = 1;
      });
      bridge = bridges2(d1, openB) || bridges2(d2, openA);
    } catch (e) {
    }
    if (amplified.length || both.length || bridge) {
      return { amplified, bothHooks: both, bridge };
    }
  } catch (e) {
  }
  return null;
}
function memberNatalRecords(person) {
  const recs = [];
  if (!person) return recs;
  function hasGateAlready(g) {
    for (let i = 0; i < recs.length; i++) {
      if (recs[i].gate != null && Number(recs[i].gate) === Number(g) && recs[i].kind === "natal-gate") return true;
    }
    return false;
  }
  try {
    const gates = person.gates && person.gates.forEach ? person.gates : person.gates || [];
    if (gates.forEach) {
      gates.forEach(function(g) {
        const n = Number(g);
        if (!n) return;
        recs.push({ kind: "natal-gate", gate: n, theme: highlightGateTheme(n), center: highlightGateCenter(n) });
      });
    }
  } catch (e) {
  }
  try {
    const hanging = typeof hangingGatesList === "function" ? hangingGatesList(person) : [];
    for (let i = 0; i < hanging.length; i++) {
      const n = Number(hanging[i]);
      if (!n || hasGateAlready(n)) continue;
      recs.push({ kind: "natal-gate", gate: n, theme: highlightGateTheme(n), center: highlightGateCenter(n) });
    }
  } catch (e) {
  }
  try {
    const chans = person.natal_channel_list || [];
    for (let i = 0; i < chans.length; i++) {
      const ch = chans[i];
      const name = highlightChannelName(ch);
      const gates = ch && ch.gates ? ch.gates : [];
      const centers = ch && ch.centers ? ch.centers : [];
      recs.push({ kind: "natal-channel", channel: name, gates, centers, center: centers[0] || "" });
    }
  } catch (e) {
  }
  try {
    const defined = [...new Set([...person.defined_centers || []].map(function(c) {
      return String(c);
    }))];
    for (let i = 0; i < defined.length; i++) {
      if (defined[i]) recs.push({ kind: "defined-center", center: defined[i] });
    }
  } catch (e) {
  }
  try {
    const open = window.HD && HD.openCentersOf ? HD.openCentersOf(person) : [];
    for (let i = 0; i < open.length; i++) {
      if (open[i]) recs.push({ kind: "open-center", center: String(open[i]) });
    }
  } catch (e) {
  }
  return recs;
}
function highlightCenterList(people) {
  const names = ["Solar Plexus", "Heart/Ego", "Sacral", "Throat", "Spleen", "Ajna", "Head", "Root", "G"];
  const seen = {};
  const out = [];
  function add(n) {
    const s = String(n || "").trim();
    if (!s || seen[s]) return;
    seen[s] = 1;
    out.push(s);
  }
  for (let i = 0; i < names.length; i++) add(names[i]);
  (people || []).forEach(function(p) {
    try {
      (p.defined_centers || []).forEach(add);
    } catch (e) {
    }
    try {
      (window.HD && HD.openCentersOf ? HD.openCentersOf(p) : []).forEach(add);
    } catch (e) {
    }
  });
  out.sort(function(a, b) {
    return b.length - a.length;
  });
  return out;
}
function buildHighlightIndex() {
  const people = collectLoadedPeople();
  const transits = collectReportTransits();
  const members = [];
  const transitList = [];
  const channelNames = {};
  const seenRef = {};
  for (let t = 0; t < transits.length; t++) {
    const planets = transits[t].planets || {};
    const pnames = Object.keys(planets);
    for (let i = 0; i < pnames.length; i++) {
      const p = planets[pnames[i]];
      if (!p) continue;
      const ref = { planet: pnames[i], label: highlightPlanetLabel(pnames[i]), gate: p.gate, line: p.line, gl: p.gl || p.gate + "." + p.line, theme: highlightGateTheme(p.gate), center: highlightGateCenter(p.gate) };
      const key = ref.label + "|" + ref.gate + "|" + ref.gl;
      if (!seenRef[key]) {
        seenRef[key] = 1;
        transitList.push(ref);
      }
    }
  }
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const first = highlightFirstName(person);
    const records = [];
    for (let t = 0; t < transits.length; t++) {
      const recs = memberAffectedRecords(person, transits[t]);
      for (let r = 0; r < recs.length; r++) {
        records.push(recs[r]);
        if (recs[r].channel) channelNames[recs[r].channel] = 1;
      }
    }
    const natalRecs = memberNatalRecords(person);
    for (let r = 0; r < natalRecs.length; r++) {
      records.push(natalRecs[r]);
      if (natalRecs[r].channel) channelNames[natalRecs[r].channel] = 1;
      if (natalRecs[r].gate != null) {
        const g = natalRecs[r].gate;
        const theme = natalRecs[r].theme || highlightGateTheme(g);
        const key = "natal|" + g;
        if (!seenRef[key]) {
          seenRef[key] = 1;
          transitList.push({ planet: "", label: "", gate: g, line: null, gl: "", theme, center: natalRecs[r].center || highlightGateCenter(g), natal: true });
        }
      }
    }
    members.push({ first, person, records });
  }
  const interactions = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      for (let t = 0; t < transits.length; t++) {
        const hit = pairHasInteraction(a, b, transits[t]);
        if (!hit) continue;
        const chans = [];
        (hit.amplified || []).forEach(function(ch) {
          const n = highlightChannelName(ch);
          if (n) {
            chans.push(n);
            channelNames[n] = 1;
          }
        });
        interactions.push({
          names: [highlightFirstName(a), highlightFirstName(b)],
          channels: chans,
          hook: !!(hit.bothHooks && hit.bothHooks.length),
          bridge: !!hit.bridge
        });
      }
      try {
        if (window.HD && typeof HD.coupleDynamics === "function") {
          const dyn = HD.coupleDynamics(a, b, { planets: {} });
          const chans = [];
          ["electromagnetic", "companionship", "compromise"].forEach(function(k) {
            (dyn[k] || []).forEach(function(ch) {
              const n = highlightChannelName(ch);
              if (n) {
                chans.push(n);
                channelNames[n] = 1;
              }
            });
          });
          if (chans.length) {
            interactions.push({
              names: [highlightFirstName(a), highlightFirstName(b)],
              channels: chans,
              hook: false,
              bridge: false,
              natal: true
            });
          }
        }
      } catch (e) {
      }
    }
  }
  const index = { members, transits: transitList, interactions, channelNames: Object.keys(channelNames), centers: highlightCenterList(people) };
  window.__TA_HIGHLIGHT__ = index;
  return index;
}
function highlightControlsReady() {
  return !!(typeof hasGeneratedReport === "function" && hasGeneratedReport());
}
function highlightBoxChecked(id) {
  const el = document.getElementById(id);
  return !!(el && el.checked);
}
function highlightAffectedOn() {
  return highlightBoxChecked("hlAffectedMembers");
}
function highlightBetweenOn() {
  return highlightBoxChecked("hlBetweenInteractions");
}
function highlightUnderlineOn() {
  return highlightBoxChecked("hlUnderlineInfluences");
}
function highlightAnyOn() {
  return highlightAffectedOn() || highlightBetweenOn() || highlightUnderlineOn();
}
function setHighlightClass(el, cls, on) {
  if (!el || !el.classList) return;
  if (on) el.classList.add(cls);
  else el.classList.remove(cls);
}
function applyHighlightInline(root) {
  if (!root || !root.querySelectorAll) return;
  const underline = highlightUnderlineOn();
  const bold = highlightAffectedOn();
  const between = highlightBetweenOn();
  const transits = root.querySelectorAll("span.hl-transit");
  for (let i = 0; i < transits.length; i++) {
    const sp = transits[i];
    if (underline) sp.style.setProperty("text-decoration", "underline", "important");
    else sp.style.removeProperty("text-decoration");
  }
  const names = root.querySelectorAll("span.hl-affected");
  for (let i = 0; i < names.length; i++) {
    const sp = names[i];
    if (bold) {
      sp.style.setProperty("font-weight", "700", "important");
      sp.style.setProperty("font-style", "normal", "important");
    } else {
      sp.style.removeProperty("font-weight");
      sp.style.removeProperty("font-style");
    }
  }
  const blocks = root.querySelectorAll(".hl-between-block");
  for (let i = 0; i < blocks.length; i++) {
    const sp = blocks[i];
    if (between) {
      sp.style.setProperty("font-weight", "700", "important");
      sp.style.setProperty("font-style", "italic", "important");
    } else {
      sp.style.removeProperty("font-weight");
      sp.style.removeProperty("font-style");
    }
  }
}
function applyHighlightToggles() {
  const onA = highlightAffectedOn();
  const onB = highlightBetweenOn();
  const onU = highlightUnderlineOn();
  const roots = [document.body, document.getElementById("report"), document.getElementById("displayOverlay"), document.getElementById("answerPrintRoot")];
  for (let i = 0; i < roots.length; i++) {
    setHighlightClass(roots[i], "hl-affected-on", onA);
    setHighlightClass(roots[i], "hl-between-on", onB);
    setHighlightClass(roots[i], "hl-underline-on", onU);
  }
  applyHighlightInline(document.getElementById("report"));
  applyHighlightInline(document.getElementById("displayOverlay"));
  applyHighlightInline(document.getElementById("answerPrintRoot"));
  try {
    updateHighlightStatus();
  } catch (e) {
  }
}
function updateHighlightStatus() {
  const el = document.getElementById("hlToggleStatus");
  if (!el) return;
  const aOn = highlightAffectedOn();
  const bOn = highlightBetweenOn();
  const uOn = highlightUnderlineOn();
  if (!highlightControlsReady()) {
    if (aOn || bOn || uOn) {
      el.textContent = "Highlighting will apply when you run a report.";
    } else {
      el.textContent = "Check a box, then run a report \u2014 or check a box after a report \u2014 to apply bold, italic, or underline.";
    }
    return;
  }
  if (!aOn && !bOn && !uOn) {
    el.textContent = "Highlighting is off. Check a box to bold affected members, italicize between-member interactions, or underline key influences.";
    return;
  }
  const bits = [];
  if (aOn) bits.push("affected members are bold");
  if (bOn) bits.push("between-member interactions are bold and italic");
  if (uOn) bits.push("key influences are underlined");
  const t = document.querySelectorAll("#report span.hl-transit").length;
  const a = document.querySelectorAll("#report span.hl-affected").length;
  const n = document.querySelectorAll("#report .hl-between-block").length;
  el.textContent = "Highlighting on: " + bits.join("; ") + " (" + t + " key influence" + (t === 1 ? "" : "s") + ", " + a + " member name" + (a === 1 ? "" : "s") + ", " + n + " interaction" + (n === 1 ? "" : "s") + ").";
}
function syncHighlightChecks() {
  ["hlAffectedMembers", "hlBetweenInteractions", "hlUnderlineInfluences"].forEach(function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.disabled = false;
      el.removeAttribute("disabled");
    } catch (e) {
    }
    el.setAttribute("aria-disabled", "false");
    const lab = el.closest && el.closest("label");
    if (lab) lab.classList.remove("is-disabled");
  });
  try {
    wireHighlightChecks();
  } catch (e) {
  }
  applyHighlightToggles();
}
function unwrapHighlightSpans(root) {
  if (!root || !root.querySelectorAll) return;
  const spans = root.querySelectorAll("span.hl-transit, span.hl-affected");
  for (let i = spans.length - 1; i >= 0; i--) {
    const sp = spans[i];
    const parent = sp.parentNode;
    if (!parent) continue;
    while (sp.firstChild) parent.insertBefore(sp.firstChild, sp);
    parent.removeChild(sp);
  }
  const blocks = root.querySelectorAll(".hl-between-block");
  for (let i = 0; i < blocks.length; i++) blocks[i].classList.remove("hl-between-block");
  try {
    root.normalize();
  } catch (e) {
  }
}
function highlightSkipParent(el) {
  while (el) {
    const tag = (el.nodeName || "").toLowerCase();
    if (tag === "script" || tag === "style" || tag === "textarea" || tag === "noscript") return true;
    const cls = el.className && String(el.className) || "";
    if (/\btech\b/.test(cls) || el.id === "timelineEventsJson") return true;
    el = el.parentNode;
  }
  return false;
}
function wrapRangesInTextNode(node, ranges, className, dataFn) {
  if (!ranges || !ranges.length || !node || !node.parentNode) return;
  ranges.sort(function(a, b) {
    return a.start - b.start;
  });
  const text = node.nodeValue;
  const frag = document.createDocumentFragment();
  let last = 0;
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (r.start < last || r.end <= r.start) continue;
    if (r.start > last) frag.appendChild(document.createTextNode(text.slice(last, r.start)));
    const sp = document.createElement("span");
    sp.className = className;
    if (dataFn) dataFn(sp, r);
    sp.appendChild(document.createTextNode(text.slice(r.start, r.end)));
    frag.appendChild(sp);
    last = r.end;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  node.parentNode.replaceChild(frag, node);
}
function collectHighlightTextNodes(root) {
  const nodes = [];
  if (!root || !document.createTreeWalker) return nodes;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.nodeValue || !String(n.nodeValue).trim()) continue;
    if (highlightSkipParent(n.parentNode)) continue;
    nodes.push(n);
  }
  return nodes;
}
function prefixLooksNatal(text, idx) {
  const pre = text.slice(Math.max(0, idx - 22), idx).toLowerCase();
  return /natal\s+$/.test(pre) || /design\s+$/.test(pre) || /personality\s+$/.test(pre) || /\(design\)\s*$/.test(pre) || /\(personality\)\s*$/.test(pre);
}
function wrapTransitMentions(root, index) {
  const planetNames = ["North Node", "South Node", "True Node", "Mean Node", "Sun", "Earth", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const planetRe = new RegExp("\\b(" + planetNames.join("|") + ")\\b(?:\\s+(?:moves through|remains in|stays in|is in|in|on|through))?\\s*(?:[Gg]ate\\s+)?(\\d{1,2})?(?:\\.(\\d))?(?:\\s*\\(([^\\)]{1,40})\\))?", "g");
  const knownGates = {};
  const knownGl = {};
  const transits = index.transits || [];
  for (let i = 0; i < transits.length; i++) {
    if (transits[i].gate != null) knownGates[String(transits[i].gate)] = transits[i];
    if (transits[i].gl) knownGl[String(transits[i].gl)] = transits[i];
  }
  const members = index.members || [];
  for (let m = 0; m < members.length; m++) {
    const recs = members[m].records || [];
    for (let r = 0; r < recs.length; r++) {
      if (recs[r].gate != null) knownGates[String(recs[r].gate)] = knownGates[String(recs[r].gate)] || recs[r];
      if (recs[r].gl) knownGl[String(recs[r].gl)] = knownGl[String(recs[r].gl)] || recs[r];
    }
  }
  const gateRe = /\b[Gg]ate\s+(\d{1,2})\b/g;
  const glRe = /\b(\d{1,2}\.\d)\b/g;
  const chNames = (index.channelNames || []).slice().sort(function(a, b) {
    return b.length - a.length;
  });
  const centers = (index.centers || highlightCenterList((index.members || []).map(function(m) {
    return m.person;
  }))).slice();
  const nodes = collectHighlightTextNodes(root);
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    if (!node.parentNode) continue;
    const text = node.nodeValue;
    const ranges = [];
    const taken = function(s, e) {
      for (let i = 0; i < ranges.length; i++) {
        if (!(e <= ranges[i].start || s >= ranges[i].end)) return true;
      }
      return false;
    };
    let m;
    planetRe.lastIndex = 0;
    while (m = planetRe.exec(text)) {
      const start = m.index, end = m.index + m[0].length;
      if (taken(start, end)) continue;
      ranges.push({ start, end, planet: m[1], gate: m[2] ? Number(m[2]) : null, gl: m[2] && m[3] ? m[2] + "." + m[3] : "", theme: m[4] || "" });
    }
    gateRe.lastIndex = 0;
    while (m = gateRe.exec(text)) {
      if (!knownGates[String(m[1])]) continue;
      const start = m.index, end = m.index + m[0].length;
      if (taken(start, end)) continue;
      const src = knownGates[String(m[1])] || {};
      ranges.push({ start, end, planet: "", gate: Number(m[1]), gl: "", theme: "", center: src.center || highlightGateCenter(Number(m[1])) });
    }
    glRe.lastIndex = 0;
    while (m = glRe.exec(text)) {
      if (!knownGl[m[1]]) continue;
      const start = m.index, end = m.index + m[0].length;
      if (taken(start, end)) continue;
      ranges.push({ start, end, planet: "", gate: Number(m[1].split(".")[0]), gl: m[1], theme: "" });
    }
    if (chNames.length) {
      for (let c = 0; c < chNames.length; c++) {
        const name = chNames[c];
        if (!name || name.length < 3) continue;
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp("(?:(?:the\\s+)?channel of\\s+)?" + esc + "(?=\\s*\\(|\\s*$|[.,;:]|\\s+\\()", "ig");
        let cm;
        while (cm = re.exec(text)) {
          const start = cm.index, end = cm.index + cm[0].length;
          if (taken(start, end)) continue;
          ranges.push({ start, end, planet: "", gate: null, gl: "", channel: name });
        }
      }
    }
    for (let c = 0; c < centers.length; c++) {
      const name = centers[c];
      if (!name) continue;
      let re;
      if (name === "G") {
        re = /\bG(?:\s+center|\s*[–-]|(?=,|\.|;|:))/g;
      } else {
        re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\/", "[\\/]"), "g");
      }
      let cm;
      while (cm = re.exec(text)) {
        const start = cm.index, end = cm.index + cm[0].length;
        if (taken(start, end)) continue;
        ranges.push({ start, end, planet: "", gate: null, gl: "", center: name === "G" ? "G" : name });
      }
    }
    if (ranges.length) wrapRangesInTextNode(node, ranges, "hl-transit", function(sp, r) {
      if (r.planet) sp.setAttribute("data-planet", r.planet);
      if (r.gate != null) sp.setAttribute("data-gate", String(r.gate));
      if (r.gl) sp.setAttribute("data-gl", r.gl);
      if (r.channel) sp.setAttribute("data-channel", r.channel);
      if (r.center) sp.setAttribute("data-center", r.center);
    });
  }
}
function closestHighlightBlock(el) {
  while (el && el.nodeType === 1) {
    const tag = el.nodeName.toLowerCase();
    if (/^(p|li|h1|h2|h3|h4|h5|td|th|blockquote|div)$/.test(tag)) {
      if (tag === "div" && el.id === "report") return el;
      if (tag !== "div" || /ov-person|grok-answer|ns-/.test(el.className || "")) return el;
      if (tag === "div") return el;
    }
    el = el.parentNode;
  }
  return null;
}
function mentionsFromBlock(block) {
  const mentions = [];
  if (!block || !block.querySelectorAll) return mentions;
  const spans = block.querySelectorAll("span.hl-transit");
  for (let i = 0; i < spans.length; i++) {
    const sp = spans[i];
    mentions.push({
      planet: sp.getAttribute("data-planet") || "",
      gate: sp.getAttribute("data-gate") ? Number(sp.getAttribute("data-gate")) : null,
      gl: sp.getAttribute("data-gl") || "",
      channel: sp.getAttribute("data-channel") || "",
      center: sp.getAttribute("data-center") || ""
    });
  }
  return mentions;
}
function wrapAffectedNames(root, index) {
  const members = (index.members || []).filter(function(m) {
    return m.first;
  });
  members.sort(function(a, b) {
    return b.first.length - a.first.length;
  });
  if (!members.length) return;
  const nodes = collectHighlightTextNodes(root);
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    if (!node.parentNode) continue;
    if ((node.parentNode.className || "").indexOf("hl-affected") >= 0) continue;
    const block = closestHighlightBlock(node.parentNode);
    const mentions = mentionsFromBlock(block || root);
    if (!mentions.length) continue;
    const text = node.nodeValue;
    const ranges = [];
    const taken = function(s, e) {
      for (let i = 0; i < ranges.length; i++) {
        if (!(e <= ranges[i].start || s >= ranges[i].end)) return true;
      }
      return false;
    };
    for (let m = 0; m < members.length; m++) {
      const mem = members[m];
      if (!isMemberAffectedByMentions(mem, mentions)) continue;
      const re = new RegExp("\\b" + mem.first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=\\b|'s|\u2019s|'|\u2019)", "g");
      let hit;
      while (hit = re.exec(text)) {
        const start = hit.index, end = start + mem.first.length;
        if (taken(start, end)) continue;
        ranges.push({ start, end, name: mem.first });
      }
    }
    if (ranges.length) wrapRangesInTextNode(node, ranges, "hl-affected", function(sp, r) {
      sp.setAttribute("data-member", r.name);
    });
  }
}
function headingIsBetween(el) {
  if (!el) return false;
  const cls = el.className && String(el.className) || "";
  if (/\bns-between\b/.test(cls)) return true;
  const t = (el.textContent || "").trim();
  return /^Between\b/i.test(t);
}
function blockLooksBetween(el, index) {
  if (!el) return false;
  if (headingIsBetween(el)) return true;
  const text = String(el.textContent || "");
  const names = (index && index.members || []).map(function(m) {
    return m.first;
  }).filter(Boolean);
  let nameHits = 0;
  for (let i = 0; i < names.length; i++) {
    const re = new RegExp("\\b" + names[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    if (re.test(text)) nameHits++;
  }
  const twoNames = nameHits >= 2;
  const nameAlt = names.map(function(n) {
    return n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|");
  const betweenPhrase = /\bbetween\s+them\b/i.test(text) || !!(nameAlt && new RegExp("\\bbetween\\s+(" + nameAlt + ")\\s+and\\s+(" + nameAlt + ")", "i").test(text));
  const keywords = /electromagnetic|companionship|dominance|compromise|shared hooks?|lands in both charts|holds the bridge|temporarily define|lit by this sky|natal bond|condition each other|condition one another/i.test(text) || !!(nameAlt && new RegExp("condition(?:s|ed|ing)?\\s+(" + nameAlt + ")", "i").test(text));
  let inBetweenSection = false;
  let prev = el.previousElementSibling;
  let steps = 0;
  while (prev && steps < 8) {
    if (/^(h2|h3|h4)$/i.test(prev.nodeName)) {
      inBetweenSection = headingIsBetween(prev);
      break;
    }
    prev = prev.previousElementSibling;
    steps++;
  }
  if (!(inBetweenSection || betweenPhrase || twoNames && keywords)) return false;
  if (!(inBetweenSection || twoNames || betweenPhrase)) return false;
  const mentions = mentionsFromBlock(el);
  if (inBetweenSection) return true;
  if (mentions.length) return true;
  const chans = index && index.channelNames || [];
  const low = text.toLowerCase();
  for (let i = 0; i < chans.length; i++) {
    if (chans[i] && low.indexOf(chans[i].toLowerCase()) >= 0) return true;
  }
  return keywords && (twoNames || betweenPhrase);
}
function markBetweenBlocks(root, index) {
  if (!root || !root.querySelectorAll) return;
  const els = root.querySelectorAll("p, li, h3, h4, blockquote");
  for (let i = 0; i < els.length; i++) {
    if (blockLooksBetween(els[i], index)) els[i].classList.add("hl-between-block");
  }
}
function markupHighlightReport() {
  const root = document.getElementById("report");
  if (!root) return;
  try {
    parkAskAnswerActions();
  } catch (e) {
  }
  const index = buildHighlightIndex();
  unwrapHighlightSpans(root);
  wrapTransitMentions(root, index);
  wrapAffectedNames(root, index);
  markBetweenBlocks(root, index);
  applyHighlightToggles();
  try {
    placeAskAnswerActions();
  } catch (e) {
  }
}
function onHighlightUserInput(ev) {
  applyHighlightToggles();
  try {
    if (typeof markupHighlightReport === "function" && highlightControlsReady()) {
      markupHighlightReport();
    }
  } catch (e) {
  }
}
function bindHighlightEl(el) {
  if (!el || el.getAttribute("data-hl-wired") === "1") return;
  el.setAttribute("data-hl-wired", "1");
  const fn = function() {
    onHighlightUserInput();
  };
  el.addEventListener("change", fn);
  el.addEventListener("input", fn);
  el.addEventListener("click", fn);
  const lab = el.closest && el.closest("label");
  if (lab && lab.getAttribute("data-hl-wired") !== "1") {
    lab.setAttribute("data-hl-wired", "1");
    lab.addEventListener("click", function() {
      setTimeout(onHighlightUserInput, 0);
    });
    lab.addEventListener("touchend", function() {
      setTimeout(onHighlightUserInput, 0);
    }, { passive: true });
  }
}
function wireHighlightChecks() {
  bindHighlightEl(document.getElementById("hlAffectedMembers"));
  bindHighlightEl(document.getElementById("hlBetweenInteractions"));
  bindHighlightEl(document.getElementById("hlUnderlineInfluences"));
}
window.__TA_HIGHLIGHT_TEST__ = {
  build: buildHighlightIndex,
  markup: markupHighlightReport,
  isMemberAffectedByMentions,
  memberAffectedRecords
};
function extraOutputRequested() {
  return {
    landscape: !!($("notSelfLandscape") && $("notSelfLandscape").checked),
    between: !!($("betweenMembers") && $("betweenMembers").checked)
  };
}
function applyExtraOutput(html, md, person1, person2, extraMeta) {
  const want = extraOutputRequested();
  if (!want.landscape && !want.between) return { html, md };
  if (!window.HD || typeof HD.appendExtraOutputSections !== "function") return { html, md };
  let transits = extraMeta && extraMeta.dayTransits;
  if (!transits || !transits.length) {
    try {
      transits = buildTransitsForSelection(window.Astronomy);
    } catch (e) {
      transits = [];
    }
  }
  try {
    return HD.appendExtraOutputSections(html, md, person1, person2, transits, extraMeta || {});
  } catch (e) {
    console.error("extra output", e);
    return { html, md };
  }
}
const ASK_ENDPOINT = "https://transit-question.vercel.app/api/ask";
const ASK_MAX = 5e3;
const ASK_CONTEXT_CAP = 32e3;
const ASK_TIMEOUT_MS = 24e4;
let lastGrokQuestion = null;
let lastGrokAnswerHtml = null;
let lastHtmlBase = null;
function askGrokBoxOn() {
  try {
    const box = $("askGrokBox");
    return !!(box && box.checked);
  } catch (e) {
    return false;
  }
}
const PLAIN_LANG_STORAGE_KEY = "hdta_ask_plain_language";
const PLAIN_LANG_INSTRUCTION = `PLAIN LANGUAGE STORY: Write ONE comprehensive, continuous narrative in flowing paragraphs, as a thoughtful friend would tell it. Fold the user's actual question into the story so it is answered as the story unfolds \u2014 do not start with a separate outline or bullet summary. Tell how these members interact and react with each other according to their designs, and how the selected transit period affects each of their designs and therefore the group dynamic. Weave every member into the story in a meaningful way, and naturally touch the important ways they work with one another, without turning the answer into a catalog, a pair-by-pair rundown, per-person data snippets, bullet lists, or labeled sections. No headings except perhaps one short title. Use everyday wording. Avoid Human Design jargon (gates, lines, channels, centers, Type, Strategy, Authority, Not-Self, definition, and similar terms). If a technical idea is essential, explain it in one short plain sentence instead of using the term. Be concrete: say what it may look or feel like in practice, give everyday examples, name the people, and weave in weekdays and 12-hour AM/PM times from the supplied context. Keep potentials, not predictions (for example, "this may favor" or "this can feel like," never "this will happen"). Use first names only. Cover every member. When a gender is supplied for someone, use only that person's she/her or he/him pronouns. Never use they/them for an individual. Never append a pronoun tag after a name. After naming someone whose pronouns are known, use he or she as supplied in later sentences; they is only correct for two or more people together. If a member has no gender supplied, refer to that person by first name only and do not use he, she, or they for that person. Mention a given clock time or time span only once; mention that time again only when it marks a relevant change, such as a transit or definition actually shifting. Still use only the supplied meanings and context; do not invent facts. Do not output JSON, fenced code blocks, or structured section labels.`;
function askPlainLanguageOn() {
  try {
    const el = document.getElementById("askPlainLanguage");
    if (el) return !!el.checked;
  } catch (e) {
  }
  return true;
}
function persistPlainLanguagePref() {
  try {
    sessionStorage.setItem(PLAIN_LANG_STORAGE_KEY, askPlainLanguageOn() ? "1" : "0");
  } catch (e) {
  }
}
function restorePlainLanguagePref() {
  const el = document.getElementById("askPlainLanguage");
  if (!el) return;
  var raw = null;
  try {
    raw = sessionStorage.getItem(PLAIN_LANG_STORAGE_KEY);
  } catch (e) {
  }
  if (raw === "0") el.checked = false;
  else if (raw === "1") el.checked = true;
}
function applyPlainLanguageToAsk(out) {
  const on = askPlainLanguageOn();
  out = out || {};
  out.plainLanguage = on;
  out.context = out.context || {};
  if (on) {
    out.context.plainLanguage = true;
    const prev = out.context.instruction ? String(out.context.instruction) : "";
    out.context.instruction = prev ? prev + "\n" + PLAIN_LANG_INSTRUCTION : PLAIN_LANG_INSTRUCTION;
  } else {
    out.context.plainLanguage = false;
  }
  try {
    out.advantagesFocus = typeof askGrokBoxOn === "function" ? !!askGrokBoxOn() : true;
    out.context.advantagesFocus = out.advantagesFocus;
    if (out.advantagesFocus) {
      out.context.instruction = String(out.context.instruction || "") + "\nEmphasize the advantages and difficulties that may show up in this period, still as part of the same continuous story (or the usual technical answer if plain language is off).";
    } else {
      out.context.instruction = String(out.context.instruction || "") + "\nAnswer the user's question fully. Do not force an advantages-and-difficulties frame if the question points elsewhere.";
    }
  } catch (e) {
  }
  try {
    if (on && typeof listAskPairNames === "function") {
      var names = listAskPairNames();
      out.requiredPeople = names.people;
      out.context.requiredPeople = names.people;
      if (names.people.length) {
        var extra = "Required members (every one must appear meaningfully, first names only): " + names.people.join(", ") + ". Weave their important interactions naturally through one continuous story. Do not write a pair-by-pair catalog, per-person snippets, bullet lists, or labeled sections.";
        out.context.instruction = String(out.context.instruction || "") + "\n" + extra;
      }
    }
  } catch (e) {
  }
  try {
    if (typeof collectMemberGenders === "function") {
      var genders = collectMemberGenders();
      out.genders = genders;
      out.context = out.context || {};
      out.context.genders = genders;
      var lines = genders.map(function(g) {
        if (g.gender === "female") return g.name + ": female, use she/her naturally in sentences, never as a tag after the name.";
        if (g.gender === "male") return g.name + ": male, use he/him naturally in sentences, never as a tag after the name.";
        return g.name + ": gender not known \u2014 refer to this person by first name only; do not use he, she, they, or any pronoun; do not append a tag after the name.";
      });
      if (lines.length) {
        out.context.instruction = String(out.context.instruction || "") + '\nMember genders (authoritative; never they/them for an individual; never write "Name (she/her)" or "Name (he/him)"; if gender is not known, use the first name only and no pronoun): ' + lines.join(" ");
      }
    }
  } catch (e) {
  }
  return out;
}
function listAskPairNames() {
  var seen = {};
  var names = [];
  try {
    var people = typeof loadedPeopleList === "function" ? loadedPeopleList() : [];
    for (var i = 0; i < people.length; i++) {
      var n = firstNameMember(people[i] && people[i].name);
      var k = String(n || "").toLowerCase();
      if (n && !seen[k]) {
        seen[k] = 1;
        names.push(n);
      }
    }
  } catch (e) {
  }
  names.sort(typeof cmpAskName === "function" ? cmpAskName : function(a2, b2) {
    return String(a2).localeCompare(String(b2), "en", { sensitivity: "base" });
  });
  var pairs = [];
  for (var a = 0; a < names.length; a++) {
    for (var b = a + 1; b < names.length; b++) {
      pairs.push(names[a] + " & " + names[b]);
    }
  }
  return { people: names, pairs };
}
function pairSortKey(a, b) {
  var cmp = typeof cmpAskName === "function" ? cmpAskName : function(x, y) {
    return String(x || "").localeCompare(String(y || ""), "en", { sensitivity: "base" });
  };
  var n1 = String(a || ""), n2 = String(b || "");
  if (cmp(n1, n2) > 0) {
    var t = n1;
    n1 = n2;
    n2 = t;
  }
  return n1 + " & " + n2;
}
function textBlock(s) {
  s = String(s == null ? "" : s).trim();
  if (!s) return "";
  return s.split(/\n{2,}/).map(function(p) {
    p = p.trim();
    if (!p) return "";
    return "<p>" + escapeGrok(p).replace(/\n/g, "<br>") + "</p>";
  }).join("");
}
function extractHdtaJson(text) {
  text = String(text == null ? "" : text);
  var chunks = [];
  var re = /```(?:hdta|json)\s*([\s\S]*?)```/gi;
  var m;
  while (m = re.exec(text)) chunks.push(m[1]);
  if (!chunks.length) {
    var start = text.search(/\{\s*"(?:answer|pairs|group|people)"\s*:/);
    if (start >= 0) {
      var depth = 0, end = -1;
      for (var i = start; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      if (end > start) chunks.push(text.slice(start, end));
    }
  }
  for (var c = chunks.length - 1; c >= 0; c--) {
    var raw = String(chunks[c] || "").trim();
    if (!raw) continue;
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
      } catch (e2) {
      }
    }
  }
  return null;
}
function pickField(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] != null && String(obj[keys[i]]).trim()) return String(obj[keys[i]]).trim();
  }
  return "";
}
function normalizePlainLanguageParsed(obj, fallbackText) {
  var out = { answer: "", people: [], group: null, pairs: [], fallback: "" };
  if (!obj || typeof obj !== "object") {
    out.fallback = String(fallbackText || "");
    out.answer = out.fallback;
    return out;
  }
  out.answer = pickField(obj, ["answer", "opening", "response", "questionAnswer"]);
  var people = obj.people || obj.members || obj.impressions || [];
  if (Array.isArray(people)) {
    people.forEach(function(p) {
      if (typeof p === "string") {
        var name = firstNameMember(p);
        if (name) out.people.push({ name, impression: p });
        return;
      }
      var name = firstNameMember(pickField(p, ["name", "person", "firstName"]));
      var impression = pickField(p, ["impression", "howTheyComeAcross", "text", "blurb", "comeAcross"]);
      if (name) out.people.push({ name, impression });
    });
  }
  out.people.sort(function(a, b) {
    return (typeof cmpAskName === "function" ? cmpAskName : function(x, y) {
      return String(x).localeCompare(String(y));
    })(a.name, b.name);
  });
  var g = obj.group || obj.allTogether || obj.together || obj.overall || null;
  if (typeof g === "string" && g.trim()) {
    out.group = { strengths: g, flow: "", snag: "", roles: "", suggestions: "" };
  } else if (g && typeof g === "object") {
    out.group = {
      strengths: pickField(g, ["strengths", "strengthsTogether", "shared", "energy", "sharedEnergy"]),
      flow: pickField(g, ["flow", "whereItFlows", "flows"]),
      snag: pickField(g, ["snag", "friction", "whereItMaySnag", "frictionPoints"]),
      roles: pickField(g, ["roles", "whoStepsWhere", "rolesInTheGroup"]),
      suggestions: pickField(g, ["suggestions", "practical", "practicalSuggestions", "workingTogether"])
    };
    var has = out.group.strengths || out.group.flow || out.group.snag || out.group.roles || out.group.suggestions;
    if (!has) out.group = null;
  }
  var pairs = obj.pairs || obj.pairSections || [];
  if (Array.isArray(pairs)) {
    pairs.forEach(function(p) {
      if (!p || typeof p !== "object") return;
      var a = "", b = "";
      if (Array.isArray(p.names) && p.names.length >= 2) {
        a = firstNameMember(p.names[0]);
        b = firstNameMember(p.names[1]);
      } else {
        a = firstNameMember(pickField(p, ["a", "nameA", "personA", "first"]));
        b = firstNameMember(pickField(p, ["b", "nameB", "personB", "second"]));
      }
      if (!a || !b || a.toLowerCase() === b.toLowerCase()) return;
      var key = pairSortKey(a, b);
      var parts = key.split(" & ");
      out.pairs.push({
        a: parts[0],
        b: parts[1],
        key,
        brings: pickField(p, ["brings", "whatEachBrings", "eachBrings"]),
        click: pickField(p, ["click", "whereTheyClick", "clickWhere"]),
        friction: pickField(p, ["friction", "whereFriction", "frictionMayArise"]),
        suggestion: pickField(p, ["suggestion", "workingTogether", "practical", "practicalSuggestion"])
      });
    });
  }
  var seen = {};
  var uniq = [];
  out.pairs.forEach(function(p) {
    if (!seen[p.key]) {
      seen[p.key] = 1;
      uniq.push(p);
    }
  });
  uniq.sort(function(x, y) {
    return (typeof cmpAskName === "function" ? cmpAskName : function(a, b) {
      return String(a).localeCompare(String(b));
    })(x.a, y.a) || (typeof cmpAskName === "function" ? cmpAskName : function(a, b) {
      return String(a).localeCompare(String(b));
    })(x.b, y.b);
  });
  out.pairs = uniq;
  if (!out.answer) out.answer = String(fallbackText || "").trim();
  return out;
}
function parseHeadingPlainLanguage(text) {
  text = String(text || "");
  var out = { answer: "", people: [], group: null, pairs: [], fallback: text };
  var parts = text.split(/^##\s+/m);
  if (parts.length <= 1) {
    out.answer = text.trim();
    return out;
  }
  out.answer = String(parts[0] || "").replace(/^===ANSWER===\s*/i, "").trim();
  var group = { strengths: "", flow: "", snag: "", roles: "", suggestions: "" };
  var hasGroup = false;
  function takeLabeled(body2) {
    var fields = { brings: "", click: "", friction: "", suggestion: "" };
    var map = [
      ["brings", /^(?:\*\*)?(?:What each brings|Each brings)(?:\*\*)?\s*:\s*/i],
      ["click", /^(?:\*\*)?(?:Where they click|Click)(?:\*\*)?\s*:\s*/i],
      ["friction", /^(?:\*\*)?(?:Where friction may arise|Friction)(?:\*\*)?\s*:\s*/i],
      ["suggestion", /^(?:\*\*)?(?:Working together|Practical suggestion|Suggestion)(?:\*\*)?\s*:\s*/i]
    ];
    var lines = String(body2 || "").split(/\n/);
    var cur = null, buf = [];
    function flush() {
      if (cur) fields[cur] = (fields[cur] ? fields[cur] + "\n" : "") + buf.join("\n").trim();
      buf = [];
    }
    lines.forEach(function(line) {
      var hit = null;
      for (var i2 = 0; i2 < map.length; i2++) {
        if (map[i2][1].test(line)) {
          hit = map[i2];
          break;
        }
      }
      if (hit) {
        flush();
        cur = hit[0];
        buf = [line.replace(hit[1], "").trim()];
      } else buf.push(line);
    });
    flush();
    if (!fields.brings && !fields.click && !fields.friction && !fields.suggestion) fields.brings = String(body2 || "").trim();
    return fields;
  }
  for (var i = 1; i < parts.length; i++) {
    var block = parts[i];
    var nl = block.indexOf("\n");
    var title = (nl < 0 ? block : block.slice(0, nl)).trim();
    var body = (nl < 0 ? "" : block.slice(nl + 1)).trim();
    var t = title.replace(/[:*]/g, "").trim();
    if (/^(how they come across|people|members)/i.test(t)) {
      body.split(/^###\s+/m).forEach(function(sub, idx) {
        if (idx === 0 && !/^###/.test(body)) return;
        var sn = sub.indexOf("\n");
        var nm = firstNameMember((sn < 0 ? sub : sub.slice(0, sn)).trim());
        var im = (sn < 0 ? "" : sub.slice(sn + 1)).trim();
        if (nm) out.people.push({ name: nm, impression: im });
      });
    } else if (/^(all together|how everyone works together|the group|overall)/i.test(t)) {
      hasGroup = true;
      body.split(/^###\s+/m).forEach(function(sub, idx) {
        var sn = sub.indexOf("\n");
        var st = (sn < 0 ? sub : sub.slice(0, sn)).trim();
        var sb = (sn < 0 ? "" : sub.slice(sn + 1)).trim();
        if (/strength/i.test(st)) group.strengths = sb;
        else if (/flow/i.test(st)) group.flow = sb;
        else if (/snag|friction/i.test(st)) group.snag = sb;
        else if (/role/i.test(st)) group.roles = sb;
        else if (/practical|suggest/i.test(st)) group.suggestions = sb;
        else if (!group.strengths) group.strengths = sb || st;
      });
    } else if (/^(how each person works with each other|pairs)/i.test(t)) {
      body.split(/^###\s+/m).forEach(function(sub, idx) {
        if (idx === 0 && !/^###/.test(body)) return;
        var sn = sub.indexOf("\n");
        var st = (sn < 0 ? sub : sub.slice(0, sn)).trim();
        var sb = (sn < 0 ? "" : sub.slice(sn + 1)).trim();
        var mm = st.split(/\s*(?:&|and)\s*/i);
        if (mm.length >= 2) {
          var fields = takeLabeled(sb);
          var key = pairSortKey(firstNameMember(mm[0]), firstNameMember(mm[1]));
          var parts2 = key.split(" & ");
          out.pairs.push({ a: parts2[0], b: parts2[1], key, brings: fields.brings, click: fields.click, friction: fields.friction, suggestion: fields.suggestion });
        }
      });
    }
  }
  if (hasGroup) out.group = group;
  return normalizePlainLanguageParsed({ answer: out.answer, people: out.people, group: out.group, pairs: out.pairs }, text);
}
function parsePlainLanguageAnswer(text) {
  var raw = String(text == null ? "" : text);
  var json = extractHdtaJson(raw);
  var parsed = null;
  if (json) parsed = normalizePlainLanguageParsed(json, raw);
  if (!parsed || !parsed.pairs.length && !parsed.group && !(json && json.answer)) {
    var headed = parseHeadingPlainLanguage(raw.replace(/```(?:hdta|json)[\s\S]*?```/gi, "").trim());
    if (headed && (headed.pairs.length || headed.group || headed.people.length)) {
      if (parsed && parsed.answer && !headed.answer) headed.answer = parsed.answer;
      parsed = headed;
    }
  }
  if (!parsed) parsed = { answer: raw, people: [], group: null, pairs: [], fallback: raw };
  if (!parsed.answer) parsed.answer = raw;
  return parsed;
}
function detailsCard(cls, title, inner, startOpen) {
  return '<details class="plain-card ' + cls + '"' + (startOpen ? " open" : "") + "><summary>" + escapeGrok(title) + '</summary><div class="plain-card-body">' + inner + "</div></details>";
}
function renderPlainLanguageAnswerHtml(question, body) {
  var parsed = parsePlainLanguageAnswer(body);
  var required = typeof listAskPairNames === "function" ? listAskPairNames() : { people: [], pairs: [] };
  var pairMap = {};
  parsed.pairs.forEach(function(p) {
    pairMap[p.key] = p;
  });
  var ordered = [];
  (required.pairs || []).forEach(function(label) {
    if (pairMap[label]) ordered.push(pairMap[label]);
  });
  parsed.pairs.forEach(function(p) {
    if (!(required.pairs || []).some(function(l) {
      return l === p.key;
    })) ordered.push(p);
  });
  if (!ordered.length) ordered = parsed.pairs.slice();
  var html = "";
  if (question) html += '<p class="grok-q"><em>Asked: ' + escapeGrok(question) + "</em></p>";
  var opening = String(parsed.answer || "").replace(/```(?:hdta|json)[\s\S]*?```/gi, "").trim();
  html += textBlock(opening);
  var needInteractive = !!(parsed.group || ordered.length || parsed.people.length);
  if (!needInteractive) return opening ? html : "";
  html += '<div class="plain-interactive">';
  html += '<div class="pair-toolbar no-print"><button type="button" class="secondary" data-pair-expand>Expand all</button><button type="button" class="secondary" data-pair-collapse>Collapse all</button></div>';
  if (parsed.people.length) {
    html += '<h3 class="plain-subhead">How they come across</h3>';
    parsed.people.forEach(function(p) {
      html += detailsCard("person-card", p.name, textBlock(p.impression || ""), false);
    });
  }
  if (parsed.group) {
    html += '<h3 class="plain-subhead">All together</h3>';
    var g = parsed.group;
    var subs = [
      ["Strengths together", g.strengths],
      ["Where it flows", g.flow],
      ["Where it may snag", g.snag],
      ["Roles", g.roles],
      ["Practical suggestions", g.suggestions]
    ];
    subs.forEach(function(s) {
      if (s[1]) html += detailsCard("group-card", s[0], textBlock(s[1]), false);
    });
  }
  if (ordered.length) {
    html += '<h3 class="plain-subhead">How each person works with each other</h3>';
    ordered.forEach(function(p) {
      var inner = "";
      if (p.brings) inner += "<h4>What each brings</h4>" + textBlock(p.brings);
      if (p.click) inner += "<h4>Where they click</h4>" + textBlock(p.click);
      if (p.friction) inner += "<h4>Where friction may arise</h4>" + textBlock(p.friction);
      if (p.suggestion) inner += "<h4>Working together</h4>" + textBlock(p.suggestion);
      if (!inner) inner = textBlock((p.brings || "") + " " + (p.click || "") + " " + (p.friction || "") + " " + (p.suggestion || ""));
      html += detailsCard("pair-card", p.a + " and " + p.b, inner, false);
    });
  }
  html += "</div>";
  return html;
}
function wirePlainCardControls() {
  var report = document.getElementById("report");
  if (!report || report.getAttribute("data-plain-wired") === "1") return;
  report.setAttribute("data-plain-wired", "1");
  report.addEventListener("click", function(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var expand = t.closest("[data-pair-expand]");
    var collapse = t.closest("[data-pair-collapse]");
    if (!expand && !collapse) return;
    ev.preventDefault();
    var cards = report.querySelectorAll(".grok-answer details.plain-card");
    for (var i = 0; i < cards.length; i++) cards[i].open = !!expand;
  });
}
function updateAskGrokCount() {
  const ta = $("askGrokQuestion");
  const c = $("askGrokCount");
  const n = ta && ta.value ? ta.value.length : 0;
  if (c) {
    c.textContent = n + "/" + ASK_MAX + (n > ASK_MAX ? " \u2014 too long" : "");
    if (n > ASK_MAX) c.classList.add("warn");
    else c.classList.remove("warn");
  }
  const btn = $("askGrokBtn");
  if (btn && btn.getAttribute("data-loading") !== "1") {
    btn.disabled = n === 0 || n > ASK_MAX;
  }
}
function syncAskGrokPanel() {
  try {
    document.body.classList.remove("ask-question-off");
  } catch (e) {
  }
  const panel = $("askGrokPanel");
  if (panel) {
    panel.style.display = "block";
    panel.hidden = false;
  }
  const plLab = document.getElementById("askPlainLanguageLabel") || document.querySelector('label[for="askPlainLanguage"]');
  if (plLab) plLab.hidden = false;
  const plHint = document.getElementById("askPlainLanguageHint");
  if (plHint) plHint.hidden = false;
  updateAskGrokCount();
}
function escapeGrok(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function clipAsk(s, n) {
  s = String(s == null ? "" : s);
  if (s.length <= n) return s;
  return s.slice(0, n) + "\n[truncated to keep the request size reasonable]";
}
function escapeClipRe(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clipToBudget(text, take) {
  text = String(text == null ? "" : text);
  if (take <= 0) return "";
  if (text.length <= take) return text;
  let chunk = text.slice(0, take);
  const cut = Math.max(chunk.lastIndexOf("\n\n"), chunk.lastIndexOf(". "));
  if (cut > take * 0.55) chunk = chunk.slice(0, cut + (chunk[cut] === "." ? 1 : 0));
  return chunk.replace(/\s+$/, "") + "\n[truncated]\n";
}
function inferClipMemberNames(s, names) {
  const out = [];
  const seen = {};
  (names || []).forEach(function(n) {
    const t = String(n || "").trim().split(/\s+/)[0];
    if (t && !seen[t]) {
      seen[t] = 1;
      out.push(t);
    }
  });
  if (out.length) return out;
  const head = String(s || "").split("\n").slice(0, 12).join("\n");
  const m = head.match(/:\s*([^\n]+)/);
  if (m) {
    String(m[1]).split(/\s*(?:&|and|,)\s*/i).forEach(function(part) {
      const t = part.trim().split(/\s+/)[0];
      if (t && /^[A-Z][A-Za-z'’\-]+$/.test(t) && !seen[t]) {
        seen[t] = 1;
        out.push(t);
      }
    });
  }
  return out;
}
function splitNamedBlocks(text, names) {
  text = String(text == null ? "" : text);
  const labels = (names || []).filter(Boolean);
  let head;
  if (labels.length) {
    head = "(?:" + labels.map(escapeClipRe).join("|") + "|Together|Between\\s+[^\\n]+)";
  } else {
    head = "(?:Together|Between\\s+[^\\n]+)";
  }
  const re = new RegExp("(?=^" + head + "\\s*$)", "m");
  const parts = text.split(re);
  if (parts.length <= 1) return { intro: text, blocks: [] };
  const intro = parts[0] || "";
  const blocks = parts.slice(1).map(function(p) {
    const line = (p.split(/\n/, 1)[0] || "").trim();
    const isMember = labels.some(function(n) {
      return line === n;
    });
    return { heading: line, isMember, text: p };
  });
  return { intro, blocks };
}
function allocateByLength(lengths, budget) {
  const n = lengths.length;
  const sizes = new Array(n).fill(0);
  if (n === 0 || budget <= 0) return sizes;
  const left = lengths.map(function(len, i) {
    return { i, left: Math.max(0, len) };
  });
  let remain = budget;
  while (remain > 0) {
    const open = left.filter(function(x) {
      return x.left > 0;
    });
    if (!open.length) break;
    const slice = Math.max(1, Math.floor(remain / open.length));
    for (let k = 0; k < open.length && remain > 0; k++) {
      const give = Math.min(open[k].left, slice, remain);
      sizes[open[k].i] += give;
      open[k].left -= give;
      remain -= give;
    }
  }
  return sizes;
}
function clipDayEqualMembers(dayText, budget, names) {
  dayText = String(dayText == null ? "" : dayText);
  if (dayText.length <= budget) return dayText;
  const parsed = splitNamedBlocks(dayText, names);
  if (!parsed.blocks.length) return clipToBudget(dayText, budget);
  const intro = parsed.intro || "";
  const introCap = Math.min(intro.length, Math.max(80, Math.floor(budget * 0.15)));
  const introOut = intro.length <= introCap ? intro : clipToBudget(intro, introCap);
  let remain = budget - introOut.length;
  if (remain < 200) return clipToBudget(dayText, budget);
  const sizes = allocateByLength(parsed.blocks.map(function(b) {
    return b.text.length;
  }), remain);
  let out = introOut;
  for (let i = 0; i < parsed.blocks.length; i++) {
    const left = budget - out.length;
    if (left < 40) break;
    const take = Math.min(parsed.blocks[i].text.length, sizes[i], left);
    out += clipToBudget(parsed.blocks[i].text, take);
  }
  return out;
}
function clipAskDateOrder(s, n, memberNames) {
  s = String(s == null ? "" : s).trim();
  if (s.length <= n) return s;
  const names = inferClipMemberNames(s, memberNames);
  const note = "\n[truncated to keep the request size reasonable; excerpts from each date and member kept]";
  const re = /(?=^(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), )/m;
  const parts = s.split(re);
  let pre = parts[0] || "";
  let days = parts.slice(1);
  if (/^(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), /.test(pre)) {
    days = [pre].concat(days);
    pre = "";
  }
  if (!days.length) return clipAsk(s, n);
  const budget = n - pre.length - note.length;
  if (budget < 400) return clipAsk(s, n);
  const daySizes = allocateByLength(days.map(function(d) {
    return d.length;
  }), budget);
  let out = pre;
  for (let i = 0; i < days.length; i++) {
    const remain = n - out.length - note.length;
    if (remain < 200) break;
    const take = Math.min(days[i].length, daySizes[i], remain);
    const chunk = clipDayEqualMembers(days[i], take, names);
    out += chunk;
    if (chunk.length < days[i].length && !/\[(?:day )?truncated\]\s*$/.test(chunk)) {
      out += "\n[day truncated]\n";
    }
  }
  return out.trim() + note;
}
function reportTextWithoutChrome(root) {
  if (!root) return "";
  const clone = root.cloneNode(true);
  clone.querySelectorAll(".tech, .transit-positions, .grok-answer, #timelineEventsJson, pre[style]").forEach((el) => el.remove());
  return (clone.innerText || clone.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function splitExtraOutputText(extraEl) {
  const out = { landscape: "", between: "" };
  if (!extraEl) return out;
  let mode2 = "";
  const buf = { landscape: [], between: [] };
  function walk(node) {
    if (node.nodeType !== 1) return;
    const tag = (node.tagName || "").toLowerCase();
    if (tag === "h2") {
      const t = (node.textContent || "").trim();
      if (/Not-Self landscape/i.test(t)) mode2 = "landscape";
      else if (/Between members/i.test(t)) mode2 = "between";
    }
    if ((tag === "h2" || tag === "h3" || tag === "p" || tag === "em") && mode2 && buf[mode2]) {
      const t = (node.innerText || node.textContent || "").trim();
      if (t) buf[mode2].push(t);
    }
    if (tag !== "h2" && tag !== "h3" && tag !== "p") {
      for (const ch of node.children || []) walk(ch);
    }
  }
  for (const ch of extraEl.children || []) walk(ch);
  out.landscape = buf.landscape.join("\n\n");
  out.between = buf.between.join("\n\n");
  if (!out.landscape && !out.between) {
    const all = (extraEl.innerText || "").trim();
    out.landscape = all;
  }
  return out;
}
function glFromVal(val) {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val).trim();
  if (val.gl) return String(val.gl);
  if (val.gate != null && val.line != null) return val.gate + "." + val.line;
  return "";
}
function activationsBySide(person, side) {
  const order = window.HD && HD.PLANET_ORDER || ["Sun", "Earth", "Moon", "NorthNode", "SouthNode", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const out = {};
  for (const a of person.all_planet_activations || []) {
    const s = a.side || "personality";
    if (s !== side) continue;
    const gl = glFromVal(a);
    if (a.planet && gl) out[a.planet] = gl;
  }
  const map = side === "design" ? person.design_planets || {} : person.planets || {};
  for (const p of order) {
    if (out[p]) continue;
    const gl = glFromVal(map[p]);
    if (gl) out[p] = gl;
  }
  const parts = [];
  const seen = /* @__PURE__ */ new Set();
  for (const p of order) {
    if (out[p]) {
      parts.push(p + " " + out[p]);
      seen.add(p);
    }
  }
  Object.keys(out).forEach((p) => {
    if (!seen.has(p)) parts.push(p + " " + out[p]);
  });
  return parts;
}
function compactDesignSummary(person) {
  const profile = window.HD && typeof HD.deriveHdProfile === "function" ? HD.deriveHdProfile(person) : {};
  const centerOrder = ["Head", "Ajna", "Throat", "G", "Heart/Ego", "Sacral", "Solar Plexus", "Spleen", "Root"];
  const rank = (c) => {
    const i = centerOrder.indexOf(c);
    return i < 0 ? 99 : i;
  };
  const defined = [...person.defined_centers || []].map(String).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const open = (window.HD && typeof HD.openCentersOf === "function" ? HD.openCentersOf(person) : []).slice();
  const channels = (person.natal_channel_list || []).map((ch) => {
    const cents = (ch.centers || []).join("\u2013");
    const gates = (ch.gates || []).join("-");
    return (ch.name || ch.id || "") + (cents ? " (" + cents + ")" : "") + (gates ? " " + gates : "");
  });
  const pn = window.HD && typeof HD.personPronouns === "function" ? HD.personPronouns(person) : null;
  const genderKnown = !!(pn && pn.known && pn.gender);
  return {
    name: firstNameMember(person.name),
    pronouns: genderKnown ? pn.label || "" : "",
    gender: genderKnown ? pn.gender : "",
    type: profile.type || "",
    strategy: profile.strategy || "",
    authority: profile.authority || "",
    definition: profile.definition || "",
    definedCenters: defined,
    openCenters: open,
    natalChannels: channels,
    personalityActivations: activationsBySide(person, "personality"),
    designActivations: activationsBySide(person, "design")
  };
}
function loadAskPersonFromBox(which) {
  try {
    const raw = String(getPersonRaw(which) || "").trim();
    if (!raw) return null;
    if (!window.HD || typeof HD.loadPerson !== "function") return null;
    const parsed = parseInput(raw) || raw;
    const n = arguments.length && arguments[0];
    return HD.loadPerson(typeof applyGenderToChart === "function" && n ? applyGenderToChart(parsed, n) : parsed);
  } catch (e) {
    return null;
  }
}
const IMPACT_WEIGHTS = { newlyDefined: 8, completedChannel: 5, openCenterGate: 3, amplifiedCenter: 2 };
const ASK_MEMBER_BLOCK_BUDGET = 2200;
const ASK_PAIR_BLOCK_BUDGET = 500;
function cmpAskName(a, b) {
  return String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base" });
}
function loadedPeopleList() {
  const out = [];
  for (let n = 1; n <= 6; n++) {
    try {
      const raw = loadParsedFromBox(n);
      if (!raw) continue;
      if (!window.HD || typeof HD.loadPerson !== "function") continue;
      const person = HD.loadPerson(typeof applyGenderToChart === "function" ? applyGenderToChart(raw, n) : raw);
      if (person) {
        person._inputSlot = n;
        out.push(person);
      }
    } catch (e) {
    }
  }
  return out;
}
function askFieldKey(field) {
  if (!field || !field.planets) return "";
  const names = Object.keys(field.planets).sort();
  const parts = [];
  for (let i = 0; i < names.length; i++) {
    const p = field.planets[names[i]];
    parts.push(names[i] + ":" + (p && (p.gl || p.gate + "." + p.line) || ""));
  }
  return parts.join("|");
}
function askFieldAtMs(ms, tz) {
  if (!window.HD || typeof HD.computeTransitField !== "function" || !window.Astronomy) return null;
  const utcDate = new Date(ms);
  const field = HD.computeTransitField(window.Astronomy, utcDate);
  field.tz = tz;
  field._atMs = ms;
  try {
    field.display_when = formatDisplayDateTime(utcDate, tz);
    field.display_date = formatDisplayDateOnly(utcDate, tz);
    field.display_time = formatDisplayTimeOnly(utcDate, tz);
  } catch (e) {
  }
  return field;
}
function preparedAskField(field) {
  if (!field) return null;
  try {
    if (typeof transitWithoutLights === "function") return transitWithoutLights(field);
  } catch (e) {
  }
  return field;
}
function collectAskTransitFields() {
  const tz = $("tz") && $("tz").value || "America/Los_Angeles";
  const win = typeof getQueryWindow === "function" ? getQueryWindow(tz) : null;
  const out = [];
  const seen = {};
  function add(raw) {
    const field = preparedAskField(raw);
    if (!field || !field.planets) return;
    const key = askFieldKey(field);
    if (!key || seen[key]) return;
    seen[key] = 1;
    out.push(field);
  }
  if (win && isFinite(win.startMs)) add(askFieldAtMs(win.startMs, tz));
  if (win && isFinite(win.endMs) && win.endMs !== win.startMs) add(askFieldAtMs(win.endMs, tz));
  try {
    const snaps = buildTransitsForSelection(window.Astronomy);
    for (let i = 0; i < (snaps || []).length; i++) add(snaps[i]);
  } catch (e) {
  }
  try {
    const evs = window.__LAST_EVENTS__ || [];
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      const ms = ev && (ev.atMs != null ? ev.atMs : ev.ms != null ? ev.ms : ev.tMs != null ? ev.tMs : null);
      if (win && ms != null && (ms < win.startMs || ms > win.endMs)) continue;
      if (ev && ev.afterField) add(ev.afterField);
    }
  } catch (e) {
  }
  try {
    if (window.__LAST_TRANSIT__) add(window.__LAST_TRANSIT__);
  } catch (e) {
  }
  try {
    const days = window.__LAST_DAY_TRANSITS__ || [];
    for (let i = 0; i < days.length; i++) add(days[i]);
  } catch (e) {
  }
  out.sort(function(a, b) {
    return (a._atMs || 0) - (b._atMs || 0);
  });
  return { fields: out, win, tz };
}
function formatAskSpan(span, win, tz) {
  let enter = span && span.enterMs != null ? span.enterMs : win && win.startMs;
  let exit = span && span.exitMs != null ? span.exitMs : win && win.endMs;
  if (win) {
    if (enter == null || enter < win.startMs) enter = win.startMs;
    if (exit == null || exit > win.endMs) exit = win.endMs;
  }
  if (enter == null || exit == null || exit < enter) return "";
  try {
    const start = formatDisplayDateTime(new Date(enter), tz);
    const endTime = formatDisplayTimeOnly(new Date(exit), tz);
    const startDay = formatDisplayDateOnly(new Date(enter), tz);
    const endDay = formatDisplayDateOnly(new Date(exit), tz);
    if (startDay === endDay) {
      const at = start.indexOf(" at ");
      const left = at >= 0 ? start.slice(0, at) : start;
      const from = at >= 0 ? start.slice(at + 4) : start;
      return left + " from " + from + " to " + endTime;
    }
    return start + " to " + formatDisplayDateTime(new Date(exit), tz);
  } catch (e) {
    return "";
  }
}
function spanForAskPlanet(planet, field, win, tz) {
  const at = field && (field._atMs != null ? field._atMs : null);
  if (at == null || !planet) return win ? formatAskSpan(null, win, tz) : "";
  let span = null;
  try {
    if (window.HD && typeof HD.spanForPlanetAt === "function") span = HD.spanForPlanetAt(planet, at, tz);
    else if (window.HD && typeof HD.findPlanetSpanAround === "function") span = HD.findPlanetSpanAround(window.Astronomy, planet, at, true);
  } catch (e) {
    span = null;
  }
  return formatAskSpan(span, win, tz) || (field.display_when || "");
}
function shortAskChannel(ch) {
  if (!ch) return "";
  const info = ch.info || ch;
  const id = info.id || ch.channel || "";
  const name = info.name || "";
  const gates = (info.gates || ch.natal_gates || ch.transit_gates || []).join("-");
  const planets = (ch.transit_planets || []).join(", ");
  let s = (id + (name ? " " + name : "")).trim();
  if (gates) s += " (gates " + gates + ")";
  if (planets) s += " via " + planets;
  if (ch.kind && ch.kind !== "completion") s += " [" + ch.kind + "]";
  return s;
}
function uniquePush(list, key, item) {
  if (key && list._seen && list._seen[key]) return;
  if (!list._seen) list._seen = {};
  if (key) list._seen[key] = 1;
  list.push(item);
}
function mergePersonAskImpact(person, pack) {
  const name = firstNameMember(person && person.name);
  const fields = pack.fields || [];
  const win = pack.win;
  const tz = pack.tz;
  let profile = { type: "", authority: "", strategy: "", definition: "" };
  let definedCenters = [];
  let openCenters = [];
  const newly = [];
  const completed = [];
  const amplified = [];
  const openGates = [];
  const touches = [];
  for (let i = 0; i < fields.length; i++) {
    let sum = null;
    try {
      sum = HD.summarizePersonTransit(person, fields[i]);
    } catch (e) {
      sum = null;
    }
    if (!sum) continue;
    if (sum.profile) profile = sum.profile;
    if (sum.definedCenters && sum.definedCenters.length) definedCenters = sum.definedCenters;
    if (sum.openCenters && sum.openCenters.length) openCenters = sum.openCenters;
    for (let j = 0; j < (sum.newlyDefined || []).length; j++) uniquePush(newly, sum.newlyDefined[j], sum.newlyDefined[j]);
    for (let j = 0; j < (sum.completedChannels || []).length; j++) {
      const ch = sum.completedChannels[j];
      const id = ch.info && ch.info.id || ch.channel || shortAskChannel(ch);
      uniquePush(completed, id, ch);
    }
    for (let j = 0; j < (sum.amplifiedCenters || []).length; j++) uniquePush(amplified, sum.amplifiedCenters[j], sum.amplifiedCenters[j]);
    for (let j = 0; j < (sum.openCenterGates || []).length; j++) {
      const g = sum.openCenterGates[j];
      const key = (g.gate != null ? String(g.gate) : "") + "|" + (g.planet || "");
      const rec = Object.assign({}, g, { span: spanForAskPlanet(g.planet, fields[i], win, tz) });
      uniquePush(openGates, key, rec);
    }
    for (let j = 0; j < (sum.touches || []).length; j++) {
      const t = sum.touches[j];
      const gate = t.gate && (t.gate.number || t.gate.name) || t.gate;
      const key = (t.planet || "") + "|" + gate;
      const rec = Object.assign({}, t, { span: spanForAskPlanet(t.planet, fields[i], win, tz) });
      uniquePush(touches, key, rec);
    }
  }
  const breakdown = {
    newlyDefinedOpenCenters: newly.length,
    channelsCompleted: completed.length,
    openCenterGates: (function() {
      const seen = {};
      let n = 0;
      for (let i = 0; i < openGates.length; i++) {
        const k = String(openGates[i].gate);
        if (!seen[k]) {
          seen[k] = 1;
          n++;
        }
      }
      return n;
    })(),
    amplifiedDefinedCenters: amplified.length
  };
  const score = breakdown.newlyDefinedOpenCenters * IMPACT_WEIGHTS.newlyDefined + breakdown.channelsCompleted * IMPACT_WEIGHTS.completedChannel + breakdown.openCenterGates * IMPACT_WEIGHTS.openCenterGate + breakdown.amplifiedDefinedCenters * IMPACT_WEIGHTS.amplifiedCenter;
  return {
    name,
    type: profile.type || "",
    strategy: profile.strategy || "",
    authority: profile.authority || "",
    definition: profile.definition || "",
    definedCenters,
    openCenters,
    newlyDefinedOpenCenters: newly.slice(),
    channelsCompleted: completed.map(shortAskChannel).filter(Boolean),
    channelsCompletedRaw: completed,
    amplifiedDefinedCenters: amplified.slice(),
    openCenterGates: openGates,
    natalHits: touches,
    breakdown,
    score,
    weights: IMPACT_WEIGHTS
  };
}
function formatOpenGateLine(g) {
  if (!g) return "";
  const gl = g.gl || g.gate + (g.line != null ? "." + g.line : "");
  let s = (g.planet || "planet") + " " + gl + (g.center ? " in open " + g.center : "");
  if (g.span) s += " (" + g.span + ")";
  return s;
}
function formatTouchLine(t) {
  if (!t) return "";
  const g = t.gate && (t.gate.number || t.gate.name) || t.gate || "";
  const gl = t.transit && (t.transit.gl || t.transit.gate + "." + t.transit.line) || g;
  let s = (t.planet || "planet") + " " + gl;
  if (t.span) s += " (" + t.span + ")";
  return s;
}
function formatMemberAskBlock(imp) {
  const lines = [];
  const head = [imp.name, imp.type || "", imp.authority ? imp.authority + " Authority" : ""].filter(Boolean).join(" \u2014 ");
  lines.push(head);
  if (imp.definedCenters && imp.definedCenters.length) lines.push("Defined centers: " + imp.definedCenters.join(", ") + ".");
  if (imp.openCenters && imp.openCenters.length) lines.push("Open centers: " + imp.openCenters.join(", ") + ".");
  else lines.push("Open centers: none.");
  lines.push("Transit impact score: " + imp.score + " (open centers newly defined " + imp.breakdown.newlyDefinedOpenCenters + " \xD7 " + IMPACT_WEIGHTS.newlyDefined + "; channels completed " + imp.breakdown.channelsCompleted + " \xD7 " + IMPACT_WEIGHTS.completedChannel + "; transit gates in open centers " + imp.breakdown.openCenterGates + " \xD7 " + IMPACT_WEIGHTS.openCenterGate + "; defined centers amplified " + imp.breakdown.amplifiedDefinedCenters + " \xD7 " + IMPACT_WEIGHTS.amplifiedCenter + ").");
  lines.push("Open centers newly defined: " + (imp.newlyDefinedOpenCenters.length ? imp.newlyDefinedOpenCenters.join(", ") : "none") + ".");
  lines.push("Channels completed by transit: " + (imp.channelsCompleted.length ? imp.channelsCompleted.join("; ") : "none") + ".");
  lines.push("Defined centers amplified: " + (imp.amplifiedDefinedCenters.length ? imp.amplifiedDefinedCenters.join(", ") : "none") + ".");
  const og = imp.openCenterGates.map(formatOpenGateLine).filter(Boolean);
  lines.push("Transit gates in open centers: " + (og.length ? og.join("; ") : "none") + ".");
  const hits = imp.natalHits.map(formatTouchLine).filter(Boolean);
  lines.push("Transit gates hitting natal activations: " + (hits.length ? hits.join("; ") : "none") + ".");
  let text = lines.join("\n");
  if (text.length > ASK_MEMBER_BLOCK_BUDGET) text = clipToBudget(text, ASK_MEMBER_BLOCK_BUDGET);
  return text;
}
function mergePairAsk(a, b, pack) {
  const na = firstNameMember(a.name), nb = firstNameMember(b.name);
  let pA = a, pB = b, nA = na, nB = nb;
  if (cmpAskName(na, nb) > 0) {
    pA = b;
    pB = a;
    nA = nb;
    nB = na;
  }
  const names = [nA, nB];
  const fields = pack.fields || [];
  const electro = [], compromise = [], companion = [], amplified = [], hooks = [];
  for (let i = 0; i < fields.length; i++) {
    let c = null;
    try {
      c = HD.coupleDynamics(pA, pB, fields[i]);
    } catch (e) {
      c = null;
    }
    if (!c) continue;
    (c.electromagnetic || []).forEach(function(ch) {
      uniquePush(electro, ch.id || ch.name, ch);
    });
    (c.compromise || []).forEach(function(ch) {
      uniquePush(compromise, ch.id || ch.name, ch);
    });
    (c.companionship || []).forEach(function(ch) {
      uniquePush(companion, ch.id || ch.name, ch);
    });
    (c.transit_amplified_channels || []).forEach(function(ch) {
      uniquePush(amplified, ch.id || ch.name, ch);
    });
    (c.shared_transit_hooks || []).forEach(function(h) {
      uniquePush(hooks, (h.planet || "") + "|" + (h.gl || ""), h);
    });
  }
  function chs(list) {
    return list.map(function(ch) {
      return (ch.id || "") + (ch.name ? " " + ch.name : "");
    }).filter(Boolean);
  }
  const hookLines = hooks.map(function(h) {
    const who = [];
    if (h.in_a) who.push(nA);
    if (h.in_b) who.push(nB);
    return (h.planet || "") + " " + (h.gl || "") + (who.length ? " in " + who.join(" & ") : "");
  });
  let text = "Between " + names[0] + " and " + names[1] + ": electromagnetic " + (chs(electro).join(", ") || "none") + "; compromise " + (chs(compromise).join(", ") || "none") + "; companionship " + (chs(companion).join(", ") || "none") + "; transit-amplified " + (chs(amplified).join(", ") || "none") + "; shared hooks " + (hookLines.join(", ") || "none") + ".";
  if (text.length > ASK_PAIR_BLOCK_BUDGET) text = clipToBudget(text, ASK_PAIR_BLOCK_BUDGET);
  return { names, text };
}
function buildEqualTransitAskContext(people) {
  const pack = collectAskTransitFields();
  const impacts = people.map(function(p) {
    return mergePersonAskImpact(p, pack);
  });
  impacts.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return cmpAskName(a.name, b.name);
  });
  const ranking = impacts.map(function(imp, i) {
    return {
      rank: i + 1,
      name: imp.name,
      score: imp.score,
      breakdown: imp.breakdown
    };
  });
  const memberBlocks = impacts.map(function(imp) {
    return {
      name: imp.name,
      score: imp.score,
      breakdown: imp.breakdown,
      type: imp.type,
      authority: imp.authority,
      definedCenters: imp.definedCenters,
      openCenters: imp.openCenters,
      newlyDefinedOpenCenters: imp.newlyDefinedOpenCenters,
      channelsCompleted: imp.channelsCompleted,
      amplifiedDefinedCenters: imp.amplifiedDefinedCenters,
      openCenterGates: imp.openCenterGates.map(function(g) {
        return { planet: g.planet, gate: g.gate, line: g.line, gl: g.gl, center: g.center, span: g.span || "" };
      }),
      text: formatMemberAskBlock(imp)
    };
  });
  const pairs = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      pairs.push(mergePairAsk(people[i], people[j], pack));
    }
  }
  pairs.sort(function(a, b) {
    return cmpAskName(a.names[0], b.names[0]) || cmpAskName(a.names[1], b.names[1]);
  });
  const summaryParts = [];
  summaryParts.push("Transit impact ranking (deterministic; ties broken alphabetically by first name, never by input order). Weights: newly defined open center " + IMPACT_WEIGHTS.newlyDefined + ", channel completed by transit " + IMPACT_WEIGHTS.completedChannel + ", transit gate in an open center " + IMPACT_WEIGHTS.openCenterGate + ", amplified defined center " + IMPACT_WEIGHTS.amplifiedCenter + ".");
  summaryParts.push(ranking.map(function(r) {
    return r.rank + ". " + r.name + " (score " + r.score + ": newly defined " + r.breakdown.newlyDefinedOpenCenters + ", completed channels " + r.breakdown.channelsCompleted + ", open-center gates " + r.breakdown.openCenterGates + ", amplified " + r.breakdown.amplifiedDefinedCenters + ")";
  }).join("\n"));
  summaryParts.push("Per-member transit blocks follow. Every loaded member has a block of equal budget. Do not omit anyone listed.");
  for (let i = 0; i < memberBlocks.length; i++) {
    summaryParts.push("--- Member: " + memberBlocks[i].name + " ---\n" + memberBlocks[i].text);
  }
  if (pairs.length) {
    summaryParts.push("Between-member transit lines (every pair, equal budget, alphabetical):");
    for (let i = 0; i < pairs.length; i++) summaryParts.push(pairs[i].text);
  }
  const instruction = "A client-computed transit impact ranking and equal per-member transit blocks are supplied. When asked who is most or least affected, use that ranking and the per-member breakdown. Cover every supplied member. Never rank or omit someone because of missing excerpts. If a member has no transit hits in the window, say so plainly. The ranking does not depend on the order people were entered.";
  try {
    window.__LAST_ASK_IMPACT__ = { ranking, memberBlocks, pairs, fieldCount: pack.fields.length };
  } catch (e) {
  }
  return {
    ranking,
    memberBlocks,
    pairs,
    summaryText: summaryParts.join("\n\n"),
    instruction,
    fieldCount: pack.fields.length
  };
}
function collectAskDesigns() {
  const out = [];
  const sel = selectedPeopleFromBoxes();
  const raws = [sel.p1].concat(sel.extrasRaw || []);
  for (let i = 0; i < raws.length; i++) {
    if (!raws[i]) continue;
    try {
      if (!window.HD || typeof HD.loadPerson !== "function") continue;
      const person = HD.loadPerson(raws[i]);
      if (person) out.push(compactDesignSummary(person));
    } catch (e) {
    }
  }
  return out;
}
function collectAskMembers() {
  const names = [];
  const sel = selectedPeopleFromBoxes();
  const raws = [sel.p1].concat(sel.extrasRaw || []);
  for (let i = 0; i < raws.length; i++) {
    try {
      const n = firstNameMember(raws[i] && raws[i].name);
      if (n) names.push(n);
    } catch (e) {
    }
  }
  return names;
}
function collectAskContext() {
  const want = extraOutputRequested();
  const report = $("report");
  const sections = {
    notSelfLandscape: !!want.landscape,
    betweenMembers: !!want.between,
    regularReport: !(want.landscape || want.between)
  };
  const natalOnly = typeof timeTransitBasedOn === "function" && !timeTransitBasedOn() || !!window.__NATAL_ONLY__;
  const rangeLabel = natalOnly ? "Natal-only (no transit activity)" : (typeof selectionRangeText === "function" ? selectionRangeText() : "") || $("ephemNote") && $("ephemNote").textContent || "";
  const people = loadedPeopleList();
  const members = people.map(function(p) {
    return firstNameMember(p.name);
  }).filter(Boolean).sort(cmpAskName);
  const designs = people.map(function(p) {
    return compactDesignSummary(p);
  }).sort(function(a, b) {
    return cmpAskName(a.name, b.name);
  });
  const ctx = {
    rangeLabel,
    timezone: natalOnly ? "" : $("tz") && $("tz").value || ""
  };
  if (natalOnly) {
    ctx.mode = "natal-only";
    ctx.natalOnly = true;
    ctx.instruction = "NATAL-ONLY MODE: Answer from the natal charts and member-to-member interactions only. Do not mention transits, the sky, planetary movements, date or time windows, gate time spans, a transit timeline, or a positions table. Do not invent transit weather.";
    const visible = clipAskDateOrder(reportTextWithoutChrome(report), ASK_CONTEXT_CAP, members);
    if (sections.notSelfLandscape) ctx.landscape = visible;
    else if (sections.betweenMembers) ctx.between = visible;
    else ctx.regularSummary = visible;
    return applyPlainLanguageToAsk({ sections, context: ctx, members, designs, rangeLabel, natalOnly: true, mode: "natal-only" });
  }
  let packed = null;
  try {
    packed = buildEqualTransitAskContext(people);
  } catch (e) {
    packed = null;
    console.error("ask transit context", e);
  }
  if (packed && packed.memberBlocks && packed.memberBlocks.length) {
    ctx.memberTransitBlocks = packed.memberBlocks;
    ctx.pairTransitBlocks = packed.pairs;
    ctx.impactRanking = packed.ranking;
    ctx.memberTransitSummary = packed.summaryText;
    ctx.instruction = packed.instruction;
  } else {
    const visible = clipAskDateOrder(reportTextWithoutChrome(report), ASK_CONTEXT_CAP, members);
    if (sections.notSelfLandscape) ctx.landscape = visible;
    else if (sections.betweenMembers) ctx.between = visible;
    else ctx.regularSummary = visible;
  }
  return applyPlainLanguageToAsk({ sections, context: ctx, members, designs, impactRanking: packed && packed.ranking || null, rangeLabel, natalOnly: false, mode: "transit" });
}
function grokSectionHtml(kind, question, body, meta) {
  const q = escapeGrok(question || "");
  let inner;
  if (kind === "loading") {
    inner = "<p><em>Asking\u2026</em></p>";
  } else if (kind === "error") {
    inner = "<p>" + escapeGrok(body || "Something went wrong.") + "</p>";
  } else {
    var prose = String(body || "").replace(/```(?:hdta|json)[\s\S]*?```/gi, "").trim();
    const paras = prose.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    inner = (q ? '<p class="grok-q"><em>Asked: ' + q + "</em></p>" : "") + paras.map((p) => "<p>" + escapeGrok(p).replace(/\n/g, "<br>") + "</p>").join("\n");
    if (meta && meta.finishReason === "length") {
      inner += '<p class="grok-length-note"><em>' + escapeGrok("This answer reached the length limit; ask a narrower follow-up for more.") + "</em></p>";
    }
  }
  const cls = "grok-answer" + (kind === "loading" ? " grok-loading" : "") + (kind === "error" ? " grok-error" : "");
  var adv = typeof askGrokBoxOn === "function" ? askGrokBoxOn() : true;
  var title = adv ? "Question \u2014 Advantages and Difficulties" : "Question &amp; Answer";
  const heading = kind === "ok" ? '<div class="grok-answer-header"><h2>' + title + '</h2><div class="ask-answer-actions-slot no-print"></div></div>\n' : "<h2>" + title + "</h2>\n";
  return '<div class="' + cls + '">' + heading + inner + "</div>";
}
function stripGrokFromHtml(html) {
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(html || "");
    const found = tmp.querySelectorAll(".grok-answer");
    for (let i = 0; i < found.length; i++) found[i].parentNode.removeChild(found[i]);
    return tmp.innerHTML;
  } catch (e) {
    return String(html || "").replace(/<div class="grok-answer[\s\S]*?<\/div>\s*$/i, "").replace(/<div class="grok-answer[\s\S]*?<\/div>/gi, "");
  }
}
function parkThenSetReportHtml(html) {
  try {
    parkAskAnswerActions();
  } catch (e) {
  }
  const wrap = $("report");
  if (wrap) wrap.innerHTML = html;
}
function setReportHtml(html) {
  parkThenSetReportHtml(html);
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  try {
    placeAskAnswerActions();
  } catch (e) {
  }
}
function applyGrokAnswerToReport() {
  try {
    parkAskAnswerActions();
  } catch (e) {
  }
  const wrap = $("report");
  if (!wrap) {
    if (typeof syncAnswerShareButtons === "function") syncAnswerShareButtons();
    try {
      if (typeof markupHighlightReport === "function") markupHighlightReport();
    } catch (e) {
    }
    try {
      placeAskAnswerActions();
    } catch (e) {
    }
    return;
  }
  const base = lastHtmlBase != null ? lastHtmlBase : stripGrokFromHtml(wrap.innerHTML);
  if (!lastGrokAnswerHtml) {
    if (wrap.innerHTML !== base) wrap.innerHTML = base;
    if (typeof lastHtml !== "undefined" && lastHtmlBase != null) lastHtml = lastHtmlBase;
    if (typeof syncAnswerShareButtons === "function") syncAnswerShareButtons();
    try {
      if (typeof markupHighlightReport === "function") markupHighlightReport();
    } catch (e) {
    }
    try {
      placeAskAnswerActions();
    } catch (e) {
    }
    return;
  }
  const next = stripGrokFromHtml(base) + "\n" + lastGrokAnswerHtml;
  wrap.innerHTML = next;
  if (typeof lastHtml !== "undefined") lastHtml = next;
  if (typeof lastMd !== "undefined" && lastGrokQuestion) {
    const mdBase = String(lastMd || "").replace(/\n## Question — Advantages and Difficulties[\s\S]*$/, "");
    lastMd = mdBase + "\n\n## Question \u2014 Advantages and Difficulties\n\n*Asked: " + lastGrokQuestion + "*\n\n" + (lastGrokAnswerText || "") + (lastGrokAnswerHtml && /grok-length-note/.test(lastGrokAnswerHtml) ? "\n\n*This answer reached the length limit; ask a narrower follow-up for more.*" : "") + "\n";
  }
  if (typeof syncAnswerShareButtons === "function") syncAnswerShareButtons();
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  try {
    placeAskAnswerActions();
  } catch (e) {
  }
  try {
    if (typeof wirePlainCardControls === "function") wirePlainCardControls();
  } catch (e) {
  }
}
let lastGrokAnswerText = "";
function rememberReportBase() {
  const wrap = $("report");
  lastHtmlBase = wrap ? stripGrokFromHtml(wrap.innerHTML) : "";
  if (typeof lastHtml !== "undefined") lastHtml = lastHtmlBase;
  if (__hdtaRunInProgress) {
    __hdtaRunInProgress = false;
    try {
      captureLastRunSignature();
    } catch (e) {
    }
  }
}
function setAskStatus(msg, kind) {
  const el = $("askGrokStatus");
  if (el) el.textContent = msg || "";
}
function friendlyAskError(err, status2) {
  const s = String(err || "Something went wrong.");
  if (/XAI_API_KEY is not set yet/i.test(s) || /key isn'?t set yet/i.test(s) || /not set yet/i.test(s) && /XAI_API_KEY|API key/i.test(s)) {
    return "The Grok API key isn't set yet. Add XAI_API_KEY in the Vercel project Settings \u2192 Environment Variables, then redeploy.";
  }
  if (/took too long|timed out|timeout|FUNCTION_INVOCATION_TIMEOUT|abort/i.test(s) || status2 === 504) {
    return "The answer took too long. Try a shorter date range or check a section box, then ask again.";
  }
  if (status2 && status2 !== 200) {
    const base = /failed to fetch|networkerror|load failed|offline/i.test(s) ? "The question service did not respond." : s.replace(/^Request failed \(HTTP \d+\):\s*/i, "").trim();
    return "Request failed (HTTP " + status2 + "): " + base;
  }
  if (/failed to fetch|networkerror|load failed|offline/i.test(s)) {
    return "The question service did not respond (it may have timed out). Try a shorter date range or check a section box, then ask again. If you are offline, reconnect and retry.";
  }
  return s;
}
async function askGrok() {
  const ta = $("askGrokQuestion");
  const question = ta ? ta.value : "";
  const btn = $("askGrokBtn");
  if (!question.trim()) {
    setAskStatus("Please enter a question.");
    return;
  }
  if (question.length > ASK_MAX) {
    setAskStatus("Question is too long (max 5000 characters).");
    return;
  }
  if (typeof resultNeedsRunBeforeAsk === "function" && resultNeedsRunBeforeAsk()) {
    try {
      promptRunBeforeAsk();
    } catch (e) {
    }
    return;
  }
  try {
    clearReportStaleUi();
  } catch (e) {
  }
  if (!window.__LAST_TRANSIT__ && !($("report") && /Transit|Real-world|Not-Self|Story/.test($("report").innerText || ""))) {
  }
  const report = $("report");
  if (!report || !(report.textContent || "").trim() || /Load the ephemeris/.test(report.textContent || "")) {
    setAskStatus("Run an analysis first, then ask a question.");
    return;
  }
  rememberReportBase();
  lastGrokQuestion = question.trim();
  lastGrokAnswerText = "";
  lastGrokAnswerHtml = grokSectionHtml("loading", lastGrokQuestion, "");
  applyGrokAnswerToReport();
  setAskStatus("");
  setAskProcessing(true);
  if (btn) {
    btn.setAttribute("data-loading", "1");
    btn.disabled = true;
    btn.textContent = "Asking\u2026";
  }
  const payload = Object.assign({ question: lastGrokQuestion }, collectAskContext());
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      if (ctrl) ctrl.abort();
    } catch (e) {
    }
  }, ASK_TIMEOUT_MS);
  try {
    const res = await fetch(ASK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : void 0
    });
    let data = null;
    let rawText = "";
    try {
      rawText = await res.text();
    } catch (e) {
      rawText = "";
    }
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      const raw = data && data.error ? String(data.error) : rawText || res.statusText || "Request failed (HTTP " + res.status + ").";
      const msg = friendlyAskError(raw, res.status);
      lastGrokAnswerHtml = grokSectionHtml("error", lastGrokQuestion, msg);
      lastGrokAnswerText = "";
      applyGrokAnswerToReport();
      setAskStatus(msg);
      return;
    }
    const answer = data && data.answer ? String(data.answer).trim() : "";
    if (!answer) {
      const msg = "Grok returned an empty answer. Please try again.";
      lastGrokAnswerHtml = grokSectionHtml("error", lastGrokQuestion, msg);
      applyGrokAnswerToReport();
      setAskStatus(msg);
      return;
    }
    lastGrokAnswerText = answer;
    const finishReason = data && data.finish_reason ? String(data.finish_reason) : "";
    lastGrokAnswerHtml = grokSectionHtml("ok", lastGrokQuestion, answer, { finishReason });
    applyGrokAnswerToReport();
    if (finishReason === "length") {
      setAskStatus("This answer reached the length limit; ask a narrower follow-up for more.");
    } else {
      setAskStatus("Answer added to the report.");
    }
  } catch (e) {
    const aborted = e && (e.name === "AbortError" || /aborted/i.test(e && e.message ? e.message : ""));
    const msg = aborted ? "The answer took too long. Try a shorter date range or check a section box, then ask again." : friendlyAskError(e && e.message ? e.message : e);
    lastGrokAnswerHtml = grokSectionHtml("error", lastGrokQuestion, msg);
    lastGrokAnswerText = "";
    applyGrokAnswerToReport();
    setAskStatus(msg);
  } finally {
    clearTimeout(timer);
    setAskProcessing(false);
    if (btn) {
      btn.removeAttribute("data-loading");
      btn.textContent = "Ask";
    }
    updateAskGrokCount();
    if (typeof syncAnswerShareButtons === "function") syncAnswerShareButtons();
    try {
      placeAskAnswerActions();
    } catch (e) {
    }
    try {
      if (typeof hasSuccessfulGrokAnswer === "function" && hasSuccessfulGrokAnswer()) {
        setTimeout(function() {
          try {
            scrollToGrokAnswer();
          } catch (e) {
          }
        }, 50);
      }
    } catch (e) {
    }
  }
}
function runAnalysis() {
  var staleUiWasVisible = !!staleUiVisible;
  var shouldReturnToAsk = false;
  try {
    shouldReturnToAsk = !!pendingReturnToAsk && !!lastRunSignature;
  } catch (e) {
    shouldReturnToAsk = false;
  }
  pendingReturnToAsk = false;
  try {
    clearReportStaleUi();
  } catch (e) {
  }
  __hdtaRunInProgress = true;
  try {
    let stopChart2 = function(msg) {
      const wrap = $("report");
      const htmlMsg = '<p class="empty-hint">' + String(msg).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>";
      parkThenSetReportHtml(htmlMsg);
      lastHtml = wrap ? wrap.innerHTML : "";
      lastMd = msg;
      status(msg.split("\n")[0], "err");
    }, attachPerson32 = function(meta) {
      const out = Object.assign({}, meta || {});
      out.members = members;
      if (extraAfterTwo.length) out.extraPeople = extraAfterTwo;
      if (person3) out.person3 = person3;
      out.betweenPairKeys = getSelectedBetweenPairKeys();
      out.betweenBrief = members.length > 3;
      return out;
    };
    var stopChart = stopChart2, attachPerson3 = attachPerson32;
    const natalOnlyMode = typeof timeTransitBasedOn === "function" && !timeTransitBasedOn();
    if (!natalOnlyMode && (!engReady || !window.Astronomy)) {
      status("Ephemeris library not loaded", "err");
      return;
    }
    const sel = selectedPeopleFromBoxes();
    const p1 = sel.p1;
    const p2 = sel.p2;
    const p3 = sel.p3;
    if (!p1) {
      const friendly = !sel.anyExtra ? "Add a chart to get started \u2014 paste JSON or text, upload a file, or load a sample for Person 1 (Inputs 2\u20136 are optional)." : "Person 1 is empty \u2014 add a chart in Person 1, or clear the other inputs and use Person 1 for a solo report.";
      const wrap = $("report");
      parkThenSetReportHtml('<p class="empty-hint">' + friendly + "</p>");
      lastHtml = wrap ? wrap.innerHTML : "";
      lastMd = friendly;
      status(friendly, "err");
      return;
    }
    const person1 = HD.loadPerson(typeof applyGenderToChart === "function" ? applyGenderToChart(p1, 1) : p1);
    person1._inputSlot = 1;
    const extraPeople = [];
    (sel.extrasRaw || []).forEach(function(raw, i) {
      const slot = sel.extraSlots[i];
      const person = HD.loadPerson(typeof applyGenderToChart === "function" ? applyGenderToChart(raw, slot) : raw);
      person._inputSlot = slot;
      extraPeople.push(person);
    });
    const person2 = extraPeople[0] || null;
    const extraAfterTwo = extraPeople.slice(1);
    const person3 = extraAfterTwo[0] || null;
    const members = [person1].concat(extraPeople);
    updateChartStatus(1);
    (sel.extraSlots || []).forEach(function(slot) {
      updateChartStatus(slot);
    });
    for (let mi = 0; mi < members.length; mi++) {
      const v = HD.validateNatalOrStop(members[mi], members[mi].name || "Person " + (members[mi]._inputSlot || mi + 1));
      if (!v.ok) {
        stopChart2(v.message);
        return;
      }
    }
    if (typeof timeTransitBasedOn === "function" && !timeTransitBasedOn()) {
      window.__NATAL_ONLY__ = true;
      finishNatalOnlyReport(members, natalReportMeta(attachPerson32({ natalOnly: true })));
      return;
    }
    window.__NATAL_ONLY__ = false;
    const tz = $("tz").value || "local";
    const queryWin = getQueryWindow(tz);
    if (mode === "range" && !queryWindowIsValid(queryWin)) {
      status("The end date and time must be after the start date and time. Please adjust From/To and try again.", "err");
      return;
    }
    applyQueryWindowGlobal(queryWin);
    if (reportMode === "timeline") {
      status("Scanning chart-relevant ingresses\u2026");
      syncTimeHiddenFrom12();
      const dates = mode === "range" ? HD.dateRangeList(startDate, endDate || startDate) : [startDate];
      if (dates.length > 31) throw new Error("Timeline ranges are limited to 31 days (you selected " + dates.length + "). Shorten From/To or click a nearer end date.");
      const startMs = mode === "range" ? queryWin.startMs : zonedTimeToUtc(dates[0], "00:00", tz).getTime();
      const endMs = mode === "range" ? queryWin.endExclusiveMs : zonedTimeToUtc(addCalendarDays(dates[dates.length - 1], 1), "00:00", tz).getTime();
      const found = findChartRelevantEvents(window.Astronomy, person1, person2, startMs, endMs, tz, extraAfterTwo);
      const rangeLabel = mode === "range" ? formatQueryWindowLabel(queryWin) : formatDisplayDateOnly(new Date(startMs), tz) + " \xB7 full local day";
      const tzLabel = resolveTzId(tz);
      const startField = computeTransitField(window.Astronomy, new Date(startMs));
      startField.tz = tz;
      try {
        startField.display_when = formatDisplayDateTime(new Date(startMs), tz);
        startField.display_date = formatDisplayDateOnly(new Date(startMs), tz);
      } catch (e) {
      }
      const includeOverview2 = computeIncludeRangeOverviewFlag();
      const includeTF2 = computeEffectiveTransitFieldFlag(includeOverview2);
      try {
        window.__INCLUDE_TRANSIT_FIELD__ = includeTF2;
        window.__INCLUDE_RANGE_OVERVIEW__ = includeOverview2;
        window.__INCLUDE_OVERVIEW_TRANSIT_FIELD__ = includeTF2;
        window.__INCLUDE_RANGE_FULL__ = computeIncludeRangeFullFlag();
      } catch (e) {
      }
      if (includeOverview2 && dates.length > 1) {
        const dayTransits = buildTransitsForSelection(window.Astronomy);
        const ovMeta = attachPerson32({
          timeLabel: rangeLabel,
          tz,
          includeTransitField: includeTF2,
          includePositions: includeTF2,
          rangeOverview: true,
          rangeTransitFieldMode: includeTF2 ? "per-day" : "omit"
        });
        lastHtml = HD.renderNarrativeHtml(person1, person2, dayTransits, ovMeta);
        lastMd = HD.renderNarrativeMarkdown(person1, person2, dayTransits, ovMeta);
        {
          const _x = applyExtraOutput(lastHtml, lastMd, person1, person2, Object.assign({}, ovMeta, { dayTransits }));
          lastHtml = _x.html;
          lastMd = _x.md;
        }
        parkThenSetReportHtml(lastHtml);
        rememberReportBase();
        applyGrokAnswerToReport();
        try {
          if (typeof markupHighlightReport === "function") markupHighlightReport();
        } catch (e) {
        }
        $("ephemNote").textContent = "Brief descriptions \xB7 " + dayTransits.length + " days \xB7 " + rangeLabel + (includeTF2 ? " \xB7 transit field/day" : "");
        status("Done \u2014 overview \xB7 " + dayTransits.length + " days", "ok");
        window.__LAST_REPORT_MD__ = lastMd;
        window.__LAST_TRANSIT__ = dayTransits[0] || null;
        window.__LAST_EVENTS__ = found.events;
        try {
          syncExtraOutputOpts();
        } catch (e) {
        }
        return;
      }
      const meta = attachPerson32({ events: found.events, moonSkipped: found.moonSkipped, rawCount: found.rawCount, rangeLabel, tzLabel, tz, startField, includeTransitField: includeTF2, includePositions: includeTF2, rangeOverview: false });
      lastHtml = renderTimelineHtml(person1, person2, meta);
      {
        const _x = applyExtraOutput(lastHtml, lastHtml, person1, person2, Object.assign({}, meta, { dayTransits: buildTransitsForSelection(window.Astronomy) }));
        lastHtml = _x.html;
      }
      lastMd = lastHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<h2>/gi, "# ").replace(/<\/h2>/gi, "\n").replace(/<h3>/gi, "## ").replace(/<\/h3>/gi, "\n").replace(/<p><em>/gi, "").replace(/<\/em><\/p>/gi, "\n").replace(/<p>/gi, "").replace(/<\/p>/gi, "\n\n").replace(/<strong>/gi, "**").replace(/<\/strong>/gi, "**").replace(/<br\s*\/?>/gi, "\n").replace(/<div class="tech"><details class="tech"><summary>Technical details \(gates, channels, ephemeris\)<\/summary><pre>/gi, "\n\n<details><summary>Technical details</summary>\n\n```\n").replace(/<\/pre><\/details><\/div>/gi, "\n```\n</details>\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      parkThenSetReportHtml(lastHtml);
      rememberReportBase();
      applyGrokAnswerToReport();
      try {
        if (typeof markupHighlightReport === "function") markupHighlightReport();
      } catch (e) {
      }
      let _shownN = found.events.length;
      if (interactionsOnlyOn() && person2) {
        _shownN = found.events.filter((e) => isInteractionTimelineEvent(e, person1, person2, extraAfterTwo)).length;
        $("ephemNote").textContent = "Interaction timeline: " + _shownN + " interaction events (" + found.events.length + " chart-relevant)" + (found.moonSkipped ? " \xB7 " + found.moonSkipped + " quiet Moon shifts omitted" : "") + " \xB7 " + rangeLabel;
      } else {
        $("ephemNote").textContent = "Timeline: " + found.events.length + " chart-relevant events" + (found.moonSkipped ? " \xB7 " + found.moonSkipped + " quiet Moon shifts omitted" : "") + " \xB7 " + rangeLabel;
      }
      status("Done \u2014 " + _shownN + " events", "ok");
      window.__LAST_REPORT_MD__ = lastMd;
      window.__LAST_TRANSIT__ = found.events[0] ? found.events[0].afterField : null;
      window.__LAST_EVENTS__ = found.events;
      try {
        syncExtraOutputOpts();
      } catch (e) {
      }
      return;
    }
    status("Computing live ephemeris\u2026");
    const transits = buildTransitsForSelection(window.Astronomy);
    const field0 = transits[0];
    const timeLabel = field0.display_when;
    const includeOverview = computeIncludeRangeOverviewFlag();
    const includeTF = computeEffectiveTransitFieldFlag(includeOverview);
    try {
      window.__INCLUDE_TRANSIT_FIELD__ = includeTF;
      window.__INCLUDE_RANGE_OVERVIEW__ = includeOverview;
      window.__INCLUDE_OVERVIEW_TRANSIT_FIELD__ = includeTF;
      window.__INCLUDE_RANGE_FULL__ = computeIncludeRangeFullFlag();
    } catch (e) {
    }
    const snapMeta = attachPerson32({ timeLabel, tz: field0.tz, includeTransitField: includeTF, includePositions: includeTF, rangeOverview: includeOverview });
    if (mode === "range") {
      const winLabel = formatQueryWindowLabel(queryWin);
      snapMeta.timeLabel = winLabel;
      snapMeta.rangeLabel = winLabel;
    }
    if (mode === "range" && transits.length > 1) {
      snapMeta.rangeTransitFieldMode = includeTF ? "per-day" : "omit";
    }
    lastHtml = HD.renderNarrativeHtml(person1, person2, transits, snapMeta);
    lastMd = HD.renderNarrativeMarkdown(person1, person2, transits, snapMeta);
    {
      const _x = applyExtraOutput(lastHtml, lastMd, person1, person2, Object.assign({}, snapMeta, { dayTransits: transits }));
      lastHtml = _x.html;
      lastMd = _x.md;
    }
    parkThenSetReportHtml(lastHtml);
    rememberReportBase();
    applyGrokAnswerToReport();
    try {
      if (typeof markupHighlightReport === "function") markupHighlightReport();
    } catch (e) {
    }
    const field = transits[0];
    if (mode === "range" && includeOverview) {
      $("ephemNote").textContent = "Brief descriptions \xB7 " + transits.length + " day" + (transits.length === 1 ? "" : "s") + " @ " + timeLabel + (includeTF ? " \xB7 transit field/day" : "");
    } else if (mode === "range" && !includeTF) {
      $("ephemNote").textContent = "Range report @ " + timeLabel + (transits.length > 1 ? " \xB7 " + transits.length + " days" : "") + " \xB7 transit field omitted";
    } else {
      $("ephemNote").textContent = `Live field @ ${field.display_when}: Sun ${field.planets.Sun.gl}, Moon ${field.planets.Moon.gl}, NN(true) ${field.planets.NorthNode.gl}`;
    }
    status("Done", "ok");
    window.__LAST_REPORT_MD__ = lastMd;
    window.__LAST_TRANSIT__ = field;
    window.__LAST_EVENTS__ = null;
    try {
      syncExtraOutputOpts();
    } catch (e) {
    }
  } catch (e) {
    status(String(e.message || e), "err");
    console.error(e);
  } finally {
    if (__hdtaRunInProgress) {
      __hdtaRunInProgress = false;
      if (staleUiWasVisible && typeof resultNeedsRunBeforeAsk === "function" && resultNeedsRunBeforeAsk()) {
        try {
          showReportStaleUi(false);
        } catch (e) {
        }
      }
      if (shouldReturnToAsk) pendingReturnToAsk = true;
    } else if (shouldReturnToAsk) {
      try {
        scheduleReturnToAsk();
      } catch (e) {
        pendingReturnToAsk = false;
      }
    } else {
      try {
        scheduleScrollToReportStart();
      } catch (e) {
      }
    }
  }
}
function loadCoupleSample() {
  loadSampleInto(1, "dennis");
  loadSampleInto(2, "eike");
  mode = "single";
  syncWhenModeHighlight();
  applyBootTodayToInputs();
  const tzEl = $("tz");
  if (tzEl) tzEl.value = "America/New_York";
  renderCalendar();
  runAnalysis();
}
function showCdnFail(msg) {
  const b = $("cdnBanner");
  b.textContent = msg || "Could not load the astronomy-engine library from the CDN. Check your internet connection and reopen this file (or try again). Live transit positions cannot be calculated offline.";
  b.classList.add("show");
  const rb = $("runBtn");
  if (rb) rb.disabled = true;
  const lc = $("loadCouple");
  if (lc) lc.disabled = true;
  engReady = false;
}
function loadAstronomy() {
  return new Promise((resolve, reject) => {
    if (window.Astronomy) {
      resolve(window.Astronomy);
      return;
    }
    const urls = [
      "astronomy.browser.min.js",
      "./astronomy.browser.min.js",
      "https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js",
      "https://unpkg.com/astronomy-engine@2.1.19/astronomy.browser.min.js"
    ];
    let i = 0;
    function tryNext() {
      if (i >= urls.length) {
        reject(new Error("CDN load failed"));
        return;
      }
      const s = document.createElement("script");
      s.src = urls[i++];
      s.async = true;
      s.onload = () => {
        const A = window.Astronomy || window.astronomy || null;
        if (A && A.MakeTime) {
          window.Astronomy = A;
          resolve(A);
        } else if (typeof Astronomy !== "undefined") {
          window.Astronomy = Astronomy;
          resolve(Astronomy);
        } else reject(new Error("Library loaded but Astronomy global missing"));
      };
      s.onerror = () => tryNext();
      document.head.appendChild(s);
    }
    tryNext();
  });
}
const MAILTO_SAFE = 2e3;
const SMS_SAFE = 2e3;
let shareMenuKind = "report";
function hasSuccessfulGrokAnswer() {
  return !!(lastGrokAnswerText && String(lastGrokAnswerText).trim() && lastGrokAnswerHtml && !/grok-error|grok-loading/.test(lastGrokAnswerHtml));
}
function hasDisplayableReport() {
  try {
    if (window.__LAST_TRANSIT__ || window.__NATAL_ONLY__) return true;
  } catch (e) {
  }
  const report = $("report");
  const t = report && String(report.innerText || "").trim();
  if (!t) return false;
  if (/Load the ephemeris|Add a chart to get started|no natal planets/i.test(t) && t.length < 200) return false;
  return t.length > 80;
}
function displayReportHtml() {
  const report = $("report");
  if (!report) return "<p>Nothing to display yet.</p>";
  const clone = report.cloneNode(true);
  try {
    clone.querySelectorAll(".tech, #timelineEventsJson, .ask-answer-actions, .ask-answer-actions-slot, #askAnswerActions").forEach(function(el) {
      el.remove();
    });
  } catch (e) {
  }
  return clone.innerHTML || "<p>Nothing to display yet.</p>";
}
function displayContentHtml(mode2) {
  if (mode2 === "report") return displayReportHtml();
  const report = $("report");
  if (!report) return "<p>Nothing to display yet.</p>";
  if (typeof hasSuccessfulGrokAnswer === "function" && hasSuccessfulGrokAnswer()) {
    const ans = report.querySelector(".grok-answer");
    if (ans) {
      const clone = ans.cloneNode(true);
      try {
        clone.querySelectorAll(".ask-answer-actions, .ask-answer-actions-slot, #askAnswerActions").forEach(function(el) {
          el.remove();
        });
      } catch (e) {
      }
      return clone.innerHTML;
    }
    if (typeof lastGrokAnswerHtml !== "undefined" && lastGrokAnswerHtml) return lastGrokAnswerHtml;
  }
  return displayReportHtml();
}
function syncAnswerShareButtons() {
  const row = $("askAnswerActions");
  const pb = $("answerPrintBtn");
  const sb = $("answerShareBtn");
  const db = $("answerDisplayBtn");
  const rb = $("reportDisplayBtn");
  const on = typeof hasSuccessfulGrokAnswer === "function" && hasSuccessfulGrokAnswer();
  const canDisplay = on || hasDisplayableReport();
  if (row) {
    if (on) row.removeAttribute("hidden");
    else row.setAttribute("hidden", "");
  }
  if (pb) pb.disabled = !on;
  if (sb) sb.disabled = !on;
  if (db) db.disabled = !on;
  if (rb) rb.disabled = !hasDisplayableReport();
  try {
    placeAskAnswerActions();
  } catch (e) {
  }
}
let displaySavedHtml = "";
let displayMatches = [];
let displayIndex = 0;
let displayPrevOverflow = "";
let displayPrevScroll = 0;
function displayEscapeRe(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function displayUpdateCount() {
  const el = $("displayFindCount");
  if (!el) return;
  const total = displayMatches.length;
  if (!total) {
    el.textContent = "0 of 0";
    return;
  }
  el.textContent = String(displayIndex + 1) + " of " + String(total);
}
function displayMarkCurrent() {
  for (let i = 0; i < displayMatches.length; i++) {
    const el = displayMatches[i];
    if (!el) continue;
    const on = i === displayIndex;
    el.className = on ? "display-hl display-hl-current" : "display-hl";
  }
  const cur = displayMatches[displayIndex];
  if (cur && cur.scrollIntoView) {
    try {
      cur.scrollIntoView({ block: "center", inline: "nearest" });
    } catch (e) {
      try {
        cur.scrollIntoView(true);
      } catch (_e) {
      }
    }
  }
  displayUpdateCount();
}
function displayGo(delta) {
  if (!displayMatches.length) return;
  const n = displayMatches.length;
  displayIndex = ((displayIndex + delta) % n + n) % n;
  displayMarkCurrent();
}
function displayRestoreBody() {
  const body = $("displayOverlayBody");
  if (!body) return;
  body.innerHTML = displaySavedHtml || "";
  displayMatches = [];
  displayIndex = 0;
  try {
    applyHighlightToggles();
  } catch (e) {
  }
}
function displayApplyFind() {
  const input = $("displayFindInput");
  const q = input ? String(input.value || "") : "";
  displayRestoreBody();
  displayUpdateCount();
  if (!q) {
    displayUpdateCount();
    return;
  }
  const body = $("displayOverlayBody");
  if (!body || !document.createTreeWalker) {
    displayUpdateCount();
    return;
  }
  let re;
  try {
    re = new RegExp(displayEscapeRe(q), "gi");
  } catch (e) {
    displayUpdateCount();
    return;
  }
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const marks = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const text = node.nodeValue;
    if (!text) continue;
    re.lastIndex = 0;
    if (!re.test(text)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while (m = re.exec(text)) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const mark = document.createElement("mark");
      mark.className = "display-hl";
      mark.appendChild(document.createTextNode(m[0]));
      frag.appendChild(mark);
      marks.push(mark);
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (node.parentNode) node.parentNode.replaceChild(frag, node);
  }
  displayMatches = marks;
  displayIndex = 0;
  if (displayMatches.length) displayMarkCurrent();
  else displayUpdateCount();
}
let displayReturnFocusId = "reportDisplayBtn";
let displayMode = "report";
function openDisplayView(mode2) {
  const overlay = $("displayOverlay");
  const body = $("displayOverlayBody");
  if (!overlay || !body) return;
  displayMode = mode2 === "report" ? "report" : "answer";
  displayReturnFocusId = displayMode === "report" ? "reportDisplayBtn" : "answerDisplayBtn";
  displaySavedHtml = displayContentHtml(displayMode);
  body.innerHTML = displaySavedHtml;
  displayMatches = [];
  displayIndex = 0;
  try {
    applyHighlightToggles();
  } catch (e) {
  }
  const input = $("displayFindInput");
  if (input) input.value = "";
  displayUpdateCount();
  try {
    displayPrevScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
  } catch (e) {
    displayPrevScroll = 0;
  }
  try {
    displayPrevOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  } catch (e) {
  }
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden", "false");
  overlay.removeAttribute("hidden");
  try {
    const closer = $("displayOverlayClose");
    if (closer) closer.focus();
  } catch (e) {
  }
}
function closeDisplayView() {
  const overlay = $("displayOverlay");
  if (!overlay) return;
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("hidden", "");
  try {
    document.body.style.overflow = displayPrevOverflow;
  } catch (e) {
  }
  try {
    window.scrollTo(0, displayPrevScroll || 0);
  } catch (e) {
  }
  displayMatches = [];
  displaySavedHtml = "";
  try {
    const db = $(displayReturnFocusId) || $("reportDisplayBtn") || $("answerDisplayBtn");
    if (db) db.focus();
  } catch (e) {
  }
}
function wireDisplayOverlay() {
  const rb = $("reportDisplayBtn");
  if (rb) rb.onclick = function() {
    openDisplayView("report");
  };
  const db = $("answerDisplayBtn");
  if (db) db.onclick = function() {
    openDisplayView();
  };
  const close = $("displayOverlayClose");
  if (close) close.onclick = function() {
    closeDisplayView();
  };
  const prev = $("displayFindPrev");
  if (prev) prev.onclick = function() {
    displayGo(-1);
  };
  const next = $("displayFindNext");
  if (next) next.onclick = function() {
    displayGo(1);
  };
  const clear = $("displayFindClear");
  if (clear) clear.onclick = function() {
    const input2 = $("displayFindInput");
    if (input2) input2.value = "";
    displayRestoreBody();
    displayUpdateCount();
    if (input2) input2.focus();
  };
  const input = $("displayFindInput");
  if (input) {
    input.addEventListener("input", function() {
      displayApplyFind();
    });
    input.addEventListener("search", function() {
      displayApplyFind();
    });
    input.addEventListener("keydown", function(ev) {
      if (!ev) return;
      if (ev.key === "Enter") {
        ev.preventDefault();
        if (ev.shiftKey) displayGo(-1);
        else displayGo(1);
      }
    });
  }
  document.addEventListener("keydown", function(ev) {
    if (!ev) return;
    if (ev.key !== "Escape") return;
    if (typeof isRefineConfigOpen === "function" && isRefineConfigOpen()) return;
    const overlay = $("displayOverlay");
    if (overlay && !overlay.hidden && !overlay.hasAttribute("hidden")) {
      ev.preventDefault();
      closeDisplayView();
    }
  });
  const dpb = $("displayPrintBtn");
  if (dpb) dpb.onclick = function() {
    if (displayMode === "answer") printAnswerOnly();
    else printReport();
  };
  const dsb = $("displayShareBtn");
  if (dsb) dsb.onclick = function(ev) {
    ev.preventDefault();
    shareOrFallback(displayMode === "answer" ? "answer" : "report", ev.currentTarget || dsb);
  };
}
function reportPlainText(opts) {
  opts = opts || {};
  const root = $("report");
  if (!root) return "";
  const clone = root.cloneNode(true);
  clone.querySelectorAll(".tech, .transit-positions, #timelineEventsJson, pre[style]").forEach(function(el) {
    el.remove();
  });
  if (!opts.includeAnswer) {
    clone.querySelectorAll(".grok-answer").forEach(function(el) {
      el.remove();
    });
  }
  return (clone.innerText || clone.textContent || "").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function currentReportTitle() {
  const members = collectAskMembers();
  const range = (typeof selectionRangeText === "function" ? selectionRangeText() : "") || "";
  const who = members.length ? members.join(" & ") : "Transit report";
  return range ? "Transit report: " + who + " \u2014 " + range : "Transit report: " + who;
}
function buildAnswerHeaderText() {
  const q = lastGrokQuestion || "";
  const members = collectAskMembers();
  const range = (typeof selectionRangeText === "function" ? selectionRangeText() : "") || "";
  const lines = ["Question \u2014 Advantages and Difficulties"];
  if (q) lines.push("Question: " + q);
  if (members.length) lines.push("Members: " + members.join(", "));
  if (range) lines.push("Date range: " + range);
  return lines.join("\n");
}
function answerShareText() {
  const q = String(lastGrokQuestion || "").trim();
  const a = String(lastGrokAnswerText || "").trim();
  const lines = ["Question & Answer"];
  if (q) lines.push("Question: " + q);
  if (a) lines.push("", a);
  return lines.join("\n").trim();
}
function answerPrintModel() {
  return {
    title: "Question \u2014 Advantages and Difficulties",
    question: lastGrokQuestion || "",
    members: collectAskMembers(),
    range: (typeof selectionRangeText === "function" ? selectionRangeText() : "") || "",
    answer: lastGrokAnswerText || ""
  };
}
function highlightedAnswerFragment() {
  const reportAns = document.querySelector("#report .grok-answer");
  if (!reportAns) return "";
  const clone = reportAns.cloneNode(true);
  try {
    clone.querySelectorAll(".ask-answer-actions, .ask-answer-actions-slot, #askAnswerActions, h2, .grok-q, .grok-length-note, .grok-answer-header, .pair-toolbar, .no-print").forEach(function(el) {
      el.remove();
    });
    clone.querySelectorAll("details").forEach(function(d) {
      d.setAttribute("open", "open");
      d.open = true;
    });
  } catch (e) {
  }
  return (clone.innerHTML || "").trim();
}
function markupHighlightRoot(root) {
  if (!root) return;
  const index = typeof buildHighlightIndex === "function" ? buildHighlightIndex() : { members: [], transits: [] };
  try {
    unwrapHighlightSpans(root);
  } catch (e) {
  }
  try {
    wrapTransitMentions(root, index);
  } catch (e) {
  }
  try {
    wrapAffectedNames(root, index);
  } catch (e) {
  }
  try {
    markBetweenBlocks(root, index);
  } catch (e) {
  }
  try {
    applyHighlightInline(root);
  } catch (e) {
  }
  try {
    setHighlightClass(root, "hl-affected-on", highlightAffectedOn());
    setHighlightClass(root, "hl-between-on", highlightBetweenOn());
    setHighlightClass(root, "hl-underline-on", highlightUnderlineOn());
  } catch (e) {
  }
}
function answerPrintInnerHtml(model) {
  model = model || answerPrintModel();
  const q = String(model.question || "").trim();
  const meta = q ? '<p class="answer-meta"><strong>Question:</strong> ' + escapeGrok(q) + "</p>" : "";
  let body = "";
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  try {
    body = highlightedAnswerFragment();
  } catch (e) {
    body = "";
  }
  if (!body) {
    const paras = String(model.answer || "").split(/\n{2,}/).map(function(s) {
      return s.trim();
    }).filter(Boolean);
    body = paras.map(function(p) {
      return "<p>" + escapeGrok(p).replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
  }
  return "<h1>Question &amp; Answer</h1>\n" + meta + "\n" + body;
}
function fillAnswerPrintRoot(model) {
  const root = hoistAnswerPrintRoot() || $("answerPrintRoot");
  if (!root) return "";
  const html = answerPrintInnerHtml(model || answerPrintModel());
  root.innerHTML = html;
  root.removeAttribute("hidden");
  try {
    root.setAttribute("aria-hidden", "false");
  } catch (e) {
  }
  try {
    markupHighlightRoot(root);
  } catch (e) {
  }
  return root.innerHTML;
}
function sharePayload(kind) {
  if (kind === "answer") {
    return { kind: "answer", title: "Question & Answer", text: answerShareText(), html: fillAnswerPrintRoot(answerPrintModel()), filename: "transit-answer" };
  }
  return { kind: "report", title: currentReportTitle(), text: reportPlainText({ includeAnswer: true }), html: highlightedReportFragment(), filename: "transit-report" };
}
function encodeWithinLimit(prefix, body, limit, note) {
  limit = limit || MAILTO_SAFE;
  body = String(body == null ? "" : body);
  note = note || "\n\n[The rest was cut because this link has a length limit. Use Copy to clipboard or Print / Save as PDF for the full text.]";
  function urlOf(s) {
    return prefix + encodeURIComponent(s);
  }
  if (urlOf(body).length <= limit) return urlOf(body);
  let lo = 0, hi = body.length, best = "";
  const room = Math.max(0, limit - prefix.length);
  hi = Math.min(body.length, Math.max(40, Math.floor(room / 1.2)));
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    let chunk = body.slice(0, mid).replace(/\s+\S*$/, "");
    if (!chunk) chunk = body.slice(0, mid);
    const candidate = chunk + note;
    if (urlOf(candidate).length <= limit) {
      best = urlOf(candidate);
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (best) return best;
  const short = body.slice(0, Math.max(20, Math.floor(room / 3))) + note;
  return urlOf(short).slice(0, limit);
}
function buildMailtoUrl(payload) {
  payload = payload || sharePayload("report");
  const prefix = "mailto:?subject=" + encodeURIComponent(payload.title || "Transit report") + "&body=";
  return encodeWithinLimit(prefix, payload.text || "", MAILTO_SAFE);
}
function buildSmsUrl(payload) {
  payload = payload || sharePayload("report");
  const prefix = "sms:?&body=";
  return encodeWithinLimit(prefix, payload.text || "", SMS_SAFE);
}
function hasWebShare() {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  } catch (e) {
    return false;
  }
}
function shareFormattedHtml(payload) {
  payload = payload || {};
  const css = 'body{font-family:Georgia,"Times New Roman",Times,serif;font-size:11pt;line-height:1.5;color:#111;max-width:820px;margin:2rem auto;padding:0 1rem}h1,h2,h3{color:#111}span.hl-transit{text-decoration:underline!important}span.hl-affected{font-weight:700!important} .hl-between-block{font-weight:700!important;font-style:italic!important}';
  let body = (payload.html || "").trim();
  if (!body) {
    body = '<pre style="white-space:pre-wrap;font-family:Georgia,serif;line-height:1.5">' + escapeGrok(payload.text || "") + "</pre>";
  }
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeGrok(payload.title || "Transit report") + "</title><style>" + css + "</style></head><body>" + body + "</body></html>";
}
function highlightedReportFragment() {
  const report = document.getElementById("report");
  if (!report) return "";
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  const clone = report.cloneNode(true);
  try {
    clone.querySelectorAll(".tech, #timelineEventsJson, .ask-answer-actions, .ask-answer-actions-slot, #askAnswerActions").forEach(function(el) {
      el.remove();
    });
  } catch (e) {
  }
  try {
    applyHighlightInline(clone);
  } catch (e) {
  }
  return (clone.innerHTML || "").trim();
}
function makeShareFile(payload, ext) {
  payload = payload || sharePayload("report");
  ext = ext || "txt";
  const name = (payload.filename || "transit-report") + "." + ext;
  if (ext === "html") {
    return new File([shareFormattedHtml(payload)], name, { type: "text/html" });
  }
  return new File([payload.text || ""], name, { type: "text/plain" });
}
function canShareWithFiles(files) {
  try {
    return !!(navigator.canShare && files && files.length && navigator.canShare({ files }));
  } catch (e) {
    return false;
  }
}
async function copyTextToClipboard(text) {
  text = String(text || "");
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
}
function positionShareMenu(anchor) {
  const menu = $("shareMenu");
  if (!menu) return;
  const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: 12, right: 12, bottom: 12, top: 12 };
  const pad = 8;
  const width = Math.max(menu.offsetWidth || 184, 184);
  let left = r.left;
  if (left + width > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - width - pad);
  if (left < pad) left = pad;
  let top = r.bottom + 6;
  const h = menu.offsetHeight || 140;
  if (top + h > window.innerHeight - pad && r.top - h - 6 > pad) top = r.top - h - 6;
  menu.style.left = left + "px";
  menu.style.top = top + "px";
}
function closeShareMenu() {
  const menu = $("shareMenu");
  if (!menu) return;
  menu.classList.remove("open");
  menu.setAttribute("hidden", "");
}
function openShareMenu(anchor, kind) {
  const menu = $("shareMenu");
  if (!menu) return;
  shareMenuKind = kind || "report";
  menu.dataset.kind = shareMenuKind;
  menu.removeAttribute("hidden");
  menu.classList.add("open");
  positionShareMenu(anchor);
}
function onShareMenuClick(ev) {
  const btn = ev.target && ev.target.closest ? ev.target.closest("[data-share]") : null;
  if (!btn) return;
  ev.preventDefault();
  const act = btn.getAttribute("data-share");
  const payload = sharePayload(shareMenuKind);
  closeShareMenu();
  if (act === "email") {
    window.location.href = buildMailtoUrl(payload);
    return;
  }
  if (act === "sms") {
    window.location.href = buildSmsUrl(payload);
    return;
  }
  if (act === "copy") {
    copyTextToClipboard(payload.text).then(function(ok) {
      status(ok ? "Copied to clipboard." : "Could not copy. Select the report text and copy it manually.", ok ? "ok" : "err");
    });
  }
}
async function shareOrFallback(kind, anchor) {
  const payload = sharePayload(kind);
  if (!(payload.text || "").trim()) {
    status(kind === "answer" ? "Ask a question first \u2014 then Email / Text can share the answer." : "Run an analysis first \u2014 then Email / Text can share the report.", "err");
    return { used: "none" };
  }
  if (hasWebShare()) {
    const data = { title: payload.title, text: payload.text };
    try {
      if (typeof File === "function") {
        const files = [];
        try {
          const htmlFile = makeShareFile(payload, "html");
          if (canShareWithFiles([htmlFile])) files.push(htmlFile);
          else {
            const txtFile = makeShareFile(payload, "txt");
            if (canShareWithFiles([txtFile])) files.push(txtFile);
          }
        } catch (e) {
        }
        if (files.length && canShareWithFiles(files)) data.files = files;
      }
    } catch (e) {
    }
    try {
      await navigator.share(data);
      return { used: "share", data };
    } catch (err) {
      const name = err && err.name;
      if (name === "AbortError") return { used: "share-abort" };
      if (data.files) {
        try {
          const textOnly = { title: payload.title, text: payload.text };
          await navigator.share(textOnly);
          return { used: "share", data: textOnly };
        } catch (err2) {
          if (err2 && err2.name === "AbortError") return { used: "share-abort" };
        }
      }
      openShareMenu(anchor, kind);
      return { used: "fallback-after-share-error", error: String(err && err.message || err || "") };
    }
  }
  openShareMenu(anchor, kind);
  return { used: "fallback" };
}
let answerPrintCleanupTimer = 0;
let answerPrintCleanupFn = null;
function endAnswerPrintMode() {
  if (typeof answerPrintCleanupFn === "function") {
    const fn = answerPrintCleanupFn;
    answerPrintCleanupFn = null;
    try {
      fn();
    } catch (e) {
    }
  }
  try {
    document.documentElement.classList.remove("print-answer-only");
  } catch (e) {
  }
  try {
    document.body.classList.remove("print-answer-only");
  } catch (e) {
  }
}
function hoistAnswerPrintRoot() {
  const root = $("answerPrintRoot");
  if (root && document.body && root.parentNode !== document.body) {
    document.body.appendChild(root);
  }
  return root;
}
function qaPrintHighlightCss() {
  const bits = [];
  bits.push("html,body{background:#fff;color:#000;margin:0;}");
  bits.push('body{font-family:Georgia,"Times New Roman",Times,serif;font-size:11pt;line-height:1.5;padding:16px 18px 32px;}');
  bits.push("h1{font-size:1.25rem;margin:0 0 .5em;color:#000;}");
  bits.push("h2,h3{color:#000;margin:0.8em 0 0.35em;}");
  bits.push("p{color:#000;orphans:3;widows:3;margin:0 0 0.85em;}");
  bits.push(".answer-meta{color:#222;margin:0 0 1em;}");
  bits.push(".qa-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 1rem;padding:0 0 .75rem;border-bottom:1px solid #ccc;}");
  bits.push(".qa-toolbar button{min-height:44px;min-width:44px;padding:.55rem 1rem;font-size:1rem;line-height:1.2;}");
  if (typeof highlightUnderlineOn === "function" && highlightUnderlineOn()) {
    bits.push("span.hl-transit{text-decoration:underline!important;text-underline-offset:.12em;-webkit-print-color-adjust:exact;print-color-adjust:exact;}");
  }
  if (typeof highlightAffectedOn === "function" && highlightAffectedOn()) {
    bits.push("span.hl-affected{font-weight:700!important;font-style:normal;-webkit-print-color-adjust:exact;print-color-adjust:exact;}");
  }
  if (typeof highlightBetweenOn === "function" && highlightBetweenOn()) {
    bits.push(".hl-between-block{font-weight:700!important;font-style:italic!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}");
  }
  bits.push("@page{margin:12mm;}");
  bits.push("details.plain-card,details.plain-card[open]{display:block!important;border:1px solid #ccc;border-radius:6px;margin:0 0 .85em;padding:.45em .7em;break-inside:avoid;}");
  bits.push("details.plain-card > summary,details.plain-card > .plain-card-body,details.plain-card[open] > *{display:block!important;}");
  bits.push("details.plain-card > summary{font-weight:700;margin:0 0 .35em;cursor:default;}");
  bits.push("h4{margin:.45em 0 .2em;font-size:1em;}");
  bits.push(".plain-subhead{font-size:1.1em;margin:1em 0 .4em;}");
  bits.push("@media print{.qa-toolbar,.no-print,.pair-toolbar{display:none!important}body{padding:0}details.plain-card,details.plain-card[open],details.plain-card > summary,details.plain-card > .plain-card-body,details.plain-card[open] > *{display:block!important}}");
  return bits.join("\n");
}
function buildQaPrintBodyHtml() {
  try {
    if (typeof markupHighlightReport === "function") markupHighlightReport();
  } catch (e) {
  }
  const wrap = document.createElement("div");
  let inner = "";
  try {
    if (typeof highlightedAnswerFragment === "function") inner = highlightedAnswerFragment();
  } catch (e) {
    inner = "";
  }
  const model = typeof answerPrintModel === "function" ? answerPrintModel() : { question: lastGrokQuestion || "", answer: lastGrokAnswerText || "" };
  const q = String(model.question || "").trim();
  const meta = q ? '<p class="answer-meta"><strong>Question:</strong> ' + escapeGrok(q) + "</p>" : "";
  if (!inner) {
    const paras = String(model.answer || "").split(/\n{2,}/).map(function(s) {
      return s.trim();
    }).filter(Boolean);
    inner = paras.map(function(p) {
      return "<p>" + escapeGrok(p).replace(/\n/g, "<br>") + "</p>";
    }).join("\n");
  }
  wrap.innerHTML = "<h1>Question &amp; Answer</h1>\n" + meta + "\n" + inner;
  try {
    if (typeof markupHighlightRoot === "function") markupHighlightRoot(wrap);
  } catch (e) {
  }
  try {
    wrap.querySelectorAll("details").forEach(function(d) {
      d.setAttribute("open", "open");
      d.open = true;
    });
    wrap.querySelectorAll(".pair-toolbar, .no-print").forEach(function(el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  } catch (e) {
  }
  return wrap.innerHTML;
}
function buildQaPrintDocumentHtml() {
  const body = buildQaPrintBodyHtml();
  const css = qaPrintHighlightCss();
  const cls = [];
  if (typeof highlightAffectedOn === "function" && highlightAffectedOn()) cls.push("hl-affected-on");
  if (typeof highlightBetweenOn === "function" && highlightBetweenOn()) cls.push("hl-between-on");
  if (typeof highlightUnderlineOn === "function" && highlightUnderlineOn()) cls.push("hl-underline-on");
  const toolbar = '<div class="qa-toolbar no-print"><button type="button" id="qaPrintBtn">Print / Save as PDF</button> <button type="button" id="qaCloseBtn">Close</button></div>';
  const boot = '<script>(function(){function go(){try{window.focus();}catch(e){}try{window.print();}catch(e){}}function ready(fn){if(document.readyState==="complete")fn();else window.addEventListener("load",fn);}ready(function(){var p=document.getElementById("qaPrintBtn");if(p)p.onclick=function(){try{window.print();}catch(e){}};var c=document.getElementById("qaCloseBtn");if(c)c.onclick=function(){try{window.close();}catch(e){}};setTimeout(go,60);});})();<\/script>';
  return '<!DOCTYPE html><html data-hdta-print="qa" lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Question &amp; Answer</title><style>' + css + '</style></head><body class="' + cls.join(" ") + '">' + toolbar + body + boot + "</body></html>";
}
function printQaViaBlob(html) {
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
      }
      return false;
    }
    try {
      w.focus();
    } catch (e) {
    }
    setTimeout(function() {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
      }
    }, 12e4);
    return true;
  } catch (e) {
    return false;
  }
}
function printQaViaIframe(html) {
  try {
    let frame = document.getElementById("qaPrintFrame");
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    frame = document.createElement("iframe");
    frame.id = "qaPrintFrame";
    frame.setAttribute("title", "Question and Answer print");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    frame.srcdoc = html;
    document.body.appendChild(frame);
    return true;
  } catch (e) {
    return false;
  }
}
function printAnswerOnly() {
  if (!hasSuccessfulGrokAnswer()) {
    status("Ask a question first \u2014 then Print Question & Answer prints only the question and its answer.", "err");
    return false;
  }
  let win = null;
  try {
    win = window.open("", "_blank");
  } catch (e) {
    win = null;
  }
  let html = "";
  try {
    html = buildQaPrintDocumentHtml();
  } catch (e) {
    html = "";
  }
  if (!html) {
    if (win) try {
      win.close();
    } catch (e) {
    }
    status("Could not prepare the question and answer for printing.", "err");
    return false;
  }
  if (win) {
    try {
      win.document.open("text/html", "replace");
      win.document.write(html);
      win.document.close();
      try {
        win.focus();
      } catch (e) {
      }
      return true;
    } catch (e) {
      try {
        win.close();
      } catch (e2) {
      }
    }
  }
  if (printQaViaBlob(html)) return true;
  if (printQaViaIframe(html)) return true;
  status("A pop-up was blocked. Allow pop-ups for this site, then try Print Question & Answer again.", "err");
  return false;
}
function printReport() {
  const report = $("report");
  if (!report || !(report.textContent || "").trim() || /Load the ephemeris/.test(report.textContent || "")) {
    status("Run an analysis first \u2014 then Print Full Report prints the complete report.", "err");
    return;
  }
  try {
    endAnswerPrintMode();
  } catch (e) {
  }
  try {
    window.print();
  } catch (e) {
    status("Print failed: " + (e && e.message ? e.message : e), "err");
  }
}
function applyBootTodayToInputs() {
  const t = initialLocalToday();
  __BOOT_TODAY__ = t;
  startDate = t.iso;
  endDate = mode === "range" ? t.iso : null;
  calViewYear = t.y;
  calViewMonth = t.m;
  const monthEl = $("month");
  if (monthEl) monthEl.value = t.iso.slice(0, 7);
  const df = $("dateFrom");
  if (df) df.value = t.iso;
  const dt = $("dateTo");
  if (dt) dt.value = t.iso;
  const tod = $("timeOfDay");
  if (tod) tod.value = t.hm;
  try {
    setTime12From24(t.hm);
  } catch (e) {
  }
  try {
    setRangeTimeInputs(t.hm, "23:59");
  } catch (e) {
  }
  try {
    if (mode === "range" && typeof getQueryWindow === "function") {
      const w = getQueryWindow();
      if (w && !queryWindowIsValid(w) && typeof addCalendarDays === "function") {
        endDate = addCalendarDays(t.iso, 1);
        const dt2 = $("dateTo");
        if (dt2) dt2.value = endDate;
      }
    }
  } catch (e) {
  }
  try {
    syncDateInputsFromState && syncDateInputsFromState();
  } catch (e) {
  }
  try {
    if (typeof updateRangeHint === "function") updateRangeHint();
  } catch (e) {
  }
  try {
    syncRangeTimeReadouts();
  } catch (e) {
  }
}
function wire() {
  const safe = (label, fn) => {
    try {
      fn();
    } catch (err) {
      try {
        console.error("wire:" + label, err);
      } catch (_e) {
      }
      try {
        status("Init warning (" + label + "): " + (err && err.message ? err.message : err), "err");
      } catch (_e) {
      }
    }
  };
  safe("quickLoad", renderQuickLoadGrids);
  safe("tz", fillTimezones);
  safe("time12", initTime12Controls);
  safe("today", applyBootTodayToInputs);
  safe("coreControls", () => {
    const monthEl = $("month");
    if (monthEl) monthEl.onchange = () => {
      renderCalendar();
    };
    const calPrev = $("calPrev"), calNext = $("calNext");
    if (calPrev) calPrev.onclick = calPrevMonth;
    if (calNext) calNext.onclick = calNextMonth;
    const dateFrom = $("dateFrom"), dateTo = $("dateTo");
    if (dateFrom) dateFrom.onchange = applyDateInputsToState;
    if (dateTo) dateTo.onchange = applyDateInputsToState;
    ;
    ["timeFrom", "timeTo"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      const onTime = () => {
        try {
          syncRangeTimeReadouts();
        } catch (e) {
        }
        try {
          if (typeof updateRangeHint === "function") updateRangeHint();
        } catch (e) {
        }
        try {
          const sl = $("selectionLabel");
          if (sl) {
            if (sl.tagName === "INPUT") sl.value = selectionRangeText();
            else sl.textContent = selectionRangeText();
          }
        } catch (e) {
        }
        try {
          clearNowReading();
        } catch (e) {
        }
      };
      el.addEventListener("change", onTime);
      el.addEventListener("input", onTime);
    });
    const ms = $("modeSingle"), mr = $("modeRange");
    if (ms) ms.onclick = () => {
      mode = "single";
      endDate = null;
      rangeNeedsNewStart = true;
      syncWhenModeHighlight();
      renderCalendar();
    };
    if (mr) mr.onclick = () => {
      mode = "range";
      endDate = null;
      rangeNeedsNewStart = true;
      clearNowReading();
      syncWhenModeHighlight();
      renderCalendar();
    };
    for (let n = 1; n <= 6; n++) {
      const f = $("file" + n);
      if (f) f.onchange = /* @__PURE__ */ (function(slot) {
        return function(e) {
          handleFile(slot, e.target.files && e.target.files[0]);
        };
      })(n);
      const cp = $("clearPerson" + n);
      if (cp) cp.onclick = /* @__PURE__ */ (function(slot) {
        return function() {
          clearPerson(slot);
        };
      })(n);
    }
    const cd = $("clearDates");
    if (cd) cd.onclick = () => clearDates();
  });
  safe("quickLoad2", renderQuickLoadGrids);
  safe("quickLoadInput", () => {
    try {
      syncAllPersonInputLabels();
    } catch (e) {
    }
  });
  safe("loadCouple", () => {
    const lc = $("loadCouple");
    if (lc) lc.onclick = loadCoupleSample;
  });
  const rs = $("reportSnapshot"), rt = $("reportTimeline"), th = $("timelineHint");
  function setReportMode(m) {
    reportMode = m;
    if (rs) {
      rs.classList.toggle("active", m === "snapshot");
      rs.setAttribute("aria-pressed", m === "snapshot" ? "true" : "false");
    }
    if (rt) {
      rt.classList.toggle("active", m === "timeline");
      rt.setAttribute("aria-pressed", m === "timeline" ? "true" : "false");
    }
    if (th) th.style.display = m === "timeline" ? "block" : "none";
    updateRangeHint();
  }
  if (rs) rs.onclick = () => setReportMode("snapshot");
  if (rt) rt.onclick = () => setReportMode("timeline");
  safe("reportMode", () => setReportMode(reportMode));
  function syncRangeDescFlags() {
    try {
      const brief = computeIncludeRangeBriefFlag();
      window.__INCLUDE_RANGE_OVERVIEW__ = brief;
      window.__INCLUDE_TRANSIT_FIELD__ = computeEffectiveTransitFieldFlag(brief);
      window.__INCLUDE_OVERVIEW_TRANSIT_FIELD__ = computeIncludeTransitFieldFlag();
      window.__INCLUDE_RANGE_FULL__ = computeIncludeRangeFullFlag();
    } catch (e) {
    }
  }
  safe("rangeField", () => {
    const rangeFieldCb = $("includeRangeTransitField");
    if (!rangeFieldCb) return;
    rangeFieldCb.addEventListener("change", function() {
      try {
        syncRangeDescFlags();
      } catch (e) {
      }
      try {
      } catch (e) {
      }
    });
  });
  safe("rangeFull", () => {
    const rangeFullCb = $("includeRangeFullDesc");
    if (!rangeFullCb) return;
    rangeFullCb.addEventListener("change", function() {
      try {
        enforceRangeDescMutualExclusion("includeRangeFullDesc");
      } catch (e) {
      }
      try {
        syncRangeDescFlags();
      } catch (e) {
      }
      try {
      } catch (e) {
      }
    });
  });
  safe("rangeBrief", () => {
    const rangeBriefCb = $("includeRangeBriefDesc");
    if (!rangeBriefCb) return;
    rangeBriefCb.addEventListener("change", function() {
      try {
        enforceRangeDescMutualExclusion("includeRangeBriefDesc");
      } catch (e) {
      }
      try {
        syncRangeDescFlags();
      } catch (e) {
      }
      try {
      } catch (e) {
      }
    });
  });
  safe("rangeFieldOpt", syncRangeTransitFieldOpt);
  safe("rangeDescFlags", syncRangeDescFlags);
  safe("codes", () => {
    const ic = $("includeCodes");
    if (ic) ic.onchange = () => {
    };
  });
  safe("realWorld", () => {
    const rwCb = $("realWorldInfluence");
    if (rwCb) rwCb.onchange = () => {
      syncExtraOutputOpts();
      rerunFromRefine();
    };
  });
  safe("extraOpts", syncExtraOutputOpts);
  safe("moreMembers", () => {
    const d = $("moreMembers");
    if (d && window.innerWidth > 1e3 && !d.hasAttribute("data-user-toggled")) d.open = true;
    if (d) {
      d.addEventListener("toggle", function() {
        d.setAttribute("data-user-toggled", "1");
      });
    }
  });
  safe("notSelf", () => {
    const nsCb = $("notSelfLandscape");
    if (nsCb) nsCb.onchange = () => rerunFromRefine();
  });
  safe("between", () => {
    const bmCb = $("betweenMembers");
    if (bmCb) bmCb.onchange = () => rerunFromRefine();
  });
  safe("askBox", () => {
    const askBox = $("askGrokBox");
    if (askBox) {
      const sync = function() {
        syncAskGrokPanel();
      };
      askBox.onchange = sync;
      askBox.onclick = sync;
      askBox.addEventListener("input", sync);
    }
    try {
      restorePlainLanguagePref();
    } catch (e) {
    }
    const pl = document.getElementById("askPlainLanguage");
    if (pl) {
      pl.onchange = function() {
        persistPlainLanguagePref();
      };
    }
    try {
      syncAskGrokPanel();
    } catch (e) {
    }
  });
  safe("hlChecks", () => {
    try {
      wireHighlightChecks();
    } catch (e) {
    }
  });
  safe("askTa", () => {
    const askTa = $("askGrokQuestion");
    if (askTa) {
      askTa.addEventListener("input", updateAskGrokCount);
      askTa.addEventListener("change", updateAskGrokCount);
    }
  });
  safe("askBtn", () => {
    const askBtn = $("askGrokBtn");
    if (askBtn) askBtn.onclick = () => askGrok();
  });
  safe("askPanel", syncAskGrokPanel);
  safe("moonGate", () => {
    const moonCb = $("moonGateOnly");
    if (moonCb) moonCb.onchange = () => {
    };
  });
  safe("sunGate", () => {
    const sunCb = $("sunGateOnly");
    if (sunCb) sunCb.onchange = () => {
    };
  });
  safe("allGate", () => {
    const allGateCb = $("allGateOnly");
    if (allGateCb) allGateCb.onchange = () => {
      syncOmitLightsUI();
    };
  });
  safe("omitLights", () => {
    const omitCb = $("omitLights");
    if (omitCb) omitCb.onchange = () => {
      syncOmitLightsUI();
    };
  });
  safe("omitUI", syncOmitLightsUI);
  safe("timeTransitBased", () => {
    const el = $("timeTransitBased");
    if (!el) return;
    el.onchange = () => {
      try {
        syncNatalOnlyUI();
      } catch (e) {
      }
      try {
      } catch (e) {
      }
    };
    try {
      syncNatalOnlyUI();
    } catch (e) {
    }
  });
  safe("nowBtn", syncNowBtnHighlight);
  safe("runBtn", () => {
    try {
      wirePersonGenderSelects();
    } catch (e) {
    }
    const runBtn = $("runBtn");
    if (runBtn) runBtn.onclick = runAnalysis;
    try {
      wireRunPulse();
    } catch (e) {
    }
    try {
      wireReportStale();
    } catch (e) {
    }
    try {
      wireConfigPanels();
    } catch (e) {
    }
    try {
      wireRefineConfigModal();
    } catch (e) {
    }
    try {
      wireStickyToolbar();
    } catch (e) {
    }
    try {
      keepTimeTransitBasedVisible();
    } catch (e) {
    }
  });
  safe("nowClick", () => {
    const nowBtn = $("nowBtn");
    if (nowBtn) nowBtn.onclick = setNow;
  });
  safe("applyMan", () => {
    for (let n = 1; n <= 6; n++) {
      const am = $("applyMan" + n);
      if (am) am.onclick = /* @__PURE__ */ (function(slot) {
        return function() {
          applyManualGates(slot);
        };
      })(n);
    }
  });
  safe("printShare", () => {
    const pb = $("printBtn");
    if (pb) pb.onclick = () => printReport();
    const sh = $("shareBtn");
    if (sh) sh.onclick = (ev) => {
      ev.preventDefault();
      shareOrFallback("report", ev.currentTarget || sh);
    };
    const apb = $("answerPrintBtn");
    if (apb) apb.onclick = () => printAnswerOnly();
    const asb = $("answerShareBtn");
    if (asb) asb.onclick = (ev) => {
      ev.preventDefault();
      shareOrFallback("answer", ev.currentTarget || asb);
    };
    try {
      wireDisplayOverlay();
    } catch (e) {
    }
    const sm = $("shareMenu");
    if (sm) {
      sm.addEventListener("click", onShareMenuClick);
    }
    document.addEventListener("click", function(ev) {
      const menu = $("shareMenu");
      if (!menu || !menu.classList.contains("open")) return;
      const t = ev.target;
      if (menu.contains(t)) return;
      if (t && (t.id === "shareBtn" || t.id === "answerShareBtn" || t.id === "displayShareBtn" || t.closest && (t.closest("#shareBtn") || t.closest("#answerShareBtn") || t.closest("#displayShareBtn")))) return;
      closeShareMenu();
    });
    document.addEventListener("keydown", function(ev) {
      if (ev.key === "Escape") closeShareMenu();
    });
    window.addEventListener("resize", function() {
      const menu = $("shareMenu");
      if (menu && menu.classList.contains("open")) closeShareMenu();
    });
    syncAnswerShareButtons();
  });
  safe("whenMode", syncWhenModeHighlight);
  safe("reportMode2", () => setReportMode(reportMode));
  safe("calendar", renderCalendar);
  status("Loading ephemeris library\u2026");
  loadAstronomy().then(() => {
    engReady = true;
    status("Ephemeris ready (True Node \xB7 Gate 41 @ 302\xB0)", "ok");
    const q = new URLSearchParams(location.search);
    if (q.get("codes") === "1") {
      const c = $("includeCodes");
      if (c) c.checked = true;
    }
    if (q.get("codes") === "0") {
      const c = $("includeCodes");
      if (c) c.checked = false;
    }
    if (q.get("report") === "timeline") {
      setReportMode("timeline");
    }
    if (q.get("report") === "snapshot") {
      setReportMode("snapshot");
    }
    if (q.get("autorun") === "1") {
      loadCoupleSample();
      if (q.get("range") === "7") {
        mode = "range";
        endDate = addCalendarDays(startDate, 6);
        syncWhenModeHighlight();
        renderCalendar();
        runAnalysis();
      }
    }
  }).catch((err) => {
    showCdnFail();
    status(String(err.message || err), "err");
  });
}
window.__TA_SHARE__ = {
  hasWebShare,
  sharePayload,
  buildMailtoUrl,
  buildSmsUrl,
  shareOrFallback,
  openShareMenu,
  closeShareMenu,
  printAnswerOnly,
  fillAnswerPrintRoot,
  answerPrintInnerHtml,
  answerPrintModel,
  reportPlainText,
  clipAskDateOrder,
  hasSuccessfulGrokAnswer,
  syncAnswerShareButtons,
  MAILTO_SAFE,
  SMS_SAFE
};
window.__CAL_TEST__ = { getState: () => ({ mode, startDate, endDate, calViewYear, calViewMonth, startHm: getRangeStartHm(), endHm: getRangeEndHm(), label: selectionRangeText(), days: rangeDayCount(), window: getQueryWindow() }), setMode: (m) => {
  mode = m;
  if (m === "single") {
    endDate = null;
    rangeNeedsNewStart = true;
  } else {
    endDate = null;
    rangeNeedsNewStart = true;
  }
  renderCalendar();
}, pick: onPick, prev: calPrevMonth, next: calNextMonth, render: renderCalendar, applyInputs: applyDateInputsToState, clearPerson, clearDates };
function bootApp() {
  try {
    if (typeof renderQuickLoadGrids === "function") renderQuickLoadGrids();
  } catch (e) {
    try {
      console.error("bootApp quickLoad", e);
    } catch (_e) {
    }
  }
  try {
    wire();
  } catch (e) {
    try {
      console.error("bootApp wire", e);
    } catch (_e) {
    }
    try {
      if (typeof renderQuickLoadGrids === "function") renderQuickLoadGrids();
    } catch (_e) {
    }
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootApp);
} else {
  bootApp();
}
(function() {
  var root = null;
  try {
    root = typeof window !== "undefined" && window || typeof self !== "undefined" && self || null;
  } catch (e) {
    root = null;
  }
  if (!root || typeof root.addEventListener !== "function") return;
  try {
    root.addEventListener("pageshow", function(ev) {
      try {
        applyBootTodayToInputs();
        if (typeof renderQuickLoadGrids === "function") renderQuickLoadGrids();
        if (typeof renderCalendar === "function") renderCalendar();
      } catch (e) {
        try {
          console.error("pageshow today", e);
        } catch (_e) {
        }
      }
    });
  } catch (e) {
  }
})();
