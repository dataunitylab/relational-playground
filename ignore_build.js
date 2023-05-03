process.exitCode = (process.env.HEAD || '').startsWith('dependabot/') ? 0 : 1;
