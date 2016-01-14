(function () {

// Inspired by http://informationandvisualization.de/blog/box-plot
    d3.box = function () {
        var width = 1,
            height = 1,
            duration = 0,
            domain = null,
            value = Number,
            whiskers = boxWhiskers,
            quartiles = boxQuartiles,
            tickFormat = null;

        // For each small multiple…
        function box(g) {
            g.each(function (d, i) {
                d = d.map(value).sort(d3.ascending);
                var g = d3.select(this),
                    n = d.length,
                    min = d[0],
                    max = d[n - 1];

                // Compute quartiles. Must return exactly 3 elements.
                var quartileData = d.quartiles = quartiles(d);

                // Compute whiskers. Must return exactly 2 elements, or null.
                var whiskerIndices = whiskers && whiskers.call(this, d, i),
                    whiskerData = whiskerIndices && whiskerIndices.map(function (i) {
                            return d[i];
                        });

                // Compute outliers. If no whiskers are specified, all data are "outliers".
                // We compute the outliers as indices, so that we can join across transitions!
                var outlierIndices = whiskerIndices
                    ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
                    : d3.range(n);

                // Compute the new x-scale.
                var x1 = d3.scale.linear()
                    .domain(domain && domain.call(this, d, i) || [min, max])
                    .range([height, 0]);

                // Retrieve the old x-scale, if this is an update.
                var x0 = this.__chart__ || d3.scale.linear()
                        .domain([0, Infinity])
                        .range(x1.range());

                // Stash the new scale.
                this.__chart__ = x1;

                // Note: the box, median, and box tick elements are fixed in number,
                // so we only have to handle enter and update. In contrast, the outliers
                // and other elements are variable, so we need to exit them! Variable
                // elements also fade in and out.

                // Update center line: the vertical line spanning the whiskers.
                var center = g.selectAll("line.center")
                    .data(whiskerData ? [whiskerData] : []);

                center.enter().insert("line", "rect")
                    .attr("class", "center")
                    .attr("x1", width / 2)
                    .attr("y1", function (d) {
                        return x0(d[0]);
                    })
                    .attr("x2", width / 2)
                    .attr("y2", function (d) {
                        return x0(d[1]);
                    })
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .style("opacity", 1)
                    .attr("y1", function (d) {
                        return x1(d[0]);
                    })
                    .attr("y2", function (d) {
                        return x1(d[1]);
                    });

                center.transition()
                    .duration(duration)
                    .style("opacity", 1)
                    .attr("y1", function (d) {
                        return x1(d[0]);
                    })
                    .attr("y2", function (d) {
                        return x1(d[1]);
                    });

                center.exit().transition()
                    .duration(duration)
                    .style("opacity", 1e-6)
                    .attr("y1", function (d) {
                        return x1(d[0]);
                    })
                    .attr("y2", function (d) {
                        return x1(d[1]);
                    })
                    .remove();

                // Update innerquartile box.
                var box = g.selectAll("rect.box")
                    .data([quartileData]);

                box.enter().append("rect")
                    .attr("class", "box")
                    .attr("x", 0)
                    .attr("y", function (d) {
                        return x0(d[2]);
                    })
                    .attr("width", width)
                    .attr("height", function (d) {
                        return x0(d[0]) - x0(d[2]);
                    })
                    .transition()
                    .duration(duration)
                    .attr("y", function (d) {
                        return x1(d[2]);
                    })
                    .attr("height", function (d) {
                        return x1(d[0]) - x1(d[2]);
                    });

                box.transition()
                    .duration(duration)
                    .attr("y", function (d) {
                        return x1(d[2]);
                    })
                    .attr("height", function (d) {
                        return x1(d[0]) - x1(d[2]);
                    });

                // Update median line.
                var medianLine = g.selectAll("line.median")
                    .data([quartileData[1]]);

                medianLine.enter().append("line")
                    .attr("class", "median")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", width)
                    .attr("y2", x0)
                    .transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1);

                medianLine.transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1);

                // Update whiskers.
                var whisker = g.selectAll("line.whisker")
                    .data(whiskerData || []);

                whisker.enter().insert("line", "circle, text")
                    .attr("class", "whisker")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", width)
                    .attr("y2", x0)
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1);

                whisker.transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1);

                whisker.exit().transition()
                    .duration(duration)
                    .attr("y1", x1)
                    .attr("y2", x1)
                    .style("opacity", 1e-6)
                    .remove();

                // Update outliers.
                var outlier = g.selectAll("circle.outlier")
                    .data(outlierIndices, Number);

                outlier.enter().insert("circle", "text")
                    .attr("class", "outlier")
                    .attr("r", 5)
                    .attr("cx", width / 2)
                    .attr("cy", function (i) {
                        return x0(d[i]);
                    })
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("cy", function (i) {
                        return x1(d[i]);
                    })
                    .style("opacity", 1);

                outlier.transition()
                    .duration(duration)
                    .attr("cy", function (i) {
                        return x1(d[i]);
                    })
                    .style("opacity", 1);

                outlier.exit().transition()
                    .duration(duration)
                    .attr("cy", function (i) {
                        return x1(d[i]);
                    })
                    .style("opacity", 1e-6)
                    .remove();

                // Compute the tick format.
                var format = tickFormat || x1.tickFormat(8);

                // Update box ticks.
                var boxTick = g.selectAll("text.box")
                    .data(quartileData);

                boxTick.enter().append("text")
                    .attr("class", "box")
                    .attr("dy", ".3em")
                    .attr("dx", function (d, i) {
                        return i & 1 ? 6 : -6;
                    })
                    .attr("x", function (d, i) {
                        return i & 1 ? width : 0;
                    })
                    .attr("y", x0)
                    .attr("text-anchor", function (d, i) {
                        return i & 1 ? "start" : "end";
                    })
                    .text(format)
                    .transition()
                    .duration(duration)
                    .attr("y", x1);

                boxTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr("y", x1);

                // Update whisker ticks. These are handled separately from the box
                // ticks because they may or may not exist, and we want don't want
                // to join box ticks pre-transition with whisker ticks post-.
                var whiskerTick = g.selectAll("text.whisker")
                    .data(whiskerData || []);

                whiskerTick.enter().append("text")
                    .attr("class", "whisker")
                    .attr("dy", ".3em")
                    .attr("dx", 6)
                    .attr("x", width)
                    .attr("y", x0)
                    .text(format)
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("y", x1)
                    .style("opacity", 1);

                whiskerTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr("y", x1)
                    .style("opacity", 1);

                whiskerTick.exit().transition()
                    .duration(duration)
                    .attr("y", x1)
                    .style("opacity", 1e-6)
                    .remove();
            });
            d3.timer.flush();
        }

        box.width = function (x) {
            if (!arguments.length) return width;
            width = x;
            return box;
        };

        box.height = function (x) {
            if (!arguments.length) return height;
            height = x;
            return box;
        };

        box.tickFormat = function (x) {
            if (!arguments.length) return tickFormat;
            tickFormat = x;
            return box;
        };

        box.duration = function (x) {
            if (!arguments.length) return duration;
            duration = x;
            return box;
        };

        box.domain = function (x) {
            if (!arguments.length) return domain;
            domain = x == null ? x : d3.functor(x);
            return box;
        };

        box.value = function (x) {
            if (!arguments.length) return value;
            value = x;
            return box;
        };

        box.whiskers = function (x) {
            if (!arguments.length) return whiskers;
            whiskers = x;
            return box;
        };

        box.quartiles = function (x) {
            if (!arguments.length) return quartiles;
            quartiles = x;
            return box;
        };

        return box;
    };

    function boxWhiskers(d) {
        return [0, d.length - 1];
    }

    function boxQuartiles(d) {
        return [
            d3.quantile(d, .25),
            d3.quantile(d, .5),
            d3.quantile(d, .75)
        ];
    }

})();

(function () {

// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
    d3.bullet = function () {
        var orient = "left",
            reverse = false,
            vertical = false,
            ranges = bulletRanges,
            markers = bulletMarkers,
            measures = bulletMeasures,
            width = 380,
            height = 30,
            xAxis = d3.svg.axis();

        // For each small multiple…
        function bullet(g) {
            g.each(function (d, i) {
                var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                    markerz = markers.call(this, d, i).slice().sort(d3.descending),
                    measurez = measures.call(this, d, i).slice().sort(d3.descending),
                    g = d3.select(this),
                    extentX,
                    extentY;

                var wrap = g.select("g.wrap");
                if (wrap.empty()) wrap = g.append("g").attr("class", "wrap");

                if (vertical) {
                    extentX = height, extentY = width;
                    wrap.attr("transform", "rotate(90)translate(0," + -width + ")");
                } else {
                    extentX = width, extentY = height;
                    wrap.attr("transform", "translate(0)");
                }

                // Compute the new x-scale.
                var x1 = d3.scale.linear()
                    .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])
                    .range(reverse ? [extentX, 0] : [0, extentX]);

                // Retrieve the old x-scale, if this is an update.
                var x0 = this.__chart__ || d3.scale.linear()
                        .domain([0, Infinity])
                        .range(x1.range());

                // Stash the new scale.
                this.__chart__ = x1;

                // Derive width-scales from the x-scales.
                var w0 = bulletWidth(x0),
                    w1 = bulletWidth(x1);

                // Update the range rects.
                var range = wrap.selectAll("rect.range")
                    .data(rangez);

                range.enter().append("rect")
                    .attr("class", function (d, i) {
                        return "range s" + i;
                    })
                    .attr("width", w0)
                    .attr("height", extentY)
                    .attr("x", reverse ? x0 : 0)

                d3.transition(range)
                    .attr("x", reverse ? x1 : 0)
                    .attr("width", w1)
                    .attr("height", extentY);

                // Update the measure rects.
                var measure = wrap.selectAll("rect.measure")
                    .data(measurez);

                measure.enter().append("rect")
                    .attr("class", function (d, i) {
                        return "measure s" + i;
                    })
                    .attr("width", w0)
                    .attr("height", extentY / 3)
                    .attr("x", reverse ? x0 : 0)
                    .attr("y", extentY / 3);

                d3.transition(measure)
                    .attr("width", w1)
                    .attr("height", extentY / 3)
                    .attr("x", reverse ? x1 : 0)
                    .attr("y", extentY / 3);

                // Update the marker lines.
                var marker = wrap.selectAll("line.marker")
                    .data(markerz);

                marker.enter().append("line")
                    .attr("class", "marker")
                    .attr("x1", x0)
                    .attr("x2", x0)
                    .attr("y1", extentY / 6)
                    .attr("y2", extentY * 5 / 6);

                d3.transition(marker)
                    .attr("x1", x1)
                    .attr("x2", x1)
                    .attr("y1", extentY / 6)
                    .attr("y2", extentY * 5 / 6);

                var axis = g.selectAll("g.axis").data([0]);
                axis.enter().append("g").attr("class", "axis");
                axis.call(xAxis.scale(x1));
            });
            d3.timer.flush();
        }

        // left, right, top, bottom
        bullet.orient = function (_) {
            if (!arguments.length) return orient;
            orient = _ + "";
            reverse = orient == "right" || orient == "bottom";
            xAxis.orient((vertical = orient == "top" || orient == "bottom") ? "left" : "bottom");
            return bullet;
        };

        // ranges (bad, satisfactory, good)
        bullet.ranges = function (_) {
            if (!arguments.length) return ranges;
            ranges = _;
            return bullet;
        };

        // markers (previous, goal)
        bullet.markers = function (_) {
            if (!arguments.length) return markers;
            markers = _;
            return bullet;
        };

        // measures (actual, forecast)
        bullet.measures = function (_) {
            if (!arguments.length) return measures;
            measures = _;
            return bullet;
        };

        bullet.width = function (_) {
            if (!arguments.length) return width;
            width = +_;
            return bullet;
        };

        bullet.height = function (_) {
            if (!arguments.length) return height;
            height = +_;
            return bullet;
        };

        return d3.rebind(bullet, xAxis, "tickFormat");
    };

    function bulletRanges(d) {
        return d.ranges;
    }

    function bulletMarkers(d) {
        return d.markers;
    }

    function bulletMeasures(d) {
        return d.measures;
    }

    function bulletWidth(x) {
        var x0 = x(0);
        return function (d) {
            return Math.abs(x(d) - x0);
        };
    }

})();

