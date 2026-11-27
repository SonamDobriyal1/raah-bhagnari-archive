import React,{useState} from 'react';
import {publishedJourneys} from './catalog.js';
import {Eyebrow,Icon,Link,Stamp} from './components.jsx';
import {deskPath} from './deskApi.js';
import {publicImage} from './publicImage.js';
import {readImageFile} from './readImageFile.js';
import RouteMap from './RouteMap.jsx';
import {routeStops} from './routeStops.js';

const emptyStops=[{name:'',year:''},{name:'',year:''}];

async function send(path,body){
  const response=await fetch(deskPath(path),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'The archive could not receive this. Please keep a copy and try again.');
  return data;
}

function FamilyJourney({journey,index,total}){
  const stops=routeStops(journey.place);
  const image=publicImage(journey.image,'journeys');
  const first=stops[0]?.name||'this route';
  return <div className="journey-full family-journey">
    <aside className="journey-map" id={`${journey.id}-map`}>
      <RouteMap place={journey.place} title={journey.title}/>
      <div className="map-caption">
        <Eyebrow>Family journey {index+1} of {total}</Eyebrow>
        <p>{journey.place}</p>
        <small>The map follows the places this family named. It is a sketch, not a surveyed route.</small>
      </div>
    </aside>
    <div className="chapter-spine">
      <article id={journey.id} className="chapter chapter-ledger active">
        <button type="button" className="chapter-select" onClick={()=>document.getElementById(`${journey.id}-map`)?.scrollIntoView({block:'center'})}>
          <span className="chapter-index">{String(index+1).padStart(2,'0')}</span>
          <span>{journey.year}</span>
          <span>On the map <Icon size={16}/></span>
        </button>
        <p className="era-label">A family route</p>
        <h2>{journey.title}</h2>
        <p className="chapter-place">{journey.place}</p>
        <p>{journey.body}</p>
        {image
          ? <a className="chapter-artifact" href={image} target="_blank" rel="noreferrer"><img src={image} alt="" loading="lazy"/><span>{journey.credit&&journey.credit!=='A family'?`Photograph offered with ${journey.credit}`:'A photograph offered with this journey.'}</span></a>
          : <div className="album-awaiting"><span>A photograph from this journey belongs here.</span><Link to={`/contribute?type=photograph&title=${encodeURIComponent(journey.title)}`}>Offer a photograph <Icon name="plus"/></Link></div>}
        <p className="source-link">{journey.source}</p>
        <div className="sought-object"><Stamp status="placeholder"/><p>A paper, ticket or photograph from {first}.</p><Link to={`/contribute?type=memory&title=${encodeURIComponent(journey.title)}`} className="text-link">Can your family add this? <Icon name="plus" size={16}/></Link></div>
      </article>
    </div>
  </div>;
}

export default function CommunityJourneys(){
  const journeys=publishedJourneys();
  const [form,setForm]=useState({name:'',contact:'',years:'',story:'',shareName:true,consent:false});
  const [stops,setStops]=useState(emptyStops);
  const [image,setImage]=useState(null);
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const update=event=>setForm({...form,[event.target.name]:event.target.type==='checkbox'?event.target.checked:event.target.value});
  const namedStops=stops.filter(stop=>stop.name.trim());
  const setStop=(index,field,value)=>setStops(stops.map((stop,item)=>item===index?{...stop,[field]:value}:stop));

  async function submit(event){
    event.preventDefault();
    setBusy(true);setNotice('');
    try{
      const imageData=await readImageFile(image);
      const route=namedStops.map(stop=>({name:stop.name.trim(),year:stop.year.trim()}));
      await send('/api/community/journey-request',{...form,stops:route,from:route[0]?.name||'',to:route.at(-1)?.name||'',imageData,website:event.target.website.value});
      setForm({name:'',contact:'',years:'',story:'',shareName:true,consent:false});
      setStops(emptyStops.map(stop=>({...stop})));
      setImage(null);event.target.reset();
      setNotice('Received. The curator will read it before anything is published.');
    }catch(error){setNotice(error.message)}
    finally{setBusy(false)}
  }

  return <section className="community-block">
    {journeys.length>0&&<div className="family-journeys"><h2>Journeys families have asked us to keep.</h2>{journeys.map((journey,index)=><FamilyJourney key={journey.id} journey={journey} index={index} total={journeys.length}/>)}</div>}
    <form className="contribution-form" onSubmit={submit}>
      <div className="form-heading"><span>RAAH / A FAMILY JOURNEY</span><span>FOR REVIEW</span></div>
      <h2>Where did your family go?</h2>
      <p>Name the places in the order the journey went. The sketch updates as you write. Nothing is published until the curator has read it.</p>
      <div className="route-preview"><RouteMap stops={namedStops} title="Your family’s route"/></div>
      <label>Your name<input name="name" value={form.name} onChange={update} maxLength={120}/></label>
      <label>Email or phone <span>private, so the curator can reply</span><input name="contact" value={form.contact} onChange={update} maxLength={200}/></label>
      <fieldset className="route-stops"><legend>Places, in order</legend>{stops.map((stop,index)=><div className="route-stop" key={index}><label>Place {index+1}<input value={stop.name} onChange={event=>setStop(index,'name',event.target.value)} maxLength={80} required={index===0} placeholder={index===0?'Where it began':'The next place'}/></label><label>When <span>optional</span><input value={stop.year} onChange={event=>setStop(index,'year',event.target.value)} maxLength={40} placeholder="1947, or the 1960s"/></label>{stops.length>1&&<button type="button" className="text-link" onClick={()=>setStops(stops.filter((_,item)=>item!==index))}>Remove</button>}</div>)}{stops.length<6&&<button type="button" className="text-link" onClick={()=>setStops([...stops,{name:'',year:''}])}>Add another place <Icon name="plus" size={16}/></button>}</fieldset>
      <label>Years <span>for the journey as a whole, if you know them</span><input name="years" value={form.years} onChange={update} maxLength={60} placeholder="1947, or the 1960s"/></label>
      <label>The journey<textarea name="story" value={form.story} onChange={update} maxLength={4000} rows={6} required placeholder="Who travelled, what they carried, and what you are still unsure about."/></label>
      <label>A photograph <span>optional, JPG, PNG or WebP under 1.2 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setImage(event.target.files?.[0]||null)}/></label>
      <label className="consent-label"><input type="checkbox" name="shareName" checked={form.shareName} onChange={update}/><span>The curator may publish my name with this journey.</span></label>
      <label className="consent-label"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required/><span>I have permission to share this, and I understand it will be reviewed before it appears on the site.</span></label>
      <label className="honeypot" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <div className="form-actions"><button className="button" disabled={busy}>{busy?'Sending…':'Ask the curator to cover this journey'}</button></div>
      {(busy||notice)&&<p className="form-status" role="status">{busy?'Submitting…':notice}</p>}
    </form>
  </section>;
}
