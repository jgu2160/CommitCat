var commitCat = {};

commitCat.repo = function(data) {
    this.description = m.prop(data.description);
};

commitCat.vm = (function() {
    var vm = {};
    vm.init = function() {
        vm.description = m.prop("Please enter a Github repo");

        vm.add = function() {
            if (vm.description()) {
                new commitCat.repo({description: vm.description()});
            }
        };
    };
    return vm;
}());

commitCat.controller = function() {
    commitCat.vm.init();
};

commitCat.view = function() {
    return m("html", [
        m("head", [
            m("title", "CommitCat"),
            m("link[href='./public/css/materialize.css'][rel=stylesheet]"),
            m("link[href='./public/css/styles.css'][rel=stylesheet]")
        ]),
        m("body", [
            m("h1", "CommitCat"),
            m("p","Timegraphing repo commits by hour"),
            m("input", {onchange: m.withAttr("value", commitCat.vm.description), value: commitCat.vm.description()}),
            m("a", {onclick: makeGraph, class: "waves-effect waves-light btn"}, "Add"),
            m("div", {class: "arc"}),
        ])
    ]);
};

m.mount(document, {controller: commitCat.controller, view: commitCat.view});

var data = [ {name: "one", value: 10375},
    {name: "two", value:  7615},
{name: "three", value:  832},
{name: "four", value:  516},
{name: "five", value:  491} ];

var margin = {top: 20, right: 20, bottom: 20, left: 20};
width = 400 - margin.left - margin.right;
height = width - margin.top - margin.bottom;

var chart = d3.select("body")
.append('svg')
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + ((width/2)+margin.left) + "," + ((height/2)+margin.top) + ")");

var radius = Math.min(width, height) / 2;

var color = d3.scale.ordinal()
.range(["#3399FF", "#5DAEF8", "#86C3FA", "#ADD6FB", "#D6EBFD"]);

var arc = d3.svg.arc()
.outerRadius(radius)
.innerRadius(radius - 20);

var pie = d3.layout.pie()
.sort(null)
.startAngle(1.1*Math.PI)
.endAngle(3.1*Math.PI)
.value(function(d) { return d.value; });

function makeGraph() {
    console.log("graph made");
    m.request({method: "GET", url: "https://api.github.com/repos/kpearson/octochat/stats/punch_card"})
    .then(function (success) {
        console.log(success);
    });
    var g = chart.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

    g.append("path")
    .style("fill", function(d) { return color(d.data.name); })
    .transition().delay(function(d, i) { return i * 500; }).duration(500)
    .attrTween('d', function(d) {
        var i = d3.interpolate(d.startAngle+0.1, d.endAngle);
        return function(t) {
            d.endAngle = i(t);
            return arc(d);
        };
    });
}
