/* eslint no-unused-vars: ["warn"] guard-for-in: "off" */
/* global THREE window document requestAnimationFrame Stats dat $ Math XMLHttpRequest*/



var scene;
var camera;
var renderer;
var stats;
var vn; // volcano name and lat/long holder
var url = "/volcano.csv";
var query; // earthquake data
var originObject; // object to show elevatino of the volcano

var currentEQ = []; // Array of currently displayed earthquakes
var lastIndex;
var text;
var oldTimeSet;
var timeSet;
var deltaTime;
var globalDate = new Date();
var deltaTempDate;

var plane = "";

var lastRender = 0;
var DOINGWORK = false;




var TextObject = {
  Latitude: 60.4849066,
  Longitude: -152.7451997,
  Elevation: 2.7,
  startDate: 2009,
  endDate: 2010,
  startMonth: 1,
  endMonth: 1,
  startDay: 1,
  endDay: 1,
  startHour: 0,
  endHour: 0,
  startMin: 0,
  endMin: 0,
  startSec: 0,
  endSec: 0,
  play: 0,
  radiusDegrees: 1,
  VolcanoName: "60.4849066,-152.7451997,2.7",
  // htmlGET: function(val) {
  //   if(val === 0)
  //     return this.startDate.toString() + "%2D" + this.startMonth.toString() + "%2D" + this.startDay.toString() + "T" + this.startHour.toString() +
  //       "%3A" + this.startMin.toString() + "%3A" + this.startSec.toString();
  //   return this.endDate.toString() + "%2D" + this.endMonth.toString() + "%2D" + this.endDay.toString() + "T" + this.endHour.toString() + "%3A" +
  //     this.endMin.toString() + "%3A" + this.endSec.toString();
  // },
  pad: function(val) {
    if(val.toString().length === 1)
      return("0" + val.toString());
    return val;
  },
  nonHTMLGET: function(val) {
    if(val === 0)
      return this.startDate.toString() + "-" + this.pad(this.startMonth) + "-" + this.pad(this.startDay) + "T" + this.pad(this.startHour) +
        ":" + this.pad(this.startMin) + ":" + this.pad(this.startSec) + ".000Z";
    return this.endDate.toString() + "-" + this.pad(this.endMonth) + "-" + this.pad(this.endDay) + "T" + this.pad(this.endHour) + ":" +
      this.pad(this.endMin) + ":" + this.pad(this.endSec) + ".000Z";
  },
  sendQuery: function() {
    if(plane !== "") {
      scene.remove(plane);
      plane.geometry.dispose();
      plane = "";
    }
    $(".loading").css("display", "block");

    var name = '';
    $.ajax({
      url: '/api/map',
      dataType: 'json',
      contentType: 'application/json',
      type: 'POST',
      data: JSON.stringify({
        minLat: text.Latitude - text.radiusDegrees,
        maxLat: text.Latitude + text.radiusDegrees,
        minLong: text.Longitude - text.radiusDegrees,
        maxLong: text.Longitude + text.radiusDegrees
      }),
      success: function(data) {

        var d = data["success"];

        $.ajax({
          url: '/2009T.csv',
          type: 'GET',
          async: false,
          success: function(data) {
            query = $.csv.toObjects(data);
            // TODO get rid of this console.log
            // console.log(query);

            var dateS = new Date(text.nonHTMLGET(0).toString());
            var dateE = new Date(text.nonHTMLGET(1).toString());

            // console.log( ref.psRef );

            text.playEnabled = true;
            text.playEnabledHidden = true;
            text.playStart = dateS.getTime();
            text.playEnd = dateE.getTime();
            text.psRef.__max = text.playEnd;
            text.psRef.__min = text.playStart;
            text.time = text.playStart;
            text.timeTextCurrent = dateS;

            lastIndex = query.length;
            cleanGeo();
            cleanData();

            handleEQ(text, dateS.getTime(), undefined, d);
          },
          error: function(xhr, status, err) {
            console.error(this, status, err.toString());
          }.bind(this)
        });

      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.url, status, err.toString());
      }.bind(this)
    });

  },



  peRef: null, // reference to button for enabled
  playEnabled: false,
  playEnabledHidden: false,
  psRef: null, // reference to slider
  playStart: 0,
  playEnd: 0,
  playLife: 604800000,
  time: 0,
  timeText: "YYYY-MM-DDTHH:MM:SSSZ",
  timeTextCurrent: "YYYY-MM-DDTHH:MM:SSSZ",
  step: function() {
    if(!this.playEnabledHidden)
      return;

    lastIndex = query.length;
    cleanGeo();
    handleEQ(this, this.time);
  },
  msPerSecond: 151200000,
  playButton: function() {
    if(!this.playEnabledHidden)
      return;

    handleEQ(this, this.time);
    oldTimeSet = lastRender.getTime();
    timeSet = lastRender.getTime();
    console.log(lastRender.getTime());
    this.playRunning = true;
  },
  playRunning: false,
  stopButton: function() {
    this.playRunning = false;
  },
  renderAll: function() {
    handleEQ(text, undefined, 1);
  }
};














