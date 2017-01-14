#!/usr/bin/env node


require('shelljs/global');
var program = require('commander');
var child_process = require('child_process');

var source_file;


program
  .arguments('FILE')
  .option('-server_output, --server_output FILE', 'Write the server result to the given .JS file.')
  .action(function(file){
    source_file = file;
  })
  .parse(process.argv);

if(source_file){
  try {
    child_process.execSync('elm-make --warn ' + source_file, {stdio:[process.stdin,process.stdout,process.stderr]});
  } catch (err){
    console.log('elm-mulitier-make: failed')
  }
} else {
  try {
    child_process.execSync('elm-make', {stdio:[process.stdin,process.stdout,process.stderr]});
  } catch (err){
    console.log('elm-mulitier-make: failed')
  }
}
