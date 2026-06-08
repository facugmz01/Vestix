import * as fs from 'fs';
import * as path from 'path';

const BACKEND_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(BACKEND_DIR, 'src');

const DOMAIN_MAP: Record<string, string> = {
  auth: 'identity',
  users: 'identity',
  products: 'catalog',
  pricing: 'catalog',
  catalog: 'catalog',
  identifiers: 'catalog',
  sales: 'sales',
  pos: 'sales',
  offline: 'sales',
  customers: 'sales',
  inventory: 'logistics',
  branches: 'logistics',
  warehouses: 'logistics',
  purchasing: 'procurement',
  'goods-receipt': 'procurement',
  suppliers: 'procurement',
  finance: 'finance',
  payments: 'finance',
  invoicing: 'invoicing',
  afip: 'invoicing',
  notifications: 'notifications',
  integrations: 'integrations',
};

// 1. Find all TS files recursively
function getTsFiles(dir: string, filesList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      const baseName = path.basename(name);
      if (baseName !== 'node_modules' && baseName !== 'dist' && baseName !== 'scratch') {
        getTsFiles(name, filesList);
      }
    } else if (file.endsWith('.ts')) {
      filesList.push(name);
    }
  }
  return filesList;
}

// 2. Index files with old and new absolute paths
interface FileIndex {
  oldPath: string;
  newPath: string;
}

const allFiles = getTsFiles(BACKEND_DIR);
const index: FileIndex[] = [];

for (const file of allFiles) {
  // Check if file is inside src/modules/
  const relativeToSrc = path.relative(SRC_DIR, file);
  const parts = relativeToSrc.split(path.sep);

  if (parts[0] === 'modules' && parts.length > 1) {
    const oldModule = parts[1];
    const newDomain = DOMAIN_MAP[oldModule];
    if (newDomain) {
      // Move from src/modules/oldModule/... to src/domains/newDomain/...
      const newRelativeParts = ['domains', newDomain, ...parts.slice(2)];
      const newPath = path.join(SRC_DIR, ...newRelativeParts);
      index.push({ oldPath: file, newPath });
    } else {
      index.push({ oldPath: file, newPath: file });
    }
  } else {
    index.push({ oldPath: file, newPath: file });
  }
}

// 3. Move files physically
function moveFiles() {
  console.log('Moving files to new domain directories...');
  for (const item of index) {
    if (item.oldPath === item.newPath) continue;

    const dir = path.dirname(item.newPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(item.oldPath, item.newPath);
  }
  console.log('All files moved.');
}

// 4. Update relative imports in all TS files
function updateImports() {
  console.log('Updating relative imports in all TS files...');
  for (const item of index) {
    const filePath = item.newPath; // File has been moved here
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Match relative imports: import/export ... from './something' or import './something'
    const importRegex = /(import|export)\s+([\s\S]*?)\s+from\s+['"](\.\.?\/[^'"]*)['"]/g;
    const simpleImportRegex = /import\s+['"](\.\.?\/[^'"]*)['"]/g;
    const requireRegex = /require\(['"](\.\.?\/[^'"]*)['"]\)/g;

    let modified = false;

    const rewritePath = (importPath: string) => {
      const oldDir = path.dirname(item.oldPath);
      const targetOldPathNoExt = path.resolve(oldDir, importPath);

      // Check if this resolved path matches any old file path (handling extension omission)
      let targetFileIndex = index.find(f => {
        const fNoExt = f.oldPath.replace(/\.ts$/, '');
        if (fNoExt === targetOldPathNoExt) return true;
        if (f.oldPath.endsWith('/index.ts') && fNoExt.replace(/\/index$/, '') === targetOldPathNoExt) return true;
        return false;
      });

      if (targetFileIndex) {
        // Target file moved. Calculate relative path from new file path to new target file path
        const newDir = path.dirname(item.newPath);
        const newTargetNoExt = targetFileIndex.newPath.replace(/\.ts$/, '');
        let newRelPath = path.relative(newDir, newTargetNoExt).replace(/\\/g, '/');

        if (!newRelPath.startsWith('.')) {
          newRelPath = './' + newRelPath;
        }

        if (importPath.endsWith('/index') && !newRelPath.endsWith('/index')) {
          newRelPath += '/index';
        } else if (!importPath.endsWith('/index') && newRelPath.endsWith('/index')) {
          newRelPath = newRelPath.substring(0, newRelPath.length - 6);
        }

        return newRelPath;
      } else {
        // Target is not a TS file in our index (could be a core file or config that didn't move)
        // Resolve it relative to old directory, then calculate relative path from new directory
        const resolvedTargetAbs = path.resolve(oldDir, importPath);
        const newDir = path.dirname(item.newPath);
        let newRelPath = path.relative(newDir, resolvedTargetAbs).replace(/\\/g, '/');
        if (!newRelPath.startsWith('.')) {
          newRelPath = './' + newRelPath;
        }
        return newRelPath;
      }
    };

    content = content.replace(importRegex, (match, impExp, specifier, importPath) => {
      const newImportPath = rewritePath(importPath);
      if (newImportPath !== importPath) {
        modified = true;
        return `${impExp} ${specifier} from '${newImportPath}'`;
      }
      return match;
    });

    content = content.replace(simpleImportRegex, (match, importPath) => {
      // Exclude simple imports that are not from "from" regex matches (already processed)
      // Check if match contains "from" by matching the larger regex
      const testRegex = /(import|export)\s+([\s\S]*?)\s+from\s+['"](\.\.?\/[^'"]*)['"]/;
      if (testRegex.test(match)) return match;
      
      const newImportPath = rewritePath(importPath);
      if (newImportPath !== importPath) {
        modified = true;
        return `import '${newImportPath}'`;
      }
      return match;
    });

    content = content.replace(requireRegex, (match, importPath) => {
      const newImportPath = rewritePath(importPath);
      if (newImportPath !== importPath) {
        modified = true;
        return `require('${newImportPath}')`;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
  console.log('Imports updated in all files.');
}

// Execute
moveFiles();
updateImports();
console.log('Restructuring script complete!');
