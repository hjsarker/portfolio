/* Interactive, sanitized experience walkthroughs.
 * HRC is an illustrative reconstruction of the user's described work, not
 * an employer-authorized network diagram or evidence from a live system.
 * All other employer views are explicitly marked as previews.
 */
(() => {
  'use strict';
  const modal = document.getElementById('experience-explorer');
  if (!modal) return;
  const panel = modal.querySelector('.experience-explorer-panel');
  const content = document.getElementById('exp-content');
  const tabs = document.getElementById('exp-tabs');
  const heading = document.getElementById('exp-modal-title');
  const eyebrow = document.getElementById('exp-modal-eyebrow');
  const subtitle = document.getElementById('exp-modal-subtitle');
  const companies = {
    rwe: {
      name: 'RWE Renewables',
      role: 'IT/OT Operations & Project Support',
      focus: 'IT/OT operations and governance',
      topics: ['System ownership and interfaces', 'Architecture documentation', 'Jira follow-ups and knowledge management'],
      note: 'An appropriately generalized workflow view can explain responsibilities without showing sensitive operational technology infrastructure.'
    },
    vaillant: {
      name: 'Vaillant Group',
      role: 'IT Process Analyst',
      focus: 'Process architecture and governance',
      topics: ['ARIS / BPMN process models', 'IT4IT process alignment', 'Repository quality and process ownership'],
      note: 'A future example could show a fictionalized process model, rather than any internal repository or confidential documentation.'
    },
    eon: {
      name: 'E.ON Digital Technology',
      role: 'Digital Workplace Support Analyst',
      focus: 'Digital workplace migration',
      topics: ['COMPASS / Unily migration flow', 'Jira issues and UAT coordination', 'Data validation and documentation'],
      note: 'A future illustration can follow a sample migration ticket from preparation to validation, without exposing internal intranet content.'
    },
    tke: {
      name: 'TK Elevator',
      role: 'Data Analyst / BI Platform Support',
      focus: 'Business intelligence platform operations',
      topics: ['Databricks / Spark SQL', 'Power BI reporting support', 'IoT data quality investigations'],
      note: 'A future data-flow illustration can use synthetic data to show platform support, validation, and reporting workflows.'
    },
    hrc: {
      name: 'HRC Technologies Limited',
      role: 'IT & Billing Administrator → Senior IT & Billing Administrator',
      focus: 'Telecom billing systems and infrastructure support'
    },
    yes: {
      name: 'YES Private Ltd.',
      role: 'IT Officer',
      focus: 'Office IT infrastructure and user support',
      topics: ['Desktop and endpoint support', 'Local network troubleshooting', 'Device lifecycle and vendor coordination'],
      note: 'A future walkthrough can demonstrate a small office support workflow using entirely fictional equipment and user accounts.'
    }
  };
  const components = [
    {id:'cdr',group:0,title:'Call detail records',detail:'CDR input and validation',subtitle:'Telecom usage data',mine:true,
      description:'Call detail records were the source data for billing checks. My work included investigating discrepancies in record counts and call durations across application views and reports.',
      actions:['Compare source and processed counts','Check call-duration or rating discrepancies','Document evidence for the relevant resolver']},
    {id:'validation',group:0,title:'Billing validation',detail:'Record and invoice checks',subtitle:'Operational controls',mine:true,
      description:'I used SQL queries and reporting checks to investigate billing mismatches and reconcile figures before escalating unresolved data issues.',
      actions:['Inspect mismatching totals','Reconcile records with reports','Follow up on disputed outputs']},
    {id:'app',group:1,title:'Billing applications',detail:'Application support',subtitle:'Telecom billing software',mine:true,
      description:'I supported billing application availability and incidents, monitored the behavior seen by users and coordinated fixes and vendor delivery as part of the IT and billing support team.',
      actions:['Investigate frontend and backend mismatches','Check application service health','Support testing and production readiness']},
    {id:'redhat',group:1,title:'Red Hat Linux / Tomcat',detail:'Linux-hosted services',subtitle:'Application-level operations',mine:true,
      description:'I connected to relevant Red Hat servers using SSH, reviewed approved application and system logs, and performed controlled application service restarts when appropriate.',
      actions:['Review Tomcat and application logs','Inspect relevant /var/log entries','Restart approved services and recheck health']},
    {id:'oracle',group:2,title:'Oracle / Microsoft SQL',detail:'Database-backed investigations',subtitle:'SQL investigation, not DBA ownership',mine:true,
      description:'I queried Oracle and Microsoft SQL Server data for operational checks, record matching, reporting and billing discrepancies. Database administration and deeper database failures belonged to the DBA team.',
      actions:['Run read-only diagnostic SQL queries','Validate data against billing results','Escalate missing data or DBA-level faults']},
    {id:'solaris',group:2,title:'Sun / Solaris',detail:'Specialist-managed infrastructure',subtitle:'Environment context, not my administration remit',mine:false,
      description:'Sun hardware and Solaris formed part of the wider telecom environment. My role was application and billing support, not Solaris administration or direct ownership of these hosts.',
      actions:['Understand dependencies and symptoms','Provide diagnostic evidence to specialists','Coordinate incidents with the responsible administrators']}
  ];
  const steps = [
    {title:'Identify',eyebrow:'01 / SYMPTOM',
      body:'A billing operator reports that call records or billed totals do not match between application views and reports.',
      evidence:['Capture the affected workflow and time window','Confirm what users see and which totals differ','Check whether the issue affects one view or several']},
    {title:'Investigate',eyebrow:'02 / INVESTIGATION',
      body:'Check application health and relevant logs, then compare the affected CDR counts, durations or totals using SQL and reporting evidence.',
      evidence:['Review Tomcat and relevant Linux application logs','Use Oracle or Microsoft SQL queries for reconciliation','Separate application, data, and network symptoms']},
    {title:'Resolve / escalate',eyebrow:'03 / ACTION',
      body:'Apply an approved application-side fix when appropriate, or route a specialist issue to the right DBA, NOC, senior colleague or software vendor.',
      evidence:['Follow documented service recovery procedures','Pass database findings to DBA specialists','Escalate connectivity issues to the network operations team']},
    {title:'Verify',eyebrow:'04 / FOLLOW-UP',
      body:'Repeat the original check, confirm application availability and matching outputs, and document the resolution or remaining follow-up.',
      evidence:['Recheck application and reporting results','Record findings and support communications','Confirm recovery or next owner for outstanding work']}
  ];
  const escapeText = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let current='hrc', currentTab='system', currentNode='app', currentStep=0, lastFocus=null;
  function renderNodeDetails() {
    const node = components.find(item=>item.id===currentNode) || components[0];
    const target = document.getElementById('exp-node-details');
    if (!target) return;
    target.innerHTML =
      '<div class="exp-node-detail-kicker">'+(node.mine?'MY SUPPORT / INVESTIGATION WORK':'SPECIALIST-OWNED ENVIRONMENT')+'</div>'+
      '<h4>'+escapeText(node.detail)+'</h4>'+
      '<p>'+escapeText(node.description)+'</p>'+
      '<div class="exp-node-detail-label">What this involved</div>'+
      '<ul>'+node.actions.map(s=>'<li>'+escapeText(s)+'</li>').join('')+'</ul>';
    content.querySelectorAll('[data-exp-node]').forEach(button=>{
      const active=button.dataset.expNode===currentNode;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderArchitecture() {
    const groups=[{label:'01 / USAGE AND CHECKS',desc:'Records and reconciliation'},
                  {label:'02 / APPLICATION SERVICES',desc:'Billing and service operations'},
                  {label:'03 / DATA AND HOSTING',desc:'Databases and host systems'}];
    const columns=groups.map((group,index)=>
      '<div class="exp-arch-group"><div class="exp-arch-group-label">'+group.label+'</div>'+
      '<p class="exp-arch-group-desc">'+group.desc+'</p>'+
      components.filter(node=>node.group===index).map(node=>
        '<button type="button" class="exp-arch-node'+(node.id===currentNode?' is-selected':'')+
        (node.mine?'':' exp-specialist')+'" data-exp-node="'+node.id+'" aria-pressed="'+(node.id===currentNode)+'">'+
        '<span class="exp-arch-node-type">'+(node.mine?'MY SUPPORT AREA':'SPECIALIST ADMINISTRATION')+'</span>'+
        '<strong>'+escapeText(node.title)+'</strong><span>'+escapeText(node.subtitle)+'</span></button>'
      ).join('')+'</div>'
    ).join('<span class="exp-arch-connector" aria-hidden="true">→</span>');
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">SIMPLIFIED SYSTEM VIEW</span>'+
      '<h3>How the billing environment fitted together.</h3>'+
      '<p>Explore the main technology areas, then select a component to see where my responsibilities began and ended.</p></div>'+
      '<div class="exp-legend"><span><i class="exp-legend-dot mine"></i> My support / investigation</span><span><i class="exp-legend-dot specialist"></i> Managed by specialists</span></div></div>'+
      '<div class="exp-architecture" aria-label="Conceptual telecom billing environment">'+columns+'</div>'+
      '<div class="exp-node-detail" id="exp-node-details" aria-live="polite"></div>'+
      '<p class="exp-disclosure">Illustrative, sanitized overview based on my professional experience. It is not a copy of HRC’s production topology, and arrows show a conceptual workflow rather than verified system connections.</p>';
    renderNodeDetails();
  }
  function renderRole() {
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">MY ROLE IN THE ENVIRONMENT</span>'+
      '<h3>Application, billing and operational support.</h3>'+
      '<p>My work sat between the billing platform, the users who depended on it, and the specialist teams maintaining the underlying systems.</p></div></div>'+
      '<div class="exp-role-grid">'+
      '<section class="exp-role-panel"><span class="exp-role-icon" aria-hidden="true">✓</span><h4>What I worked on</h4>'+
      '<ul><li>Billing applications and user-reported incidents</li><li>Red Hat application service checks, log review and approved Tomcat restarts</li><li>Oracle and Microsoft SQL queries for data reconciliation and reporting</li><li>CDR matching, invoice discrepancies and operational validations</li><li>Requirements, vendor coordination, UAT and production readiness support</li><li>IT infrastructure and endpoint support within the team</li></ul></section>'+
      '<section class="exp-role-panel exp-role-panel-muted"><span class="exp-role-icon" aria-hidden="true">↗</span><h4>Where I collaborated or escalated</h4>'+
      '<ul><li>Solaris and Sun host administration: dedicated specialists</li><li>Database platform administration: DBA team</li><li>Network faults: network operations team</li><li>Complex application or vendor-level faults: senior colleagues and software vendors</li></ul>'+
      '<p class="exp-boundary">Working with these systems did not mean owning every layer of their administration.</p></section></div>'+
      '<div class="exp-role-summary"><span>THE OPERATIONAL THREAD</span><strong>Report → investigate → resolve or escalate → verify → document</strong></div>'+
      '<p class="exp-disclosure">Responsibilities are summarized at a safe, high level. No internal server identifiers, customer data or access details are displayed.</p>';
  }
  function renderCase() {
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">REPRESENTATIVE INCIDENT WORKFLOW</span>'+
      '<h3>Investigating a telecom billing mismatch.</h3>'+
      '<p>A step-by-step example of the diagnostic approach used in application and billing support. This is a reconstructed scenario, not an actual incident record.</p></div></div>'+
      '<div class="exp-incident-steps" role="group" aria-label="Incident investigation stages">'+
      steps.map((step,i)=>'<button type="button" data-exp-step="'+i+'" class="exp-incident-step'+(currentStep===i?' is-active':'')+'" aria-pressed="'+(currentStep===i)+'"><span>0'+(i+1)+'</span>'+escapeText(step.title)+'</button>').join('')+'</div>'+
      '<div class="exp-incident-panel" id="exp-incident-panel" aria-live="polite"></div>'+
      '<p class="exp-disclosure">This example illustrates troubleshooting practice only. It does not reproduce confidential tickets, logs, system addresses or client billing records.</p>';
    renderStepDetails();
  }
  function renderStepDetails(){
    const step=steps[currentStep], target=document.getElementById('exp-incident-panel');
    if(!target)return;
    target.innerHTML='<span class="exp-kicker">'+step.eyebrow+'</span><h4>'+escapeText(step.title)+'</h4><p>'+escapeText(step.body)+'</p>'+
      '<div class="exp-node-detail-label">Typical checks and actions</div><ul>'+step.evidence.map(item=>'<li>'+escapeText(item)+'</li>').join('')+'</ul>';
    content.querySelectorAll('[data-exp-step]').forEach(button=>{
      const active=Number(button.dataset.expStep)===currentStep;
      button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderPreview(data) {
    tabs.hidden=true;
    content.innerHTML='<div class="exp-preview"><span class="exp-preview-illustration" aria-hidden="true">▦</span>'+
      '<span class="exp-kicker">EXPERIENCE VIEW / PREVIEW</span>'+
      '<h3>'+escapeText(data.focus)+'</h3>'+
      '<p>This is a placeholder for a future, role-specific walkthrough. The underlying work was real, but no detailed diagram or case study has been published here yet.</p>'+
      '<div class="exp-preview-list">'+data.topics.map(item=>'<div><span aria-hidden="true">↗</span>'+escapeText(item)+'</div>').join('')+'</div>'+
      '<p class="exp-preview-note">'+escapeText(data.note)+'</p>'+
      '<div class="exp-preview-footer"><span>MORE DETAIL TO BE ADDED</span><span>Current role summary remains in the career timeline.</span></div>'+
      '</div>';
  }
  function render(){
    const data=companies[current];
    heading.textContent=data.name;
    eyebrow.textContent=current==='hrc'?'INTERACTIVE WORK EXPERIENCE / COMPLETE EXAMPLE':'WORK EXPERIENCE / PREVIEW';
    subtitle.textContent=data.role;
    modal.classList.toggle('exp-is-preview',current!=='hrc');
    tabs.hidden=current!=='hrc';
    if(current!=='hrc'){renderPreview(data);return;}
    tabs.querySelectorAll('[data-exp-tab]').forEach(b=>{
      const active=b.dataset.expTab===currentTab;
      b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));
      b.tabIndex=active?0:-1;
    });
    if(currentTab==='system')renderArchitecture();
    else if(currentTab==='role')renderRole();
    else renderCase();
  }
  function open(company,trigger){
    if(!companies[company])return;
    lastFocus=trigger||document.activeElement;
    current=company;currentTab='system';currentNode='app';currentStep=0;
    render();modal.hidden=false;
    document.body.classList.add('experience-modal-open');
    modal.querySelector('[data-exp-close]').focus();
  }
  function close(){
    if(modal.hidden)return;
    modal.hidden=true;document.body.classList.remove('experience-modal-open');
    if(lastFocus?.isConnected)lastFocus.focus();
  }
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-exp-company]');
    if(trigger){e.preventDefault();open(trigger.dataset.expCompany,trigger);return;}
    if(modal.hidden)return;
    if(e.target.closest('[data-exp-close]')){close();return;}
    const tab=e.target.closest('[data-exp-tab]');
    if(tab){currentTab=tab.dataset.expTab;render();tab.focus();return;}
    const node=e.target.closest('[data-exp-node]');
    if(node){currentNode=node.dataset.expNode;renderNodeDetails();return;}
    const step=e.target.closest('[data-exp-step]');
    if(step){currentStep=Number(step.dataset.expStep);renderStepDetails();}
  });
  document.addEventListener('keydown',e=>{
    if(modal.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.key!=='Tab')return;
    const visible=Array.from(modal.querySelectorAll('button:not([hidden]),a[href], [tabindex="0"]')).filter(el=>el.getClientRects().length>0 && !el.closest('[hidden]'));
    if(!visible.length)return;
    const first=visible[0],last=visible[visible.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  },true);
})();
