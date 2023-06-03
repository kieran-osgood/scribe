import { prepareEnvironment } from '@gmrchk/cli-testing-library';

describe('My CLI', () => {
  it('program runs successfully', async () => {
    const e = await prepareEnvironment();

    const t = await e.execute(
      'node ',
      '-r tsconfig-paths/register ./dist/main.js --help'
    );

    console.log(t.code); // 0
    console.log(t.stdout); // ["Hello world!"]
    console.log(t.stderr); // []
    expect(t.code).toBe(0);

    await e.cleanup();
  });
});
