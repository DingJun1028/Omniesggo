import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// The regex matches the end of a model block that does NOT already have @@schema
// It matches "}" at the end of the block and inserts `@@schema("public")\n}`
content = content.replace(/(\s*)(})(\s*)/g, (match, p1, p2, p3) => {
  // We only want to replace `}` if it belongs to a model/enum. 
  // It's safer to just replace all `}` because Prisma schema only uses `{}` for models/enums/generators/datasources.
  // Actually, generator and datasource don't support @@schema.
  return match;
});

// A safer regex: find `model Name { ... }` and replace the last `}`.
content = content.replace(/model\s+(\w+)\s+{([^}]+)}/g, (match, modelName, body) => {
  if (body.includes('@@schema')) {
    return match;
  }
  return `model ${modelName} {${body}  @@schema("public")\n}`;
});

content = content.replace(/enum\s+(\w+)\s+{([^}]+)}/g, (match, enumName, body) => {
  if (body.includes('@@schema')) {
    return match;
  }
  return `enum ${enumName} {${body}  @@schema("public")\n}`;
});

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Successfully added @@schema("public") to all models and enums');