(function () {
    function sign(num) {
        if (num > 0) {
            return 1;
        } else if (num < 0) {
            return -1;
        } else {
            return 0;
        }
    }

// Implements Chernoff faces (http://en.wikipedia.org/wiki/Chernoff_face).
// Exposes 8 parameters through functons to control the facial expression.
// face -- shape of the face {0..1}
// hair -- shape of the hair {-1..1}
// mouth -- shape of the mouth {-1..1}
// noseh -- height of the nose {0..1}
// nosew -- width of the nose {0..1}
// eyeh -- height of the eyes {0..1}
// eyew -- width of the eyes {0..1}
// brow -- slant of the brows {-1..1}
    function d3_chernoff() {
        var facef = 0.5, // 0 - 1
            hairf = 0, // -1 - 1
            mouthf = 0, // -1 - 1
            nosehf = 0.5, // 0 - 1
            nosewf = 0.5, // 0 - 1
            eyehf = 0.5, // 0 - 1
            eyewf = 0.5, // 0 - 1
            browf = 0, // -1 - 1

            line = d3.svg.line()
                .interpolate("cardinal-closed")
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                }),
            bline = d3.svg.line()
                .interpolate("basis-closed")
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                });

        function chernoff(a) {
            if (a instanceof Array) {
                a.each(__chernoff);
            } else {
                d3.select(this).each(__chernoff);
            }
        }

        function __chernoff(d) {
            var ele = d3.select(this),
                facevar = (typeof(facef) === "function" ? facef(d) : facef) * 30,
                hairvar = (typeof(hairf) === "function" ? hairf(d) : hairf) * 80,
                mouthvar = (typeof(mouthf) === "function" ? mouthf(d) : mouthf) * 7,
                nosehvar = (typeof(nosehf) === "function" ? nosehf(d) : nosehf) * 10,
                nosewvar = (typeof(nosewf) === "function" ? nosewf(d) : nosewf) * 10,
                eyehvar = (typeof(eyehf) === "function" ? eyehf(d) : eyehf) * 10,
                eyewvar = (typeof(eyewf) === "function" ? eyewf(d) : eyewf) * 10,
                browvar = (typeof(browf) === "function" ? browf(d) : browf) * 3;

            var face = [{x: 70, y: 60}, {x: 120, y: 80},
                {x: 120 - facevar, y: 110}, {x: 120 - facevar, y: 160},
                {x: 20 + facevar, y: 160}, {x: 20 + facevar, y: 110},
                {x: 20, y: 80}];
            ele.selectAll("path.face").data([face]).enter()
                .append("path")
                .attr("class", "face")
                .attr("d", bline);

            var hair = [{x: 70, y: 60}, {x: 120, y: 80},
                {x: 140, y: 45 - hairvar}, {x: 120, y: 45},
                {x: 70, y: 30}, {x: 20, y: 45},
                {x: 0, y: 45 - hairvar}, {x: 20, y: 80}];
            ele.selectAll("path.hair").data([hair]).enter()
                .append("path")
                .attr("class", "hair")
                .attr("d", bline);

            var mouth = [{x: 70, y: 130 + mouthvar},
                {x: 110 - facevar, y: 135 - mouthvar},
                {x: 70, y: 140 + mouthvar},
                {x: 30 + facevar, y: 135 - mouthvar}];
            ele.selectAll("path.mouth").data([mouth]).enter()
                .append("path")
                .attr("class", "mouth")
                .attr("d", line);

            var nose = [{x: 70, y: 110 - nosehvar},
                {x: 70 + nosewvar, y: 110 + nosehvar},
                {x: 70 - nosewvar, y: 110 + nosehvar}];
            ele.selectAll("path.nose").data([nose]).enter()
                .append("path")
                .attr("class", "nose")
                .attr("d", line);

            var leye = [{x: 55, y: 90 - eyehvar}, {x: 55 + eyewvar, y: 90},
                {x: 55, y: 90 + eyehvar}, {x: 55 - eyewvar, y: 90}];
            var reye = [{x: 85, y: 90 - eyehvar}, {x: 85 + eyewvar, y: 90},
                {x: 85, y: 90 + eyehvar}, {x: 85 - eyewvar, y: 90}];
            ele.selectAll("path.leye").data([leye]).enter()
                .append("path")
                .attr("class", "leye")
                .attr("d", bline);
            ele.selectAll("path.reye").data([reye]).enter()
                .append("path")
                .attr("class", "reye")
                .attr("d", bline);

            ele.append("path")
                .attr("class", "lbrow")
                .attr("d", "M" + (55 - eyewvar / 1.7 - sign(browvar)) + "," +
                (87 - eyehvar + browvar) + " " +
                (55 + eyewvar / 1.7 - sign(browvar)) + "," +
                (87 - eyehvar - browvar));
            ele.append("path")
                .attr("class", "rbrow")
                .attr("d", "M" + (85 - eyewvar / 1.7 + sign(browvar)) + "," +
                (87 - eyehvar - browvar) + " " +
                (85 + eyewvar / 1.7 + sign(browvar)) + "," +
                (87 - eyehvar + browvar));
        }

        chernoff.face = function (x) {
            if (!arguments.length) return facef;
            facef = x;
            return chernoff;
        };

        chernoff.hair = function (x) {
            if (!arguments.length) return hairf;
            hairf = x;
            return chernoff;
        };

        chernoff.mouth = function (x) {
            if (!arguments.length) return mouthf;
            mouthf = x;
            return chernoff;
        };

        chernoff.noseh = function (x) {
            if (!arguments.length) return nosehf;
            nosehf = x;
            return chernoff;
        };

        chernoff.nosew = function (x) {
            if (!arguments.length) return nosewf;
            nosewf = x;
            return chernoff;
        };

        chernoff.eyeh = function (x) {
            if (!arguments.length) return eyehf;
            eyehf = x;
            return chernoff;
        };

        chernoff.eyew = function (x) {
            if (!arguments.length) return eyewf;
            eyewf = x;
            return chernoff;
        };

        chernoff.brow = function (x) {
            if (!arguments.length) return browf;
            browf = x;
            return chernoff;
        };

        return chernoff;
    }

    d3.chernoff = function () {
        return d3_chernoff(Object);
    };
})();

(function () {
    var radians = Math.PI / 180;

    d3.scale.cubehelix = function () {
        return d3.scale.linear()
            .range([d3.hsl(300, .5, 0), d3.hsl(-240, .5, 1)])
            .interpolate(d3.interpolateCubehelix);
    };

    d3.interpolateCubehelix = d3_interpolateCubehelix(1);
    d3.interpolateCubehelix.gamma = d3_interpolateCubehelix;

    function d3_interpolateCubehelix(γ) {
        return function (a, b) {
            a = d3.hsl(a);
            b = d3.hsl(b);

            var ah = (a.h + 120) * radians,
                bh = (b.h + 120) * radians - ah,
                as = a.s,
                bs = b.s - as,
                al = a.l,
                bl = b.l - al;

            if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
            if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah;

            return function (t) {
                var h = ah + bh * t,
                    l = Math.pow(al + bl * t, γ),
                    a = (as + bs * t) * l * (1 - l),
                    cosh = Math.cos(h),
                    sinh = Math.sin(h);
                return "#"
                    + hex(l + a * (-0.14861 * cosh + 1.78277 * sinh))
                    + hex(l + a * (-0.29227 * cosh - 0.90649 * sinh))
                    + hex(l + a * (+1.97294 * cosh));
            };
        };
    }

    function hex(v) {
        var s = (v = v <= 0 ? 0 : v >= 1 ? 255 : v * 255 | 0).toString(16);
        return v < 0x10 ? "0" + s : s;
    }
})();

(function() {
  d3.fisheye = {
    scale: function(scaleType) {
      return d3_fisheye_scale(scaleType(), 3, 0);
    },
    circular: function() {
      var radius = 200,
          distortion = 2,
          k0,
          k1,
          focus = [0, 0];

      function fisheye(d) {
        var dx = d.x - focus[0],
            dy = d.y - focus[1],
            dd = Math.sqrt(dx * dx + dy * dy);
        if (!dd || dd >= radius) return {x: d.x, y: d.y, z: 1};
        var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
        return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
      }

      function rescale() {
        k0 = Math.exp(distortion);
        k0 = k0 / (k0 - 1) * radius;
        k1 = distortion / radius;
        return fisheye;
      }

      fisheye.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return rescale();
      };

      fisheye.distortion = function(_) {
        if (!arguments.length) return distortion;
        distortion = +_;
        return rescale();
      };

      fisheye.focus = function(_) {
        if (!arguments.length) return focus;
        focus = _;
        return fisheye;
      };

      return rescale();
    }
  };

  function d3_fisheye_scale(scale, d, a) {

    function fisheye(_) {
      var x = scale(_),
          left = x < a,
          range = d3.extent(scale.range()),
          min = range[0],
          max = range[1],
          m = left ? a - min : max - a;
      if (m == 0) m = max - min;
      return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
    }

    fisheye.distortion = function(_) {
      if (!arguments.length) return d;
      d = +_;
      return fisheye;
    };

    fisheye.focus = function(_) {
      if (!arguments.length) return a;
      a = +_;
      return fisheye;
    };

    fisheye.copy = function() {
      return d3_fisheye_scale(scale.copy(), d, a);
    };

    fisheye.nice = scale.nice;
    fisheye.ticks = scale.ticks;
    fisheye.tickFormat = scale.tickFormat;
    return d3.rebind(fisheye, scale, "domain", "range");
  }
})();

