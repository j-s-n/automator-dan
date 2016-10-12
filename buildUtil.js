var fs = require("fs");
var commandLineArgs = require('command-line-args');
var getUsage = require('command-line-usage');

process.on('SIGINT', process.exit);

// process command line options

var optionSpecs = [
  {name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'Display this usage guide'},
  {name: 'production', alias: 'p', type: Boolean, defaultValue: false, description: 'Do a production build (include "production" config from package.json)'},
  {name: 'watch', alias: 'w', type: Boolean, defaultValue: false, description: 'Watch source directories and re-run builds on changes'},
  {name: 'sass', alias: 's', type: Boolean, defaultValue: false, description: 'Enable style build with node-sass'},
  {name: 'liveCSS', alias: 'l', type: Boolean, defaultValue: false, description: 'Inject live reloading CSS code and host local websocket server (8080)'}
];

var options = commandLineArgs(optionSpecs);

if (options.help) { // The -h command line option came in, print help and exit
  console.log(
    getUsage([
      {
        header:'Automator Dan',
        content: 'An automated build utility for browserify/SASS projects, with a tiny live CSS reloading server'
      },
      {
        header: 'Options',
        optionList: optionSpecs
      }
    ])
  );
  process.exit();
}

if (!options.watch && options.liveCSS) {
  options.liveCSS = false;
  console.error('\nWARNING: LiveCSS requires directory watching to be enabled\n')
}

// process package.json config

function getConfig () {
  var config = JSON.parse(fs.readFileSync(process.cwd() + '/package.json', 'utf8')).automatorConfig;

  if (!config) {
    console.error(msgs.error + ' No buildConfig field in package.json, exiting');
    process.exit();
  }

  if (!config.js || !config.js.target) {
    console.error(msgs.error + ' No js.target field buildConfig, exiting');
    process.exit();
  }

  if (options.sass) {
    if (!config.style) {
      console.error(msgs.error + ' No style field in buildConfig');
      options.sass = false;
    } else {
      if (!config.style.srcDir) {
        console.error(msgs.error + ' No style.srcDir in buildConfig');
        options.sass = false;
      }
      if (!config.style.entry) {
        console.error(msgs.error + ' No style.entry in buildConfig');
        options.sass = false;
      }
      if (!config.style.target) {
        console.error(msgs.error + ' No style.target in buildConfig');
        options.sass = false;
      }
      if (!options.sass) {
        console.error('Style build disabled');
      }
    }
  }

  return config;
}

// logging

var msgs = {
  success: '\033[32mdone\033[0m    ',
  building: '\033[0mbuilding',
  error: '\033[31mERROR\033[0m   '
};

var buildState = {
  js: msgs.building,
  style: msgs.building
};

function startBuild (build) {
  buildState[build] = msgs.building;
  updateStatus();
}

function buildError (build, error) {
  buildState[build] = msgs.error;
  var codeFrame = error.codeFrame ? '\n' + error.codeFrame : '';
  console.error(`\n${build} build ${msgs.error}\n ${error.message}${codeFrame}\n--------------------------------------------------------------------------------`);
}

function finishBuild (build) {
  if (buildState[build] == msgs.building) {
    buildState[build] = msgs.success;
  }
  updateStatus();
}

function dark (txt) {
  return '\033[37m' + txt + '\033[0m';
}

var previousStatus = '';

function updateStatus () {
  var items = [];
  if (process.env.NODE_ENV == 'production') {
    items.push(dark('production mode'));
  }
  if (options.liveCSS) {
    items.push(dark('liveCSS'));
  }
  if (options.sass) {
    items.push(dark('style: ') + buildState.style);
  }
  items.push(dark('js: ') + buildState.js);
  var status = items.join(' | ');
  if (status != previousStatus) {
    process.stdout.write('\n' + status + ' ');
    previousStatus = status;
  }
}

module.exports = {options, startBuild, buildError, finishBuild, getConfig};
