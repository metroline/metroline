import { replaceAll } from './replace-all';

describe('replaceAll', () => {
  it('should replace all occurences of given string', async () => {
    const str = replaceAll(
      `
Hello
mySec$ret/_
echo $mySec$ret/_
yayy !!!
    `,
      'mySec$ret/_',
      '***',
    );
    expect(str).toEqual(`
Hello
***
echo $***
yayy !!!
    `);
  });
});
