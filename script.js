const mediaDir='assets/media/';
const scanner=document.getElementById('scanner'), gift=document.getElementById('gift'), detector=document.getElementById('xrayDetector');
const openButton=document.getElementById('openButton'), scanState=document.getElementById('scanState'), scanHint=document.getElementById('scanHint'), sideStatus=document.getElementById('sideStatus'), finding=document.getElementById('finding');
const scannerScreen=document.getElementById('scannerScreen'), memoryScreen=document.getElementById('memoryScreen'), burst=document.getElementById('burst'), envelopeScene=document.getElementById('envelopeScene'), envelope=document.getElementById('envelope'), letterModal=document.getElementById('letterModal'), closeLetter=document.getElementById('closeLetter'), musicButton=document.getElementById('musicButton'), music=document.getElementById('music'), cycleStatus=document.getElementById('cycleStatus');
let scanReady=false,opened=false,dragging=false,offsetX=0,offsetY=0,overGift=false;
const photos=['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg','14.jpg','15.jpg','16.jpg','17.jpg','18.jpg','19.jpg','20.jpg','21.jpg','22.jpg','23.jpg','24.jpg','25.JPEG','26.jpg','27.jpg','28.jpg','29.jpg','30.jpg','31.jpg','32.jpg','33.jpg','33.JPEG','34.jpg','35.jpg','36.jpg','37.jpg','38.jpg','39.jpg','40.jpg','41.jpg'];
const videos=['1.mp4','2.MOV','3.mp4','4.mp4','5.mp4','6.m4v','6.mp4'];
function detectorOverlapsGift(){const d=detector.getBoundingClientRect(),g=gift.getBoundingClientRect();const cx=d.left+d.width/2,cy=d.top+d.height/2;return cx>g.left+g.width*.1&&cx<g.right-g.width*.1&&cy>g.top+g.height*.05&&cy<g.bottom-g.height*.05}
function updateXray(){const hit=detectorOverlapsGift();if(hit&&!overGift){overGift=true;scanner.classList.add('xray-active');scanReady=true;scanState.textContent='XRAY IMAGE ACQUIRED';sideStatus.textContent='DETECTED';finding.textContent='HEART / SURPRISE';scanHint.textContent='The gift has been radiographed. Surprise found.';openButton.disabled=false;}else if(!hit&&overGift){overGift=false;scanner.classList.remove('xray-active');scanReady=false;scanState.textContent='MOVE DETECTOR';sideStatus.textContent='SEARCHING';finding.textContent='UNKNOWN';scanHint.textContent='Drag the detector across the gift to scan it.';openButton.disabled=true;}}
function startDrag(e){if(opened)return;dragging=true;detector.classList.add('dragging');const r=detector.getBoundingClientRect();offsetX=e.clientX-r.left;offsetY=e.clientY-r.top;detector.setPointerCapture?.(e.pointerId)}
function moveDrag(e){if(!dragging)return;const sr=scanner.getBoundingClientRect();const r=detector.getBoundingClientRect();let x=e.clientX-sr.left-offsetX,y=e.clientY-sr.top-offsetY;x=Math.max(-r.width*.2,Math.min(sr.width-r.width*.8,x));y=Math.max(0,Math.min(sr.height-r.height*.45,y));detector.style.left=x+'px';detector.style.top=y+'px';detector.style.transform='rotate(-12deg)';updateXray()}
function endDrag(e){dragging=false;detector.classList.remove('dragging');try{detector.releasePointerCapture?.(e.pointerId)}catch{} }
detector.addEventListener('pointerdown',startDrag);detector.addEventListener('pointermove',moveDrag);detector.addEventListener('pointerup',endDrag);detector.addEventListener('pointercancel',endDrag);

function buildItems(){
  const items=[];
  photos.forEach(src=>items.push({type:'photo',src}));
  videos.forEach(src=>items.push({type:'video',src}));
  return items;
}

const colPattern=['','', 'col-2','','','feature','','col-2','',''];
const rotations=[-3,2,-2,3,-1,1.5,2.5,-1.5,3,-2.5,1,-3,2,-1,2.5,-2,1.5,-1,3,-2];
const ROW_UNIT=6;
function currentGap(){const g=parseFloat(getComputedStyle(burst).rowGap);return Number.isFinite(g)?g:18;}
function naturalRatio(media){
  if(media.tagName==='IMG' && media.naturalWidth && media.naturalHeight) return media.naturalWidth/media.naturalHeight;
  if(media.tagName==='VIDEO' && media.videoWidth && media.videoHeight) return media.videoWidth/media.videoHeight;
  return 4/3;
}
function waitForMedia(media){
  return new Promise(resolve=>{
    if(media.tagName==='IMG'){
      if(media.complete && media.naturalWidth) return resolve();
      media.addEventListener('load',resolve,{once:true});
      media.addEventListener('error',resolve,{once:true});
    }else{
      if(media.readyState>=1 && media.videoWidth) return resolve();
      media.addEventListener('loadedmetadata',resolve,{once:true});
      media.addEventListener('error',resolve,{once:true});
    }
  });
}

