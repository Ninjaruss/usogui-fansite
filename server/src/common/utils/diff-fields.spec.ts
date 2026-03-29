import { diffFields } from './diff-fields';

describe('diffFields', () => {
  it('returns keys where primitive value changed', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Kaiji', status: 'active' };
    expect(diffFields(before, update)).toEqual(['name']);
  });

  it('returns empty array when nothing changed', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Baku', status: 'active' };
    expect(diffFields(before, update)).toEqual([]);
  });

  it('skips keys with undefined value in update', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Kaiji', status: undefined };
    expect(diffFields(before, update)).toEqual(['name']);
  });

  it('detects changed arrays via JSON comparison', () => {
    const before = { tags: [1, 2] };
    const update = { tags: [1, 3] };
    expect(diffFields(before, update)).toEqual(['tags']);
  });

  it('ignores arrays that are identical', () => {
    const before = { tags: [1, 2] };
    const update = { tags: [1, 2] };
    expect(diffFields(before, update)).toEqual([]);
  });

  it('detects changed nested objects', () => {
    const before = { meta: { foo: 1 } };
    const update = { meta: { foo: 2 } };
    expect(diffFields(before, update)).toEqual(['meta']);
  });

  it('handles null values', () => {
    const before = { summary: 'text' };
    const update = { summary: null };
    expect(diffFields(before, update)).toEqual(['summary']);
  });

  it('handles keys not present on before entity', () => {
    const before = { name: 'Baku' };
    const update = { name: 'Baku', newField: 'hello' };
    expect(diffFields(before as any, update)).toEqual(['newField']);
  });
});
