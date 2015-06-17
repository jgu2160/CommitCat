//mithril setup

var commitCat = {};

commitCat.vm = (function() {
    var vm = {};
    vm.init = function() {
        vm.user = m.prop("jgu2160");
        vm.repo = m.prop("CommitCat");
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
            m("link[href='./public/css/octicons.css'][rel=stylesheet]"),
            m("link[href='./public/css/styles.css'][rel=stylesheet]"),
        ]),
        m("body", {class: "cyan lighten-4"}, [
            m("div", {id: "gradient"},[
                m("h1", {class: "center-align", id:"title"}, "CommitCat"),
                m("p", {class: "center-align", id:"blurb" }, "Time-graphing commits by hour")
            ]),
            m("div", {id: "form", class: "cyan lighten-5 container z-depth-2 center-align"},[
                m("form", [
                    m("div", {class: "row"}, [
                        m("div", {class: "input-field"}, [
                            m("input", {onchange: m.withAttr("value", commitCat.vm.user), placeholder: commitCat.vm.user(), type: "text", id: "username"}),
                            m("label", {for: "username"}, "Username"),
                        ]),
                    m("div", {class: "input-field"}, [
                        m("input", {onchange: m.withAttr("value", commitCat.vm.repo), placeholder: commitCat.vm.repo(), type: "text", id: "repo"}),
                        m("label", {for: "repo"}, "Repo"),
                    ]),
                    ]),
                    m("a", {onclick: getDataAndBuild, class: "cyan darken-1 waves-effect waves-light btn"}, "MEOW"),
                ]),
            ]),
            m("div", {class: "graph center-align"}),
            m("p", {id: "plug"}, [
                m("span", "Made with "),
                m("span", {class: "octicon octicon-heart"}),
                m("span", " by "),
                m("a", {href: "https://github.com/jgu2160/CommitCat", target: "_blank"}, "jgu"),
            ])
        ])
    ]);
};

m.mount(document, {controller: commitCat.controller, view: commitCat.view});

//my functions

function filterNoCommits(arr) {
    return arr.filter(function(a){
        if (a[2] !== 0) {
            return a;
        }
    });
}

function getGitData() {
    return m.request(
        {   method: "GET",
            url: [
                "https://api.github.com/repos/",
                commitCat.vm.user(),
                "/",
                commitCat.vm.repo(),
                "/stats/punch_card",
            ].join("")
        }
    );
}

function getDataAndBuild() {
    getGitData()
    .then(function(success) {
        success = filterNoCommits(success);
        var timeHash = makeTimehash(success);
        setColor(timeHash);
        var timeObjects = makeTimeObjects(timeHash);
        var sortedTimeObjects = sortTimeObjects(timeObjects);
        data = timeObjects;
        makeGraph();
    });
}

function makeTimehash(timeArray) {
    var timeHash = {};
    timeArray.forEach(function (minArray) {
        var humanTime = humanTimes[minArray[1]];
        if (timeHash[humanTime]) {
            timeHash[humanTime] += minArray[2];
        } else {
            timeHash[humanTime] = minArray[2];
        }
    });
    return timeHash;
}

var maxValue = 0;

function makeTimeObjects(timeHash) {
    keys = Object.keys(timeHash);
    return keys.map(function(key) {
        return { name: key, value: timeHash[key] };
    });
}

function sortTimeObjects(timeObjects) {
    return timeObjects.sort(function(a, b) {
        var aPosition = humanTimes.indexOf(a.name);
        var bPosition = humanTimes.indexOf(b.name);

        if (aPosition > bPosition) {
            return 1;
        }
        if (aPosition < bPosition) {
            return -1;
        }
        return 0;
    });
}

function setColor(timeHash) {
    var arr = Object.keys(timeHash).map(function(key) { return timeHash[key]; });
    maxValue = Math.max.apply(null, arr);
    color = d3.scale.linear()
    .domain([1, maxValue])
    .range([
        "#ffd899",
        "#fb9a00"
    ]);
}

//d3

var data = [];

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

var color;

var arc = d3.svg.arc()
.outerRadius(radius)
.innerRadius(radius - 75)
.cornerRadius(3);

var pie = d3.layout.pie()
.sort(null)
.startAngle(1.1*Math.PI)
.endAngle(3.1*Math.PI)
.padAngle(0.03)
.value(function(d) { return d.value; });

var tip = d3.tip()
.attr('class', 'd3-tip')
.offset([-10, 0])
.html(function(d) {
    return "<strong>Commits:</strong> <span style='color:white'>" + d.data.value + "</span>";
});

chart.call(tip);

/* For the drop shadow filter... */
var defs = chart.append("defs");

var filter = defs.append("filter")
.attr("id", "dropshadow");

filter.append("feGaussianBlur")
.attr("in", "SourceAlpha")
.attr("stdDeviation", 4)
.attr("result", "blur");
filter.append("feOffset")
.attr("in", "blur")
.attr("dx", 2)
.attr("dy", 2)
.attr("result", "offsetBlur");

var feMerge = filter.append("feMerge");

feMerge.append("feMergeNode")
.attr("in", "offsetBlur");
feMerge.append("feMergeNode")
.attr("in", "SourceGraphic");

function makeGraph() {
    var g = chart.selectAll(".graph")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc")
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

    g.append("path")
    .style("fill", function(d) { return color(d.value); })
    .attr("filter", "url(#dropshadow)")
    .transition().delay(function(d, i) { return i * 500; }).duration(500)
    .attrTween('d', function(d) {
        var i = d3.interpolate(d.startAngle+0.1, d.endAngle);
        return function(t) {
            d.endAngle = i(t);
            return arc(d);
        };
    });

    g.append("text")
    .attr("fill", "white")
    .transition().delay(function(d, i) { return i * 500; }).duration(500)
    .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .attr("class", "donut-text")
    .style("text-anchor", "middle")
    .attr("fill", "white")
    .text(function(d) { return d.data.name; });

}

var humanTimes = [
    "12AM",
    "1AM",
    "2AM",
    "3AM",
    "4AM",
    "5AM",
    "6AM",
    "7AM",
    "8AM",
    "9AM",
    "10AM",
    "11AM",
    "12PM",
    "1PM",
    "2PM",
    "3PM",
    "4PM",
    "5PM",
    "6PM",
    "7PM",
    "8PM",
    "9PM",
    "10PM",
    "11PM"
];
