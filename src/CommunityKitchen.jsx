import React,{useState} from 'react';
import {recipes} from './catalog.js';
import {deskPath} from './deskApi.js';
import {publicImage} from './publicImage.js';
import {readImageFile} from './readImageFile.js';

async function send(body){
  const response=await fetch(deskPath('/api/community/recipe'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'The archive could not receive this. Please keep a copy and try again.');
  return data;
}

export default function CommunityKitchen(){
  const family=recipes.filter(recipe=>recipe.community);
  const [form,setForm]=useState({name:'',devanagari:'',credit:'',description:'',ingredients:'',method:'',contact:'',shareName:true,consent:false});
  const [image,setImage]=useState(null);
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const update=event=>setForm({...form,[event.target.name]:event.target.type==='checkbox'?event.target.checked:event.target.value});

  async function submit(event){
    event.preventDefault();
    setBusy(true);setNotice('');
    try{
      const imageData=await readImageFile(image);
      await send({...form,imageData,website:event.target.website.value});
      setForm({name:'',devanagari:'',credit:'',description:'',ingredients:'',method:'',contact:'',shareName:true,consent:false});
      setImage(null);event.target.reset();
      setNotice('Received. The curator will read the recipe before it is published.');
    }catch(error){setNotice(error.message)}
    finally{setBusy(false)}
  }

  return <section className="community-block">
    {family.length>0&&<div className="family-recipes"><h2>From family kitchens.</h2><div className="family-recipe-grid">{family.map(recipe=>{const image=publicImage(recipe.image,'recipes');return <article key={recipe.id}>{image&&<img src={image} alt={recipe.name}/>}<h3>{recipe.devanagari&&<span lang="hi">{recipe.devanagari}</span>} {recipe.name}</h3><p>{recipe.description}</p><p className="recipe-credit">{recipe.credit==='Anonymous'?'Cook not named.':`Recipe by ${recipe.credit}.`}</p>{(recipe.ingredients||[]).length>0&&<ul>{(recipe.ingredients||[]).map((item,index)=><li key={index}>{item}</li>)}</ul>}<ol>{(recipe.method||[]).map((step,index)=><li key={index}>{step}</li>)}</ol></article>})}</div></div>}
    <form className="contribution-form" onSubmit={submit}>
      <div className="form-heading"><span>RAAH / A FAMILY RECIPE</span><span>FOR REVIEW</span></div>
      <h2>Cook it the way your family does.</h2>
      <p>A different ingredient, a family tip, a dish we have not included. The curator reads every recipe before it is published.</p>
      <div className="form-two"><label>Dish name<input name="name" value={form.name} onChange={update} maxLength={140} required/></label><label>Devanagari <span>optional</span><input name="devanagari" value={form.devanagari} onChange={update} maxLength={80} lang="hi"/></label></div>
      <label>A short description<input name="description" value={form.description} onChange={update} maxLength={500}/></label>
      <label>Ingredients <span>one on each line</span><textarea name="ingredients" value={form.ingredients} onChange={update} rows={5} maxLength={4000}/></label>
      <label>Method <span>one step on each line</span><textarea name="method" value={form.method} onChange={update} rows={6} maxLength={8000} required/></label>
      <label>Your name, as the cook should be credited<input name="credit" value={form.credit} onChange={update} maxLength={120}/></label>
      <label>Email or phone <span>private</span><input name="contact" value={form.contact} onChange={update} maxLength={200}/></label>
      <label>A photograph of the dish <span>optional, JPG, PNG or WebP under 1.2 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setImage(event.target.files?.[0]||null)}/></label>
      <label className="consent-label"><input type="checkbox" name="shareName" checked={form.shareName} onChange={update}/><span>Credit me by the name I entered.</span></label>
      <label className="consent-label"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required/><span>I have permission to share this recipe, and I understand it will be reviewed before it appears on the site.</span></label>
      <label className="honeypot" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <div className="form-actions"><button className="button" disabled={busy}>{busy?'Sending…':'Submit this recipe for review'}</button></div>
      {notice&&<p className="form-status" role="status">{notice}</p>}
    </form>
  </section>;
}
