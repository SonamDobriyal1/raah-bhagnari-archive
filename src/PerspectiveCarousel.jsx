import React,{useCallback,useEffect,useRef,useState} from 'react';
import {animate,useMotionValue,useMotionValueEvent,useTransform} from 'framer-motion';
import {Icon,Link} from './components.jsx';

const springMass=0.95;

function imageAt(images,virtual){
 const count=images.length;
 return images[((virtual%count)+count)%count];
}

function outwardRotation(offset,rotation,outerRotation){
 const sign=Math.sign(offset);
 if(!sign)return 0;
 const distance=Math.abs(offset);
 const near=Math.min(distance,1)*rotation;
 const far=Math.max(0,Math.min(distance,2)-1)*(outerRotation-rotation);
 const past=Math.max(0,distance-2)*6;
 return -sign*(near+far+past);
}

function coverAmount(offset){
 return Math.pow(Math.min(Math.abs(offset),2)/2,0.72);
}

function coverScale(offset,centerScale,edgeScale){
 return centerScale+(edgeScale-centerScale)*coverAmount(offset);
}

function layoutFor(width,{spacing,perspective,centerScale,edgeScale}){
 const narrow=width<700;
 const tablet=width<1100;
 const cardWidth=narrow?Math.round(Math.min(112,Math.max(88,width*0.24))):tablet?Math.round(Math.min(230,width*0.22)):270;
 const centerHeight=Math.round(cardWidth*(narrow?1.42:1.36));
 const edgeHeight=Math.round(centerHeight*1.12);
 const radius=narrow?20:32;
 const half=width/2;
 const clipSpacing=Math.round((half-cardWidth*0.1)/2);
 const minSpacing=Math.round(cardWidth*(centerScale/2+0.5)+(narrow?8:28));
 const maxSpacing=Math.round((half+cardWidth*0.08)/2);
 const resolvedSpacing=spacing??Math.min(maxSpacing,Math.max(minSpacing,clipSpacing));
 return {
  cardWidth,
  centerHeight,
  edgeHeight,
  radius,
  spacing:resolvedSpacing,
  stageHeight:Math.ceil(edgeHeight*edgeScale*1.24+16),
  perspective:perspective??(narrow?640:tablet?820:760),
  depth:narrow?6:12
 };
}

function cardTransform(pose){
 return `translateX(${pose.x}px) translateY(-50%) translateZ(${pose.z}px) scale(${pose.scale}) rotateY(${pose.rotateY}deg)`;
}

function CarouselCard({virtual,progress,image,metrics,rotation,outerRotation,centerScale,edgeScale,page}){
 const nodeRef=useRef(null);
 const captionRef=useRef(null);
 const readRef=useRef(()=>({}));
 const offset=useTransform(progress,value=>virtual-value);
 const x=useTransform(offset,value=>value*metrics.spacing);
 const rotateY=useTransform(offset,value=>outwardRotation(value,rotation,outerRotation));
 const scale=useTransform(offset,value=>coverScale(value,centerScale,edgeScale));
 const z=useTransform(offset,value=>Math.min(Math.abs(value),2.2)*metrics.depth);
 const height=useTransform(offset,value=>metrics.centerHeight+(metrics.edgeHeight-metrics.centerHeight)*coverAmount(value));
 const zIndex=useTransform(offset,value=>Math.round(40-Math.abs(value)*10));
 const labelOpacity=useTransform(offset,value=>{const distance=Math.abs(value);return distance<0.35?1:distance<0.75?1-(distance-0.35)/0.4:0});
 readRef.current=()=>({x:x.get(),z:z.get(),rotateY:rotateY.get(),scale:scale.get(),height:height.get(),zIndex:zIndex.get(),opacity:labelOpacity.get()});
 const pose=readRef.current();
 const distance=Math.abs(virtual-page);
 const hidden=distance>2;
 useEffect(()=>{
  const paint=()=>{
   const node=nodeRef.current;
   if(!node)return;
   const next=readRef.current();
   node.style.height=next.height+'px';
   node.style.zIndex=String(next.zIndex);
   node.style.transform=cardTransform(next);
   if(captionRef.current)captionRef.current.style.opacity=String(next.opacity);
  };
  paint();
  const stops=[x,z,rotateY,scale,height,zIndex,labelOpacity].map(value=>value.on('change',paint));
  return ()=>stops.forEach(stop=>stop());
 },[x,z,rotateY,scale,height,zIndex,labelOpacity]);
 return <div ref={nodeRef} className="perspective-card" style={{width:metrics.cardWidth,height:pose.height,zIndex:pose.zIndex,marginLeft:-metrics.cardWidth/2,transform:cardTransform(pose)}} aria-hidden={hidden?true:undefined}>
  <Link to={image.href} className="perspective-card-frame" style={{borderRadius:metrics.radius}} tabIndex={hidden?-1:0} aria-label={image.alt}><img src={image.src} alt="" draggable="false"/>{image.label&&<span ref={captionRef} className="perspective-caption" style={{opacity:pose.opacity}}>{image.label}</span>}</Link>
 </div>;
}

