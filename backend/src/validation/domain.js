import { randomUUID, randomInt } from 'node:crypto';
import { hash, canonical, blockers } from './source.js';
export class ValidationError extends Error { constructor(message,status=409){super(message);this.status=status;} }
export function requireThat(ok,message,status=409){if(!ok)throw new ValidationError(message,status);}
const reason = value => {requireThat(typeof value==='string'&&value.trim().length>=15&&value.length<=10000,'Explain the findings or reason in 15–10,000 characters.',422);return value.trim();};
const material = p => ({...p, milestones:p.milestones.map(({payment,...m})=>m)});
export const fingerprint = p => hash(material(p));
export function append(s,actor,event,caseId,data,now) {
  const previousHash=s.audit.at(-1)?.entryHash||'GENESIS';
  const payload={seq:s.audit.length+1,actorId:actor,eventType:event,caseId,eventData:structuredClone(data),createdAt:now,previousHash};
  s.audit.push({...payload,entryHash:hash(payload)});
}
export function integrity(s) {
  let prev='GENESIS';
  for(let i=0;i<s.audit.length;i++) {
    const {entryHash,...payload}=s.audit[i];
    if(payload.seq!==i+1||payload.previousHash!==prev||hash(payload)!==entryHash)return false;
    prev=entryHash;
  }
  for(const r of s.rounds) {
    if(hash(r.snapshot)!==r.snapshotHash)return false;
    if(!s.audit.some(e=>e.eventType==='round_created'&&e.eventData.roundId===r.id&&e.eventData.snapshotHash===r.snapshotHash))return false;
  }
  for(const d of s.decisions) if(!s.audit.some(e=>e.eventType==='decision_submitted'&&e.eventData.decisionId===d.id&&e.eventData.hash===hash(d)))return false;
  for(const a of s.assignments) {
    if(!s.audit.some(e=>e.eventType==='validator_assigned'&&e.eventData.assignmentId===a.id&&e.eventData.validatorId===a.validatorId&&e.eventData.roundId===a.roundId&&e.eventData.kind===a.kind))return false;
  }
  if(s.audit.some(e=>e.eventType==='validator_assigned'&&!s.assignments.some(a=>a.id===e.eventData.assignmentId)))return false;
  if(s.audit.some(e=>e.eventType==='round_created'&&!s.rounds.some(r=>r.id===e.eventData.roundId)))return false;
  if(s.audit.some(e=>e.eventType==='decision_submitted'&&!s.decisions.some(d=>d.id===e.eventData.decisionId)))return false;
  return true;
}
const currentRound=(s,id)=>s.rounds.filter(r=>r.caseId===id).at(-1);
export function visible(s,a,p) {
  return a.role==='admin'||a.role==='department'&&a.organisationId===p.departmentId||a.role==='startup'&&a.organisationId===p.startupId||a.role==='validator'&&s.assignments.some(x=>x.caseId===p.id&&x.validatorId===a.id);
}
function eligible(s,r,registry,kind) {
  const used=s.assignments.filter(a=>a.caseId===r.caseId);
  const excluded=new Set([...r.snapshot.evaluatorIds,...r.snapshot.involvedIds,...used.map(a=>a.validatorId)]);
  const excludedOrgs=new Set([r.snapshot.departmentId,r.snapshot.startupId,...used.map(a=>a.organisationId)]);
  return registry.filter(a=>a.role==='validator'&&a.active&&a.qualified&&!excluded.has(a.id)&&!excludedOrgs.has(a.organisationId)&&!(a.conflicts||[]).includes(r.caseId)&&!s.assignments.some(x=>x.caseId===r.caseId&&x.validatorId===a.id&&x.status==='recused')&&s.assignments.filter(x=>x.validatorId===a.id&&['assigned','reviewing'].includes(x.status)).length<3);
}
function assign(s,r,registry,kind,now,rng) {
  const pool=eligible(s,r,registry,kind);
  if(!pool.length) return null;
  const load=a=>s.assignments.filter(x=>x.validatorId===a.id&&['assigned','reviewing'].includes(x.status)).length;
  const min=Math.min(...pool.map(load)), balanced=pool.filter(a=>load(a)===min);
  const selected=balanced[rng(balanced.length)];
  const a={id:randomUUID(),roundId:r.id,caseId:r.caseId,validatorId:selected.id,organisationId:selected.organisationId,kind,status:'assigned',version:1,createdAt:now,dueAt:new Date(Date.parse(now)+7*86400000).toISOString()};
  s.assignments.push(a);
  append(s,'system','validator_assigned',r.caseId,{assignmentId:a.id,roundId:r.id,kind,validatorId:selected.id,eligiblePool:balanced.map(x=>x.id),policyVersion:r.policy.version},now);
  return a;
}
function createRound(s,p,registry,now,rng) {
  const snapshot=structuredClone(material(p));
  const r={id:randomUUID(),caseId:p.id,snapshot,snapshotHash:hash(snapshot),createdAt:now,policy:{version:1,primaryCount:p.risk==='High'?2:1,sampleBasisPoints:1200,deadlineDays:7,source:'Demo policy; not a statutory percentage'},sample:null,stale:false};
  s.rounds.push(r);append(s,'system','round_created',p.id,{roundId:r.id,snapshotHash:r.snapshotHash,policy:r.policy},now);
  fill(s,r,registry,now,rng);return r;
}
function fill(s,r,registry,now,rng) {
  if(r.stale)return;
  const active=s.assignments.filter(a=>a.roundId===r.id&&!['recused','replaced'].includes(a.status));
  const count=active.filter(a=>a.kind==='primary').length;
  for(let i=count;i<r.policy.primaryCount;i++)if(!assign(s,r,registry,'primary',now,rng))break;
  if(r.sample?.selected&&!active.some(a=>a.kind==='reaudit'))assign(s,r,registry,'reaudit',now,rng);
  if(s.appeals.some(a=>a.roundId===r.id&&a.status==='open')&&!active.some(a=>a.kind==='adjudication'))assign(s,r,registry,'adjudication',now,rng);
}
export function outcome(s,r) {
  if(!r)return 'not_ready';
  if(r.stale)return 'evidence_changed';
  const assignments=s.assignments.filter(a=>a.roundId===r.id&&!['recused','replaced'].includes(a.status)&&a.kind!=='adjudication');
  const primary=assignments.filter(a=>a.kind==='primary');
  const decisions=assignments.map(a=>s.decisions.find(d=>d.assignmentId===a.id)).filter(Boolean);
  const appeal=s.appeals.find(a=>a.roundId===r.id);
  if(appeal?.status==='open')return 'under_appeal';
  if(appeal?.status==='remand')return 'corrections_required';
  if(primary.length<r.policy.primaryCount||primary.some(a=>!s.decisions.some(d=>d.assignmentId===a.id)))return 'review_pending';
  if(new Set(decisions.map(d=>d.result)).size>1)return 'disagreement';
  if(decisions.some(d=>d.result==='rejected'))return 'rejected';
  if(decisions.some(d=>d.result==='corrections'))return 'corrections_required';
  if(!r.sample)return 'sampling_pending';
  if(r.sample.selected&&(!assignments.some(a=>a.kind==='reaudit')||assignments.some(a=>a.kind==='reaudit'&&!s.decisions.some(d=>d.assignmentId===a.id))))return 'reaudit_pending';
  return 'validated';
}
export function sync(s,packets,registry,now=new Date().toISOString(),rng=randomInt) {
  requireThat(integrity(s),'Audit or evidence integrity check failed. Processing is blocked.');
  for(const p of packets) {
    let r=currentRound(s,p.id);
    if(!r&&!blockers(p).length)r=createRound(s,p,registry,now,rng);
    if(!r)continue;
    const stale=fingerprint(p)!==r.snapshotHash;
    if(stale&&!r.stale){r.stale=true;append(s,'system','source_changed',p.id,{roundId:r.id,currentHash:fingerprint(p)},now);}
    if(r.stale)continue;
    fill(s,r,registry,now,rng);
    const primary=s.assignments.filter(a=>a.roundId===r.id&&a.kind==='primary'&&!['replaced','recused'].includes(a.status));
    if(!r.sample&&primary.length===r.policy.primaryCount&&primary.every(a=>s.decisions.find(d=>d.assignmentId===a.id)?.result==='approved')) {
      const draw=rng(10000);r.sample={draw,selected:draw<r.policy.sampleBasisPoints,at:now};
      append(s,'system','audit_sampled',p.id,{roundId:r.id,...r.sample},now);fill(s,r,registry,now,rng);
    }
    for(const a of s.assignments.filter(a=>a.roundId===r.id&&['assigned','reviewing'].includes(a.status)&&a.dueAt<now)) {
      if(!s.notifications.some(n=>n.key===a.id)){
        s.notifications.push({id:randomUUID(),key:a.id,caseId:p.id,assignmentId:a.id,validatorId:a.validatorId,message:'Validation deadline exceeded. Oversight review required; no automatic approval.',at:now});
        append(s,'system','review_overdue',p.id,{assignmentId:a.id},now);
      }
    }
  }
  // Descriptive flags only. Small samples are explicitly excluded.
  const ds=s.decisions.filter(d=>['approved','rejected'].includes(d.result));
  for(const a of registry.filter(a=>a.role==='validator')) {
    for(const risk of ['Low','Medium','High']) {
      const own=ds.filter(d=>d.actorId===a.id&&s.rounds.find(r=>r.id===d.roundId)?.snapshot.risk===risk);
      const peers=ds.filter(d=>d.actorId!==a.id&&s.rounds.find(r=>r.id===d.roundId)?.snapshot.risk===risk);
      if(own.length>=10&&peers.length>=20) {
        const rate=arr=>arr.filter(d=>d.result==='approved').length/arr.length;
        flag(s,`approval:${a.id}:${risk}`,rate(own)>rate(peers)+0.25,{validatorId:a.id,type:'approval_rate_outlier',risk,sampleSize:own.length,peerSize:peers.length,rate:rate(own),peerRate:rate(peers)},now);
      }
      flag(s,`target:${a.id}:${risk}`,own.length>=10&&own.filter(d=>d.checks?.every(c=>c.verifiedValue===s.rounds.find(r=>r.id===d.roundId)?.snapshot.kpis.find(k=>k.key===c.key)?.target)).length/own.length>0.8,{validatorId:a.id,type:'repeated_exact_targets',risk,sampleSize:own.length},now);
    }
    const fast=ds.filter(d=>d.actorId===a.id&&Date.parse(d.at)-Date.parse(s.assignments.find(a=>a.id===d.assignmentId)?.createdAt)<60000);
    flag(s,`speed:${a.id}`,fast.length>=5,{validatorId:a.id,type:'repeated_fast_decisions',sampleSize:fast.length},now);
    const pairs=new Map();
    for(const d of ds.filter(d=>d.actorId===a.id)){const startup=s.rounds.find(r=>r.id===d.roundId)?.snapshot.startupId;pairs.set(startup,(pairs.get(startup)||0)+1);}
    for(const [startup,count]of pairs)flag(s,`pair:${a.id}:${startup}`,count>=5,{validatorId:a.id,type:'repeated_startup_pairing',startupId:startup,sampleSize:count},now);
  }
}
function flag(s,key,condition,data,now){if(condition&&!s.flags.some(f=>f.key===key)){s.flags.push({id:randomUUID(),key,...data,status:'open',at:now});append(s,'system','anomaly_flagged',null,{key,...data},now);}}
export function gate(s,p) {
  const reasons=blockers(p),r=currentRound(s,p.id),state=outcome(s,r);
  if(!integrity(s))reasons.push('Audit integrity failure.');
  if(r&&fingerprint(p)!==r.snapshotHash)reasons.push('Evidence changed; fresh validation required.');
  if(state!=='validated')reasons.push('Validation status: '+state.replaceAll('_',' '));
  return {eligible:reasons.length===0,status:state,reasons,roundId:r?.id||null,synthetic:p.synthetic,meaning:'Eligible for scale-up consideration only; this is not procurement authorisation.'};
}
export function command(s,packets,registry,actor,caseId,action,payload={},now=new Date().toISOString(),rng=randomInt) {
  requireThat(integrity(s),'Audit integrity failure. Writes blocked.');
  const p=packets.find(p=>p.id===caseId);requireThat(p&&visible(s,actor,p),'Case not found.',404);
  const r=currentRound(s,caseId);
  if(action==='appeal') {
    requireThat(['startup','department'].includes(actor.role),'Only the owning startup or department can appeal.',403);
    requireThat(r&&['rejected','disagreement','corrections_required'].includes(outcome(s,{...r,stale:false})),'An adverse decision is required.');
    requireThat(!s.appeals.some(a=>a.roundId===r.id),'One appeal is allowed per review round.');
    const a={id:randomUUID(),roundId:r.id,caseId,status:'open',reason:reason(payload.reason),evidence:reason(payload.evidence),openedBy:actor.id,at:now};s.appeals.push(a);
    append(s,actor.id,'appeal_opened',caseId,a,now);fill(s,r,registry,now,rng);return;
  }
  if(action==='resubmit') {
    requireThat(actor.role==='department','Only the owning department may request a fresh round.',403);
    requireThat(r,'No previous review exists.');
    const prior=outcome(s,{...r,stale:false});
    requireThat(!['rejected','disagreement','under_appeal'].includes(prior),'Resolve the appeal before a fresh review.');
    requireThat(r.stale||prior==='corrections_required','No correction or source change requires a new round.');
    requireThat(!s.assignments.some(a=>a.roundId===r.id&&['assigned','reviewing'].includes(a.status)&&a.kind==='adjudication'),'Adjudication pending.');
    requireThat(!blockers(p).length,'Missing prerequisites: '+blockers(p).join(' '));
    requireThat(fingerprint(p)!==r.snapshotHash,'Submit revised evidence before requesting revalidation.');
    const why=reason(payload.reason);createRound(s,p,registry,now,rng);append(s,actor.id,'revalidation_requested',caseId,{previousRound:r.id,reason:why},now);return;
  }
  if(action==='demo-revise') {
    requireThat(p.synthetic&&actor.role==='department','Synthetic cases only; owning demo department required.',403);
    requireThat(r&&outcome(s,r)==='corrections_required','Request corrections or obtain an appeal remand first.');
    s.demoRevisions[p.id]=(s.demoRevisions[p.id]||1)+1;append(s,actor.id,'synthetic_evidence_revised',caseId,{revision:s.demoRevisions[p.id]},now);return;
  }
  if(action==='review-flag') {
    requireThat(actor.role==='admin','Oversight only.',403);
    const f=s.flags.find(f=>f.id===payload.flagId);requireThat(f&&f.status==='open','Open flag required.');
    requireThat(['reviewed','dismissed'].includes(payload.status),'Choose reviewed or dismissed.',422);
    f.status=payload.status;f.reviewedBy=actor.id;f.reason=reason(payload.reason);f.reviewedAt=now;append(s,actor.id,'flag_reviewed',caseId,{...f},now);return;
  }
  const a=s.assignments.find(a=>a.id===payload.assignmentId&&a.caseId===caseId&&a.roundId===r?.id);
  requireThat(a,'Current assignment not found.',404);
  requireThat(payload.expectedVersion===a.version,'Assignment changed; refresh before continuing.');
  requireThat(['assigned','reviewing'].includes(a.status),'This assignment is already closed.');
  if(action==='propose-replacement'||action==='approve-replacement') {
    requireThat(actor.role==='admin','Oversight only.',403);
    requireThat(a.dueAt<now,'Exceptional replacement is available only after the deadline.');
    if(action==='propose-replacement') {
      requireThat(!s.replacements.some(x=>x.assignmentId===a.id&&x.status==='pending'),'Replacement already proposed.');
      const x={id:randomUUID(),assignmentId:a.id,proposedBy:actor.id,reason:reason(payload.reason),status:'pending',at:now};s.replacements.push(x);append(s,actor.id,'replacement_proposed',caseId,x,now);
    }else{
      const x=s.replacements.find(x=>x.assignmentId===a.id&&x.status==='pending');requireThat(x&&x.proposedBy!==actor.id,'A different oversight administrator must approve.');
      x.status='approved';x.approvedBy=actor.id;x.approvalReason=reason(payload.reason);a.status='replaced';a.version++;append(s,actor.id,'replacement_approved',caseId,{...x},now);fill(s,r,registry,now,rng);
    }return;
  }
  requireThat(actor.role==='validator'&&actor.id===a.validatorId,'Only the assigned validator can act.',403);
  if(action==='recuse') {
    a.status='recused';a.version++;append(s,actor.id,'validator_recused',caseId,{assignmentId:a.id,reason:reason(payload.reason)},now);fill(s,r,registry,now,rng);return;
  }
  if (a.kind !== 'adjudication') {
    requireThat(!r.stale&&fingerprint(p)===r.snapshotHash,'Evidence changed. Request a fresh review.');
    requireThat(!blockers(p).length,'Resolve missing evidence or disputes before a decision.');
  }
  requireThat(!p.evaluatorIds.includes(actor.id)&&!p.involvedIds.includes(actor.id)&&actor.organisationId!==p.departmentId&&actor.organisationId!==p.startupId&&!(actor.conflicts||[]).includes(p.id),'A known conflict blocks this review.',403);
  if(action==='declare') {
    requireThat(payload.noConflict===true,'Confirm no conflict or withdraw from this assignment.',422);
    a.status='reviewing';a.declaredAt=now;a.version++;append(s,actor.id,'conflict_declaration',caseId,{assignmentId:a.id,noConflict:true},now);return;
  }
  requireThat(action==='decide','Unknown action.',404);
  requireThat(a.status==='reviewing'&&a.declaredAt,'Declare independence before reviewing.');
  requireThat(payload.snapshotHash===r.snapshotHash,'Review the current evidence snapshot.');
  requireThat(!s.decisions.some(d=>d.assignmentId===a.id),'A decision already exists.');
  const results=a.kind==='adjudication'?['uphold','remand']:['approved','rejected','corrections'];
  requireThat(results.includes(payload.result),'Invalid decision.',422);
  const findings=reason(payload.reason),evidence=reason(payload.evidence);
  let checks=[];
  if(a.kind!=='adjudication') {
    requireThat(Array.isArray(payload.checks),'Supply findings for each KPI.',422);
    requireThat(payload.checks.length===r.snapshot.kpis.length&&new Set(payload.checks.map(c=>c.key)).size===payload.checks.length,'Exactly one finding per KPI is required.',422);
    checks=r.snapshot.kpis.map(k=> {
      const c=payload.checks.find(c=>c.key===k.key);requireThat(c,'Missing KPI finding.',422);
      requireThat(Number.isFinite(c.verifiedValue),'Record a finite independently checked value.',422);
      const met=k.target>k.baseline?c.verifiedValue>=k.target:c.verifiedValue<=k.target;
      if(payload.result==='approved')requireThat(c.verified===true&&(!k.mandatory||met),'Approval requires verified evidence and every mandatory target met.');
      return {key:k.key,verifiedValue:c.verifiedValue,verified:c.verified===true,targetMet:met,findings:reason(c.findings)};
    });
  }
  const d={id:randomUUID(),assignmentId:a.id,roundId:r.id,caseId,actorId:actor.id,result:payload.result,reason:findings,evidence,checks,snapshotHash:r.snapshotHash,at:now};
  s.decisions.push(d);a.status='decided';a.version++;append(s,actor.id,'decision_submitted',caseId,{decisionId:d.id,hash:hash(d),assignmentId:a.id,result:d.result},now);
  if(a.kind==='adjudication') {
    const appeal=s.appeals.find(x=>x.roundId===r.id&&x.status==='open');requireThat(appeal,'No open appeal.');appeal.status=d.result;appeal.decisionId=d.id;
  }
}
export function view(s,packets,registry,actor) {
  const ok=integrity(s);
  return {actor,mode:'local-demo',integrity:ok,cases:packets.filter(p=>visible(s,actor,p)).map(p=>{
    const r=currentRound(s,p.id),roundAssignments=s.assignments.filter(a=>a.roundId===r?.id),pending=roundAssignments.some(a=>['assigned','reviewing'].includes(a.status)&&a.kind!=='adjudication');
    const privateView=actor.role==='admin';
    const my=roundAssignments.filter(a=>a.validatorId===actor.id);
    const decisions=s.decisions.filter(d=>s.rounds.some(x=>x.id===d.roundId&&x.caseId===p.id)).filter(d=>privateView||actor.role!=='validator'||d.actorId===actor.id||(!pending&&r?.id===d.roundId&&my.some(a=>a.kind==='adjudication'))).map(({actorId,...d})=>privateView?{...d,actorId}:d);
    const assignments=roundAssignments.filter(a=>privateView||actor.role!=='validator'||a.validatorId===actor.id).map(a=>privateView||a.validatorId===actor.id?a:{id:a.id,kind:a.kind,status:a.status,dueAt:a.dueAt});
    const packet=actor.role==='startup'?{id:p.id,title:p.title,startupName:p.startupName,synthetic:p.synthetic,risk:p.risk,notes:p.notes}:p;
    const full=actor.role!=='startup';
    return {packet,gate:gate(s,p),priorOutcome:r?outcome(s,{...r,stale:false}):null,blockers:blockers(p),round:r?{id:r.id,snapshotHash:r.snapshotHash,createdAt:r.createdAt,policy:r.policy,stale:r.stale,...(full?{snapshot:r.snapshot}:{})}:null,assignments,decisions:actor.role==='startup'?decisions.map(d=>({id:d.id,result:d.result,reason:d.reason,at:d.at})):decisions,
      appeals:s.appeals.filter(a=>a.caseId===p.id).map(({openedBy,...a})=>a),
      notifications:s.notifications.filter(n=>n.caseId===p.id&&(actor.role!=='validator'||n.validatorId===actor.id)).map(({validatorId,...n})=>n),
      history:s.rounds.filter(x=>x.caseId===p.id).map(x=>({id:x.id,createdAt:x.createdAt,snapshotHash:x.snapshotHash,status:outcome(s,x),...(['admin','department'].includes(actor.role)?{snapshot:x.snapshot}:{})})),
      audit:privateView?s.audit.filter(e=>e.caseId===p.id):[],flags:privateView?s.flags:[],replacements:privateView?s.replacements.filter(x=>roundAssignments.some(a=>a.id===x.assignmentId)):[]};
  }),checkpoint:actor.role==='admin'?{seq:s.audit.at(-1)?.seq||0,entryHash:s.audit.at(-1)?.entryHash||'GENESIS',note:'Export and retain independently. This application does not provide external anchoring.'}:null};
}
