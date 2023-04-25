process.exitCode = (process.env.BRANCH || '').startsWith('dependabot/') ? 0 : 1;
