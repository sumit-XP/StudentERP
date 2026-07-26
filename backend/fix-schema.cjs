const fs = require('fs');

let content = fs.readFileSync('src/config/schema.sql', 'utf8');

const regex = /-- ==================== Constraints & Indexes \(Post-creation\) ====================[\s\S]*?(?=-- ==================== EXTENSIONS FOR STUDENT MANAGEMENT ====================)/;
const match = content.match(regex);
if (match) {
  const indexesStr = match[0];
  content = content.replace(indexesStr, '');
  content += '\n' + indexesStr;
  fs.writeFileSync('src/config/schema.sql', content, 'utf8');
  console.log('Schema fixed.');
} else {
  console.log('Match not found');
}
