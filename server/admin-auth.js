import {createHmac,timingSafeEqual} from 'node:crypto';

const COOKIE='raah_admin';
const attempts=new Map();

export function clearLoginAttempts(){attempts.clear()}

function safeEqual(leftValue,rightValue){
  const left=Buffer.from(String(leftValue));
  const right=Buffer.from(String(rightValue));
  if(left.length!==right.length)return false;
  return timingSafeEqual(left,right);
}

export function adminConfigError(){
  const email=(process.env.ADMIN_EMAIL||'').trim();
  const password=process.env.ADMIN_PASSWORD||'';
  if(!email||!password)return 'Admin sign-in is not configured yet. Add ADMIN_EMAIL and ADMIN_PASSWORD to the .env file, then restart the site.';
  if(password.length<8)return 'ADMIN_PASSWORD must be at least 8 characters. Update .env and restart the site.';
  return '';
}

function signingKey(){
  return process.env.ADMIN_SESSION_SECRET||process.env.ADMIN_PASSWORD||'';
}

export function createSession(email){
  const body=Buffer.from(JSON.stringify({email,exp:Date.now()+12*60*60*1000})).toString('base64url');
  const mac=createHmac('sha256',signingKey()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function readSession(token){
  if(adminConfigError())return null;
  const [body,mac]=String(token||'').split('.');
  if(!body||!mac)return null;
  const expected=createHmac('sha256',signingKey()).update(body).digest('base64url');
  if(!safeEqual(mac,expected))return null;
  try{
    const payload=JSON.parse(Buffer.from(body,'base64url').toString());
    if(!payload||payload.exp<Date.now())return null;
    if(!safeEqual(String(payload.email).toLowerCase(),process.env.ADMIN_EMAIL.trim().toLowerCase()))return null;
    return payload;
  }catch{return null}
}

export function sessionFrom(req){
  const bearer=String(req.headers?.authorization||'').match(/^Bearer\s+(\S+)$/i);
  if(bearer)return readSession(bearer[1]);
  const header=String(req.headers?.cookie||'');
  const pair=header.split(/;\s*/).find(part=>part.startsWith(COOKIE+'='));
  if(!pair)return null;
  return readSession(decodeURIComponent(pair.slice(COOKIE.length+1)));
}

function clientKey(req){
  return String(req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'local').slice(0,80);
}

export function loginAllowed(req){
  const record=attempts.get(clientKey(req));
  return !record||record.count<8||Date.now()-record.start>10*60*1000;
}

function noteFailure(req){
  const key=clientKey(req);
  const current=attempts.get(key);
  if(!current||Date.now()-current.start>10*60*1000)attempts.set(key,{count:1,start:Date.now()});
  else current.count+=1;
}

export function credentialsMatch(email,password){
  const expectedEmail=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
  const expectedPassword=process.env.ADMIN_PASSWORD||'';
  return safeEqual(String(email||'').trim().toLowerCase(),expectedEmail)&&safeEqual(password||'',expectedPassword);
}

export function acceptLogin(req,email,password){
  const problem=adminConfigError();
  if(problem)return {status:503,error:problem};
  if(!loginAllowed(req))return {status:429,error:'Too many sign-in attempts. Please wait a few minutes and try again.'};
  if(!credentialsMatch(email,password)){
    noteFailure(req);
    return {status:401,error:'That email or password was not recognised.'};
  }
  attempts.delete(clientKey(req));
  return {status:200,token:createSession(process.env.ADMIN_EMAIL.trim())};
}

export function sessionCookie(token,req){
  const secure=req.headers?.['x-forwarded-proto']==='https'?'; Secure':'';
  return `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=43200; SameSite=Strict${secure}`;
}

export function clearCookie(){
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}
