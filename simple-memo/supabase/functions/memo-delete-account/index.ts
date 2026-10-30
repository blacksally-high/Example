import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
Deno.serve(async(req:Request)=>{
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 try{
  if(Number(req.headers.get('content-length')||0)>8192)return reply(413,{error:'INVALID_REQUEST'});
  const url=Deno.env.get('SUPABASE_URL')!;const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer /i,'');
  if(!token)return reply(401,{error:'AUTH_REQUIRED'});
  const verifier=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:{user},error}=await verifier.auth.getUser(token);
  if(error||!user?.email)return reply(401,{error:'AUTH_REQUIRED'});
  const body=await req.json();
  if(body.confirmation!=='계정 삭제'||typeof body.password!=='string'||body.password.length>1024)return reply(400,{error:'CONFIRMATION_REQUIRED'});
  // Supabase Auth applies password authentication rate limits.
  const{data:reauth,error:authError}=await verifier.auth.signInWithPassword({email:user.email,password:body.password});
  if(authError||reauth.user?.id!==user.id)return reply(403,{error:'REAUTH_REQUIRED'});
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  // Remove old app rows for this same user; no other user's records are affected.
  const{error:oldError}=await admin.from('memos').delete().eq('user_id',user.id);
  if(oldError)return reply(500,{error:'RETRY_DELETE'});
  const{error:revokeError}=await admin.auth.admin.signOut(reauth.session!.access_token,'global');
  if(revokeError)return reply(500,{error:'RETRY_DELETE'});
  const{error:deleteError}=await admin.auth.admin.deleteUser(user.id);
  if(deleteError)return reply(500,{error:'RETRY_DELETE'});
  return reply(200,{ok:true});
 }catch{return reply(400,{error:'REQUEST_FAILED'});}
});
