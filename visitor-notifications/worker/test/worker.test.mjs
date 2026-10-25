import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../src/index.mjs';
const oldFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = oldFetch; });
const env = {
  TRACKING_ENABLED: 'true',
  GAS_WEBAPP_URL: 'https://script.google.com/macros/s/TEST/exec',
  DELIVERY_TOKEN: 'test-secret-not-for-production-1234567890',
  HASH_SALT: 'unit-test-salt-1234567890'
};
function req(origin = 'https://hjsarker.github.io', method='POST', data={consent:true,page:'/portfolio/',referrer:'linkedin.com',policyVersion:'2026-10-25'}) {
  const r = new Request('https://test.workers.dev/v1/visit',{
    method,headers:{'Origin':origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.44','User-Agent':'Mozilla/5.0 TestAgent'},
    ...(method==='POST'?{body:JSON.stringify(data)}:{})
  });
  Object.defineProperty(r,'cf',{value:{city:'Essen',country:'DE',region:'North Rhine-Westphalia',asn:12345,asOrganization:'Example network'}});
  return r;
}
test('rejects untrusted browser origin', async () => {
  const response=await handler.fetch(req('https://other.example'),env,{});
  assert.equal(response.status,403);
});
test('rejects requests without explicit consent', async () => {
  const response=await handler.fetch(req(undefined,undefined,{consent:false,page:'/portfolio/',policyVersion:'2026-10-25'}),env,{});
  assert.equal(response.status,400);
});
test('does not reveal address details to browser and forwards them to private mail endpoint', async () => {
  let sent;
  globalThis.fetch=async (url,options)=>{sent=JSON.parse(options.body);return new Response('{"ok":true}',{status:200});};
  const response=await handler.fetch(req(),env,{});
  assert.equal(response.status,200);
  assert.equal(sent.record.ip,'203.0.113.44');
  assert.equal(sent.record.city,'Essen');
  assert.equal(sent.record.network,'Example network');
  assert.equal(sent.record.source,'linkedin.com');
  const responseText=await response.text();
  assert.equal(responseText.includes('203.0.113.44'),false);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://hjsarker.github.io');
});
test('returns not configured if backend account is not linked',async()=>{
  const response=await handler.fetch(req(),{TRACKING_ENABLED:'true'},{});
  assert.equal(response.status,503);
});

test('supports cross-origin browser preflight only for the allowed site', async()=>{
  const response=await handler.fetch(req(undefined,'OPTIONS'),env,{});
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://hjsarker.github.io');
});
