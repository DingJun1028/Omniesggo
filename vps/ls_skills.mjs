import { JunAikey } from './junaikey.mjs';
const be = await JunAikey.selectBackend();
console.log('backend type:', typeof be, JSON.stringify(be).slice(0,200));
const skills = await be.readSkills();
console.log('total skills:', skills.length);
for (const s of skills) {
  const t = Array.isArray(s.traits) ? s.traits.join(',') : '';
  console.log(`- ${s.name}  [${s.level}]  ${t}`);
}
