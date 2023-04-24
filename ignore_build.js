process.exitCode = (process.env.BRANCH || '').startswith('dependabot/') ? 0 : 1;
