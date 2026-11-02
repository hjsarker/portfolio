"use strict";
const assert=require("node:assert/strict");
const URL="https://virtual-hillol-api-xi.vercel.app/api/health";
async function main(){
  let last;
  for(let attempt=0;attempt<4;attempt++){
    try{
      const result=await fetch(URL,{
        headers:{"Origin":"https://hjsarker.github.io","Accept":"application/json"},
        signal:AbortSignal.timeout(12000)
      });
      assert.equal(result.status,200,"Vercel function should be publicly reachable");
      assert.equal(result.headers.get("access-control-allow-origin"),"https://hjsarker.github.io");
      const payload=await result.json();
      assert.equal(payload.service,"Virtual Hillol API");
      assert.equal(payload.model,"openai/gpt-6-luna");
      assert.equal(payload.operational,true);
      assert.ok(["awaiting_key","live"].includes(payload.mode));
      const home=await fetch("https://virtual-hillol-api-xi.vercel.app/",{signal:AbortSignal.timeout(12000)});
      assert.equal(home.status,200,"The API homepage should explain the service, not show a 404");
      assert.match(await home.text(),/Virtual Hillol API/);
      console.log("Public Vercel homepage PASS.");
      console.log("Public Vercel health PASS. Mode:",payload.mode);
      return;
    }catch(error){
      last=error;
      if(attempt<3)await new Promise(r=>setTimeout(r,2500));
    }
  }
  throw last;
}
main().catch(error=>{console.error("Vercel live health check failed:",error);process.exitCode=1;});
