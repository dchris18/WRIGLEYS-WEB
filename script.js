
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// GUM SPIT V7 — DENSE, REGENERATING TOY CITY
const $=id=>document.getElementById(id), clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const scene=new THREE.Scene();scene.background=new THREE.Color('#91c3bf');scene.fog=new THREE.Fog('#91c3bf',115,245);
const camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.04,420);camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;$('game').prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff4d8,0x5c8d83,2.2));
const sun=new THREE.DirectionalLight(0xffe2b8,3);sun.position.set(-45,85,-30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:220});sun.shadow.bias=-.0002;sun.shadow.normalBias=.04;sun.shadow.radius=3;scene.add(sun);
const mat=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color,roughness});
const M={grass:mat('#95c977'),grass2:mat('#a8d67f'),road:mat('#777b80'),walk:mat('#dedbca'),curb:mat('#b7b9a9'),line:mat('#eee6d5'),cream:mat('#f4dfb9'),white:mat('#fff0d5'),sand:mat('#dcb18b'),peach:mat('#e9a77f'),coral:mat('#dc826b'),orange:mat('#d98c50'),red:mat('#c95f5b'),mint:mat('#a9cdb7'),teal:mat('#4d9c9a'),blue:mat('#6c99ae'),navy:mat('#405f73'),lavender:mat('#afa2bd'),brown:mat('#98725d'),dark:mat('#30454b'),glass:mat('#6ca8b2',.35),lit:mat('#f5d99e'),leaf:mat('#5c9b63'),leaf2:mat('#85b96d'),leaf3:mat('#397b60'),wood:mat('#8d7657'),metal:mat('#788c89'),skin:mat('#e9b18c'),gum:mat('#f3a0af'),black:mat('#344147')};
const walls=[M.cream,M.sand,M.peach,M.mint,M.blue,M.lavender,M.coral], roofs=[M.orange,M.navy,M.brown,M.red,M.teal], shirts=[M.coral,M.blue,M.orange,M.leaf,M.lavender,M.cream];
const world=new THREE.Group(),city=new THREE.Group(),balcony=new THREE.Group(),bin=new THREE.Group(),peopleGroup=new THREE.Group(),hands=new THREE.Group();scene.add(world,city,balcony,bin,peopleGroup,camera);camera.add(hands);
const geoCache=new Map();
function shape(w,h,d,r=.08){r=Math.min(r,w*.45,h*.45,d*.45);let k=[w,h,d,r].join(',');if(!geoCache.has(k))geoCache.set(k,new RoundedBoxGeometry(w,h,d,2,r));return geoCache.get(k)}
function box(parent,w,h,d,m,x=0,y=0,z=0,r=.08){let o=new THREE.Mesh(shape(w,h,d,r),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function cyl(parent,top,bottom,h,m,x=0,y=0,z=0,n=10){let o=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ball(parent,r,m,x=0,y=0,z=0,n=12){let o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
function textTexture(t,bg='#f6e9cf',fg='#30454b'){let c=document.createElement('canvas');c.width=512;c.height=128;let a=c.getContext('2d');a.fillStyle=bg;a.fillRect(0,0,512,128);a.fillStyle=fg;a.textAlign='center';a.textBaseline='middle';a.font='900 65px Arial';a.fillText(t,256,65,485);let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex}
const signCache=new Map();function sign(parent,t,w,x,y,z){if(!signCache.has(t))signCache.set(t,new THREE.MeshBasicMaterial({map:textTexture(t),side:THREE.DoubleSide}));let s=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),signCache.get(t));s.position.set(x,y,z);parent.add(s)}
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
let rand=Math.random;const pick=a=>a[Math.floor(rand()*a.length)];
function tree(x,z,size=1){let g=new THREE.Group();g.position.set(x,.37,z);g.scale.setScalar(size);city.add(g);cyl(g,.18,.24,2.1,M.wood,0,1.1);for(let i=0;i<3;i++){let crown=ball(g,1.25-i*.16,[M.leaf3,M.leaf,M.leaf2][i],(i-1)*.18,2.65+i*.65,0);crown.scale.set(1.1,1.1,.95)}}
function shrub(x,z){for(let i=0;i<3;i++)ball(city,.48,i%2?M.leaf:M.leaf2,x+(i-1)*.48,.65,z+(i%2)*.15)}
function planter(x,z){box(city,2.3,.65,1.15,M.cream,x,.65,z);for(let i=-1;i<=1;i++)ball(city,.43,M.leaf2,x+i*.6,1.15,z)}
function bench(x,z,rot=0){let g=new THREE.Group();g.position.set(x,.36,z);g.rotation.y=rot;city.add(g);box(g,2.3,.16,.68,M.wood,0,.65);box(g,2.3,.7,.13,M.wood,0,1.08,.31);for(let a of [-.8,.8])box(g,.12,.68,.12,M.metal,a,.3)}
function lamp(x,z){cyl(city,.09,.11,5.5,M.metal,x,3.1,z);box(city,1.35,.15,.35,M.metal,x+.55,5.85,z);box(city,.95,.05,.27,M.lit,x+.67,5.72,z)}
function building(x,z,w,d,h,kind){let g=new THREE.Group();g.position.set(x,.38,z);city.add(g);const wall=pick(walls),trim=pick(roofs);box(g,w,h,d,wall,0,h/2,0,.17);box(g,w+.5,.42,d+.5,trim,0,h+.17,0,.1);box(g,w+.15,.14,d+.15,M.cream,0,h-.4,0);
  // FRONT AND SIDE WINDOWS — retained on every level
  let floors=Math.max(1,Math.floor((h-2.5)/3.2));let cols=Math.max(2,Math.floor((w-2)/2.55));let sideCols=Math.max(2,Math.floor((d-2)/2.8));
  for(let f=0;f<floors;f++){let yy=3.3+f*3.2;if(yy>h-1.1)break;for(let j=0;j<cols;j++){let xx=-w/2+(j+.5)*w/cols;box(g,1.15,1.55,.13,(rand()<.15?M.lit:M.glass),xx,yy,-d/2-.09,.035);box(g,1.4,.13,.31,M.cream,xx,yy-.83,-d/2-.16);box(g,.07,1.53,.15,M.navy,xx,yy,-d/2-.17,.015)}for(let j=0;j<sideCols;j++){let zz=-d/2+(j+.5)*d/sideCols;for(let side of [-1,1]){box(g,.13,1.55,1.15,rand()<.12?M.lit:M.glass,side*(w/2+.09),yy,zz,.035);box(g,.3,.12,1.38,M.cream,side*(w/2+.18),yy-.83,zz)}}}
  if(kind==='shop'||kind==='cafe'){box(g,w-.8,2.35,.18,M.glass,0,1.35,-d/2-.13);box(g,1.45,2.3,.22,M.navy,0,1.25,-d/2-.25);box(g,w+.4,.18,2.2,M.cream,0,3.05,-d/2-1.1);let n=Math.max(5,Math.round(w/1.1));for(let i=0;i<n;i+=2)box(g,w/n,.2,2.23,trim,-w/2+(i+.5)*w/n,3.08,-d/2-1.1);box(g,w-.8,.75,.17,trim,0,4.1,-d/2-.17);sign(g,kind==='cafe'?'CAFE':pick(['MARKET','BAKERY','SHOP','DINER']),Math.min(w-1,7),0,4.1,-d/2-.28);if(kind==='cafe'){for(let a of [-w*.27,w*.27]){cyl(g,.62,.62,.09,M.cream,a,.9,-d/2-2.3);cyl(g,.06,.07,.82,M.metal,a,.5,-d/2-2.3)}}}
  else{box(g,1.7,2.5,.16,M.navy,0,1.25,-d/2-.16);box(g,2.3,.17,.5,M.cream,0,2.55,-d/2-.3);if(kind==='apartment'){for(let f=1;f<floors;f+=2){let yy=3.3+f*3.2;box(g,3,.13,1.0,M.cream,-w*.22,yy-.95,-d/2-.65);box(g,3,.08,.08,M.metal,-w*.22,yy+.05,-d/2-1.08);for(let a of [-1.2,0,1.2])cyl(g,.035,.035,.95,M.metal,-w*.22+a,yy-.45,-d/2-1.08)}}}
  if(h>10){box(g,2.5,.8,2.2,M.cream,w*.18,h+.72,d*.15);cyl(g,.55,.55,.7,M.metal,-w*.2,h+.75,d*.12)}return g}
function park(x,z,w,d,type){box(city,w,.35,d,M.grass2,x,.34,z);for(let i=0;i<5;i++){let xx=x-w/2+2+rand()*(w-4),zz=z-d/2+2+rand()*(d-4);if(type==='plaza'&&i<2)continue;tree(xx,zz,.7+rand()*.4)}if(type==='plaza'){box(city,6,1,6,M.cream,x,.85,z);box(city,4.7,.08,4.7,M.teal,x,1.4,z);cyl(city,.4,.65,1.5,M.white,x,2.1,z);ball(city,.5,M.blue,x,3,z)}else{bench(x,z);planter(x+3,z+2)}}
const cars=[];function car(x,z,m,dir=1){let g=new THREE.Group();g.position.set(x,.2,z);city.add(g);box(g,3.6,.85,1.9,m,0,.8,0,.36);box(g,2.05,.9,1.7,m,-.2,1.45,0,.28);box(g,1.3,.42,.08,M.glass,-.2,1.52,-.88);for(let xx of [-1.1,1.1])for(let zz of [-.93,.93]){let wheel=cyl(g,.38,.38,.2,M.black,xx,.42,zz,14);wheel.rotation.x=Math.PI/2}g.rotation.y=dir<0?Math.PI:0;cars.push({g,dir,speed:1.4+rand()*2})}
function createCity(level){city.clear();cars.length=0;peopleGroup.clear();pedestrians.length=0;rand=rng(2026+level*9173);
  box(city,320,.4,300,M.grass,0,-.3,-86);
  // Intersecting roads run across the entire scene.
  for(let z of [-34,-82,-130])box(city,300,.12,14,M.road,0,.02,z);
  for(let x of [-96,-48,0,48,96])box(city,13,.12,245,M.road,x,.025,-100);
  // A continuous near sidewalk keeps the target and pedestrians accessible.
  box(city,300,.28,14,M.walk,0,.15,-17);
  for(let x=-140;x<=140;x+=9){box(city,3,.02,.16,M.line,x,.1,-34);box(city,3,.02,.16,M.line,x,.1,-82)}
  for(let x of [-96,-48,0,48,96])for(let z of [-34,-82,-130])for(let i=-3;i<=3;i++)box(city,.8,.025,3,M.line,x+i*1.4,.11,z-4);
  // Dense grid of city blocks. No blank left/right borders.
  const xs=[-120,-72,-24,24,72,120],zs=[-58,-106,-154,-194];
  for(let row=0;row<zs.length;row++)for(let col=0;col<xs.length;col++){
    let x=xs[col],z=zs[row];box(city,32,.34,27,M.walk,x,.18,z);
    let parkChance=(row===0&&col===2)?0:.13;
    if(rand()<parkChance){park(x,z,28,23,rand()<.5?'plaza':'garden');continue}
    let count=rand()<.5?2:3;
    for(let k=0;k<count;k++){
      let w=count===2?12.5:8.3,px=x+(k-(count-1)/2)*(count===2?14:9.4);
      let h=7+Math.floor(rand()*4)*3.2+(level>3?Math.min(level-3,9)*.8:0);
      let kind=rand()<.27?'shop':rand()<.22?'cafe':rand()<.45?'apartment':'office';
      building(px,z+(rand()-.5)*2,w,16+rand()*2,h,kind);
    }
    if(rand()<.8){tree(x-14,z+10,.8);tree(x+14,z-10,.8)}
    if(rand()<.5)planter(x+rand()*12-6,z+12);
  }
  // Near street: dense but unobstructed view to the trash can.
  for(let x=-138;x<=138;x+=10){if(Math.abs(x)<9)continue;if(rand()<.74)tree(x,-11,.65+rand()*.25);else planter(x,-11)}
  for(let x of [-35,-20,20,35]){bench(x,-19);if(rand()<.6)lamp(x+4,-24)}
  for(let i=0;i<13;i++)car(-135+rand()*270,i%2?-30:-38,pick([M.red,M.blue,M.cream,M.orange,M.teal]),i%2?1:-1);
  for(let i=0;i<28;i++){let near=i<18;pedestrian(-110+rand()*220,near?(-13-rand()*8):(-47-rand()*6),rand()<.5?-1:1,.7+rand()*1.1,i)}
  rand=Math.random;
}
const pedestrians=[];
function pedestrian(x,z,dir,speed,i){let g=new THREE.Group();g.position.set(x,.4,z);peopleGroup.add(g);let shirt=shirts[i%shirts.length],skin=i%4===0?M.sand:M.skin;let torso=ball(g,.48,shirt,0,1.28);torso.scale.set(.95,1.12,.75);ball(g,.36,skin,0,2.03);let hair=ball(g,.36,i%3?M.brown:M.dark,0,2.27);hair.scale.y=.43;let arms=[],legs=[];for(let s of [-1,1]){let a=new THREE.Group();a.position.set(s*.47,1.55,0);g.add(a);box(a,.24,.65,.25,shirt,0,-.33,0,.12);ball(a,.13,skin,0,-.7);arms.push(a);let l=new THREE.Group();l.position.set(s*.2,.88,0);g.add(l);box(l,.27,.7,.3,M.navy,0,-.35);box(l,.35,.17,.47,M.black,0,-.72,-.08);legs.push(l)}g.rotation.y=dir>0?-Math.PI/2:Math.PI/2;let scale=.85+rand()*.25;g.scale.setScalar(scale);pedestrians.push({g,dir,speed,arms,legs,phase:rand()*6.28,reaction:0,scale})}
function updatePeople(dt){for(let p of pedestrians){p.phase+=dt*p.speed*5;if(p.reaction>0){p.reaction=Math.max(0,p.reaction-dt);let k=Math.sin((1-p.reaction/.8)*Math.PI);p.arms[0].rotation.z=-k*2;p.arms[1].rotation.z=k*2;p.g.position.y=.4+k*.2;continue}p.arms.forEach(a=>a.rotation.z=0);p.g.position.x+=p.dir*p.speed*dt;if(p.g.position.x>140)p.g.position.x=-140;if(p.g.position.x< -140)p.g.position.x=140;let s=Math.sin(p.phase);p.legs[0].rotation.x=s*.5;p.legs[1].rotation.x=-s*.5;p.arms[0].rotation.x=-s*.4;p.arms[1].rotation.x=s*.4;p.g.position.y=.4+Math.abs(s)*.04}}
function updateCars(dt){for(let c of cars){c.g.position.x+=c.dir*c.speed*dt;if(c.g.position.x>140)c.g.position.x=-140;if(c.g.position.x< -140)c.g.position.x=140}}

// PLAYER, BALCONY, BIN
let floor=1,score=0,shots=3,power=60,wind=0,height=12,state='idle',intro=0,yaw=0,pitch=-.16,locked=false,projectile=null,flight=0,wait=0,popupTime=0;
const target=new THREE.Vector3(),velocity=new THREE.Vector3(),previous=new THREE.Vector3(),START=1.35,EDGE=-4.66;
let pack,flap,stick,rightHand,chew;
function makeBalcony(){balcony.clear();let ground=height-1.65;box(balcony,28,100,10,M.peach,0,ground-14,9.4);box(balcony,8.6,.32,6.3,M.walk,0,ground-.2,-1.05);box(balcony,8.8,.15,.3,M.cream,0,ground-.08,-4.12);for(let y of [.42,1.08])box(balcony,8.5,.12,.13,M.metal,0,ground+y,-4.02);for(let x=-4.1;x<=4.1;x+=.65)cyl(balcony,.055,.055,1.1,M.metal,x,ground+.56,-4.02);for(let s of [-1,1]){box(balcony,.13,.13,6.3,M.metal,s*4.25,ground+1.08,-1.05);for(let z=-3.9;z<2;z+=.7)cyl(balcony,.05,.05,1.1,M.metal,s*4.25,ground+.56,z)}box(balcony,3.5,4.5,.25,M.cream,0,ground+2.15,3.6);box(balcony,2.7,3.9,.08,M.glass,0,ground+2.1,3.4);cyl(balcony,.43,.35,.6,M.coral,3.1,ground+.3,.5);ball(balcony,.6,M.leaf2,3.1,ground+1,.5)}
function makeBin(){bin.clear();bin.position.copy(target);cyl(bin,.73,.56,1.35,M.teal,0,.675,0,24);cyl(bin,.6,.6,.035,M.dark,0,1.37,0,24);let ring=new THREE.Mesh(new THREE.TorusGeometry(.68,.07,10,32),M.cream);ring.rotation.x=Math.PI/2;ring.position.y=1.4;bin.add(ring);let glow=new THREE.Mesh(new THREE.TorusGeometry(.87,.035,8,32),new THREE.MeshBasicMaterial({color:0xffd886}));glow.rotation.x=Math.PI/2;glow.position.y=1.73;glow.name='glow';bin.add(glow);for(let i=0;i<12;i++){let a=i*Math.PI/6;box(bin,.045,.94,.045,M.leaf3,Math.cos(a)*.6,.7,Math.sin(a)*.6)}}
function makeHands(){hands.clear();for(let s of [-1,1]){let g=new THREE.Group();g.position.set(s*.42,-.48,-.64);hands.add(g);let arm=cyl(g,.12,.15,.42,M.blue,s*.03,-.27);arm.rotation.z=s*.25;let palm=ball(g,.16,M.skin);palm.scale.set(.9,1.2,.6);for(let i=0;i<4;i++)cyl(g,.035,.04,.17,M.skin,(i-1.5)*.075,.14,-.04);if(s===1)rightHand=g}pack=new THREE.Group();pack.position.set(-.03,-.3,-.76);hands.add(pack);box(pack,.74,.36,.16,M.cream);for(let y of [-.14,.14])box(pack,.75,.07,.17,M.leaf,y*0, y,0);flap=new THREE.Group();flap.position.y=.18;pack.add(flap);box(flap,.74,.18,.035,M.cream,0,.09);stick=new THREE.Group();stick.position.set(.1,.02,-.18);pack.add(stick);box(stick,.115,.28,.05,M.white);chew=ball(hands,.08,M.gum,0,-.1,-.48);chew.visible=false}
function hud(){ $('floor').textContent=floor;$('score').textContent=score;$('wind').textContent=(wind>=0?'+':'')+wind.toFixed(1);$('powerText').textContent=power+'%';$('powerFill').style.width=power+'%';$('shots').innerHTML='<div>GUM LEFT</div><div class="pieces">'+Array.from({length:3},(_,i)=>`<div class="piece ${i>=shots?'used':''}"></div>`).join('')+'</div>'}
function message(s){$('message').textContent=s}function angles(){camera.rotation.y=yaw;camera.rotation.x=pitch}function aimAngles(){let d=target.clone().add(new THREE.Vector3(0,1.38,0)).sub(camera.position).normalize();return{yaw:Math.atan2(-d.x,-d.z),pitch:Math.asin(d.y)}}
function removeGum(){if(projectile){scene.remove(projectile);projectile.geometry.dispose();projectile=null}}
function resetLevel(){height=12+(floor-1)*6;shots=3;power=60;wind=(Math.random()-.5)*Math.min(.5*floor,3);target.set((Math.random()-.5)*3,.34,-12-Math.random()*1.8);createCity(floor);makeBalcony();makeBin();makeHands();hands.visible=true;removeGum();camera.position.set(0,height,START);yaw=0;pitch=-.16;angles();intro=0;state='intro';$('crosshair').classList.add('hidden');$('powerHud').classList.add('hidden');message('UNWRAPPING THE GUM...');hud()}
$('startButton').addEventListener('click',()=>{if(state!=='idle')return;$('startScreen').classList.add('hidden');$('hud').classList.remove('hidden');resetLevel()});
function updateIntro(dt){if(state!=='intro')return;intro+=dt;let t=intro;if(t<.8){flap.rotation.x=-2.4*ease(t/.7);pack.rotation.z=Math.sin(t*8)*.05}else if(t<1.4){message('ONE FRESH STICK...');let p=ease((t-.8)/.6);stick.position.set(.1+p*.18,.02+p*.37,-.18+p*.16);rightHand.position.y=-.48+p*.24}else if(t<2){message('CHOMP CHOMP...');let p=ease((t-1.4)/.6);pack.position.y=-.3-p*.6;chew.visible=true;chew.scale.setScalar(1+Math.sin(t*26)*.12)}else if(t<3.5){message('TO THE BALCONY...');hands.visible=false;let p=ease((t-2)/1.5);camera.position.z=lerp(START,EDGE,p);camera.position.y=height+Math.sin((t-2)*17)*.03*(1-p);pitch=lerp(-.16,-.48,p);angles()}else if(t<4){message('THERE IT IS...');camera.position.set(0,height,EDGE);let a=aimAngles(),p=ease((t-3.5)/.5);yaw=lerp(0,a.yaw,p);pitch=lerp(-.48,a.pitch,p);angles()}else{camera.position.set(0,height,EDGE);let a=aimAngles();yaw=a.yaw;pitch=a.pitch;angles();state='aiming';$('crosshair').classList.remove('hidden');$('powerHud').classList.remove('hidden');message('MOUSE TO AIM · CLICK TO SPIT')}}
function lockMouse(){let p=renderer.domElement.requestPointerLock?.();p?.catch?.(()=>{})}document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;if(state==='aiming'&&!locked)message('CLICK TO AIM · THEN CLICK TO SPIT')});
document.addEventListener('mousemove',e=>{if(!locked||state!=='aiming')return;yaw=clamp(yaw-e.movementX*.0022,-1.35,1.35);pitch=clamp(pitch-e.movementY*.0022,-1.54,.35);angles()});
document.addEventListener('wheel',e=>{if(state!=='aiming')return;power=clamp(power+(e.deltaY>0?-3:3),10,100);hud()},{passive:true});
document.addEventListener('keydown',e=>{if(state!=='aiming')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space')spit();if(e.code==='KeyW')power=Math.min(100,power+3);if(e.code==='KeyS')power=Math.max(10,power-3);if(e.code==='ArrowLeft')yaw+=.035;if(e.code==='ArrowRight')yaw-=.035;if(e.code==='ArrowUp')pitch+=.035;if(e.code==='ArrowDown')pitch-=.035;pitch=clamp(pitch,-1.54,.35);angles();hud()});
renderer.domElement.addEventListener('mousedown',e=>{if(e.button!==0||state!=='aiming')return;if(!locked){lockMouse();message('MOUSE TO AIM · CLICK TO SPIT')}else spit()});
function spit(){if(state!=='aiming'||shots<=0)return;shots--;hud();state='flying';flight=0;let d=new THREE.Vector3();camera.getWorldDirection(d);velocity.copy(d).multiplyScalar(5+power*.24);projectile=new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),M.gum);projectile.scale.set(1.2,.65,.95);projectile.position.copy(camera.position).addScaledVector(d,.75);projectile.position.y-=.12;projectile.castShadow=true;scene.add(projectile);message('BON VOYAGE, GUM!')}
function segmentHit(a,b,c,r){let v=b.clone().sub(a),len=v.lengthSq();let t=len<1e-8?0:clamp(c.clone().sub(a).dot(v)/len,0,1);return a.clone().addScaledVector(v,t).distanceTo(c)<r}
function popup(s){$('popup').textContent=s;$('popup').classList.add('show');popupTime=1.2}
function complete(hit){if(state!=='flying')return;if(hit){score+=floor*100;hud();popup('+'+floor*100);result(true);return}state='between';wait=.6;message(shots?'SHOT MISSED · '+shots+' LEFT':'OUT OF GUM!')}
function updateFlight(dt){if(state!=='flying'||!projectile)return;flight+=dt;previous.copy(projectile.position);velocity.y-=9.81*dt;velocity.x+=wind*dt;projectile.position.addScaledVector(velocity,dt);projectile.rotation.x+=dt*6;projectile.rotation.z+=dt*4;let opening=target.y+1.38;if(previous.y>opening&&projectile.position.y<=opening&&velocity.y<0){let t=(previous.y-opening)/(previous.y-projectile.position.y),x=lerp(previous.x,projectile.position.x,t),z=lerp(previous.z,projectile.position.z,t);if(Math.hypot(x-target.x,z-target.z)<.55){complete(true);return}}for(let p of pedestrians){let center=p.g.localToWorld(new THREE.Vector3(0,1.3,0));if(segmentHit(previous,projectile.position,center,.7*p.scale)){p.reaction=.8;score=Math.max(0,score-50);hud();popup('-50 PEDESTRIAN!');complete(false);message('WATCH WHERE YOU SPIT!');return}}if(projectile.position.y<=.34||flight>12)complete(false)}
function updateBetween(dt){if(state!=='between')return;wait-=dt;if(wait>0)return;removeGum();if(shots<=0){result(false);return}state='aiming';message(shots+' SHOT'+(shots===1?'':'S')+' LEFT · KEEP GOING!')}
function result(hit){state=hit?'success':'out';if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();$('resultEyebrow').textContent=hit?'ABSOLUTE LEGEND':'ALL OUT OF GUM';$('resultTitle').textContent=hit?'DIRECT HIT!':'TRY AGAIN!';$('resultDescription').textContent=hit?`+${floor*100} points! You made it in ${3-shots} shot${3-shots===1?'':'s'}.`:'Three shots used. Try this floor again!';$('resultButton').textContent=hit?'NEXT FLOOR':'RETRY FLOOR';$('resultScreen').classList.remove('hidden')}
$('resultButton').addEventListener('click',()=>{$('resultScreen').classList.add('hidden');if(state==='success')floor++;resetLevel()});
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.033);updateIntro(dt);updateFlight(dt);updateBetween(dt);updatePeople(dt);updateCars(dt);if(popupTime>0){popupTime-=dt;if(popupTime<=0)$('popup').classList.remove('show')}let glow=bin.getObjectByName('glow');if(glow)glow.position.y=1.73+Math.sin(clock.elapsedTime*2)*.08;renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
createCity(1);target.set(0,.34,-13);camera.position.set(0,12,START);makeBalcony();makeBin();makeHands();hands.visible=false;angles();hud();animate();
