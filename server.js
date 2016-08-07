'use strict';

var path = require('path');
var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var PythonShell = require('python-shell');
var randomstring = require("randomstring");
var mapnik = require("mapnik");
var fs = require("fs");
var store = require('node-persist');
var _ = require('lodash');

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();
var fileLocation = '/run/media/jparra/linuxExtra/TIF/';
var app = express();

store.initSync({
  dir: '../../../../storage/',
  stringify: JSON.stringify,
  parse: JSON.parse,
  encoding: 'utf8',
  logging: true,
  continuous: true,
  interval: false,
  ttl: false, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS
});
// store.setItem('pngs',{});

console.log('====== SERVER RUNNING IN: ' + process.env.NODE_ENV + ' ======');
console.log('');
console.log('');

// -153.7451997 59.4849066 -151.7451997 61.4849066

// 51:E177-179 W176-180
// 52:E177-179 W169-177
// 53:W167-170
// 54:W160-167
// 55:W156-164
// 56:W157-162
// 57:W153-159
// 58:W152-159
// 59:W145-157
// 60:W144-156
// 61:W144-156

// ================ EXPRESS SERVER SETUP ================
// expose public folder as static assets
app.use(express.static(path.join(__dirname, '/public')));

// et compression
app.use(compression());

// parser for requrests
app.use(bodyParser.json());

// ================ EXPRESS ROUTES SETUP ================
app.post('*/api/map', function(req, res) {
  // -153.7451997 59.4849066 -151.7451997 61.4849066
  console.log(req.body);
  var minLat = req.body.minLat;
  var maxLat = req.body.maxLat;
  var minLong = req.body.minLong;
  var maxLong = req.body.maxLong;
  // ASTGTM2_N51E177_dem
  //
  // console.log(minLat + " " + maxLat + " " + minLong + " " + maxLong);

  var images = store.getItem('pngs');
  if(JSON.stringify(store.getItem('pngs')) !== '{}') {
    if(images[minLong + ' ' + minLat + ' ' + maxLong + ' ' + maxLat] != undefined) {
      res.end(JSON.stringify({
        "success": images[minLong + ' ' + minLat + ' ' + maxLong + ' ' + maxLat],
        "status": 200
      }));
      return;
    }
  }

  var stringOfFiles = '';
  for(var latY = Math.floor(minLat); latY <= Math.floor(maxLat); latY++)
    for(var longX = Math.ceil(Math.abs(maxLong)); longX <= Math.ceil(Math.abs(minLong)); longX++)
      stringOfFiles += ' ' + fileLocation + 'ASTGTM2_N' + latY + 'W' + longX + '_dem.tif';

  var name = randomstring.generate({
    length: 12,
    charset: 'alphabetic'
  });
  while(_.indexOf(_.valuesIn(images), name) != -1)
    name = randomstring.generate({
      length: 12,
      charset: 'alphabetic'
    });

  var options = {
    mode: 'text',
    args: [stringOfFiles, fileLocation + 'out/' + name + '.vrt', fileLocation + 'out/' + name + '.tif',
      minLong + ' ' + minLat + ' ' + maxLong + ' ' + maxLat, name, fileLocation
    ]
  };
  var options2 = {
    mode: 'text',
    args: [fileLocation, name]
  };
  PythonShell.run('master.py', options, function(err, results) {
    if(err) throw err;
    // results is an array consisting of messages collected during execution -153.7451997 59.4849066 -151.7451997 61.4849066
    // console.log( 'results: %j', results );

    var map = new mapnik.Map(3134, 3134);
    // console.log(require('util').inspect(map, { depth: null }));
    map.maximumExtent = [minLong, minLat, maxLong, maxLat];
    // console.log(require('util').inspect(map, { depth: null }));
    map.load(fileLocation + "/out/" + name + ".xml", function(err, map) {
      if(err) throw err;
      map.zoomAll();
      var im = new mapnik.Image(3134, 3134);
      map.render(im, function(err, im) {
        if(err) throw err;
        im.encode("png", function(err, buffer) {
          if(err) throw err;
          fs.writeFile("public/" + name + ".store.png", buffer, function(err) {
            if(err) throw err;
            // console.log( "saved map image to map.png" );

            images = store.getItem('pngs');
            images[minLong + ' ' + minLat + ' ' + maxLong + ' ' + maxLat] = name;
            store.setItem('pngs', images);

            PythonShell.run('del.py', options2, function(err, results) {
              if(err) throw err;
              res.end(JSON.stringify({
                "success": name,
                "status": 200
              }));
            });
          });
        });
      });
    });
  });

  // req.body.forEach ( function( item ) {
  //   temp.push( { id: temp.length, author: item["author"], msg: item["msg"], hash: item["hash"], time: item["time"] } );
  // } );
  //
  // store.setItem( 'chat', temp );
});

app.get('*/:fileName', function(req, res) {
  var options = {
    root: __dirname,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  res.sendFile('/public/' + req.params.fileName, options, function(err) {
    if(err) {
      console.log(err);
      res.status(err.status).end();
    }
  });
});

// ================ SERVER LISTEN SETUP ================
var server = app.listen(80, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('app listening at http://%s:%s', host, port);
  console.log('');
  console.log('');
});