(function() {
  d3.force_labels = function force_labels() {    
    var labels = d3.layout.force();
      
    // Update the position of the anchor based on the center of bounding box
    function updateAnchor() {
      if (!labels.selection) return;
      labels.selection.each(function(d) {
        var bbox = this.getBBox(),
            x = bbox.x + bbox.width / 2,
            y = bbox.y + bbox.height / 2;

        d.anchorPos.x = x;
        d.anchorPos.y = y;
       
        // If a label position does not exist, set it to be the anchor position 
        if (d.labelPos.x == null) {
          d.labelPos.x = x;
          d.labelPos.y = y;
        }
      });
    }
    
    //The anchor position should be updated on each tick
    labels.on("tick.labels", updateAnchor);
    
    // This updates all nodes/links - retaining any previous labelPos on updated nodes
    labels.update = function(selection) {
      labels.selection = selection;
      var nodes = [], links = [];
      selection[0].forEach(function(d) {    
        if(d && d.__data__) {
          var data = d.__data__;
          
          if (!d.labelPos) d.labelPos = {fixed: false};
          if (!d.anchorPos) d.anchorPos = {fixed: true};
          
          // Place position objects in __data__ to make them available through 
          // d.labelPos/d.anchorPos for different elements
          data.labelPos = d.labelPos;
          data.anchorPos = d.anchorPos;
          
          links.push({target: d.anchorPos, source: d.labelPos});
          nodes.push(d.anchorPos);
          nodes.push(d.labelPos);
        }
      });
      labels
          .stop()
          .nodes(nodes)
          .links(links);
      updateAnchor();
      labels.start();
    };
    return labels;
  };
})();

(function() {

var ε = 1e-6,
    π = Math.PI,
    radians = π / 180,
    degrees = 180 / π;

// Creates a polyhedral projection.
//  * root: a spanning tree of polygon faces.  Nodes are automatically
//    augmented with a transform matrix.
//  * face: a function that returns the appropriate node for a given {λ, φ}
//    point (radians).
//  * r: rotation angle for final polyhedron net.  Defaults to -π / 6 (for
//    butterflies).
d3.geo.polyhedron = function(root, face, r) {

  r = r == null ? -π / 6 : r; // TODO automate

  recurse(root, {transform: [
    Math.cos(r), Math.sin(r), 0,
    -Math.sin(r), Math.cos(r), 0
  ]});

  function recurse(node, parent) {
    node.edges = faceEdges(node.face);
    if (parent) {
      // Find shared edge.
      if (parent.face) {
        var shared = node.shared = sharedEdge(node.face, parent.face),
            m = matrix(shared.map(parent.project), shared.map(node.project));
        node.transform = parent.transform ? multiply(parent.transform, m) : m;
        // Replace shared edge in parent edges array.
        var edges = parent.edges;
        for (var i = 0, n = edges.length; i < n; ++i) {
          if (pointEqual(shared[0], edges[i][1]) && pointEqual(shared[1], edges[i][0])) edges[i] = node;
          if (pointEqual(shared[0], edges[i][0]) && pointEqual(shared[1], edges[i][1])) edges[i] = node;
        }
        var edges = node.edges;
        for (var i = 0, n = edges.length; i < n; ++i) {
          if (pointEqual(shared[0], edges[i][0]) && pointEqual(shared[1], edges[i][1])) edges[i] = parent;
          if (pointEqual(shared[0], edges[i][1]) && pointEqual(shared[1], edges[i][0])) edges[i] = parent;
        }
      } else {
        node.transform = parent.transform;
      }
    }
    if (node.children) {
      node.children.forEach(function(child) {
        recurse(child, node);
      });
    }
    return node;
  }

  function forward(λ, φ) {
    var node = face(λ, φ),
        point = node.project([λ * degrees, φ * degrees]),
        t;
    if (t = node.transform) {
      return [
        t[0] * point[0] + t[1] * point[1] + t[2],
        -(t[3] * point[0] + t[4] * point[1] + t[5])
      ];
    }
    point[1] = -point[1];
    return point;
  }

  // Naive inverse!  A faster solution would use bounding boxes, or even a
  // polygonal quadtree.
  if (hasInverse(root)) forward.invert = function(x, y) {
    var coordinates = faceInvert(root, [x, -y]);
    return coordinates && (coordinates[0] *= radians, coordinates[1] *= radians, coordinates);
  };

  function faceInvert(node, coordinates) {
    var invert = node.project.invert,
        t = node.transform,
        point = coordinates;
    if (t) {
      t = inverseTransform(t);
      point = [
        t[0] * point[0] + t[1] * point[1] + t[2],
        (t[3] * point[0] + t[4] * point[1] + t[5])
      ];
    }
    if (invert && node === faceDegrees(p = invert(point))) return p;
    var p,
        children = node.children;
    for (var i = 0, n = children && children.length; i < n; ++i) {
      if (p = faceInvert(children[i], coordinates)) return p;
    }
  }

  function faceDegrees(coordinates) {
    return face(coordinates[0] * radians, coordinates[1] * radians);
  }

  var projection = d3.geo.projection(forward),
      stream_ = projection.stream;

  projection.stream = function(stream) {
    var rotate = projection.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (projection.rotate([0, 0]), stream_(stream));
    projection.rotate(rotate);
    rotateStream.sphere = function() {
      sphereStream.polygonStart();
      sphereStream.lineStart();
      outline(sphereStream, root);
      sphereStream.lineEnd();
      sphereStream.polygonEnd();
    };
    return rotateStream;
  };

  return projection;
};

d3.geo.polyhedron.butterfly = function(faceProjection) {

  faceProjection = faceProjection || function(face) {
    var centroid = d3.geo.centroid({type: "MultiPoint", coordinates: face});
    return d3.geo.gnomonic().scale(1).translate([0, 0]).rotate([-centroid[0], -centroid[1]]);
  };

  var faces = d3.geo.polyhedron.octahedron.map(function(face) {
    return {face: face, project: faceProjection(face)};
  });

  [-1, 0, 0, 1, 0, 1, 4, 5].forEach(function(d, i) {
    var node = faces[d];
    node && (node.children || (node.children = [])).push(faces[i]);
  });

  return d3.geo.polyhedron(faces[0], function(λ, φ) {
    return faces[
        λ < -π / 2 ? φ < 0 ? 6 : 4
        : λ < 0 ? φ < 0 ? 2 : 0
        : λ < π / 2 ? φ < 0 ? 3 : 1
        : φ < 0 ? 7 : 5];
  });
};

d3.geo.polyhedron.waterman = function(faceProjection) {

  faceProjection = faceProjection || function(face) {
    var centroid = face.length === 6 ? d3.geo.centroid({type: "MultiPoint", coordinates: face}) : face[0];
    return d3.geo.gnomonic().scale(1).translate([0, 0]).rotate([-centroid[0], -centroid[1]]);
  };

  var octahedron = d3.geo.polyhedron.octahedron;

  var w5 = octahedron.map(function(face) {
    var xyz = face.map(cartesian),
        n = xyz.length,
        a = xyz[n - 1],
        b,
        hexagon = [];
    for (var i = 0; i < n; ++i) {
      b = xyz[i];
      hexagon.push(spherical([
        a[0] * 0.9486832980505138 + b[0] * 0.31622776601683794,
        a[1] * 0.9486832980505138 + b[1] * 0.31622776601683794,
        a[2] * 0.9486832980505138 + b[2] * 0.31622776601683794
      ]), spherical([
        b[0] * 0.9486832980505138 + a[0] * 0.31622776601683794,
        b[1] * 0.9486832980505138 + a[1] * 0.31622776601683794,
        b[2] * 0.9486832980505138 + a[2] * 0.31622776601683794
      ]));
      a = b;
    }
    return hexagon;
  });

  var cornerNormals = [];

  var parents = [-1, 0, 0, 1, 0, 1, 4, 5];

  w5.forEach(function(hexagon, j) {
    var face = octahedron[j],
        n = face.length,
        normals = cornerNormals[j] = [];
    for (var i = 0; i < n; ++i) {
      w5.push([
        face[i],
        hexagon[(i * 2 + 2) % (2 * n)],
        hexagon[(i * 2 + 1) % (2 * n)]
      ]);
      parents.push(j);
      normals.push(cross(
        cartesian(hexagon[(i * 2 + 2) % (2 * n)]),
        cartesian(hexagon[(i * 2 + 1) % (2 * n)])
      ));
    }
  });

  var faces = w5.map(function(face) {
    return {
      project: faceProjection(face),
      face: face
    };
  });

  parents.forEach(function(d, i) {
    var parent = faces[d];
    parent && (parent.children || (parent.children = [])).push(faces[i]);
  });

  return d3.geo.polyhedron(faces[0], face).center([0, 45]);

  function face(λ, φ) {
    var cosφ = Math.cos(φ),
        p = [cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ)];

    var hexagon = λ < -π / 2 ? φ < 0 ? 6 : 4
        : λ < 0 ? φ < 0 ? 2 : 0
        : λ < π / 2 ? φ < 0 ? 3 : 1
        : φ < 0 ? 7 : 5;

    var n = cornerNormals[hexagon];

    return faces[
        dot(n[0], p) < 0 ? 8 + 3 * hexagon
      : dot(n[1], p) < 0 ? 8 + 3 * hexagon + 1
      : dot(n[2], p) < 0 ? 8 + 3 * hexagon + 2
      : hexagon];
  }
};

function outline(stream, node, parent) {
  var point,
      edges = node.edges,
      n = edges.length,
      edge,
      multiPoint = {type: "MultiPoint", coordinates: node.face},
      notPoles = node.face.filter(function(d) { return Math.abs(d[1]) !== 90; }),
      bounds = d3.geo.bounds({type: "MultiPoint", coordinates: notPoles}),
      inside = false,
      j = -1,
      dx = bounds[1][0] - bounds[0][0];
  // TODO
  var centroid = dx === 180 || dx === 360
      ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]
      : d3.geo.centroid(multiPoint);
  // First find the shared edge…
  if (parent) while (++j < n) {
    if (edges[j] === parent) break;
  }
  ++j;
  for (var i = 0; i < n; ++i) {
    edge = edges[(i + j) % n];
    if (Array.isArray(edge)) {
      if (!inside) {
        stream.point((point = d3.geo.interpolate(edge[0], centroid)(ε))[0], point[1]);
        inside = true;
      }
      stream.point((point = d3.geo.interpolate(edge[1], centroid)(ε))[0], point[1]);
    } else {
      inside = false;
      if (edge !== parent) outline(stream, edge, node);
    }
  }
}

// TODO generate on-the-fly to avoid external modification.
var octahedron = [
  [0, 90],
  [-90, 0], [0, 0], [90, 0], [180, 0],
  [0, -90]
];

d3.geo.polyhedron.octahedron = [
  [0, 2, 1],
  [0, 3, 2],
  [5, 1, 2],
  [5, 2, 3],
  [0, 1, 4],
  [0, 4, 3],
  [5, 4, 1],
  [5, 3, 4]
].map(function(face) {
  return face.map(function(i) {
    return octahedron[i];
  });
});

var φ1 = Math.atan(Math.SQRT1_2) * degrees;

var cube = [
  [0, φ1], [90, φ1], [180, φ1], [-90, φ1],
  [0, -φ1], [90, -φ1], [180, -φ1], [-90, -φ1]
];

d3.geo.polyhedron.cube = [
  [0, 3, 2, 1], // N
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
  [4, 5, 6, 7] // S
].map(function(face) {
  return face.map(function(i) {
    return cube[i];
  });
});

