//MongoDB URL
var mongodb = "http://localhost:5000/query="
var csv_data = "../static/data/ffp.csv"
var geojson_data = "../static/geojson/florida.json"

var cr = "0.0000";
document.getElementById("cr-number").innerHTML = cr;

var crGauge = Gauge('#cr-gauge', {
    size: 300,
    clipWidth: 300,
    clipHeight: 175,
    ringWidth: 60,
    maxValue: 0.2,
    transitionMs: 2000,
});
crGauge.render();

//Map width and height
var margin = {top: 20, right: 40, bottom: 20, left: 40};
var map_width = 700;
var map_height = 580 - margin.top - margin.bottom;

//Define map projection
var projection = d3.geo.albers()
                        .scale(4000)
                        .rotate([83.5, -.6, 0])
                        .center([0, 27])
                        .translate([map_width/2, map_height/2]);

//Define path generator
var path = d3.geo.path()
                 .projection(projection);

//Create map element
var map = d3.select("body")
            .append("svg")
            .attr("id", "map")
            .attr("width", width)
            .attr("height", height);

//Create bar chart element


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
            .attr("r", 2)
            .on("click", function(d) {
                    if (event.ctrlKey) {
                        d3.select(this).remove();
                    } else {
                        window.open(d.URL);
                    }
            });
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

function updateScores() {

    //Get variables from Slider Controls
    var wbid = convertValue(document.getElementById("wbidRange").value);
    var ag = convertValue(document.getElementById("agRange").value);
    var bio = convertValue(document.getElementById("bioRange").value);

    //Set query URL
    url = mongodb + wbid + "&" + ag + "&" + bio;

    //console.log(url);

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
            map.selectAll("circle")
                .data(csv)
                .transition()
                .attr("r", function(d) {
                    return Math.sqrt(d.SCORE);
                });
        });

    //Update the gauge with the new cr value
    updateGauge(cr);
    });
}
