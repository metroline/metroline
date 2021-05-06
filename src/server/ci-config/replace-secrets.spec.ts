import { replaceSecrets } from './replace-secrets';

describe('replaceSecrets', () => {
  afterEach(() => jest.restoreAllMocks());

  /*
{{MY_VAR}} # is replaced with "hello"
\{{MY_VAR}} # is replaced with "\{{MY_VAR}}"
\\{{MY_VAR}} # is replaced with "\hello"
\\\{{MY_VAR}} # is replaced with "\\{{MY_VAR}}"
   */

  it('should replace marker with secret value', async () => {
    const str = await replaceSecrets(`
test1: {{HELLO}}
test2: {{HELLO}}
test3: {{HELLO_WORLD}}
test4: {{HELLO64_WORLD}}
    `, {
      HELLO: 'value',
      HELLO_WORLD: 'value2',
      HELLO64_WORLD: 'value3',
    });

    expect(str).toEqual(`
test1: value
test2: value
test3: value2
test4: value3
    `);
  });

  it('should not replace marker + 1 leading slash when odd number of leading slash', async () => {
    const plainConfig = `
test1: \\{{HELLO}}
test2: \\\\{{HELLO}}
test3: \\\\\\{{HELLO}}
    `;
    const str = await replaceSecrets(plainConfig, { HELLO: 'value' });

    expect(str).toEqual(`
test1: {{HELLO}}
test2: \\\\value
test3: \\\\{{HELLO}}
    `);
  });

  it('should throw error when secret not found', async () => {
    let error;
    try {
      await replaceSecrets('{{MY_SECRET}}', {});
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });
});
