import { createHash } from 'node:crypto';
export const canonical = value => JSON.stringify(normalize(value));
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, normalize(v[k])]));
  return v;
}
export const hash = v => createHash('sha256').update(canonical(v)).digest('hex');
export const departmentId = name => 'dept-' + createHash('sha256').update(name || 'Unassigned').digest('hex').slice(0,12);
export function accounts(source) {
  const depts = [...new Set((source.challenges || []).map(c => c.dept).filter(Boolean))];
  return [
    ...depts.map(d => ({id:`department:${departmentId(d)}`, name:d+' · Department', role:'department', organisationId:departmentId(d)})),
    ...(source.startups || []).map(s => ({id:`startup:${s.id}`, name:s.name+' · Startup', role:'startup', organisationId:s.id})),
    {id:'department:demo', name:'Demo department · Synthetic examples', role:'department', organisationId:'demo-department'},
    {id:'startup:demo', name:'Demo startup · Synthetic examples', role:'startup', organisationId:'demo-startup'},
    ...Array.from({length:6},(_,i)=>({id:`validator:${i+1}`, name:`Validator ${String.fromCharCode(65+i)} · Demo agency ${i+1}`, role:'validator', organisationId:`agency:${i+1}`, qualified:true, active:true, conflicts:[]})),
    {id:'admin:1', name:'Oversight administrator A · Demo', role:'admin', organisationId:'oversight'},
    {id:'admin:2', name:'Oversight administrator B · Demo', role:'admin', organisationId:'oversight'},
  ];
}
export function packets(source, payment, revisions = {}) {
  const result = (source.contracts || []).map(c => {
    const ch = (source.challenges || []).find(x=>x.id===c.challengeId);
    const linked = (source.pilots || []).filter(p=>p.challengeId===c.challengeId&&p.startupId===c.startupId);
    const p = c.pilotId ? linked.find(p=>p.id===c.pilotId) : linked.length===1 ? linked[0] : null;
    const design = (source.pilotDesigns || []).find(p=>p.challengeId===c.challengeId&&p.startupId===c.startupId);
    const evaluations = (source.evaluations || []).filter(e=>e.challengeId===c.challengeId&&e.startupId===c.startupId);
    const pc = payment.contracts?.find(x=>x.id===c.id);
    const milestones = (c.milestones || []).map(m=> {
      const live = payment.milestones?.find(x=>x.id===m.id&&x.contractId===c.id);
      const submission = payment.submissions?.find(s=>s.id===live?.submissionId);
      const pay = payment.payments?.find(p=>p.milestoneId===m.id);
      return { id:m.id, name:m.name, amount:m.amount, state:live?.state||'missing', acceptedBy:live?.acceptedBy||null,
        criteria:live?.criteria||null, evidence:submission ? {id:submission.id, content:submission.report, contentHash:hash(submission.report), evidenceHash:submission.evidenceHash, attachmentHash:submission.attachment?.sha256||null, collectedAt:submission.submittedAt, collectorId:submission.submittedBy, source:'Feature 8 submission'} : null,
        payment: pay ? {status:pay.status, dueAt:pay.dueAt, mode:pay.mode} : null };
    });
    return { id:c.id, contractId:c.id, pilotId:p?.id||null, pilotDesignId:design?.id||null, challengeId:c.challengeId, startupId:c.startupId,
      startupName:source.startups?.find(s=>s.id===c.startupId)?.name||c.startupId, departmentId:departmentId(ch?.dept), title:ch?.title||c.id,
      risk:ch?.risk||'Unknown', synthetic:false, policyVersion:1, sourceChanged:!!pc?.sourceChanged,
      evaluatorIds:evaluations.map(e=>e.evaluatorId).filter(Boolean), identitiesComplete:evaluations.length>0&&evaluations.every(e=>!!e.evaluatorId),
      involvedIds:[...new Set([...(p?.involvedUserIds||[]), ...milestones.map(m=>m.acceptedBy), ...milestones.map(m=>m.evidence?.collectorId), pc?.approvedBy].filter(Boolean))],
      completed:!!p?.completedAt, kpis:p?.kpis||[], milestones,
      disputes:(payment.disputes||[]).filter(d=>d.contractId===c.id).map(d=>({id:d.id,status:d.status,reason:d.reason,scope:d.scope||'unclassified'})),
      notes:['Source seed contains both real startup entries and demo placeholders. Imported Paid claims are not accepted delivery evidence.'] };
  });
  for (const risk of ['Medium','High']) {
    const id='demo:'+risk.toLowerCase(), revision=revisions[id]||1;
    result.push({id, contractId:id, pilotId:id, challengeId:'demo-challenge', startupId:'demo-startup', startupName:'Synthetic Mobility Pilot', departmentId:'demo-department', title:`${risk} risk · independent validation practice`, risk, synthetic:true, policyVersion:1, revision,
      evaluatorIds:['demo-evaluator'], identitiesComplete:true, involvedIds:['demo-collector','demo-official'], completed:true,
      kpis:[{key:'accuracy',label:'ETA accuracy',unit:'%',baseline:60,target:85,actual:90,mandatory:true,method:'Compare predicted and observed arrival times across 100 synthetic trips.',lockedAt:'2026-01-01T00:00:00Z', evidence:{content:`Synthetic results: 90 of 100 predictions met the tolerance. Revision ${revision}.`, source:'Generated test fixture; not field evidence', collectorId:'demo-collector', collectedAt:'2026-02-01T00:00:00Z'}}],
      milestones:[{id:id+':m1',name:'Synthetic final report',state:'accepted',acceptedBy:'demo-official',criteria:'Submit reproducible measurements',evidence:{content:'Synthetic milestone report', source:'Synthetic fixture', collectorId:'demo-collector',collectedAt:'2026-02-01T00:00:00Z'},payment:{status:'approval_pending', mode:'simulated'}}],disputes:[],notes:['Entire case is synthetic. Decisions never change seed contracts or trigger real payment.']});
  }
  return result;
}
export function blockers(p) {
  const b=[];
  if (!p.pilotId) b.push('Link a unique performance pilot to this contract.');
  if (!p.completed) b.push('Record pilot completion.');
  if (!p.identitiesComplete) b.push('Supply stable person IDs for every original evaluator.');
  if (p.sourceChanged) b.push('Reconcile the changed Feature 8 contract.');
  if (!['Low','Medium','High'].includes(p.risk)) b.push('Record the risk classification.');
  if (!p.kpis.length) b.push('Supply locked KPIs and source evidence.');
  const keys=p.kpis.map(k=>k.key);
  if (new Set(keys).size!==keys.length) b.push('KPI keys must be unique.');
  for (const k of p.kpis) {
    if (![k.baseline,k.target,k.actual].every(Number.isFinite)||k.target===k.baseline) b.push(`${k.label}: valid baseline, target and actual required.`);
    if (!k.key||!k.method||!k.lockedAt||!k.unit||typeof k.mandatory!=='boolean') b.push(`${k.label}: measurement method, unit, mandatory flag and target lock required.`);
    if (!k.evidence?.content||!k.evidence?.source||!k.evidence?.collectorId||!Number.isFinite(Date.parse(k.evidence?.collectedAt))||!Number.isFinite(Date.parse(k.lockedAt))||Date.parse(k.lockedAt)>Date.parse(k.evidence?.collectedAt)) b.push(`${k.label}: dated evidence collected after target locking is required.`);
  }
  if (!p.milestones.length||p.milestones.some(m=>m.state!=='accepted'||!m.acceptedBy||!m.evidence?.content)) b.push('All required milestones need accepted delivery and evidence; imported Paid is unverified.');
  if(p.disputes.some(d=>d.status==='open')) b.push('Resolve open disputes (unclassified disputes are treated as blocking).');
  return b;
}
