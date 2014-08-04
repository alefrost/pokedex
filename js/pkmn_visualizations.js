function displayEvoTree(renderID, evoTree) {
  // calculate height and width using evoTree.depth and evoTree.breadth

  var width = $('#'+renderID).width()/2,
      height;

  if (evoTree.breadth < evoTree.depth) {
    //longer
    height = 125 * evoTree.breadth;
  } else {
    //wider
    height = 180 * evoTree.depth;
  }

  function getX(d) {
    if (evoTree.breadth < evoTree.depth) {
      //longer
      return d.y*1.75;
    } else {
      //wider
      return d.x*1.55;
    }
  }
  function getY(d) {
    if (evoTree.breadth < evoTree.depth) {
      //longer
      return d.x;
    } else {
      //wider
      return d.y/ 1.5;
    }
  }

  function getTranslate() {
    if(evoTree.breadth < evoTree.depth) {
      return "translate(70 ,15)";
    } else {
      return "translate(10,70)";
    }
  }

  if (evoTree.breadth < evoTree.depth) {
    var tree = d3.layout.tree()
        .size([height-20, width-25]);
  } else {
    var tree = d3.layout.tree()
        .size([height+80, width]); 
  }

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [getX(d), getY(d)]; });

  var svg = d3.select("#"+renderID).append("svg")
      .attr("width", "100%")
      .attr("height", height)
    .append("g")
      .attr("transform", getTranslate());

  //d3.json("/d/4063550/flare.json", function(error, json) {
    var nodes = tree.nodes(evoTree.tree),
        links = tree.links(nodes);

    var link = svg.selectAll("path.link")
        .data(links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = svg.selectAll("g.node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + getX(d) + "," + getY(d) + ")"; })

//    node.append("circle")
  //      .attr("r", 25);

    node.append("image")
        .attr("xlink:href", function(d) { return d.local_image_uri; })
        .attr("x", -65)
        .attr("y", -60)
        .attr("width", 120)
        .attr("height", 120);
/*
    node.append("text")
      .attr("dx", function(d) { return d.children ? 0 : 0; })
          .attr("dy", 65)
      .attr("text-anchor", function(d) { return "middle";})//d.children ? "end" : "start"; })
          .text(function(d) { return d.name; });
*/
  //});

  d3.select(self.frameElement).style("height", height + "px");
}