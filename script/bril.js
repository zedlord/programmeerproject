/*
Zelda Zeegers
11397705
*/

// global variable that change when user changes input
var painter
var graph

/*
  This function is called when dropdown menu is used.
  The user chooses a painter.
*/
function loadData() {
  painter = document.getElementById('painter').selectedOptions[0].text;
  update()
}

/*
  This function is called when buttons are used
  The user chooses an graph
*/
function changeData(input){
    graph = input
    update()
}

/*
  This function assures that the the right graph is drawn with the right painter.
  When painter has no value or is empty or graph has no value, nothing happens.
*/
function update(){
  if (graph == "Brightness" & painter != null & painter != ""){
    d3.selectAll("svg")
      .remove()
    brightplot()
  }
  else if (graph == "Color Usage" & painter != null & painter != ""){
    d3.selectAll("svg")
      .remove()
    colorplot()
  }
}

/*
  This function makes a plot of the color Usage in the paintings evaluating in the
  life of the choosen painter.
*/
function colorplot(){

  // append tooltip in area1
  var tool = d3.select("#area1")
      .append("div")
      .attr("class", "remove")
      .style("position", "absolute")
      .style("z-index", "20")
      .style("visibility", "hidden")
      .style("top", "30px")
      .style("left", "55px");


  var colorrange = ["#700000", "#006500", "#00003F"];

  strokecolor = colorrange[0];

  var margin = {top: 20, right: 50, bottom: 30, left: 50},
      width = 600 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  // make the chart
  var body = d3.select("#area1")
      .append("div")
      .attr("class", "chart")

  // append the svg
  var svg = d3.select(".chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom+20)
      .attr("id", "chart")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // variable to transform the date
  var parseDate = d3.timeParse("%Y"),
      formatValue = d3.timeFormat("%Y"),
      bisectDatum = d3.bisector(function(d) { return d.year; }).left,
      formatMaking = function(d) { return  formatValue(d); };

  // x on x-axis, y on y-axis and z is the color
  var x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      z = d3.scaleOrdinal().range(colorrange);

  var stack = d3.stack()

  // y0 is the lower boundary and y1 is the upperbaundary of the area
  var area = d3.area()
      .curve(d3.curveCatmullRom.alpha(1))
      .x(function(d) { return x(d.data.year); })
      .y0(function(d) { return y(d[0]); })
      .y1(function(d) { return y(d[1]); });

  var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // get the data from the jsonfile
  d3.json(painter+"_year_data.json", function (error, data) {
    if (error) throw error;

    // get data in the right format
    // create date.object and percentages
    for (var i = 0; i < data.length; i++) {
      data[i].year = parseDate(data[i].year);
      data[i].red = data[i].red/100;
      data[i].blue = data[i].blue/100;
      data[i].green = data[i].green/100;
    }

    // set the domains
    var keys = ['red', 'green', 'blue']
    x.domain(d3.extent(data, function(d) { return d.year; }));
    z.domain(keys);
    stack.keys(keys);

    // for each color an seperate layer.
    var layer = g.selectAll(".layer")
      .data(stack(data))
      .enter().append("g")
        .attr("class", "layer");

    // fill layer with right color
    layer.append("path")
        .attr("class", "area")
        .style("fill", function(d) {return z(d.key[0]); })
        .attr("d", area);

    // append color names to the layers
    layer.filter(function(d) { return d[d.length - 1][1] - d[d.length - 1][0] > 0.01; })
      .append("text")
        .attr("x", width - 6)
        .attr("y", function(d) { return y((d[d.length - 1][0] + d[d.length - 1][1]) / 2); })
        .attr("dy", ".35em")
        .style("font", "10px sans-serif")
        .style("text-anchor", "end")
        .text(function(d) { return d.key; });

    // make x axis
    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // make y axis
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "%"));

    // when mouseover the selected area is pointed out.
    // this happens due to the opacity change of the other areas
    svg.selectAll(".layer")
      .attr("opacity", 1)
      .on("mouseover", function(d, i) {
        svg.selectAll(".layer").transition()
          .duration(250)
          .attr("opacity", function(d, j) {
            return j != i ? 0.4 : 1; }) })
      .on("mouseout", function(d, i) {
        svg.selectAll(".layer")
          .transition()
          .duration(250)
          .attr("opacity", "1");
        d3.select(this)
          .classed("hover", false)});


    // mousemove show vertical line
    d3.select(".chart")
        .on("mousemove", function(){
            // get the data at the x and y coordinate of the mouse
           var mouse = d3.mouse(this);
           console.log(bisectDatum(data, x.invert(mouse[0], 1)))
           var x0 = x.invert(mouse[0]),
               i = bisectDatum(data, x0, 1) - 2,
               d0 = data[i - 1],
               d1 = data[i],
               d = x0 - d0.year > d1.year - x0 ? d1 : d0
          maketips(0, mouse[0],mouse[1],formatMaking(d.year))})


        .on("click",function(){
          // get the data at the x and y coordinate of the mouse
          var mouse = d3.mouse(this)
          var x0 = x.invert(mouse[0]),
              i = bisectDatum(data, x0, 1) - 2,
              d0 = data[i - 1],
              d1 = data[i],
              d = x0 - d0.year > d1.year - x0 ? d1 : d0
          maketips(1, mouse[0],mouse[1],formatMaking(d.year))})
  })
}

