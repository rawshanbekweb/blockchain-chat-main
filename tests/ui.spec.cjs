const { test, expect } = require('@playwright/test');
async function onboard(page, name = 'Aziz') {
  await page.goto('/');
  await page.getByLabel('Ismingiz', { exact: true }).fill(name);
  await page.getByRole('button', { name: /Boshlash/ }).click();
  await expect(page.getByRole('heading', { name: `Salom, ${name}.` })).toBeVisible();
}
async function localNote(page, name = 'Loyiha g‘oyalari') {
  await page.getByRole('button', { name: /Yangi suhbat$/ }).click();
  await page.getByLabel('Suhbat nomi', { exact: true }).fill(name);
  await page.getByRole('button', { name: /Yaratish/ }).click();
  await expect(page.getByPlaceholder('Xabar yozing...')).toBeVisible();
}
for (const width of [1440, 768, 390]) {
  test(`responsive onboarding and dashboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.getByText('Xush kelibsiz.')).toBeVisible();
    await page.screenshot({ path: `artifacts/onboarding-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: /Boshlash/ }).click();
    await expect(page.getByRole('alert')).toContainText('ismingizni');
    await page.getByLabel('Ismingiz', { exact: true }).fill('Aziz');
    await page.getByRole('button', { name: /Boshlash/ }).click();
    await expect(page.getByRole('heading', { name: 'Salom, Aziz.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/dashboard-${width}.png`, fullPage: true });
    await localNote(page);
    await page.getByPlaceholder('Xabar yozing...').fill('Birinchi g‘oyamiz tayyor.');
    await page.getByRole('button', { name: 'Xabar yuborish' }).click();
    await expect(page.getByText('Birinchi g‘oyamiz tayyor.', { exact: true }).filter({ visible: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Birinchi g‘oyamiz tayyor.', { exact: true })).toBeVisible();
    await page.goto('/');
    await page.getByLabel('Suhbat qidirish').fill('topilmaydi');
    await expect(page.getByText('Hozircha natija yo‘q')).toBeVisible();
    await page.getByRole('button', { name: 'Qidiruvni tozalash' }).click();
    await expect(page.getByRole('button', { name: 'Loyiha g‘oyalari suhbatini ochish' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test('real file content can be registered then verified after rename', async ({ page }) => {
  await onboard(page);
  await page.goto('/verify');
  let chooser = page.waitForEvent('filechooser');
  await page.getByText('Hujjat tanlash va saqlash', { exact: true }).click();
  await (await chooser).setFiles({ name: 'original.txt', mimeType: 'text/plain', buffer: Buffer.from('Ravoq content proof') });
  await expect(page.getByText('Mahalliy qayd saqlandi')).toBeVisible();
  chooser = page.waitForEvent('filechooser');
  await page.getByText('Hujjat tanlash', { exact: true }).click();
  await (await chooser).setFiles({ name: 'renamed.txt', mimeType: 'text/plain', buffer: Buffer.from('Ravoq content proof') });
  await expect(page.getByText('Fayl tarkibi mos')).toBeVisible();
  chooser = page.waitForEvent('filechooser');
  await page.getByText('Hujjat tanlash', { exact: true }).click();
  await (await chooser).setFiles({ name: 'original.txt', mimeType: 'text/plain', buffer: Buffer.from('Changed content') });
  await expect(page.getByText('Mos qayd topilmadi')).toBeVisible();
  await page.screenshot({ path: 'artifacts/documents-desktop.png', fullPage: true });
});
test('malformed cached chats do not crash startup', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('blockchat:chats_v2', JSON.stringify([null, {}, { id: 'x', name: 3, unreadCount: 'oops' }]));
    localStorage.setItem('blockchat:blockchain', JSON.stringify({ invalid: true }));
  });
  await onboard(page);
  await expect(page.getByText('Birinchi suhbatga tayyormisiz?')).toBeVisible();
});
test('two profiles exchange live messages without duplicates; local notes survive connection', async ({ browser }) => {
  const a = await browser.newContext(); const b = await browser.newContext();
  const alice = await a.newPage(); const bob = await b.newPage();
  try {
    await onboard(alice, 'Aziza'); await onboard(bob, 'Bobur');
    await localNote(alice, 'Shaxsiy qayd');
    const bobAddress = await bob.evaluate(() => JSON.parse(localStorage.getItem('blockchat:wallet_address')));
    for (const page of [alice, bob]) {
      await page.evaluate(() => localStorage.setItem('blockchat:server_url', 'http://127.0.0.1:3001'));
      await page.goto('/'); await page.reload();
      await expect(page.getByText('Ulangan', { exact: true })).toBeVisible();
    }
    await expect(alice.getByRole('button', { name: 'Shaxsiy qayd suhbatini ochish' })).toBeVisible();
    await alice.getByRole('button', { name: /Yangi suhbat$/ }).click();
    await alice.getByRole('button', { name: 'Onlayn suhbat', exact: true }).click();
    await alice.getByLabel('Suhbat nomi', { exact: true }).fill('Birgalikda');
    await alice.getByLabel('Suhbatdosh manzili').fill(bobAddress);
    await alice.getByRole('button', { name: /Yaratish/ }).click();
    await alice.getByPlaceholder('Xabar yozing...').fill('Salom, Bobur!');
    await alice.getByRole('button', { name: 'Xabar yuborish' }).click();
    await expect(bob.getByRole('button', { name: 'Birgalikda suhbatini ochish' })).toBeVisible();
    await bob.getByRole('button', { name: 'Birgalikda suhbatini ochish' }).click();
    await expect(bob.getByText('Salom, Bobur!', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await bob.getByPlaceholder('Xabar yozing...').fill('Salom, Aziza!');
    await bob.getByRole('button', { name: 'Xabar yuborish' }).click();
    await expect(alice.getByText('Salom, Aziza!', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await expect(alice.getByText('Salom, Bobur!', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await alice.screenshot({ path: 'artifacts/live-chat.png', fullPage: true });
    await alice.reload();
    await expect(alice.getByText('Salom, Aziza!', { exact: true }).filter({ visible: true })).toBeVisible();
    await alice.goto('/');
    await expect(alice.getByRole('button', { name: 'Shaxsiy qayd suhbatini ochish' })).toBeVisible();
    await alice.getByRole('button', { name: 'Birgalikda suhbatini ochish' }).click();
    await a.route('**/api/bc/messages', route => route.abort());
    await alice.getByPlaceholder('Xabar yozing...').fill('Yuborilmagan qoralama');
    await alice.getByRole('button', { name: 'Xabar yuborish' }).click();
    await expect(alice.getByRole('alert').filter({ visible: true })).toBeVisible();
    await expect(alice.getByPlaceholder('Xabar yozing...')).toHaveValue('Yuborilmagan qoralama');
  } finally { await a.close(); await b.close(); }
});

test('server settings validate URLs and reconnect when saving the same server', async ({ page }) => {
  await onboard(page);
  await page.goto('/wallet');
  await page.getByRole('button', { name: 'Server sozlamalarini tahrirlash' }).click();
  await page.getByPlaceholder('https://...').fill('javascript:alert(1)');
  let invalidMessage = '';
  page.once('dialog', async dialog => { invalidMessage = dialog.message(); await dialog.accept(); });
  await page.getByText('Saqlash', { exact: true }).click();
  expect(invalidMessage).toContain('HTTP');
  await page.getByPlaceholder('https://...').fill('http://127.0.0.1:3001');
  await page.getByText('Saqlash', { exact: true }).click();
  await expect(page.getByText('● Ulangan', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Server sozlamalarini tahrirlash' }).click();
  await expect(page.getByPlaceholder('https://...')).toHaveValue('http://127.0.0.1:3001');
  await page.getByText('Saqlash', { exact: true }).click();
  await expect(page.getByText('● Ulangan', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/profile-desktop.png', fullPage: true });
});