$.ajax({
  url: url,
  cache: true,
  type: 'GET',
  async: false,
  success: function(data) {
    var v = $.csv.toObjects(data);
    vn = {};
    for(var i = 0; i < v.length; i++) {
      vn[v[i].name] = v[i].lat + "," + v[i].long + "," + v[i].elev;
    }
  },
  error: function(xhr, status, err) {
    console.error(this, status, err.toString());
  }.bind(this)
});

init();
animate();










//  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄
// ▐░░░░░░░░░░░▌▐░░▌      ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
//  ▀▀▀▀█░█▀▀▀▀ ▐░▌░▌     ▐░▌ ▀▀▀▀█░█▀▀▀▀  ▀▀▀▀█░█▀▀▀▀
//      ▐░▌     ▐░▌▐░▌    ▐░▌     ▐░▌          ▐░▌
//      ▐░▌     ▐░▌ ▐░▌   ▐░▌     ▐░▌          ▐░▌
//      ▐░▌     ▐░▌  ▐░▌  ▐░▌     ▐░▌          ▐░▌
//      ▐░▌     ▐░▌   ▐░▌ ▐░▌     ▐░▌          ▐░▌
//      ▐░▌     ▐░▌    ▐░▌▐░▌     ▐░▌          ▐░▌
//  ▄▄▄▄█░█▄▄▄▄ ▐░▌     ▐░▐░▌ ▄▄▄▄█░█▄▄▄▄      ▐░▌
// ▐░░░░░░░░░░░▌▐░▌      ▐░░▌▐░░░░░░░░░░░▌     ▐░▌
//  ▀▀▀▀▀▀▀▀▀▀▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀▀       ▀

