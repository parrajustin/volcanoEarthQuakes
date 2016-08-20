/* eslint max-statements-per-line: ["error", { "max": 2 }] no-native-reassign: "off"*/
/* global jQuery */

var fs = require('fs');                   // file system module
var $ = jQuery = require('./jquery.js');  // Jquery base, not needed but necessary for the csv function
require('./jquery.csv.js');               // Jquery csv function
var query = {};

// This section is dedicated to handling the passed in information from the command line
var cmd = 0;
var fileName = '';
var arg;
var out;
process.argv.forEach(function(val, index, array) {
  if(val === '-h') {
    console.log("===HELP MENU===");
    console.log("= -clean : will clean up the csv from the pub format; default out file name: 'public/array.csv'");
    console.log("= -cluster : will find the cluster centers using kmeans algroithm; default k: 3");
    console.log("= -in='filename' : specifiy the input filename");
    console.log("= -out='filename' : specifiy the output filename");
    console.log("= -k=NUMBER : specify the kmeans # of clusters");
    process.exit(-1);
  }

  if(val === '-clean') {
    if(cmd !== 0) {
      console.log("can't have both -clean and -cluster");
      process.exit(-1);
    }
    cmd = 1;
  }

  if(val === '-cluster') {
    if(cmd !== 0) {
      console.log("can't have both -clean and -cluster");
      process.exit(-1);
    }
    cmd = 2;
  }

  if(val.split('=')[0] === '-out') {
    out = val.split('=')[1];
  }

  if(val.split('=')[0] === '-in') {
    fileName = val.split('=')[1];
  }

  if(val.split('=')[0] === '-k') {
    arg = val.split('=')[1];
  }
});

/**
 * The class object for representing a single earthquake
 * @param  {float} lat   the float representation of the Latitude of this point
 * @param  {float} long  the float representation of the Longitude of this point
 * @param  {int} depth the depth of the earthquake in km
 * @param  {string} time  the string representation of time ins iso format
 * @param  {int} mag   the magnitude of the earthquake
 */
function Point(lat, long, depth, time, mag) {
  this.time = time;
  this.lat = lat;
  this.long = long;
  this.depth = depth;
  this.mag = mag;
  this.getLat = function() { return this.lat; };
  this.getLong = function() { return this.long; };
  this.getDepth = function() { return this.depth; };
  this.getTime = function() { return this.time; };
  this.toString = function() { return this.time + ',' + this.lat + ',' + this.long + ',' + this.depth + ',' + this.mag; };
}

/**
 * will pad and input to make sure there are two numbers
 * @param  {string} input the input string may be '1' and '01' will be returned
 * @return {string}       the padded string
 */
function pad(input) {
  if(input.toString().length === 1)
    return("0" + input.toString());
  return input;
}

/**
 * Cleans the data getting rid of unnecessary bits and saves the new csv file
 */
function clean() {
  // console.log("test" + JSON.stringify(cv[1]));
  var temp = [];
  for(var i = 0; i < Object.keys(query).length; i++) {
    var sec = query[i].sec;
    sec = sec.split('');
    while(sec.length < 4) {
      sec.unshift('0');
    }
    sec.splice(2, 0, '.');
    sec = sec.toString().replace(/,/g, '');

    query[i].time = query[i].year + '-' + pad(query[i].month) + '-' + pad(query[i].day) + 'T' + pad(query[i].hour) + ':' +
      pad(query[i].min) + ':' + sec + '0Z';
    query[i].latitude = (Number(query[i].lat) * 1.0 + ((Number(query[i].latM) * 1.0 + (Number(query[i].latMd) / 100.0)) * 0.0166667));
    query[i].longitude = (Number(query[i].long) * 1.0 + ((Number(query[i].longM) * 1.0 + (Number(query[i].longMd) / 100.0)) * 0.0166667)) * -1.0;

    temp.unshift(new Point(query[i].latitude, query[i].longitude, query[i].depth, query[i].time, Number(query[i].mag)));
  }

  var file = fs.createWriteStream((out === undefined ? 'public/array.csv' : out));
  file.on('error', function(err) { console.error(err);});
  file.write("time,lat,long,depth,mag\n");
  temp.forEach(function(v) { file.write(v.toString() + '\n'); });
  file.end();
}



