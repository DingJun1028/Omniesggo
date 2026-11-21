// Bash syntax verification using Node.js child_process
import { execSync } from 'node:child_process';
const sh = 'C:\\Program Files\\Git\\bin\\bash.exe';
try {
  // Method 1: bash -n for syntax check (POSIX)
  execSync(`"${sh}" -n apps/universal-translator/deploy/verify_universal_translator.sh`, { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ verify_universal_translator.sh: PASS (bash -n)');
} catch (e) {
  console.log('❌ verify_universal_translator.sh: FAIL');
  console.log(e.message);
  process.exit(1);
}