// Finds a shared edge given two clockwise polygons.
function sharedEdge(a, b) {
  var x, y, n = a.length, found = null;
  for (var i = 0; i < n; ++i) {
    x = a[i];
    for (var j = b.length; --j >= 0;) {
      y = b[j];
      if (x[0] === y[0] && x[1] === y[1]) {
        if (found) return [found, x];
        found = x;
      }
    }
  }
}

// Note: 6-element arrays are used to denote the 3x3 affine transform matrix:
// [a, b, c,
//  d, e, f,
//  0, 0, 1] - this redundant row is left out.

// Transform matrix for [a0, a1] -> [b0, b1].
function matrix(a, b) {
  var u = subtract(a[1], a[0]),
      v = subtract(b[1], b[0]),
      φ = angle(u, v),
      s = length(u) / length(v);

  return multiply([
    1, 0, a[0][0],
    0, 1, a[0][1]
  ], multiply([
    s, 0, 0,
    0, s, 0
  ], multiply([
    Math.cos(φ), Math.sin(φ), 0,
    -Math.sin(φ), Math.cos(φ), 0
  ], [
    1, 0, -b[0][0],
    0, 1, -b[0][1]
  ])));
}

// Inverts a transform matrix.
function inverseTransform(m) {
  var k = 1 / (m[0] * m[4] - m[1] * m[3]);
  return [
    k * m[4], -k * m[1], k * (m[1] * m[5] - m[2] * m[4]),
    -k * m[3], k * m[0], k * (m[2] * m[3] - m[0] * m[5])
  ];
}

// Multiplies two 3x2 matrices.
function multiply(a, b) {
  return [
    a[0] * b[0] + a[1] * b[3],
    a[0] * b[1] + a[1] * b[4],
    a[0] * b[2] + a[1] * b[5] + a[2],
    a[3] * b[0] + a[4] * b[3],
    a[3] * b[1] + a[4] * b[4],
    a[3] * b[2] + a[4] * b[5] + a[5]
  ];
}

// Subtracts 2D vectors.
function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
}

// Magnitude of a 2D vector.
function length(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

// Angle between two 2D vectors.
function angle(a, b) {
  return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
}

function dot(a, b) {
  for (var i = 0, n = a.length, s = 0; i < n; ++i) s += a[i] * b[i];
  return s;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

// Converts 3D Cartesian to spherical coordinates (degrees).
function spherical(cartesian) {
  return [
    Math.atan2(cartesian[1], cartesian[0]) * degrees,
    Math.asin(Math.max(-1, Math.min(1, cartesian[2]))) * degrees
  ];
}

// Converts spherical coordinates (degrees) to 3D Cartesian.
function cartesian(coordinates) {
  var λ = coordinates[0] * radians,
      φ = coordinates[1] * radians,
      cosφ = Math.cos(φ);
  return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
  ];
}

// Tests equality of two spherical points.
function pointEqual(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

// Converts an array of n face vertices to an array of n + 1 edges.
function faceEdges(face) {
  var n = face.length,
      edges = [];
  for (var a = face[n - 1], i = 0; i < n; ++i) edges.push([a, a = face[i]]);
  return edges;
}

function hasInverse(node) {
  return node.project.invert || node.children && node.children.some(hasInverse);
}

})();

d3.geo.tile = function() {
  var size = [960, 500],
      scale = 256,
      translate = [size[0] / 2, size[1] / 2],
      zoomDelta = 0;

  function tile() {
    var z = Math.max(Math.log(scale) / Math.LN2 - 8, 0),
        z0 = Math.round(z + zoomDelta),
        k = Math.pow(2, z - z0 + 8),
        origin = [(translate[0] - scale / 2) / k, (translate[1] - scale / 2) / k],
        tiles = [],
        cols = d3.range(Math.max(0, Math.floor(-origin[0])), Math.max(0, Math.ceil(size[0] / k - origin[0]))),
        rows = d3.range(Math.max(0, Math.floor(-origin[1])), Math.max(0, Math.ceil(size[1] / k - origin[1])));

    rows.forEach(function(y) {
      cols.forEach(function(x) {
        tiles.push([x, y, z0]);
      });
    });

    tiles.translate = origin;
    tiles.scale = k;

    return tiles;
  }

  tile.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return tile;
  };

  tile.scale = function(_) {
    if (!arguments.length) return scale;
    scale = _;
    return tile;
  };

  tile.translate = function(_) {
    if (!arguments.length) return translate;
    translate = _;
    return tile;
  };

  tile.zoomDelta = function(_) {
    if (!arguments.length) return zoomDelta;
    zoomDelta = +_;
    return tile;
  };

  return tile;
};

(function() {
  var φ = 1.618033988749895,
      ρ = 180 / Math.PI;

  var vertices = [
    [1,φ,0], [-1,φ,0], [1,-φ,0], [-1,-φ,0],
    [0,1,φ], [0,-1,φ], [0,1,-φ], [0,-1,-φ],
    [φ,0,1], [-φ,0,1], [φ,0,-1], [-φ,0,-1]
  ];

  var faces = [
    [0,1,4],  [1,9,4],  [4,9,5],  [5,9,3],  [2,3,7],
    [3,2,5],  [7,10,2], [0,8,10], [0,4,8],  [8,2,10],
    [8,4,5],  [8,5,2],  [1,0,6],  [11,1,6], [3,9,11],
    [6,10,7], [3,11,7], [11,6,7], [6,0,10], [9,1,11]
  ].map(function(face) {
    return face.map(function(i) {
      return vertices[i];
    });
  });

  d3.geodesic = {
    multipolygon: function(n) {
      return {
        type: "MultiPolygon",
        coordinates: subdivideFaces(~~n).map(function(face) {
          face = face.map(project);
          face.push(face[0]);
          face = [face];
          return face;
        })
      };
    },
    polygons: function(n) {
      return d3.geodesic.multipolygon(~~n).coordinates.map(function(face) {
        return {type: "Polygon", coordinates: face};
      });
    },
    multilinestring: function(n) {
      return {
        type: "MultiLineString",
        coordinates: subdivideEdges(~~n).map(function(edge) {
          return edge.map(project);
        })
      };
    }
  };

  function subdivideFaces(n) {
    return d3.merge(faces.map(function(face) {
      var i01 = interpolate(face[0], face[1]),
          i02 = interpolate(face[0], face[2]),
          faces = [];

      faces.push([
        face[0],
        i01(1 / n),
        i02(1 / n)
      ]);

      for (var i = 1; i < n; ++i) {
        var i1 = interpolate(i01(i / n), i02(i / n)),
            i2 = interpolate(i01((i + 1) / n), i02((i + 1) / n));
        for (var j = 0; j <= i; ++j) {
          faces.push([
            i1(j / i),
            i2(j / (i + 1)),
            i2((j + 1) / (i + 1))
          ]);
        }
        for (var j = 0; j < i; ++j) {
          faces.push([
            i1(j / i),
            i2((j + 1) / (i + 1)),
            i1((j + 1) / i)
          ]);
        }
      }

      return faces;
    }));
  }

  function subdivideEdges(n) {
    var edges = {};

    subdivideFaces(n).forEach(function(face) {
      add(face[0], face[1]);
      add(face[1], face[2]);
      add(face[2], face[0]);
    });

    function add(p0, p1) {
      var t;
      if (p0[0] < p1[0] || (p0[0] == p1[0] && (p0[1] < p1[1] || (p0[1] == p1[1] && p0[2] < p1[2])))) t = p0, p0 = p1, p1 = t;
      edges[p0.map(round) + " " + p1.map(round)] = [p0, p1];
    }

    function round(d) {
      return d3.round(d, 4);
    }

    return d3.values(edges);
  }

  function interpolate(p0, p1) {
    var x0 = p0[0],
        y0 = p0[1],
        z0 = p0[2],
        x1 = p1[0] - x0,
        y1 = p1[1] - y0,
        z1 = p1[2] - z0;
    return function(t) {
      return [
        x0 + t * x1,
        y0 + t * y1,
        z0 + t * z1
      ];
    };
  }

  function project(p) {
    var x = p[0],
        y = p[1],
        z = p[2];
    return [
      Math.atan2(y, x) * ρ,
      Math.acos(z / Math.sqrt(x * x + y * y + z * z)) * ρ - 90
    ];
  }
})();

(function() {

d3.geom.contour = function(grid, start) {
  var s = start || d3_geom_contourStart(grid), // starting point
      c = [],    // contour polygon
      x = s[0],  // current x position
      y = s[1],  // current y position
      dx = 0,    // next x direction
      dy = 0,    // next y direction
      pdx = NaN, // previous x direction
      pdy = NaN, // previous y direction
      i = 0;

  do {
    // determine marching squares index
    i = 0;
    if (grid(x-1, y-1)) i += 1;
    if (grid(x,   y-1)) i += 2;
    if (grid(x-1, y  )) i += 4;
    if (grid(x,   y  )) i += 8;

    // determine next direction
    if (i === 6) {
      dx = pdy === -1 ? -1 : 1;
      dy = 0;
    } else if (i === 9) {
      dx = 0;
      dy = pdx === 1 ? -1 : 1;
    } else {
      dx = d3_geom_contourDx[i];
      dy = d3_geom_contourDy[i];
    }

    // update contour polygon
    if (dx != pdx && dy != pdy) {
      c.push([x, y]);
      pdx = dx;
      pdy = dy;
    }

    x += dx;
    y += dy;
  } while (s[0] != x || s[1] != y);

  return c;
};

// lookup tables for marching directions
var d3_geom_contourDx = [1, 0, 1, 1,-1, 0,-1, 1,0, 0,0,0,-1, 0,-1,NaN],
    d3_geom_contourDy = [0,-1, 0, 0, 0,-1, 0, 0,1,-1,1,1, 0,-1, 0,NaN];

function d3_geom_contourStart(grid) {
  var x = 0,
      y = 0;

  // search for a starting point; begin at origin
  // and proceed along outward-expanding diagonals
  while (true) {
    if (grid(x,y)) {
      return [x,y];
    }
    if (x === 0) {
      x = y + 1;
      y = 0;
    } else {
      x = x - 1;
      y = y + 1;
    }
  }
}

})();

