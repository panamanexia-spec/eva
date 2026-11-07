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
function celebrate(line){ setFace("love"); hearts(); if(line) say(line); setTimeout(settle,2800); }
const TAPS=["¡Jiji! Me haces cosquillas.","Aquí estoy, Adela. Dime qué tienes en mente.","Un pendiente a la vez. Tú puedes.","¿Ya tomaste agua hoy?","Abrazo peludo para ti, Killian y Amelie."];
$("pet").addEventListener("click",()=>{
  petbox.classList.remove("giggle"); void petbox.offsetWidth; petbox.classList.add("giggle"); FUR.poke=1;
  if(mood==="thinking"||mood==="talking") return;
  setFace("joy"); hearts(3); say(TAPS[Math.floor(Math.random()*TAPS.length)]);
  clearTimeout(window.__tap); window.__tap=setTimeout(settle,2600);
});
function clean(t){ return (t||"").replace(/^\s*[^·]+·\s*/,""); }
function isPago(e){ return /^\s*pago\s*·/i.test(e.summary||"")||/\bpag(ar|o)\b/i.test(e.summary||""); }
function moodFromAgenda(todayEvs,nextEvs,holidayToday){
  const payToday=todayEvs.filter(isPago), paySoon=nextEvs.filter(isPago);
  const dow=now.getUTCDay(), n=todayEvs.length, dom=now.getUTCDate();
  const last=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).getUTCDate();
  const payday=Math.min(15,last)===dom||Math.min(30,last)===dom;
  const nearPay=[15,Math.min(30,last)].some(d=>d-dom>0&&d-dom<=2);
  if(payday) return ["joy","¡Hoy es quincena! Cuando cobres, revisamos juntas qué pagar y cuánto va al fondo."];
  if(n>=4) return ["busy",`Uf, hoy tienes ${n} cosas. Vamos una por una; si quieres, te digo qué mover.`];
  if(payToday.length) return ["focus",`Ojo, hoy toca: ${payToday.map(e=>clean(e.summary)).join(", ")}. Guarda el comprobante.`];
  if(holidayToday) return ["joy",`¡Hoy es feriado! ${n?`Tienes ${n} cosa${n>1?"s":""} en la lista, nada más.`:"Disfruta con Killian y Amelie."}`];
  if(paySoon.length) return ["focus",`Se acerca un pago: ${clean(paySoon[0].summary)}. Lo tengo en la mira.`];
  if(nearPay) return ["happy","La quincena está cerca. Ya casi."];
  if(dow===0||dow===6) return ["joy",n?`Fin de semana con ${n} cosa${n>1?"s":""} en la lista. Sin prisa.`:"Fin de semana libre. A descansar."];
  if(n===0) return ["calm","Hoy no hay nada agendado. Buen día para avanzar en KAM o descansar un poco."];
  return ["happy",`Hoy tienes ${n} cosa${n>1?"s":""}. Lo tienes, Adela.`];
}
setFace("thinking");

/* ---------- datos (se actualizan solos cada mañana) ---------- */
let ALL=[], PAGOS=[], busy=false;
const usd=v=>"$"+Number(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
function tagOf(title){ const m=/^\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s*·/.exec(title||""); if(!m) return null; const k=m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); return TAGS[k]?{key:k,label:m[1]}:null; }
function colorOf(e){ const t=tagOf(e.summary); return t?`var(${TAGS[t.key]})`:(isPago(e)?"var(--t-pago)":"var(--accent)"); }
const evDay=e=>e.date||"";
async function getJSON(name){
  const r=await fetch(name+"?v="+Date.now(),{cache:"no-store"});
  if(!r.ok) throw new Error(name+" "+r.status);
  return r.json();
}

/* ---------- quincena ---------- */
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

