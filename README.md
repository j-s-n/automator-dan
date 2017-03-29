# automator-dan

An automated build utility for browserify+watchify/SASS projects, with a tiny live CSS reloading server.

# NOTICE

`automator-dan` is deprecated. I switched to webpack, and it radically simplified my build process. Check out [jsn-web-boilerplate](https://github.com/j-s-n/jsn-web-boilerplate) for an example webpack configuration that achieves the same thing as `automator-dan` using [live-update-server](https://github.com/j-s-n/live-update-server).

## Installation

```
npm install automator-dan
```

## Usage

`automator-dan` is a CLI tool, generally invoked through a `scripts` entry in `package.json`.

```
Usage: automator-dan [OPTIONS]

Options

  -h, --help          Display this usage guide
  -p, --production    Do a production build (include "production" config from package.json)
  -w, --watch         Watch source directories and re-run builds on changes
  -s, --sass          Enable style build with node-sass
  -l, --liveCSS       Inject live reloading CSS code and host local websocket server (8080)
```

`automator-dan` reads the `automatorConfig` field in your project's `package.json`. Here's an example:

```json
"automatorConfig": {
  "js": {
    "target": "./dist/App.js",
    "base": {
      "entries": ["./src/js/App.js"],
      "paths": ["./node_modules", "./src/js/"],
      "transform": [
        [
          "babelify", {
            "presets": ["es2015", "react"]
          }
        ]
      ],
      "plugin": [
        [
          "minifyify", {
            "map": "App.js.map",
            "output": "./dist/App.js.map"
          }
        ]
      ]
    }
  },

  "style": {
    "srcDir": "./src/style",
    "entry": "App.scss",
    "target": "./dist/App.css"
  }
}
```

The `js` field configures the Javascript build process. `target` is the location of the final output bundle. The `base` field specifies the default configuration options that are fed to `browserify`. In the above example, `browserify` is configured to take `./src/js/App.js` as input, `require` or `import` from `./node_modules` and `./src/js/`, use `babelify` as a transform (with presets `es2015` and `react`) and run the output through `minifyify`.

If, in addition to `base`, a `production` field is present and the `-p` option is used, options in `production` will override those in `base`.

The `style` field configures the `node-sass` build process, and is only required when the `-s` option is used. `srcDir` is the source directory for sass files, `entry` is the entry point for the sass build (within `srcDir`) and `target` is the location of the final output bundle.

If the `-w` option is used, `automator-dan` will inject `watchify` as a plugin into the Javascript build configuration, which enables source tree watching and smart, fast rebuilds. Additionally, if the style build is enabled, it will watch the `srcDir` for changes and do a `node-sass` build when necessary.

### LiveCSS

`automator-dan` has a built in hot CSS reloading server that can be enabled with the `-l` option.

If LiveCSS is enabled, `automator-dan` will try to start a websockets server on port `8080` that notifies any listeners whenever a style build finishes. It will also inject a code snippet into the final Javascript bundle that connects to that service and listens for updates. Whenever this listener receives a notification, it reloads the main stylesheet, instantly pushing out style changes to the page.

In order for this to work, the stylesheet that you want to reload needs to be tagged with a `main-stylesheet` id, e.g.
```HTML
<link id='main-stylesheet' rel="stylesheet" type="text/css" href="App.css">
```

## License

MIT
