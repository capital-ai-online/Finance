import process from 'node:process';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) fail(`Missing required argument ${name}`);
  return process.argv[index + 1];
}

const image = readArg('--image').trim();
const digest = readArg('--digest').trim();

if (image !== 'ghcr.io/capital-ai-online/finance') {
  fail(`Unexpected production image authority: ${image}`);
}
if (!/^sha256:[0-9a-f]{64}$/.test(digest)) {
  fail(`Invalid OCI digest: ${digest}`);
}
if (image.includes('@') || image.includes(':latest') || /:[^/]+$/.test(image.replace('ghcr.io/', ''))) {
  fail('Image input must be the canonical tag-free GHCR repository.');
}

process.stdout.write(`${image}@${digest}\n`);
