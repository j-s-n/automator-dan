#!/usr/bin/env node
var browserify = require('browserify');
var fs = require('fs');
var sass = require('node-sass');
var watch = require('watch');
var watchify = require('watchify');
var WebSocketServer = require('ws').Server;
var {options, startBuild, buildError, finishBuild, getConfig} = require('./buildUtil.js');

// get buildConfig from project's package.json and validate
var config = getConfig();

// set up js bundler
var jsconfig = Object.assign({debug: true, cache: {}, packageCache: {}, plugin: [], entries: []}, config.js.base || {});

if (options.production) {
  process.env.NODE_ENV = 'production';
  Object.assign(jsconfig, config.js.production || {});
} else {
  process.env.NODE_ENV = 'development';
}

if (options.watch) {
  jsconfig.plugin.push(watchify);
  if (options.liveCSS) {
    jsconfig.entries.push(require.resolve('./LiveCSS.js'));
  }
}

bundler = browserify([], jsconfig);

// start web socket server if necessary
var wss = null;
if (options.liveCSS) {
  try {
    wss = new WebSocketServer({port: 8080});
  } catch (e) {
    console.log('\nWARNING: Unable to start websocket server, LiveCSS disabled\n');
  }
}

// set up directory watching if necessary
if (options.watch) {
  bundler.on('update', update);
  if (options.sass) {
    watch.watchTree(config.style.srcDir, {interval: 0.5}, updateStyle);
  }
} else if (options.sass) {
  updateStyle();
}

update();

function update () {
  startBuild('js');
  bundler
    .bundle()
    .on('error', function (error) {
      buildError('js', error);
      this.emit('end');
    })
    .pipe(fs.createWriteStream(config.js.target))
    .on('finish', function () {
      finishBuild('js');
    });
}

function updateStyle (...args) {
  startBuild('style');
  sass.render({file: config.style.srcDir + '/' + config.style.entry}, function (error, result) {
    if (error) {
      buildError('style', error);
      finishBuild('style');
      return;
    } else {
      fs.writeFile(config.style.target, result.css, function (err) {
        if (err) {
          buildError('style', err);
        } else {
          if (wss) {
            wss.clients.forEach( function (client) {
              client.send('updateCSS');
            } );
          }
        }
        finishBuild('style');
      });
    }
  });
}
