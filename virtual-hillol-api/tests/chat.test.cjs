"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const chat=require("../api/chat.js");
const health=require("../api/health.js");
const ORIGIN="https://hjsarker.github.io";
function res(){
  return {
    headers:{},code:200,payload:null,
    setHeader(k,v){this.headers[k]=v;return this;},
    status(n){this.code=n;return this;},
    json(v){this.payload=v;return this;},
    end(){return this;}
  };
}
const req=(method,origin,body)=>({method,headers:{origin,"x-forwarded-for":"203.0.113.8"},body});
test("health is in awaiting_key mode without credential",()=>{
  delete process.env.OPENROUTER_API_KEY;
  const out=res();
  health(req("GET",ORIGIN),out);
  assert.equal(out.code,200);
  assert.equal(out.payload.mode,"awaiting_key");
  assert.equal(out.headers["Access-Control-Allow-Origin"],ORIGIN);
});
test("chat fails closed without a credential",async()=>{
  delete process.env.OPENROUTER_API_KEY;
  const out=res();
  await chat(req("POST",ORIGIN,{messages:[{role:"user",content:"Hi"}]}),out);
  assert.equal(out.code,503);
  assert.equal(out.payload.error,"not_configured");
});
test("only approved origins receive browser CORS permission",async()=>{
  process.env.OPENROUTER_API_KEY="test-key-do-not-use";
  const out=res();
  await chat(req("POST","https://evil.example",{messages:[{role:"user",content:"Hi"}]}),out);
  assert.equal(out.code,403);
  assert.equal(out.headers["Access-Control-Allow-Origin"],undefined);
});
test("incorrect input rejected before contacting AI provider",async()=>{
  process.env.OPENROUTER_API_KEY="test-key-do-not-use";
  const out=res();
  await chat(req("POST",ORIGIN,{messages:[{role:"assistant",content:"hello"}]}),out);
  assert.equal(out.code,400);
  assert.equal(out.payload.error,"invalid_messages");
});
test("a bounded valid request uses approved public facts and fixed Luna model",async()=>{
  process.env.OPENROUTER_API_KEY="test-key-do-not-use";
  const originalFetch=global.fetch;
  let calls=[];
  global.fetch=async (url,options)=>{
    calls.push({url:String(url),body:options?.body});
    if(String(url).endsWith("virtual-hillol-knowledge.json")){
      return {ok:true,text:async()=>JSON.stringify({
        schemaVersion:1,publicOnly:true,
        experience:Array.from({length:6},(_,i)=>({company:"Test employer "+i})),
        visa:{currentStatus:"student residence permit"},
        identity:{name:"Hillol"}
      })};
    }
    assert.equal(String(url),"https://openrouter.ai/api/v1/chat/completions");
    assert.equal(options.headers.Authorization,"Bearer test-key-do-not-use");
    const payload=JSON.parse(options.body);
    assert.equal(payload.model,"openai/gpt-6-luna");
    assert.equal(payload.max_tokens,650);
    assert.equal(payload.messages[0].role,"system");
    assert.match(payload.messages[0].content,/student residence permit/);
    return {ok:true,status:200,arrayBuffer:async()=>Buffer.from(JSON.stringify({choices:[{message:{content:"I have experience in IT support."}}]}))};
  };
  try{
    const out=res();
    await chat(req("POST",ORIGIN,{messages:[{role:"user",content:"Tell me about IT support."}]}),out);
    assert.equal(out.code,200);
    assert.match(out.payload.reply,/I have experience/);
    assert.equal(calls.length,2);
    assert.equal(out.payload.mode,"live");
    assert.ok(!JSON.stringify(out.payload).includes("test-key-do-not-use"));
  }finally{global.fetch=originalFetch;delete process.env.OPENROUTER_API_KEY;}
});
