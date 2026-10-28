/* 재고 계산과 검증: 화면 및 외부 서비스에 의존하지 않는 공통 모듈 */
(function(root){
'use strict';
const numeric=['price','daily','maxDaily','lead','maxLead','bufferDays','targetDays','annual','orderCost','holding','onOrder'];
const defaults={abcA:80,abcB:95,idleDays:90};
const missing=v=>v===null||v===undefined||v==='';
const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e12;
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
function checkDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
function validateItem(p){
 for(const k of ['id','sku','name','category','unit','location','supplier','method','created'])if(typeof p[k]!=='string'||p[k].length>300)throw Error('품목 문자열 형식이 올바르지 않습니다: '+k);
 if(!p.id||!p.sku.trim()||!p.name.trim()||!p.unit.trim())throw Error('품목코드, 품목명, 단위는 필수입니다.');
 for(const k of numeric)if(p[k]!=null&&!valid(p[k]))throw Error(k+' 값은 0~1조 사이의 숫자여야 합니다.');
 if(!['days','max'].includes(p.method))throw Error('안전재고 계산 방식을 확인해 주세요.');
 if(!checkDate(p.created)||p.created>today())throw Error('등록일을 확인해 주세요.');
 if(!missing(p.lastOut)&&(!checkDate(p.lastOut)||p.lastOut>today()))throw Error('최종 출고일을 확인해 주세요.');
 if(p.maxDaily!=null&&p.daily!=null&&p.maxDaily<p.daily)throw Error('최대 일출고량은 평균 이상이어야 합니다.');
 if(p.maxLead!=null&&p.lead!=null&&p.maxLead<p.lead)throw Error('최대 리드타임은 평균 이상이어야 합니다.');
 if(p.targetDays!=null&&p.lead!=null&&p.targetDays<p.lead)throw Error('목표 보유일수는 평균 리드타임 이상으로 설정해 주세요.');
 if(p.onOrder!=null&&!Number.isSafeInteger(p.onOrder))throw Error('입고 예정 수량은 정수여야 합니다.');
}
function stock(s,id){return s.movements.filter(m=>m.itemId===id).reduce((n,m)=>n+m.delta,0);}
function criteria(p){
 let safety=null,rop=null,target=null,eoq=null;
 if(p.daily!=null){
  if(p.method==='days'&&p.bufferDays!=null)safety=Math.ceil(p.daily*p.bufferDays);
  if(p.method==='max'&&[p.maxDaily,p.maxLead,p.lead].every(v=>v!=null))safety=Math.ceil(Math.max(0,p.maxDaily*p.maxLead-p.daily*p.lead));
  if(safety!=null&&p.lead!=null)rop=Math.ceil(p.daily*p.lead+safety);
  if(safety!=null&&p.targetDays!=null)target=Math.ceil(p.daily*p.targetDays+safety);
 }
 if([p.annual,p.orderCost,p.holding].every(v=>v!=null)&&p.holding>0)eoq=Math.ceil(Math.sqrt(2*p.annual*p.orderCost/p.holding));
 return {safety,rop,target,eoq};
}
function analyze(s,p,day=today()){
 const qty=stock(s,p.id),c=criteria(p),position=qty+(p.onOrder??0);
 let status='확인 필요';
 if(c.safety!=null&&c.rop!=null&&c.target!=null)status=qty<=c.safety?'긴급':qty<=c.rop?'발주 필요':qty>c.target?'과잉':'정상';
 const last=s.movements.filter(m=>m.itemId===p.id&&m.type==='out').map(m=>m.date).concat(p.lastOut?[p.lastOut]:[]).sort().at(-1)||p.created;
 const idle=qty>0&&(Date.parse(day)-Date.parse(last))/86400000>=s.settings.idleDays;
 const recommended=c.rop!=null&&c.target!=null?(position<=c.rop?Math.max(0,Math.ceil(c.target-position)):0):null;
 return {...c,qty,position,status,idle,last,recommended,value:p.price==null?null:qty*p.price,days:p.daily>0?qty/p.daily:null};
}
function abc(s){
 const values=s.items.map(p=>({id:p.id,value:p.daily!=null&&p.price!=null?p.daily*30*p.price:null}));
 const sum=values.reduce((a,v)=>a+(v.value??0),0);let running=0;const result=Object.create(null);
 values.sort((a,b)=>(b.value??-1)-(a.value??-1)||a.id.localeCompare(b.id)).forEach(v=>{if(v.value==null||sum===0){result[v.id]={grade:'—',share:null};return;}const before=running/sum*100;running+=v.value;result[v.id]={grade:v.value===0?'C':before<s.settings.abcA?'A':before<s.settings.abcB?'B':'C',share:v.value/sum*100};});
 return result;
}
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.items)||!Array.isArray(s.movements)||!s.settings)throw Error('지원하지 않는 백업 형식입니다.');
 const {abcA,abcB,idleDays}=s.settings;
 if(!valid(abcA)||!valid(abcB)||abcA<=0||abcA>=abcB||abcB>=100||!Number.isInteger(idleDays)||idleDays<1||idleDays>3650)throw Error('ABC 비율 또는 불용 기준일을 확인해 주세요.');
 const ids=new Set(),skus=new Set();
 for(const p of s.items){validateItem(p);if(ids.has(p.id)||skus.has(p.sku.toUpperCase()))throw Error('중복 품목코드 또는 식별자가 있습니다.');ids.add(p.id);skus.add(p.sku.toUpperCase());}
 const mids=new Set(),balances=Object.create(null);
 for(const m of s.movements){
  if(!m||typeof m.id!=='string'||!m.id||mids.has(m.id)||!ids.has(m.itemId)||!['in','out','adjust','opening'].includes(m.type)||!Number.isSafeInteger(m.delta)||Math.abs(m.delta)>1e12||!checkDate(m.date)||m.date>today()||typeof m.note!=='string'||m.note.length>1000||typeof m.createdAt!=='string')throw Error('입출고 이력 형식 또는 날짜가 올바르지 않습니다.');
  if((['in','opening'].includes(m.type)&&m.delta<0)||(m.type==='out'&&m.delta>=0)||(m.type==='in'&&m.delta===0))throw Error('입출고 수량의 부호가 올바르지 않습니다.');
  mids.add(m.id);balances[m.itemId]=(balances[m.itemId]??0)+m.delta;
  if(balances[m.itemId]<0||balances[m.itemId]>1e12)throw Error('재고가 음수이거나 허용 범위를 넘는 이력입니다.');
 }
 return s;
}
function movement(s,{itemId,type,quantity,date,note=''}){
 if(!s.items.some(p=>p.id===itemId))throw Error('품목을 선택해 주세요.');
 if(!['in','out','adjust'].includes(type)||!Number.isSafeInteger(quantity)||quantity<0||quantity>1e12||(type!=='adjust'&&quantity===0))throw Error('수량을 올바른 정수로 입력해 주세요.');
 if(!checkDate(date)||date>today())throw Error('오늘까지의 유효한 날짜를 입력해 주세요.');
 const qty=stock(s,itemId),delta=type==='out'?-quantity:type==='adjust'?quantity-qty:quantity;
 if(qty+delta<0)throw Error('출고 수량이 현재고를 초과합니다. 현재고: '+qty);
 if(type==='adjust'&&!note.trim())throw Error('재고 조정 사유를 입력해 주세요.');
 return {id:root.crypto?.randomUUID?.()||'m-'+Date.now()+'-'+Math.random(),itemId,type,delta,date,note,createdAt:new Date().toISOString()};
}
function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||cell==='')quoted=!quoted;else throw Error('CSV 따옴표 형식 오류');}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('CSV 따옴표가 닫히지 않았습니다.');row.push(cell);if(row.some(v=>v!==''))rows.push(row);return rows;
}
function csv(rows){return '\uFEFF'+rows.map(r=>r.map(v=>{let t=String(v??'');if(typeof v!=='number'&&/^[\s]*[=+\-@]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}

const columns=['품목코드','품목명','분류','단위','보관장소','거래처','현재고','단가','일평균출고','평균리드타임','완충일수','목표보유일수','최대일출고','최대리드타임','계산방식','입고예정','연간수요','발주비','연간보유비','최종출고일'];
const headerAliases={'품목코드 *':'품목코드','품목명 *':'품목명','단위 *':'단위','현재고 *':'현재고','보관 장소':'보관장소','단가 (원)':'단가','안전재고 방식':'계산방식','일평균 출고량':'일평균출고','평균 리드타임 (일)':'평균리드타임','완충일수 · 일수 방식':'완충일수','최대 일출고량 · 최대 방식':'최대일출고','최대 리드타임 · 최대 방식 (일)':'최대리드타임','목표 보유일수':'목표보유일수','입고 예정 수량':'입고예정','기존 최종 출고일':'최종출고일','연간 수요량':'연간수요','1회 발주 비용 (원)':'발주비','단위당 연간 보유 비용 (원)':'연간보유비'};
// 기본 양식과 사용자가 제공한 화면 항목명 양식을 모두 읽습니다.
function importItemsCSV(s,text){
 const parsed=parseCSV(text);if(parsed.length<2)throw Error('헤더와 품목 행이 필요합니다.');
 const [rawHeaders,...data]=parsed,headers=rawHeaders.map(h=>headerAliases[h.trim()]||h.trim());
 if(new Set(headers).size!==headers.length)throw Error('CSV 열 이름이 중복됩니다.');
 for(const k of ['품목코드','품목명','현재고','단위'])if(!headers.includes(k))throw Error('필수 열 누락: '+k);
 const next=structuredClone(s),keys=['sku','name','category','unit','location','supplier','opening','price','daily','lead','bufferDays','targetDays','maxDaily','maxLead','method','onOrder','annual','orderCost','holding','lastOut'];
 const id=()=>root.crypto?.randomUUID?.()||'id-'+Date.now()+'-'+Math.random().toString(16).slice(2);
 for(let r=0;r<data.length;r++){const values=data[r];try{
  if(values.length!==headers.length)throw Error('열 개수가 맞지 않습니다.');
  const obj={id:id(),created:today()};
  columns.forEach((h,i)=>{const n=headers.indexOf(h),v=n<0?'':values[n].trim(),key=keys[i];if(numeric.includes(key)||key==='opening'){if(v!==''&&!/^\d+(\.\d+)?$/.test(v))throw Error(h+'는 0 이상의 숫자만 입력하세요.');obj[key]=v===''?null:Number(v);}else obj[key]=v;});
  const methods={'일수 방식 (평균 출고 × 완충일)':'days','일수 방식':'days','최대 출고·리드타임 방식':'max','최대 방식':'max'};
  obj.method=methods[obj.method]||obj.method||'days';
  if(obj.opening===null||!Number.isSafeInteger(obj.opening))throw Error('현재고는 필수이며 정수여야 합니다.');
  validateItem(obj);if(next.items.some(p=>p.sku.toUpperCase()===obj.sku.toUpperCase()))throw Error('중복 품목코드: '+obj.sku);
  const opening=obj.opening;delete obj.opening;next.items.push(obj);next.movements.push({id:id(),itemId:obj.id,type:'opening',delta:opening,date:today(),note:'CSV 가져오기 · 초기 재고',createdAt:new Date().toISOString()});
 }catch(e){throw Error(`${r+2}행: ${e.message}`);}}
 return {state:validate(next),count:data.length};
}
const api={numeric,defaults,today,valid,missing,validateItem,validate,stock,criteria,analyze,abc,movement,parseCSV,csv,columns,importItemsCSV};root.InventoryCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
