import React from 'react';
import histories from '../content/oral-histories.json';
import {Eyebrow,Icon,Link} from './components.jsx';

const offer='/contribute?type=memory&title=An%20oral%20history%20interview';

export default function OralHistories({preview=false}){
 const published=histories.filter(h=>h.publicationConsent===true&&h.status==='published');
 return <section id="oral-histories" className={'oral-histories '+(preview?'oral-home wrap':'oral-room')} aria-labelledby={preview?'oral-home-title':'oral-room-title'}>
  <div className="oral-intro"><Eyebrow>Oral histories · video & audio</Eyebrow><h2 id={preview?'oral-home-title':'oral-room-title'}>A life, in their own words.</h2><p>Before the journey. The home left behind. The life built after. A place for Bhagnari families to tell their stories, in their own voices.</p><Link className="text-link" to={preview?'/voices#oral-histories':'#record'}>{preview?'Visit the listening room':'Begin a conversation'} <Icon/></Link></div>
  {published.length?<div className="oral-recordings">{published.slice(0,preview?1:published.length).map(h=><article className="oral-recording" key={h.id}>
   {h.kind==='video'?<video controls preload="none" poster={h.poster||undefined} aria-label={'Interview with '+h.speaker}><source src={h.mediaUrl} type={h.mimeType}/>{h.captionsUrl&&<track kind="captions" src={h.captionsUrl} srcLang={h.languageCode} label={h.language} default/>}</video>:<audio controls preload="none" src={h.mediaUrl} aria-label={'Recording of '+h.speaker}/>}
   <div className="oral-recording-copy"><Eyebrow>{h.kind==='video'?'Video interview':'Audio recording'}</Eyebrow><h3>{h.speaker}</h3><p>{h.summary}</p><p className="oral-facts">{[h.language,h.duration,h.recordedOn&&'Recorded '+h.recordedOn,h.place].filter(Boolean).join(' · ')}</p>{h.interviewer&&<p className="oral-credit">Interview by {h.interviewer}</p>}{h.transcript&&<details><summary>Read the transcript</summary><div className="oral-transcript">{h.transcript}</div></details>}</div>
  </article>)}</div>:<div className="oral-awaiting"><div className="oral-empty-frame"><img src="/assets/images/listening-room.jpg" alt="An empty chair and a recorder by a sunlit window, waiting for a family interview."/><span>A place for your family’s voice</span></div><div className="oral-recording-copy"><Eyebrow>The first stories begin with you</Eyebrow><h3>Who would you like us to hear?</h3><p>We’re gathering our first interviews. Offer a video conversation, an audio recording, or help an elder begin one.</p><Link className="button" to={offer}>Offer an interview <Icon name="plus"/></Link><p className="oral-permission">Shared only with the speaker’s permission, after review.</p></div></div>}
  {!preview&&<div className="oral-sharing-note"><h3>Already have a recording?</h3><p>Tell us who is speaking, the language, when and where it was recorded, and what they are comfortable sharing. You can include a private viewing link in your message. Please keep the original file.</p><Link className="text-link" to={offer}>Tell us about an interview <Icon/></Link><p>For a short audio contribution, <Link to="/contribute?type=voice">upload a voice recording</Link>. Ask the speaker before recording and again before offering it to the archive.</p></div>}
 </section>
}