(function(d3) {
  d3.graph = function (graph) {
    var graph = graph ? graph : {},
        nodes = [],
        links = [];

    graph.description = function() {
      return "d3.graph with " + nodes.length + " nodes and " + links.length + " links";
    };

    graph.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return this;
    };

    graph.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return this;
    };

    graph.matrix = function(x) {
      if (!arguments.length) return d3.graph.listToMatrix(links);
      links = d3.graph.matrixToList(x);
      // TODO nodes
      return this;
    };

    return graph;
  };

  // http://opendatastructures.org/ods-cpp/12_1_Representing_Graph_Mat.html
  d3.graph.matrix = function(matrix) {
    var matrix = matrix ? matrix : [];
    
    var matrixObj = function(i,j) {
      return matrix[i][j];
    };

    matrixObj.description = function() {
      return "A " + matrix.length +
             " by " + matrix.length +
             " adjacency matrix";
    };

    matrixObj.data = matrixObj.matrix = function(x) {
      if (!arguments.length) return matrix;
      matrix = x;
      return this;
    };

    matrixObj.set = matrixObj.addEdge = function(i,j,value) {
      matrix[i][j] = value ? value : 1;
      return this;
    };

    matrixObj.remove = matrixObj.removeEdge = function(i,j) {
      matrix[i][j] = 0;
      return this;
    };

    matrixObj.has = matrixObj.hasEdge = function(i,j) {
      return !!matrix[i][j];
    };

    matrixObj.outE = matrixObj.outEdges = function(i) {
      var edges = [],
          n = matrix.length;
      var j = -1; while (++j < n) {
        if (matrix[i][j]) edges.push(j);
      }
      return edges;
    };

    matrixObj.inE =  matrixObj.inEdges = function(i) {
      var edges = [],
          n = matrix.length;
      var j = -1; while (++j < n) {
        if (matrix[j][i]) edges.push(j);
      }
      return edges;
    };

    return matrixObj;
  };

  d3.graph.listToMatrix = function(links) {
    var matrix = [],
        n = links.length,
        max = d3.max(links, function(d) {
          return d3.max([d.source, d.target]);
        });

    // zero matrix
    var i = -1; while (++i <= max) {
      matrix[i] = [];
      var j = -1; while (++j <= max) {
        matrix[i][j] = 0;
      }
    }

    i = -1; while (++i < n) {
      matrix[ links[i].source ][ links[i].target ] = links[i].value;
    }
    
    return matrix;
  };

  d3.graph.matrixToList = function(matrix) {
    var links = [],
        n = matrix.length;

    var i = -1; while (++i < n) {
      var j = -1; while (++j < n) {
        links.push({
          source: i,
          target: j,
          value: matrix[i][j]
        });
      }
    }

    return links;
  };


})(d3);

(function() {

d3.hexbin = function() {
  var width = 1,
      height = 1,
      r,
      x = d3_hexbinX,
      y = d3_hexbinY,
      dx,
      dy;

  function hexbin(points) {
    var binsById = {};

    points.forEach(function(point, i) {
      var py = y.call(hexbin, point, i) / dy, pj = Math.round(py),
          px = x.call(hexbin, point, i) / dx - (pj & 1 ? .5 : 0), pi = Math.round(px),
          py1 = py - pj;

      if (Math.abs(py1) * 3 > 1) {
        var px1 = px - pi,
            pi2 = pi + (px < pi ? -1 : 1) / 2,
            pj2 = pj + (py < pj ? -1 : 1),
            px2 = px - pi2,
            py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) pi = pi2 + (pj & 1 ? 1 : -1) / 2, pj = pj2;
      }

      var id = pi + "-" + pj, bin = binsById[id];
      if (bin) bin.push(point); else {
        bin = binsById[id] = [point];
        bin.i = pi;
        bin.j = pj;
        bin.x = (pi + (pj & 1 ? 1 / 2 : 0)) * dx;
        bin.y = pj * dy;
      }
    });

    return d3.values(binsById);
  }

  function hexagon(radius) {
    var x0 = 0, y0 = 0;
    return d3_hexbinAngles.map(function(angle) {
      var x1 = Math.sin(angle) * radius,
          y1 = -Math.cos(angle) * radius,
          dx = x1 - x0,
          dy = y1 - y0;
      x0 = x1, y0 = y1;
      return [dx, dy];
    });
  }

  hexbin.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return hexbin;
  };

  hexbin.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return hexbin;
  };

  hexbin.hexagon = function(radius) {
    if (arguments.length < 1) radius = r;
    return "m" + hexagon(radius).join("l") + "z";
  };

  hexbin.centers = function() {
    var centers = [];
    for (var y = 0, odd = false, j = 0; y < height + r; y += dy, odd = !odd, ++j) {
      for (var x = odd ? dx / 2 : 0, i = 0; x < width + dx / 2; x += dx, ++i) {
        var center = [x, y];
        center.i = i;
        center.j = j;
        centers.push(center);
      }
    }
    return centers;
  };

  hexbin.mesh = function() {
    var fragment = hexagon(r).slice(0, 4).join("l");
    return hexbin.centers().map(function(p) { return "M" + p + "m" + fragment; }).join("");
  };

  hexbin.size = function(_) {
    if (!arguments.length) return [width, height];
    width = +_[0], height = +_[1];
    return hexbin;
  };

  hexbin.radius = function(_) {
    if (!arguments.length) return r;
    r = +_;
    dx = r * 2 * Math.sin(Math.PI / 3);
    dy = r * 1.5;
    return hexbin;
  };

  return hexbin.radius(1);
};

var d3_hexbinAngles = d3.range(0, 2 * Math.PI, Math.PI / 3),
    d3_hexbinX = function(d) { return d[0]; },
    d3_hexbinY = function(d) { return d[1]; };

})();

d3.hive = {};

d3.hive.link = function() {
  var source = function(d) { return d.source; },
      target = function(d) { return d.target; },
      angle = function(d) { return d.angle; },
      startRadius = function(d) { return d.radius; },
      endRadius = startRadius,
      arcOffset = -Math.PI / 2;

  function link(d, i) {
    var s = node(source, this, d, i),
        t = node(target, this, d, i),
        x;
    if (t.a < s.a) x = t, t = s, s = x;
    if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
    var a1 = s.a + (t.a - s.a) / 3,
        a2 = t.a - (t.a - s.a) / 3;
    return s.r0 - s.r1 || t.r0 - t.r1
        ? "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
        + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
        + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
        + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
        + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        : "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
  }

  function node(method, thiz, d, i) {
    var node = method.call(thiz, d, i),
        a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
        r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
        r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
    return {r0: r0, r1: r1, a: a};
  }

  link.source = function(_) {
    if (!arguments.length) return source;
    source = _;
    return link;
  };

  link.target = function(_) {
    if (!arguments.length) return target;
    target = _;
    return link;
  };

  link.angle = function(_) {
    if (!arguments.length) return angle;
    angle = _;
    return link;
  };

  link.radius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = endRadius = _;
    return link;
  };

  link.startRadius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = _;
    return link;
  };

  link.endRadius = function(_) {
    if (!arguments.length) return endRadius;
    endRadius = _;
    return link;
  };

  return link;
};

(function() {
  d3.horizon = function() {
    var bands = 1, // between 1 and 5, typically
        mode = "offset", // or mirror
        area = d3.svg.area(),
        defined,
        x = d3_horizonX,
        y = d3_horizonY,
        width = 960,
        height = 40;

    var color = d3.scale.linear()
        .domain([-1, 0, 1])
        .range(["#d62728", "#fff", "#1f77b4"]);

    // For each small multiple…
    function horizon(g) {
      g.each(function(d) {
        var g = d3.select(this),
            xMin = Infinity,
            xMax = -Infinity,
            yMax = -Infinity,
            x0, // old x-scale
            y0, // old y-scale
            t0,
            id; // unique id for paths

        // Compute x- and y-values along with extents.
        var data = d.map(function(d, i) {
          var xv = x.call(this, d, i),
              yv = y.call(this, d, i);
          if (xv < xMin) xMin = xv;
          if (xv > xMax) xMax = xv;
          if (-yv > yMax) yMax = -yv;
          if (yv > yMax) yMax = yv;
          return [xv, yv];
        });

        // Compute the new x- and y-scales, and transform.
        var x1 = d3.scale.linear().domain([xMin, xMax]).range([0, width]),
            y1 = d3.scale.linear().domain([0, yMax]).range([0, height * bands]),
            t1 = d3_horizonTransform(bands, height, mode);

        // Retrieve the old scales, if this is an update.
        if (this.__chart__) {
          x0 = this.__chart__.x;
          y0 = this.__chart__.y;
          t0 = this.__chart__.t;
          id = this.__chart__.id;
        } else {
          x0 = x1.copy();
          y0 = y1.copy();
          t0 = t1;
          id = ++d3_horizonId;
        }

        // We'll use a defs to store the area path and the clip path.
        var defs = g.selectAll("defs")
            .data([null]);

        // The clip path is a simple rect.
        defs.enter().append("defs").append("clipPath")
            .attr("id", "d3_horizon_clip" + id)
          .append("rect")
            .attr("width", width)
            .attr("height", height);

        d3.transition(defs.select("rect"))
            .attr("width", width)
            .attr("height", height);

        // We'll use a container to clip all horizon layers at once.
        g.selectAll("g")
            .data([null])
          .enter().append("g")
            .attr("clip-path", "url(#d3_horizon_clip" + id + ")");

        // Instantiate each copy of the path with different transforms.
        var path = g.select("g").selectAll("path")
            .data(d3.range(-1, -bands - 1, -1).concat(d3.range(1, bands + 1)), Number);

        if (defined) area.defined(function(_, i) { return defined.call(this, d[i], i); });

        var d0 = area
            .x(function(d) { return x0(d[0]); })
            .y0(height * bands)
            .y1(function(d) { return height * bands - y0(d[1]); })
            (data);

        var d1 = area
            .x(function(d) { return x1(d[0]); })
            .y1(function(d) { return height * bands - y1(d[1]); })
            (data);

        path.enter().append("path")
            .style("fill", color)
            .attr("transform", t0)
            .attr("d", d0);

        d3.transition(path)
            .style("fill", color)
            .attr("transform", t1)
            .attr("d", d1);

        d3.transition(path.exit())
            .attr("transform", t1)
            .attr("d", d1)
            .remove();

        // Stash the new scales.
        this.__chart__ = {x: x1, y: y1, t: t1, id: id};
      });
    }

    horizon.bands = function(_) {
      if (!arguments.length) return bands;
      bands = +_;
      color.domain([-bands, 0, bands]);
      return horizon;
    };

    horizon.mode = function(_) {
      if (!arguments.length) return mode;
      mode = _ + "";
      return horizon;
    };

    horizon.colors = function(_) {
      if (!arguments.length) return color.range();
      color.range(_);
      return horizon;
    };

    horizon.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return horizon;
    };

    horizon.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return horizon;
    };

    horizon.width = function(_) {
      if (!arguments.length) return width;
      width = +_;
      return horizon;
    };

    horizon.height = function(_) {
      if (!arguments.length) return height;
      height = +_;
      return horizon;
    };

    horizon.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return horizon;
    };

    return d3.rebind(horizon, area, "interpolate", "tension");
  };

  var d3_horizonId = 0;

  function d3_horizonX(d) { return d[0]; }
  function d3_horizonY(d) { return d[1]; }

  function d3_horizonTransform(bands, h, mode) {
    return mode == "offset"
        ? function(d) { return "translate(0," + (d + (d < 0) - bands) * h + ")"; }
        : function(d) { return (d < 0 ? "scale(1,-1)" : "") + "translate(0," + (d - bands) * h + ")"; };
  }
})();