// Outputs some info on which funciton the
if(cmd === 0 || fileName === '') {
  console.log("exiting");
  process.exit(-1);
} else if(cmd === 1) {
  console.log("running cleaning on " + fileName);
  if(out === undefined)
    console.log("saving file to 'public/array.csv'");
  else
    console.log("saving file to " + out);
} else {
  console.log("running clusters on " + fileName);
  if(arg === undefined)
    console.log("using 3 clusters");
  else
    console.log("using " + arg + " clusters");
}






fs.readFile(fileName, 'UTF-8', function(err, csv) {
  if(err) throw console.error(err);

  $.csv.toObjects(csv, {}, function(err, data) {
    if(err) throw console.error(err);

    for(var i = 0, len = data.length; i < len; i++) {
      query[i] = data[i];
    }

    if(cmd === 1)
      clean();
    else
      cluster();
  });
});


/*
▄▄▄▄▄▄▄▄▄▄▄  ▄            ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░░▌▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀▀▀ ▐░▌          ▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀  ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌
▐░▌          ▐░▌          ▐░▌       ▐░▌▐░▌               ▐░▌     ▐░▌          ▐░▌       ▐░▌
▐░▌          ▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄      ▐░▌     ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌
▐░▌          ▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░▌          ▐░▌          ▐░▌       ▐░▌ ▀▀▀▀▀▀▀▀▀█░▌     ▐░▌     ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀█░█▀▀
▐░▌          ▐░▌          ▐░▌       ▐░▌          ▐░▌     ▐░▌     ▐░▌          ▐░▌     ▐░▌
▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌ ▄▄▄▄▄▄▄▄▄█░▌     ▐░▌     ▐░█▄▄▄▄▄▄▄▄▄ ▐░▌      ▐░▌
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌     ▐░▌     ▐░░░░░░░░░░░▌▐░▌       ▐░▌
▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀       ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀

 */

var k = (arg === undefined ? 3 : Number(arg));
var latMax = 60.6849066;
var latMin = 60.2849066;
var longMin = -152.9451997;
var longMax = -152.5451997;
var temp = [];

/**
 * the main function for running the kmeans function
 */
function cluster() {
  var obj = {};
  var len = Object.keys(query).length;
  for(var i = 0; i < len; i++) {
    obj = query[i];
    if(obj.lat < latMin || obj.lat > latMax || obj.long < longMin || obj.long > longMax)
      continue;
    temp.push(new Point(obj.lat, obj.long, obj.depth, obj.time, obj.mag));
  }

  var centers = randomCenters(k);
  var oldLabels = [{dalkfnoienlkas: 'aosneflansel'}];
  var labels;
  var x = 0;

  // while(x !== 10) {
  while(!(JSON.stringify(oldLabels) === JSON.stringify(labels))) {
    if(x % 100 === 0 && x !== 0) {
      var y = 0;
      var log = "";
      for(var z = 0; z < labels.length; z++) {
        if(oldLabels[z] !== labels[z]) {
          y++;
          // log += "," + z;
        }
      }
      console.log(x + ": " + y + ": " + log);
    }
    x++;

    oldLabels = labels;

    labels = computeLabels(temp, centers);
    centers = newCenters(labels, centers, temp);

    if(x === 1000)
      break;
  }

  console.log(JSON.stringify(centers));
}

/**
 * returns an array of the new centers
 * @param  {array} labels  the array of labels for which each peice of data is closest to
 * @param  {array} centers the array of actual centers
 * @param  {pointArray} data    the point ojbect array of the earthquakes
 * @return {array}         an array of objects that contain the new centers
 */
