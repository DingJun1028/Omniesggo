#!/usr/bin/env node

console.log("OmniAgent CLI mock invoked with args:", process.argv.slice(2));

if (process.argv[2] === 'init') {
  console.log("OmniAgent init successful.");
}
