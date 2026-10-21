import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/scan.js';

const VALID='data:image/jpeg;base64,QUJDRA==';
const previous=process.env.KRUTRIM_API_KEY;
process.env.KRUTRIM_API_KEY='test-key-only';
function res(){
  return {statusCode:200,headers:{},body:null,
    setHeader(k,v){this.headers[k]=v;return this},
    status(n){this.statusCode=n;return this},
    json(v){this.body=v;return this}};
}
async function simulate(payload,{status=200,finish='stop',httpStatus=200,reqImages=[VALID],method='POST',reject=null}={}){
 const orig=globalThis.fetch;
 globalThis.fetch=async(url,args)=>{
  if(reject)throw reject;
  assert.equal(args.method,'POST');
  const body=JSON.parse(args.body);
  assert.ok(body.messages[0].content.some(c=>c.type==='image_url'));
  return {ok:httpStatus===200,status:httpStatus,json:async()=>({choices:[{finish_reason:finish,message:{content:payload}}]})};
 };
 try{const response=res();await handler({method,body:{images:reqImages}},response);return response}
 finally{globalThis.fetch=orig}
}
test('valid response returns contacts',async()=>{const r=await simulate(JSON.stringify({contacts:[{name:'Test Contact',email:'a@b.com'}]}));assert.equal(r.statusCode,200);assert.equal(r.body.contacts[0].email,'a@b.com')});
test('code-fenced JSON response',async()=>{const r=await simulate('```json\n'+JSON.stringify({contacts:[{name:'Test'}]})+'\n```');assert.equal(r.statusCode,200)});
test('partial text surrounding JSON is handled',async()=>{const r=await simulate('Here are the contacts: '+JSON.stringify({contacts:[{name:'Test'}]})+' Thanks');assert.equal(r.statusCode,200)});
test('truncated AI result has actionable error code',async()=>{const r=await simulate('{"contacts":[{"name":"', {finish:'length'});assert.equal(r.statusCode,422);assert.equal(r.body.code,'INCOMPLETE_RESPONSE')});
test('invalid JSON is not represented as blurry photo',async()=>{const r=await simulate('{"contacts": [');assert.equal(r.statusCode,422);assert.equal(r.body.code,'INVALID_AI_RESPONSE');assert.doesNotMatch(r.body.error,/clearer photo/i)});
test('missing contact array produces schema error',async()=>{const r=await simulate('{"foo": []}');assert.equal(r.statusCode,422);assert.equal(r.body.code,'INVALID_AI_RESPONSE')});
test('empty array returns no contacts',async()=>{const r=await simulate('{"contacts":[]}');assert.equal(r.statusCode,422);assert.equal(r.body.code,'NO_CONTACTS')});
test('429 communicates throttling',async()=>{const r=await simulate('',{httpStatus:429});assert.equal(r.statusCode,429);assert.equal(r.body.code,'RATE_LIMIT')});
test('provider 502 remains separate from parse issues',async()=>{const r=await simulate('',{httpStatus:502});assert.equal(r.statusCode,502);assert.equal(r.body.code,'PROVIDER_ERROR')});
test('timeout communicates smaller batch',async()=>{const r=await simulate('',{reject:Object.assign(new Error('timer'),{name:'TimeoutError'})});assert.equal(r.statusCode,504);assert.equal(r.body.code,'PROVIDER_TIMEOUT')});
test('array-form AI content supported',async()=>{const r=await simulate([{type:'text',text:JSON.stringify({contacts:[{name:'Array response'}]})}]);assert.equal(r.statusCode,200)});
test('input validation blocks unsupported image format',async()=>{const r=await simulate('',{reqImages:['data:image/svg+xml;base64,AA==']});assert.equal(r.statusCode,400);assert.equal(r.body.code,'INVALID_IMAGE')});
test('non-string unexpected contact values converted to empty strings',async()=>{const r=await simulate(JSON.stringify({contacts:[{name:'Alex',phone:777,company:['Foo']}]}));assert.equal(r.statusCode,200);assert.equal(r.body.contacts[0].phone,'');assert.equal(r.body.contacts[0].company,'')});
test('backend does not echo provider image input in errors',async()=>{const r=await simulate('hello',{httpStatus:500});assert.equal(r.body.error.includes('QUJDRA=='),false)});
process.on('exit',()=>{if(previous===undefined)delete process.env.KRUTRIM_API_KEY;else process.env.KRUTRIM_API_KEY=previous});
