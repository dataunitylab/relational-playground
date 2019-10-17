#!/bin/bash

# Get the current commit
SHA=`([ -n "$NOW_GITHUB_COMMIT_SHA" ] && echo "$NOW_GITHUB_COMMIT_SHA") || git rev-parse --short HEAD`

# Try to set a reasonable NODE_ENV if it isn't set
if [ -z "$NODE_ENV" ]; then
  if [ -n "$NOW_GITHUB_COMMIT_REF" ]; then
    if [ "$NOW_GITHUB_COMMIT_REF" = "master" ]; then
      NODE_ENV="production"
    else
      NODE_ENV="staging"
    fi
  else
      NODE_ENV="development"
  fi
fi

curl --request POST  \
     --url https://api.rollbar.com/api/1/deploy/  \
     --header 'content-type: application/json' \
     --data "{\"access_token\":\"2a3715a647194206984c6078fd092451\",\"environment\":\"$NODE_ENV\",\"revision\":\"$SHA\"}"
