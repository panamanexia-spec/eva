"use strict";
const DIAS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const TAGS={casa:"--t-casa",pago:"--t-pago",killian:"--t-killian",amelie:"--t-amelie",kam:"--t-kam",nexia:"--t-nexia",personal:"--t-personal"};
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- dates (Panamá = UTC-5) ---------- */
function pty(d=new Date()){ return new Date(d.getTime()-5*3600e3); }
function ymd(p){ return p.toISOString().slice(0,10); }
function addDays(p,n){ return new Date(p.getTime()+n*864e5); }
function nice(p){ return `${DIAS[p.getUTCDay()]} ${p.getUTCDate()} de ${MESES[p.getUTCMonth()]}`; }
function cap(s){ return s.replace(/^./,c=>c.toUpperCase()); }
function hhmm(p){ let h=p.getUTCHours(), mi=String(p.getUTCMinutes()).padStart(2,"0"); const ap=h<12?"a. m.":"p. m."; h=h%12||12; return `${h}:${mi} ${ap}`; }
function short(p){ let h=p.getUTCHours(), mi=String(p.getUTCMinutes()).padStart(2,"0"); const ap=h<12?"a":"p"; h=h%12||12; return `${h}:${mi}${ap}`; }
const now=pty(), TODAY=ymd(now);
const RANGE_START=TODAY, RANGE_END=ymd(addDays(now,7));
const $=id=>document.getElementById(id);

$("greet").textContent=(now.getUTCHours()<12?"Buenos días,":now.getUTCHours()<19?"Buenas tardes,":"Buenas noches,");
$("wday").textContent=DIAS[now.getUTCDay()];
$("dnum").textContent=String(now.getUTCDate()).padStart(2,"0")+"."+String(now.getUTCMonth()+1).padStart(2,"0");

function countUp(el,to,ms=1000){
  to=Math.round(to); if(REDUCED){ el.textContent=to; return; }
  const t0=performance.now(), from=Number(el.textContent)||0;
  const step=t=>{ const k=Math.min(1,(t-t0)/ms); el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,4))); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- aurora parallax ---------- */
window.addEventListener("pointermove",ev=>{
  document.documentElement.style.setProperty("--px",(ev.clientX/innerWidth-.5).toFixed(3));
  document.documentElement.style.setProperty("--py",(ev.clientY/innerHeight-.5).toFixed(3));
},{passive:true});

