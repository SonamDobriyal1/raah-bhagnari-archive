import React,{useEffect,useState} from 'react';
import {Icon,Link} from './components.jsx';
import {chapters,historySource,cookbookSource} from './library.js';
import {PerspectiveCarousel} from './PerspectiveCarousel.jsx';

const exhibits=[
 {href:'/journey#origins',image:'/assets/scans/history-04.jpg',alt:'The origins page from Hari K. Nasta’s Bhagnari history booklet.',mark:'On the page',when:'Origins',title:'Bhag & Nar',note:chapters[0].place},
 {href:'/dishes/RAAH-0027#recipe',image:'/assets/scans/kitchen-29.jpg',alt:'Koki recipe page from the community cookbook, credited to Kanika Dudeja.',mark:'In the kitchen',when:'Cookbook p. 29',title:'Koki',note:'Flour, ghee, onion, green chillies.'},
 {href:'/journey#bombay',image:'/assets/scans/history-10.jpg',alt:'A page from the community history covering life after Partition.',mark:'After 1948',when:'Mahim',title:'A neighbourhood, rebuilt',note:chapters[3].place},
 {href:'/collections',image:'/assets/scans/aarti-01.jpg',alt:'The first page of the community aarti book.',mark:'In the gathering',when:'Aarti book',title:'Prayers kept at home',note:'Songs for family worship.'}
];

const frames=[
 {href:historySource+'#page=4',image:'/assets/scans/history-04.jpg',alt:'History booklet, page 4, on the origins in Bhag and Nar.',mark:'On the page',when:'Before migration',title:'Bhag & Nar'},
 {href:historySource+'#page=8',image:'/assets/scans/history-08.jpg',alt:'History booklet page on the crossing from Karachi.',mark:'Across the sea',when:'1947–48',title:'Karachi to Bombay'},
 {href:'/dishes/RAAH-0027#recipe',image:'/assets/scans/kitchen-29.jpg',alt:'The Koki page in From Bhagnari Kitchen.',mark:'In the kitchen',when:'Cookbook p. 29',title:'Koki'},
 {href:cookbookSource+'#page=5',image:'/assets/scans/kitchen-05.jpg',alt:'The community cookbook index of dishes and cooks.',mark:'A register',when:'60 pages',title:'From Bhagnari Kitchen'},
 {href:'/collections',image:'/assets/scans/aarti-01.jpg',alt:'Opening page of the community aarti book.',mark:'In the gathering',when:'36 pages',title:'The aarti book'},
 {href:'/collections',image:'/assets/scans/panchayat-01.jpg',alt:'A page from the Panchayat records after Partition.',mark:'After Partition',when:'11 pages',title:'The Panchayat records'}
];

const slides=[
 {src:'/assets/images/sections/journey.jpg',href:'/journey',alt:'A map of Balochistan from the community history.',label:'The journey'},
 {src:'/assets/images/dishes/RAAH-0027.jpg',href:'/dishes',alt:'Koki, from the community cookbook.',label:'Cookbook'},
 {src:'/assets/scans/aarti-01.jpg',href:'/collections',alt:'The cover of the community aarti book.',label:'Books'},
 {src:'/assets/images/sections/dictionary.jpg',href:'/words',alt:'घर, home, from the living dictionary.',label:'Dictionary'},
 {src:'/assets/images/voice-02-portrait.jpg',href:'/community',alt:'A portrait of an elder in a pink turban.',label:'Community'}
];

function ArchiveCarousel(){
 const [index,setIndex]=useState(0);
 const count=frames.length;
 const move=step=>setIndex(current=>(current+step+count)%count);
 useEffect(()=>{
  const timer=setInterval(()=>move(1),7000);
  return ()=>clearInterval(timer);
 },[]);
 const shown=[(index+count-1)%count,index,(index+1)%count];
 const current=frames[index];
 return <section className="archive-carousel" aria-roledescription="carousel" aria-label="Pages from the archive">
  <div className="carousel-stage">
   {shown.map((frameIndex,place)=>{
    const frame=frames[frameIndex];
    const center=place===1;
    return <a key={frame.image+place} className={'carousel-frame place-'+place} href={frame.href} tabIndex={center?0:-1} aria-hidden={center?undefined:true}>
     <img src={frame.image} alt={center?frame.alt:''}/>
    </a>;
   })}
  </div>
  <div className="carousel-caption">
   <button type="button" className="carousel-arrow" aria-label="Previous page" onClick={()=>move(-1)}><Icon/></button>
   <div>
    <p><i/>{current.mark} <span>{current.when}</span></p>
    <h2>{current.title}</h2>
   </div>
   <button type="button" className="carousel-arrow" aria-label="Next page" onClick={()=>move(1)}><Icon/></button>
  </div>
 </section>;
}

export default function GalleryHome(){
 return <>
  <section className="gallery-hero">
   <p className="eyebrow">The living archive</p>
   <h1>Where every <em>word</em><br/>tells a story</h1>
   <PerspectiveCarousel images={slides}/>
  </section>
  <section id="archive-rooms" className="exhibit-grid wrap" aria-label="Rooms of the archive">
   {exhibits.map(item=><Link key={item.title} to={item.href} className="exhibit-card">
    <img src={item.image} alt={item.alt}/>
    <div><p><i/>{item.mark} <span>{item.when}</span></p><h2>{item.title}</h2><small>{item.note}</small></div>
   </Link>)}
  </section>
  <ArchiveCarousel/>
  <section className="archive-mosaic wrap" aria-label="Pages to browse">
   <Link to="/dishes" className="mosaic-wide"><img src="/assets/scans/kitchen-05.jpg" alt="The cookbook index, with dishes and the names of cooks."/><span>The cookbook index <b>Food</b></span></Link>
   <Link to="/dishes/RAAH-0001#recipe" className="mosaic-tall"><img src="/assets/scans/kitchen-21.jpg" alt="A recipe page from From Bhagnari Kitchen."/><span>Khatti Dal <b>A recipe</b></span></Link>
   <Link to="/journey#sindh"><img src="/assets/scans/history-06.jpg" alt="A history booklet page on life in Sindh."/><span>Sindh</span></Link>
   <Link to="/voices"><img src="/assets/scans/kitchen-45.jpg" alt="A later page from the community cookbook."/><span>Voices</span></Link>
   <Link to="/collections"><img src="/assets/scans/panchayat-01.jpg" alt="The opening page of the Panchayat records."/><span>Records</span></Link>
  </section>
  <section className="gallery-band">
   <Link to="/journey" className="band-photo band-a"><img src="/assets/scans/history-14.jpg" alt="A page from the community history. Open the journey."/></Link>
   <Link to="/dishes" className="band-photo band-b"><img src="/assets/scans/kitchen-29.jpg" alt="The Koki page from the cookbook. Open the kitchens."/></Link>
   <Link to="/collections" className="band-photo band-c"><img src="/assets/scans/aarti-01.jpg" alt="The cover of the aarti book. Open the books."/></Link>
   <Link to="/collections" className="band-photo band-d"><img src="/assets/scans/panchayat-01.jpg" alt="The Panchayat report. Open the books."/></Link>
   <Link to="/dishes" className="band-photo band-e"><img src="/assets/scans/kitchen-03.jpg" alt="The cover of From Bhagnari Kitchen. Open the kitchens."/></Link>
   <div>
    <p className="eyebrow">Add your page</p>
    <h2>Your family holds a page we have not read.</h2>
    <Link to="/contribute" className="button button-light">Offer a page <Icon name="plus"/></Link>
   </div>
  </section>
 </>;
}
