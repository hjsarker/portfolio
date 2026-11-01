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
      await page.locator('.exp-feature-cta').click();
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