/* ---------- floating motes on the stage ---------- */
(function motes(){
  const c=$("motes"), ctx=c.getContext("2d"); if(!ctx) return;
  let w=0,h=0,dpr=Math.min(2,devicePixelRatio||1);
  const P=Array.from({length:26},()=>({x:Math.random(),y:Math.random(),r:.6+Math.random()*1.8,s:.04+Math.random()*.08,o:Math.random()*6.28}));
  function size(){ const r=c.getBoundingClientRect(); w=r.width; h=r.height; c.width=w*dpr; c.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
  size(); addEventListener("resize",size);
  function frame(t){
    ctx.clearRect(0,0,w,h);
    for(const p of P){
      if(!REDUCED){ p.y-=p.s/600*16; if(p.y<-.05){ p.y=1.05; p.x=Math.random(); } }
      const a=.35+.35*Math.sin(t/900+p.o);
      ctx.beginPath(); ctx.arc(p.x*w+Math.sin(t/1500+p.o)*6,p.y*h,p.r,0,6.283);
      ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.shadowColor="rgba(255,150,200,.9)"; ctx.shadowBlur=8; ctx.fill();
    }
    if(!REDUCED) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- Eva: 3D fur (three.js shell texturing) ---------- */
const FUR={mood:"thinking",gx:0,gy:0,ok:false,poke:0};
(function initFur(){
  if(!window.THREE) return;
  const canvas=$("fur3d");
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:false}); }catch(e){ return; }
  if(!renderer.getContext()) return;
  canvas.hidden=false; $("petbox").classList.add("gl"); FUR.ok=true;
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(30,1,.1,50); cam.position.set(0,0,5.6);
  const vs=`uniform float uH;uniform float uLen;uniform float uTime;uniform vec3 uWind;
    varying vec3 vP;varying vec3 vN;varying float vH;
    void main(){vec3 n=normalize(normal);float k=uH*uH;vec3 p=position+n*uH*uLen;
      p+=(uWind+vec3(0.0,-0.5,0.0))*k*uLen*0.7;
      p.x+=sin(uTime*1.7+position.y*5.0)*0.025*k;p.z+=cos(uTime*1.3+position.x*4.0)*0.02*k;
      vP=position;vN=normalize(normalMatrix*n);vH=uH;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
  const fs=`uniform float uH;uniform vec3 uRoot;uniform vec3 uTip;uniform float uDen;
    varying vec3 vP;varying vec3 vN;varying float vH;
    float h3(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    void main(){vec3 q=normalize(vP)*uDen;vec3 c=floor(q);vec3 f=fract(q)-0.5;
      vec3 off=vec3(h3(c+1.3),h3(c+2.7),h3(c+5.1))-0.5;float d=length(f-off*0.45);
      float len=mix(0.55,1.0,h3(c));
      if(uH>0.001){if(uH>len)discard;float th=(1.0-uH/len)*0.62;if(d>th)discard;}
      vec3 N=normalize(vN);vec3 L=normalize(vec3(-0.5,0.8,0.7));
      float dif=max(dot(N,L),0.0)*0.38+0.8;float rim=pow(1.0-max(N.z,0.0),2.2);
      vec3 col=mix(uRoot,uTip,uH)*dif;col+=rim*vec3(1.0,0.8,0.9)*0.45*(0.3+uH);
      col*=mix(0.8,1.0,smoothstep(0.0,0.6,uH));col=min(col,vec3(1.0));
      gl_FragColor=vec4(col,1.0);}`;
  const SHELLS=40, mats=[];
  function furBall(radius,len,den,root,tip,seg){
    const g=new THREE.Group(), geo=new THREE.SphereGeometry(radius,seg,seg);
    for(let i=0;i<=SHELLS;i++){
      const m=new THREE.ShaderMaterial({vertexShader:vs,fragmentShader:fs,uniforms:{uH:{value:i/SHELLS},uLen:{value:len},uTime:{value:0},uWind:{value:new THREE.Vector3()},uRoot:{value:new THREE.Color(root)},uTip:{value:new THREE.Color(tip)},uDen:{value:den}}});
      mats.push(m); const mesh=new THREE.Mesh(geo,m); mesh.renderOrder=i; g.add(mesh);
    }
    return g;
  }
  const root=new THREE.Group(); scene.add(root);
  const body=furBall(1,.14,66,"#F08AB6","#FFE8F2",64); body.scale.set(1,.96,.92); root.add(body);
  const earL=furBall(.3,.09,44,"#EE86B4","#FFE0EE",32), earR=furBall(.3,.09,44,"#EE86B4","#FFE0EE",32);
  earL.position.set(-.7,.74,-.15); earR.position.set(.7,.74,-.15); root.add(earL,earR);
  root.position.y=-.06;
  function size(){ const r=canvas.getBoundingClientRect(); renderer.setPixelRatio(Math.min(2,devicePixelRatio||1)); renderer.setSize(r.width,r.height,false); cam.aspect=r.width/r.height; cam.updateProjectionMatrix(); }
  size(); addEventListener("resize",size);
  let rx=0,ry=0,t0=performance.now();
  function frame(now){
    const t=(now-t0)/1000;
    const busy=FUR.mood==="busy", sad=FUR.mood==="sad";
    const br=Math.sin(t*(busy?3.4:1.7))*.022;
    body.scale.set(1+br*.6,.96-br,.92+br*.4);
    rx+=(FUR.gy*.06-rx)*.08; ry+=(FUR.gx*.08-ry)*.08;
    root.rotation.set(rx,ry,Math.sin(t*.8)*.03+(sad?.06:0));
    const wig=(k)=>Math.max(0,Math.sin(t*1.3+k))**20*.35;
    earL.rotation.z=.25+wig(0)+(sad?.5:0); earR.rotation.z=-.25-wig(2)-(sad?.5:0);
    earL.position.y=earR.position.y=sad?.62:.74;
    FUR.poke*=.92;
    const wind=new THREE.Vector3(Math.sin(t*.9)*.25-ry*1.5+FUR.poke*Math.sin(t*30),Math.cos(t*.7)*.1,0);
    for(const m of mats){ m.uniforms.uTime.value=t; m.uniforms.uWind.value.copy(wind); }
    renderer.render(scene,cam);
    if(!REDUCED || t<.2) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- Eva: face + moods ---------- */
const petbox=$("petbox"), svg=$("eva"), sayEl=$("say");
const MOUTH={smile:{d:"M90 134 Q100 144 110 134",open:false},grin:{d:"M86 131 Q100 152 114 131 Q100 137 86 131Z",open:true},o:{d:"M100 131 a6 7 0 1 0 0.01 0Z",open:true},small:{d:"M100 134 a3.5 4 0 1 0 0.01 0Z",open:true},flat:{d:"M91 137 Q100 139 109 137",open:false},wobbly:{d:"M88 138 Q94 133 100 138 Q106 143 112 138",open:false},sad:{d:"M89 141 Q100 131 111 141",open:false}};
const BROWS={none:["",""],focus:["M64 92 L86 97","M136 92 L114 97"],worried:["M65 97 L86 91","M135 97 L114 91"],up:["M66 90 Q76 84 86 89","M114 89 Q124 84 134 90"]};
const LOOKS={
  calm:{mouth:"smile",brows:"none",eyes:"open",halo:"rgba(255,150,195,.6)",label:"Tranquila"},
  happy:{mouth:"grin",brows:"none",eyes:"open",halo:"rgba(255,140,190,.7)",label:"Contenta"},
  joy:{mouth:"grin",brows:"none",eyes:"happy",halo:"rgba(255,190,120,.75)",label:"Feliz"},
  love:{mouth:"grin",brows:"up",eyes:"happy",halo:"rgba(255,90,150,.8)",label:"¡Listo!"},
  focus:{mouth:"flat",brows:"focus",eyes:"open",halo:"rgba(255,160,100,.75)",label:"Concentrada"},
  busy:{mouth:"wobbly",brows:"worried",eyes:"open",sweat:true,halo:"rgba(255,120,120,.7)",label:"Día cargado"},
  thinking:{mouth:"small",brows:"up",eyes:"open",gaze:[3,-5],halo:"rgba(180,160,255,.7)",label:"Pensando"},
  talking:{mouth:"o",brows:"none",eyes:"open",halo:"rgba(120,225,195,.7)",label:"Hablando"},
  sad:{mouth:"sad",brows:"worried",eyes:"open",halo:"rgba(140,170,230,.6)",label:"Sin conexión"},
};
let baseMood="calm", baseLine="", mood="", talkTimer=null, gazeLock=null, typeTimer=null;
function setMouth(k){ const m=MOUTH[k], el=$("mouth"); el.setAttribute("d",m.d); el.classList.toggle("open",m.open); }
function setFace(name){
  const L=LOOKS[name]||LOOKS.calm; mood=name; FUR.mood=name; svg.dataset.mood=name; petbox.dataset.mood=name;
  setMouth(L.mouth);
  const [bl,br]=BROWS[L.brows]; $("browL").setAttribute("d",bl); $("browR").setAttribute("d",br);
  const happy=L.eyes==="happy";
  $("eyeL").style.display=$("eyeR").style.display=happy?"none":"";
  $("happyL").toggleAttribute("hidden",!happy); $("happyR").toggleAttribute("hidden",!happy);
  $("sweat").toggleAttribute("hidden",!L.sweat);
  petbox.style.setProperty("--halo",L.halo);
  $("moodBadge").textContent=L.label;
  gazeLock=L.gaze||null; if(gazeLock) look(...gazeLock);
  clearInterval(talkTimer); talkTimer=null;
  if(name==="talking"){ let f=0; talkTimer=setInterval(()=>setMouth(["o","small","grin","small"][f++%4]),130); }
}
function say(text){
  clearInterval(typeTimer);
  if(REDUCED){ sayEl.textContent=text; return; }
  let i=0; sayEl.textContent="";
  const node=document.createTextNode(""), caret=document.createElement("span"); caret.className="caret"; sayEl.append(node,caret);
  typeTimer=setInterval(()=>{ i+=2; node.data=text.slice(0,i); if(i>=text.length){ clearInterval(typeTimer); caret.remove(); } },20);
}
function settle(){ setFace(baseMood); if(baseLine) say(baseLine); }
let settleT=null; function settleIn(ms){ clearTimeout(settleT); settleT=setTimeout(settle,ms); }
function look(dx,dy){
  dx=Math.max(-5,Math.min(5,dx)); dy=Math.max(-5,Math.min(5,dy)); FUR.gx=dx; FUR.gy=dy;
  $("face").style.transform=`translate(${dx*.9}px,${dy*.7}px)`;
  document.querySelectorAll("#eyes .eye").forEach(e=>e.style.translate=`${dx*.6}px ${dy*.6}px`);
}
function blink(){
  if(mood!=="joy"&&mood!=="love"){ document.querySelectorAll("#eyes .eye").forEach(e=>e.classList.add("shut")); setTimeout(()=>document.querySelectorAll("#eyes .eye").forEach(e=>e.classList.remove("shut")),120); }
  setTimeout(blink,2200+Math.random()*3800);
}
setTimeout(blink,1800);
addEventListener("pointermove",ev=>{ if(gazeLock) return; const r=svg.getBoundingClientRect(); look((ev.clientX-(r.left+r.width/2))/40,(ev.clientY-(r.top+r.height/2))/40); },{passive:true});
setInterval(()=>{ if(!gazeLock && !matchMedia("(hover:hover)").matches) look((Math.random()-.5)*8,(Math.random()-.5)*5); },3200);
function hearts(n=5){
  const g=$("hearts");
  for(let i=0;i<n;i++){ const h=document.createElementNS("http://www.w3.org/2000/svg","path"); const x=60+Math.random()*80, y=40+Math.random()*30;
    h.setAttribute("d",`M${x} ${y} c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4z`); h.setAttribute("class","heart"); h.style.animationDelay=(i*.15)+"s"; g.append(h); setTimeout(()=>h.remove(),2200+i*150); }
}
function celebrate(line){ setFace("love"); hearts(); if(line) say(line); settleIn(2800); }
const TAPS=["¡Jiji! Me haces cosquillas.","Aquí estoy, Adela. Dime qué tienes en mente.","Un pendiente a la vez. Tú puedes.","¿Ya tomaste agua hoy?","Abrazo peludo para ti, Killian y Amelie."];
$("pet").addEventListener("click",()=>{
  petbox.classList.remove("giggle"); void petbox.offsetWidth; petbox.classList.add("giggle"); FUR.poke=1;
  if(mood==="thinking"||mood==="talking") return;
  setFace("joy"); hearts(3); say(TAPS[Math.floor(Math.random()*TAPS.length)]);
  settleIn(2600);
});

/* ================= Libreta ================= */
const AREAS=["casa","amelie","killian","pago","kam","nexia","personal"];
const LABEL={casa:"Casa",amelie:"Amelie",killian:"Killian",pago:"Pago",kam:"Kata",nexia:"Nexia",personal:"Personal"};
const DE={casa:"de la casa",amelie:"de Amelie",killian:"de Killian",pago:"de pagos",kam:"de Kata",nexia:"de Nexia",personal:"personal"};
// orden = prioridad cuando una frase toca dos áreas ("pagar la cuota de la escuela" → Pago)
const KEYS=[
  ["pago",/\b(pagar|pago|pagos|luz|agua|data|cuotas?|ph)\b/],
  ["amelie",/\b(amelie|bebe|leche|panal|panales|vacunas?|pediatra)\b/],
  ["killian",/\b(killian|examen|examenes|tareas?|escuela|materiales)\b/],
  ["kam",/\b(kata|kam|clientes?|propuestas?|entregas?)\b/],
  ["nexia",/\b(nexia|oficina|posts?|eventos?)\b/],
  ["casa",/\b(casa|pintura|pintar|cortinas?|sofa|sofas|super|supermercado|limpiar|limpieza)\b/],
  ["personal",/\b(personal|personales)\b/],
];
const WD=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const MN=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function norm(s){ let o=""; for(const ch of s){ const c=ch.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); o+=c.length===1?c:ch.toLowerCase().slice(0,1)||" "; } return o; }
const dayMs=864e5, T0=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
const dOf=k=>ymd(new Date(T0+k*dayMs));
const diff=s=>Math.round((Date.parse(s+"T00:00:00Z")-T0)/dayMs);

function detectArea(n){ for(const [a,re] of KEYS) if(re.test(n)) return a; return null; }

/* Fecha: devuelve {from,to,spans} — spans son trozos del texto que eran la fecha */
function detectDate(n){
  const spans=[]; let m;
  const take=(re,fn)=>{ re.lastIndex=0; const x=re.exec(n); if(!x) return null; const r=fn(x); if(r) spans.push([x.index,x.index+x[0].length]); return r; };
  let r;
  if((r=take(/\b(la )?(semana que viene|proxima semana)\b/,()=>{ const dow=now.getUTCDay(), toMon=((8-dow)%7)||7; return {from:dOf(toMon),to:dOf(toMon+6),label:"La semana que viene"}; }))) return {...r,spans};
  if((r=take(/\b(esta semana|en la semana)\b/,()=>{ const dow=now.getUTCDay(); let end=(7-dow)%7; if(end<2) end+=7; return {from:dOf(0),to:dOf(end),label:"Esta semana"}; }))) return {...r,spans};
  if((r=take(/\bpasado manana\b/,()=>({from:dOf(2),to:dOf(2)})))) return {...r,spans};
  if((r=take(/\bhoy\b/,()=>({from:dOf(0),to:dOf(0)})))) return {...r,spans};
  const re=/\bmanana\b/g;
  while((m=re.exec(n))){ const before=n.slice(Math.max(0,m.index-8),m.index); if(/(la|esta|cada|una) $/.test(before)) continue; spans.push([m.index,m.index+6]); return {from:dOf(1),to:dOf(1),spans}; }
  if((r=take(/\b(el |este |esta |para el |el proximo |proximo )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)( que viene| proximo)?\b/,x=>{
    const want=WD.indexOf(x[2]); let k=(want-now.getUTCDay()+7)%7; if(k===0&&/proximo|que viene/.test(x[0])) k=7; return {from:dOf(k),to:dOf(k)}; }))) return {...r,spans};
  const MRE="(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)";
  if((r=take(new RegExp("\\b(?:(?:el|para el|este) (\\d{1,2})(?: de "+MRE+")?|(\\d{1,2}) de "+MRE+")\\b"),x=>{
    const day=+(x[1]||x[3]), mon=x[2]||x[4]; if(day<1||day>31) return null;
    let y=now.getUTCFullYear(), mo=mon?MN.indexOf(mon):now.getUTCMonth();
    let t=Date.UTC(y,mo,day); if(t<T0){ if(mon) y++; else mo++; t=Date.UTC(y,mo,day); }
    const s=ymd(new Date(t)); return {from:s,to:s}; }))) return {...r,spans};
  spans.length=0; return {from:null,to:null,spans};
}
function stripSpans(text,n,spans){
  if(!spans.length||[...text].length!==n.length) return text;
  const chars=[...text]; for(const [a,b] of spans) for(let i=a;i<b;i++) chars[i]="";
  let t=chars.join("").replace(/\s+([,.;:])/g,"$1").replace(/\s{2,}/g," ").replace(/^[\s,;:.-]+|[\s,;:-]+$/g,"");
  t=t.replace(/^(recuerdame|recuérdame|recordar|anota|anotar|apunta|apuntar|no olvidar|no olvides)\s+(que\s+)?/i,"");
  return t.length>1?t.charAt(0).toUpperCase()+t.slice(1):text;
}
function isQuestion(raw,n){ return /[¿?]/.test(raw)||/^(que tengo|que hay|que me toca|que falta|que tenia|cuales|tengo algo|hay algo|muestrame|ensename)\b/.test(n.trim()); }

/* ---------- hora y monto ---------- */
function detectTime(n){
  const res=[/\ba las (\d{1,2})(?:[:.](\d{2}))?(?:\s*(am|pm|a\.? ?m\.?|p\.? ?m\.?|de la manana|de la tarde|de la noche))?/, /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?=\s|$|[,.;])/, /\b(\d{1,2}):(\d{2})\b/];
  for(const re of res){ const x=re.exec(n); if(!x) continue;
    let h=+x[1], mi=+(x[2]||0); const suf=(x[3]||"").replace(/[\s.]/g,"");
    if(h>23||mi>59) continue;
    if(/^(pm|delatarde|delanoche)$/.test(suf)&&h<12) h+=12; else if(/^(am|delamanana)$/.test(suf)&&h===12) h=0; else if(!suf&&h>=1&&h<=6) h+=12;
    return {time:String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0"),span:[x.index,x.index+x[0].length]}; }
  return {time:null,span:null};
}
function detectAmount(n){
  const x=/\$\s?(\d+(?:[.,]\d{1,2})?)|\b(\d+(?:[.,]\d{1,2})?)\s?(?:dolares|usd|balboas)\b/.exec(n);
  return x?{amount:Number((x[1]||x[2]).replace(",",".")),span:[x.index,x.index+x[0].length]}:{amount:null,span:null};
}
function fmtTime(t){ if(!t) return ""; let [h,mi]=t.split(":").map(Number); const ap=h<12?"a. m.":"p. m."; h=h%12||12; return `${h}:${String(mi).padStart(2,"0")} ${ap}`; }

/* ---------- nube (Supabase) + copia en el teléfono ---------- */
const SB="https://hhpoezwionzxmayebbpx.supabase.co", PK="sb_publishable_0R-GV1JwJOl8125gNiZ4ZA_yw5CDssI";
const LLAVE_K="eva.llave", COPIA_K="eva.copia.v1", COLA_K="eva.cola.v1", OLD_K="eva.libreta.v1";
const AREA_DB={casa:"Casa",amelie:"Amelie",killian:"Killian",pago:"Pago",kam:"KAM",nexia:"Nexia",personal:"Personal"};
const AREA_IN={casa:"casa",amelie:"amelie",killian:"killian",pago:"pago",kam:"kam",kata:"kam",nexia:"nexia",personal:"personal"};
const ls={get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} }};
let LLAVE=ls.get(LLAVE_K,null), NOTES=[], COLA=ls.get(COLA_K,[]), EN_LINEA=null;
class LlaveMala extends Error{}
async function rpc(fn,args,llave=LLAVE){
  const r=await fetch(`${SB}/rest/v1/rpc/${fn}`,{method:"POST",headers:{apikey:PK,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({p_llave:llave,...args})});
  if(r.ok) return r.json();
  let j={}; try{ j=await r.json(); }catch(e){}
  if(j.code==="28000"||/llave/i.test(j.message||"")) throw new LlaveMala("llave");
  const e=new Error(j.message||("HTTP "+r.status)); e.server=true; throw e;
}
function fromRow(r){ return {id:r.id,text:r.texto||"",area:AREA_IN[String(r.area||"").toLowerCase()]||"personal",date:r.fecha||dOf(0),noDate:!r.fecha,time:r.hora?String(r.hora).slice(0,5):null,amount:r.monto!=null?Number(r.monto):null,done:!!r.hecho,created:Date.parse(r.creado)||0}; }
function saveCopy(){ ls.set(COPIA_K,{at:Date.now(),notas:NOTES}); }
function loadCopy(){ const c=ls.get(COPIA_K,null); NOTES=(c&&Array.isArray(c.notas))?c.notas:[]; }
function setOnline(v){ EN_LINEA=v; refreshSide(); }
let flushing=false;
async function flush(){
  if(flushing||!LLAVE) return; flushing=true;
  try{
    while(COLA.length){
      const o=COLA[0];
      try{
        if(o.op==="add"){ const row=await rpc("eva_agregar",o.args); const loc=NOTES.find(x=>x.id===o.tmp); if(loc&&row&&row.id){ loc.id=row.id; loc.created=Date.parse(row.creado)||loc.created; } COLA.slice(1).forEach(q=>{ if(q.id===o.tmp) q.id=row.id; }); }
        else if(o.op==="upd") await rpc("eva_actualizar",{p_id:o.id,...o.args});
        else if(o.op==="del") await rpc("eva_borrar",{p_id:o.id});
        COLA.shift(); ls.set(COLA_K,COLA); saveCopy(); EN_LINEA=true;
      }catch(e){
        if(e instanceof LlaveMala){ askKey(true); break; }
        if(e.server){ COLA.shift(); ls.set(COLA_K,COLA); continue; }
        EN_LINEA=false; break;
      }
    }
  }finally{ flushing=false; }
}
function send(op){ COLA.push(op); ls.set(COLA_K,COLA); saveCopy(); flush().then(()=>refreshSide()); }
let syncing=false;
async function sync(){
  if(!LLAVE||syncing) return; syncing=true;
  try{
    await flush();
    if(!COLA.length){
      const rows=await rpc("eva_listar",{p_desde:null,p_hasta:null,p_incluir_hechos:true});
      NOTES=(Array.isArray(rows)?rows:[]).map(fromRow); saveCopy(); EN_LINEA=true;
    }
  }catch(e){ if(e instanceof LlaveMala){ askKey(true); } else EN_LINEA=false; }
  finally{ syncing=false; if(!openPicker) render(); refreshSide(); }
}
async function migrateOld(){
  const old=ls.get(OLD_K,null); if(!Array.isArray(old)||!old.length){ ls.del(OLD_K); return; }
  for(const x of old) if(x&&x.text&&!x.done) send({op:"add",tmp:"tmp-"+uid(),args:{p_texto:x.text,p_area:AREA_DB[x.area]||"Personal",p_fecha:x.date||null,p_hora:null,p_monto:null}});
  ls.del(OLD_K);
}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

/* ---------- llave ---------- */
function askKey(bad){
  if(bad){ LLAVE=null; ls.del(LLAVE_K); }
  $("gateMsg").textContent=bad?"Esa llave no funcionó. Revísala con calma y vuelve a intentar; aquí te espero.":"Escríbela una sola vez. Se queda guardada en este teléfono.";
  $("gateMsg").classList.toggle("warn",!!bad);
  $("gate").hidden=false; document.body.classList.add("locked");
  setTimeout(()=>$("gateIn").focus(),250);
}
$("gateForm").addEventListener("submit",async ev=>{
  ev.preventDefault(); const v=$("gateIn").value.trim(), msg=$("gateMsg"), btn=$("gateBtn"); if(!v) return;
  btn.disabled=true; btn.textContent="Revisando…"; msg.classList.remove("warn");
  try{
    const rows=await rpc("eva_listar",{p_desde:null,p_hasta:null,p_incluir_hechos:true},v);
    LLAVE=v; ls.set(LLAVE_K,v); $("gateIn").value=""; $("gate").hidden=true; document.body.classList.remove("locked");
    NOTES=(Array.isArray(rows)?rows:[]).map(fromRow); EN_LINEA=true; saveCopy(); await migrateOld(); render(); refreshSide();
    celebrate("¡Lista, Adela! Ya tengo tu libreta.");
  }catch(e){
    msg.classList.add("warn");
    msg.textContent=e instanceof LlaveMala?"Esa llave no funcionó. Revísala con calma y vuelve a intentar; aquí te espero.":"No pude conectarme ahora. Revisa tu internet y vuelve a intentar.";
  }finally{ btn.disabled=false; btn.textContent="Entrar"; }
});
$("changeKey").onclick=()=>{
  if(!confirm("¿Cambiar la llave de Eva?\n\nOjo: una llave nueva no sirve hasta que la actualices también en Supabase. Si la cambias aquí antes, Eva no podrá abrir tu lista.")) return;
  closeAjustes(); LLAVE=null; ls.del(LLAVE_K); askKey(false);
};
/* ---------- ajustes ---------- */
function openAjustes(){ $("ajustes").hidden=false; document.body.classList.add("locked"); refreshSide(); renderQuincena(PLAN); setTimeout(()=>$("closeAjustes").focus(),50); }
function closeAjustes(){ $("ajustes").hidden=true; if($("gate").hidden) document.body.classList.remove("locked"); $("openAjustes").focus({preventScroll:true}); }
$("openAjustes").onclick=openAjustes; $("closeAjustes").onclick=closeAjustes;
$("ajustes").addEventListener("click",ev=>{ if(ev.target===$("ajustes")) closeAjustes(); });
addEventListener("keydown",ev=>{ if(ev.key==="Escape"&&!$("ajustes").hidden) closeAjustes(); });

/* ---------- vistas ---------- */
let VIEW={kind:"hoy"}, openPicker=null;
function niceDay(s){ const k=diff(s); if(k===0) return "Hoy"; if(k===1) return "Mañana"; if(k===-1) return "Ayer"; const d=new Date(s+"T00:00:00Z"); return cap(DIAS[d.getUTCDay()])+" "+d.getUTCDate()+(Math.abs(k)>6?" "+MESES[d.getUTCMonth()].slice(0,3):""); }
function whenPhrase(from,to,label){ if(label) return label; if(from===to) { const k=diff(from); if(k===0) return "Hoy"; if(k===1) return "Mañana"; const d=new Date(from+"T00:00:00Z"); return "El "+DIAS[d.getUTCDay()]+" "+d.getUTCDate(); } return "Esos días"; }
const byDate=(a,b)=>(a.date.localeCompare(b.date))||(a.done-b.done)||((a.time||"99").localeCompare(b.time||"99"))||(a.created-b.created);

function select(){
  const v=VIEW, t=dOf(0);
  if(v.kind==="hoy") return NOTES.filter(x=>x.date===t||(x.date<t&&!x.done)).sort(byDate);
  if(v.kind==="area") return NOTES.filter(x=>x.area===v.area&&(x.date>=t||!x.done)).sort(byDate);
  return NOTES.filter(x=>(!v.area||x.area===v.area)&&(v.from?x.date>=v.from&&x.date<=v.to:(x.date>=t||!x.done))).sort(byDate);
}
function title(){
  const v=VIEW, d=now;
  if(v.kind==="hoy") return "Hoy · "+d.getUTCDate()+" "+MESES[d.getUTCMonth()].slice(0,3);
  if(v.kind==="area") return v.area==="pago"?"Pagos":LABEL[v.area];
  return (v.area?LABEL[v.area]+" · ":"")+(v.from?whenPhrase(v.from,v.to,v.label).toLowerCase():"pendiente");
}
function render(){
  const el=$("tl"); el.replaceChildren(); openPicker=null;
  $("dayTitle").textContent=title();
  document.querySelectorAll("#quick button").forEach(b=>b.setAttribute("aria-pressed",String((VIEW.kind==="hoy"&&b.dataset.v==="hoy")||(VIEW.kind!=="hoy"&&VIEW.area===b.dataset.v&&VIEW.kind==="area"))));
  const list=select(), pend=list.filter(x=>!x.done).length;
  $("dayCount").textContent=list.length?(pend?`${pend} pendiente${pend>1?"s":""}`:"todo hecho"):"";
  if(!list.length){
    const e=document.createElement("div"); e.className="empty glass pop";
    const b=document.createElement("b"); b.textContent=VIEW.kind==="hoy"?"Día libre":"Nada por aquí";
    e.append(b, NOTES.length?"Escribe abajo lo que tengas en mente.":"Prueba: «mañana comprar pañales» o «¿qué tengo hoy de la casa?»");
    el.append(e); return;
  }
  const grouped=VIEW.kind!=="hoy"||list.some(x=>x.date!==dOf(0));
  let last="", i=0;
  for(const n of list){
    const g=n.date<dOf(0)&&!n.done?"Pendiente de antes":niceDay(n.date);
    if(grouped&&g!==last){ const h=document.createElement("div"); h.className="ghead"; h.textContent=g; el.append(h); last=g; }
    el.append(row(n,i++));
  }
}
function row(n,i){
  const c=document.createElement("div"); c.className="note card glass pop"+(n.done?" done":""); c.style.setProperty("--i",i); c.style.setProperty("--c",`var(${TAGS[n.area]})`);
  const ck=document.createElement("button"); ck.type="button"; ck.className="check"; ck.setAttribute("aria-label",n.done?"Marcar como pendiente":"Marcar como hecho"); ck.setAttribute("aria-pressed",String(!!n.done));
  ck.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  ck.onclick=()=>toggle(n);
  const tx=document.createElement("div"); tx.className="tx";
  const tg=document.createElement("button"); tg.type="button"; tg.className="tag"; tg.textContent=LABEL[n.area]; tg.setAttribute("aria-label","Área: "+LABEL[n.area]+". Toca para cambiar."); tg.onclick=()=>picker(c,n);
  const ti=document.createElement("span"); ti.className="ttl"; ti.textContent=n.text;
  tx.append(tg,ti);
  const meta=[n.time?fmtTime(n.time):"",n.amount!=null?usd(n.amount):""].filter(Boolean).join(" · ");
  if(meta){ const m=document.createElement("span"); m.className="meta"; m.textContent=meta; tx.append(m); }
  c.append(ck,tx); return c;
}
function picker(card,n){
  if(openPicker){ const same=openPicker.card===card; openPicker.el.remove(); openPicker=null; if(same) return; }
  const p=document.createElement("div"); p.className="picker";
  for(const a of AREAS){ const b=document.createElement("button"); b.type="button"; b.textContent=LABEL[a]; b.style.setProperty("--c",`var(${TAGS[a]})`); if(a===n.area) b.setAttribute("aria-current","true");
    b.onclick=()=>{ n.area=a; send({op:"upd",id:n.id,args:{p_area:AREA_DB[a]}}); render(); refreshSide(); setFace("happy"); say(`Listo, lo pasé a ${LABEL[a]}.`); settleIn(2600); }; p.append(b); }
  const del=document.createElement("button"); del.type="button"; del.className="del"; del.textContent="Borrar";
  del.onclick=()=>{ NOTES=NOTES.filter(x=>x.id!==n.id);
    if(String(n.id).startsWith("tmp-")&&COLA.some(q=>q.tmp===n.id)){ COLA=COLA.filter(q=>q.tmp!==n.id&&q.id!==n.id); ls.set(COLA_K,COLA); saveCopy(); } else send({op:"del",id:n.id});
    render(); refreshSide(); say("Borrada. Una cosa menos."); settleIn(2600); };
  p.append(del); card.after(p); openPicker={card,el:p};
}
function toggle(n){
  n.done=!n.done; send({op:"upd",id:n.id,args:{p_hecho:n.done}}); render(); refreshSide();
  if(n.done){ const left=NOTES.filter(x=>x.date===dOf(0)&&!x.done).length; celebrate(left?`¡Hecho! Te quedan ${left} para hoy.`:"¡Hecho! Ya no te queda nada para hoy."); }
}

/* ---------- escribir / preguntar ---------- */
function list3(xs){ const t=xs.map(x=>x.text.charAt(0).toLowerCase()+x.text.slice(1)); return t.length>1?t.slice(0,-1).join(", ")+" y "+t[t.length-1]:t[0]; }
function answer(raw,n){
  const area=detectArea(n), dt=detectDate(n);
  let from=dt.from,to=dt.to,label=dt.label;
  if(!from&&!area){ from=to=dOf(0); }
  VIEW={kind:"query",area,from,to,label};
  const xs=select(), pend=xs.filter(x=>!x.done), done=xs.length-pend.length;
  const when=from?whenPhrase(from,to,label):"Pendiente";
  const de=area?" "+DE[area]:"";
  const de2=k=>area?" "+(area==="personal"&&k>1?"personales":DE[area]):"";
  let line;
  if(!xs.length) line=`${when} no tienes nada${de}. ${["Respira tranquila.","Día ligero, aprovéchalo.","Todo en calma."][Math.floor(Math.random()*3)]}`;
  else if(!pend.length) line=`${when} ya hiciste todo${de}. ¡Bien, Adela!`;
  else if(pend.length===1) line=`${when} tienes una cosa${de2(1)}: ${list3(pend)}.`;
  else if(pend.length<=4) line=`${when} tienes ${pend.length} cosas${de2(2)}: ${list3(pend)}.`;
  else line=`${when} tienes ${pend.length} cosas${de2(2)}. Te las dejo aquí abajo, una a la vez.`;
  if(done&&pend.length) line+=` Ya hiciste ${done}.`;
  render(); setFace("talking"); say(line); setTimeout(()=>{ if(mood==="talking") setFace(pend.length>=4?"focus":"happy"); },Math.min(4000,line.length*22+600)); settleIn(9000);
  $("dayTitle").scrollIntoView({behavior:REDUCED?"auto":"smooth",block:"start"});
}
function add(raw,n){
  const area=detectArea(n)||"personal", dt=detectDate(n), tm=detectTime(n), am=detectAmount(n), date=dt.from||dOf(0);
  const spans=dt.spans.concat([tm.span,am.span].filter(Boolean));
  let text=stripSpans(raw.trim(),n,spans); text=text.charAt(0).toUpperCase()+text.slice(1);
  const note={id:"tmp-"+uid(),text,area,date,time:tm.time,amount:am.amount,done:false,created:Date.now()};
  NOTES.push(note);
  send({op:"add",tmp:note.id,args:{p_texto:text,p_area:AREA_DB[area],p_fecha:date,p_hora:tm.time?tm.time+":00":null,p_monto:am.amount}});
  if(VIEW.kind!=="hoy"&&!(VIEW.kind==="area"&&VIEW.area===area)) VIEW={kind:"hoy"};
  if(VIEW.kind==="hoy"&&date!==dOf(0)) VIEW={kind:"area",area};
  render(); refreshSide();
  const k=diff(date), d=new Date(date+"T00:00:00Z"), cuando=k===0?"para hoy":k===1?"para mañana":"para el "+DIAS[d.getUTCDay()]+" "+d.getUTCDate();
  celebrate(`Anotado en ${LABEL[area]} ${cuando}${tm.time?" a las "+fmtTime(tm.time):""}.`);
}
$("composer").addEventListener("submit",ev=>{
  ev.preventDefault(); const inp=$("q"), raw=inp.value.trim(); if(!raw) return; inp.value="";
  const n=norm(raw); if(isQuestion(raw,n)) answer(raw,n); else add(raw,n);
});
$("q").addEventListener("focus",()=>{ clearTimeout(settleT); setFace("thinking"); say("Te escucho…"); });
$("q").addEventListener("blur",()=>{ if(mood==="thinking") setTimeout(()=>{ if(mood==="thinking") settle(); },300); });
document.querySelectorAll("#quick button").forEach(b=>b.onclick=()=>{
  VIEW=b.dataset.v==="hoy"?{kind:"hoy"}:{kind:"area",area:b.dataset.v}; render();
  if(VIEW.kind==="area"){ const p=select().filter(x=>!x.done).length; say(p?`${b.textContent}: ${p} pendiente${p>1?"s":""}.`:`Nada pendiente ${DE[VIEW.area]}.`); settleIn(3500); } else settle();
});

/* ---------- quincena y pagos ---------- */
let PLAN=null;
const usd=v=>"$"+Number(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
function renderQuincena(plan){
  const y=now.getUTCFullYear(), m=now.getUTCMonth(), d=now.getUTCDate();
  const lastOf=(yy,mm)=>new Date(Date.UTC(yy,mm+1,0)).getUTCDate();
  const c=[]; for(let k=0;k<2;k++){ const yy=y+Math.floor((m+k)/12), mm=(m+k)%12; c.push(Date.UTC(yy,mm,15),Date.UTC(yy,mm,Math.min(30,lastOf(yy,mm)))); }
  const today=Date.UTC(y,m,d), next=c.find(t=>t>=today);
  const prev=Math.max(...[Date.UTC(y,m-1,Math.min(30,lastOf(y,m-1))),Date.UTC(y,m,15),Date.UTC(y,m,Math.min(30,lastOf(y,m)))].filter(t=>t<next));
  const days=Math.round((next-today)/864e5), span=Math.round((next-prev)/864e5), nd=new Date(next), key=ymd(nd);
  countUp($("ringN"),days); countUp($("sDays"),days);
  $("ringL").textContent=days===1?"día":"días"; $("sDaysL").textContent=days===0?"¡hoy cobras!":"días a quincena";
  setTimeout(()=>{ $("ringVal").style.strokeDashoffset=(301.6*(days/span)).toFixed(1); },300);
  const dow=nd.getUTCDay();
  $("payWhen").textContent=`${cap(DIAS[dow])} ${nd.getUTCDate()} de ${MESES[nd.getUTCMonth()]}`;
  const q=plan&&plan.quincenas&&plan.quincenas[key], dl=$("payMoney"); dl.replaceChildren();
  const add=(t,v,cl)=>{ const a=document.createElement("dt"); a.textContent=t; const b=document.createElement("dd"); b.textContent=v; if(cl) b.className=cl; dl.append(a,b); };
  if(q){ add("Entra",usd(q.entra),"plus"); add("Pagos",usd(q.pagos)); add("Al fondo",usd(q.fondo),"plus"); add("Diezmo",usd(q.entra*.1)); } else add("Monto","pendiente");
  $("payFine").textContent=(dow===0||dow===6)?"Cae en fin de semana: puede adelantarse al viernes.":(q&&q.nota?q.nota:"Según tu plan de quincenas.");
}
function upcomingPays(){
  const a=dOf(0), b=dOf(7);
  const fromPlan=((PLAN&&PLAN.pagos)||[]).filter(p=>p.date>=a&&p.date<=b).map(p=>({date:p.date,text:p.summary||p.text||p.nombre||"Pago"}));
  const fromNotes=NOTES.filter(x=>x.area==="pago"&&!x.done&&x.date<=b).map(x=>({date:x.date<a?a:x.date,text:x.text+(x.amount!=null?" · "+usd(x.amount):"")}));
  return fromPlan.concat(fromNotes).sort((x,y)=>x.date.localeCompare(y.date));
}
function renderPays(){
  const el=$("plist"); el.replaceChildren(); const p=upcomingPays();
  countUp($("sPay"),p.length);
  if(!p.length){ el.innerHTML='<li><span style="color:var(--muted)">Sin pagos esta semana.</span></li>'; return; }
  p.slice(0,5).forEach(e=>{ const d=new Date(e.date+"T00:00:00Z"); const li=document.createElement("li");
    li.innerHTML=`<span class="dd"><b>${d.getUTCDate()}</b><small>${MESES[d.getUTCMonth()].slice(0,3)}</small></span>`; const s=document.createElement("span"); s.textContent=e.text; li.append(s); el.append(li); });
}
function refreshSide(){
  const t=dOf(0), todayP=NOTES.filter(x=>x.date===t&&!x.done).length;
  countUp($("sToday"),todayP); renderPays();
  const pend=NOTES.filter(x=>!x.done).length;
  $("liveTxt").textContent=EN_LINEA===false?"Sin internet · usando la copia":(COLA.length?"Guardando…":(pend?`Al día · ${pend} pendiente${pend>1?"s":""}`:"Al día"));
  $("holiday").classList.toggle("off",EN_LINEA===false);
  [baseMood,baseLine]=moodNow();
}
function moodNow(){
  const t=dOf(0), tod=NOTES.filter(x=>x.date===t&&!x.done), late=NOTES.filter(x=>x.date<t&&!x.done);
  const payT=tod.filter(x=>x.area==="pago"), pays=upcomingPays().filter(p=>p.date>t);
  const dow=now.getUTCDay(), dom=now.getUTCDate(), last=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).getUTCDate();
  const payday=Math.min(15,last)===dom||Math.min(30,last)===dom, n=tod.length;
  const doneToday=NOTES.filter(x=>x.date===t&&x.done).length;
  if(!NOTES.length) return ["calm","Hola, Adela. Escríbeme abajo lo que tengas en mente y yo lo acomodo."];
  if(payday) return ["joy","¡Hoy es quincena! Cuando cobres, revisamos qué pagar y cuánto va al fondo."];
  if(payT.length) return ["focus",`Ojo, hoy toca: ${list3(payT)}. Guarda el comprobante.`];
  if(n>=5) return ["busy",`Uf, hoy tienes ${n} cosas. Vamos una por una.`];
  if(late.length) return ["focus",`Te quedó ${late.length===1?"una cosa":late.length+" cosas"} de antes. ¿La hacemos hoy?`];
  if(n===0&&doneToday) return ["love","Terminaste todo lo de hoy. ¡Bravo!"];
  if(pays.length) return ["focus",`Se acerca un pago: ${pays[0].text.charAt(0).toLowerCase()+pays[0].text.slice(1)}. Lo tengo en la mira.`];
  if(n===0) return (dow===0||dow===6)?["joy","Fin de semana libre. A descansar."]:["calm","Hoy no hay nada anotado. Buen día para avanzar en Kata o descansar un poco."];
  return ["happy",`Hoy tienes ${n} cosa${n>1?"s":""}. Lo tienes, Adela.`];
}

/* ---------- respaldo ---------- */
$("backup").onclick=async()=>{
  const data={app:"eva",version:2,exportado:new Date().toISOString(),notas:NOTES};
  const name=`eva-respaldo-${dOf(0)}.json`, blob=new Blob([JSON.stringify(data,null,1)],{type:"application/json"});
  try{ const f=new File([blob],name,{type:"application/json"}); if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:"Respaldo de Eva"}); say("Respaldo listo. Guárdalo en Archivos."); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  say("Respaldo descargado. Guárdalo en un lugar seguro.");
};
$("restore").onclick=()=>$("restoreFile").click();
$("restoreFile").onchange=async ev=>{
  const f=ev.target.files&&ev.target.files[0]; ev.target.value=""; if(!f) return;
  try{
    const j=JSON.parse(await f.text()), arr=Array.isArray(j)?j:j.notas; if(!Array.isArray(arr)) throw 0;
    const have=new Set(NOTES.map(x=>x.text+"|"+x.date));
    const nuevas=arr.filter(x=>x&&typeof x.text==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&!x.done&&!have.has(x.text+"|"+x.date));
    if(!nuevas.length){ say("Todo lo de ese respaldo ya está en tu libreta."); settleIn(3500); return; }
    if(!confirm(`Voy a agregar ${nuevas.length} pendiente${nuevas.length>1?"s":""} del respaldo que no están en tu lista. ¿Seguir?`)) return;
    for(const x of nuevas){ const area=AREAS.includes(x.area)?x.area:"personal", note={id:"tmp-"+uid(),text:x.text,area,date:x.date,time:x.time||null,amount:x.amount??null,done:false,created:Date.now()};
      NOTES.push(note); send({op:"add",tmp:note.id,args:{p_texto:x.text,p_area:AREA_DB[area],p_fecha:x.date,p_hora:x.time?x.time+":00":null,p_monto:x.amount??null}}); }
    VIEW={kind:"hoy"}; render(); refreshSide(); celebrate(`Listo, recuperé ${nuevas.length} pendiente${nuevas.length===1?"":"s"}.`);
  }catch(e){ setFace("sad"); say("Ese archivo no parece un respaldo de Eva."); settleIn(3500); }
};

/* ---------- arranque ---------- */
setFace("calm");
loadCopy(); render(); refreshSide(); renderQuincena(null); settle();
if(!LLAVE) askKey(false); else sync().then(()=>{ if(mood==="calm"||mood==="happy"||mood==="joy"||mood==="focus"||mood==="busy") settle(); });
fetch("plan.json?v="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).then(p=>{ PLAN=p; renderQuincena(p); refreshSide(); }).catch(()=>{});
addEventListener("online",()=>sync());
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState!=="visible") return; if(ymd(pty())!==TODAY){ location.reload(); return; } sync(); });

/* ---------- instalar / sin conexión ---------- */
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
