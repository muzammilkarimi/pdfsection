import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { DESIGN_FONTS, fontFileUrl, fontStack, getFont } from '@/lib/designFonts';
import { parseDesign } from '@/lib/designModel';
import { TEMPLATES, TEMPLATE_CATEGORIES, designFromTemplate } from '@/lib/designTemplates';

const withoutIds = (value) => JSON.parse(JSON.stringify(value, (key, v) => (key === 'id' ? undefined : v)));
const HEX = /^#[0-9a-f]{6}$/i;

test('template ids are unique and categories are known', () => {
  assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, TEMPLATES.length);
  for (const t of TEMPLATES) assert.ok(TEMPLATE_CATEGORIES.includes(t.category), `${t.id}: ${t.category}`);
});

test('every category has a template, so no filter chip comes up empty', () => {
  for (const category of TEMPLATE_CATEGORIES) {
    assert.ok(TEMPLATES.some((t) => t.category === category), category);
  }
});

test('template text uses fonts and colors the editor offers', () => {
  const fontIds = DESIGN_FONTS.map((f) => f.id);
  for (const t of TEMPLATES) {
    for (const page of t.design.pages) {
      assert.match(page.background, HEX);
      for (const el of page.elements) {
        if (el.type === 'text') {
          assert.ok(fontIds.includes(el.font), `${t.id}: ${el.font}`);
          assert.match(el.color, HEX, `${t.id}: "${el.text}"`);
          assert.ok(el.text.trim(), `${t.id}: empty text`);
        }
        for (const [name, value] of [['x', el.x], ['y', el.y], ['w', el.w], ['h', el.h]]) {
          assert.ok(Number.isFinite(value), `${t.id}: ${name}`);
        }
      }
    }
  }
});

test('text boxes stay within the page width', () => {
  for (const t of TEMPLATES) {
    for (const el of t.design.pages[0].elements) {
      if (el.type !== 'text') continue;
      assert.ok(el.x >= 0 && el.x + el.w <= t.design.width + 0.5, `${t.id}: "${el.text}" runs past the page`);
    }
  }
});

test('a template survives saving to a file and opening again, unchanged', () => {
  for (const t of TEMPLATES) {
    const opened = parseDesign(JSON.parse(JSON.stringify(t.design)));
    assert.deepEqual(withoutIds(opened), withoutIds(t.design), t.id);
  }
});

test('using a template gives an independent copy', () => {
  for (const t of TEMPLATES) {
    const before = JSON.stringify(t.design);
    const copy = designFromTemplate(t);
    assert.notEqual(copy.id, t.design.id);
    assert.notEqual(copy.pages[0].elements[0].id, t.design.pages[0].elements[0].id);
    copy.pages[0].elements[0].x = 99999;
    assert.equal(JSON.stringify(t.design), before, t.id);
  }
});

test('every font style the editor can pick has its file in the site', () => {
  for (const f of DESIGN_FONTS) {
    for (const bold of f.bold ? [false, true] : [false]) {
      for (const italic of f.italic ? [false, true] : [false]) {
        const url = fontFileUrl(f.id, bold, italic);
        assert.ok(existsSync(`public${url}`), `missing ${url}`);
      }
    }
  }
});

test('an unknown font falls back to the default', () => {
  assert.equal(getFont('No such font').id, DESIGN_FONTS[0].id);
  assert.match(fontStack('No such font'), /DS Inter/);
});
