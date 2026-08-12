const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/customers/detail-tabs/MonitoringScopeTab.tsx',
  'src/components/customers/detail-tabs/DataCollectionTab.tsx',
  'src/components/CustomersTab.tsx',
  'src/data/intelligenceModules.ts'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/supabase(\s*)\.from/g, "supabase.schema('admin')$1.from");
  fs.writeFileSync(file, content);
});
