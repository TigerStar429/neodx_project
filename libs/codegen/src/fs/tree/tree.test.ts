import { ContentLike, FileChangeType, Tree } from './types';
import { VirtualTree } from './virtual-tree';

describe('Tree', () => {
  describe('VirtualTree', () => {
    let fs!: Tree;

    beforeEach(() => {
      fs = new VirtualTree('/', [
        [
          'parent',
          [
            ['parent-file.ts', 'parent content'],
            ['child', [['child-file.ts', 'child content']]]
          ]
        ],
        ['root-file.ts', 'root content']
      ]);
    });

    test('should have initial state', async () => {
      expect(await fs.getChanges()).toEqual([]);
      expectArrayEq(await fs.readDir(), ['root-file.ts', 'parent']);
    });

    test('should read files and throw on unknown', async () => {
      expect(await fs.read('root-file.ts')).toEqual(Buffer.from('root content'));
      expect(await fs.read('root-file.ts', 'utf-8')).toEqual('root content');

      await expect(fs.read('unknown')).rejects.toBeInstanceOf(Error);
      expect(await fs.tryRead('unknown')).toBe(null);
    });

    test('should create file', async () => {
      await fs.write('new.ts', 'code');

      expect(await fs.read('new.ts', 'utf-8')).toBe('code');
      expect(await fs.getChanges()).toEqual([change('new.ts', FileChangeType.CREATE, 'code')]);
    });

    test('should change one file and create other', async () => {
      expectArrayEq(await fs.readDir('parent'), ['child', 'parent-file.ts']);
      await fs.write('parent/new-file.ts', 'code');
      await fs.write('parent/parent-file.ts', Buffer.from('next'));
      expectArrayEq(await fs.readDir('parent'), ['child', 'parent-file.ts', 'new-file.ts']);
      expect(await fs.getChanges()).toEqual([
        change('parent/new-file.ts', FileChangeType.CREATE, 'code'),
        change('parent/parent-file.ts', FileChangeType.UPDATE, 'next')
      ]);
    });

    test('should ignore equal changes', async () => {
      await fs.write('/parent/parent-file.ts', 'new content');
      await fs.delete('root-file.ts');
      await fs.rename('/parent/child/child-file.ts', '/another-dir/file.ts');

      // Rename === write + delete
      expect(await fs.getChanges()).toHaveLength(4);
      expectArrayEq(await fs.readDir(), ['parent', 'another-dir']);

      await fs.write('root-file.ts', Buffer.from('root content'));
      await fs.write('/parent/parent-file.ts', 'parent content');

      // Instead of rename
      await fs.delete('/another-dir/file.ts');
      await fs.write('/parent/child/child-file.ts', 'child content');

      expect(await fs.getChanges()).toHaveLength(0);
    });

    test('should remove dirs files', async () => {
      await fs.write('parent/child-2/file.ts', 'new child content');
      await fs.delete('./parent/child-2');
      await fs.delete('./parent/child');
      expectArrayEq(await fs.readDir('parent'), ['parent-file.ts']);
      expect(await fs.getChanges()).toEqual([change('parent/child', FileChangeType.DELETE, null)]);
    });
  });
});

// eslint-disable-next-line @typescript-eslint/require-array-sort-compare
const expectArrayEq = <T>(left: T[], right: T[]) => expect(left.sort()).toEqual(right.sort());
const change = (name: string, type: FileChangeType, content: ContentLike | null) => ({
  name,
  type,
  content: content ? Buffer.from(content) : content
});
