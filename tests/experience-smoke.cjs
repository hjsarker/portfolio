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
      await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('.project-card').first().waitFor();
      await page.screenshot({path:'qa-'+size.name+'-portfolio.png',fullPage:true,timeout:45000});

      // Virtual Hillol: disclosed preview, private source excluded, grounded first-person responses.
      const vh=page.locator('#vh-panel');
      const launch=page.locator('#vh-launcher');
      assert.equal(await vh.isVisible(),false);
      await page.waitForFunction(()=>document.querySelector('#vh-status')?.textContent.includes('verified career facts'),null,{timeout:15000});
      await launch.click();
      await vh.waitFor({state:'visible'});
      assert.match(await page.locator('.vh-disclosure').innerText(),/not a live conversation/i);
      assert.match(await page.locator('.vh-message').first().innerText(),/I'm Virtual Hillol/);
      await page.locator('.vh-chip').filter({hasText:'What experience do you have in IT support?'}).click();
      assert.match(await page.locator('.vh-message').last().innerText(),/HRC|IT support|Jira/i);
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
      await page.keyboard.press('Escape');
      assert.equal(await vh.isVisible(),false);
      assert.equal(await launch.getAttribute('aria-expanded'),'false');
      const knowledge=await page.request.get('http://127.0.0.1:8765/data/virtual-hillol-knowledge.json');
      assert.equal(knowledge.status(),200);
      const safeKb=await knowledge.json();
      assert.equal(safeKb.experience.length,6);
      assert.equal(safeKb.projects.length,6);
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
      assert.match(visual.stylesheet,/20261102-virtual-hillol/);
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
