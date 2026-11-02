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
      assert.equal(payload.mode,"live","The production API must recognize the configured OpenRouter key");
      const answerResponse=await fetch("https://virtual-hillol-api-xi.vercel.app/api/chat",{
        method:"POST",
        headers:{"Origin":"https://hjsarker.github.io","Content-Type":"application/json"},
        body:JSON.stringify({messages:[{role:"user",content:"What experience do you have with Power BI and SQL? Please answer briefly."}]}),
        signal:AbortSignal.timeout(31000)
      });
      const answerData=await answerResponse.json().catch(()=>({}));
      console.log("Live AI request status:",answerResponse.status,"error:",answerData.error||"none");
      assert.equal(answerResponse.status,200,"Live model response should succeed: "+JSON.stringify({error:answerData.error,message:answerData.message}));
      assert.equal(answerData.mode,"live");
      assert.equal(answerData.model,"openai/gpt-6-luna");
      assert.equal(typeof answerData.reply,"string");
      assert.ok(answerData.reply.length>30);
      assert.match(answerData.reply,/\b(I|I've|my)\b/i,"AI should speak in first person");
      assert.match(answerData.reply,/Power BI|SQL|Databricks/i,"AI should address documented experience");
      console.log("Live GPT-6 Luna PASS. Answer excerpt:",answerData.reply.slice(0,250));
      return;
    }catch(error){
      last=error;
      if(attempt<3)await new Promise(r=>setTimeout(r,2500));
    }
  }
  throw last;
}
main().catch(error=>{console.error("Vercel live health check failed:",error);process.exitCode=1;});
