const branch = (process.env.HEAD || '');
process.exitCode = branch.startsWith('dependabot/')  && !branch.startsWith('dependabot/npm_and_yarn/react-') ? 0 : 1;
