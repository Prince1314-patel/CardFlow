'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public/app.js'), 'utf8');
const start = source.indexOf('function vesc(');
const end = source.indexOf("$('vcf').onclick", start);
assert.ok(start >= 0 && end > start, 'VCF exporter is present');
const scope = { $: () => ({ value: '' }) };
vm.createContext(scope);
vm.runInContext(source.slice(start, end), scope);
const parse = value => JSON.parse(JSON.stringify(scope.phoneEntries(value)));
const emails = value => [...scope.emailEntries(value)];

test('reproduced client case: slash separates two phones instead of one TEL', () => {
  assert.deepEqual(parse('+91 22 67186718 / +91 9876543210'), [
    {number: '+91 22 67186718', type: 'WORK'},
    {number: '+91 9876543210', type: 'WORK'}
  ]);
});
test('adjacent international phones split on additional country code prefixes', () => {
  assert.deepEqual(parse('+912267186718+919876543210').map(x => x.number), ['+912267186718','+919876543210']);
});
test('labeled numbers preserve CELL, WORK and FAX types', () => {
  assert.deepEqual(parse('Mobile: +44 7700 900123; Office: 020 7946 0911; Fax: 020 7946 0912').map(x => x.type),
    ['CELL','WORK','FAX']);
});
test('duplicate numbers with punctuation are exported once', () => {
  assert.equal(parse('Mobile: +44 7700 900123 / Cell: +44 (7700) 900123').length,1);
});
test('numbers split across newlines, semicolons and pipes', () => {
  assert.equal(parse('Mobile: +919876543210\nOffice: 011 40004000 | Fax: 011 40004001; Home: 011 40004002').length,4);
});
test('slash separators do not require labels', () => {
  assert.equal(parse('+91 9876543210 / 022 22668800').length,2);
});
test('invalid phone segments do not create TEL entries', () => {
  assert.deepEqual(parse('Call for details / Mobile: +91 9876543210').map(x=>x.number),['+91 9876543210']);
});
test('email scanner recognizes labeled, slashed, comma and newline separated email addresses', () => {
  assert.deepEqual(emails('Email: INFO@EXAMPLE.COM / sales@example.com, support@example.org\ninfo@example.com'),
  ['info@example.com','sales@example.com','support@example.org']);
});
test('email scanner does not mistake web URLs for email addresses', () => {
  assert.deepEqual(emails('www.example.com / https://example.com'),[]);
});
test('VCF contains one TEL per slash-separated phone and one EMAIL per address', () => {
  const vcf = scope.vcardFor({name:'Demo Client',company:'Demo Office',phone:'+91 22 67186718 / +91 9876543210',email:'first@example.com / second@example.com'});
  assert.equal((vcf.match(/^TEL;/gm)||[]).length,2);
  assert.equal((vcf.match(/^EMAIL;/gm)||[]).length,2);
  assert.equal((vcf.match(/BEGIN:VCARD/g)||[]).length,1);
  assert.match(vcf,/TEL;TYPE=WORK:\+91 9876543210/);
});
test('different people remain separate VCARD records', () => {
  const one = scope.vcardFor({name:'First Person',phone:'+91 9876543210',email:'one@example.com'});
  const two = scope.vcardFor({name:'Second Person',phone:'+91 9000000000',email:'two@example.com'});
  assert.equal(((one + two).match(/BEGIN:VCARD/g)||[]).length,2);
});
test('URL field keeps https:// intact', () => {
  const vcf = scope.vcardFor({name:'Demo',website:'https://example.com/staff'});
  assert.match(vcf,/URL:https:\/\/example.com\/staff/);
});