async function prepareFlow(items){
  burst.classList.add('preparing');
  burst.innerHTML='';
  const cards=[];
  items.forEach((item,i)=>{
    const tile=document.createElement('article');
    const cls=colPattern[i%colPattern.length];
    tile.className='memory-card '+(cls?cls:'')+(item.type==='video'?' video-card':'');
    tile.style.setProperty('--rot',`${rotations[i%rotations.length]}deg`);
    const wrap=document.createElement('div');
    wrap.className='media-wrap';
    const media=item.type==='video'?document.createElement('video'):document.createElement('img');
    media.src=mediaDir+item.src;
    if(item.type==='video'){
      media.muted=true;media.loop=true;media.playsInline=true;media.preload='metadata';
    }else media.alt='Tani birthday memory';
    const label=document.createElement('span');label.className='media-tag';label.textContent=item.type==='video'?'MOVING MEMORY':'MEMORY';
    wrap.appendChild(media); tile.append(wrap,label); burst.appendChild(tile); cards.push({tile,media,item});
  });

  await Promise.all(cards.map(c=>waitForMedia(c.media)));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

  // Build a Kweni-inspired masonry formation using the REAL media dimensions.
  // Every target height is calculated from the original aspect ratio, so the media
  // itself is never forced into a crop box.
  const vw=Math.min(window.innerWidth,1800);
  const pad=window.innerWidth>=900 ? Math.min(32,window.innerWidth*0.03) : 10;
  const available=Math.max(300,vw-pad*2);
  const cols=window.innerWidth>=1400?5:(window.innerWidth>=900?4:2);
  const gap=window.innerWidth>=1400?22:(window.innerWidth>=600?18:10);
  const colW=(available-gap*(cols-1))/cols;
  const heights=new Array(cols).fill(0);
  const targets=[];

  function spanFor(i){
    const desired=[1,1,2,1,1,2,1,2,1,1][i%10];
    return Math.min(desired,cols);
  }
  function ratioFor(c){
    if(c.media.tagName==='IMG' && c.media.naturalWidth && c.media.naturalHeight) return c.media.naturalWidth/c.media.naturalHeight;
    if(c.media.tagName==='VIDEO' && c.media.videoWidth && c.media.videoHeight) return c.media.videoWidth/c.media.videoHeight;
    return 4/3;
  }

  cards.forEach((c,i)=>{
    const span=spanFor(i);
    let bestCol=0,bestTop=Infinity;
    for(let col=0;col<=cols-span;col++){
      const top=Math.max(...heights.slice(col,col+span));
      if(top<bestTop){bestTop=top;bestCol=col;}
    }
    const width=colW*span+gap*(span-1);
    const ratio=ratioFor(c);
    const mediaH=width/ratio;
    const tileH=mediaH+32;
    const left=pad+bestCol*(colW+gap);
    const top=pad+bestTop;
    for(let k=bestCol;k<bestCol+span;k++) heights[k]=bestTop+tileH+gap;
    targets.push({left,top,width,height:tileH});
    c.tile.style.width=width+'px';
    c.tile.style.height=tileH+'px';
    c.media.style.width='100%';
    c.media.style.height='auto';
  });

  const contentHeight=Math.max(...targets.map(t=>t.top+t.height),520)+pad+110;
  burst.style.height=contentHeight+'px';
  burst.classList.remove('preparing');

  // Initial state: every memory starts together near the center, like dancers
  // leaving one formation. Then each travels to its assigned final spot.
  const centerX=burst.clientWidth/2;
  const centerY=150;
  cards.forEach((c,i)=>{
    const t=targets[i];
    c.tile.style.left=centerX+'px';
    c.tile.style.top=centerY+'px';
    c.tile.style.transform=`translate(-50%,-50%) scale(.16) rotate(${rotations[i%rotations.length]}deg)`;
    c.tile.style.opacity='0';
    c.tile.dataset.targetLeft=(t.left+t.width/2);
    c.tile.dataset.targetTop=(t.top+t.height/2);
  });
  // Force the browser to commit the starting positions before the formation begins.
  void burst.offsetHeight;
  return {cards,targets};
}