export function PerspectiveCarousel({
 images,
 spacing,
 rotation=24,
 outerRotation=44,
 perspective,
 centerScale=0.88,
 edgeScale=1.06,
 stiffness=230,
 damping=32,
 secondsPerCard=6,
 exploreHref='/photographs',
 exploreLabel='Explore Exhibitions',
 descendTarget='archive-rooms'
}){
 const progress=useMotionValue(0);
 const rootRef=useRef(null);
 const clipRef=useRef(null);
 const animationRef=useRef(null);
 const cruiseRef=useRef(true);
 const moveRef=useRef(0);
 const reducedRef=useRef(false);
 const [page,setPage]=useState(0);
 const [cursor,setCursor]=useState(0);
 const [width,setWidth]=useState(1280);
 const [reduced,setReduced]=useState(false);
 const metrics=layoutFor(width,{spacing,perspective,centerScale,edgeScale});
 reducedRef.current=reduced;

 const nudge=useCallback(step=>{
  const move=++moveRef.current;
  cruiseRef.current=false;
  animationRef.current?.stop();
  const target=Math.round(progress.get())+step;
  setPage(target);
  if(reducedRef.current){
   progress.set(target);
   cruiseRef.current=true;
   return;
  }
  const animation=animate(progress,target,{type:'spring',stiffness,damping,mass:springMass,onComplete(){
   if(moveRef.current===move)cruiseRef.current=true;
  }});
  animationRef.current=animation;
 },[progress,stiffness,damping]);

 useMotionValueEvent(progress,'change',value=>{
  const next=Math.round(value);
  setCursor(current=>current===next?current:next);
  if(cruiseRef.current)setPage(current=>current===next?current:next);
 });

 useEffect(()=>{
  if(reduced){
   cruiseRef.current=false;
   return;
  }
  cruiseRef.current=true;
  let last=performance.now();
  let frame=0;
  const speed=1/secondsPerCard;
  function tick(now){
   const elapsed=Math.min(0.05,(now-last)/1000);
   last=now;
   if(cruiseRef.current)progress.set(progress.get()+elapsed*speed);
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
 },[reduced,progress,secondsPerCard]);

 useEffect(()=>{
  const node=clipRef.current;
  if(!node||typeof ResizeObserver==='undefined')return;
  const measure=()=>setWidth(node.clientWidth||1280);
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(node);
  return ()=>observer.disconnect();
 },[]);

 useEffect(()=>{
  if(typeof window.matchMedia!=='function')return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply=()=>setReduced(media.matches);
  apply();
  media.addEventListener('change',apply);
  return ()=>media.removeEventListener('change',apply);
 },[]);

 function descend(){
  const node=document.getElementById(descendTarget);
  if(node)node.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 }

 const indices=[];
 const from=Math.min(page,cursor)-6;
 const to=Math.max(page,cursor)+6;
 for(let virtual=from;virtual<=to;virtual+=1)indices.push(virtual);
 const visualCenter=metrics.centerHeight*centerScale;
 const buttonSize=width<900?54:68;
 const descendTop=(metrics.stageHeight-visualCenter)/2+visualCenter*0.62-buttonSize/2;

 return <section ref={rootRef} className="perspective-carousel" aria-roledescription="carousel" aria-label="Parts of the archive">
  <Link to={exploreHref} className="button perspective-explore">{exploreLabel} <Icon/></Link>
  <div className="perspective-clip" ref={clipRef}>
   <div className="perspective-stage" style={{height:metrics.stageHeight,perspective:metrics.perspective}}>
    <div className="perspective-world">
     {images.length>0&&indices.map(virtual=><CarouselCard key={virtual} virtual={virtual} progress={progress} image={imageAt(images,virtual)} metrics={metrics} rotation={rotation} outerRotation={outerRotation} centerScale={centerScale} edgeScale={edgeScale} page={page}/>)}
    </div>
    <button type="button" className="perspective-descend" style={{top:descendTop}} aria-label="Continue down the page" onClick={descend}><Icon size={22}/></button>
   </div>
  </div>
  <div className="perspective-nav">
   <button type="button" aria-label="Previous photograph" onClick={()=>nudge(-1)}><Icon size={18}/></button>
   <button type="button" aria-label="Next photograph" onClick={()=>nudge(1)}><Icon size={18}/></button>
  </div>
 </section>;
}
