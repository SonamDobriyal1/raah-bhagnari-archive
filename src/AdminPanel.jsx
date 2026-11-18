import React,{useEffect,useState} from 'react';
import {applyPublished,dictionary} from './catalog.js';
import {Icon,PageIntro} from './components.jsx';
import {themes} from './library.js';
import {authHeaders,deskPath,forgetSession,rememberSession} from './deskApi.js';
import {readImageFile} from './readImageFile.js';
import RouteMap from './RouteMap.jsx';
import {routeLabel,routeStops} from './routeStops.js';

const blankJourney={title:'',year:'',place:'',body:'',source:'',credit:''};
const blankWord={headword:'',devanagari:'',meaning:'',example:'',translation:'',theme:'Everyday Life and Expressions',hindiMeaning:''};
const blankRecipe={name:'',devanagari:'',credit:'',description:'',ingredients:'',method:''};

async function save(path,body){
  const response=await fetch(deskPath(path),{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||(response.status===404?'The curator desk could not be reached. Publish again after the site finishes deploying.':'The archive could not save that.'));
  rememberSession(data);
  if(path.endsWith('/logout'))forgetSession();
  if(data.published){applyPublished(data.published);window.dispatchEvent(new Event('raah-site-content'))}
  return data;
}

function Row({title,meta,children,action}){
  return <article className="admin-row"><div><h3>{title}</h3>{meta&&<p>{meta}</p>}{children}</div>{action}</article>;
}

export default function AdminPanel(){
  const [session,setSession]=useState(null);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [desk,setDesk]=useState(null);
  const [tab,setTab]=useState('register');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [journey,setJourney]=useState(blankJourney);
  const [journeyImage,setJourneyImage]=useState(null);
  const [word,setWord]=useState(blankWord);
  const [query,setQuery]=useState('');
  const [recipe,setRecipe]=useState(blankRecipe);
  const [recipeImage,setRecipeImage]=useState(null);

  useEffect(()=>{
    let active=true;
    fetch(deskPath('/api/admin/session'),{headers:authHeaders()}).then(response=>response.json()).then(data=>{if(active)setSession(data)}).catch(()=>{if(active)setSession({offline:true,authenticated:false})});
    return ()=>{active=false};
  },[]);

  async function loadDesk(){
    const response=await fetch(deskPath('/api/admin/desk'),{headers:authHeaders()});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'The curator desk could not be opened.');
    setDesk(data);
  }

  useEffect(()=>{
    if(!session?.authenticated)return undefined;
    let active=true;
    loadDesk().catch(error=>{if(active)setNotice(error.message)});
    return ()=>{active=false};
  },[session?.authenticated]);

  async function signIn(event){
    event.preventDefault();
    setBusy(true);setNotice('');
    try{
      await save('/api/admin/login',{email,password});
      setPassword('');
      setSession({authenticated:true,email});
    }catch(error){setNotice(error.message)}
    finally{setBusy(false)}
  }

  async function run(path,body,done){
    setBusy(true);setNotice('');
    try{const data=await save(path,body);if(data.published)setDesk(data);setNotice(done);return true}
    catch(error){setNotice(error.message);return false}
    finally{setBusy(false)}
  }

  if(!session)return <div className="wrap"><PageIntro label="Curator desk" title="Care for the archive."><p>Opening the desk…</p></PageIntro></div>;
  if(session.offline)return <div className="wrap"><PageIntro label="Curator desk" title="The desk is not connected."><p>Start the site with <code>npm run dev</code> on the computer where <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> are set in <code>.env</code>.</p></PageIntro></div>;
  if(!session.authenticated)return <div className="wrap admin-login"><PageIntro label="Curator desk" title="Sign in to care for the archive."><p>Journeys, words and recipes you publish here appear for readers. Family submissions wait here until you approve them.</p></PageIntro><form className="contribution-form" onSubmit={signIn}><label>Email<input type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required/></label>{session.configError&&<p className="form-status" role="status">{session.configError}</p>}<div className="form-actions"><button className="button" disabled={busy}>{busy?'Checking…':'Sign in'}</button></div>{notice&&<p className="form-status" role="alert">{notice}</p>}</form></div>;

  const published=desk?.published||{journeys:[],words:[],removedWords:[],recipes:[]};
  const inbox=desk?.inbox||{journeyRequests:[],recipeSubmissions:[]};
  const contributions=desk?.contributions||[];
  const waiting=contributions.filter(item=>item.status==='pending'||!item.status);
  const read=contributions.filter(item=>item.status==='in_review');
  const rejected=contributions.filter(item=>item.status==='declined');
  const term=query.trim().toLowerCase();
  const exactId=term?dictionary.filter(entry=>entry.id.toLowerCase()===term):[];
  const matches=exactId.length?exactId:term?dictionary.filter(entry=>[entry.headword,entry.devanagari,entry.id].join(' ').toLowerCase().includes(term)).slice(0,20):[];
  const tabs=[['register','Register',waiting.length],['journeys','Journeys',inbox.journeyRequests.length],['dictionary','Dictionary',0],['kitchen','Our kitchens',inbox.recipeSubmissions.length]];

  return <div className="wrap admin-desk">
    <PageIntro label="Curator desk" title="What readers will see next."><p>Signed in as {session.email}. Publishing a journey, word or recipe makes it visible. Family requests stay private until you approve them.</p></PageIntro>
    <div className="admin-toolbar"><div className="admin-tabs" role="tablist">{tabs.map(([id,label,count])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}{count?` (${count})`:''}</button>)}</div><button type="button" className="text-link" onClick={()=>save('/api/admin/logout',{}).then(()=>{setSession({authenticated:false});setDesk(null)}).catch(error=>setNotice(error.message))}>Sign out</button></div>
    {notice&&<p className="form-status" role="status">{notice}</p>}

    {tab==='register'&&<div className="admin-panels">
      <section className="admin-card">
        <h2>Waiting</h2>
        <p>New pages from the community register. Names and contact details stay on this desk. Nothing here is published.</p>
        {waiting.length===0&&<p>No register pages are waiting.</p>}
        {waiting.map(item=><RegisterEntry key={item.reference} item={item} action={<div className="admin-actions"><button type="button" className="button" disabled={busy} onClick={()=>run('/api/admin/contributions/review',{reference:item.reference,status:'in_review'},item.title+' is in Read.')}>Mark as read</button><button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/contributions/review',{reference:item.reference,status:'declined'},item.title+' is in Rejected.')}>Reject</button></div>}/>)}
      </section>
      <section className="admin-card">
        <h2>Read</h2>
        <p>Pages you have marked as read. They stay in this section and are not published.</p>
        {read.length===0&&<p>No pages have been marked as read.</p>}
        {read.map(item=><RegisterEntry key={item.reference} item={item} action={<div className="admin-actions"><button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/contributions/review',{reference:item.reference,status:'declined'},item.title+' is in Rejected.')}>Reject</button></div>}/>)}
      </section>
      <section className="admin-card">
        <h2>Rejected</h2>
        <p>Pages you have rejected. They stay here so you can look back. They are not published.</p>
        {rejected.length===0&&<p>No pages have been rejected.</p>}
        {rejected.map(item=><RegisterEntry key={item.reference} item={item}/>)}
      </section>
    </div>}

    {tab==='journeys'&&<div className="admin-panels">
      <section className="admin-card"><h2>Waiting for a decision</h2>{inbox.journeyRequests.length===0&&<p>No family has asked for a journey to be covered.</p>}{inbox.journeyRequests.map(request=><JourneyRequest key={request.id} request={request} busy={busy} onDecide={run}/>)}</section>
      <section className="admin-card"><h2>Add a journey</h2><JourneyForm value={journey} setValue={setJourney} setImage={setJourneyImage} busy={busy} onSubmit={async (event,place)=>{event.preventDefault();try{const imageData=await readImageFile(journeyImage);const saved=await run('/api/admin/journeys',{...journey,place,imageData},'The journey is now on the journey page.');if(saved){setJourney(blankJourney);setJourneyImage(null);event.target.reset()}return saved}catch(error){setNotice(error.message);return false}}}/></section>
      <section className="admin-card"><h2>Published from this desk</h2>{published.journeys.length===0&&<p>No extra journeys yet. The five history chapters stay on the page either way.</p>}{published.journeys.map(item=><Row key={item.id} title={item.title} meta={`${item.year} · ${item.place}`} action={<button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/journeys/delete',{id:item.id},'That journey was taken off the page.')}>Remove</button>}/>)}</section>
    </div>}

    {tab==='dictionary'&&<div className="admin-panels">
      <section className="admin-card"><h2>Remove a word</h2><p>Type a record ID, such as RAAH-0123, or the headword. Only that dictionary entry is removed. A word from the original dictionary can be restored afterwards.</p><label>Record ID or headword<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="RAAH-0123 or Koki"/></label>{matches.map(entry=><Row key={entry.id} title={entry.headword} meta={`${entry.id} · ${entry.meaning}`} action={<button type="button" className="button" disabled={busy} onClick={()=>run('/api/admin/words/remove',{id:entry.id},`${entry.headword} (${entry.id}) was removed from the dictionary.`)}>Remove this word</button>}/>)}{query.trim()&&matches.length===0&&<p>No dictionary word has that ID or headword.</p>}{!query.trim()&&<p>Enter the ID or headword of the word you want to remove.</p>}<h3>Removed words</h3>{published.removedWords.length===0&&<p>No source words are hidden.</p>}{published.removedWords.map(entry=><Row key={entry.id} title={entry.headword} meta={entry.id} action={<button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/words/restore',{id:entry.id},`${entry.headword} is back in the dictionary.`)}>Restore</button>}/>)}</section><section className="admin-card"><h2>Add a word</h2><form className="contribution-form" onSubmit={async event=>{event.preventDefault();if(await run('/api/admin/words',word,'The word is now in the living dictionary.'))setWord(blankWord)}}><label>Headword<input value={word.headword} onChange={event=>setWord({...word,headword:event.target.value})} maxLength={80} required/></label><label>Devanagari <span>optional</span><input value={word.devanagari} onChange={event=>setWord({...word,devanagari:event.target.value})} maxLength={80} lang="hi"/></label><label>English meaning<input value={word.meaning} onChange={event=>setWord({...word,meaning:event.target.value})} maxLength={500} required/></label><label>Hindi meaning <span>optional</span><input value={word.hindiMeaning} onChange={event=>setWord({...word,hindiMeaning:event.target.value})} maxLength={300} lang="hi"/></label><label>Example<input value={word.example} onChange={event=>setWord({...word,example:event.target.value})} maxLength={300}/></label><label>Example in English<input value={word.translation} onChange={event=>setWord({...word,translation:event.target.value})} maxLength={300}/></label><label>Theme<select value={word.theme} onChange={event=>setWord({...word,theme:event.target.value})}>{Object.entries(themes).map(([name,label])=><option key={name} value={name}>{label}</option>)}</select></label><div className="form-actions"><button className="button" disabled={busy}>Add this word</button></div></form></section>
      
    </div>}

    {tab==='kitchen'&&<div className="admin-panels">
      <section className="admin-card"><h2>Recipes waiting for approval</h2>{inbox.recipeSubmissions.length===0&&<p>No family recipes are waiting.</p>}{inbox.recipeSubmissions.map(item=><article className="admin-row" key={item.id}><div>{item.imageData&&<img className="admin-photo" src={item.imageData} alt=""/>}<h3>{item.name}</h3><p>{item.credit?`Credit: ${item.credit}`:'The cook asked not to be named.'}{item.contact?` · ${item.contact}`:''}</p>{item.description&&<p>{item.description}</p>}<ul>{item.ingredients.map((ingredient,index)=><li key={index}>{ingredient}</li>)}</ul><ol>{item.method.map((step,index)=><li key={index}>{step}</li>)}</ol></div><div className="admin-actions"><button type="button" className="button" disabled={busy} onClick={()=>run('/api/admin/recipe-submissions/approve',{id:item.id},`${item.name} is now in Our kitchens.`)}>Approve</button><button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/recipe-submissions/reject',{id:item.id},`${item.name} was declined.`)}>Decline</button></div></article>)}</section>
      <section className="admin-card"><h2>Add a recipe</h2><form className="contribution-form" onSubmit={async event=>{event.preventDefault();try{const imageData=await readImageFile(recipeImage);if(await run('/api/admin/recipes',{...recipe,imageData},'The recipe is now in Our kitchens.')){setRecipe(blankRecipe);setRecipeImage(null);event.target.reset()}}catch(error){setNotice(error.message)}}}><div className="form-two"><label>Dish name<input value={recipe.name} onChange={event=>setRecipe({...recipe,name:event.target.value})} maxLength={140} required/></label><label>Devanagari<input value={recipe.devanagari} onChange={event=>setRecipe({...recipe,devanagari:event.target.value})} maxLength={80} lang="hi"/></label></div><label>Cook’s name<input value={recipe.credit} onChange={event=>setRecipe({...recipe,credit:event.target.value})} maxLength={120}/></label><label>Description<input value={recipe.description} onChange={event=>setRecipe({...recipe,description:event.target.value})} maxLength={500}/></label><label>Ingredients <span>one on each line</span><textarea value={recipe.ingredients} onChange={event=>setRecipe({...recipe,ingredients:event.target.value})} rows={5}/></label><label>Method <span>one step on each line</span><textarea value={recipe.method} onChange={event=>setRecipe({...recipe,method:event.target.value})} rows={6} required/></label><label>Photograph <span>optional</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setRecipeImage(event.target.files?.[0]||null)}/></label><div className="form-actions"><button className="button" disabled={busy}>Publish this recipe</button></div></form></section>
      <section className="admin-card"><h2>Published from this desk</h2>{published.recipes.length===0&&<p>No family recipes have been published yet.</p>}{published.recipes.map(item=><Row key={item.id} title={item.name} meta={item.credit} action={<button type="button" className="text-link" disabled={busy} onClick={()=>run('/api/admin/recipes/delete',{id:item.id},`${item.name} was taken off the page.`)}>Remove</button>}/>)}</section>
    </div>}
  </div>;
}

function RegisterEntry({item,action}){
  const sent=item.created_at?new Date(item.created_at):null;
  const when=sent&&!Number.isNaN(sent.getTime())?sent.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
  return <article className="admin-row"><div><h3>{item.title}</h3><p>{item.type} · {item.reference}{when?` · ${when}`:''}</p><p>{item.message}</p>{item.source&&<p>{item.source}</p>}<p>{item.name||'Name not given'}{item.contact?` · ${item.contact}`:''}</p><p>{item.credit} · {item.access}{item.record?` · ${item.record}`:''}</p></div>{action}</article>;
}

function JourneyStops({stops,setStops}){
  const setStop=(index,field,next)=>setStops(stops.map((stop,item)=>item===index?{...stop,[field]:next}:stop));
  return <fieldset className="route-stops"><legend>Places, in order</legend>{stops.map((stop,index)=><div className="route-stop" key={index}><label>Place {index+1}<input value={stop.name} onChange={event=>setStop(index,'name',event.target.value)} maxLength={80} required={index===0} placeholder={index===0?'Where it began':'The next place'}/></label><label>When <span>optional</span><input value={stop.year} onChange={event=>setStop(index,'year',event.target.value)} maxLength={40} placeholder="1947, or the 1960s"/></label>{stops.length>1&&<button type="button" className="text-link" onClick={()=>setStops(stops.filter((_,item)=>item!==index))}>Remove</button>}</div>)}{stops.length<6&&<button type="button" className="text-link" onClick={()=>setStops([...stops,{name:'',year:''}])}>Add another place <Icon name="plus" size={16}/></button>}</fieldset>;
}

function JourneyForm({value,setValue,setImage,busy,onSubmit}){
  const [stops,setStops]=useState([{name:'',year:''},{name:'',year:''}]);
  const named=stops.filter(stop=>stop.name.trim()).map(stop=>({name:stop.name.trim(),year:stop.year.trim()}));
  const field=(name,label,extra,required)=><label>{label}<input value={value[name]} onChange={event=>setValue({...value,[name]:event.target.value})} maxLength={extra} required={required}/></label>;
  return <form className="contribution-form" onSubmit={async event=>{if(await onSubmit(event,routeLabel(named)))setStops([{name:'',year:''},{name:'',year:''}])}}><div className="route-preview"><RouteMap stops={named} title={value.title||'A family route'}/></div><p>Name the places in the order the journey went. Publishing draws this sketch on the journey page.</p>{field('title','Title',140,true)}{field('year','Years',60)}<JourneyStops stops={stops} setStops={setStops}/><label>The journey<textarea value={value.body} onChange={event=>setValue({...value,body:event.target.value})} rows={6} maxLength={4000} required/></label>{field('source','Source line',240)}{field('credit','Credit',120)}<label>Photograph <span>optional</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setImage(event.target.files?.[0]||null)}/></label><div className="form-actions"><button className="button" disabled={busy}>Publish this journey</button></div></form>;
}

function JourneyRequest({request,busy,onDecide}){
  const named=request.shareName&&request.name;
  const opening=request.stops?.length?request.stops:routeStops([request.from,request.to].filter(Boolean).join(' → '));
  const [stops,setStops]=useState(opening.length?opening:[{name:'',year:''}]);
  const [fields,setFields]=useState({
    title:named?`${request.name}’s journey`:'A family journey',
    year:request.years||'',
    body:request.story,
    source:named?`Offered to the archive by ${request.name}`:'Offered to the archive'
  });
  const place=routeLabel(stops.filter(stop=>stop.name.trim()).map(stop=>({name:stop.name.trim(),year:stop.year.trim()})));
  return <article className="admin-row"><div>{request.imageData&&<img className="admin-photo" src={request.imageData} alt=""/>}<h3>{request.name||'Name not given'}</h3><p>{request.contact||'No contact given'} · {request.shareName?'Name may be published':'Keep the name private'}</p><div className="route-preview"><RouteMap stops={stops.filter(stop=>stop.name.trim())} title={fields.title}/></div><label>Title<input value={fields.title} onChange={event=>setFields({...fields,title:event.target.value})}/></label><label>Years<input value={fields.year} onChange={event=>setFields({...fields,year:event.target.value})}/></label><JourneyStops stops={stops} setStops={setStops}/><label>Chapter<textarea rows={5} value={fields.body} onChange={event=>setFields({...fields,body:event.target.value})}/></label><label>Source line<input value={fields.source} onChange={event=>setFields({...fields,source:event.target.value})}/></label></div><div className="admin-actions"><button type="button" className="button" disabled={busy} onClick={()=>onDecide('/api/admin/journey-requests/publish',{id:request.id,...fields,place},'The journey is now on the journey page.')}>Publish</button><button type="button" className="text-link" disabled={busy} onClick={()=>onDecide('/api/admin/journey-requests/dismiss',{id:request.id},'The request was set aside.')}>Decline</button></div></article>;
}
