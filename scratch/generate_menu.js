const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zlamasnpdzdactxmmzou.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYW1hc25wZHpkYWN0eG1tem91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcyOTU1NCwiZXhwIjoyMDk0MzA1NTU0fQ.daoTXd0dISMgobpA3JD-sIXDCKMweMSFLVCouxDh7nU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('courses').select('이수구분, 이수영역');
  if (error) {
    console.error(error);
    return;
  }
  
  const menuMap = {};
  data.forEach(row => {
    const cat = row['이수구분'];
    const sub = row['이수영역'];
    if (!cat) return;
    if (!menuMap[cat]) menuMap[cat] = new Set();
    if (sub) menuMap[cat].add(sub);
  });
  
  const menuArray = Object.keys(menuMap).map(cat => ({
    category: cat,
    subCategories: Array.from(menuMap[cat]).filter(Boolean).sort()
  })).sort((a,b) => a.category.localeCompare(b.category));
  
  const fileContent = `export interface MenuCategory {\n  category: string;\n  subCategories: string[];\n}\n\nexport const COURSE_MENU_DATA: MenuCategory[] = ${JSON.stringify(menuArray, null, 2)};\n`;
  
  fs.mkdirSync('lib/data', { recursive: true });
  fs.writeFileSync('lib/data/menu.ts', fileContent);
  console.log('Successfully generated lib/data/menu.ts');
}

run();