/**
 * The initial function that setups the scene
 */
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf0f0f0);
  document.body.appendChild(renderer.domElement);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  // ========================================= BOTTOM SQUARS ========================================= //
  var geometry = new THREE.BoxGeometry(20, 20, 20);
  var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff
  }));
  var object2 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff
  }));
  var object3 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff
  }));
  var object4 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff
  }));

  object.position.x = 40;
  object.position.y = -100;
  object.position.z = 40;
  scene.add(object);

  object2.position.x = -40;
  object2.position.y = -100;
  object2.position.z = 40;
  scene.add(object2);

  object3.position.x = 40;
  object3.position.z = -40;
  object3.position.y = -100;
  scene.add(object3);

  object4.position.x = -40;
  object4.position.y = -100;
  object4.position.z = -40;
  scene.add(object4);

  var origin = new THREE.BoxGeometry(1, 1, 1);
  originObject = new THREE.Mesh(origin, new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff
  }));
  scene.add(originObject);


  var northGeom = new THREE.PlaneGeometry(40, 100, 3, 3);
  var northObject = new THREE.Mesh(northGeom, new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: THREE.ImageUtils.loadTexture('./arrow.png')
  }));
  northObject.position.x = 0;
  northObject.position.z = -200;
  northObject.rotation.x = -Math.PI / 2;
  scene.add(northObject);

  // ========================================= LIGHTS ========================================= //
  // scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  scene.add(new THREE.AmbientLight(0xffffff));

  var light = new THREE.DirectionalLight(0xffffff, 0.35);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  camera.position.z = 5;

  // ========================================= STATS MONITOR ========================================= //
  stats = new Stats();
  stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  // ========================================= GUI ========================================= //

  var dateCheck = function(month) {
    if(month === null)
      return 1;
    else if(month === 2)
      return 28;
    else if(month <= 7 && month % 2 !== 0)
      return 31;
    else if(month <= 7)
      return 30;
    else if(month >= 8 && month % 2 === 0)
      return 31;
    return 30;
  };

  var gui = new dat.GUI({
    width: 400
  });
  // TODO since text object is now global I need to replace all instances of it with the global
  text = TextObject;

  // ==== QUERY FOLDER ==== //
  var dataFolder = gui.addFolder('Data Query');

  // == latitude == //
  dataFolder.add(text, "Latitude", -90, 90).step(0.01).listen();
  dataFolder.add(text, "Longitude", -180, 180).step(0.01).listen();
  dataFolder.add(text, "Elevation", -6000, 6000).step(0.01).listen();
  dataFolder.add(text, "VolcanoName", vn).onChange(function(value) {
    var temp = value.split(",");
    text.Latitude = Number(temp[0]);
    text.Longitude = Number(temp[1]);
    text.Elevation = Number(temp[2]);
  });
  dataFolder.add(text, "radiusDegrees").min(0.1).max(180);

  // == YEAR == //
  var yearFolder = dataFolder.addFolder('Year');
  yearFolder.add(text, 'startDate', 1995, 2016).step(1).listen().onChange(function(value) {
    // console.log(require('util').inspect(this, {depth: null}));
    if(text.endDate < value)
      text.endDate = value;
  });
  yearFolder.add(text, 'endDate', 1995, 2016).step(1).listen().onChange(function(value) {
    if(text.startDate > value)
      text.startDate = value;
  });

  // == MONTH == //
  var monthFolder = dataFolder.addFolder('Month');
  monthFolder.add(text, 'startMonth', 1, 12).step(1).listen().onChange(function(value) {
    if(text.startDate === text.endDate && text.endMonth < value)
      text.endMonth = value;
    if(text.startDay >= 29)
      text.startDay = dateCheck(text.startMonth);
  });
  monthFolder.add(text, 'endMonth', 1, 12).step(1).listen().onChange(function(value) {
    if(text.startDate === text.endDate && text.startMonth > value)
      text.startMonth = value;
    if(text.endDay >= 29)
      text.endDay = dateCheck(text.endMonth);
  });

  // == DAY == //
  var dayFolder = dataFolder.addFolder('Day');
  dayFolder.add(text, 'startDay', 1, 31).step(1).listen().onChange(function(value) {
    if(value >= 29)
      text.startDate = dateCheck(text.startMonth);
    if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.endDay < value)
      text.endDay = value;
  });
  dayFolder.add(text, 'endDay', 1, 31).step(1).listen().onChange(function(value) {
    if(value >= 29)
      text.endDay = dateCheck(text.endMonth);
    if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay > value)
      text.startDay = value;
  });

  // == HOUR == //
  var hourFolder = dataFolder.addFolder('Hour');
  hourFolder.add(text, 'startHour', 0, 24).step(1).listen().onChange(function(value) {
    if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay && text.endHour < value)
      text.endHour = value;
    if(value === 24) {
      text.startMin = 0;
      text.startSec = 0;
      if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay) {
        text.endMin = 0;
        text.endSec = 0;
      }
    }
  });
  hourFolder.add(text, 'endHour', 0, 24).step(1).listen().onChange(function(value) {
    if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay && text.startHour > value)
      text.startHour = value;
    if(value === 24) {
      text.endMin = 0;
      text.endSec = 0;
      if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay) {
        text.startMin = 0;
        text.startSec = 0;
      }
    }
  });

  // == MIN == //
  var minFolder = dataFolder.addFolder('Minute');
  minFolder.add(text, 'startMin', 0, 60).step(1).listen().onChange(function(value) {
    if(text.startHour === 24)
      text.startMin = 0;
    else if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.endMin < value)
      text.endMin = value;
  });
  minFolder.add(text, 'endMin', 0, 60).step(1).listen().onChange(function(value) {
    if(text.endHour === 24)
      text.endMin = 0;
    else if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin > value)
      text.startMin = value;
  });

  // == Sec == //
  var secFolder = dataFolder.addFolder('Second');
  secFolder.add(text, 'startSec', 0, 60).step(1).listen().onChange(function(value) {
    if(text.startHour === 24)
      text.startSec = 0;
    else if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin === text.endMin && text.endSec < value)
      text.endSec = value;
  });
  secFolder.add(text, 'endSec', 0, 60).step(1).listen().onChange(function(value) {
    if(text.endHour === 24)
      text.endSec = 0;
    else if(text.startDate === text.endDate && text.startMonth === text.endMonth && text.startDay === text.endDay &&
      text.startHour === text.endHour && text.startMin === text.endMin && text.startSec > value)
      text.startSec = value;
  });

  dataFolder.add(text, 'sendQuery');

  // ==== ANIMATION CONTROLLER FOLDER ==== //
  var animFolder = gui.addFolder('Animation');

  // == Controls == //
  text.peRef = animFolder.add(text, 'playEnabled');
  text.peRef.__onChange = function(value) {
    text.playEnabled = text.playEnabledHidden;
  };
  text.peRef.listen();

  text.psRef = animFolder.add(text, 'time', text.playStart, text.playEnd);
  text.psRef.__onChange = function(value) {
    var date = new Date(value);
    text.timeTextCurrent = date.toString();
    text.timeText = date.getFullYear() + "-" + text.pad(date.getMonth()) + "-" + text.pad(date.getDate()) + "T" + text.pad(date.getHours()) +
      ":" + text.pad(date.getMinutes()) + ":" + text.pad(date.getSeconds()) + "Z";
  };
  text.psRef.listen();

  animFolder.add(text, 'timeTextCurrent').listen();
  animFolder.add(text, 'timeText').onChange(function(value) {
    var date = new Date(value);
    if(date.toString() !== "Invalid Date") {
      text.timeTextCurrent = date.toString();
      text.time = date.getTime();
    }
  }).listen();

  animFolder.add(text, 'playLife');
  animFolder.add(text, 'step');
  animFolder.add(text, 'msPerSecond').min(0);
  animFolder.add(text, 'playButton');
  animFolder.add(text, 'stopButton');
  animFolder.add(text, 'renderAll');

  // ========================================= EVENTS ========================================= //
  window.addEventListener('resize', onResize, false);
}














