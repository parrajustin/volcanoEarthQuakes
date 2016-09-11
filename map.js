var mapnik = require('mapnik');
var path = require('path');
var fs = require("fs");
mapnik.register_datasource(path.join(mapnik.settings.paths.input_plugins,'shape.input'));
var ds = new mapnik.Datasource({type:'shape',file:'resources/alaska_water.shp'});
var featureset = ds.featureset()
var geojson = {
  "type": "FeatureCollection",
  "features": [
  ]
}
var feat = featureset.next();
while (feat) {
    geojson.features.push(JSON.parse(feat.toJSON()));
    feat = featureset.next();
}
fs.writeFileSync("output.geojson",JSON.stringify(geojson,null,2));
