// var map = require( 'mapnik' );
// map = mapnik.Map(3134, 3134)
// mapnik.load_map(map, 'jotunheimen_terrain3.xml')
// bbox = mapnik.Box2d(mapnik.Coord(432000, 6790000), mapnik.Coord(492000, 6850000))
// map.zoom_to_box(bbox)
// mapnik.render_to_file(map, 'jotunheimen_terrain3.png')

var mapnik = require( "mapnik" );
var fs = require( "fs" );
// register fonts and datasource plugins
mapnik.register_default_fonts();
mapnik.register_default_input_plugins();
var map = new mapnik.Map( 3134, 3134 );
map.load( "/run/media/jparra/linuxExtra/TIF/out/AWZSDwkugldx.xml", function( err,map ) {
    if( err ) throw err;
    map.zoomAll();
    var im = new mapnik.Image( 3134, 3134 );
    map.render( im, function( err,im ) {
        if( err ) throw err;
        im.encode( "png", function( err,buffer ) {
            if( err ) throw err;
            fs.writeFile( "map.png",buffer, function( err ) {
                if( err ) throw err;
                console.log( "saved map image to map.png" );
            } );
         } );
    } );
} );