/**
 * Binary search method
 * @param  {ms} mili time to search for
 * @return {int}      index of closes time to this
 */
function binaryIndexOf(mili) {
  var minIndex = 0;
  var maxIndex = query.length - 1;
  var currentIndex;
  var currentElement;
  var date;

  while(minIndex <= maxIndex) {
    currentIndex = (minIndex + maxIndex) / 2 | 0;
    date = new Date(query[currentIndex].time);
    currentElement = date.getTime();

    if(currentElement < mili) {
      maxIndex = currentIndex - 1;
    } else if(currentElement > mili) {
      minIndex = currentIndex + 1;
    } else {
      return currentIndex;
    }
  }

  return currentIndex;
}














/**
 ▄▄▄▄▄▄▄▄▄▄▄  ▄            ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄
▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌
▐░█▀▀▀▀▀▀▀▀▀ ▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌
▐░▌          ▐░▌          ▐░▌          ▐░▌       ▐░▌▐░▌▐░▌    ▐░▌
▐░▌          ▐░▌          ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌
▐░▌          ▐░▌          ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌
▐░▌          ▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌   ▐░▌ ▐░▌
▐░▌          ▐░▌          ▐░▌          ▐░▌       ▐░▌▐░▌    ▐░▌▐░▌
▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ▐░▌       ▐░▌▐░▌     ▐░▐░▌
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌      ▐░░▌
 ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀▀
                                                                 */

/**
 * This funciton will remove everyobject in the geo query array from the scene
 */
function cleanGeo() {
  // console.log( "" );
  // console.log( "CLEAN GEO " );
  for(var i = 0; i < currentEQ.length; i++) {
    var temp = currentEQ[i];
    scene.remove(temp);
    temp.geometry.dispose();
  }
  currentEQ = [];
}

// minLat: text.Latitude - text.radiusDegrees,
// maxLat: text.Latitude + text.radiusDegrees,
// minLong: text.Longitude - text.radiusDegrees,
// maxLong: text.Longitude + text.radiusDegrees
function cleanData() {
  // console.log("starting " + query.length);
  var temp = [];
  for(var i = 0; i < query.length; i++) {
    var sec = query[i].sec;
    sec = sec.split('');
    while(sec.length < 4) {
      sec.unshift('0');
    }
    sec.splice(2, 0, '.');
    sec = sec.toString().replace(/,/g, '');

    query[i].time = query[i].year + '-' + text.pad(query[i].month) + '-' + text.pad(query[i].day) + 'T' + text.pad(query[i].hour) + ':' +
      text.pad(query[i].min) + ':' + sec + '0Z';
    query[i].latitude = (Number(query[i].lat) + ((Number(query[i].latM) + (Number(query[i].latMd) / 100)) * 0.0166667));
    query[i].longitude = (Number(query[i].long) + ((Number(query[i].longM) + (Number(query[i].longMd) / 100)) * 0.0166667)) * -1;
    if(query[i].longitude > text.Longitude - text.radiusDegrees && query[i].longitude < text.Longitude + text.radiusDegrees &&
      query[i].latitude > text.Latitude - text.radiusDegrees && query[i].latitude < text.Latitude + text.radiusDegrees) {
      temp.push(query[i]);
    }
  }
  query = temp;

  temp = [];
  // console.log(query.length);
  while(query.length > 0) {
    if(query.length % 1000 == 0)
      console.log(query.length);
    temp.unshift(query.shift());
  }
  query = temp;

  // console.log(query);
  // console.log("ending " + query.length);

  lastIndex = query.length;
}









