"use client";

import { useEffect, useState, useRef } from "react";

import { usePresenceWithCursors } from "./presence/use-cursors";

import * as d3 from "d3";
import { Delaunay } from "d3-delaunay";

type Point = [number, number, string]; // [x, y, id]

const SPILL = 40;

function Diagram(props: {
  svgRef: React.RefObject<SVGSVGElement>;
  containerDimensions: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}) {
  const { myId, myself, otherUsers } = usePresenceWithCursors((state) => ({
    myId: state.myId,
    myself: state.myself,
    otherUsers: state.otherUsers,
  }));
  const [points, setPoints] = useState<Point[]>([]);
  const { svgRef, containerDimensions } = props;
  const [svgPath, setSvgPath] = useState<string>("");

  useEffect(() => {
    const points: Point[] = [];

    // Build the list of points from the other users
    Array.from(otherUsers.entries()).map(([id, user]) => {
      //console.log("building");
      if (!user.presence.cursor) return;

      const x = user.presence.cursor.x - containerDimensions.left;
      const y = user.presence.cursor.y - containerDimensions.top;
      if (x < -SPILL || x > containerDimensions.width + SPILL) return;
      if (y < -SPILL || y > containerDimensions.height + SPILL) return;

      points.push([x, y, id]);
    });

    // If there aren't any other points, put a virtual point in the center of the window so the user has something to play with
    if (points.length < 1) {
      points.push([
        containerDimensions.width / 2,
        containerDimensions.height / 2,
        "dummy-08",
      ] as Point);
    }

    // Add the current users to the lists
    if (myself?.presence.cursor) {
      const x = myself.presence.cursor.x - containerDimensions.left;
      const y = myself.presence.cursor.y - containerDimensions.top;

      if (
        !(
          x < -SPILL ||
          x > containerDimensions.width + SPILL ||
          y < -SPILL ||
          y > containerDimensions.height + SPILL
        )
      ) {
        const id = "self-08"; // don't use myId so we can control the color
        points.push([x, y, id] as Point);
      }
    }
    setPoints(points);
  }, [otherUsers, myId, myself, containerDimensions]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .attr("width", containerDimensions.width)
      .attr("height", containerDimensions.height);
    svg.attr(
      "viewBox",
      `0 0 ${containerDimensions.width} ${containerDimensions.height}`,
    );

    // @ts-expect-error it's fine, we're passing an array
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([
      0,
      0,
      containerDimensions.width,
      containerDimensions.height,
    ]);

    /*const pattern = (i: number) => {
      return i % 2 === 0
        ? "url(#diagonal-stripe-1)"
        : "url(#diagonal-stripe-4)";
    };*/

    function stringToHash(str: string): number {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    // Go from a connection string id to a pastel color
    // The trick is to work in HSL, fixing S and L, and using i to pick a hue
    // Then convert back to RGB hex
    const pastel = (id: string) => {
      const hash = stringToHash(id);
      // OFFSET is a magic number. Adjust this such that the colour for the zeroth connection
      // (called "dummy" above) and first human connection is pleasing
      const OFFSET = 7;
      const hue = ((Math.abs(hash) + OFFSET) * 137.508) % 360;
      return d3.hsl(hue, 0.5, 0.8).formatHex();
    };

    svg
      .selectAll("path")
      // Construct a data object from each cell of our voronoi diagram
      .data(points.map((d, i) => ({ cell: voronoi.renderCell(i), point: d })))
      .join("path")
      .attr("d", (d) => d.cell)
      .style("fill", (d) => pastel(d.point[2]))
      .style("opacity", 0.8)
      .style("stroke", "white")
      .style("stroke-opacity", 0.9);

    const svgPath = voronoi.render();
    setSvgPath(svgPath);
  }, [points, svgRef, containerDimensions]);

  if (!svgRef.current) return null;

  return <path d={svgPath} fill="none" stroke="black" />;
}

export default function Voronoi() {
  const [containerDimensions, setContainerDimensions] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const svgParentRef = useRef<HTMLDivElement>(null);

  const count = usePresenceWithCursors(
    (state) =>
      Array.from(state.otherUsers.values()).filter(
        (user) => user.presence?.cursor,
      ).length + (state.myself?.presence?.cursor ? 1 : 0),
  );

  useEffect(() => {
    const onResize = () => {
      if (!svgParentRef.current) return;
      const rect = svgParentRef.current.getBoundingClientRect();
      setContainerDimensions({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /*useEffect(() => {
    // Add the class 'overflow-hidden' on body to prevent scrolling
    document.body.classList.add("overflow-hidden");
    // Scroll to top
    window.scrollTo(0, 0);
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);*/

  //const count = Object.keys(others).length + (self ? 1 : 0);
  //const count = 0;

  return (
    <div
      ref={svgParentRef}
      style={{
        width: "100%",
        height: "100%",
        display: "absolute",
      }}
    >
      {count > 0 && (
        <div className="absolute pt-20 md:pt-16 right-2 pointer-events-none flex items-center">
          <span className="text-2xl">{count}&times;</span>
          <span className="text-5xl">🎈</span>
        </div>
      )}
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <pattern
            id="diagonal-stripe-1"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <image
              xlinkHref="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+Cg=="
              x="0"
              y="0"
              width="10"
              height="10"
            ></image>
          </pattern>
          <pattern
            id="diagonal-stripe-4"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
          >
            <image
              xlinkHref="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSdibGFjaycvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3doaXRlJyBzdHJva2Utd2lkdGg9JzMnLz4KPC9zdmc+"
              x="0"
              y="0"
              width="10"
              height="10"
            ></image>
          </pattern>
        </defs>
        {containerDimensions.width > 0 && (
          <Diagram svgRef={svgRef} containerDimensions={containerDimensions} />
        )}
      </svg>
    </div>
  );
}
