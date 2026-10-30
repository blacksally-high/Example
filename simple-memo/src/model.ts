export type Note = {id:string;user_id:string;content:string;is_pinned:boolean;created_at:string;updated_at:string;deleted_at:string|null;version:number;last_operation:string;imported_created_at?:string|null;dirty?:boolean;conflict?:boolean};
// UUID fallback supports HTTP-only local previews; production uses HTTPS.
export function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export const countChars=(s:string)=>Array.from(s).length;
export const validContent=(s:string)=>s.trim().length>0&&countChars(s)<=20000;
export const titleOf=(s:string)=>s.split('\n').find(x=>x.trim())?.trim()||'새 메모';
export const sortNotes=(a:Note,b:Note)=>Number(b.is_pinned)-Number(a.is_pinned)||b.updated_at.localeCompare(a.updated_at)||a.id.localeCompare(b.id);
export function newNote(user:string):Note {return {id:uuid(),user_id:user,content:'',is_pinned:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),deleted_at:null,version:0,last_operation:uuid()};}
export function parseBackup(value:unknown):{content:string;is_pinned:boolean;deleted_at:string|null;created_at:string}[]{
 const v=value as {format?:string;version?:number;notes?:unknown[]};
 if(!v||v.format!=='my-memo'||v.version!==1||!Array.isArray(v.notes)||v.notes.length>5000)throw new Error('나의 메모 백업 파일인지 확인해 주세요. 최대 5,000개까지 복원할 수 있습니다.');
 return v.notes.map(x=>{const n=x as Partial<Note>;if(typeof n.content!=='string'||!validContent(n.content)||typeof n.is_pinned!=='boolean'||typeof n.created_at!=='string'||!Number.isFinite(Date.parse(n.created_at))||!(n.deleted_at===null||typeof n.deleted_at==='string'&&Number.isFinite(Date.parse(n.deleted_at))))throw new Error('메모 내용이나 날짜 형식이 올바르지 않습니다.');return {content:n.content,is_pinned:n.is_pinned,deleted_at:n.deleted_at,created_at:typeof n.imported_created_at==='string'&&Number.isFinite(Date.parse(n.imported_created_at))?n.imported_created_at:n.created_at};});
}

// A late server acknowledgement advances the version without replacing newer input.
export function mergeAcknowledged(latest:Note,sent:Note,server:Note):Note{return latest.last_operation===sent.last_operation?{...server,dirty:false}:{...latest,version:server.version,created_at:server.created_at,dirty:true};}
