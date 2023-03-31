#!/bin/bash

# Get the current commit
SHA=`([ -n "$VERCEL_GIT_COMMIT_SHA" ] && echo "$VERCEL_GIT_COMMIT_SHA") || git rev-parse HEAD`

# Try to set a reasonable NODE_ENV if it isn't set
if [ -z "$NODE_ENV" ]; then
  if [ -n "$VERCEL_GIT_COMMIT_REF" ]; then
    if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
      NODE_ENV="production"
    else
      NODE_ENV="staging"
    fi
  else
      NODE_ENV="development"
  fi
fi

if [ -n "$SENTRY_AUTH_TOKEN" ]; then
  export SENTRY_ENVIRONMENT=$NODE_ENV
  yarn run sentry-cli releases new -p relational-playground $SHA
  yarn run sentry-cli releases set-commits -c dataunitylab/relational-playground@$SHA $SHA
  yarn run sentry-cli releases files $SHA upload-sourcemaps build/static/js/*.map
  yarn run sentry-cli releases deploys $SHA new -e $NODE_ENV
  yarn run sentry-cli releases finalize $SHA
fi