/*
 ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄       ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄   ▄            ▄▄▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌     ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌▐░░░░░░░░░░▌ ▐░▌          ▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌     ▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀
▐░▌          ▐░▌       ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌    ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌
▐░█▄▄▄▄▄▄▄▄▄ ▐░▌       ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌▐░▌       ▐░▌▐░▌          ▐░█▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░░▌▐░▌       ▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌▐░▌       ▐░▌▐░▌          ▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀▀▀ ▐░█▄▄▄▄▄▄▄█░▌     ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌   ▐░▌ ▐░▌▐░▌       ▐░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀
▐░▌          ▐░░░░░░░░░░░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌    ▐░▌▐░▌▐░▌       ▐░▌▐░▌          ▐░▌
▐░█▄▄▄▄▄▄▄▄▄  ▀▀▀▀▀▀█░█▀▀      ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌     ▐░▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░░▌        ▐░▌       ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌      ▐░░▌▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
 ▀▀▀▀▀▀▀▀▀▀▀          ▀         ▀         ▀  ▀         ▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀
                                                                                                             */


/**
 * This function's purpose is to handle the array of currently rendered earthquakes
 * @param  {Object} ref contains all the values the user inputs into the dat gui
 * @param  {ms} time current time
 * @param  {ms} check just a check to run the else statement to render all earthquakes
 */
