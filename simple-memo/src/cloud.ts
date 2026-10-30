import {createClient} from '@supabase/supabase-js';
import {CONFIG} from './config';
import type {Note} from './model';
export const cloud=createClient(CONFIG.url,CONFIG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'my-memo-auth'},global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal??AbortSignal.timeout(15000)})}});
export async function listCloud(search='',trash=false,offset=0,all=false){const {data,error}=await cloud.rpc('memo_list',{p_search:search,p_trash:trash,p_offset:offset,p_limit:40,p_all:all});if(error)throw error;return data as Note[];}
export async function allCloud(){let notes:Note[]=[];for(let i=0;;i+=40){const page=await listCloud('',false,i,true);notes.push(...page);if(page.length<40)return notes;}}
export async function saveCloud(n:Note){const {data,error}=await cloud.rpc('memo_save',{p_id:n.id,p_content:n.content,p_pinned:n.is_pinned,p_deleted:!!n.deleted_at,p_version:n.version,p_operation:n.last_operation,p_imported:n.imported_created_at??null});if(error)throw error;return data[0] as Note;}
export async function getCloud(id:string){const {data,error}=await cloud.from('memo_notes').select('*').eq('id',id).maybeSingle();if(error)throw error;return data as Note|null;}
export async function removeCloud(n:Note){const {error}=await cloud.rpc('memo_remove',{p_id:n.id,p_version:n.version});if(error)throw error;}
