/**
 * Virtual Hillol career assistant.
 * Live model calls use a secure server-side API; if unavailable,
 * a deterministic preview answers from reviewed public career facts.
 */
(() => {
  "use strict";
  const launcher=document.getElementById("vh-launcher");
  const panel=document.getElementById("vh-panel");
  if(!launcher||!panel)return;
  const closeButton=panel.querySelector("[data-vh-close]");
  const messages=panel.querySelector("#vh-messages");
  const form=panel.querySelector("#vh-form");
  const input=panel.querySelector("#vh-input");
  const send=panel.querySelector("#vh-send");
  const suggestions=panel.querySelector("#vh-suggestions");
  const status=panel.querySelector("#vh-status");
  const jdButton=panel.querySelector("#vh-jd");
  const reset=panel.querySelector("#vh-reset");
  const active=panel.querySelector("#vh-mode");
  const API_BASE="https://virtual-hillol-api-xi.vercel.app";
  const teaser=document.getElementById("vh-teaser");
  const teaserDismiss=document.getElementById("vh-teaser-dismiss");
  const teaserStart=document.getElementById("vh-teaser-start");
  // Keep the floating chat discoverable without covering project cards.
  const heroRegion=document.querySelector(".hero");
  function updateLauncherFootprint(){
    if(!heroRegion)return;
    const pastHero=heroRegion.getBoundingClientRect().bottom<140;
    launcher.classList.toggle("vh-launcher--compact",pastHero);
    // The invitation may remain visible as visitors browse project cards.
  }
  window.addEventListener("scroll",updateLauncherFootprint,{passive:true});
  window.addEventListener("resize",updateLauncherFootprint);
  requestAnimationFrame(updateLauncherFootprint);
  const TEASER_DELAY_MS=8000;
  const TEASER_SESSION_KEY="virtual-hillol-greeting-seen-v2";
  let teaserHandled=false;
  let teaserTimer=null;
  let teaserElapsedVisibleMs=0;
  let teaserStartedAt=0;
  function hasSeenTeaser(){
    if(teaserHandled)return true;
    try{return sessionStorage.getItem(TEASER_SESSION_KEY)==="1";}
    catch(_){return false;}
  }
  function pauseTeaser(){
    if(teaserTimer===null)return;
    clearTimeout(teaserTimer);
    teaserTimer=null;
    teaserElapsedVisibleMs=Math.min(TEASER_DELAY_MS,
      teaserElapsedVisibleMs+Math.max(0,Date.now()-teaserStartedAt));
  }
  function hideTeaser(){
    pauseTeaser();
    if(teaser)teaser.hidden=true;
    teaserHandled=true;
    try{sessionStorage.setItem(TEASER_SESSION_KEY,"1");}catch(_){}
  }
  function scheduleTeaser(){
    if(!teaser||hasSeenTeaser()||opened||teaserTimer!==null||
       document.hidden)return;
    teaserStartedAt=Date.now();
    teaserTimer=setTimeout(()=>{
      teaserTimer=null;
      teaserElapsedVisibleMs=TEASER_DELAY_MS;
      if(opened||hasSeenTeaser()||document.hidden)return;
      // Do not interrupt visitors while an experience or portrait dialog is open.
      if(document.querySelector('dialog[open], [role="dialog"]:not([hidden])')){
        teaserElapsedVisibleMs=TEASER_DELAY_MS-3000;
        scheduleTeaser();
        return;
      }
      teaser.hidden=false;
      teaserHandled=true;
      try{sessionStorage.setItem(TEASER_SESSION_KEY,"1");}catch(_){}
    },Math.max(0,TEASER_DELAY_MS-teaserElapsedVisibleMs));
  }
  // Count time spent actively viewing the page. Returning to a background
  // tab must not silently cancel the one-time invitation.
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)pauseTeaser();
    else scheduleTeaser();
  });
  let kb=null,opened=false,chatCount=0,lastFocus=null;
  let liveReady=false,conversation=[],checking=false,conversationGeneration=0;
  async function checkAI(){
    if(checking)return;
    checking=true;
    try{
      const response=await fetch(API_BASE+"/api/health",{mode:"cors",cache:"no-store",signal:AbortSignal.timeout(6500)});
      if(!response.ok)throw Error("health_unavailable");
      const data=await response.json();
      liveReady=data.operational===true&&data.mode==="live"&&data.model==="openai/gpt-6-luna";
    }catch(_){liveReady=false;}
    checking=false;
    if(chatCount===0)greeting();
    if(liveReady){
      active.textContent="Online";
      status.textContent="Ready to chat";
    }else{
      active.textContent="Preview";
      status.textContent=kb?"Preview answers":"Loading career information…";
    }
  }
  function fitConversation(items){
    // A request always begins and ends with a user message.
    // Retain complete recent user/assistant pairs within the API limits.
    let turns=items.slice(-7);
    while(turns.length>1&&turns[0].role!=="user")turns.shift();
    while(turns.length>1&&turns.reduce((total,msg)=>total+msg.content.length,0)>17000)turns=turns.slice(2);
    return turns;
  }
  const escape=s=>String(s||"").trim();
  const FALLBACK="I don't have enough verified information to answer that confidently in this preview. You can ask about my work history, technical skills, education, portfolio projects, or residence-permit situation. For anything more specific, you can contact me directly.";
  const quick=[
    "What experience do you have in IT support?",
    "Tell me about your Power BI and SQL skills.",
    "What did you do at HRC Technologies?",
    "Can you explain your visa and work permit?",
    "How would you match my job description?"
  ];
  // Render the small subset of Markdown used by the AI, using DOM nodes only.
  // Never inject model-generated HTML into the page.
  function appendInline(parent,line){
    const re=/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|`([^`\n]+)`|\*([^*\n]+)\*|_([^_\n]+)_/g;
    let last=0,match;
    while((match=re.exec(line))!==null){
      if(match.index>last)parent.appendChild(document.createTextNode(line.slice(last,match.index)));
      if(match[1]!==undefined){
        const a=document.createElement("a");
        a.textContent=match[1];
        a.href=match[2];
        if(/^https?:\/\//i.test(match[2])){
          a.target="_blank";
          a.rel="noopener noreferrer";
        }
        parent.appendChild(a);
      }else{
        const name=match[3]!==undefined||match[4]!==undefined?"strong":
          match[5]!==undefined?"code":"em";
        const element=document.createElement(name);
        element.textContent=match[3]??match[4]??match[5]??match[6]??match[7];
        parent.appendChild(element);
      }
      last=re.lastIndex;
    }
    if(last<line.length)parent.appendChild(document.createTextNode(line.slice(last)));
  }
  function renderAnswer(bubble,content){
    const lines=String(content).replace(/\r\n?/g,"\n").trim().split("\n");
    let paragraph=[],list=null,code=null;
    function flushParagraph(){
      if(!paragraph.length)return;
      const p=document.createElement("p");
      paragraph.forEach((line,index)=>{
        if(index)p.appendChild(document.createElement("br"));
        appendInline(p,line);
      });
      bubble.appendChild(p);
      paragraph=[];
    }
    function closeList(){list=null;}
    function flushCode(){
      if(code===null)return;
      const pre=document.createElement("pre"),element=document.createElement("code");
      element.textContent=code.join("\n");
      pre.appendChild(element);bubble.appendChild(pre);code=null;
    }
    for(const line of lines){
      const trimmed=line.trim();
      if(/^(`{3,}|~{3,})/.test(trimmed)){
        flushParagraph();closeList();
        if(code===null)code=[];else flushCode();
        continue;
      }
      if(code!==null){code.push(line);continue;}
      if(!trimmed){flushParagraph();closeList();continue;}
      const bullet=line.match(/^\s{0,3}([-+*]|\d+[.)])\s+(.+)$/);
      if(bullet){
        flushParagraph();
        const type=/^\d/.test(bullet[1])?"ol":"ul";
        if(!list||list.tagName.toLowerCase()!==type){
          list=document.createElement(type);
          list.className="vh-md-list";
          bubble.appendChild(list);
        }
        const item=document.createElement("li");
        appendInline(item,bullet[2].trim());
        list.appendChild(item);
        continue;
      }
      closeList();
      const heading=line.match(/^\s{0,3}#{1,4}\s+(.+)$/);
      if(heading){
        flushParagraph();
        const p=document.createElement("p");p.className="vh-md-heading";
        appendInline(p,heading[1].replace(/\s+#+\s*$/,"").trim());
        bubble.appendChild(p);
        continue;
      }
      const quote=line.match(/^\s*>\s?(.+)$/);
      if(quote){
        flushParagraph();
        const p=document.createElement("p");p.className="vh-md-quote";
        appendInline(p,quote[1]);
        bubble.appendChild(p);
        continue;
      }
      paragraph.push(trimmed);
    }
    flushParagraph();flushCode();
  }
  function addMessage(kind,text,opts={}){
    const wrap=document.createElement("div");
    wrap.className="vh-message "+(kind==="user"?"vh-user":"vh-assistant");
    const bubble=document.createElement("div");
    bubble.className="vh-bubble";
    if(kind==="assistant")renderAnswer(bubble,text);
    else {
      // Recruiter questions must remain literal, including pasted Markdown/HTML.
      const p=document.createElement("p");
      p.textContent=String(text);
      bubble.appendChild(p);
    }
    if(opts.sources?.length){
      const note=document.createElement("div");note.className="vh-source";
      note.textContent="Based on: "+opts.sources.join(" · ");
      bubble.appendChild(note);
    }
    if(opts.caution){
      const note=document.createElement("p");note.className="vh-caution";
      note.textContent=opts.caution;bubble.appendChild(note);
    }
    wrap.appendChild(bubble);messages.appendChild(wrap);
    messages.scrollTop=messages.scrollHeight;
    return wrap;
  }
  function greeting(){
    conversationGeneration++;
    messages.replaceChildren();chatCount=0;conversation=[];
    addMessage("assistant","Hi, I'm Virtual Hillol. Ask me about my experience, technical skills or projects. Have a job opening in mind? Paste the description here and I'll explain how my background fits.");
    renderSuggestions();
  }
  function renderSuggestions(){
    suggestions.replaceChildren();
    if(chatCount>1){suggestions.hidden=true;return;}
    suggestions.hidden=false;
    for(const q of quick){
      const b=document.createElement("button");b.type="button";b.className="vh-chip";b.textContent=q;
      b.addEventListener("click",()=>ask(q));suggestions.appendChild(b);
    }
  }
  function getRole(id){
    return kb.experience.find(x=>x.id===id);
  }
  function roleAnswer(id){
    const r=getRole(id);
    if(!r)return {text:FALLBACK};
    const tasks=r.work.slice(0,id==="hrc"?5:4);
    return {text:"At "+r.company+", I worked as "+r.title+" ("+r.period+"). "+r.summary+
      "\n\n"+tasks.join(". ")+".\n\n"+(r.limits?r.limits:"I can explain specific responsibilities or technologies if you'd like."),
      sources:["CV","Master career profile"]};
  }
  function skillAnswer(ids){
    const ss=ids.map(id=>kb.skills.find(x=>x.id===id)).filter(Boolean);
    if(!ss.length)return {text:FALLBACK};
    const text=ss.map(x=>x.name+": "+x.topics.slice(0,5).join(", ")+". My relevant experience includes "+x.evidence.join(" and ")+".").join("\n\n");
    return {text:"Yes. Here's how I've used these skills in practice.\n\n"+text+"\n\nI can go into more detail about any specific tool or example.",sources:["CV","Master career profile"]};
  }
  function visaAnswer(){
    const v=kb.visa;
    return {text:"I'm currently in Germany on a student residence permit. I've already completed a bachelor's degree in Computer Science and Engineering, and ZAB has officially assessed it as comparable to a German bachelor's degree.\n\nI've also been informed by the Dortmund foreigners authority that I can apply to change to a suitable employment residence permit when I have an eligible job offer or contract. The authority still has to approve the application and the appropriate work authorization before I can begin work beyond my current permit conditions.\n\nBased on the information I've received locally, I expect the process may take around three weeks, but that is an estimate, not a guaranteed processing time. I'm happy to provide my ZAB document and discuss the paperwork with a recruiting team.",sources:["User-provided residence clarification","ZAB degree assessment"],caution:"Residence-permit eligibility and approval are determined by the competent authority; the estimated timing is not guaranteed."};
  }
  function overview(){
    return {text:"I'm an IT and data professional based in Dortmund, with more than nine years of combined experience in workplace IT, infrastructure support, ITSM, application operations and BI/data reporting.\n\nMy experience includes full-time IT and telecom billing administration at HRC Technologies, BI platform support at TK Elevator, and roles with E.ON, Vaillant and RWE. I enjoy solving operational problems, explaining technical issues clearly and building practical tools.\n\nI'm looking for a permanent full-time position in Germany. What would you like to explore?",sources:["Current CV","Master career profile"]};
  }
  const patterns=[
    {label:"IT support / service desk",re:/\b(it support|service desk|help.?desk|desktop support|technical support|l[123]\s*support|1st.{0,12}level|2nd.{0,12}level|3rd.{0,12}level)\b/i,group:"direct",source:"HRC, YES, E.ON and TK Elevator"},
    {label:"ITSM, incidents and Jira",re:/\b(itsm|itil|incident|problem management|ticketing|jira|sla|service now|servicenow)\b/i,group:"direct",source:"HRC, E.ON, TK Elevator and RWE"},
    {label:"Active Directory and Windows",re:/\b(active directory|group policy|gpo|windows|endpoint|user provisioning)\b/i,group:"direct",source:"HRC Technologies"},
    {label:"Microsoft 365 support",re:/\b(microsoft 365|m365|office 365|o365|teams|sharepoint|outlook|onedrive|exchange)\b/i,group:"direct",source:"HRC and workplace support experience"},
    {label:"Network troubleshooting",re:/\b(network|dns|dhcp|tcp\/ip|lan\b|wlan|wi.?fi|vpn|routing|switching)\b/i,group:"direct",source:"HRC and YES"},
    {label:"Asset / hardware administration",re:/\b(asset|inventory|printer|hardware|device management|onboarding|offboarding|meeting room|peripheral)\b/i,group:"direct",source:"HRC and YES"},
    {label:"Power BI reporting",re:/\b(power\s?bi|dax|power query|kpi|business intelligence|bi reporting)\b/i,group:"direct",source:"TK Elevator and HRC"},
    {label:"SQL and data checks",re:/\b(sql|oracle|databricks|spark|query|reconciliation|data quality)\b/i,group:"direct",source:"TK Elevator and HRC"},
    {label:"Application / platform support",re:/\b(application support|platform support|production support|uat|migration|confluence|runbook)\b/i,group:"direct",source:"E.ON, TK Elevator, HRC and RWE"},
    {label:"Process governance",re:/\b(aris|bpmn|it4it|process governance|process model)\b/i,group:"direct",source:"Vaillant Group"},
    {label:"Linux service operations",re:/\b(red hat|rhel|linux|tomcat|ssh)\b/i,group:"direct",source:"HRC Technologies"},
    {label:"Applied LLM / SaaS integration",re:/\b(genai|generative ai|llm|prompt engineering|fastapi|ai integration|api integrations|saas)\b/i,group:"related",source:"Independent HireDraftAI project; not professional AI tenure"},
    {label:"Enterprise cloud administration",re:/\b(azure architect|aws architect|kubernetes|terraform|cloud infrastructure|intune administration|azure administrator)\b/i,group:"gap",source:"Not evidenced as deep production ownership"},
    {label:"Fluent German",re:/\b(fluent german|german c1|german c2|german b2|native german)\b/i,group:"gap",source:"German is currently elementary"},
    {label:"Advanced ML/MLOps",re:/\b(mlops|pytorch|tensorflow|fine tuning|fine-tuning|model training|deep learning research)\b/i,group:"gap",source:"Not evidenced as production specialization"},
    {label:"Completed master's degree",re:/\b(completed m\.?sc|master.s degree required|completed master|master.s degree in data science)\b/i,group:"gap",source:"M.Sc. Data Science is ongoing"}
  ];
  function jobMatch(raw){
    const jd=escape(raw);
    if(jd.length<40)return {text:"Please paste more of the job description so I can compare its requirements with my documented experience."};
    const hits=patterns.filter(p=>p.re.test(jd));
    const direct=hits.filter(p=>p.group==="direct");
    const related=hits.filter(p=>p.group==="related");
    const gaps=hits.filter(p=>p.group==="gap");
    if(!hits.length)return {text:"I can compare the role with my experience, but this description doesn't contain enough recognizable technical requirements for a meaningful offline check. For a useful assessment, include responsibilities, tools and required qualifications.\n\nWhen the AI integration is enabled, I'll be able to analyze less structured descriptions too.",sources:["Role text entered in this browser","CV"]};
    let lines=["Here's my evidence-based first look at this position. This preview checks stated keywords against my documented background; it isn't a hiring recommendation or a complete AI evaluation."];
    if(direct.length)lines.push("DOCUMENTED EXPERIENCE\n"+direct.map(p=>"• "+p.label+" ("+p.source+")").join("\n"));
    if(related.length)lines.push("RELATED PROJECT EXPERIENCE\n"+related.map(p=>"• "+p.label+" ("+p.source+")").join("\n"));
    if(gaps.length)lines.push("GAPS OR QUALIFICATIONS TO VERIFY\n"+gaps.map(p=>"• "+p.label+": "+p.source).join("\n"));
    lines.push("Some requirements might not have been recognized by this offline preview. I would be happy to discuss the role and explain my experience in detail rather than claim a percentage match.");
    return {text:lines.join("\n\n"),sources:["Pasted job description","CV and curated career knowledge"]};
  }
  function getAnswer(q){
    const input=q.toLowerCase().trim();
    if(/\b(phone|telephone|mobile|call me|call you|number|contact|reach you|reach hillol|email|e-mail|whatsapp)\b/i.test(q)){
      const details=kb?.identity?.publicContact||{};
      if(!details.phone||!details.email)return {text:"You can use the contact details on my portfolio to get in touch."};
      return {text:"You can reach me on "+details.phone+" or email me at "+details.email+". I'm happy to discuss suitable full-time opportunities.",sources:["Approved public contact details"]};
    }
    if(q.length>180||/\b(job description|job posting|your requirements|responsibilities include|requirements:|required qualifications)\b/i.test(q)&&q.length>60)return jobMatch(q);
    if(/\b(visa|residence|permit|work authori[sz]ation|right to work|sponsor|sponsorship|zab|foreigners.office|immigration|work eligibility)\b/i.test(q))return visaAnswer();
    if(/\b(job description|job match|match my job|compare|suitable for my role|fit this role|requirements)\b/i.test(q))return {text:"Please paste the job description into the message box, ideally including the responsibilities and required skills. I can give you a preliminary evidence-based comparison in preview mode. I won't claim a guaranteed match.",sources:["CV"]};
    if(/\b(about yourself|tell me about yourself|introduce yourself|who are you|what do you do|your background|experience overall)\b/i.test(q))return overview();
    if(/\b(hrc|billing|telecom|call detail|cdr)\b/i.test(q))return roleAnswer("hrc");
    if(/\b(tk elevator|tke|elevator|iot|predictive maintenance)\b/i.test(q))return roleAnswer("tke");
    if(/\b(rwe|renewable|scada|it\/ot)\b/i.test(q))return roleAnswer("rwe");
    if(/\b(vaillant|aris|bpmn|it4it)\b/i.test(q))return roleAnswer("vaillant");
    if(/\b(e\.?on|intranet|unily|compass)\b/i.test(q))return roleAnswer("eon");
    if(/\b(yes private)\b/i.test(q))return roleAnswer("yes");
    if(/\b(opslens|service desk intelligence)\b/i.test(q))return {text:"OpsLens is my independent IT service desk analytics project. It uses 3,200 synthetic incident records, a Python generator, a tested SQLite reporting pipeline, SLA calendars and data-quality checks. It does not connect to a real employer system.\n\n[Read the OpsLens case study](https://hillol.de/projects/opslens/) or [open the live demo](https://opslens-hjsarkers-projects.vercel.app/).",sources:["Public OpsLens repository and methodology"]};
    if(/\b(germany power pulse|power pulse|smard)\b/i.test(q))return {text:"Germany Power Pulse is an electricity market analytics project using official SMARD observations. The Python pipeline handles hourly data, missing observations and reporting measures. Renewable share is calculated only for fully observed generation hours. The dashboard is descriptive, not a causal or forecasting model.\n\n[See how the pipeline works](https://hillol.de/projects/germany-power-pulse/) or [open the dashboard](https://hjsarker.github.io/germany-power-pulse/).",sources:["Germany Power Pulse source and methodology"]};
    if(/\b(bahnpulse|bahn pulse)\b/i.test(q))return {text:"BahnPulse explores historical German train-stop observations, including delays, cancellations and station patterns. It is an analytical dashboard, not real-time journey tracking or a prediction service.\n\n[Explore BahnPulse](https://bahn-pulse.vercel.app/).",sources:["Public BahnPulse project documentation"]};
    if(/\b(power\s?bi|dashboard|dax|power query|sql|databricks|spark|reporting|analytics)\b/i.test(q))return skillAnswer(["powerbi","sql","data-platform"]);
    if(/\b(microsoft 365|office 365|m365|intune|exchange|active directory|windows|gpo|network|wi.fi|vpn|dns|dhcp|device|printers|infrastructure)\b/i.test(q))return skillAnswer(["infrastructure","it-support"]);
    if(/\b(it support|it operations|helpdesk|service desk|ticket|jira|incident|itsm|troubleshoot|end user)\b/i.test(q))return skillAnswer(["it-support","infrastructure"]);
    if(/\b(ml|ai|artificial intelligence|genai|llm|saas|hiredraft|project|github|portfolio|built|build)\b/i.test(q)){
      if(/\b(ml|ai|genai|llm|saas|hiredraft)\b/i.test(q))return {text:"My main independent AI application project is HireDraftAI, a SaaS product for CV and cover letter generation. I've directed its product workflows and worked on LLM integrations, prompt design, testing, validation, deployment and maintenance with extensive assistance from Codex and Claude.\n\nThat is applied AI project experience, not years of employment as an AI engineer. I also have projects in 3D visualization, energy data and analytics.",sources:["AI profile update","Portfolio projects"]};
      return {text:"My public portfolio includes OpsLens (synthetic IT service desk analytics), Germany Power Pulse (energy data), Auto Pulse (automotive analytics), BahnPulse (historical railway reliability), HireDraftAI (AI-assisted career documents), Cosmic Atlas (3D visualization) and an interactive AI history timeline.\n\nYou can open these projects on my portfolio and ask me about the technologies behind each.",sources:["Portfolio projects"]};
    }
    if(/\b(education|bachelor|master|degree|university|zab|study|studies)\b/i.test(q))return {text:"I completed my B.Sc. in Computer Science and Engineering at American International University-Bangladesh in 2015. ZAB has assessed it as comparable to a German bachelor's degree.\n\nI'm also studying for an M.Sc. in Data Science at TU Dortmund University. The master's is still ongoing; I haven't completed it yet.",sources:["CV","ZAB comparability noted in profile"]};
    if(/\b(certifi|qualification|rhce|rhsca|red hat|itil|azure exam)\b/i.test(q))return {text:"I hold Red Hat Certified System Administrator (RHCSA), the Google Data Analytics Professional Certificate, and the Wharton/University of Pennsylvania Business Analytics Specialization.\n\nI've also studied ITIL v4 and Microsoft Azure Fundamentals preparation material, but I'm not representing those courses as passed professional certification exams.",sources:["CV","Master profile"]};
    if(/\b(german|english|language|relocation|remote|full.time|availability|start date|notice)\b/i.test(q))return {text:"I'm based in Dortmund and looking for a permanent full-time position in Germany. My CV lists a one-month notice period, and I'm open to discussing relocation, hybrid or remote roles.\n\nI work professionally in English. Bangla is my native language, Hindi is fluent, and my German is currently elementary.",sources:["Current CV"]};
    if(/\b(what can you do for|how could you help|why hire|why choose|strengths|your value)\b/i.test(q))return {text:"I can help keep users and enterprise applications productive through structured troubleshooting, incident ownership, Windows and Microsoft 365 support, and clear documentation. I can also support Power BI and SQL reporting, investigate data-quality issues, and coordinate migrations or IT processes.\n\nMy strength is combining operational IT support with data analysis and working well across technical and business teams.",sources:["CV and work history"]};
    if(/\b(hello|hi|hey|good morning|good evening)\b/i.test(q))return {text:"Hello! You can ask me about my IT support background, Power BI and SQL work, specific employers, projects, visa situation, or paste a job description. What would you like to know?"};
    return {text:FALLBACK};
  }
  async function ask(question){
    // Ignore extra clicks while loading or while an AI response is in flight.
    if(send.disabled||input.disabled)return;
    const generation=conversationGeneration;
    const q=escape(question);
    if(!q)return;
    if(q.length>11500){addMessage("assistant","Please keep your message below 11,500 characters.");return;}
    addMessage("user",q);chatCount++;renderSuggestions();
    input.value="";autoResize();
    if(!liveReady){
      const answer=kb?getAnswer(q):{text:"My verified career knowledge could not be loaded."};
      addMessage("assistant",answer.text,answer);
      input.focus();
      return;
    }
    send.disabled=true;
    input.disabled=true;
    status.textContent="Writing a reply…";
    const requestMessages=fitConversation([...conversation,{role:"user",content:q}]);
    try{
      const response=await fetch(API_BASE+"/api/chat",{
        method:"POST",
        mode:"cors",
        cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:requestMessages}),
        signal:AbortSignal.timeout(28000)
      });
      const data=await response.json().catch(()=>({}));
      if(generation!==conversationGeneration)return;
      if(!response.ok){
        if(data.error==="not_configured"||data.error==="budget_exhausted"){
          liveReady=false;
          active.textContent="Preview";
        }
        throw Error(data.message||(
          response.status===429?"The chat is receiving too many requests. Please try again shortly.":
          "My AI connection is temporarily unavailable. You can try again shortly."));
      }
      if(typeof data.reply!=="string"||!data.reply.trim())throw Error("I couldn't generate a complete reply. Please try again.");
      const answer=data.reply.trim();
      addMessage("assistant",answer);
      conversation=[...requestMessages,{role:"assistant",content:answer}].slice(-8);
    }catch(err){
      if(generation!==conversationGeneration)return;
      addMessage("assistant",String(err.message||"AI connection unavailable.")+
        "\n\nI can still give you an evidence-based preview answer:\n\n"+
        (kb?getAnswer(q).text:"Please contact me directly."));
    }finally{
      send.disabled=false;input.disabled=false;
      status.textContent=liveReady?"Ready to chat":"Preview answers";
      input.focus();
    }
  }
  function autoResize(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,138)+"px";}
  function open(){
    hideTeaser();
    if(opened)return;lastFocus=document.activeElement;opened=true;
    panel.hidden=false;launcher.setAttribute("aria-expanded","true");
    document.body.classList.add("vh-chat-open");
    checkAI();
    setTimeout(()=>input.focus(),0);
  }
  function close(){
    if(!opened)return;opened=false;panel.hidden=true;
    launcher.setAttribute("aria-expanded","false");
    document.body.classList.remove("vh-chat-open");
    if(lastFocus?.isConnected)lastFocus.focus();
    else launcher.focus();
  }
  if(teaser&&teaserDismiss&&teaserStart){
    teaserDismiss.addEventListener("click",hideTeaser);
    teaserStart.addEventListener("click",open);
    scheduleTeaser();
  }
  launcher.addEventListener("click",()=>opened?close():open());
  document.querySelectorAll("[data-vh-open]").forEach(b=>b.addEventListener("click",open));
  closeButton.addEventListener("click",close);
  document.addEventListener("keydown",e=>{
    if(!opened)return;
    if(e.key==="Escape"){e.preventDefault();close();}
    if(e.key!=="Tab")return;
    const els=Array.from(panel.querySelectorAll("button:not(:disabled),textarea,[href]")).filter(el=>el.getClientRects().length>0);
    if(!els.length)return;
    const first=els[0],last=els[els.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  },true);
  form.addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
  input.addEventListener("input",autoResize);
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
  jdButton.addEventListener("click",()=>{
    open();input.placeholder="Paste the job description and press Enter to compare…";
    input.focus();addMessage("assistant","Paste the job description here. I'll compare the requirements with my experience and explain where my background fits.");
  });
  reset.addEventListener("click",()=>{greeting();input.value="";autoResize();input.focus();});
  greeting();send.disabled=true;
  fetch("./data/virtual-hillol-knowledge.json",{cache:"no-cache"}).then(r=>{
    if(!r.ok)throw new Error("Knowledge request "+r.status);return r.json();
  }).then(data=>{
    if(data.schemaVersion!==1||!Array.isArray(data.experience)||data.experience.length!==6||!Array.isArray(data.skills))throw new Error("Knowledge structure");
    kb=data;send.disabled=false;status.textContent="Preview answers";
    active.textContent="Preview";
    input.disabled=false;
    checkAI();
  }).catch(()=>{
    status.textContent="Knowledge temporarily unavailable";
    send.disabled=true;input.disabled=true;
    addMessage("assistant","Sorry, my career knowledge file isn't available right now. Please use the contact link on this portfolio.");
  });
})();
