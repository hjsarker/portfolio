/* Capture public demo homepages for portfolio previews.
 * Execute only in GitHub Actions; no credentials or private pages.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const destinations = [
  ['power-pulse','https://hjsarker.github.io/germany-power-pulse/'],
  ['auto-pulse','https://german-auto-pulse.vercel.app/'],
  ['hiredraftai','https://hiredraftai.com/'],
  ['bahnpulse','https://bahn-pulse.vercel.app/'],
  ['cosmic-atlas','https://hjsarker.github.io/cosmic-atlas/'],
  ['ai-history','https://hjsarker.github.io/ai-long-road-to-now/']
];
(async () => {
  const dir = path.join(process.cwd(),'assets','previews');
  fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  let completed=0;
  try {
    for(const [name,url] of destinations){
      const page=await browser.newPage({
        viewport:{width:1280,height:800},deviceScaleFactor:1,
        reducedMotion:'reduce',locale:'en-US'
      });
      try {
        const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
        if(!response || response.status()>=400)throw Error('HTTP '+(response?.status()||'no response'));
        await page.waitForTimeout(2600);
        const body=(await page.locator('body').innerText({timeout:8000})).trim();
        if(body.length<65 || /just a moment|access denied|application error|404 not found/i.test(body.slice(0,500))){
          throw Error('Page content unavailable or challenge detected');
        }
        const output=path.join(dir,name+'.jpg');
        await page.screenshot({path:output,type:'jpeg',quality:76,animations:'disabled',timeout:25000});
        completed++;
        console.log('OK '+name+' '+fs.statSync(output).size+' bytes '+url);
      }catch(err){
        console.warn('SKIP '+name+': '+err.message);
      }finally{await page.close();}
    }
    // Build a precise 1200x630 social card from the real portrait and authored text.
    const sharePage=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1,reducedMotion:'reduce'});
    try{
      await sharePage.goto('file://'+path.join(process.cwd(),'share-card.html'),{waitUntil:'load'});
      await sharePage.locator('.avatar img').evaluate(img=>img.decode());
      const output=path.join(process.cwd(),'assets','social','portfolio-share.jpg');
      await sharePage.screenshot({path:output,type:'jpeg',quality:86,animations:'disabled'});
      console.log('OK social-share '+fs.statSync(output).size+' bytes');
    }finally{await sharePage.close();}
  }finally{await browser.close();}
  if(completed<2)process.exitCode=1;
  console.log('Captured '+completed+' public screenshots');
})().catch(e=>{console.error(e);process.exitCode=1;});