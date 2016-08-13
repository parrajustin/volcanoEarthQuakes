/* eslint no-unused-vars: ["warn"] guard-for-in: "off" */
/* global THREE window document requestAnimationFrame Stats dat $ Math XMLHttpRequest d3*/

var sceneCss;
var renderCss;
var planeMesh;

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
  Latitude      : 60.4849066,
  Longitude     : -152.7451997,
  Elevation     : 2.7,
  startDate     : 2009,
  endDate       : 2010,
  startMonth    : 1,
  endMonth      : 1,
  startDay      : 1,
  endDay        : 1,
  startHour     : 0,
  endHour       : 0,
  startMin      : 0,
  endMin        : 0,
  startSec      : 0,
  endSec        : 0,
  play          : 0,
  radiusDegrees : 0.5,
  VolcanoName   : "60.4849066,-152.7451997,2.7",
  // htmlGET: function(val) {
  //   if(val === 0)
  //     return this.startDate.toString() + "%2D" + this.startMonth.toString() + "%2D" + this.startDay.toString() + "T" + this.startHour.toString() +
  //       "%3A" + this.startMin.toString() + "%3A" + this.startSec.toString();
  //   return this.endDate.toString() + "%2D" + this.endMonth.toString() + "%2D" + this.endDay.toString() + "T" + this.endHour.toString() + "%3A" +
  //     this.endMin.toString() + "%3A" + this.endSec.toString();
  // },
  pad           : function(val) {
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

    $.ajax({
      url         : '/api/map',
      dataType    : 'json',
      contentType : 'application/json',
      type        : 'POST',
      data        : JSON.stringify({
        minLat  : text.Latitude - text.radiusDegrees,
        maxLat  : text.Latitude + text.radiusDegrees,
        minLong : text.Longitude - text.radiusDegrees,
        maxLong : text.Longitude + text.radiusDegrees
      }),
      success: function(data) {
        var d = data.success;

        $.ajax({
          url     : '/2009T.csv',
          type    : 'GET',
          async   : false,
          success : function(data) {
            query = $.csv.toObjects(data);
            // TODO get rid of this console.log
            // console.log(query);
            // return;

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



  peRef             : null, // reference to button for enabled
  playEnabled       : false,
  playEnabledHidden : false,
  psRef             : null, // reference to slider
  playStart         : 0,
  playEnd           : 0,
  playLife          : 604800000,
  time              : 0,
  timeText          : "YYYY-MM-DDTHH:MM:SSSZ",
  timeTextCurrent   : "YYYY-MM-DDTHH:MM:SSSZ",
  step              : function() {
    if(!this.playEnabledHidden)
      return;

    lastIndex = query.length;
    cleanGeo();
    handleEQ(this, this.time);
  },
  msPerSecond : 151200000,
  playButton  : function() {
    if(!this.playEnabledHidden)
      return;

    handleEQ(this, this.time);
    oldTimeSet = lastRender.getTime();
    timeSet = lastRender.getTime();
    // console.log(lastRender.getTime());
    this.playRunning = true;
  },
  playRunning : false,
  stopButton  : function() {
    this.playRunning = false;
  },
  renderAll: function() {
    handleEQ(text, undefined, 1);
  }
};










$.ajax({
  url     : url,
  cache   : true,
  type    : 'GET',
  async   : false,
  success : function(data) {
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
  // renderer = new THREE.render();
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
    color : 0xffffff,
    map   : THREE.ImageUtils.loadTexture('./arrow.png')
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



  var matP = new THREE.MeshBasicMaterial({
    wireframe : true,
    color     : 0x000000
  });
  var geomP = new THREE.PlaneGeometry(222, 211, 5, 5);
  planeMesh = new THREE.Mesh(geomP, matP);
  planeMesh.position.y = 0;
  planeMesh.rotation.x = -Math.PI / 2;
  // planeMesh.rotation.z = Math.PI / 2;
  scene.add(planeMesh);

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
  dataFolder.add(text, "radiusDegrees").min(0.01).max(5).step(0.001);

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
    // if(query.length % 1000 == 0)
    //   console.log(query.length);
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
    runD3();
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
        geometry.vertices[i].z = data[i] / max * 15;

        if(geometry.vertices[i].z > maxRender)
          maxRender = geometry.vertices[i].z;
        if(geometry.vertices[i].z < minRender)
          minRender = geometry.vertices[i].z;
      }

      // console.log("m:" + max + " min:" + min + " mr:" + maxRender + " minR: " + minRender);
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

  // if(!text.playRunning)
  // console.log("ending terrain");

  if(time !== undefined) {
    // ==== CHECK OLD EQS ==== //
    // if(!text.playRunning)
    // console.log("= inside time check =" + time);
    if(currentEQ.length !== 0) {
      // if(!text.playRunning)
      // console.log("= inside current check =" + currentEQ.length + " " + lastIndex + " " + query.length);
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
          color       : 0xff0000,
          opacity     : (1.0 - (time - dTemp.getTime()) / ref.playLife),
          transparent : true,
          alphaTest   : 0
        });
        currentEQ[z].material = matTemp;
      }
    }
    // ==== CHECK OLD EQS ==== //
    // if(!text.playRunning)
    // console.log("= out time check =" + time);

    // ==== CREATE NEW EQS ==== //
    var startIndex = binaryIndexOf(time);
    if(startIndex > lastIndex) {
      lastIndex = query.length;
      cleanGeo();
    }

    if(!(currentEQ.length > 0)) {
      // if(!text.playRunning)
      // console.log("ran");
      var tempDate;
      for(var z = lastIndex - 1; z > startIndex; z--) {
        tempDate = new Date(query[z].time);
        if(Math.abs(time - tempDate.getTime()) < ref.playLife)
          break;
      }
      // if(!text.playRunning)
      // console.log("z: " + z);
      if(z < lastIndex)
        lastIndex = z + 1;
      else
        lastIndex = query.length;
    }

    if(!text.playRunning)
    // console.log("= check li:" + lastIndex + " si:" + startIndex + " =");

      var arrayTemp = [];
    // var shape = new THREE.SphereGeometry( .5, 50, 50 );
    var shape = new THREE.SphereGeometry(.5, 50, 50);
    var y;
    // if(!text.playRunning) {
    //   console.log();
    //   console.log();
    //   console.log();
    //   console.log("start");
    // }
    for(y = startIndex; y < lastIndex; y++) {
      // var shape = new THREE.SphereGeometry( query[y].mag / 10, 50, 50 );
      var tempDate;
      try{
        tempDate = new Date(query[y].time);
      } catch(err) {
        console.log(y + " " + query[y]);
        return;
      }
      // if( Math.abs( time - tempDate.getTime() ) > ref.playLife )
      //   break;

      var shapeTemp = new THREE.LineBasicMaterial({
        color       : 0xff0000,
        opacity     : (1.0 - (time - tempDate.getTime()) / ref.playLife),
        transparent : true,
        alphaTest   : 0
      });
      var shapeMesh = new THREE.Mesh(shape, shapeTemp);

      var lat = text.Latitude;
      var latDif = lat - query[y].latitude;
      var latMax = text.radiusDegrees;
      var latPos = (latDif / latMax) * 105;

      var long = text.Longitude;
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
      // if(y % 10 == 0 && !text.playRunning) {
      //   console.log(y);
      // }
    }
    // if(!text.playRunning) {
    //   console.log("Done");
    //   console.log();
    //   console.log();
    //   console.log();
    //   console.log();
    // }

    lastIndex = startIndex;

    currentEQ = currentEQ.concat(arrayTemp);
    // while( arrayTemp.length > 0 )
    //   currentEQ.push( arrayTemp.shift() );
  } else if(check !== undefined) {
    // console.log("ran");
    cleanGeo();
    // console.log("===== " + ref.Latitude + " " + ref.Longitude + " =====");
    var geometry = new THREE.SphereGeometry(1, 50, 50);
    for(var i = (query.length - 1); i >= 0; i--) {
      var mat = new THREE.LineBasicMaterial({
        color       : Math.random() * 0xffffff,
        opacity     : 1.0,
        transparent : false,
        alphaTest   : 0
      });
      var earthquake = new THREE.Mesh(geometry, mat);

      // TODO Compress these math equation
      var lat = ref.Latitude;
      var latDif = lat - query[i].latitude;
      var latMax = text.radiusDegrees;
      var latPos = (latDif / latMax) * 105;

      var long = ref.Longitude;
      var longDif = long - query[i].longitude;
      var longMax = text.radiusDegrees;
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
      // if(i % 100 == 0) {
      //   console.log(i);
      // }
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
    // console.log(d.getTime() - e.getTime());
    // console.log(currentEQ.length);
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










/*
▄▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄
▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌
▐░█▀▀▀▀▀▀▀█░▌ ▀▀▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌          ▐░▌
▐░▌       ▐░▌ ▄▄▄▄▄▄▄▄▄█░▌
▐░▌       ▐░▌▐░░░░░░░░░░░▌
▐░▌       ▐░▌ ▀▀▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌          ▐░▌
▐░█▄▄▄▄▄▄▄█░▌ ▄▄▄▄▄▄▄▄▄█░▌
▐░░░░░░░░░░▌ ▐░░░░░░░░░░░▌
▀▀▀▀▀▀▀▀▀▀   ▀▀▀▀▀▀▀▀▀▀▀

 */
function runD3() {
  sceneCss = new THREE.Scene();

  var margin = {
      top    : 20,
      right  : 40,
      bottom : 30,
      left   : 40
    },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    minLat = text.Latitude - text.radiusDegrees,
    maxLat = text.Latitude + text.radiusDegrees,
    minLong = text.Longitude - text.radiusDegrees,
    maxLong = text.Longitude + text.radiusDegrees;

  var f = d3.format(".3f");
  var latHolder = {};
  var longHolder = {};
  var comb = {};
  for(var i = 0; i < query.length; i++) {
    if(latHolder[f(query[i].latitude)] == undefined) {
      latHolder[f(query[i].latitude)] = {};
      latHolder[f(query[i].latitude)].point = f(query[i].latitude);
      latHolder[f(query[i].latitude)].count = 1;
    } else
      latHolder[f(query[i].latitude)].count += 1;

    if(longHolder[f(query[i].longitude)] == undefined) {
      longHolder[f(query[i].longitude)] = {};
      longHolder[f(query[i].longitude)].point = f(query[i].longitude);
      longHolder[f(query[i].longitude)].count = 1;
    } else
      longHolder[f(query[i].longitude)].count += 1;

    if(comb[f(query[i].longitude) + " " + f(query[i].latitude)] == undefined) {
      comb[f(query[i].longitude) + " " + f(query[i].latitude)] = {};
      comb[f(query[i].longitude) + " " + f(query[i].latitude)].lat = f(query[i].latitude);
      comb[f(query[i].longitude) + " " + f(query[i].latitude)].long = f(query[i].longitude);
    }
  }
  var data = _.valuesIn(latHolder);
  var data2 = _.valuesIn(longHolder);
  var data3 = _.valuesIn(comb);










  // LAT
  // LAT
  // LAT
  // LAT
  // LAT
  // LAT
  // LAT
  // setup x
  var xValue = function(d) {
      return d.point;
    }, // data -> value
    xScale = d3.scale.linear().range([0, width]),
    xMap = function(d) {
      return xScale(xValue(d));
    }, // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  // setup y
  var yValue = function(d) {
      return d.count;
    }, // data -> value
    yScale = d3.scale.linear().range([height, 0]),
    yMap = function(d) {
      return yScale(yValue(d));
    }, // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

  // add the graph canvas to the body of the webpage
  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "latGraph")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  xScale.domain([minLat, maxLat]);
  yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

  // x-axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("latitude");

  // y-axis
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("# of Earthquakes");

  // draw dots
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", xMap)
    .attr("cy", yMap);







  // LONG
  // LONG
  // LONG
  // LONG
  // LONG
  // LONG
  // LONG
  // LONG
  var xValue2 = function(d) {
      return d.point;
    }, // data -> value
    xScale2 = d3.scale.linear().range([0, width]), // value -> display
    xMap2 = function(d) {
      return xScale2(xValue2(d));
    }, // data -> display
    xAxis2 = d3.svg.axis().scale(xScale2).orient("bottom");

  // setup y
  var yValue2 = function(d) {
      return d.count;
    }, // data -> value
    yScale2 = d3.scale.linear().range([height, 0]), // value -> display
    yMap2 = function(d) {
      return yScale2(yValue2(d));
    }, // data -> display
    yAxis2 = d3.svg.axis().scale(yScale2).orient("left");

  // add the graph canvas to the body of the webpage
  var svg2 = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "longGraph")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  xScale2.domain([minLong, maxLong]);
  yScale2.domain([d3.min(data2, yValue2) - 1, d3.max(data2, yValue2) + 1]);

  // x-axis
  svg2.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis2)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("longitude");

  // y-axis
  svg2.append("g")
    .attr("class", "y axis")
    .call(yAxis2)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("# of Earthquakes");

  // draw dots
  svg2.selectAll(".dot")
    .data(data2)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", xMap2)
    .attr("cy", yMap2);









  console.log("plase: " + data3);
  var xValue3 = function(d) {
      return d.long;
    }, // data -> value
    xScale3 = d3.scale.linear().range([0, width]), // value -> display
    xMap3 = function(d) {
      return xScale3(xValue3(d));
    }, // data -> display
    xAxis3 = d3.svg.axis().scale(xScale3).orient("bottom");

    // setup y
  var yValue3 = function(d) {
      return d.lat;
    }, // data -> value
    yScale3 = d3.scale.linear().range([height, 0]), // value -> display
    yMap3 = function(d) {
      return yScale3(yValue3(d));
    }, // data -> display
    yAxis3 = d3.svg.axis().scale(yScale3).orient("left");

    // add the graph canvas to the body of the webpage
  var svg3 = d3.select("body").append("svg")
      .attr("width", "1000px")
      .attr("height", "1000px")
      .attr("id", "topdown")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  xScale3.domain([minLong, maxLong]);
  yScale3.domain([minLat, maxLat]);

    // x-axis
  svg3.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis3)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("longitude");

    // y-axis
  svg3.append("g")
      .attr("class", "y axis")
      .call(yAxis3)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("latitude");

    // draw dots
  svg3.selectAll(".dot")
      .data(data3)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap3)
      .attr("cy", yMap3);










  var div = new THREE.CSS3DObject($('#latGraph')[0]);
  div.position.x = 200;
  div.scale.x = .23;
  div.scale.y = .23;
  div.rotation.x = -Math.PI / 2;
  div.rotation.z = Math.PI / 2;
  sceneCss.add(div);

  var div2 = new THREE.CSS3DObject($('#longGraph')[0]);
  div2.position.z = 200;
  div2.scale.x = .24;
  div2.scale.y = .24;
  div2.rotation.x = -Math.PI / 2;
  // div2.rotation.z = Math.PI / 2;
  sceneCss.add(div2);

  var div3 = new THREE.CSS3DObject($('#topdown')[0]);
  div3.position.z = 120;
  // div3.position.y = 200;
  div3.scale.x = .24;
  div3.scale.y = .45;
  div3.rotation.x = -Math.PI / 2;
  // div2.rotation.z = Math.PI / 2;
  sceneCss.add(div3);

  renderCss = new THREE.CSS3DRenderer();
  renderCss.setSize(window.innerWidth, window.innerHeight);
  renderCss.domElement.style.position = 'absolute';
  renderCss.domElement.style.top = 0;
  renderCss.domElement.style["pointer-events"] = "none";
  document.body.appendChild(renderCss.domElement);

  console.log(query);

  console.log("<lat: " + minLat + ", >lat: " + maxLat + " (" + text.Latitude + ", " + text.Longitude + ") ");
}










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
  if(renderCss != undefined)
    renderCss.render(sceneCss, camera);
}