/*
  This function makes a plot of the brightness of the paintings evaluating in the
  life of the choosen painter.
*/
function brightplot(){

  var margin = {top: 20, right: 50, bottom: 30, left: 50},
      width = 600 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  // make an object from the datum
  var parseDatum = d3.timeParse("%Y"),
      bisectDatum = d3.bisector(function(d) { return d.year; }).left,
      formatValue = d3.timeFormat("%Y"),
      formatMaking = function(d) { return  formatValue(d); };

  // make the x and y axis
  var x = d3.scaleTime()
      .range([0, width]);
  var y = d3.scaleLinear()
      .range([height, 0]);
  var xAxis = d3.axisBottom()
      .scale(x)
  var yAxis = d3.axisLeft()
      .scale(y)

  // make the line
  var line = d3.line()
      .curve(d3.curveCatmullRom.alpha(0.5))
      .x(function(d) { return x(d.year); })
      .y(function(d) { return y(d.total); });

  // append the svg in html
  var svg = d3.select("#area1").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // read the data from jsonfile
  d3.json(painter+"_year_data.json", function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
      d.year = parseDatum(d.year);
      d.total = +d.total/10;
    })

  // set the domains noticing the min and max of all the data
    x.domain([data[0].year, data[data.length-1].year]);
    y.domain(d3.extent(data, function(d) { return d.total; }));

  // append xaxis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

  // append y-axis and transform horizontally
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Helderheid");

  // append all the diverend paths
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)

  // make focuspoints for the interactive properties
    var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

  // append text and circles that are shown when hover
    focus.append("circle")
        .attr("r", 4.5);

    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

  // append mouseover interactive properties
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", function(){
          console.log(bisectDatum(data, x.invert(d3.mouse(this)[0]), 1))
          var x0 = x.invert(d3.mouse(this)[0]),
              i = bisectDatum(data, x0, 1),
              d0 = data[i - 1],
              d1 = data[i],
              d = x0 - d0.year > d1.year - x0 ? d1 : d0

          svg.select("rect")
              .on("click",function() {
                  //Get this bar's x/y values, then augment for the tooltip
                  var xPosition = parseFloat(d3.mouse(this)[0]);
                  var yPosition = height+100;
                  maketips(1, xPosition,yPosition,formatMaking(d.year))
            })

          // what shoud be showed when the mouse hovers
          focus.attr("transform", "translate(" + x(d.year) + "," + y(d.total) + ")");
          focus.select("text").text(formatMaking(d.year));

          var colorchange = false
          d3.tsv(painter+"_info.tsv", function(data) {
            data.forEach(function(b){
                if (b.year == formatMaking(d.year)){
                  focus.attr("fill", "#66ff66")
                  colorchange = true
                }
              })
            })
          if (colorchange == false){
              focus.attr("fill", "black")
          }
      })
    })
  }


