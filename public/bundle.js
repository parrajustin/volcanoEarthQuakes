(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint no-unused-vars: ["warn"] guard-for-in: "off" */
/* global THREE window document requestAnimationFrame Stats dat $ URIUtil*/

var scene;
var camera;
var renderer;
var stats;
var vn;
var url = "localhost/volcano.csv";
var query;

$.ajax( {
  url: url,
  cache: false,
  type: 'GET',
  async: false,
  success: function( data ) {
    var v = $.csv.toObjects( data );
    vn = {};
    for( var i = 0; i < v.length; i++ ) {
      vn[v[i].name] = v[i].lat + "," + v[i].long;
    }
  },
  error: function( xhr, status, err ) {
    console.error( this, status, err.toString() );
  }.bind( this )
} );

init();
animate();

/**
 * The initial function that setups the scene
 */
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  renderer = new THREE.WebGLRenderer( {
    antialias: true
  } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xf0f0f0 );
  document.body.appendChild( renderer.domElement );

  var controls = new THREE.OrbitControls( camera, renderer.domElement );

  // var geometry = new THREE.BoxGeometry(1, 1, 1);
  // var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
  // var cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  // ========================================= BOTTOM SQUARS ========================================= //
  var geometry = new THREE.BoxGeometry( 20, 20, 20 );
  var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );
  var object2 = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );
  var object3 = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );
  var object4 = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );

  object.position.x = 40;
  object.position.y = -100;
  object.position.z = 40;
  scene.add( object );

  object2.position.x = -40;
  object2.position.y = -100;
  object2.position.z = 40;
  scene.add( object2 );

  object3.position.x = 40;
  object3.position.z = -40;
  object3.position.y = -100;
  scene.add( object3 );

  object4.position.x = -40;
  object4.position.y = -100;
  object4.position.z = -40;
  scene.add( object4 );

  var origin = new THREE.BoxGeometry( 1, 1, 1 );
  var originObject = new THREE.Mesh( origin, new THREE.MeshLambertMaterial( {
    color: Math.random() * 0xffffff
  } ) );
  scene.add( originObject );

  // for( var i = 0; i < 1500; i++ ) {
  //   var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
  //     color: Math.random() * 0xffffff
  //   } ) );
  //
  //   object.position.x = Math.random() * 800 - 400;
  //   object.position.y = Math.random() * 800 - 400;
  //   object.position.z = Math.random() * 800 - 400;
  //
  //   scene.add( object );
  // }

  // ========================================= PLANE ========================================= //
  var planeGeometry = new THREE.SphereGeometry( 100, 50, 50 );
  planeGeometry.scale( 1, .01, 1 );
  var planeMaterial = new THREE.LineBasicMaterial( {
    color: 65532,
    opacity: 0.25,
    transparent: true,
    alphaTest: 0.25
  } );
  var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );

  scene.add( planeMesh );

  // ========================================= LIGHTS ========================================= //
  scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) );

  var light = new THREE.DirectionalLight( 0xffffff, 0.35 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  camera.position.z = 5;

  // ========================================= STATS MONITOR ========================================= //
  stats = new Stats();
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  // ========================================= GUI ========================================= //
  var TextObject = {
    Latitude: 34.5,
    Longitude: 131.6,
    startDate: 2000,
    endDate: 2010,
    startMonth: 1,
    endMonth: 12,
    startDay: 1,
    endDay: 30,
    startHour: 0,
    endHour: 0,
    startMin: 0,
    endMin: 0,
    startSec: 0,
    endSec: 0,
    play: 0,
    radiusKM: 100,
    VolcanoName: "34.5,131.6",
    dateGet: function( val ) {
      if( val === 0 )
        return this.startDate.toString() + "%2D" + this.startMonth.toString() + "%2D" + this.startDay.toString();
      return this.endDate.toString() + "%2D" + this.endMonth.toString() + "%2D" + this.endDay.toString();
    },
    timeGet: function( val ) {
      if( val === 0 )
        return this.startHour.toString() + "%3A" + this.startMin.toString() + "%3A" + this.startSec.toString();
      return this.endHour.toString() + "%3A" + this.endMin.toString() + "%3A" + this.endSec.toString();
    },
    sendQuery: function() {
      var s = "&starttime=" + this.dateGet( 0 ).toString() + "T" + this.timeGet( 0 ).toString() +
      "&endtime=" + this.dateGet( 1 ).toString() + "T" + this.timeGet( 1 ) +
      "&latitude=" + this.Latitude + "&longitude=" + this.Longitude + "&maxradiuskm=" + this.radiusKM;
      console.log( s );
      s = "http://earthquake.usgs.gov/fdsnws/event/1/query?format=csv" + s;
      console.log( s );
      $.ajax( {
        url: s,
        type: 'GET',
        async: false,
        success: function( data ) {
          query = $.csv.toObjects( data );
          console.log( query );
        },
        error: function( xhr, status, err ) {
          console.error( this, status, err.toString() );
        }.bind( this )
      } );
    }
  };

  var dateCheck = function( month ) {
    if( month === null )
      return 1;
    else if( month === 2 )
      return 28;
    else if( month <= 7 && month % 2 !== 0 )
      return 31;
    else if( month <= 7 )
      return 30;
    else if( month >= 8 && month % 2 === 0 )
      return 31;
    return 30;
  };

  var gui = new dat.GUI();
  var text = TextObject;

  // ==== QUERY FOLDER ==== //
  var dataFolder = gui.addFolder( 'Data Query' );

  // == latitude == //
  dataFolder.add( text, "Latitude", -90, 90 ).step( 0.01 ).listen();
  dataFolder.add( text, "Longitude", -180, 180 ).step( 0.01 ).listen();
  dataFolder.add( text, "VolcanoName", vn ).onChange( function( value ) {
    var temp = value.split( "," );
    text.Latitude = Number( temp[0] );
    text.Longitude = Number( temp[1] );
  } );
  dataFolder.add( text, "radiusKM" ).min( 0 );

  // == YEAR == //
  var yearFolder = dataFolder.addFolder( 'Year' );
  yearFolder.add( text, 'startDate', 1995, 2016 ).step( 1 ).listen().onChange( function( value ) {
    // console.log(require('util').inspect(this, {depth: null}));
    if( text.endDate < value )
      text.endDate = value;
  } );
  yearFolder.add( text, 'endDate', 1995, 2016 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startDate > value )
      text.startDate = value;
  } );

  // == MONTH == //
  var monthFolder = dataFolder.addFolder( 'Month' );
  monthFolder.add( text, 'startMonth', 1, 12 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startDate === text.endDate && text.endMonth < value )
      text.endMonth = value;
    if( text.startDay >= 29 )
      text.startDay = dateCheck( text.startMonth );
  } );
  monthFolder.add( text, 'endMonth', 1, 12 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startDate === text.endDate && text.startMonth > value )
      text.startMonth = value;
    if( text.endDay >= 29 )
      text.endDay = dateCheck( text.endMonth );
  } );

  // == DAY == //
  var dayFolder = dataFolder.addFolder( 'Day' );
  dayFolder.add( text, 'startDay', 1, 31 ).step( 1 ).listen().onChange( function( value ) {
    if( value >= 29 )
      text.startDate = dateCheck( text.startMonth );
    if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.endDay < value )
      text.endDay = value;
  } );
  dayFolder.add( text, 'endDay', 1, 31 ).step( 1 ).listen().onChange( function( value ) {
    if( value >= 29 )
      text.endDay = dateCheck( text.endMonth );
    if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay > value )
      text.startDay = value;
  } );

  // == HOUR == //
  var hourFolder = dataFolder.addFolder( 'Hour' );
  hourFolder.add( text, 'startHour', 0, 24 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay && text.endHour < value )
      text.endHour = value;
    if( value === 24 ) {
      text.startMin = 0;
      text.startSec = 0;
      if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay ) {
        text.endMin = 0;
        text.endSec = 0;
      }
    }
  } );
  hourFolder.add( text, 'endHour', 0, 24 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay && text.startHour > value )
      text.startHour = value;
    if( value === 24 ) {
      text.endMin = 0;
      text.endSec = 0;
      if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay ) {
        text.startMin = 0;
        text.startSec = 0;
      }
    }
  } );

  // == MIN == //
  var minFolder = dataFolder.addFolder( 'Minute' );
  minFolder.add( text, 'startMin', 0, 60 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startHour === 24 )
      text.startMin = 0;
    else if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.endMin < value )
      text.endMin = value;
  } );
  minFolder.add( text, 'endMin', 0, 60 ).step( 1 ).listen().onChange( function( value ) {
    if( text.endHour === 24 )
      text.endMin = 0;
    else if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin > value )
      text.startMin = value;
  } );

  // == Sec == //
  var secFolder = dataFolder.addFolder( 'Second' );
  secFolder.add( text, 'startSec', 0, 60 ).step( 1 ).listen().onChange( function( value ) {
    if( text.startHour === 24 )
      text.startSec = 0;
    else if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin === text.endMin && text.endSec < value )
      text.endSec = value;
  } );
  secFolder.add( text, 'endSec', 0, 60 ).step( 1 ).listen().onChange( function( value ) {
    if( text.endHour === 24 )
      text.endSec = 0;
    else if( text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin === text.endMin && text.startSec > value )
      text.startSec = value;
  } );

  dataFolder.add( text, 'sendQuery' );

  // ==== ANIMATION CONTROLLER FOLDER ==== //
  var animFolder = gui.addFolder( 'Animation' );

  // == Controls == //
  animFolder.add( text, 'play' );

  // ========================================= EVENTS ========================================= //
  window.addEventListener( 'resize', onResize, false );
}

/**
 * Window resize event
 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
 * the animate function
 */
function animate() {
  requestAnimationFrame( animate, renderer.domElement );

  render();
  stats.update();
}

/**
 * This will create a loop that causes the renderer to draw the scene 60 times per second
 */
function render() {
  renderer.render( scene, camera );
}

},{}]},{},[1]);
