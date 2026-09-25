import assert from 'node:assert/strict';
import {
  alternateUnits, buildSizeLabel, compareSizes, familyForCategory, mapLegacySize,
  normaliseSizeLabel, parseSizeLabel, parseSizeList, presetsFor, sortSizes, validateDimInputs,
} from '../handicraftSize';

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; void name; };

t('bed order', () => assert.deepEqual(
  sortSizes(['King (6×6.5 ft)', 'Single (3×6 ft)', 'Queen (5×6.5 ft)', 'Double (4×6 ft)']),
  ['Single (3×6 ft)', 'Double (4×6 ft)', 'Queen (5×6.5 ft)', 'King (6×6.5 ft)']));
t('small medium large', () => assert.deepEqual(sortSizes(['Large', 'Small', 'Medium', 'Mini', 'Extra Large']), ['Mini', 'Small', 'Medium', 'Large', 'Extra Large']));
t('seaters numeric not text', () => assert.deepEqual(sortSizes(['10-Seater', '4 Seater', '6-Seater (180 cm)', '2-Seater']), ['2-Seater', '4 Seater', '6-Seater (180 cm)', '10-Seater']));
t('chair sets', () => assert.deepEqual(sortSizes(['Set of 4', 'Single', 'Set of 2']), ['Single', 'Set of 2', 'Set of 4']));
t('capacity', () => assert.deepEqual(sortSizes(['1 L', '500 ml', '250 ml', '1.5 L']), ['250 ml', '500 ml', '1 L', '1.5 L']));
t('dims by volume across units', () => assert.deepEqual(
  sortSizes(['90 × 40 × 85 cm', '60 × 40 × 75 cm', '36 × 16 × 30 in']),
  ['60 × 40 × 75 cm', '36 × 16 × 30 in', '90 × 40 × 85 cm']));
t('length', () => assert.deepEqual(sortSizes(['Ø 60 cm', 'Ø 30 cm', 'Ø 45 cm']), ['Ø 30 cm', 'Ø 45 cm', 'Ø 60 cm']));
t('alphabetical fallback + stable', () => assert.deepEqual(sortSizes(['Walnut Top', 'Cane Top', 'Cane Top']), ['Cane Top', 'Cane Top', 'Walnut Top']));
t('group order', () => assert.deepEqual(sortSizes(['Zebra', '60 × 40 cm', '500 ml', 'Set of 2', 'Small']), ['Small', 'Set of 2', '500 ml', '60 × 40 cm', 'Zebra']));
t('legacy letters still rank', () => assert.deepEqual(sortSizes(['XL', 'S', 'M', 'L']), ['S', 'M', 'L', 'XL']));
t('does not mutate', () => { const a = ['B', 'A']; sortSizes(a); assert.deepEqual(a, ['B', 'A']); });
t('antisymmetric', () => { const xs = ['King', 'Small', '4-Seater', '500 ml', '60 × 40 cm', 'foo']; for (const a of xs) for (const b of xs) assert.equal(Math.sign(compareSizes(a, b)), -Math.sign(compareSizes(b, a)) || 0); });

t('parse named + ft', () => {
  const p = parseSizeLabel('Queen (5×6.5 ft)');
  assert.equal(p.name, 'Queen'); assert.deepEqual(p.dims, { values: [5, 6.5], unit: 'ft', round: false });
});
t('parse legacy seed', () => { const p = parseSizeLabel('Queen (60x78 in)'); assert.deepEqual(p.dims?.values, [60, 78]); assert.equal(p.dims?.unit, 'in'); });
t('parse count is not dims', () => { assert.equal(parseSizeLabel('Set of 4').dims, null); assert.equal(parseSizeLabel('6-Seater').dims, null); });
t('parse diameter + weight', () => { const p = parseSizeLabel('Ø 45 cm · 3.5 kg'); assert.equal(p.dims?.round, true); assert.equal(p.weightKg, 3.5); });
t('build', () => {
  assert.equal(buildSizeLabel({ dims: { values: [60, 40, 75], unit: 'cm' } }), '60 × 40 × 75 cm');
  assert.equal(buildSizeLabel({ name: 'Medium', dims: { values: [90, 40, 85], unit: 'cm' }, weightKg: 18 }), 'Medium (90 × 40 × 85 cm) · 18 kg');
  assert.equal(buildSizeLabel({ dims: { values: [45], round: true, unit: 'cm' } }), 'Ø 45 cm');
});
t('round trip', () => {
  const lbl = 'Medium (90 × 40 × 85 cm) · 18 kg'; const p = parseSizeLabel(lbl);
  assert.equal(buildSizeLabel({ name: p.name, dims: p.dims, weightKg: p.weightKg }), lbl);
});
t('alt units', () => {
  assert.equal(alternateUnits('Queen (5×6.5 ft)'), '152 × 198 cm · 60 × 78 in');
  assert.equal(alternateUnits('60 × 40 × 75 cm'), '24 × 16 × 30 in');
  assert.equal(alternateUnits('Medium'), null);
});
t('validate', () => {
  assert.equal(validateDimInputs({ l: '60', w: '40' }, 'cm'), '');
  assert.match(validateDimInputs({ l: '-1' }, 'cm'), /positive/);
  assert.match(validateDimInputs({ l: '99999' }, 'cm'), /too large/);
});
t('normalise + list', () => {
  assert.equal(normaliseSizeLabel('60 x 40 x 75  cm'), '60 × 40 × 75 cm');
  assert.equal(normaliseSizeLabel('Queen (5x6.5 ft)'), 'Queen (5×6.5 ft)');
  assert.deepEqual(parseSizeList('Small, medium; Small\nLarge'), ['Small', 'medium', 'Large']);
});
t('family', () => {
  assert.equal(familyForCategory('Beds', 'beds', 'furniture'), 'bed');
  assert.equal(familyForCategory('Tables', 'tables', 'furniture'), 'table');
  assert.equal(familyForCategory('Chairs & Stools', 'chairs-stools', 'furniture'), 'seating');
  assert.equal(familyForCategory('Cabinets & Storage', 'cabinets-storage'), 'storage');
  assert.equal(familyForCategory('Wall Art', 'wall-art', 'home-decor'), 'wall');
  assert.equal(familyForCategory('Cutting Boards', 'cutting-boards', 'kitchen-dining'), 'decor');
  assert.equal(familyForCategory('Toys & Games'), 'decor');
  assert.equal(familyForCategory(''), 'custom');
});
t('presets non-empty', () => { for (const f of ['bed', 'table', 'seating', 'storage', 'wall', 'decor', 'custom'] as const) assert.ok(presetsFor(f)[0].items.length); assert.match(presetsFor('wall', 'in')[0].items[0], /in$/); });
t('legacy map', () => { assert.equal(mapLegacySize('XL'), 'Extra Large'); assert.equal(mapLegacySize('Free Size'), 'Standard'); assert.equal(mapLegacySize('Queen'), null); });

console.log(`handicraftSize: ${n} tests passed`);
