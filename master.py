
from __future__ import print_function
# TYkdd7fw3uDDuHL5 password
import subprocess
import sys

# import glob
# stringOfFiles = ''
# for i, val in enumerate(glob.glob("*_dem.tif")):
#     stringOfFiles += ' ' + val

# print ( stringOfFiles )
# val = 'gdalbuildvrt master.vrt' + stringOfFiles
# val = 'gdalwarp master.vrt masterAlaska.tif'
# val = 'gdalwarp -te -153.7451997 59.4849066 -151.7451997 61.4849066 master.vrt masterAlaska.tif' # -te x_min y_min x_max y_max  popo 19.023296,
# -98.628135
# val = 'gdalinfo -mm masterAlaska.tif' #checks the file info
# val = 'gdal_translate -scale 0 2470 0 65535 -ot UInt16 -of PNG masterAlaska.tif final.png'
# val = 'gdal_translate -scale 0 2470 0 65535 -ot UInt16 -outsize 400 400 -of ENVI masterAlaska.tif final.bin'
# val = 'gdaldem color-relief masterAlaska.tif color_relief.txt clippedRelief.tif'
# val = 'gdaldem hillshade -combined masterAlaska.tif clippedHillShade.tif'
# val = 'gdaldem slope -combined masterAlaska.tif clippedSlopeShade.tif'
# valBroken = val.split(' ')
# #
# subprocess.call(valBroken)
#
def runBuild():
    val = 'gdalbuildvrt ' + str(sys.argv[2]) + str(sys.argv[1])
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    runWarp()
#
def runWarp():
    val = 'gdalwarp -te ' + str(sys.argv[4]) + ' ' + str(sys.argv[2]) + ' ' + str(sys.argv[3])
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    runTranslate()
#
def runTranslate():
    val = 'gdal_translate -scale 0 2470 0 65535 -ot UInt16 -outsize 400 400 -of ENVI ' + str(sys.argv[3]) + ' public/' + str(sys.argv[5]) + '.store.bin'
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    runPretty()

def runPretty():
    val = 'gdaldem color-relief '+ str(sys.argv[3]) +' color_relief.txt ' + str(sys.argv[3]) + '.CR'
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    val = 'gdaldem hillshade -combined '+ str(sys.argv[3]) +' ' + str(sys.argv[3]) + '.HS'
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    val = 'gdaldem slope '+ str(sys.argv[3]) +' ' + str(sys.argv[3]) + '.S'
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    val = 'gdaldem color-relief '+ str(sys.argv[3]) + '.S color_slope.txt ' + str(sys.argv[3]) + '.CRS'
    valBroken = val.split(' ')
    subprocess.call(valBroken)
    makeXML()

def makeXML():
    f = open(str(sys.argv[6]) + 'out/' + str(sys.argv[5]) + '.xml','w')
    f.write('<Map srs="+proj=utm +ellps=WGS84 +datum=WGS84 +units=m +no_defs">\n')
    f.write('  <Style name="color relief style">\n')
    f.write('    <Rule>\n')
    f.write('      <RasterSymbolizer mode="normal" />\n')
    f.write('    </Rule>\n')
    f.write('  </Style>\n')
    f.write('  <Style name="hillshade style">\n')
    f.write('    <Rule>\n')
    f.write('      <RasterSymbolizer opacity="0.3" mode="multiply" scaling="bilinear" />\n')
    f.write('    </Rule>\n')
    f.write('  </Style>\n')
    f.write('  <Style name="slopeshade style">\n')
    f.write('    <Rule>\n')
    f.write('      <RasterSymbolizer opacity="0.1" mode="multiply" scaling="bilinear" />\n')
    f.write('    </Rule>\n')
    f.write('  </Style>\n')
    f.write('  <Style name="lake style">\n')
    f.write('    <Rule>\n')
    f.write('       <PolygonSymbolizer fill="rgb(180,210,230)" />\n')
    f.write('    </Rule>\n')
    f.write('  </Style>\n')
    f.write('  <Layer name="color relief">\n')
    f.write('    <StyleName>color relief style</StyleName>\n')
    f.write('    <Datasource>\n')
    f.write('      <Parameter name="type">gdal</Parameter>\n')
    f.write('      <Parameter name="file">' + str(sys.argv[3]) + '.CR</Parameter>\n')
    f.write('    </Datasource>\n')
    f.write('  </Layer>\n')
    f.write('  <Layer name="hillshade">\n')
    f.write('    <StyleName>hillshade style</StyleName>\n')
    f.write('    <Datasource>\n')
    f.write('      <Parameter name="type">gdal</Parameter>\n')
    f.write('      <Parameter name="file">' + str(sys.argv[3]) + '.HS</Parameter>\n')
    f.write('    </Datasource>\n')
    f.write('  </Layer>\n')
    f.write('  <Layer name="slopeshade">\n')
    f.write('    <StyleName>hillshade style</StyleName>\n')
    f.write('    <Datasource>\n')
    f.write('      <Parameter name="type">gdal</Parameter>\n')
    f.write('      <Parameter name="file">' + str(sys.argv[3]) + '.CRS</Parameter>\n')
    f.write('    </Datasource>\n')
    f.write('  </Layer>\n')
    f.write('  <Layer name="lake">\n')
    f.write('      <StyleName>lake style</StyleName>\n')
    f.write('      <Datasource>\n')
    f.write('          <Parameter name="type">shape</Parameter>\n')
    f.write('          <Parameter name="file">/home/jparra/Documents/veq/resources/water_polygons.shp</Parameter>\n')
    f.write('      </Datasource>\n')
    f.write('  </Layer>\n')
    f.write('</Map>\n')
    f.close()

# -153.7451997 59.4849066 -151.7451997 61.4849066
#
#

runBuild()
