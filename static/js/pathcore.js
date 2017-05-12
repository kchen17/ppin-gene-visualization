/*const target = "#pathcore"
const width  = 960;
const height = Math.max($(window).height() - 10, 500);
const svg = d3.select(target).append("svg")
  .attr("width", width)
  .attr("height", height);
const force = d3.layout.force()
  .charge(-180)
  .size([width, height]);
*/
const lineColor = "#6600FF";

function defaultNode(textSelect) {
  textSelect.style("font-size", "14px");
  textSelect.style("font-weight", "normal");
  textSelect.style("fill", "white");
  textSelect.style("stroke", "gray");
}

function highlightNode(textSelect) {
  textSelect.style("font-size", "18px");
  textSelect.style("font-weight", "bold");
  textSelect.style("fill", "black");
  textSelect.style("stroke", "black");
}

function highlightEdges(names) {
  const link = svg.selectAll(".link");
  link.style("stroke", function(l) {
    if (names.indexOf(l.source.name) != -1
        || names.indexOf(l.target.name) != -1)
      return "red";
    else
      return lineColor;
  });
}

function edgeWeightConversion(weight) {
  if (weight > 50) {
    return 4 + weight/10.0;
  } else if (weight > 10) {
    return 3 + weight/6.0;
  } else {
    return weight/1.5;
  }
}

function searchPathways() {
  const userInput = document.getElementById("searchbar").value.toLowerCase();
  const classes = "." + userInput.replace(new RegExp(" ", "g"), ".");
  const link = svg.selectAll(".link");
  const pathways = $(classes);
  const pathwayNodes = $(classes + " circle");
  
  // reset view
  $(".searching").each(function(index) {
    d3.select(this).style("fill", "black");
    $(this).attr("r", 6);
    $(this).removeClass("searching");
  });
  $(".search-text").each(function(index) {
    const textSelect = d3.select(this).select("text");
    defaultNode(textSelect);
  });
  link.style("stroke", lineColor);

  if (pathwayNodes.length == 0) {
    $(".err-message").show();
    return;
  } 
  $(".err-message").hide();

  pathwayNodes.each(function(index) {
    d3.select(this).style("fill", "yellow");
    $(this).attr("r", 10);
    $(this).addClass("searching");
  });
  
  let pathwayNames = [];
  pathways.each(function(index) {
    const textSelect = d3.select(this).select("text");
    highlightNode(textSelect);
    $(this).addClass("search-text");
    // the text label of the selected pathway node
    pathwayNames.push(d3.select(this)[0][0].textContent);
    // move this node to the front of the nodes collection
    this.parentNode.appendChild(this);
  });

  highlightEdges(pathwayNames); 
}

// event listener for the search bar
$("#searchbar").keypress(function(e) {
  $(".err-message").hide();
  if (e.which == 13) {
    $("button").click();
    return false;
  }
});

function loadPathCORENetwork(links, force, svg) {
  const nodesByName = {};
  
  function nodeByName(name) {
    return nodesByName[name] || (nodesByName[name] = {name: name});
  }

  // Create nodes for each unique source and target.
  links.forEach(function(link) {
    link.source = nodeByName(link.pw0);
    link.target = nodeByName(link.pw1);
    link.weight = parseInt(link.weight);
  });

  // Extract the array of nodes from the map by name.
  const nodes = d3.values(nodesByName);

  force
    .nodes(nodes)
    .links(links)
    .linkStrength(0.5)
    .start();
  
  let node; // functions/attributes associated with each node
  let link; // functions/attributes associated with each link
  
  function dragstart(d, i) {
    force.stop()
  }

  function dragmove(d, i) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    tick();
  }

  function dragend(d, i) {
    d.fixed = true;
    tick();
    force.resume();
  }
  
  const node_drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend)
  
  // Create the node circles.
  node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("g")
      .attr("class", function(d) {
        var name = d.name.toLowerCase();
        name = name.replace(/[^\w\s]|_/g, " ")
          .replace(/\s+/g, " ");
        return "node " + name;
      })
      .call(node_drag)
      .on("mouseover", function(d) {
        const target = d3.select(this);
        target.attr("r", 9).style("fill", "yellow");
        highlightNode(target.select("text"));
        this.parentNode.appendChild(this);
        link.style("stroke", function(l) {
          if (d === l.source || d === l.target)
            return "red";
          else
            return lineColor;
        });
      })
      .on("mouseout", function(d) {
        const target = d3.select(this);
        target.attr("r", 6).style("fill", "black");
        defaultNode(target.select("text"));
        link.style("stroke", lineColor);
      });
  node.append("circle").attr("r", 6);
  node.append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });

  // Create the link lines.
  link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
      .attr("class", "link")
      .attr("stroke-width", function(d) {
        return edgeWeightConversion(d.weight);
      })
      .style("stroke", function(d) {
        return lineColor;
      })
      .on("mouseover", function() {
        const target = d3.select(this);
        const targetData = target[0][0].__data__;
        const lineWeight = edgeWeightConversion(targetData.weight);
        target.style("stroke", "red");
        target.style("stroke-width", Math.max(lineWeight, 6));
        node.style("fill", function(l) {
          if (l.name == targetData.pw0 || l.name == targetData.pw1) {
              return "yellow";
          } else {
              return "black";
          }
        });
      })
      .on("mouseout", function() {
        const target = d3.select(this);
        const weight = target[0][0].__data__.weight;
        target.style("stroke", lineColor); 
        target.style("stroke-width", edgeWeightConversion(weight));
        node.style("fill", "black");  
      })
      .on("click", function(d) {
        var xhr = new XMLHttpRequest();
        window.location.href = "/edge/" + d.pw0 + "&" + d.pw1;
      });
  link.append("title").text(function(d) {
    return "odds ratio: " + d.weight;
  });
 
  function wrap(text, width) {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      const lineHeight = 0.5;
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy"));
      let word;
      let line = [];
      let lineNumber = 0;
      let tspan = text.text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");
      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
      }
    });
  }

  svg.selectAll("text").call(wrap, 350);

  // Start the force layout.
  force.on("tick", tick_initial);
  
  function tick_initial() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    node.attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; 
    });
  }

  function tick() {
    tick_initial();
    selection.selectAll("circle.gene").each(function(g){
      g.fixed = true;
    });
  }
}