/*
  This function shows, if there is any, information about the choosen year
  in the tooltip. It changes also the paintings that are shown in the carousel.
*/
function maketips(change, xPosition,yPosition,year) {

  // check if there is information about the selected year
  var updated = false;

  d3.tsv(painter+"_info.tsv", function(error, data) {
    if (error) throw error;

    data.forEach(function(b){
      if (b.year == year){
        // there is information so updates = true
        updated = true;
        // update the tooltip position and value
        pos = xPosition + 600
        d3.select("#tooltip")
          .style("left", pos + "px")
          .style("top", 320 + "px")
          .select("#value")
          .text(b.text)
        // show the tooltip
        d3.select("#tooltip")
          .classed("hidden",false)
        }
      })
      if (!updated) {
        // hide the tooltip
        d3.select("#tooltip")
          .classed("hidden",true)
      }
    })

    if (change == 1){
      // change the pictures in the carousel
      d3.select("#pic1")
        .attr("src", painter+"/"+year+".jpg")
        .classed("hidden",false);

      d3.select("#pic2")
        .attr("src", painter+"/"+year+" (2).jpg")
        .classed("hidden",false);

      d3.select("#pic3")
        .attr("src", painter+"/"+year+" (3).jpg")
        .classed("hidden",false);
      }
  }

/*
  This function is called when the user clicks on a painting.
  The function makes a piechart that displays the usage of red, green and blue
  of the choosen painting.
*/

function clicker(img){

  // old piechart is removed
  d3.select("#pie").remove()

  // change the string img to the right filename
  str = img.split("/")
  str = str[4].replace('%20',' ')

  // define the radius and height and width of the svg
  var width = 300,
      height = 300,
      outerRadius = (height-50)/2;

  // set the colors
  var color = d3.scaleOrdinal()
      .range(["#700000", "#006500", "#00003F"]);

  // get the data from the jsonfile
  d3.json(painter + "_images_data.json", function(error, data) {

    // search for the right filename
    data.forEach(function(d) {
      if (d.name == str){
        dataSet = d.values
      }
    })

    var keys = ["red", "green", "blue"]

    // make the chart at area2
    var taart = d3.select("#area2")
      .append("svg:svg")
      .attr("id", "pie")
      .data([dataSet])
      .attr("width", width)
      .attr("height", height)
      .append("svg:g")
      .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")") // define center of svg

    // make the inner and outherradius
    var arc = d3.arc()
      .outerRadius(outerRadius-50)
      .innerRadius(outerRadius-90);

    // make the inner and outherradius when you hover over the slices
    var arcOver = d3.arc()
      .innerRadius(outerRadius-90)
      .outerRadius(outerRadius-30);

    //create arc data for us given a list of values
    var pie = d3.pie()
      .value(function(d) { return d.ratio; })
      .sort( null  );

    // make a slice (= peace of pie)
    var arcs = taart.selectAll("g.slice")
      .data(pie)
      .enter()
      .append("svg:g")
      .attr("class", "slice");

    // append text in the middel of the chart
    arcs.append("text")
      .datum(data)
      .attr("x", 0 )
      .attr("y", 0 + outerRadius/10-8)
      .attr("class", "text-tooltip")
      .style("text-anchor", "middle")
      .attr("font-weight", "bold")
      .style("font-size", 20 +"px");

    // color the slice
    arcs.append("svg:path")
      .attr("fill", function(d, i) { return color(i); })
      .attr("d", arc)
      .on("mouseover", function(d,i){
        d3.select(this).transition()
          .duration(200)
          .attr("d", arcOver)
        arcs.select("text.text-tooltip")
          .text(Math.round(d.value*10)/10 + "%"); })
      .on("mouseout", function(d) {
        d3.select(this).transition()
          .duration(200)
          .attr("d", arc);
        arcs.select("text.text-tooltip").text(""); });

    // make text for slicies
    arcs.append("svg:text")
      .attr("transform", function(d) {
        d.outerRadius = outerRadius + 50;
        d.innerRadius = outerRadius + 45;
        return "translate(" + arc.centroid(d) + ")"; })
      .attr("text-anchor", "middle")
      .text(function(d, i) { return dataSet[i].color; });
    })
}
