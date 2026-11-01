/* Interactive, sanitized experience walkthroughs.
 * HRC is an illustrative reconstruction of the user's described work, not
 * an employer-authorized network diagram or evidence from a live system.
 * RWE and TK Elevator have clearly marked previews; other jobs stay in the timeline.
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

  // HRC's general workplace IT responsibilities were distinct from billing.
  // This is a role map, not an internal network topology.
  const workplaceAreas = [
    {id:'lifecycle',title:'Onboarding & offboarding',tag:'EMPLOYEE LIFECYCLE',description:'Supported employees joining, moving between responsibilities, and leaving the organization, including IT setup, access handovers and equipment return.',actions:['Prepare user IT access and workstations for new starters','Support access changes and removal during offboarding','Coordinate handovers and return of assigned equipment']},
    {id:'endpoints',title:'Computers & devices',tag:'ENDPOINT SUPPORT',description:'Handled everyday desktop and laptop administration, peripheral setup, troubleshooting and device readiness for office employees.',actions:['Prepare and configure employee devices','Investigate operating system and peripheral issues','Repair, replace or coordinate support for faulty equipment']},
    {id:'network',title:'LAN & Wi-Fi',tag:'NETWORK OPERATIONS',description:'Supported office network administration, wired LAN connectivity and wireless access, including troubleshooting employee connection problems and coordinating wider issues.',actions:['Investigate wired and wireless connectivity faults','Support local office network and connection changes','Escalate broader network infrastructure problems when needed']},
    {id:'inventory',title:'IT inventory',tag:'ASSET MANAGEMENT',description:'Tracked and handled IT equipment through allocation, changes, maintenance and return, helping keep workplace hardware accounted for.',actions:['Maintain equipment records and allocations','Manage devices and accessories through their lifecycle','Coordinate equipment handovers and returns']},
    {id:'printers',title:'Printers & peripherals',tag:'OFFICE TECHNOLOGY',description:'Supported office printers and connected peripherals, including installation, connectivity and everyday troubleshooting.',actions:['Set up and troubleshoot printers and drivers','Investigate printing, connection or queue problems','Coordinate repair or replacement when required']},
    {id:'meetings',title:'Meeting rooms',tag:'MEETING TECHNOLOGY',description:'Supported meeting room equipment and connectivity so employees could use presentations and conference facilities reliably.',actions:['Prepare displays and presentation equipment','Troubleshoot meeting room connectivity and peripherals','Assist users during technical meeting room issues']},
    {id:'helpdesk',title:'User support & incidents',tag:'IT SERVICE SUPPORT',description:'Provided day-to-day user assistance and technical incident support across office systems, hardware, applications and connectivity.',actions:['Triage and investigate employee-reported IT issues','Restore service or escalate to the appropriate specialist','Communicate fixes and document recurring problems']}
  ];
  const connectivitySteps = [
    {title:'Identify',eyebrow:'01 / USER IMPACT',
      body:'An employee cannot connect to the office network or Wi-Fi, affecting normal work. Confirm whether the problem is limited to one device, one area, or multiple employees.',
      evidence:['Check whether the affected connection is wired or wireless','Identify the device, location and symptoms','Determine whether other users are affected']},
    {title:'Investigate',eyebrow:'02 / LOCAL DIAGNOSIS',
      body:'Inspect the device connection and local access conditions, compare with a known-working device, and isolate endpoint problems from broader network problems.',
      evidence:['Check adapter state, cable or wireless connection','Verify the expected network is reachable','Separate device-specific issues from a shared outage']},
    {title:'Resolve / escalate',eyebrow:'03 / RECOVERY',
      body:'Apply an approved endpoint or local connectivity correction, or pass a wider infrastructure fault to the responsible network specialist.',
      evidence:['Correct a safe device-side configuration issue','Restore or replace a faulty local connection if appropriate','Escalate shared network issues with clear findings']},
    {title:'Verify',eyebrow:'04 / FOLLOW-UP',
      body:'Recheck the affected employee’s connection, confirm access to the required service, and document the outcome for support and handover.',
      evidence:['Verify the connection and normal user access','Confirm the user can resume work','Record the diagnosis and any further action']}
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
  let current='hrc', currentTab='system', currentNode='app', currentArea='lifecycle', currentIncident='billing', currentStep=0, lastFocus=null;
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

  function renderWorkplaceDetails() {
    const area=workplaceAreas.find(item=>item.id===currentArea)||workplaceAreas[0];
    const target=document.getElementById('exp-workplace-detail');
    if(!target)return;
    target.innerHTML=
      '<span class="exp-node-detail-kicker">'+escapeText(area.tag)+'</span>'+
      '<h4>'+escapeText(area.title)+'</h4><p>'+escapeText(area.description)+'</p>'+
      '<div class="exp-node-detail-label">Responsibilities</div>'+
      '<ul>'+area.actions.map(item=>'<li>'+escapeText(item)+'</li>').join('')+'</ul>';
    content.querySelectorAll('[data-exp-area]').forEach(button=>{
      const active=button.dataset.expArea===currentArea;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function renderWorkplace() {
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">WORKPLACE IT / INFRASTRUCTURE SUPPORT</span>'+
      '<h3>Keeping people, devices and office systems working.</h3>'+
      '<p>Alongside telecom billing, I handled everyday IT administration: employee onboarding and offboarding, endpoints, local networks, equipment, printers and meeting room technology.</p></div></div>'+
      '<div class="exp-workplace-banner"><span>WORKPLACE SUPPORT SCOPE</span>'+
      '<strong>User lifecycle · Devices · LAN / Wi-Fi · Equipment inventory · Office technology</strong></div>'+
      '<div class="exp-workplace-grid" role="group" aria-label="Select an IT operations responsibility">'+
      workplaceAreas.map((area,i)=>'<button type="button" class="exp-workplace-tile'+
        (area.id===currentArea?' is-selected':'')+'" data-exp-area="'+area.id+
        '" aria-pressed="'+(area.id===currentArea)+'">'+
        '<span class="exp-workplace-count">0'+(i+1)+' / 07</span>'+
        '<strong>'+escapeText(area.title)+'</strong>'+
        '<span>'+escapeText(area.tag)+'</span></button>').join('')+'</div>'+
      '<div class="exp-node-detail exp-workplace-detail" id="exp-workplace-detail" aria-live="polite"></div>'+
      '<p class="exp-disclosure">This is a high-level summary of hands-on IT responsibilities, not a reproduction of HRC’s internal network configuration or a claim of ownership of every infrastructure component.</p>';
    renderWorkplaceDetails();
  }

  function renderRole() {
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">MY RESPONSIBILITIES AT HRC</span>'+
      '<h3>Workplace IT and telecom billing operations.</h3>'+
      '<p>My position combined employee-facing infrastructure administration with support for the company’s specialist billing applications and reporting workflows.</p></div></div>'+
      '<div class="exp-role-grid exp-role-grid--expanded">'+
      '<section class="exp-role-panel"><span class="exp-role-icon" aria-hidden="true">✓</span><h4>Workplace IT & infrastructure</h4>'+
      '<ul><li>Employee onboarding, offboarding and IT access handovers</li><li>Desktop, laptop, printer and peripheral administration</li><li>Local LAN and Wi-Fi support, connectivity troubleshooting and network administration</li><li>Equipment inventory, assignment, maintenance and returns</li><li>Meeting room technology and everyday user support</li></ul></section>'+
      '<section class="exp-role-panel"><span class="exp-role-icon" aria-hidden="true">✓</span><h4>Billing & application support</h4>'+
      '<ul><li>Billing applications and user-reported production incidents</li><li>Red Hat application service checks, log reviews and approved Tomcat restarts</li><li>Oracle and Microsoft SQL queries for reconciliations and reports</li><li>CDR matching, invoice discrepancies and operational validations</li><li>Requirements, vendor coordination, UAT and production readiness</li></ul></section>'+
      '<section class="exp-role-panel exp-role-panel-muted exp-role-panel--boundary"><span class="exp-role-icon" aria-hidden="true">↗</span><h4>Where specialist teams took ownership</h4>'+
      '<p class="exp-role-boundary-intro">Day-to-day local network administration and user support were part of my work, but larger platform responsibilities remained with dedicated teams.</p>'+
      '<ul><li>Sun hardware and Solaris host administration: infrastructure specialists</li><li>Database platform administration: DBA team</li><li>Core network failures beyond local support: network operations team</li><li>Complex application faults: senior colleagues and software vendors</li></ul>'+
      '<p class="exp-boundary">Supporting a system or coordinating its recovery did not mean administering every layer of it.</p></section></div>'+
      '<div class="exp-role-summary"><span>TWO COMPLEMENTARY WORKSTREAMS</span>'+
      '<strong>Employees, devices and networks + business-critical billing applications</strong></div>'+
      '<p class="exp-disclosure">All descriptions are deliberately generalized. No actual infrastructure identifiers, user information or confidential operational data are shown.</p>';
  }
  function renderCase() {
    const network=currentIncident==='connectivity';
    content.innerHTML=
      '<div class="exp-intro-row"><div><span class="exp-kicker">REPRESENTATIVE TROUBLESHOOTING WORKFLOWS</span>'+
      '<h3>How I approached support incidents.</h3>'+
      '<p>Explore a billing application investigation or a typical workplace connectivity problem. These are reconstructed scenarios, not actual company tickets.</p></div></div>'+
      '<div class="exp-scenario-picker" role="group" aria-label="Choose an example incident">'+
      '<button type="button" data-exp-incident="billing" aria-pressed="'+(!network)+'" class="'+(!network?'is-active':'')+'">Billing reconciliation issue</button>'+
      '<button type="button" data-exp-incident="connectivity" aria-pressed="'+network+'" class="'+(network?'is-active':'')+'">LAN / Wi-Fi connection issue</button></div>'+
      '<div class="exp-incident-steps" role="group" aria-label="Incident investigation stages">'+
      (network?connectivitySteps:steps).map((step,i)=>
        '<button type="button" data-exp-step="'+i+'" class="exp-incident-step'+
        (currentStep===i?' is-active':'')+'" aria-pressed="'+(currentStep===i)+
        '"><span>0'+(i+1)+'</span>'+escapeText(step.title)+'</button>').join('')+'</div>'+
      '<div class="exp-incident-panel" id="exp-incident-panel" aria-live="polite"></div>'+
      '<p class="exp-disclosure">Scenarios illustrate a troubleshooting approach, not actual HRC incident reports, confidential logs, network addresses or customer records.</p>';
    renderStepDetails();
  }
  function renderStepDetails(){
    const step=(currentIncident==='connectivity'?connectivitySteps:steps)[currentStep], target=document.getElementById('exp-incident-panel');
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
    else if(currentTab==='workplace')renderWorkplace();
    else if(currentTab==='role')renderRole();
    else renderCase();
  }
  function open(company,trigger){
    if(!companies[company])return;
    lastFocus=trigger||document.activeElement;
    current=company;currentTab='system';currentNode='app';currentArea='lifecycle';currentIncident='billing';currentStep=0;
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
    const area=e.target.closest('[data-exp-area]');
    if(area){currentArea=area.dataset.expArea;renderWorkplaceDetails();return;}
    const incident=e.target.closest('[data-exp-incident]');
    if(incident){currentIncident=incident.dataset.expIncident;currentStep=0;renderCase();return;}
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
