import os
import sys

os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.tif')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.tif.CR')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.tif.HS')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.tif.S')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.tif.CRS')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.vrt')
os.remove(str(sys.argv[1]) + '/out/' + str(sys.argv[2]) + '.xml')
os.remove("public/" + str(sys.argv[2]) + '.store.bin.aux.xml')
os.remove("public/" + str(sys.argv[2]) + '.store.hdr')
