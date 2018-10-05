'use strict';

var dnscache = require('dnscache')({enable: true});
var request = require('request');
var url = require('url');
var fs = require('fs');
var run = require('./cli/lib/gateway')();
var portastic = require('portastic');
const os = require('os');

const options = {};

options.env = process.env.EDGEMICRO_ENV;
options.key = process.env.EDGEMICRO_KEY;
options.secret = process.env.EDGEMICRO_SECRET;
options.org = process.env.EDGEMICRO_ORG;
options.configDir = process.env.EDGEMICRO_CONFIG_DIR || os.homedir()+"/.edgemicro";
options.configUrl = process.env.EDGEMICRO_CONFIG_URL;
options.processes = process.env.EDGEMICRO_PROCESSES || os.cpus().length;
options.port = process.env.PORT || 8000;

if (!options.key ) { console.log('key is required'); process.exit(1);}
if (!options.secret ) { console.log('secret is required'); process.exit(1);}
if (!options.org ) { console.log('org is required'); process.exit(1);}
if (!options.env ) { console.log('env is required'); process.exit(1);}
if (options.port) {
    portastic.test(options.port)
      .then(function(isAvailable){
        if(!isAvailable) {
          console.error('port is not available.');
          process.exit(1);
        }
     });
}
if (options.configUrl) {
  if (!fs.existsSync(options.configDir)) fs.mkdirSync(options.configDir);
  var fileName = options.org+"-"+options.env+"-config.yaml";
  var filePath = options.configDir + "/" + fileName;
  
  var parsedUrl = url.parse(options.configUrl, true);
  if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
    request.get(options.configUrl, function(error, response, body) {
      if (error) {
        console.error("config file did not download: "+error);
        process.exit(1);
      }
      try {
        fs.writeFileSync(filePath, body, 'utf8');
        run.start(options);
      } catch (err) {
        console.error("config file could not be written: " + err);
        process.exit(1);
      }
    });
  } else {
    console.error("url protocol not supported: "+parsedUrl.protocol);
    process.exit(1);
  }
} else {
  run.start(options);
}