function handleEQ(ref, time, check, fileName) {
  DOINGWORK = true;
  if(!text.playRunning)
    var d = new Date();

  if(plane === "") {
    var terrainLoader = new THREE.TerrainLoader();
    var data;
    terrainLoader.load('./' + fileName + '.store.bin', function(pass) {
      data = pass;
      // console.log( data );

      var geometry = new THREE.PlaneGeometry(222, 211, 399, 399);
      var max = 0;
      var min = 11111111111111;
      var i;
      var l;
      for(i = 0, l = geometry.vertices.length; i < l; i++) {
        if(data[i] > max)
          max = data[i];
        if(data[i] < min)
          min = data[i];
      }
      var maxRender = 0;
      var minRender = 111111111;
      for(i = 0, l = geometry.vertices.length; i < l; i++) {
        geometry.vertices[i].z = data[i] / max * 8;

        if(geometry.vertices[i].z > maxRender)
          maxRender = geometry.vertices[i].z;
        if(geometry.vertices[i].z < minRender)
          minRender = geometry.vertices[i].z;
      }

      console.log("m:" + max + " min:" + min + " mr:" + maxRender + " minR: " + minRender);
      // console.log( max + " " + min );

      var material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('./' + fileName + '.store.png')
      });

      plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -1 * Math.PI / 2;
      scene.add(plane);
      // scene.add( new THREE.AmbientLight( 0xeeeeee ) );
    });
  }

  if(!text.playRunning)
    console.log("ending terrain");

  if(time !== undefined) {
    // ==== CHECK OLD EQS ==== //
    if(!text.playRunning)
      console.log("= inside time check =" + time);
    if(currentEQ.length !== 0) {
      if(!text.playRunning)
        console.log("= inside current check =" + currentEQ.length + " " + lastIndex + " " + query.length);
      // == get rid of old no longer relevaent EQS == //
      var dTemp = new Date(query[lastIndex + currentEQ.length - 1].time);
      while(time - dTemp.getTime() > ref.playLife) {
        var temp = currentEQ.shift();
        scene.remove(temp);
        temp.geometry.dispose();
        if(currentEQ.length === 0)
          break;
        dTemp = new Date(query[lastIndex + currentEQ.length - 1].time);
      }
      // console.log( "after: " + currentEQ.length );

      // == create temp array of new eqs == //
      // var tempEQ = [];
      var z;
      for(z = 0; z < currentEQ.length; z++) {
        dTemp = new Date(query[lastIndex + currentEQ.length - 1 - z].time);
        var matTemp = new THREE.LineBasicMaterial({
          color: 0xff0000,
          opacity: (1.0 - (time - dTemp.getTime()) / ref.playLife),
          transparent: true,
          alphaTest: 0
        });
        currentEQ[z].material = matTemp;
      }
    }
    // ==== CHECK OLD EQS ==== //
    if(!text.playRunning)
      console.log("= out time check =" + time);

    // ==== CREATE NEW EQS ==== //
    var startIndex = binaryIndexOf(time);
    if(startIndex > lastIndex) {
      lastIndex = query.length;
      cleanGeo();
    }

    if(!(currentEQ.length > 0)) {
      if(!text.playRunning)
        console.log("ran");
      var tempDate;
      for(var z = lastIndex - 1; z > startIndex; z--) {
        tempDate = new Date(query[z].time);
        if(Math.abs(time - tempDate.getTime()) < ref.playLife)
          break;
      }
      if(!text.playRunning)
        console.log("z: " + z);
      if(z < lastIndex)
        lastIndex = z + 1;
      else
        lastIndex = query.length;
    }

    if(!text.playRunning)
      console.log("= check li:" + lastIndex + " si:" + startIndex + " =");

    var arrayTemp = [];
    // var shape = new THREE.SphereGeometry( .5, 50, 50 );
    var shape = new THREE.SphereGeometry(.5, 50, 50);
    var y;
    if(!text.playRunning) {
      console.log();
      console.log();
      console.log();
      console.log("start");
    }
    for(y = startIndex; y < lastIndex; y++) {
      // var shape = new THREE.SphereGeometry( query[y].mag / 10, 50, 50 );
      var tempDate
      try {
        tempDate = new Date(query[y].time);
      } catch(err) {
        console.log(y + " " + query[y]);
        return;
      }
      // if( Math.abs( time - tempDate.getTime() ) > ref.playLife )
      //   break;

      var shapeTemp = new THREE.LineBasicMaterial({
        color: 0xff0000,
        opacity: (1.0 - (time - tempDate.getTime()) / ref.playLife),
        transparent: true,
        alphaTest: 0
      });
      var shapeMesh = new THREE.Mesh(shape, shapeTemp);

      var lat = ref.Latitude;
      var latDif = lat - query[y].latitude;
      var latMax = text.radiusDegrees;
      var latPos = (latDif / latMax) * 105;

      var long = ref.Longitude;
      var longDif = long - query[y].longitude;
      var longMax = text.radiusDegrees;
      var longPos = (longDif / longMax) * 105 * -1;

      var depth = 0;
      var depthDif = -query[y].depth;
      var depthMax = 211;
      var depthPos = (depthDif < 0 ? -1 : 1) * (Math.abs(depthDif) / depthMax) * 105;

      shapeMesh.position.x = longPos;
      shapeMesh.position.z = latPos;
      shapeMesh.position.y = depthPos;

      arrayTemp.unshift(shapeMesh);
      scene.add(shapeMesh);
      if(y % 10 == 0 && !text.playRunning) {
        console.log(y);
      }
    }
    if(!text.playRunning) {
      console.log("Done");
      console.log();
      console.log();
      console.log();
      console.log();
    }

    lastIndex = startIndex;

    currentEQ = currentEQ.concat(arrayTemp);
    // while( arrayTemp.length > 0 )
    //   currentEQ.push( arrayTemp.shift() );
  } else if(check !== undefined) {
    console.log("ran");
    cleanGeo();
    console.log("===== " + ref.Latitude + " " + ref.Longitude + " =====");
    var geometry = new THREE.SphereGeometry(1, 50, 50);
    for(var i = (query.length - 1); i >= 0; i--) {
      var mat = new THREE.LineBasicMaterial({
        color: Math.random() * 0xffffff,
        opacity: 1.0,
        transparent: false,
        alphaTest: 0
      });
      var earthquake = new THREE.Mesh(geometry, mat);

      // TODO Compress these math equation
      var lat = ref.Latitude;
      var latDif = lat - query[i].latitude;
      var latMax = 1;
      var latPos = (latDif / latMax) * 105;

      var long = ref.Longitude;
      var longDif = long - query[i].longitude;
      var longMax = 1;
      var longPos = (longDif / longMax) * 105 * -1;

      var depth = 0;
      var depthDif = -query[i].depth;
      var depthMax = 211;
      var depthPos = (depthDif < 0 ? -1 : 1) * (Math.abs(depthDif) / depthMax) * 105;

      earthquake.position.x = longPos;
      earthquake.position.z = latPos;
      earthquake.position.y = depthPos;
      // console.log( "===== " + query[i].latitude + " " + query[i].longitude + " =====" );

      scene.add(earthquake);
      currentEQ.push(earthquake);
      if(i % 100 == 0) {
        console.log(i);
      }
    }
  }
  //
  // var difV = ref.Elevation;
  // var maxV = 6000;
  // var vAcutal = ( difV < 0 ? -1 : 1 ) * ( Math.abs( difV ) * 100 / maxV );
  //
  // originObject.position.y = vAcutal;

  render();

  var e = new Date();
  lastRender = e;

  if(!text.playRunning) {
    console.log(d.getTime() - e.getTime());
    console.log(currentEQ.length);
    $(".loading").css("display", "none");
  }
  DOINGWORK = false;
  // console.log( binaryIndexOf( 946898715809 ) ); // 902 "2003-05-09T11:41:59.960Z" 1052480519960 1053192436220
}














