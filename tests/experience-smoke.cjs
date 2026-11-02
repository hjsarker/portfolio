/* Browser smoke tests for the interactive professional experience explorer. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const problems=[];
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const size of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
      const context=await browser.newContext({viewport:{width:size.width,height:size.height},reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',error=>problems.push(size.name+': '+error.message));
      // Browser QA always exercises deterministic preview responses. Never
      // incur real OpenRouter calls just because the production API is live.
      await page.route('https://virtual-hillol-api-xi.vercel.app/api/health',route=>route.fulfill({
        status:200,
        headers:{'access-control-allow-origin':'http://127.0.0.1:8765','content-type':'application/json'},
        body:JSON.stringify({service:'Virtual Hillol API',mode:'awaiting_key',model:'openai/gpt-6-luna',operational:true})
      }));
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('.project-card').first().waitFor();
      await page.screenshot({path:'qa-'+size.name+'-portfolio.png',fullPage:true,timeout:45000});
      // Timed greeting is an optional desktop card, not an auto-opened modal.
      // Fake the timer so browser tests never spend eight seconds waiting.
      const greetingPage=await context.newPage();
      let aiPosts=0;
      greetingPage.on('request',r=>{if(r.url().includes('/api/chat'))aiPosts++;});
      await greetingPage.clock.install();
      await greetingPage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
      await greetingPage.locator('#vh-launcher').waitFor();
      const invitation=greetingPage.locator('#vh-teaser');
      assert.equal(await invitation.isVisible(),false,'The invitation starts hidden');
      await greetingPage.clock.fastForward(7900);
      assert.equal(await invitation.isVisible(),false,'No early invitation');
      await greetingPage.clock.fastForward(200);
      if(size.name==='desktop'){
        assert.equal(await invitation.isVisible(),true,'The invitation should appear after eight seconds on desktop');
        assert.equal(await greetingPage.locator('#vh-panel').isVisible(),false,'The full chat should not open automatically');
        assert.match(await invitation.innerText(),/Hi! Have a question/);
        await greetingPage.screenshot({path:'qa-'+size.name+'-chat-invitation.png'});
        await greetingPage.locator('#vh-teaser-dismiss').click();
        assert.equal(await invitation.isVisible(),false,'Dismissing the invitation hides it');
        await greetingPage.reload({waitUntil:'domcontentloaded'});
        await greetingPage.clock.fastForward(9000);
        assert.equal(await invitation.isVisible(),false,'Do not repeat the invitation after reload in the same tab');
      }else{
        assert.equal(await invitation.isVisible(),false,'Never interrupt the mobile visitor with a greeting');
      }
      assert.equal(aiPosts,0,'The timer must never submit an AI request');
      await greetingPage.close();
      if(size.name==='desktop'){
        const startPage=await context.newPage();
        await startPage.clock.install();
        await startPage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
        await startPage.clock.fastForward(8200);
        assert.equal(await startPage.locator('#vh-teaser').isVisible(),true,'Show on a fresh tab');
        await startPage.locator('#vh-teaser-start').click();
        assert.equal(await startPage.locator('#vh-panel').isVisible(),true,'Start opens the chat');
        assert.equal(await startPage.locator('#vh-teaser').isVisible(),false,'Start hides the teaser');
        await startPage.close();
      }


      // Virtual Hillol: disclosed preview, private source excluded, grounded first-person responses.
      const vh=page.locator('#vh-panel');
      const launch=page.locator('#vh-launcher');
      assert.equal(await vh.isVisible(),false);
      await page.waitForFunction(()=>document.querySelector('#vh-status')?.textContent.includes('Preview answers'),null,{timeout:15000});
      await launch.click();
      await vh.waitFor({state:'visible'});
      assert.equal(await page.locator('.vh-disclosure').count(),0,'Remove the large caution banner');
      assert.match(await page.locator('.vh-head-copy').innerText(),/AI chat about my experience/);
      assert.equal(await page.locator('.vh-footnote a[href="./privacy.html"]').count(),1,'Privacy details remain accessible');
      assert.match(await page.locator('.vh-message').first().innerText(),/I'm Virtual Hillol/);
      await page.locator('.vh-chip').filter({hasText:'What experience do you have in IT support?'}).click();
      assert.match(await page.locator('.vh-message').last().innerText(),/HRC|IT support|Jira/i);
      await page.locator('#vh-input').fill('Can you share your phone number?');
      await page.locator('#vh-send').click();
      assert.match(await page.locator('.vh-message').last().innerText(),/\\+49 157 5061 2784/,'Approved recruiter phone available in preview mode');
      await page.locator('#vh-input').fill('What experience do you have with Power BI and SQL?');
      await page.locator('#vh-send').click();
      assert.match(await page.locator('.vh-message').last().innerText(),/TK Elevator|Databricks/);
      await page.locator('#vh-input').fill('What is your visa situation and can you work full-time?');
      await page.locator('#vh-send').click();
      assert.match(await page.locator('.vh-message').last().innerText(),/student residence permit/i);
      assert.match(await page.locator('.vh-message').last().innerText(),/ZAB/);
      assert.match(await page.locator('.vh-message').last().innerText(),/three weeks/);
      assert.match(await page.locator('.vh-message').last().innerText(),/estimate, not a guaranteed/i);
      await page.locator('#vh-input').fill('Job description: We are looking for an IT support engineer experienced with Microsoft 365, Jira, Windows, Power BI, SQL and Kubernetes. Fluent German B2 required. Responsibilities include supporting incidents and maintaining reports.');
      await page.locator('#vh-send').click();
      assert.match(await page.locator('.vh-message').last().innerText(),/DOCUMENTED EXPERIENCE/);
      assert.match(await page.locator('.vh-message').last().innerText(),/Kubernetes|cloud administration/i);
      assert.match(await page.locator('.vh-message').last().innerText(),/German/);
      await page.screenshot({path:'qa-'+size.name+'-virtual-hillol.png',timeout:30000});
      // Live mode UI is tested with a safe mock response, not a paid API call.
      const livePage=await context.newPage();
      await livePage.route('https://virtual-hillol-api-xi.vercel.app/api/health',route=>route.fulfill({
        status:200,
        headers:{'access-control-allow-origin':'http://127.0.0.1:8765','content-type':'application/json'},
        body:JSON.stringify({service:'Virtual Hillol API',mode:'live',model:'openai/gpt-6-luna',operational:true})
      }));
      await livePage.route('https://virtual-hillol-api-xi.vercel.app/api/chat',async route=>{
        const post=route.request().postDataJSON();
        assert.equal(post.messages.at(-1).role,'user');
        await route.fulfill({
          status:200,
          headers:{'access-control-allow-origin':'http://127.0.0.1:8765','content-type':'application/json'},
          body:JSON.stringify({reply:'I built Power BI reports and used SQL in Databricks at TK Elevator.',mode:'live',model:'openai/gpt-6-luna'})
        });
      });
      await livePage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
      await livePage.locator('#vh-launcher').click();
      await livePage.waitForFunction(()=>document.querySelector('#vh-mode')?.textContent==='Online',null,{timeout:10000});
      assert.equal(await livePage.locator('#vh-mode').innerText(),'Online');
      await livePage.locator('#vh-input').fill('Tell me about your Power BI and SQL skills.');
      await livePage.locator('#vh-send').click();
      await livePage.waitForFunction(()=>document.querySelector('.vh-message:last-child')?.textContent.includes('I built Power BI reports'),null,{timeout:15000});
      assert.equal(await livePage.locator('.vh-disclosure').count(),0);
      assert.equal(await livePage.locator('#vh-privacy-text').count(),0);
      assert.equal(await livePage.locator('.vh-footnote a[href="./privacy.html"]').count(),1);
      const visibleChat=await livePage.locator('#vh-panel').innerText();
      assert.doesNotMatch(visibleChat,/GPT-6 Luna|OpenRouter|Vercel|I'm an AI representation, not Hillol personally/);
      await livePage.close();
      await page.keyboard.press('Escape');
      assert.equal(await vh.isVisible(),false);
      assert.equal(await launch.getAttribute('aria-expanded'),'false');
      const knowledge=await page.request.get('http://127.0.0.1:8765/data/virtual-hillol-knowledge.json');
      assert.equal(knowledge.status(),200);
      const safeKb=await knowledge.json();
      assert.equal(safeKb.experience.length,6);
      assert.equal(safeKb.projects.length,6);
      assert.equal(safeKb.identity.publicContact.phone,'+49 157 5061 2784');
      assert.ok(!JSON.stringify(safeKb).includes('Kurfürstenstraße'));
      assert.ok(!JSON.stringify(safeKb).includes('1992-12-09'));
      assert.ok(!JSON.stringify(safeKb).includes('160-038-907'));

      const visual=await page.evaluate(()=>{
        const card=document.querySelector('.project-card');
        const heading=document.querySelector('#work-heading');
        const link=document.querySelector('link[href*="design.css"]');
        return {
          width:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          cards:document.querySelectorAll('.project-card').length,
          radius:getComputedStyle(card).borderRadius,
          headingWeight:getComputedStyle(heading).fontWeight,
          stylesheet:link?.getAttribute('href')
        };
      });
      assert.equal(visual.cards,6,'Keep the six selected projects');
      assert.ok(visual.scrollWidth<=visual.width+8,'No unwanted horizontal overflow: '+JSON.stringify(visual));
      assert.match(visual.stylesheet,/20261103-clean-chat/);
      assert.ok(parseFloat(visual.radius)>=18,'Refined card corner radius applied');
      console.log('VISUAL '+size.name+': '+JSON.stringify(visual));
      await page.locator('[data-exp-company="hrc"]').first().waitFor();
      assert.equal(await page.locator('.exp-timeline-open').count(),3);
      assert.equal(await page.locator('.timeline > li').count(),6,'Keep all six employment entries');
      for(const id of ['rwe','tke','hrc']){
        assert.equal(await page.locator('.exp-timeline-open[data-exp-company="'+id+'"]').count(),1);
      }
      for(const id of ['vaillant','eon','yes']){
        assert.equal(await page.locator('.exp-timeline-open[data-exp-company="'+id+'"]').count(),0);
      }
      assert.equal(await page.locator('#experience-explorer').isVisible(),false);
      assert.equal(await page.locator('.exp-feature-invite').count(),0,'Promotional experience panel was removed');
      assert.equal(await page.locator('.exp-explore-note').count(),1,'Short introduction remains');
      await page.locator('.exp-timeline-open[data-exp-company="hrc"]').click();
      const modal=page.locator('#experience-explorer');
      await modal.waitFor({state:'visible'});
      assert.match(await page.locator('#exp-modal-title').innerText(),/HRC Technologies/);
      assert.equal(await page.locator('.exp-arch-node').count(),6);
      assert.match(await page.locator('#exp-node-details').innerText(),/Application support/);
      assert.match(await page.locator('.exp-disclosure').innerText(),/sanitized/);
      await page.locator('[data-exp-node="solaris"]').click();
      assert.match(await page.locator('#exp-node-details').innerText(),/not Solaris administration/);
      await page.screenshot({path:'qa-'+size.name+'-architecture.png'});
      await page.locator('[data-exp-tab="workplace"]').click();
      assert.equal(await page.locator('.exp-workplace-tile').count(),7,'Seven distinct workplace IT support areas');
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/onboarding|offboarding/i);
      await page.locator('[data-exp-area="network"]').click();
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/LAN & Wi-Fi/);
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/network administration/);
      await page.locator('[data-exp-area="inventory"]').click();
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/equipment/);
      await page.locator('[data-exp-area="printers"]').click();
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/printers/i);
      await page.locator('[data-exp-area="meetings"]').click();
      assert.match(await page.locator('#exp-workplace-detail').innerText(),/meeting room/i);
      await page.screenshot({path:'qa-'+size.name+'-workplace.png'});
      await page.locator('[data-exp-tab="role"]').click();
      assert.match(await page.locator('.exp-role-grid').innerText(),/DBA/);
      assert.match(await page.locator('.exp-role-grid').innerText(),/Tomcat/);
      assert.match(await page.locator('.exp-role-grid').innerText(),/offboarding/);
      assert.match(await page.locator('.exp-role-grid').innerText(),/Wi-Fi/);
      await page.locator('[data-exp-tab="case"]').click();
      assert.equal(await page.locator('.exp-incident-step').count(),4);
      await page.locator('[data-exp-step="2"]').click();
      assert.match(await page.locator('#exp-incident-panel').innerText(),/DBA/);
      await page.locator('[data-exp-incident="connectivity"]').click();
      assert.equal(await page.locator('[data-exp-incident="connectivity"]').getAttribute('aria-pressed'),'true');
      assert.match(await page.locator('#exp-incident-panel').innerText(),/office network|Wi-Fi/);
      await page.locator('[data-exp-step="2"]').click();
      assert.match(await page.locator('#exp-incident-panel').innerText(),/network specialist/);
      await page.keyboard.press('Escape');
      assert.equal(await modal.isVisible(),false);
      assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('experience-modal-open')),false);
      await page.locator('[data-exp-company="rwe"]').last().click();
      await modal.waitFor({state:'visible'});
      assert.match(await page.locator('#exp-modal-title').innerText(),/RWE Renewables/);
      assert.match(await page.locator('.exp-preview').innerText(),/placeholder/i);
      assert.equal(await page.locator('#exp-tabs').isVisible(),false);
      await page.screenshot({path:'qa-'+size.name+'-preview.png'});
      await page.locator('.exp-modal-close').click();
      assert.equal(await modal.isVisible(),false);
      await page.locator('[data-exp-company="tke"]').last().click();
      assert.match(await page.locator('#exp-modal-title').innerText(),/TK Elevator/);
      assert.match(await page.locator('.exp-preview').innerText(),/placeholder/i);
      await page.keyboard.press('Escape');
      assert.equal(await modal.isVisible(),false);
      console.log('PASSED '+size.name+': three explorer links, six timeline jobs, HRC tabs, incident workflows, RWE/TK previews, Escape');
      await context.close();
    }
    assert.deepEqual(problems,[]);
  }finally{await browser.close();}
})().catch(error=>{console.error('Browser QA failed',problems,error);process.exitCode=1;});