(function () {

    var ρ = Math.SQRT2,
        ρ2 = 2,
        ρ4 = 4;

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]
    d3.interpolateZoom = function (p0, p1) {
        var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
            ux1 = p1[0], uy1 = p1[1], w1 = p1[2];

        var dx = ux1 - ux0,
            dy = uy1 - uy0,
            d2 = dx * dx + dy * dy,
            d1 = Math.sqrt(d2),
            b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1),
            b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1),
            r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
            r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1),
            dr = r1 - r0,
            S = (dr || Math.log(w1 / w0)) / ρ;

        function interpolate(t) {
            var s = t * S;
            if (dr) {
                // General case.
                var coshr0 = cosh(r0),
                    u = w0 / (ρ2 * d1) * (coshr0 * tanh(ρ * s + r0) - sinh(r0));
                return [
                    ux0 + u * dx,
                    uy0 + u * dy,
                    w0 * coshr0 / cosh(ρ * s + r0)
                ];
            }
            // Special case for u0 ~= u1.
            return [
                ux0 + t * dx,
                uy0 + t * dy,
                w0 * Math.exp(ρ * s)
            ];
        }

        interpolate.duration = S * 1000;

        return interpolate;
    };

    function cosh(x) {
        return (Math.exp(x) + Math.exp(-x)) / 2;
    }

    function sinh(x) {
        return (Math.exp(x) - Math.exp(-x)) / 2;
    }

    function tanh(x) {
        return sinh(x) / cosh(x);
    }

})();

(function () {
    d3.jsonp = function (url, callback) {
        function rand() {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                c = '', i = -1;
            while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
            return c;
        }

        function create(url) {
            var e = url.match(/callback=d3.jsonp.(\w+)/),
                c = e ? e[1] : rand();
            d3.jsonp[c] = function (data) {
                callback(data);
                delete d3.jsonp[c];
                script.remove();
            };
            return 'd3.jsonp.' + c;
        }

        var cb = create(url),
            script = d3.select('head')
                .append('script')
                .attr('type', 'text/javascript')
                .attr('src', url.replace(/(\{|%7B)callback(\}|%7D)/, cb));
    };
})();
/*
 * This code is licensed under the MIT license.
 *
 * Copyright © 2013, iD authors.
 *
 * Portions copyright © 2011, Keith Cirkel
 * See https://github.com/keithamus/jwerty
 *
 */
(function () {
    d3.keybinding = function (namespace) {
        var bindings = [];

        function matches(binding, event) {
            for (var p in binding.event) {
                if (event[p] != binding.event[p])
                    return false;
            }

            return (!binding.capture) === (event.eventPhase !== Event.CAPTURING_PHASE);
        }

        function capture() {
            for (var i = 0; i < bindings.length; i++) {
                var binding = bindings[i];
                if (matches(binding, d3.event)) {
                    binding.callback();
                }
            }
        }

        function bubble() {
            var tagName = d3.select(d3.event.target).node().tagName;
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
                return;
            }
            capture();
        }

        function keybinding(selection) {
            selection = selection || d3.select(document);
            selection.on('keydown.capture' + namespace, capture, true);
            selection.on('keydown.bubble' + namespace, bubble, false);
            return keybinding;
        }

        keybinding.off = function (selection) {
            selection = selection || d3.select(document);
            selection.on('keydown.capture' + namespace, null);
            selection.on('keydown.bubble' + namespace, null);
            return keybinding;
        };

        keybinding.on = function (code, callback, capture) {
            var binding = {
                event: {
                    keyCode: 0,
                    shiftKey: false,
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false
                },
                capture: capture,
                callback: callback
            };

            code = code.toLowerCase().match(/(?:(?:[^+])+|\+\+|^\+$)/g);

            for (var i = 0; i < code.length; i++) {
                // Normalise matching errors
                if (code[i] === '++') code[i] = '+';

                if (code[i] in d3.keybinding.modifierCodes) {
                    binding.event[d3.keybinding.modifierProperties[d3.keybinding.modifierCodes[code[i]]]] = true;
                } else if (code[i] in d3.keybinding.keyCodes) {
                    binding.event.keyCode = d3.keybinding.keyCodes[code[i]];
                }
            }

            bindings.push(binding);

            return keybinding;
        };

        return keybinding;
    };

    (function () {
        d3.keybinding.modifierCodes = {
            // Shift key, ⇧
            '⇧': 16, shift: 16,
            // CTRL key, on Mac: ⌃
            '⌃': 17, ctrl: 17,
            // ALT key, on Mac: ⌥ (Alt)
            '⌥': 18, alt: 18, option: 18,
            // META, on Mac: ⌘ (CMD), on Windows (Win), on Linux (Super)
            '⌘': 91, meta: 91, cmd: 91, 'super': 91, win: 91
        };

        d3.keybinding.modifierProperties = {
            16: 'shiftKey',
            17: 'ctrlKey',
            18: 'altKey',
            91: 'metaKey'
        };

        d3.keybinding.keyCodes = {
            // Backspace key, on Mac: ⌫ (Backspace)
            '⌫': 8, backspace: 8,
            // Tab Key, on Mac: ⇥ (Tab), on Windows ⇥⇥
            '⇥': 9, '⇆': 9, tab: 9,
            // Return key, ↩
            '↩': 13, 'return': 13, enter: 13, '⌅': 13,
            // Pause/Break key
            'pause': 19, 'pause-break': 19,
            // Caps Lock key, ⇪
            '⇪': 20, caps: 20, 'caps-lock': 20,
            // Escape key, on Mac: ⎋, on Windows: Esc
            '⎋': 27, escape: 27, esc: 27,
            // Space key
            space: 32,
            // Page-Up key, or pgup, on Mac: ↖
            '↖': 33, pgup: 33, 'page-up': 33,
            // Page-Down key, or pgdown, on Mac: ↘
            '↘': 34, pgdown: 34, 'page-down': 34,
            // END key, on Mac: ⇟
            '⇟': 35, end: 35,
            // HOME key, on Mac: ⇞
            '⇞': 36, home: 36,
            // Insert key, or ins
            ins: 45, insert: 45,
            // Delete key, on Mac: ⌦ (Delete)
            '⌦': 46, del: 46, 'delete': 46,
            // Left Arrow Key, or ←
            '←': 37, left: 37, 'arrow-left': 37,
            // Up Arrow Key, or ↑
            '↑': 38, up: 38, 'arrow-up': 38,
            // Right Arrow Key, or →
            '→': 39, right: 39, 'arrow-right': 39,
            // Up Arrow Key, or ↓
            '↓': 40, down: 40, 'arrow-down': 40,
            // odities, printing characters that come out wrong:
            // Num-Multiply, or *
            '*': 106, star: 106, asterisk: 106, multiply: 106,
            // Num-Plus or +
            '+': 107, 'plus': 107,
            // Num-Subtract, or -
            '-': 109, subtract: 109,
            // Semicolon
            ';': 186, semicolon: 186,
            // = or equals
            '=': 187, 'equals': 187,
            // Comma, or ,
            ',': 188, comma: 188,
            //'-': 189, //???
            // Period, or ., or full-stop
            '.': 190, period: 190, 'full-stop': 190,
            // Slash, or /, or forward-slash
            '/': 191, slash: 191, 'forward-slash': 191,
            // Tick, or `, or back-quote
            '`': 192, tick: 192, 'back-quote': 192,
            // Open bracket, or [
            '[': 219, 'open-bracket': 219,
            // Back slash, or \
            '\\': 220, 'back-slash': 220,
            // Close backet, or ]
            ']': 221, 'close-bracket': 221,
            // Apostrophe, or Quote, or '
            '\'': 222, quote: 222, apostrophe: 222
        };

        // NUMPAD 0-9
        var i = 95, n = 0;
        while (++i < 106) {
            d3.keybinding.keyCodes['num-' + n] = i;
            ++n;
        }

        // 0-9
        i = 47;
        n = 0;
        while (++i < 58) {
            d3.keybinding.keyCodes[n] = i;
            ++n;
        }

        // F1-F25
        i = 111;
        n = 1;
        while (++i < 136) {
            d3.keybinding.keyCodes['f' + n] = i;
            ++n;
        }

        // a-z
        i = 64;
        while (++i < 91) {
            d3.keybinding.keyCodes[String.fromCharCode(i).toLowerCase()] = i;
        }
    })();
})();

(function () {

// Virtual rendering for rows taking up to 1e7px of vertical space.
// By Jason Davies, http://www.jasondavies.com/
    d3.longscroll = function () {
        var render = null,
            size = 0,
            position = 0,
            rowHeight = 20;

        function longscroll(g) {
            g.selectAll("div.before").data([0]).enter().append("div").attr("class", "before");
            var current = g.selectAll("div.current").data([0]);
            current.enter().append("div").attr("class", "current");
            g.selectAll("div.after").data([0]).enter().append("div").attr("class", "after");

            g.on("scroll.longscroll", function () {
                position = Math.floor(this.scrollTop / rowHeight);
                scroll(this.scrollTop);
            });

            scroll(0);
            g.each(function () {
                var g = d3.select(this);
                g.property("scrollTop", +g.select(".before").style("height").replace("px", ""));
            });

            function scroll(scrollTop) {
                g.each(function () {
                    this.scrollTop = scrollTop;
                    var g = d3.select(this),
                        rows = 1 + Math.ceil(this.clientHeight / rowHeight),
                        position0 = Math.max(0, Math.min(size - rows, position)),
                        position1 = position0 + rows;

                    g.select(".before").style("height", position0 * rowHeight + "px");
                    g.select(".after").style("height", (size - position1) * rowHeight + "px");

                    var div = g.select(".current").selectAll("div.row")
                        .data(d3.range(position0, Math.min(position1, size)), String);
                    div.enter().append("div")
                        .attr("class", "row");
                    div.exit().remove();
                    div.order().call(render);
                });
            }
        }

        longscroll.render = function (_) {
            return arguments.length ? (render = _, longscroll) : render;
        };

        longscroll.rowHeight = function (_) {
            return arguments.length ? (rowHeight = +_, longscroll) : rowHeight;
        };

        longscroll.position = function (_) {
            return arguments.length ? (position = +_, longscroll) : position;
        };

        longscroll.size = function (_) {
            return arguments.length ? (size = +_, longscroll) : size;
        };

        return longscroll;
    };

})();

