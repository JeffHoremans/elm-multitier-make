#!/usr/bin/env node


require('shelljs/global');
var fs = require('fs');
var path = require('path');
var program = require('commander');
var child_process = require('child_process');

var file_input;


program
  .arguments('FILE')
  .action(function(file){
    file_input = file;
  })
  .parse(process.argv);

if(file_input){

  if(file_input.endsWith('.elm')){

    var source_file = path.normalize(file_input.startsWith('/') ? file_input : process.cwd() + '/' + file_input)
    var source = fs.readFileSync(source_file, 'utf-8');
    var moduleRx = /module\s+([^\s]+)/g;
    var matches = moduleRx.exec(source);
    if(matches[1]){
      var moduleName = matches[1];
      var clientFile = path.dirname(source_file) + '/.ClientStarter.elm';
      var serverFile = path.dirname(source_file) + '/.ServerStarter.elm';
      try {
        fs.writeFileSync(clientFile, clientStarter(moduleName));
        fs.writeFileSync(serverFile, serverStarter(moduleName));

        try {
          child_process.execSync('elm-make ' + clientFile + ' --warn --output client.js', {stdio:[process.stdin,process.stdout,process.stderr]});
          child_process.execSync('elm-make ' + serverFile + ' --warn --output server.js', {stdio:[process.stdin,process.stdout,process.stderr]});
          fs.writeFileSync('index.html', clientHtml(moduleName));
          fs.appendFileSync('server.js', serverStartHack());
        } catch (err){
          console.log('elm-multitier-make: failed')
        }
      } catch(err){
        console.error('elm-multitier-make: failed.' + err)
      }
    } else {
      console.error('elm-multitier-make: failed. The given file has no valid module name.');
    }

  } else {
    console.error('elm-multitier-make: failed. The given file is no Elm-file');
  }

} else {
  try {
    child_process.execSync('elm-make', {stdio:[process.stdin,process.stdout,process.stderr]});
  } catch (err){
    console.error('elm-multitier-make: failed')
  }
}

function clientStarter(module) {
  return `module ClientStarter exposing (..)

import Multitier
import ${module} exposing (program)

main = Multitier.clientProgram ${module}.program
`
}

function serverStarter(module) {
  return `module ServerStarter exposing (..)

import Multitier
import ${module} exposing (program)

main = Multitier.serverProgram ${module}.program
`
}

function clientHtml(module) {
  return `<!DOCTYPE HTML>
<html>
  <head>
    <meta charset="UTF-8">
    <title>ClientStarter</title>
    <script type="text/javascript" src="client.js"></script>
    <script type="text/javascript" src="state.js"></script>
  </head>
  <body>
    <script type="text/javascript">Elm.ClientStarter.fullscreen(state)</script>
  </body>
</html>`
}

function serverStartHack() {
return `(function() {

    var isNode = typeof global !== "undefined" && ({}).toString.call(global) === '[object global]';

    if (isNode) {
      setTimeout(function() {
          if (!module.parent) {
              if ('ServerStarter' in module.exports) {
                  module.exports.ServerStarter.worker();
              } else {
                  throw new Error('ServerStarter module not found.');
              }
          }
      });
    } else {
      return;
    }
})();`
}
