(function(d3) {

  window.parallel = function(model, colors, columns) {
    var self = {},
	dimensions,
	container = d3.select("#parallel"),
	dragging = {},
	highlighted = null;

    var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;
 
    var cars = model.get('data');

    self.update = function(data) {
	cars = data;
    };

    self.render = function() {

        container.select("svg").remove();

	var bounds = [ $(container[0]).width(), $(container[0]).height() ],
          m = [30, 10, 10, 10],
          w = bounds[0] - m[1] - m[3],
          h = bounds[1] - m[0] - m[2];
    	
	var x = d3.scale.ordinal().rangePoints([0, w], 1),
            y = {};
 
        var svg = container.append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

    x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {       

var quant_p = function(v){return (parseFloat(v) == v) || (v == "")};

var vals = cars.map(function(p) { return p[d]; }); // WTF?

if (!vals.every(quant_p)/*des trucs sont pas des nombres, en utilisant quant_p*/) {
  //faire un scale.ordinal
  y[d] = d3.scale.ordinal()
          .domain(vals.filter(function(v, i) {return vals.indexOf(v) == i;}))
          .rangePoints([0, h], 1);
}
else {
  y[d] = d3.scale.linear()
          .domain(d3.extent(cars, function(p) { return +p[d]; }))
          .range([h, 0]);
}

return _.include(columns, d) && y[d];

    }));
    
    // Add grey background lines for context.
    background = svg.append("svg:g")
        .attr("class", "background")
        .selectAll("path")
        .data(cars)
        .enter().append("svg:path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("svg:g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(cars)
        .enter().append("svg:path")
        .attr("d", path)
	.attr("style", function(d) {
            return "stroke:" + colors[d.cost] + ";";
        });
    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("svg:g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
          .on("dragstart", function(d) {
            dragging[d] = this.__origin__ = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("dragend", function(d) {
            delete this.__origin__;
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground)
                .attr("d", path);
            background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("svg:g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("svg:text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    g.append("svg:g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);


      var activesArray = new Array();

   
function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
  }

    function brush() {
      var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
          extents = actives.map(function(p) { return y[p].brush.extent(); });
      // To be factored
      var filter = {};
      _(actives).each(function(key, i) {
        filter[key] = {
          min: extents[i][0],
          max: extents[i][1]
        }
      });
      model.set({filter: filter});
      
      foreground.style("display", function(d) {
        return actives.every(function(p, i) {
          return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
      });
    }

   self.highlight = function(i) {
        if (typeof i == "undefined") {
          d3.select("#parallel .foreground").style("opacity", function(d, j) {
            return "1";
          });
          highlighted.remove();
        } else {
          d3.select("#parallel .foreground").style("opacity", function(d, j) {
            return "0.35";
          });
          if (highlighted != null) {
            highlighted.remove();
          }
          highlighted = svg.append("svg:g")
                           .attr("class", "highlight")
                         .selectAll("path")
                           .data([model.get('filtered')[i]])
                         .enter().append("svg:path")
                           .attr("d", path)
                           .attr("style", function(d) {
                             return "stroke:" + colors[d.cost] + ";";
                           });
        }
      };
    }
   return self;
  };

})(d3);
