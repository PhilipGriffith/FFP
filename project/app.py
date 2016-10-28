from flask import Flask
from flask import render_template
from functools import wraps
from pymongo import MongoClient
import json

app = Flask(__name__)

# Set variables for accessing MongoDB
DB_NAME = 'ffp'
SCORES_NAME = 'scores'
connection = MongoClient()
scores_collection = connection[DB_NAME][SCORES_NAME]


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')


# This function takes a database query as a URL and returns the document as a json object
def get_document(query):
    @wraps(query)
    def wrap(values):
        # First convert any 0s in the URL to '/'
        values = [value.replace('0', '/') for value in values.split('&')]
        scores_query = {'wbid': values[0], 'ag': values[1], 'bio': values[2]}
        scores_fields = {'cr': True, 'scores': True, '_id': False}
        scores_doc = scores_collection.find_one(scores_query, scores_fields)
        return json.dumps(scores_doc)
    return wrap


# Rather then render an html document, call the get_document function above
@app.route('/query=<values>')
@get_document
def get_scores(values):
    return values

if __name__ == '__main__':
    app.run(debug=True)
