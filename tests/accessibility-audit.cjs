/* Static portfolio accessibility audit using axe-core and Chromium. */
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
const targets=['','projects/opslens/','projects/germany-power-pulse/'];
const viewports=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}];
(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const out=[];let severe=0;
  try{
    for(const viewport of viewports){
      for(const path of targets){
        const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},reducedMotion:'reduce'});
        try{
          await page.goto('http://127.0.0.1:8765/'+path,{waitUntil:'domcontentloaded'});
          const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
          const violations=result.violations.map(v=>({id:v.id,impact:v.impact,description:v.help,items:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,15)}));
          severe+=violations.filter(v=>['serious','critical'].includes(v.impact)).length;
          out.push({path:path||'/',viewport:viewport.name,violations});
          console.log(viewport.name+' '+(path||'/')+' : '+violations.length+' axe findings; '+violations.filter(v=>['serious','critical'].includes(v.impact)).length+' serious/critical');
          for(const violation of violations) console.log('  '+violation.impact+' '+violation.id+' '+violation.items.length+' nodes');
        }finally{await page.close();}
      }
    }
  }finally{await browser.close();}
  fs.writeFileSync('accessibility-report.json',JSON.stringify(out,null,2));
  console.log('Total serious/critical findings: '+severe);
  if(severe>0)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});