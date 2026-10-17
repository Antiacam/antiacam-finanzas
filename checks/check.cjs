const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
let scripts=0;
for(const name of fs.readdirSync(root)){
  if(name.endsWith('.js')){new vm.Script(fs.readFileSync(path.join(root,name),'utf8'),{filename:name});scripts++;}
  if(!name.endsWith('.html'))continue;
  const html=fs.readFileSync(path.join(root,name),'utf8');
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim()){new vm.Script(match[1],{filename:name});scripts++;}
  for(const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const target=match[1];if(/^(?:https?:|data:)/.test(target))continue;
    if(!fs.existsSync(path.join(root,target)))throw new Error(`${name}: archivo ausente ${target}`);
  }
  if(/mgonzalez|mgonzales|hacs|131518184/i.test(html))throw new Error(`${name}: identidad antigua`);
}
console.log(`${scripts} scripts válidos; referencias locales completas; identidad Antiacam verificada.`);