function smoothScrollTo(targetY, duration=900){
  const startY=window.scrollY;
  const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  const endY=Math.max(0,Math.min(maxY,targetY));
  const distance=endY-startY;
  if(Math.abs(distance)<4) return Promise.resolve();
  return new Promise(resolve=>{
    const t0=performance.now();
    function frame(now){
      const p=Math.min(1,(now-t0)/duration);
      const eased=1-Math.pow(1-p,3);
      window.scrollTo(0,startY+distance*eased);
      if(p<1) requestAnimationFrame(frame); else resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function followFormation(flow,pass=1){
  const {cards,targets}=flow;
  const burstTop=burst.getBoundingClientRect().top+window.scrollY;
  let elapsed=0;
  const jobs=[];
  cards.forEach((c,i)=>{
    const gap=650+Math.random()*500;
    elapsed+=gap;
    jobs.push(new Promise(resolve=>{
      setTimeout(async()=>{
        c.tile.classList.add('arriving');
        c.tile.style.opacity='1';
        c.tile.style.left=c.tile.dataset.targetLeft+'px';
        c.tile.style.top=c.tile.dataset.targetTop+'px';
        c.tile.style.transform=`translate(-50%,-50%) scale(1) rotate(${rotations[i%rotations.length]}deg)`;
        const pct=Math.round((i+1)/cards.length*100);
        cycleStatus.textContent=`MEMORY ACQUISITION // ${pct}%  •  PASS ${pass}`;
        if(c.media.tagName==='VIDEO') c.media.play().catch(()=>{});

        // The page follows the dancer as it reaches its assigned position.
        // This makes the scroll feel like it is moving with the formation.
        const targetPageY=burstTop+targets[i].top+targets[i].height/2-window.innerHeight*.48;
        await smoothScrollTo(targetPageY,900);
        resolve();
      },elapsed);
    }));
  });
  await Promise.all(jobs);
}

function startAutoFlow(){
  // Once the whole formation is complete, return to the top, then let the
  // finished memory wall flow downward automatically like a continuous gallery.
  smoothScrollTo(0,1400).then(()=>{
    cycleStatus.textContent='MEMORIES ACQUIRED // AUTO FLOW';
    setTimeout(()=>{
      envelopeScene.classList.add('show');
      requestAnimationFrame(()=>{
        const start=performance.now();
        const duration=Math.max(16000,(document.documentElement.scrollHeight-window.innerHeight)*9);
        function flow(now){
          const p=Math.min(1,(now-start)/duration);
          const eased=p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
          const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
          window.scrollTo(0,maxY*eased);
          if(p<1) requestAnimationFrame(flow);
          else cycleStatus.textContent='MEMORY ACQUISITION // COMPLETE';
        }
        requestAnimationFrame(flow);
      });
    },700);
  });
}

async function startMemories(){
  const items=buildItems();
  const flow=await prepareFlow(items);
  await followFormation(flow,1);
  cycleStatus.textContent='FIRST PASS COMPLETE // MEMORIES ACQUIRED';
  startAutoFlow();
}
function tryMusic(){
  if(!music.src) music.src='assets/birthday-song.mp3';
  music.volume=1;
  const p=music.play();
  if(p) p.then(()=>musicButton.textContent='♫').catch(()=>musicButton.textContent='♪');
}
function openSurprise(){if(!scanReady||opened)return;opened=true;scannerScreen.classList.add('fade-out');setTimeout(async()=>{scannerScreen.style.display='none';memoryScreen.classList.add('active');memoryScreen.setAttribute('aria-hidden','false');tryMusic();await startMemories()},700)}
gift.addEventListener('click',()=>{if(overGift)openSurprise()});openButton.addEventListener('click',openSurprise);
detector.addEventListener('keydown',e=>{if(e.key==='Enter'&&overGift)openSurprise()});
envelope.addEventListener('click',()=>{envelope.classList.add('open');setTimeout(()=>{letterModal.classList.add('show');letterModal.setAttribute('aria-hidden','false')},550)});
closeLetter.addEventListener('click',()=>{letterModal.classList.remove('show');letterModal.setAttribute('aria-hidden','true')});letterModal.addEventListener('click',e=>{if(e.target===letterModal)closeLetter.click()});
musicButton.addEventListener('click',()=>{if(music.paused)music.play().then(()=>musicButton.textContent='♫');else{music.pause();musicButton.textContent='♪'}});
