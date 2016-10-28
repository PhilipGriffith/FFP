import json
from pymongo import MongoClient

# Read in json data
with open('ffp_geo.json') as json_data:
    data = json.load(json_data)

client = MongoClient()
db = client.ffp
print db.geojson.count()

for i in data['features']:
    prop = i['properties']
    del prop['Shape_Length']
    del prop['Shape_Area']
    del prop['OBJECTID']
    db.geojson.insert(i)

print db.geojson.count()