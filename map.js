const mapnik = require('mapnik');
const path = require('path');
const fs = require("fs");
mapnik.register_datasource(path.join(mapnik.settings.paths.input_plugins,'shape.input'));
const ds = new mapnik.Datasource({type:'shape',file:'resources/alaska_water.shp'});
const featureset = ds.featureset()
const geojson = {
  "type": "FeatureCollection",
  "features": [
  ]
}
const feat = featureset.next();
while (feat) {
    geojson.features.push(JSON.parse(feat.toJSON()));
    feat = featureset.next();
}
fs.writeFileSync("output.geojson",JSON.stringify(geojson,null,2));
