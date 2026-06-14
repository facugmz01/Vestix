const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const replacements = [
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-2"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-2" style={{ gap: "12px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-3"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-3" style={{ gap: "12px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3, 1fr\)',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-3"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3, 1fr\)',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-3" style={{ gap: "12px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4, 1fr\)',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-4"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'240px 1fr',\s*gap:\s*'24px',\s*alignItems:\s*'flex-start'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-settings" style={{ alignItems: "flex-start", gap: "24px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'2fr 1fr',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-2-1"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'120px 1fr',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive grid-cols-120-1" style={{ gap: "12px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive" style={{ gap: "12px" }}'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\\(auto-fit, minmax\\(200px, 1fr\\)\\)',\s*gap:\s*'16px'\s*\}\}/g,
      to: 'className="grid-responsive grid-auto-200"'
    },
    {
      from: /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\\(auto-fill, minmax\\(180px, 1fr\\)\\)',\s*gap:\s*'12px'\s*\}\}/g,
      to: 'className="grid-responsive grid-auto-180" style={{ gap: "12px" }}'
    }
  ];

  for (let r of replacements) {
    content = content.replace(r.from, r.to);
  }

  // Handle more complex ones that didn't match the basic regex
  // Like ones with extra properties or different spacing
  content = content.replace(
    /style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'240px 1fr',\s*gap:\s*'24px',\s*alignItems:\s*'flex-start',\s*paddingBottom:\s*'80px'\s*\}\}/g,
    'className="grid-responsive grid-cols-settings" style={{ alignItems: "flex-start", gap: "24px", paddingBottom: "80px" }}'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

walkDir(path.join(__dirname, 'src'), processFile);
console.log('Done');
