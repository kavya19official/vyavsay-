import React, { useEffect, useState } from 'react';
import './validation.css';

async function api(path='',options={}) {
  const response=await fetch('/api/validation'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});
  const body=await response.json();
  if(!response.ok)throw Object.assign(new Error(body.error||'Request failed'),{status:response.status});
  return body;
}
const label=s=>(s||'').replaceAll('_',' ');
const date=s=>s?new Date(s).toLocaleString('en-IN'):'—';
export default function ValidationWorkspace({gateOnly=false,onPayments}) {
  const [accounts,setAccounts]=useState([]),[data,setData]=useState(null),[selected,setSelected]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [reason,setReason]=useState(''),[evidence,setEvidence]=useState(''),[checks,setChecks]=useState({}),[noConflict,setNoConflict]=useState(false);
  const [retry,setRetry]=useState(null);
  const item=data?.cases.find(c=>c.packet.id===selected)||data?.cases[0], actor=data?.actor;
  useEffect(()=>{let live=true;api('/accounts').then(r=>live&&setAccounts(r.accounts)).catch(e=>live&&setError(e.message));api().then(r=>live&&setData(r)).catch(e=>e.status!==401&&live&&setError(e.message));return()=>{live=false;};},[]);
  useEffect(()=>{if(!actor)return;const timer=setInterval(()=>api().then(setData).catch(e=>setError(e.message)),30000);return()=>clearInterval(timer);},[actor?.id]);
  useEffect(()=>{setReason('');setEvidence('');setChecks({});setNoConflict(false);setRetry(null);},[actor?.id,item?.round?.id,item?.packet?.id]);
  async function login(id){if(!id)return;setBusy(true);setError('');try{await api('/session',{method:'POST',body:JSON.stringify({accountId:id})});setData(await api());}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function refresh(){try{setData(await api());setError('');}catch(e){setError(e.message);}}
  async function execute(action,extra={},saved=null){
    const req=saved||{path:`/${encodeURIComponent(item.packet.id)}/${action}`,body:{reason,evidence,...extra},key:crypto.randomUUID()};
    setBusy(true);setError('');
    try{setData(await api(req.path,{method:'POST',headers:{'Idempotency-Key':req.key},body:JSON.stringify(req.body)}));setRetry(null);setReason('');setEvidence('');}
    catch(e){setError(e.message);setRetry(e.status?null:req);}finally{setBusy(false);}
  }
  const mine=item?.assignments.find(a=>a.validatorId===actor?.id&&['assigned','reviewing'].includes(a.status));
  const snapshot=item?.round?.snapshot, kpis=snapshot?.kpis||item?.packet?.kpis||[];
  const act=(action,extra={})=>execute(action,{assignmentId:mine?.id,expectedVersion:mine?.version,...extra});
  function decide(result){act('decide',{result,snapshotHash:item.round.snapshotHash,checks:kpis.map(k=>({key:k.key,verifiedValue:checks[k.key]?.value===''||checks[k.key]?.value===undefined?null:Number(checks[k.key].value),verified:!!checks[k.key]?.verified,findings:checks[k.key]?.findings||''}))});}
  const change=(key,field,value)=>setChecks(old=>({...old,[key]:{...old[key],[field]:value}}));
  return <section className="validation-workspace">
    <header><div className="v-eyebrow">{gateOnly?'VALIDATION → SCALE-UP':'FEATURE 9 · INDEPENDENT VALIDATION'}</div><h1>{gateOnly?'Scale-up readiness':'Independent validation'}</h1><p>Evidence checks, independent reviewers, and a recorded decision for every pilot.</p></header>
    <div className="v-banner"><strong>Local demonstration</strong> · Accounts are freely selectable for testing. Practice cases are synthetic. No government identity verification, real payment, or procurement authorisation is performed.</div>
    <div className="v-toolbar v-card"><label>Demo account<select aria-label="Validation demo account" value={actor?.id||''} disabled={busy} onChange={e=>login(e.target.value)}><option value="">Choose an account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Pilot / contract<select aria-label="Validation case" value={item?.packet.id||''} disabled={!actor||busy} onChange={e=>setSelected(e.target.value)}><option value="" disabled>Choose a case</option>{data?.cases.map(c=><option key={c.packet.id} value={c.packet.id}>{c.packet.synthetic?'PRACTICE · ':'SEED · '}{c.packet.title}</option>)}</select></label>
      <button onClick={refresh} disabled={busy}>Refresh</button></div>
    {error&&<div className="v-error" role="alert">{error}{retry&&<button disabled={busy} onClick={()=>execute(null,{},retry)}>Retry the same request</button>}</div>}
    {data?.workerError&&<div className="v-error">{data.workerError}</div>}
    {data&&!data.integrity&&<div className="v-error">Integrity verification failed. Decisions and scale-up are blocked.</div>}
    {!actor&&<div className="v-card">Choose an account to see its permitted cases. Start with Oversight administrator A to inspect assignments, or Demo department to explore the practice cases.</div>}
    {actor&&!item&&<div className="v-card">No cases are visible to this account. Validators see only assigned cases; startups and departments see their own records.</div>}
    {item&&<>
      <div className="v-grid"><article className="v-card"><span className={'v-tag '+(item.gate.eligible?'v-good':'')}>{label(item.gate.status)}</span><h2>{item.packet.startupName}</h2><p>{item.packet.synthetic?'Synthetic practice case':'Linked source record'} · {item.packet.risk} risk</p><p>{item.gate.meaning}</p>{item.gate.reasons.length>0?<ul>{item.gate.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul>:<p className="v-success">Independent checks complete. Eligible for scale-up consideration.</p>}{onPayments&&!item.packet.synthetic&&<button onClick={onPayments}>Open Payments</button>}</article>
      <article className="v-card"><h2>Automation status</h2><p>Readiness checks, assignments, sampling, and overdue alerts run automatically while the backend is running.</p><p>{item.round?`${item.round.policy.primaryCount} primary reviewer(s) · independent organisations · ${item.round.policy.deadlineDays}-day review deadline`:'Waiting for required source data.'}</p><p>12% re-audit policy is a demo setting. Every selection is recorded once.</p>{item.notifications.map(n=><div className="v-banner" key={n.id}>{n.message}</div>)}</article></div>
      {!gateOnly&&<>
      <div className="v-card"><h2>Review assignments</h2>{!item.assignments.length&&<p>No assignment yet. Complete the prerequisites first.</p>}{item.assignments.map(a=><div className="v-assignment" key={a.id}><div><strong>{label(a.kind)}</strong> · {label(a.status)}{a.validatorId&&<span> · {accounts.find(x=>x.id===a.validatorId)?.name||a.validatorId}</span>}<div className="v-muted">Due {date(a.dueAt)}</div></div>
        {actor.role==='admin'&&['assigned','reviewing'].includes(a.status)&&Date.parse(a.dueAt)<Date.now()&&<div><button disabled={busy} onClick={()=>execute('propose-replacement',{assignmentId:a.id,expectedVersion:a.version})}>Propose replacement</button><button disabled={busy} onClick={()=>execute('approve-replacement',{assignmentId:a.id,expectedVersion:a.version})}>Approve replacement (second admin)</button></div>}</div>)}
        {item.replacements?.filter(x=>x.status==='pending').map(x=><p key={x.id}>Replacement pending separate oversight approval. Reason: {x.reason}</p>)}
      </div>
      {(snapshot||item.packet.kpis)&&<div className="v-card"><h2>Evidence packet</h2>{item.round&&<p className="v-muted">Snapshot {item.round.snapshotHash.slice(0,16)}… · {date(item.round.createdAt)}{item.round.stale?' · Source has changed':''}</p>}
      {kpis.map(k=><div className="v-evidence" key={k.key}><h3>{k.label}</h3><p>Baseline {k.baseline} → Target {k.target} · Claimed {k.actual??'Missing'} {k.unit} · {k.mandatory?'Mandatory':'Supporting'}</p><p>{k.method||'Measurement method missing'}</p><p className="v-muted">Source: {k.evidence?.source||'Missing'} · Collected {date(k.evidence?.collectedAt)}</p><pre>{k.evidence?.content||'No evidence supplied'}</pre>
        {mine?.status==='reviewing'&&mine.kind!=='adjudication'&&<div className="v-kpi-input"><label>Independently checked value<input type="number" step="any" value={checks[k.key]?.value??''} onChange={e=>change(k.key,'value',e.target.value)} /></label><label>Verification findings<textarea value={checks[k.key]?.findings||''} onChange={e=>change(k.key,'findings',e.target.value)} placeholder="Describe the check and its evidence (at least 15 characters)" /></label><label className="v-checkbox"><input type="checkbox" checked={!!checks[k.key]?.verified} onChange={e=>change(k.key,'verified',e.target.checked)} /> I checked the supporting evidence</label></div>}</div>)}
      {!kpis.length&&<p>No KPI evidence supplied.</p>}
      {(snapshot?.milestones||item.packet.milestones||[]).map(m=><details key={m.id}><summary>{m.name} · {label(m.state)}</summary><p>{m.criteria||'Acceptance criteria missing'}</p><pre>{m.evidence?.content||'No accepted evidence'}</pre>{m.evidence?.attachmentHash&&<p>Attachment hash: {m.evidence.attachmentHash}</p>}</details>)}
      <p className="v-muted">File hashes detect replacement; they do not prove the truth of a measurement.</p></div>}
      {item.packet.milestones&&<div className="v-card"><h2>Current payment and dispute context</h2>{item.packet.milestones.map(m=><p key={m.id}>{m.name}: {m.payment?label(m.payment.status):'No payment obligation'} {m.payment?.mode==='simulated'?'(simulated)':''}</p>)}{item.packet.disputes?.length?item.packet.disputes.map(d=><p key={d.id}>{label(d.status)} dispute: {d.reason}</p>):<p>No recorded payment disputes.</p>}<p className="v-muted">Payment settlement is not a prerequisite for validation. Open disputes currently block review conservatively.</p></div>}
      <div className="v-card"><h2>{mine?'Your review':'Actions and follow-up'}</h2>
      <label>Findings / reason<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain your decision, appeal, correction, or oversight action (at least 15 characters)." /></label>
      <label>Evidence references / appeal evidence<textarea value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Identify the records checked, inspection method, or new appeal evidence." /></label>
      {mine&&<><label className="v-checkbox"><input type="checkbox" checked={noConflict} onChange={e=>setNoConflict(e.target.checked)} /> I have no undisclosed personal, financial, employment, or organisational conflict.</label><div className="v-actions"><button disabled={busy||!noConflict||mine.status!=='assigned'} onClick={()=>act('declare',{noConflict})}>Declare independence</button><button disabled={busy} onClick={()=>act('recuse')}>Declare conflict / withdraw</button></div>
        {mine.status==='reviewing'&&<div className="v-actions">{(mine.kind==='adjudication'?['uphold','remand']:['approved','rejected','corrections']).map(result=><button className={result==='approved'?'v-primary':''} key={result} disabled={busy||(item.round.stale&&mine.kind!=='adjudication')} onClick={()=>decide(result)}>{({approved:'Approve validation',rejected:'Reject validation',corrections:'Request corrections',uphold:'Uphold original outcome',remand:'Require fresh independent review'})[result]}</button>)}</div>}</>}
      {['startup','department'].includes(actor.role)&&['rejected','disagreement','corrections_required'].includes(item.priorOutcome)&&<button disabled={busy||item.appeals.length>0} onClick={()=>execute('appeal')}>Submit evidence-backed appeal</button>}
      {actor.role==='department'&&<div className="v-actions">{item.packet.synthetic&&item.gate.status==='corrections_required'&&<button disabled={busy} onClick={()=>execute('demo-revise')}>Create revised synthetic evidence</button>}<button disabled={busy||!item.round||(!item.round.stale&&item.gate.status!=='corrections_required')} onClick={()=>execute('resubmit')}>Request revalidation of updated evidence</button></div>}
      <p className="v-muted">Decisions are final for their assignment. Corrections create a new round; overdue reviews never become automatic approvals.</p></div>
      <div className="v-card"><h2>Recorded findings and appeals</h2>{item.history.filter(h=>h.id!==item.round?.id).map(h=><details key={h.id}><summary>Previous evidence round · {date(h.createdAt)}</summary><p>Snapshot {h.snapshotHash}</p>{h.snapshot&&<pre>{JSON.stringify(h.snapshot,null,2)}</pre>}</details>)}{item.decisions.length?item.decisions.map(d=><details key={d.id}><summary>{label(d.result)} · {date(d.at)}</summary><p>{d.reason}</p>{d.evidence&&<p>Evidence checked: {d.evidence}</p>}{d.checks?.map(c=><p key={c.key}>{c.key}: verified value {c.verifiedValue} · {c.findings}</p>)}</details>):<p>No findings available. Parallel reviewers cannot read each other’s findings before submission.</p>}{item.appeals.map(a=><p key={a.id}>Appeal {a.status}: {a.reason} · {a.evidence}</p>)}</div>
      </>}
      {actor.role==='admin'&&<div className="v-card"><h2>Oversight and audit history</h2><p>Chain: {data.integrity?'Verified':'FAILED'} · {item.history.length} evidence round(s)</p><a href="/api/validation/checkpoint" download>Download audit checkpoint</a><p className="v-muted">Keep checkpoints independently. External anchoring and verified identities are production integrations.</p>{item.flags.length?item.flags.map(f=><div key={f.id}><p>{label(f.type)} · {f.validatorId} · {f.status} · sample {f.sampleSize}</p>{f.status==='open'&&<div className="v-actions"><button disabled={busy} onClick={()=>execute('review-flag',{flagId:f.id,status:'reviewed'})}>Mark investigated</button><button disabled={busy} onClick={()=>execute('review-flag',{flagId:f.id,status:'dismissed'})}>Dismiss with reason</button></div>}</div>):<p>No anomaly flags. Statistical approval-rate checks require at least 10 comparable decisions and 20 peer decisions.</p>}
      <details><summary>Assignment and decision audit trail ({item.audit.length} events)</summary>{item.audit.map(e=><div className="v-event" key={e.seq}><strong>#{e.seq} {label(e.eventType)}</strong><span> · {date(e.createdAt)} · {e.actorId}</span><pre>{JSON.stringify(e.eventData,null,2)}</pre></div>)}</details></div>}
    </>}
  </section>;
}