(function () {

// Based on http://vis.stanford.edu/protovis/ex/qqplot.html
    d3.qq = function () {
        var width = 1,
            height = 1,
            duration = 0,
            domain = null,
            tickFormat = null,
            n = 100,
            x = qqX,
            y = qqY;

        // For each small multiple…
        function qq(g) {
            g.each(function (d, i) {
                var g = d3.select(this),
                    qx = qqQuantiles(n, x.call(this, d, i)),
                    qy = qqQuantiles(n, y.call(this, d, i)),
                    xd = domain && domain.call(this, d, i) || [d3.min(qx), d3.max(qx)], // new x-domain
                    yd = domain && domain.call(this, d, i) || [d3.min(qy), d3.max(qy)], // new y-domain
                    x0, // old x-scale
                    y0; // old y-scale

                // Compute the new x-scale.
                var x1 = d3.scale.linear()
                    .domain(xd)
                    .range([0, width]);

                // Compute the new y-scale.
                var y1 = d3.scale.linear()
                    .domain(yd)
                    .range([height, 0]);

                // Retrieve the old scales, if this is an update.
                if (this.__chart__) {
                    x0 = this.__chart__.x;
                    y0 = this.__chart__.y;
                } else {
                    x0 = d3.scale.linear().domain([0, Infinity]).range(x1.range());
                    y0 = d3.scale.linear().domain([0, Infinity]).range(y1.range());
                }

                // Stash the new scales.
                this.__chart__ = {x: x1, y: y1};

                // Update diagonal line.
                var diagonal = g.selectAll("line.diagonal")
                    .data([null]);

                diagonal.enter().append("svg:line")
                    .attr("class", "diagonal")
                    .attr("x1", x1(yd[0]))
                    .attr("y1", y1(xd[0]))
                    .attr("x2", x1(yd[1]))
                    .attr("y2", y1(xd[1]));

                diagonal.transition()
                    .duration(duration)
                    .attr("x1", x1(yd[0]))
                    .attr("y1", y1(xd[0]))
                    .attr("x2", x1(yd[1]))
                    .attr("y2", y1(xd[1]));

                // Update quantile plots.
                var circle = g.selectAll("circle")
                    .data(d3.range(n).map(function (i) {
                        return {x: qx[i], y: qy[i]};
                    }));

                circle.enter().append("svg:circle")
                    .attr("class", "quantile")
                    .attr("r", 4.5)
                    .attr("cx", function (d) {
                        return x0(d.x);
                    })
                    .attr("cy", function (d) {
                        return y0(d.y);
                    })
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(duration)
                    .attr("cx", function (d) {
                        return x1(d.x);
                    })
                    .attr("cy", function (d) {
                        return y1(d.y);
                    })
                    .style("opacity", 1);

                circle.transition()
                    .duration(duration)
                    .attr("cx", function (d) {
                        return x1(d.x);
                    })
                    .attr("cy", function (d) {
                        return y1(d.y);
                    })
                    .style("opacity", 1);

                circle.exit().transition()
                    .duration(duration)
                    .attr("cx", function (d) {
                        return x1(d.x);
                    })
                    .attr("cy", function (d) {
                        return y1(d.y);
                    })
                    .style("opacity", 1e-6)
                    .remove();

                var xformat = tickFormat || x1.tickFormat(4),
                    yformat = tickFormat || y1.tickFormat(4),
                    tx = function (d) {
                        return "translate(" + x1(d) + "," + height + ")";
                    },
                    ty = function (d) {
                        return "translate(0," + y1(d) + ")";
                    };

                // Update x-ticks.
                var xtick = g.selectAll("g.x.tick")
                    .data(x1.ticks(4), function (d) {
                        return this.textContent || xformat(d);
                    });

                var xtickEnter = xtick.enter().append("svg:g")
                    .attr("class", "x tick")
                    .attr("transform", function (d) {
                        return "translate(" + x0(d) + "," + height + ")";
                    })
                    .style("opacity", 1e-6);

                xtickEnter.append("svg:line")
                    .attr("y1", 0)
                    .attr("y2", -6);

                xtickEnter.append("svg:text")
                    .attr("text-anchor", "middle")
                    .attr("dy", "1em")
                    .text(xformat);

                // Transition the entering ticks to the new scale, x1.
                xtickEnter.transition()
                    .duration(duration)
                    .attr("transform", tx)
                    .style("opacity", 1);

                // Transition the updating ticks to the new scale, x1.
                xtick.transition()
                    .duration(duration)
                    .attr("transform", tx)
                    .style("opacity", 1);

                // Transition the exiting ticks to the new scale, x1.
                xtick.exit().transition()
                    .duration(duration)
                    .attr("transform", tx)
                    .style("opacity", 1e-6)
                    .remove();

                // Update ticks.
                var ytick = g.selectAll("g.y.tick")
                    .data(y1.ticks(4), function (d) {
                        return this.textContent || yformat(d);
                    });

                var ytickEnter = ytick.enter().append("svg:g")
                    .attr("class", "y tick")
                    .attr("transform", function (d) {
                        return "translate(0," + y0(d) + ")";
                    })
                    .style("opacity", 1e-6);

                ytickEnter.append("svg:line")
                    .attr("x1", 0)
                    .attr("x2", 6);

                ytickEnter.append("svg:text")
                    .attr("text-anchor", "end")
                    .attr("dx", "-.5em")
                    .attr("dy", ".3em")
                    .text(yformat);

                // Transition the entering ticks to the new scale, y1.
                ytickEnter.transition()
                    .duration(duration)
                    .attr("transform", ty)
                    .style("opacity", 1);

                // Transition the updating ticks to the new scale, y1.
                ytick.transition()
                    .duration(duration)
                    .attr("transform", ty)
                    .style("opacity", 1);

                // Transition the exiting ticks to the new scale, y1.
                ytick.exit().transition()
                    .duration(duration)
                    .attr("transform", ty)
                    .style("opacity", 1e-6)
                    .remove();
            });
        }

        qq.width = function (x) {
            if (!arguments.length) return width;
            width = x;
            return qq;
        };

        qq.height = function (x) {
            if (!arguments.length) return height;
            height = x;
            return qq;
        };

        qq.duration = function (x) {
            if (!arguments.length) return duration;
            duration = x;
            return qq;
        };

        qq.domain = function (x) {
            if (!arguments.length) return domain;
            domain = x == null ? x : d3.functor(x);
            return qq;
        };

        qq.count = function (z) {
            if (!arguments.length) return n;
            n = z;
            return qq;
        };

        qq.x = function (z) {
            if (!arguments.length) return x;
            x = z;
            return qq;
        };

        qq.y = function (z) {
            if (!arguments.length) return y;
            y = z;
            return qq;
        };

        qq.tickFormat = function (x) {
            if (!arguments.length) return tickFormat;
            tickFormat = x;
            return qq;
        };

        return qq;
    };

    function qqQuantiles(n, values) {
        var m = values.length - 1;
        values = values.slice().sort(d3.ascending);
        return d3.range(n).map(function (i) {
            return values[~~(i * m / n)];
        });
    }

    function qqX(d) {
        return d.x;
    }

    function qqY(d) {
        return d.y;
    }

})();

(function() {
    d3.rollup = function () {
        var directed = true,
            x_ = rollupX,
            y_ = rollupY,
            nodes_ = rollupNodes,
            links_ = rollupLinks,
            linkValue = rollupLinkValue,
            linkSource = rollupLinkSource,
            linkTarget = rollupLinkTarget;

        function rollup(d, i) {
            var nodes = nodes_.call(this, d, i),
                links = links_.call(this, d, i),
                n = nodes.length,
                m = links.length,
                i = -1,
                x = [],
                y = [],
                rnindex = 0,
                rnodes = {},
                rlinks = {};

            // Compute rollup nodes.
            while (++i < n) {
                (d = nodes[i]).index = i;
                x[i] = x_.call(this, d, i);
                y[i] = y_.call(this, d, i);
                var nodeId = id(i),
                    rn = rnodes[nodeId];
                if (!rn) {
                    rn = rnodes[nodeId] = {
                        index: rnindex++,
                        x: x[i],
                        y: y[i],
                        nodes: []
                    };
                }
                rn.nodes.push(d);
            }

            // Compute rollup links.
            i = -1;
            while (++i < m) {
                var value = linkValue.call(this, d = links[i], i),
                    source = linkSource.call(this, d, i),
                    target = linkTarget.call(this, d, i),
                    rsource = rnodes[id(typeof source === "number" ? source : source.index)],
                    rtarget = rnodes[id(typeof target === "number" ? target : target.index)],
                    linkId = !directed && rsource.index > rtarget.index
                        ? rtarget.index + "," + rsource.index
                        : rsource.index + "," + rtarget.index,
                    rl = rlinks[linkId];
                if (!rl) {
                    rl = rlinks[linkId] = {
                        source: rsource,
                        target: rtarget,
                        value: 0,
                        links: []
                    };
                }
                rl.links.push(links[i]);
                rl.value += value;
            }

            return {
                nodes: d3.values(rnodes),
                links: d3.values(rlinks)
            };

            function id(i) {
                return x[i] + "," + y[i];
            }
        }

        rollup.x = function (x) {
            if (!arguments.length) return x_;
            x_ = x;
            return rollup;
        };

        rollup.y = function (x) {
            if (!arguments.length) return y_;
            y_ = x;
            return rollup;
        };

        rollup.nodes = function (x) {
            if (!arguments.length) return nodes_;
            nodes_ = x;
            return rollup;
        };

        rollup.links = function (x) {
            if (!arguments.length) return links_;
            links_ = x;
            return rollup;
        };

        rollup.linkSource = function (x) {
            if (!arguments.length) return linkSource;
            linkSource = x;
            return rollup;
        };

        rollup.linkTarget = function (x) {
            if (!arguments.length) return linkTarget;
            linkTarget = x;
            return rollup;
        };

        rollup.linkValue = function (x) {
            if (!arguments.length) return linkValue;
            linkValue = x;
            return rollup;
        };

        rollup.directed = function (x) {
            if (!arguments.length) return directed;
            directed = x;
            return rollup;
        };

        return rollup;

        function rollupX(d) {
            return d.x;
        }

        function rollupY(d) {
            return d.y;
        }

        function rollupNodes(d) {
            return d.nodes;
        }

        function rollupLinks(d) {
            return d.links;
        }

        function rollupLinkValue(d) {
            return 1;
        }

        function rollupLinkSource(d) {
            return d.source;
        }

        function rollupLinkTarget(d) {
            return d.target;
        }
    };
})();

