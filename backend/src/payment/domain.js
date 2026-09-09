import { randomUUID, createHash } from 'node:crypto';
const DAY=86400000;
export class PaymentError extends Error { constructor(message,status=409){super(message);this.status=status;} }
const check=(condition,message,status=409)=>{if(!condition)throw new PaymentError(message,status);};
const id=()=>randomUUID();
export const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
export const nowOf=s=>new Date(Date.now()+s.clockOffsetDays*DAY).toISOString();
const addDays=(when,days)=>new Date(Date.parse(when)+days*DAY).toISOString();
const text=(v,name,min=5,max=3000)=>{check(typeof v==='string'&&v.trim().length>=min&&v.length<=max,`${name} must contain ${min}–${max} characters.`,422);return v.trim();};
function event(s,actor,c,m,action,details={}){s.audit.push({id:id(),contractId:c?.id||null,milestoneId:m?.id||null,actorId:actor.id,actorName:actor.name,role:actor.role,action,at:nowOf(s),details});}
function notify(s,c,m,type,message,key){if(!s.notifications.some(n=>n.dedupeKey===key))s.notifications.push({id:id(),contractId:c.id,milestoneId:m?.id||null,type,message,dedupeKey:key,createdAt:nowOf(s),channel:'in-app',deliveryStatus:'available',acknowledgedAt:null});}
const system={id:'system',name:'Payment system',role:'system'};
export const canSee=(a,c)=>a.role==='reviewer'||(a.role==='startup'?a.organisationId===c.startupId:a.organisationId===c.departmentId);
function permission(actor,c,roles){check(roles.includes(actor.role)&&canSee(actor,c),'This account is not authorised for this action.',403);}
function requireCurrent(m,p){check(Number.isInteger(p.expectedVersion)&&p.expectedVersion===m.version,'This record changed. Refresh and review the latest version.');}
function paymentFor(s,m){return s.payments.find(p=>p.milestoneId===m.id);}
function currentSubmission(s,m){return s.submissions.find(x=>x.id===m.submissionId);}
function outstandingDisputes(s,m){return s.disputes.filter(d=>d.milestoneId===m.id&&d.status==='open');}
function sourceShape(c){return {challengeId:c.challengeId,startupId:c.startupId,budgetAmount:c.budgetAmount,milestones:c.milestones.map(m=>({id:m.id,name:m.name,amount:m.amount,dueDate:m.dueDate}))};}
function toPaise(amount){return typeof amount==='number'&&Number.isFinite(amount)&&Number.isSafeInteger(Math.round(amount*100))&&amount>0?Math.round(amount*100):null;}
export function syncSource(s,source){
  for(const raw of source.contracts||[]){
    const challenge=source.challenges.find(c=>c.id===raw.challengeId), startup=source.startups.find(x=>x.id===raw.startupId);
    if(!challenge||!startup||!Array.isArray(raw.milestones))continue;
    const fp=hash(sourceShape(raw)), existing=s.contracts.find(c=>c.id===raw.id);
    if(existing){existing.sourceChanged=existing.sourceHash!==fp;continue;}
    const pilot=(source.pilotDesigns||[]).find(p=>p.challengeId===raw.challengeId&&p.startupId===raw.startupId);
    const c={id:raw.id,version:1,sourceHash:fp,sourceChanged:false,challengeId:raw.challengeId,challengeTitle:challenge.title,startupId:startup.id,startupName:startup.name,startupSource:startup.source||'Unspecified',departmentId:'dept-'+hash(challenge.dept||'Unassigned').slice(0,12),departmentName:challenge.dept||'Unassigned',pilotId:pilot?.id||null,scope:pilot?.scopeLabel||'Not supplied',amountPaise:toPaise(raw.budgetAmount),fundingPaise:0,state:'setup_required',policy:null,importedCommittedPaise:0,createdAt:nowOf(s),mode:'demo'};
    s.contracts.push(c);
    for(const rawM of raw.milestones){
      const historical=rawM.status==='Paid', amountPaise=toPaise(rawM.amount);
      if(historical)c.importedCommittedPaise+=amountPaise||0;
      s.milestones.push({id:rawM.id,contractId:c.id,name:rawM.name,amountPaise,deliveryDueAt:rawM.dueDate,importedStatus:rawM.status,criteria:'',state:historical?'imported_history':'awaiting_submission',version:1,submissionId:null,firstSubmittedAt:null,reviewDueAt:null,decision:null,acceptedAt:null,acceptedBy:null,independentRequired:false,independentReview:null});
    }
    event(s,system,c,null,'Seed contract imported',{source:'seed/store v3',note:'Source Paid claims are unverified history and reserved against the ceiling.'});
  }
}
export function accountsFor(source){
 const departments=new Map((source.challenges||[]).map(c=>['dept-'+hash(c.dept||'Unassigned').slice(0,12),c.dept||'Unassigned']));
 return [
  ...(source.startups||[]).map(s=>({id:'startup:'+s.id,organisationId:s.id,role:'startup',name:s.name+' · Startup'})),
  ...[...departments].flatMap(([organisationId,name])=>[{id:'department:'+organisationId,organisationId,role:'department',name:name+' · Department reviewer'},{id:'finance:'+organisationId,organisationId,role:'finance',name:name+' · Finance'}]),
  {id:'reviewer:1',organisationId:'independent-demo-pool',role:'reviewer',name:'Independent reviewer A · Demo'},
  {id:'reviewer:2',organisationId:'independent-demo-pool',role:'reviewer',name:'Independent reviewer B · Demo'}
 ];
}
export function deadlineCheck(s){
 const now=nowOf(s);
 for(const m of s.milestones){const c=s.contracts.find(c=>c.id===m.contractId);
  if(m.reviewDueAt&&now>m.reviewDueAt&&!m.acceptedAt&&!['imported_history','rejected'].includes(m.state))notify(s,c,m,'review_overdue','Delivery review is overdue. Original submission age is retained.',`review:${m.id}:${m.reviewDueAt}`);
  const p=paymentFor(s,m);
  if(p&&p.status!=='paid'&&now>p.dueAt)notify(s,c,m,'payment_overdue','Payment is overdue; finance follow-up required.',`payment:${p.id}:${p.dueAt}`);
 }
 for(const d of s.disputes.filter(d=>d.status==='open'&&now>d.responseDueAt)){const m=s.milestones.find(m=>m.id===d.milestoneId),c=s.contracts.find(c=>c.id===m.contractId);notify(s,c,m,'dispute_overdue','Independent dispute response is overdue.',`dispute:${d.id}`);}
 s.lastDeadlineCheck=now;
}
export function command(s,source,actor,targetId,action,payload={}){
 syncSource(s,source);
 const c=s.contracts.find(c=>c.id===targetId)||s.contracts.find(c=>c.id===s.milestones.find(m=>m.id===targetId)?.contractId);
 check(c&&canSee(actor,c),'Record not found.',404);
 const m=s.milestones.find(m=>m.id===targetId); const now=nowOf(s);
 check(!c.sourceChanged||['dispute','resolve-dispute','escalate'].includes(action),'The source contract changed. Reconcile the amendment before continuing.');
 if(action==='configure'){
  permission(actor,c,['department']);check(c.state==='setup_required','Contract terms are already locked.');
  check(c.amountPaise&&s.milestones.filter(m=>m.contractId===c.id).every(m=>m.amountPaise),'Source contract has missing or invalid amounts.',422);
  check(s.milestones.filter(m=>m.contractId===c.id).reduce((n,m)=>n+m.amountPaise,0)===c.amountPaise,'Milestone amounts must equal the approved contract budget.');
  check(Number.isInteger(payload.reviewDays)&&payload.reviewDays>=1&&payload.reviewDays<=30,'Review deadline must be 1–30 calendar days.',422);
  check(Number.isInteger(payload.paymentDays)&&payload.paymentDays>=1&&payload.paymentDays<=90,'Payment deadline must be 1–90 calendar days.',422);
  for(const item of s.milestones.filter(m=>m.contractId===c.id&&m.state!=='imported_history')){item.criteria=text(payload.criteria?.[item.id],'Acceptance condition',20);item.independentRequired=!!payload.independent?.[item.id];item.version++;}
  c.policy={version:1,reviewDays:payload.reviewDays,paymentDays:payload.paymentDays,dayBasis:'calendar',timezone:'UTC',trigger:'later of accepted delivery and valid invoice receipt',source:'Explicit demo policy, not a statutory rule'};
  c.state='approved_demo';c.approvedBy=actor.id;c.approvedAt=now;c.fundingPaise=c.amountPaise;c.version++;
  event(s,actor,c,null,'Demo contract terms approved',{policy:c.policy});return;
 }
 if(action==='funding'){
  permission(actor,c,['finance']);check(c.state==='approved_demo','Approve contract terms first.');
  check(Number.isSafeInteger(payload.fundingPaise)&&payload.fundingPaise>=0&&payload.fundingPaise<=c.amountPaise,'Funding must be between zero and the contract ceiling.',422);
  const committed=c.importedCommittedPaise+s.payments.filter(p=>p.contractId===c.id&&p.reserved).reduce((n,p)=>n+p.amountPaise,0);
  check(payload.fundingPaise>=committed,'Cannot reduce funding below existing commitments.');c.fundingPaise=payload.fundingPaise;c.version++;event(s,actor,c,null,'Simulated funding allocation updated',{fundingPaise:c.fundingPaise});return;
 }
 check(m,'Milestone not found.',404);requireCurrent(m,payload);
 const pay=paymentFor(s,m);const sub=currentSubmission(s,m);
 if(action==='submit'){
  permission(actor,c,['startup']);check(c.state==='approved_demo','Department must approve the demo acceptance conditions first.');
  check(['awaiting_submission','correction_requested'].includes(m.state),'This milestone cannot accept another submission now.');
  check(payload.confirmed===true,'Confirm that this is a demo submission.',422);
  const invoiceNumber=text(payload.invoiceNumber,'Invoice reference',1,80), invoiceDate=text(payload.invoiceDate,'Invoice date',10,10);
  check(/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)&&Number.isFinite(Date.parse(invoiceDate))&&new Date(invoiceDate).toISOString().slice(0,10)===invoiceDate&&invoiceDate<=now.slice(0,10),'Invoice date must be valid and not in the future.',422);
  check(payload.amountPaise===m.amountPaise,'Invoice amount must match the approved milestone. Partial invoices are not supported.',422);
  const report=text(payload.report,'Evidence description',20,50000);
  let attachment=null;
  if(payload.attachment){const a=payload.attachment;check(['application/pdf','text/plain'].includes(a.type),'Only PDF and plain-text attachments are accepted.',422);check(typeof a.base64==='string'&&/^[A-Za-z0-9+/]*={0,2}$/.test(a.base64),'Invalid attachment encoding.',422);const b=Buffer.from(a.base64,'base64');check(b.length>0&&b.length<=1000000,'Attachment must be at most 1 MB.',422);if(a.type==='application/pdf')check(b.subarray(0,5).toString()==='%PDF-','The file is not a PDF.',422);attachment={name:text(a.name,'File name',1,120).replace(/[^a-zA-Z0-9_. -]/g,'_'),type:a.type,base64:b.toString('base64'),sha256:hash(b.toString('base64')),size:b.length};}
  const identity=c.startupId+':'+invoiceDate.slice(0,4)+':'+invoiceNumber.trim().toUpperCase().replace(/\s+/g,'');
  const existing=s.invoices.find(i=>i.identity===identity);
  check(!existing||existing.milestoneId===m.id,'This supplier invoice is already linked to another milestone.');
  check(!sub||s.invoices.find(i=>i.id===sub.invoiceId).identity===identity,'Keep the original invoice number and year for corrections.');
  const invoice=existing||{id:id(),identity,milestoneId:m.id,supplierId:c.startupId,number:invoiceNumber,originalReceivedAt:now};if(!existing)s.invoices.push(invoice);
  const fingerprint=hash({report,attachmentHash:attachment?.sha256||null});
  const duplicateEvidence=s.submissions.some(x=>x.milestoneId!==m.id&&x.evidenceHash===fingerprint);
  const submission={id:id(),milestoneId:m.id,contractId:c.id,invoiceId:invoice.id,invoiceNumber,invoiceDate,amountPaise:m.amountPaise,report,attachment,evidenceHash:fingerprint,duplicateEvidence,version:s.submissions.filter(x=>x.milestoneId===m.id).length+1,submittedAt:now,submittedBy:actor.id};
  s.submissions.push(submission);m.submissionId=submission.id;m.state='department_review';m.independentReview=null;m.firstSubmittedAt ||=now;m.reviewDueAt ||=addDays(m.firstSubmittedAt,c.policy.reviewDays);m.version++;
  event(s,actor,c,m,'Invoice and evidence submitted',{submissionId:submission.id,version:submission.version,duplicateEvidence});
  if(duplicateEvidence)notify(s,c,m,'evidence_reuse','Identical evidence appears on another milestone. Reviewer must explain its relevance.',`evidence:${submission.id}`);
  if(submission.version>=3)notify(s,c,m,'repeated_corrections','Three or more submission versions require supervisor attention.',`corrections:${m.id}`);
 }else if(action==='review'){
  permission(actor,c,['department']);check(m.state==='department_review','Submission is not awaiting department review.');
  check(sub&&sub.submittedBy!==actor.id,'Cannot review your own submission.');check(payload.evidenceHash===sub.evidenceHash,'The evidence version changed. Review again.');
  const reason=text(payload.reason,'Review findings',10),decision=payload.decision;
  check(['accept','correct','reject'].includes(decision),'Choose accept, correction, or reject.',422);
  if(decision==='accept'){
   check(payload.invoiceValid===true,'Confirm invoice validity before acceptance.',422);
   check(payload.criteriaMet===true,'Confirm the acceptance criteria were met.',422);
   if(sub.duplicateEvidence)text(payload.reuseReason,'Evidence reuse explanation',15);
   if(m.independentRequired)check(m.independentReview?.submissionId===sub.id&&m.independentReview?.decision==='pass','Independent evidence check is required before acceptance.');
   check(!pay,'A payment obligation already exists.');
   m.state='accepted';m.acceptedAt=now;m.acceptedBy=actor.id;
   s.payments.push({id:id(),milestoneId:m.id,contractId:c.id,submissionId:sub.id,invoiceId:sub.invoiceId,amountPaise:m.amountPaise,currency:'INR',deductionsPaise:0,status:'approval_pending',createdAt:now,dueAt:addDays(new Date(Math.max(Date.parse(now),Date.parse(sub.submittedAt))).toISOString(),c.policy.paymentDays),originalInvoiceReceivedAt:s.invoices.find(i=>i.id===sub.invoiceId).originalReceivedAt,policyVersion:c.policy.version,approvedAt:null,paidAt:null,reserved:false,fundingHold:false,mode:'simulated'});
  }else m.state=decision==='correct'?'correction_requested':'rejected';
  m.decision={decision,reason,actorId:actor.id,at:now,submissionId:sub.id,reuseReason:payload.reuseReason||null};m.version++;
  event(s,actor,c,m,'Department '+decision,{reason,submissionId:sub.id});
 }else if(action==='independent-review'){
  permission(actor,c,['reviewer']);check(m.state==='department_review'&&m.independentRequired,'No independent pre-payment check is required here.');
  check(actor.id!==sub.submittedBy&&actor.id!==c.approvedBy,'Reviewer was involved in the decision.');check(payload.noConflict===true,'Declare no conflict of interest.',422);
  check(payload.evidenceHash===sub.evidenceHash,'Evidence changed.');check(['pass','fail'].includes(payload.decision),'Select pass or fail.',422);
  m.independentReview={submissionId:sub.id,reviewerId:actor.id,decision:payload.decision,reason:text(payload.reason,'Independent findings',15),at:now};m.version++;event(s,actor,c,m,'Independent evidence '+payload.decision,{reason:m.independentReview.reason});
 }else if(action==='approve'){
  permission(actor,c,['finance']);check(pay?.status==='approval_pending','Payment is not awaiting finance approval.');
  check(actor.id!==m.acceptedBy&&actor.id!==sub.submittedBy,'Separate finance approval is required.');check(outstandingDisputes(s,m).length===0,'Resolve the open dispute before approval.');
  check(payload.confirmed===true,'Confirm the approved amount and demo payee.',422);
  const committed=c.importedCommittedPaise+s.payments.filter(p=>p.contractId===c.id&&p.reserved).reduce((n,p)=>n+p.amountPaise,0);
  check(committed+pay.amountPaise<=c.amountPaise,'Contract budget exceeded.');
  if(committed+pay.amountPaise>c.fundingPaise){pay.fundingHold=true;m.version++;notify(s,c,m,'funding_hold','Accepted payment is awaiting sufficient simulated funding.',`funding:${pay.id}`);event(s,actor,c,m,'Funding hold recorded');return;}
  pay.fundingHold=false;pay.reserved=true;pay.status='approved';pay.approvedAt=now;pay.approvedBy=actor.id;pay.payeeReference='SIMULATED:'+c.startupId;m.version++;event(s,actor,c,m,'Finance approved',{amountPaise:pay.amountPaise});
 }else if(action==='initiate'){
  permission(actor,c,['finance']);check(pay&&['approved','failed'].includes(pay.status),'Payment cannot be initiated in its current state.');check(outstandingDisputes(s,m).length===0,'Resolve the open dispute before initiating payment.');
  check(pay.reserved&&!pay.fundingHold,'Approved funding reservation required.');check(!s.attempts.some(a=>a.paymentId===pay.id&&['processing','unknown'].includes(a.status)),'Reconcile the existing payment attempt before retrying.');
  const a={id:id(),paymentId:pay.id,milestoneId:m.id,contractId:c.id,status:'processing',idempotencyKey:id(),amountPaise:pay.amountPaise,payeeReference:pay.payeeReference,createdAt:now,events:[],mode:'simulated'};
  s.attempts.push(a);pay.status='processing';m.version++;event(s,actor,c,m,'Simulated payment initiated',{attemptId:a.id});
 }else if(action==='simulate'){
  permission(actor,c,['finance']);const a=s.attempts.find(a=>a.id===payload.attemptId&&a.paymentId===pay?.id);check(a&&['processing','unknown'].includes(a.status),'No unresolved attempt exists.');
  check(['success','failure','timeout'].includes(payload.outcome),'Invalid simulator outcome.',422);check(a.mode==='simulated'&&pay.mode==='simulated','Simulator is disabled for live payments.');
  check(!(a.status==='unknown'&&payload.outcome==='timeout'),'This attempt is already awaiting reconciliation.');
  a.events.push({id:id(),outcome:payload.outcome,at:now});a.status=payload.outcome==='success'?'settled':payload.outcome==='failure'?'failed':'unknown';a.updatedAt=now;
  pay.status=payload.outcome==='success'?'paid':payload.outcome==='failure'?'failed':'status_unknown';
  if(pay.status==='paid'){pay.paidAt=now;pay.transactionReference='SIM-'+a.id;}
  m.version++;event(s,actor,c,m,payload.outcome==='timeout'?'Payment outcome unknown':payload.outcome==='failure'?'Payment confirmed failed (simulated)':'Settlement confirmed (simulated)',{attemptId:a.id});
 }else if(action==='dispute'){
  permission(actor,c,['startup','department','finance']);check(m.firstSubmittedAt,'Submit a milestone before raising a dispute.');check(!outstandingDisputes(s,m).length,'A dispute is already open.');
  const involved=new Set(s.audit.filter(e=>e.milestoneId===m.id).map(e=>e.actorId));
  const reviewers=accountsFor(source).filter(a=>a.role==='reviewer'&&!involved.has(a.id));check(reviewers.length,'Independent reviewer assignment required.');
  const reviewer=reviewers[s.disputes.length%reviewers.length];
  const d={id:id(),contractId:c.id,milestoneId:m.id,openedBy:actor.id,reason:text(payload.reason,'Dispute reason',15),status:'open',assignedTo:reviewer.id,assignedName:reviewer.name,openedAt:now,responseDueAt:addDays(now,3),resolution:null};s.disputes.push(d);m.version++;
  event(s,actor,c,m,'Dispute opened',{disputeId:d.id,reason:d.reason});notify(s,c,m,'dispute','Independent review assigned to '+reviewer.name,`opened:${d.id}`);
 }else if(action==='resolve-dispute'){
  permission(actor,c,['reviewer']);const d=s.disputes.find(d=>d.id===payload.disputeId&&d.milestoneId===m.id&&d.status==='open');check(d&&d.assignedTo===actor.id,'Only the assigned independent reviewer can resolve this dispute.',403);check(payload.noConflict===true,'Declare no conflict of interest.',422);
  check(['uphold','reopen'].includes(payload.decision),'Choose uphold or reopen.',422);
  if(payload.decision==='reopen'){check(!pay,'Accepted payment terms cannot be rewritten through a dispute.');check(['rejected','correction_requested','department_review'].includes(m.state),'This review cannot be reopened.');m.state='correction_requested';}
  d.status='resolved';d.resolution={decision:payload.decision,reason:text(payload.reason,'Resolution findings',15),actorId:actor.id,at:now};m.version++;event(s,actor,c,m,'Dispute resolved',{disputeId:d.id,...d.resolution});
 }else if(action==='escalate'){
  permission(actor,c,['startup','department','finance','reviewer']);const reason=text(payload.reason,'Escalation reason',10);notify(s,c,m,'manual_escalation',reason,`manual:${m.id}:${hash(reason)}`);event(s,actor,c,m,'Manual escalation',{reason});m.version++;
 }else throw new PaymentError('Unknown action.',404);
 deadlineCheck(s);
}
export function view(s,actor){
 const now=nowOf(s),contracts=s.contracts.filter(c=>canSee(actor,c));const visible=new Set(contracts.map(c=>c.id));
 const milestones=s.milestones.filter(m=>visible.has(m.contractId)).map(m=>({...m,submission:currentSubmission(s,m)?{...currentSubmission(s,m),attachment:currentSubmission(s,m).attachment?{...currentSubmission(s,m).attachment,base64:undefined}:null}:null,payment:paymentFor(s,m)||null,attempts:s.attempts.filter(a=>a.milestoneId===m.id),disputes:s.disputes.filter(d=>d.milestoneId===m.id),history:s.audit.filter(a=>a.milestoneId===m.id||a.contractId===m.contractId&&!a.milestoneId),reviewOverdue:!!m.reviewDueAt&&now>m.reviewDueAt&&!m.acceptedAt&&!['rejected','imported_history'].includes(m.state),paymentOverdue:!!paymentFor(s,m)&&paymentFor(s,m).status!=='paid'&&now>paymentFor(s,m).dueAt,daysPending:m.firstSubmittedAt?Math.floor((Date.parse(paymentFor(s,m)?.paidAt||now)-Date.parse(m.firstSubmittedAt))/DAY):0}));
 const payments=milestones.map(m=>m.payment).filter(Boolean), paid=payments.filter(p=>p.status==='paid');
 const d=new Date(now),quarterStart=Date.UTC(d.getUTCFullYear(),Math.floor(d.getUTCMonth()/3)*3,1),quarterEnd=Date.UTC(d.getUTCFullYear(),Math.floor(d.getUTCMonth()/3)*3+3,1);
 const notifications=s.notifications.filter(n=>visible.has(n.contractId));
 return {actor,mode:'local-demo',now,clockOffsetDays:s.clockOffsetDays,lastDeadlineCheck:s.lastDeadlineCheck,contracts,milestones,notifications,summary:{paidThisQuarterPaise:paid.filter(p=>Date.parse(p.paidAt)>=quarterStart&&Date.parse(p.paidAt)<quarterEnd).reduce((n,p)=>n+p.amountPaise,0),pendingPaise:payments.filter(p=>p.status!=='paid').reduce((n,p)=>n+p.amountPaise,0),overduePaise:milestones.filter(m=>m.paymentOverdue).reduce((n,m)=>n+m.payment.amountPaise,0),delayedReviews:milestones.filter(m=>m.reviewOverdue).length,averageDaysToPay:paid.length?paid.reduce((n,p)=>n+(Date.parse(p.paidAt)-Date.parse(p.originalInvoiceReceivedAt))/DAY,0)/paid.length:null,settledCount:paid.length,importedHistoryPaise:contracts.reduce((n,c)=>n+c.importedCommittedPaise,0)}};
}