/**
 * @author Bjorn Sandvik / http://thematicmapping.org/
 */

THREE.TerrainLoader = function(manager) {
  this.manager = ((manager !== undefined) ? manager : THREE.DefaultLoadingManager);
};

THREE.TerrainLoader.prototype = {

  constructor: THREE.TerrainLoader,

  load: function(url, onLoad, onProgress, onError) {
    var scope = this;
    var request = new XMLHttpRequest();

    if(onLoad !== undefined) {
      request.addEventListener('load', function(event) {
        onLoad(new Uint16Array(event.target.response));
        scope.manager.itemEnd(url);
      }, false);
    }

    if(onProgress !== undefined) {
      request.addEventListener('progress', function(event) {
        onProgress(event);
      }, false);
    }

    if(onError !== undefined) {
      request.addEventListener('error', function(event) {
        onError(event);
      }, false);
    }

    if(this.crossOrigin !== undefined) request.crossOrigin = this.crossOrigin;

    request.open('GET', url, true);

    request.responseType = 'arraybuffer';

    request.send(null);

    scope.manager.itemStart(url);
  },

  setCrossOrigin: function(value) {
    this.crossOrigin = value;
  }

};










/**
 ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄  ▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░▌░▌     ▐░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌▐░▌          ▐░▌▐░▌    ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌       ▐░▌
▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░▌ ▐░▌   ▐░▌▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌
▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
▐░█▀▀▀▀█░█▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ▐░▌   ▐░▌ ▐░▌▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀█░█▀▀
▐░▌     ▐░▌  ▐░▌          ▐░▌    ▐░▌▐░▌▐░▌       ▐░▌▐░▌          ▐░▌     ▐░▌
▐░▌      ▐░▌ ▐░█▄▄▄▄▄▄▄▄▄ ▐░▌     ▐░▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░▌      ▐░▌
▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌      ▐░░▌▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌▐░▌       ▐░▌
 ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀        ▀▀  ▀▀▀▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀
                                                                               */



/**
 * Window resize event
 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * the animate function
 */
function animate() {
  requestAnimationFrame(animate, renderer.domElement);


  render();
  stats.update();
}

/**
 * This will create a loop that causes the renderer to draw the scene 60 times per second
 */
function render() {
  globalDate = new Date();
  timeSet = globalDate.getTime();

  if(!DOINGWORK && text.playRunning && lastRender != 0 && Math.abs(lastRender.getTime() - timeSet) > 100) {
    // console.log("dt" + deltaTime + " ts" + timeSet + " dt*t" + (deltaTime * text.msPerSecond) + " lr" + lastRender.getTime() + " -" +
    // Math.abs(lastRender.getTime() - timeSet));
    deltaTime = (timeSet - oldTimeSet) / 1000;
    oldTimeSet = timeSet;
    text.time += deltaTime * text.msPerSecond;
    deltaTempDate = new Date(text.time);
    text.timeTextCurrent = deltaTempDate.toString();
    handleEQ(text, text.time);
  }

  renderer.render(scene, camera);
}
