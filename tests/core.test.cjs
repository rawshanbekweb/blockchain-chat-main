const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./load-ts.cjs');
const { computeFileHash, createBlock, verifyDocumentInChain, getGenesisHash, generateWalletAddress } = load('utils/blockchain.ts', {
  'expo-crypto': { CryptoDigestAlgorithm: { SHA256: 'sha256' }, digest: async (algorithm, bytes) => new Uint8Array(crypto.createHash(algorithm).update(bytes).digest()).buffer, digestStringAsync: async (a, s) => crypto.createHash(a).update(s).digest('hex'), getRandomBytes: crypto.randomBytes },
  'expo-file-system': { File: class {} }, 'react-native': { Platform: { OS: 'web' } },
});
const params = { index: 0, documentName: 'hello.txt', documentHash: 'abc', fileSize: 5, mimeType: 'text/plain', ownerAddress: '0xowner', chatId: 'local-a', previousHash: getGenesisHash() };
test('hash uses real bytes and matches a known SHA-256 vector', async () => {
  assert.equal(await computeFileHash('a', 5, 'text/plain', 'data:text/plain,hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});
test('same content has same hash across renamed files and URIs', async () => {
  assert.equal(await computeFileHash('a', 5, 'text/plain', 'data:text/plain,hello'), await computeFileHash('renamed', 5, 'application/octet-stream', 'data:application/octet-stream;base64,aGVsbG8='));
});
test('same-sized changed content produces a different hash', async () => {
  assert.notEqual(await computeFileHash('a', 5, 'text/plain', 'data:text/plain,hello'), await computeFileHash('a', 5, 'text/plain', 'data:text/plain,jello'));
});
test('rejects oversized file before reading', async () => { await assert.rejects(computeFileHash('a', 21 * 1024 * 1024, 'text/plain', 'invalid-uri')); });
test('valid chain verifies and metadata tampering is rejected', async () => {
  const first = await createBlock(params);
  assert.equal((await verifyDocumentInChain('abc', [first])).verified, true);
  for (const key of ['fileSize', 'mimeType', 'chatId']) {
    assert.equal((await verifyDocumentInChain('abc', [{ ...first, [key]: key === 'fileSize' ? 9 : 'changed' }])).verified, false);
  }
});
test('broken predecessor is rejected even if target block is intact', async () => {
  const first = await createBlock(params);
  const second = await createBlock({ ...params, index: 1, documentHash: 'def', previousHash: first.hash });
  assert.equal((await verifyDocumentInChain('def', [first, second])).verified, true);
  assert.equal((await verifyDocumentInChain('def', [{ ...first, documentName: 'tampered' }, second])).verified, false);
});
test('legacy metadata-only hash never counts as a content proof', async () => {
  const first = await createBlock(params); delete first.version;
  assert.equal((await verifyDocumentInChain('abc', [first])).verified, false);
});
test('profile identifiers have expected format and are distinct', () => { const a = generateWalletAddress(); assert.match(a, /^0x[0-9a-f]{40}$/); assert.notEqual(a, generateWalletAddress()); });
const { validItems, chatSchema, mergeMessages } = load('utils/chat-data.ts');
test('malformed storage cannot become renderable chats', () => {
  assert.deepEqual(validItems(chatSchema, { length: 3 }), []);
  assert.deepEqual(validItems(chatSchema, [null, {}, { id: 'x', name: 5 }]), []);
  const rows = validItems(chatSchema, [{ id: 'x', name: 'Notes', participantAddress: '', unreadCount: -7, lastMessageTime: 'wrong' }]);
  assert.equal(rows[0].unreadCount, 0); assert.equal(rows[0].lastMessageTime, 0);
});
test('server snapshots preserve older cached history and deduplicate echoes', () => {
  const merged = mergeMessages([{ id: 'old', timestamp: 1 }, { id: 'new', timestamp: 3 }], [{ id: 'new', timestamp: 3 }, { id: 'middle', timestamp: 2 }]);
  assert.deepEqual(merged.map(m => m.id), ['old', 'middle', 'new']);
});
