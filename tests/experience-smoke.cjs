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
      await greetingPage.clock.fastForward(3000);
      assert.equal(await invitation.isVisible(),false,'No early invitation');
      await greetingPage.clock.fastForward(6000);
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
        // An incognito-like fresh page that stays in a background tab must
        // still show the invitation after eight cumulative visible seconds.
        const bgPage=await context.newPage();
        await bgPage.clock.install();
        await bgPage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
        await bgPage.locator('#vh-teaser').waitFor({state:'attached'});
        await bgPage.evaluate(()=>{
          window.__teaserTestHidden=false;
          Object.defineProperty(document,'hidden',{
            configurable:true,get:()=>window.__teaserTestHidden
          });
        });
        await bgPage.clock.fastForward(3500);
        await bgPage.evaluate(()=>{
          window.__teaserTestHidden=true;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await bgPage.clock.fastForward(12000);
        assert.equal(await bgPage.locator('#vh-teaser').isVisible(),false,'Background time must not show the invitation');
        await bgPage.evaluate(()=>{
          window.__teaserTestHidden=false;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await bgPage.clock.fastForward(4500);
        assert.equal(await bgPage.locator('#vh-teaser').isVisible(),true,'The invitation resumes after returning to the visible tab');
        await bgPage.close();
      }
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
      assert.match(await page.locator('.vh-message').last().innerText(),/\+49 157 5061 2784/,'Approved recruiter phone available in preview mode');
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
          body:JSON.stringify({reply:"I have **9+ years of combined experience** across IT support and BI/data work.\n\n- **Full-time roles:** At HRC Technologies, I supported operations.\n- **Part-time roles:** I worked with **Power BI** and SQL at TK Elevator.\n\n### Technical skills\nI use `SQL` and Power BI.\nSee [my portfolio](https://hjsarker.github.io/portfolio/) for more.\n\n<script>alert(\"not-safe\")</script>",mode:'live',model:'openai/gpt-6-luna'})
        });
      });
      await livePage.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
      await livePage.locator('#vh-launcher').click();
      await livePage.waitForFunction(()=>document.querySelector('#vh-mode')?.textContent==='Online',null,{timeout:10000});
      assert.equal(await livePage.locator('#vh-mode').innerText(),'Online');
      await livePage.locator('#vh-input').fill('Tell me about your Power BI and SQL skills.');
      await livePage.locator('#vh-send').click();
      await livePage.waitForFunction(()=>document.querySelector('.vh-message:last-child')?.textContent.includes('9+ years of combined experience'),null,{timeout:15000});
      const rendered=livePage.locator('.vh-assistant .vh-bubble').last();
      assert.equal(await rendered.locator('strong').first().innerText(),'9+ years of combined experience','Markdown bold must render as bold');
      assert.equal(await rendered.locator('ul.vh-md-list li').count(),2,'Markdown bullets should be real list items');
      assert.equal(await rendered.locator('.vh-md-heading').innerText(),'Technical skills','Markdown headings should be styled without hashes');
      assert.equal(await rendered.locator('code').first().innerText(),'SQL','Inline code must be formatted');
      assert.equal(await rendered.locator('a[href="https://hjsarker.github.io/portfolio/"]').count(),1,'Safe Markdown links are clickable');
      assert.equal(await rendered.locator('script,iframe,img').count(),0,'Untrusted model HTML must not create DOM nodes');
      assert.match(await rendered.innerText(),/<script>alert/,'Untrusted markup stays readable as text');
      assert.doesNotMatch(await rendered.innerText(),/\*\*|^### /m,'Markdown syntax must not leak into display');
      const formatting=await rendered.locator('ul.vh-md-list').evaluate(el=>({
        list:getComputedStyle(el).listStyleType,
        whitespace:getComputedStyle(el).whiteSpace
      }));
      assert.equal(formatting.list,'disc','Bullets should be visible');
      assert.equal(formatting.whitespace,'normal','Line breaks are controlled by rendered HTML');
      // Pasted user messages stay literal, even if they contain Markdown or HTML.
      await livePage.locator('#vh-input').fill('Can you explain **Power BI** to me?');
      await livePage.locator('#vh-send').click();
      assert.match(await livePage.locator('.vh-user').last().innerText(),/\*\*Power BI\*\*/);
      assert.equal(await livePage.locator('.vh-user').last().locator('strong').count(),0);

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
      assert.equal(safeKb.projects.length,8);
      assert.ok(safeKb.projects.some(project=>project.name==='BahnPulse'));
      assert.ok(safeKb.projects.some(project=>project.name==='OpsLens'&&project.url==='https://opslens-hjsarkers-projects.vercel.app/'));
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
      assert.equal(visual.cards,7,'Show all seven selected projects');
      assert.equal(await page.locator('.filter[data-filter="all"] span').innerText(),'07');
      assert.equal(await page.locator('.about-facts .fact-number').nth(1).innerText(),'07');
      assert.equal(await page.locator('#p-opslens').count(),1);
      assert.equal(await page.locator('#p-opslens').locator('..').locator('a[href="https://opslens-hjsarkers-projects.vercel.app/"]').count(),1);
      assert.equal(await page.locator('#p-opslens').locator('..').locator('a[href^="https://github.com/hjsarker/opslens"]').count(),0,'No uncreated code repository link');

      assert.deepEqual(await page.locator('.project-grid .project-card h3').allTextContents().then(items=>items.map(item=>item.replace(/\s+Live\s*$/,'').trim())),[
        'Germany Power Pulse','Auto Pulse','OpsLens','HireDraftAI','BahnPulse','Cosmic Atlas','AI: The Long Road to Now'
      ],'Recruiter-focused project order');
      assert.equal(await page.locator('.project-collaboration h3').innerText(),'Collective AI Tools');
      assert.equal(await page.locator('.filter[data-filter="collab"]').count(),0,'Collaboration moved out of the featured grid');
      assert.match(await page.locator('.hero-professional-line').innerText(),/IT Operations & Application Support.*Business Intelligence & Data Analytics/);
      await page.locator('.filter[data-filter="data"]').click();
      assert.equal(await page.locator('.project-card:visible').count(),4,'Data filter includes BahnPulse and OpsLens');
      await page.locator('.filter[data-filter="all"]').click();
      assert.equal(await page.locator('.project-card:visible').count(),7);
      assert.ok(visual.scrollWidth<=visual.width+8,'No unwanted horizontal overflow: '+JSON.stringify(visual));
      assert.match(visual.stylesheet,/^\.\/design\.css\?v=\d{8}-[a-z0-9-]+$/,'Versioned portfolio CSS URL');
      // New portrait must be accessible without breaking the name's back-to-top link.
      assert.equal(await page.locator('.brand-name-link[href="#top"]').count(),1,'Name still links to top');
      const portraitIcon=page.locator('#brand-photo-toggle img');
      assert.match(await portraitIcon.getAttribute('src'),/assets\/portrait\.webp/);
      await page.waitForFunction(()=>document.querySelector('#brand-photo-toggle img')?.naturalWidth>0);
      await page.locator('#brand-photo-toggle').click();
      const portraitDialog=page.locator('#portrait-dialog');
      assert.equal(await portraitDialog.isVisible(),true,'Clicking the portrait opens a larger view');
      assert.equal(await portraitDialog.locator('img').isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await portraitDialog.isVisible(),false,'Escape closes the enlarged portrait');
      await page.locator('#brand-photo-toggle').click();
      await page.locator('#portrait-dialog-close').click();
      assert.equal(await portraitDialog.isVisible(),false,'Close button dismisses portrait');
      const headerLinks=page.locator('.header-quicklinks a');
      assert.equal(await headerLinks.count(),5,'Five professional and contact links in header');
      const expectedHeaderLinks=[
        'https://www.linkedin.com/in/hjsarker/',
        'https://github.com/hjsarker',
        'https://hiredraftai.com/',
        'tel:+4915750612784',
        'mailto:hjsarker@gmail.com?subject=Portfolio%20enquiry'
      ];
      assert.deepEqual(await headerLinks.evaluateAll(items=>items.map(link=>link.getAttribute('href'))),expectedHeaderLinks);
      const pngs=page.locator('.header-quicklinks img');
      assert.equal(await pngs.count(),5,'Five self-hosted PNG icons');
      await page.waitForFunction(()=>[...document.querySelectorAll('.header-quicklinks img')].every(img=>img.complete&&img.naturalWidth>0));
      if(size.name==='desktop'){
        assert.equal(await page.locator('.header-quicklinks').isVisible(),true,'Icon dock visible on desktop');
      }else{
        assert.equal(await page.locator('.header-quicklinks').isVisible(),false,'Small mobile header remains uncluttered');
        const menuButton=page.locator('#mobile-toggle');
        await menuButton.click();
        assert.equal(await page.locator('.mobile-quicklinks').isVisible(),true,'Mobile menu contains contact icons');
        assert.equal(await page.locator('.mobile-quicklinks a:visible').count(),5);
        await menuButton.click();
        assert.equal(await page.locator('#mobile-nav').isVisible(),false);
      }
      assert.ok(parseFloat(visual.radius)>=18,'Refined card corner radius applied');
      console.log('VISUAL '+size.name+': '+JSON.stringify(visual));
      await page.locator('[data-exp-company="hrc"]').first().waitFor();
      assert.equal(await page.locator('.exp-timeline-open').count(),1,'Only HRC should have Explore my work');
      assert.equal(await page.locator('.timeline > li').count(),6,'Keep all six employment entries');
      for(const id of ['hrc']){
        assert.equal(await page.locator('.exp-timeline-open[data-exp-company="'+id+'"]').count(),1);
      }
      for(const id of ['rwe','tke','vaillant','eon','yes']){
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
      console.log('PASSED '+size.name+': seven selected projects, eight KB projects, six timeline jobs, HRC-only interactive walkthrough, Escape');
      await context.close();
    }
    assert.deepEqual(problems,[]);
  }finally{await browser.close();}
})().catch(error=>{console.error('Browser QA failed',problems,error);process.exitCode=1;});
