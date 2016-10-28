import json
from pymongo import MongoClient

client = MongoClient()
scores_collection = client.ffp.scores
geojson_collection = client.ffp.geojson

score = scores_collection.find_one({'wbid': '1', 'ag': '1', 'bio': '1'}, {'_id': False})

print score




