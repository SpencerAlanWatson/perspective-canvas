(function () {
	'use strict';

	function P(x, y) {
		return {
			x: x,
			y: y
		};
	}

	function GetDistance(origin, point) {
		return Math.sqrt(Math.pow(point.x - origin.x, 2) + Math.pow(point.y - origin.y, 2));
	}

	function FindIntersection(p1, p2, p3, p4) {
		var a1 = p2.y - p1.y;
		var a2 = p4.y - p3.y;

		var b1 = p1.x - p2.x;
		var b2 = p3.x - p4.x;

		var c1 = a1 * p1.x + b1 * p1.y;
		var c2 = a2 * p3.x + b2 * p3.y;

		var det = a1 * b2 - a2 * b1;
		if (det == 0) {
			//Lines are Parallel

		} else {
			var x = (b2 * c1 - b1 * c2) / det;
			var y = (a1 * c2 - a2 * c1) / det;
			return P(x, y);
		}
	}

	function GetNormal(p) {
		var length = Math.sqrt((p.x * p.x) + (p.y * p.y));
		return P(p.x / length, p.y / length);
	}

	function GetAngle(p1, p2) {
		return Math.atan2(p2.y - p1.y, p2.x - p1.x);
	}

	function Draw1PointPerSq(length, points, vp) {

		var farIndices = [0],
			closeIndex = 0,
			maxDist = -1,
			minDist = Infinity,
			objs = [];
		var obj1 = [];
		points.forEach(function (point, index) {
			var dist = GetDistance(vp, point);
			if (dist > maxDist) {
				farIndices = [index];
				maxDist = dist;

			} else if (dist === maxDist) {
				farIndices.push(index);
			}
			if (dist < minDist) {
				closeIndex = index;
				minDist = dist;
			}
			obj1.push(point);
		});
		objs.push(obj1);

		var obj2 = [];

		var prevIndex = closeIndex === 0 ? 3 : closeIndex - 1;
		var nextIndex = closeIndex === 3 ? 0 : closeIndex + 1;
		if (farIndices.indexOf(prevIndex) === -1) {
			var closePoint = points[closeIndex];
			var prevPoint = points[prevIndex];



			var angle = GetAngle(closePoint, prevPoint);

			var line = P(Math.cos(angle) * length.x, Math.sin(angle) * length.y);

			var closeNormal = GetNormal(P(vp.x - closePoint.x, vp.y - closePoint.y));
			var closeEndPoint = P(closeNormal.x * length.x + closePoint.x, closeNormal.y * length.y + closePoint.y);

			var prevNormal = GetNormal(P(vp.x - prevPoint.x, vp.y - prevPoint.y));
			var prevEndPoint = P(prevNormal.x * length.x + prevPoint.x, prevNormal.y * length.y + prevPoint.y);

			obj2.push(closePoint);
			obj2.push(closeEndPoint);
			var connectPoint = P(line.x + closeEndPoint.x, line.y + closeEndPoint.y);

			var intersection = FindIntersection(connectPoint, closeEndPoint, vp, prevEndPoint);
			if (intersection !== undefined) {
				obj2.push(intersection);
				obj2.push(prevPoint);
				objs.push(obj2);

			}
		}
		var obj3 = [];
		if (farIndices.indexOf(nextIndex) === -1) {
			var closePoint = points[closeIndex];
			var nextPoint = points[nextIndex];

			var angle = GetAngle(closePoint, nextPoint);

			var line = P(Math.cos(angle) * length.x, Math.sin(angle) * length.y);

			var closeNormal = GetNormal(P(vp.x - closePoint.x, vp.y - closePoint.y));
			var closeEndPoint = P(closeNormal.x * length.x + closePoint.x, closeNormal.y * length.y + closePoint.y);

			var nextNormal = GetNormal(P(vp.x - nextPoint.x, vp.y - nextPoint.y));
			var nextEndPoint = P(nextNormal.x * length.x + nextPoint.x, nextNormal.y * length.y + nextPoint.y);

			obj3.push(closePoint);
			obj3.push(closeEndPoint);

			var connectPoint = P(line.x + closeEndPoint.x, line.y + closeEndPoint.y);


			var intersection = FindIntersection(connectPoint, closeEndPoint, vp, nextEndPoint);
			if (intersection !== undefined) {
				obj3.push(intersection);
				obj3.push(nextPoint);
				objs.push(obj3);

			}
		}

		return objs;
	}

	function Draw2PointPerSq(length, p1, p2, vp1, vp2) {
		var objs = [];
		var angle = GetAngle(p1, p2);

		var normal = GetNormal(P(vp1.x - p1.x, vp1.y - p1.y));
		var end1 = P(normal.x * length.x + p1.x, normal.y * length.y + p1.y);

		normal = GetNormal(P(vp1.x - p2.x, vp1.y - p2.y));
		var end2 = P(normal.x * length.x + p2.x, normal.y * length.y + p2.y);

		objs.push([p1, p2, end2, end1]);

		normal = GetNormal(P(vp2.x - p1.x, vp2.y - p1.y));
		var end3 = P(normal.x * length.x + p1.x, normal.y * length.y + p1.y);

		normal = GetNormal(P(vp2.x - p2.x, vp2.y - p2.y));
		var end4 = P(normal.x * length.x + p2.x, normal.y * length.y + p2.y);
		objs.push([p1, p2, end4, end3]);

		var end5, end6;
		if (p1.y > vp1.y) {
			normal = GetNormal(P(vp2.x - end1.x, vp2.y - end1.y));
			end5 = P(normal.x * length.x + end1.x, normal.y * length.y + end1.y);

			end6 = FindIntersection(end5, end1, end3, vp1);
			if (end6 !== undefined) {
				objs.push([p1, end1, end6, end3]);
			}

		} else {

			normal = GetNormal(P(vp2.x - end2.x, vp2.y - end2.y));
			end5 = P(normal.x * length.x + end2.x, normal.y * length.y + end2.y);

			end6 = FindIntersection(end5, end2, end4, vp1);
			if (end6 !== undefined) {
				objs.push([p2, end2, end6, end4]);
			}
		}
		return objs;
	}

	function Draw3PointPerSq(length, p, vp1, vp2, vp3) {
		var polygons = [];

		var norm = GetNormal(P(vp1.x - p.x, vp1.y - p.y));
		var first1 = P(norm.x * length.x + p.x, norm.y * length.y + p.y);
		norm = GetNormal(P(vp2.x - p.x, vp2.y - p.y));
		var first2 = P(norm.x * length.x + p.x, norm.y * length.y + p.y);
		norm = GetNormal(P(vp3.x - p.x, vp3.y - p.y));
		var first3 = P(norm.x * length.x + p.x, norm.y * length.y + p.y);

		norm = GetNormal(P(vp1.x - first3.x, vp1.y - first3.y));
		var second1 = P(norm.x * length.x + first3.x, norm.y * length.y + first3.y);

		norm = GetNormal(P(vp2.x - first3.x, vp2.y - first3.y));
		var second2 = P(norm.x * length.x + first3.x, norm.y * length.y + first3.y);

		norm = GetNormal(P(vp3.x - first1.x, vp3.y - first1.y));
		var third1 = P(norm.x * length.x + first1.x, norm.y * length.y + first1.y);
		norm = GetNormal(P(vp3.x - first2.x, vp3.y - first2.y));
		var third2 = P(norm.x * length.x + first2.x, norm.y * length.y + first2.y);

		var thirdSecond1 = P(third1.x, second1.y);
		var thirdSecond2 = P(third2.x, second2.y);

		polygons.push([p, first1, thirdSecond1, first3]);
		polygons.push([p, first2, thirdSecond2, first3]);

		var test1 = (p.y > vp1.y || p.y > vp2.y);
		var test2 = (p.y < vp1.y || p.y < vp2.y);


		if (test2) {

			norm = GetNormal(P(vp2.x - first1.x, vp2.y - first1.y));
			var fifth1 = P(norm.x * length.x + first1.x, norm.y * length.y + first1.y);
			norm = GetNormal(P(vp1.x - first2.x, vp1.y - first2.y));
			var fifth2 = P(norm.x * length.x + first2.x, norm.y * length.y + first2.y);
			var fifthIntersection = FindIntersection(first1, fifth1, first2, fifth2);

			if (fifthIntersection !== undefined) {
				polygons.push([p, first1, fifthIntersection, first2]);
			}
		}
		if (p.y < vp3.y || test1) {
			norm = GetNormal(P(vp2.x - thirdSecond1.x, vp2.y - thirdSecond1.y));
			var forth1 = P(norm.x * length.x + thirdSecond1.x, norm.y * length.y + thirdSecond1.y);

			norm = GetNormal(P(vp1.x - thirdSecond2.x, vp1.y - thirdSecond2.y));
			var forth2 = P(norm.x * length.x + thirdSecond2.x, norm.y * length.y + thirdSecond2.y);


			var forthIntersection = FindIntersection(thirdSecond1, forth1, thirdSecond2, forth2);
			if (forthIntersection !== undefined) {
				polygons.push([first3, thirdSecond1, forthIntersection, thirdSecond2]);
			}
		}
		return polygons;
	};
	window.P = P;
	window.Draw1PointPerSq = Draw1PointPerSq;
	window.Draw2PointPerSq = Draw2PointPerSq;
	window.Draw3PointPerSq = Draw3PointPerSq;

}());