//Set URLs
var mongodb = "http://localhost:5000/query="
var csv_data = "../static/data/ffp.csv"
var geojson_data = "../static/geojson/florida.json"

//Create cr number
var cr = "0.0000";
document.getElementById("cr-number").innerHTML = cr;

//Create cr gauge
var crGauge = Gauge('#cr-gauge', {
    size: 300,
    clipWidth: 300,
    clipHeight: 175,
    ringWidth: 60,
    maxValue: 0.2,
    transitionMs: 2000,
});
crGauge.render();

//Define margins
var margin = {top: 20, right: 40, bottom: 20, left: 40};

//Define map widths and heights
var map_width = 700;
var map_height = 580 - margin.top - margin.bottom;

//Define map projection
var projection = d3.geo.albers()
   .scale(4000)
   .rotate([83.5, -.6, 0])
   .center([0, 27])
   .translate([map_width/2, map_height/2]);

//Define map path generator
var path = d3.geo.path()
     .projection(projection);

//Create map element
var map = d3.select("body")
    .append("svg")
    .attr("id", "map")
    .attr("width", map_width + margin.right + margin.left)
    .attr("height", map_height + margin.top + margin.bottom);

//Load in GeoJSON data
d3.json(geojson_data, function(json) {

    //Bind data and create one path per GeoJSON feature
    map.selectAll("path")
       .data(json.features)
       .enter()
       .append("path")
       .attr("d", path);

    // Load FFP data
    d3.csv(csv_data, function(csv) {

        //Create map
        map.selectAll("circle")
            .data(csv)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return projection([d.LON, d.LAT])[0];
            })
            .attr("cy", function(d) {
                return projection([d.LON, d.LAT])[1];
            })
            .attr("r", 2);

        //Get 10 highest scores for table
        csv.sort(byScore);
        var top10 = csv.slice(0, 10);

        //Create table
        var tr = d3.select("tbody")
            .selectAll("tr")
            .data(top10)
            .enter()
            .append("tr");

        tr.append("td")
            .text(function(d) { return d.NAME; });

        tr.append('td')
            .text(function(d) { return d.SCORE; });
    });
});

//Convert a slider value to the corresponding query value
function convertValue(value) {

    x = parseInt(value) + 1;
    if (x < 1) {
        x -= 2;
        return "10" + Math.abs(x);
    } else {
        return x.toString();
    }
}

//Sort the csv data by decreasing score
function byScore(a, b) {

    if (a.SCORE < b.SCORE)
        return 1;
    if (a.SCORE > b.SCORE)
        return -1;
    return 0;
}

function updateScores() {

    //Get variables from Slider Controls
    var wbid = convertValue(document.getElementById("wbidRange").value);
    var ag = convertValue(document.getElementById("agRange").value);
    var bio = convertValue(document.getElementById("bioRange").value);

    //Set query URL
    url = mongodb + wbid + "&" + ag + "&" + bio;

    //Load data from MongoDB
    d3.json(url, function(json) {

        //Load cr value
        cr = json.cr;

        //Load FFP data
        d3.csv(csv_data, function(csv) {

            //Loop through once for each score in the json data
            for (var i = 0; i < json.scores.length; i++) {

                var json_id = json.scores[i].site_id;
                var score = json.scores[i].score;

                //Find the corresponding site in the csv data
                for (var j = 0; j < csv.length; j++) {

                    var csv_id = csv[j].SITE_ID;

                    if (json_id == csv_id) {
                        csv[j].SCORE = score * 1000;
                        break;
                    }
                }
            }

            //Update the map
            map.selectAll("circle")
                .data(csv)
                .transition()
                .attr("r", function(d) {
                    return Math.sqrt(d.SCORE);
                });

            //Get 10 highest scores for table
            csv.sort(byScore);
            var top10 = csv.slice(0, 10);

            //Update the table
            var old_tbody = document.getElementById('table');
            var new_tbody = document.createElement('tbody');
            var tr = d3.select(new_tbody)
            .attr('id', 'table')
            .selectAll("tr")
            .data(top10)
            .enter()
            .append("tr");

            //Update name cells
            tr.append("td")
                .on('click', function(d) {
                    window.open(d.URL);
                })
                .on('hover', function(d) {

                })
                .text(function(d) { return d.NAME; });

            //Update score cells
            tr.append('td')
                .text(function(d) { return Math.round(d.SCORE); });

            //Replace the old table with the new one
            old_tbody.parentNode.replaceChild(new_tbody, old_tbody);

        });

        //Update the gauge with the new cr value
        updateGauge(cr);

    });
}