/* ---------- agenda del día ---------- */
const selDay=TODAY;
function renderDay(){
  const el=$("tl"); el.replaceChildren();
  const d=new Date(selDay+"T00:00:00Z");
  const hol=ALL.filter(e=>evDay(e)===selDay&&e.feriado);
  $("dayTitle").textContent="Hoy · "+d.getUTCDate()+" "+MESES[d.getUTCMonth()].slice(0,3)+(hol.length?" · feriado":"");
  const list=ALL.filter(e=>evDay(e)===selDay&&!e.feriado);
  $("dayCount").textContent=list.length?`${list.length} ${list.length>1?"cosas":"cosa"}`:"";
  if(!list.length){ el.innerHTML=`<div class="empty glass pop"><b>Día libre</b></div>`; el.firstChild.append(hol.length?hol[0].summary:"Nada agendado para hoy."); return; }
  const all=list.filter(e=>!e.time), timed=list.filter(e=>e.time).sort((a,b)=>a.time.localeCompare(b.time));
  if(all.length){ const w=document.createElement("div"); w.className="allday";
    all.forEach((e,i)=>{ const p=document.createElement("div"); p.className="pill glass pop"; p.style.setProperty("--i",i); const dt=document.createElement("i"); dt.className="dot"; dt.style.setProperty("--c",colorOf(e)); const s=document.createElement("span"); s.textContent=clean(e.summary)||"(sin título)"; p.append(dt,s); w.append(p); });
    el.append(w); }
  const nowHM=hhmm24(now); let placed=false, i=0;
  const nowRow=()=>{ const r=document.createElement("div"); r.className="now"; r.innerHTML=`<span class="t">Ahora</span><span class="rail"><span class="pulse"></span></span><span class="ln"></span>`; return r; };
  timed.forEach(e=>{
    if(!placed && e.time>nowHM){ el.append(nowRow()); placed=true; }
    const end=e.end||e.time;
    const row=document.createElement("div"); row.className="item pop"+(end<nowHM?" past":""); row.style.setProperty("--i",i++);
    const t=document.createElement("span"); t.className="t"; t.textContent=short12(e.time);
    const rail=document.createElement("span"); rail.className="rail"; const dt=document.createElement("i"); dt.className="dot"; dt.style.setProperty("--c",colorOf(e)); rail.append(dt);
    const c=document.createElement("div"); c.className="card glass"; c.style.setProperty("--c",colorOf(e));
    const bar=document.createElement("span"); bar.className="bar"; const tx=document.createElement("div"); tx.className="tx";
    const tg=tagOf(e.summary); if(tg){ const s=document.createElement("span"); s.className="tag"; s.textContent=tg.label; tx.append(s); }
    const ti=document.createElement("span"); ti.className="ttl"; ti.textContent=clean(e.summary)||"(sin título)"; tx.append(ti);
    c.append(bar,tx); row.append(t,rail,c); el.append(row);
  });
  if(!placed && timed.length) el.append(nowRow());
}
function hhmm24(p){ return String(p.getUTCHours()).padStart(2,"0")+":"+String(p.getUTCMinutes()).padStart(2,"0"); }
function short12(hm){ let [h,mi]=hm.split(":").map(Number); const ap=h<12?"a":"p"; h=h%12||12; return `${h}:${String(mi).padStart(2,"0")}${ap}`; }

function renderPays(){
  const el=$("plist"); el.replaceChildren();
  const end=ymd(addDays(now,7));
  const p=PAGOS.filter(e=>e.date>=TODAY&&e.date<=end);
  countUp($("sPay"),p.length);
  if(!p.length){ el.innerHTML='<li><span style="color:var(--muted)">Sin pagos esta semana.</span></li>'; return; }
  p.slice(0,4).forEach(e=>{ const d=new Date(e.date+"T00:00:00Z"); const li=document.createElement("li");
    li.innerHTML=`<span class="dd"><b>${d.getUTCDate()}</b><small>${MESES[d.getUTCMonth()].slice(0,3)}</small></span>`; const s=document.createElement("span"); s.textContent=clean(e.summary)||e.summary; li.append(s); el.append(li); });
}

async function load(){
  const note=$("calNotice"), btn=$("refresh"); btn.classList.add("spin");
  try{
    const [ag,plan]=await Promise.all([getJSON("agenda.json"),getJSON("plan.json")]);
    ALL=(ag.eventos||[]).slice().sort((a,b)=>(a.date+(a.time||"")).localeCompare(b.date+(b.time||"")));
    PAGOS=(plan.pagos||[]);
    const gen=(ag.generado||"").slice(0,10), stale=gen&&gen<TODAY;
    note.hidden=!stale; if(stale) note.textContent="Esta agenda es del "+nice(new Date(gen+"T00:00:00Z"))+". Se actualiza sola cada mañana.";
    const hol=ALL.filter(e=>evDay(e)===TODAY&&e.feriado);
    $("liveTxt").textContent=hol.length?"Feriado · "+hol[0].summary:(stale?"Agenda desactualizada":"Agenda al día");
    const real=ALL.filter(e=>!e.feriado), tEv=real.filter(e=>evDay(e)===TODAY), END3=ymd(addDays(now,3)), nextEvs=real.filter(e=>{ const d=evDay(e); return d>TODAY&&d<=END3; });
    renderDay(); renderPays(); renderQuincena(plan); countUp($("sToday"),tEv.length);
    [baseMood,baseLine]=moodFromAgenda(tEv,nextEvs,hol.length>0); settle();
  }catch(e){
    note.hidden=false; note.textContent="No pude cargar la agenda. Revisa tu conexión y toca actualizar.";
    $("tl").innerHTML='<div class="empty glass"><b>No se pudo cargar</b>Toca actualizar arriba.</div>';
    baseMood="sad"; baseLine="No pude ver tu agenda ahora. Toca actualizar en un momento."; settle();
  }finally{ btn.classList.remove("spin"); }
}
$("refresh").onclick=load;
setInterval(()=>{ if(ALL.length) renderDay(); },60000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState!=="visible") return; if(ymd(pty())!==TODAY){ location.reload(); return; } load(); });
load();

/* ---------- instalar / sin conexión ---------- */
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
