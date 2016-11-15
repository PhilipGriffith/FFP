import csv
import itertools

from pymongo import MongoClient
import ahpy

labels = []
wbid = ''
ag = ''
bio = ''

# Read in json data
with open('ffp.csv') as csv_file:
    reader = csv.DictReader(csv_file)

    for row in reader:
        labels.append(row['SITE_ID'])
        wbid += '{};'.format(row['WBID'])
        ag += '{};'.format(row['AGRICULTURE'])
        bio += '{};'.format(row['BIODIVERSITY'])

# Remove trailing semicolon from matrices
wbid_m = wbid.rstrip(';')
ag_m = ag.rstrip(';')
bio_m = bio.rstrip(';')

# Create Compare objects
wbid = ahpy.Compare('wbid', wbid_m, labels, comp_type='quant')
ag = ahpy.Compare('ag', ag_m, labels, comp_type='quant')
bio = ahpy.Compare('bio', bio_m, labels, comp_type='quant')

# Build all possible criteria combinations
combo_list = [str(i) for i in xrange(1, 10)]
combo_list += ['1/{}'.format(i) for i in xrange(1, 10) if i > 1]
matrix_list = []
for i in itertools.product(combo_list, repeat=2):
    for j in combo_list:
        matrix_list.append('{} {}; {}'.format(i[0], i[1], j))

# Connect to MongoDB
client = MongoClient()
db = client.ffp

print db.scores.count()

# For each criteria combination, build its Compare object and Compose the hierarchy
cri_labels = ('water', 'ag', 'bio')
cri_name = 'scores'
doc_list = []
for cri_m in matrix_list:
    cri = ahpy.Compare(cri_name, cri_m, cri_labels)
    com = ahpy.Compose(cri_name, cri, (wbid, ag, bio))

    # Create the MongoDB document
    score_list = []
    for k, v in com.weights[cri_name].iteritems():
        score_list.append({'site_id': k, 'score': v})

    cri_val = cri_m.replace(';', ' ').split()
    doc = {'wbid': cri_val[0], 'ag': cri_val[1], 'bio': cri_val[2], 'cr': cri.consistency_ratio, 'scores': score_list}
    doc_list.append(doc)

db.scores.insert_many(doc_list)
print db.scores.count()