function newCenters(labels, centers, data) {
  var x = Array(centers.length).fill(0); // 3: lat
  var y = Array(centers.length).fill(0); // 3: long
  // var z = Array(centers.length).fill(0);
  var depth = Array(centers.length).fill(0);
  var n = Array(centers.length).fill(0);
  // var R = 6371000;

  var i = 0;
  for(i = 0; i < labels.length; i++) {
    // version 1
    // x[labels[i]] += Math.cos(Number(data[i].lat) / (Math.PI / 180)) * Math.cos(Number(data[i].long) / (Math.PI / 180));
    // y[labels[i]] += Math.cos(Number(data[i].lat) / (Math.PI / 180)) * Math.sin(Number(data[i].long) / (Math.PI / 180));
    // z[labels[i]] += Math.sin(Number(data[i].lat) / (Math.PI / 180));

    // version 2
    // n[labels[i]] += 1;
    // depth[labels[i]] += Number(data[i].depth);
    // var a = ((90 - Number(data[i].lat)) * Math.PI) / 180;
    // var b = ((Number(data[i].long)) * Math.PI) / 180;
    // x[labels[i]] += R * Math.sin(a) * Math.cos(b);
    // y[labels[i]] += R * Math.sin(a) * Math.sin(b);
    // z[labels[i]] += R * Math.cos(a);

    // version 3
    // x[labels[i]] += Number(data[i].lat);
    // y[labels[i]] += Number(data[i].long);
    depth[labels[i]] += Number(data[i].depth);
    n[labels[i]] += 1;

    // version 4 / 3
    x[labels[i]] += latMax - data[i].lat;
    y[labels[i]] += longMax - data[i].long;

    // console.log(p.toString());
    // console.log(latMax + " " + longMax);

    // console.log("test: " + distance({lat: 55, long: 60, depth: 0}, {lat: 55, long: 55, depth: 0}));
    // console.log(1 * (Math.PI / 180));
    // console.log(x[labels[i]] + " " + y[labels[i]]);
    // console.log(JSON.stringify(data[i]));
    // console.log(latMax + " " + longMax);
    // process.exit(1);
  }

  var newC = [];
  var temp = {};
  for(i = 0; i < centers.length; i++) {
    x[i] /= n[i];
    y[i] /= n[i];
    // z[i] /= n[i]; // version 3 doens't need this
    depth[i] /= n[i];

    // var hyp = Math.sqrt(x[i] * x[i] + y[i] * y[i]);
    // var lon = Math.atan2(y[i], x[i]);
    // var lat = Math.atan2(z[i], hyp);

    temp = {};
    temp.lat = latMax - x[i];
    temp.long = longMax - y[i];
    temp.depth = depth[i];
    newC.push(temp);
  }

  return newC;
}

/**
 * finds the clostest center for each earthquake point
 * @param  {array} data    array of points
 * @param  {array} centers array of centers
 * @return {array}         returns the labels labels[x] = the clostest center for data[x]
 */
function computeLabels(data, centers) {
  var labels = [];

  var dist = 100000000000000000000;
  var label = -1;
  var tempDist = 0;
  for(var i = 0; i < data.length; i++) {
    dist = 100000000000000000000;
    label = -1;

    for(var j = 0; j < centers.length; j++) {
      tempDist = distance(data[i], centers[j]);
      if(Number(tempDist) < dist) {
        dist = tempDist;
        label = j;
      }
    }

    labels.push(label);
  }

  return labels;
}

/**
 * computes the distance between two points retrieved from http://www.movable-type.co.uk/scripts/latlong.html
 * @param  {point} point  point representation of the earthquake
 * @param  {obj} center object container of a center
 * @return {float}        distance between the two points
 */
function distance(point, center) {
  var R = 6371;
  var φ1 = point.lat * (Math.PI / 180);
  // var λ1 = center.lat * (Math.PI / 180);
  var φ2 = point.long * (Math.PI / 180);
  // var λ2 = center.long * (Math.PI / 180);
  // var Δφ = φ2 - φ1;
  // var Δλ = λ2 - λ1;
  var Δφ = (center.lat - point.lat) * (Math.PI / 180);
  var Δλ = (center.long - point.long) * (Math.PI / 180);

  var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  if(JSON.stringify(d) === 'null')
    return Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R / 1000 + Math.abs(point.depth - center.depth);
  return d + Math.abs(point.depth - center.depth);
}

/**
 * gives randomly spaced centers placed in the area of the eqs
 * @param  {int} k the number of centers
 * @return {obj}   array of center objects
 */
function randomCenters(k) {
  var center = [];

  var temp = {};
  for(var i = 0; i < k; i++) {
    temp = {};
    temp.lat = (Math.random() * (latMax - latMin)) + latMin;
    temp.long = (Math.random() * (longMax - longMin)) + longMin;
    temp.depth = Math.floor(Math.random() * 1000);
    center.push(temp);
  }

  return center;
}