(function () {
    d3.sankey = function () {
        var sankey = {},
            nodeWidth = 24,
            nodePadding = 8,
            size = [1, 1],
            nodes = [],
            links = [];

        sankey.nodeWidth = function (_) {
            if (!arguments.length) return nodeWidth;
            nodeWidth = +_;
            return sankey;
        };

        sankey.nodePadding = function (_) {
            if (!arguments.length) return nodePadding;
            nodePadding = +_;
            return sankey;
        };

        sankey.nodes = function (_) {
            if (!arguments.length) return nodes;
            nodes = _;
            return sankey;
        };

        sankey.links = function (_) {
            if (!arguments.length) return links;
            links = _;
            return sankey;
        };

        sankey.size = function (_) {
            if (!arguments.length) return size;
            size = _;
            return sankey;
        };

        sankey.layout = function (iterations) {
            computeNodeLinks();
            computeNodeValues();
            computeNodeBreadths();
            computeNodeDepths(iterations);
            computeLinkDepths();
            return sankey;
        };

        sankey.relayout = function () {
            computeLinkDepths();
            return sankey;
        };

        sankey.relayoutWithNodes = function (node) {
            computeNodeDepths(1);
            computeLinkDepths();
            return sankey;
        };

        sankey.link = function () {
            var curvature = .5;

            function link(d) {
                var x0 = d.sourceNode.x + d.sourceNode.dx,
                    x1 = d.targetNode.x,
                    xi = d3.interpolateNumber(x0, x1),
                    x2 = xi(curvature),
                    x3 = xi(1 - curvature),
                    y0 = d.sourceNode.y + d.sy + d.dy / 2,
                    y1 = d.targetNode.y + d.ty + d.dy / 2;
                return "M" + x0 + "," + y0
                    + "C" + x2 + "," + y0
                    + " " + x3 + "," + y1
                    + " " + x1 + "," + y1;
            }

            link.curvature = function (_) {
                if (!arguments.length) return curvature;
                curvature = +_;
                return link;
            };

            return link;
        };

        // Populate the sourceLinks and targetLinks for each node.
        // Also, if the source and target are not objects, assume they are indices.
        function computeNodeLinks() {
            nodes.forEach(function (node) {
                node.sourceLinks = [];
                node.targetLinks = [];
            });
            links.forEach(function (link) {
                var sourceNode = link.sourceNode = nodes[link.source],
                    targetNode = link.targetNode = nodes[link.target];

                sourceNode.sourceLinks.push(link);
                targetNode.targetLinks.push(link);
            });
        }

        // Compute the value (size) of each node by summing the associated links.
        function computeNodeValues() {
            nodes.forEach(function (node) {
                node.value = Math.max(
                    d3.sum(node.sourceLinks, value),
                    d3.sum(node.targetLinks, value)
                );

                // compute the ratio of outgoing flow and node's value
                node.ratio = Math.round(100 * d3.sum(node.sourceLinks, value) / node.value);
            });
        }

        // Iteratively assign the breadth (x-position) for each node.
        // Nodes are assigned the maximum breadth of incoming neighbors plus one;
        // nodes with no incoming links are assigned breadth zero, while
        // nodes with no outgoing links are assigned the maximum breadth.
        function computeNodeBreadths() {
            var remainingNodes = nodes,
                nextNodes,
                x = 0;

            while (remainingNodes.length) {
                nextNodes = [];
                remainingNodes.forEach(function (node) {
                    node.x = x;
                    node.dx = nodeWidth;
                    node.sourceLinks.forEach(function (link) {
                        if (nextNodes.indexOf(link.targetNode) < 0) {
                            nextNodes.push(link.targetNode);
                        }
                    });
                });
                remainingNodes = nextNodes;
                ++x;
            }

            //
            moveSinksRight(x);
            scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
        }

        function moveSourcesRight() {
            nodes.forEach(function (node) {
                if (!node.targetLinks.length) {
                    node.x = d3.min(node.sourceLinks, function (d) {
                            return d.targetNode.x;
                        }) - 1;
                }
            });
        }

        function moveSinksRight(x) {
            nodes.forEach(function (node) {
                if (!node.sourceLinks.length) {
                    node.x = x - 1;
                }
            });
        }

        function scaleNodeBreadths(kx) {
            nodes.forEach(function (node) {
                node.x *= kx;
            });
        }

        function computeNodeDepths(iterations) {
            var nodesByBreadth = d3.nest()
                .key(function (d) {
                    return d.x;
                })
                .sortKeys(d3.ascending)
                .entries(nodes)
                .map(function (d) {
                    return d.values;
                });

            //
            initializeNodeDepth();
            resolveCollisions();
            for (var alpha = 1; iterations > 0; --iterations) {
                relaxRightToLeft(alpha *= .99);
                resolveCollisions();
                relaxLeftToRight(alpha);
                resolveCollisions();
            }

            function initializeNodeDepth() {
                var ky = d3.min(nodesByBreadth, function (nodes) {
                    return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
                });

                nodesByBreadth.forEach(function (nodes) {
                    nodes.forEach(function (node, i) {
                        node.y = i;
                        node.dy = node.value * ky;
                    });
                });

                links.forEach(function (link) {
                    link.dy = link.value * ky;
                });
            }

            function relaxLeftToRight(alpha) {
                nodesByBreadth.forEach(function (nodes, breadth) {
                    nodes.forEach(function (node) {
                        if (node.targetLinks.length) {
                            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
                            node.y += (y - center(node)) * alpha;
                        }
                    });
                });

                function weightedSource(link) {
                    return center(link.sourceNode) * link.value;
                }
            }

            function relaxRightToLeft(alpha) {
                nodesByBreadth.slice().reverse().forEach(function (nodes) {
                    nodes.forEach(function (node) {
                        if (node.sourceLinks.length) {
                            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
                            node.y += (y - center(node)) * alpha;
                        }
                    });
                });

                function weightedTarget(link) {
                    return center(link.targetNode) * link.value;
                }
            }

            function resolveCollisions() {
                nodesByBreadth.forEach(function (nodes) {
                    var node,
                        dy,
                        y0 = 0,
                        n = nodes.length,
                        i;

                    // Push any overlapping nodes down.
                    nodes.sort(ascendingDepth);
                    for (i = 0; i < n; ++i) {
                        node = nodes[i];
                        dy = y0 - node.y;
                        if (dy > 0) node.y += dy;
                        y0 = node.y + node.dy + nodePadding;

                        node.y = Math.round(node.y);
                        node.dy = Math.round(node.dy);
                    }

                    // If the bottommost node goes outside the bounds, push it back up.
                    dy = y0 - nodePadding - size[1];
                    if (dy > 0) {
                        y0 = node.y -= dy;

                        // Push any overlapping nodes back up.
                        for (i = n - 2; i >= 0; --i) {
                            node = nodes[i];
                            dy = node.y + node.dy + nodePadding - y0;
                            if (dy > 0) node.y -= dy;
                            y0 = node.y;
                        }
                    }
                });
            }

            function ascendingDepth(a, b) {
                return a.y - b.y;
            }
        }

        function computeLinkDepths() {
            nodes.forEach(function (node) {
                node.sourceLinks.sort(ascendingTargetDepth);
                node.targetLinks.sort(ascendingSourceDepth);
            });
            nodes.forEach(function (node) {
                var sy = 0, ty = 0;
                node.sourceLinks.forEach(function (link) {
                    link.sy = sy;
                    sy += link.dy;
                });
                node.targetLinks.forEach(function (link) {
                    link.ty = ty;
                    ty += link.dy;
                });
            });

            function ascendingSourceDepth(a, b) {
                return a.sourceNode.y - b.sourceNode.y;
            }

            function ascendingTargetDepth(a, b) {
                return a.targetNode.y - b.targetNode.y;
            }
        }

        function center(node) {
            return node.y + node.dy / 2;
        }

        function value(link) {
            return link.value;
        }

        return sankey;
    };
})();

(function() {
  var _symbol = d3.svg.symbol(),
      _line = d3.svg.line();

  d3.superformula = function() {
    var type = _symbol.type(),
        size = _symbol.size(),
        segments = size,
        params = {};

    function superformula(d, i) {
      var n, p = _superformulaTypes[type.call(this, d, i)];
      for (n in params) p[n] = params[n].call(this, d, i);
      return _superformulaPath(p, segments.call(this, d, i), Math.sqrt(size.call(this, d, i)));
    }

    superformula.type = function(x) {
      if (!arguments.length) return type;
      type = d3.functor(x);
      return superformula;
    };

    superformula.param = function(name, value) {
      if (arguments.length < 2) return params[name];
      params[name] = d3.functor(value);
      return superformula;
    };

    // size of superformula in square pixels
    superformula.size = function(x) {
      if (!arguments.length) return size;
      size = d3.functor(x);
      return superformula;
    };

    // number of discrete line segments
    superformula.segments = function(x) {
      if (!arguments.length) return segments;
      segments = d3.functor(x);
      return superformula;
    };

    return superformula;
  };

  function _superformulaPath(params, n, diameter) {
    var i = -1,
        dt = 2 * Math.PI / n,
        t,
        r = 0,
        x,
        y,
        points = [];

    while (++i < n) {
      t = params.m * (i * dt - Math.PI) / 4;
      t = Math.pow(Math.abs(Math.pow(Math.abs(Math.cos(t) / params.a), params.n2)
        + Math.pow(Math.abs(Math.sin(t) / params.b), params.n3)), -1 / params.n1);
      if (t > r) r = t;
      points.push(t);
    }

    r = diameter * Math.SQRT1_2 / r;
    i = -1; while (++i < n) {
      x = (t = points[i] * r) * Math.cos(i * dt);
      y = t * Math.sin(i * dt);
      points[i] = [Math.abs(x) < 1e-6 ? 0 : x, Math.abs(y) < 1e-6 ? 0 : y];
    }

    return _line(points) + "Z";
  }

  var _superformulaTypes = {
    asterisk: {m: 12, n1: .3, n2: 0, n3: 10, a: 1, b: 1},
    bean: {m: 2, n1: 1, n2: 4, n3: 8, a: 1, b: 1},
    butterfly: {m: 3, n1: 1, n2: 6, n3: 2, a: .6, b: 1},
    circle: {m: 4, n1: 2, n2: 2, n3: 2, a: 1, b: 1},
    clover: {m: 6, n1: .3, n2: 0, n3: 10, a: 1, b: 1},
    cloverFour: {m: 8, n1: 10, n2: -1, n3: -8, a: 1, b: 1},
    cross: {m: 8, n1: 1.3, n2: .01, n3: 8, a: 1, b: 1},
    diamond: {m: 4, n1: 1, n2: 1, n3: 1, a: 1, b: 1},
    drop: {m: 1, n1: .5, n2: .5, n3: .5, a: 1, b: 1},
    ellipse: {m: 4, n1: 2, n2: 2, n3: 2, a: 9, b: 6},
    gear: {m: 19, n1: 100, n2: 50, n3: 50, a: 1, b: 1},
    heart: {m: 1, n1: .8, n2: 1, n3: -8, a: 1, b: .18},
    heptagon: {m: 7, n1: 1000, n2: 400, n3: 400, a: 1, b: 1},
    hexagon: {m: 6, n1: 1000, n2: 400, n3: 400, a: 1, b: 1},
    malteseCross: {m: 8, n1: .9, n2: .1, n3: 100, a: 1, b: 1},
    pentagon: {m: 5, n1: 1000, n2: 600, n3: 600, a: 1, b: 1},
    rectangle: {m: 4, n1: 100, n2: 100, n3: 100, a: 2, b: 1},
    roundedStar: {m: 5, n1: 2, n2: 7, n3: 7, a: 1, b: 1},
    square: {m: 4, n1: 100, n2: 100, n3: 100, a: 1, b: 1},
    star: {m: 5, n1: 30, n2: 100, n3: 100, a: 1, b: 1},
    triangle: {m: 3, n1: 100, n2: 200, n3: 200, a: 1, b: 1}
  };

  d3.superformulaTypes = d3.keys(_superformulaTypes);
})();

(function() {
  d3.urlencode = function(name, value) {
    var array = [];
    d3_arraySubclass(array, d3_urlencodePrototype);
    return arguments.length ? array.and(name, value) : array;
  };

  d3.urlencode.type = "application/x-www-form-urlencoded;charset=utf-8";

  var d3_arraySubclass = [].__proto__?

  // Until ECMAScript supports array subclassing, prototype injection works well.
  function(array, prototype) {
    array.__proto__ = prototype;
  }:

  // And if your browser doesn't support __proto__, we'll use direct extension.
  function(array, prototype) {
    for (var property in prototype) array[property] = prototype[property];
  };

  var d3_urlencodePrototype = d3.urlencode.prototype = [];

  d3_urlencodePrototype.and = function(name, value) {
    name = d3_urlencode(name);
    this.push(value == null ? name : name + "=" + d3_urlencode(value));
    return this;
  };

  d3_urlencodePrototype.toString = function() {
    return this.join("&");
  };

  function d3_urlencode(value) {
    return encodeURIComponent(value).replace(/%20/g, "+");
  }
})();
