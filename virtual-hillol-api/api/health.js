"use strict";
const ALLOWED_ORIGINS=new Set(["https://hjsarker.github.io","https://hillol.de","https://www.hillol.de","http://127.0.0.1:8765","http://localhost:8765"]);
module.exports=function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Vary","Origin");
  const origin=String(req.headers.origin||"");
  if(ALLOWED_ORIGINS.has(origin)){
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
  }
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="GET")return res.status(405).json({error:"method_not_allowed"});
  return res.status(200).json({
    service:"Virtual Hillol API",
    mode:process.env.OPENROUTER_API_KEY?"live":"awaiting_key",
    model:"openai/gpt-6-luna",
    operational:true
  });
};

