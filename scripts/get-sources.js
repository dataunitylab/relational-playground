const fs = require('fs');
const sourceMap = require('source-map');
const rawSourceMap = fs.readFileSync(process.argv[2], 'utf8');

const consumer = new sourceMap.SourceMapConsumer(rawSourceMap);
consumer.sources.forEach(source => {
  console.log(source);
});
