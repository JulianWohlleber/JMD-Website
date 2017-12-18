//######################SETUP##########################

//VARS parametric
const rectSize = 150; //dimensions of the rects
const scaleW = 1680; //width for which was designed for
var fuzzyRadius = 40; //spreading of the light

//BOOLEANS
var updateCanvas = true;

//VARS GENERIC
var windowOffset = 0;
var Mouse = {
	x: 0,
	y: 0
};
var scaleFactor = window.innerWidth/scaleW
var lightSpot = new Image();

// LINKS
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// ELEMENTS Scaled for 1680w
var segments = [
	// Border
	{a:{x:0,y:0}, b:{x:5000,y:0}},
	{a:{x:5000,y:0}, b:{x:5000,y:5000}},
	{a:{x:5000,y:5000}, b:{x:0,y:5000}},
	{a:{x:0,y:5000}, b:{x:0,y:0}},
];

var rectPlaces = [
	{x: 600, y: 400},
	{x: 300, y: 200},
	{x: 1100, y: 1000},
	{x: 100, y: 2000},
	{x: 400, y: 1400},
	{x: 700, y: 1900},
];

console.log(segments);
//relations
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;


//#####################FUNCTIONS#######################
//updating functions:
// Find intersection of RAY & SEGMENT
function getIntersection(ray,segment){

	// RAY in parametric: Point + Delta*T1
	var r_px = ray.a.x;
	var r_py = ray.a.y;
	var r_dx = ray.b.x-ray.a.x;
	var r_dy = ray.b.y-ray.a.y;

	// SEGMENT in parametric: Point + Delta*T2
	var s_px = segment.a.x;
	var s_py = segment.a.y;
	var s_dx = segment.b.x-segment.a.x;
	var s_dy = segment.b.y-segment.a.y;

	// Are they parallel? If so, no intersect
	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag){
		// Unit vectors are the same.
		return null;
	}

	// SOLVE FOR T1 & T2
	// r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
	// ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
	// ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
	// ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
	var T1 = (s_px+s_dx*T2-r_px)/r_dx;

	// Must be within parametic whatevers for RAY/SEGMENT
	if(T1<0) return null;
	if(T2<0 || T2>1) return null;

	// Return the POINT OF INTERSECTION
	return {
		x: r_px+r_dx*T1,
		y: r_py+r_dy*T1,
		param: T1
	};
}

function getSightPolygon(sightX,sightY){

	// Get all unique points
	var points = (function(segments){
		var a = [];
		segments.forEach(function(seg){
			a.push(seg.a,seg.b);
		});
		return a;
	})(segments);
	var uniquePoints = (function(points){
		var set = {};
		return points.filter(function(p){
			var key = p.x+","+p.y;
			if(key in set){
				return false;
			}else{
				set[key]=true;
				return true;
			}
		});
	})(points);

	// Get all angles
	var uniqueAngles = [];
	for(var j=0;j<uniquePoints.length;j++){
		var uniquePoint = uniquePoints[j];
		var angle = Math.atan2(uniquePoint.y-sightY,uniquePoint.x-sightX);
		uniquePoint.angle = angle;
		uniqueAngles.push(angle-0.00001,angle,angle+0.00001);
	}

	// RAYS IN ALL DIRECTIONS
	var intersects = [];
	for(var j=0;j<uniqueAngles.length;j++){
		var angle = uniqueAngles[j];

		// Calculate dx & dy from angle
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		// Ray from center of screen to mouse
		var ray = {
			a:{x:sightX,y:sightY},
			b:{x:sightX+dx,y:sightY+dy}
		};

		// Find CLOSEST intersection
		var closestIntersect = null;
		for(var i=0;i<segments.length;i++){
			var intersect = getIntersection(ray,segments[i]);
			if(!intersect) continue;
			if(!closestIntersect || intersect.param<closestIntersect.param){
				closestIntersect=intersect;
			}
		}

		// Intersect angle
		if(!closestIntersect) continue;
		closestIntersect.angle = angle;

		// Add to list of intersects
		intersects.push(closestIntersect);

	}

	// Sort intersects by angle
	intersects = intersects.sort(function(a,b){
		return a.angle-b.angle;
	});

	// Polygon is intersects, in order of angle
	return intersects;

}

//calculates dots for positioning
function calcShift(dot,x,y){
	var point = {};
	point.x = dot.x + x;
	point.y = dot.y + y;
	// console.log(point.x);
	return point;
}

function drawPolygon(polygon,ctx,fillStyle){
	ctx.fillStyle = fillStyle;
	ctx.beginPath();
	ctx.moveTo(polygon[0].x ,polygon[0].y -windowOffset);
	for(var i=1;i<polygon.length;i++){
		var intersect = polygon[i];
		ctx.lineTo(intersect.x ,intersect.y -windowOffset);
	}
	ctx.fill();
}

//calculates segments dots from x,y values of the rects
function calcSegments(){
	for(var i=0; i<rectPlaces.length; i++){
	const dot = jQuery.extend(true, {}, rectPlaces[i]);
  var line = {};


	//line1
	line.a = calcShift(dot,0,0);
	line.b = calcShift(dot,0,rectSize);
	segments.push(jQuery.extend(true, {}, line));

	//line2
	line.a = calcShift(dot,0,rectSize);
	line.b = calcShift(dot,rectSize,rectSize);
	segments.push(jQuery.extend(true, {}, line));

	// //line3
	line.a = calcShift(dot,rectSize,rectSize);
	line.b = calcShift(dot,rectSize,0);
	segments.push(jQuery.extend(true, {}, line));

	// //line4
	line.a = calcShift(dot,rectSize,0);
	line.b = calcShift(dot,0,0);
	segments.push(jQuery.extend(true, {}, line));
}
}

//Everything visible in the canvas
function draw(){
	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	// Sight Polygons
	var polygons = [getSightPolygon(Mouse.x,Mouse.y)];
	for(var angle=0;angle<Math.PI*2;angle+=(Math.PI*2)/10){
		var dx = Math.cos(angle)*fuzzyRadius;
		var dy = Math.sin(angle)*fuzzyRadius;
		polygons.push(getSightPolygon((Mouse.x+dx) ,(Mouse.y+dy) ));
	};

	// DRAW AS A GIANT POLYGON
	for(var i=1;i<polygons.length;i++){
		drawPolygon(polygons[i],ctx,"rgba(255,255,255,0.2)");
	}
	drawPolygon(polygons[0],ctx,"#fff");

	// Draw dots
	ctx.fillStyle = "#dd3838";
	ctx.beginPath();
    ctx.arc(Mouse.x, Mouse.y, 2, 0, 2*Math.PI, false);
    ctx.fill();
	for(var angle=0;angle<Math.PI*2;angle+=(Math.PI*2)/10){
		var dx = Math.cos(angle)*fuzzyRadius;
		var dy = Math.sin(angle)*fuzzyRadius;
		ctx.beginPath();
    	ctx.arc(Mouse.x+dx, Mouse.y+dy, 2, 0, 2*Math.PI, false);
    	ctx.fill();
    }

	// Draw segments
	ctx.strokeStyle = "#999";
	ctx.fillStyle = "#dd3838"
	for(var i=0;i<segments.length;i++){
		var seg = segments[i];
		ctx.beginPath();
		ctx.moveTo(seg.a.x ,seg.a.y -windowOffset);
		ctx.lineTo(seg.b.x ,seg.b.y -windowOffset);
		ctx.stroke();
		ctx.fill();
	}
}

//everything triggered when input-changes are happening
function drawLoop(){
	requestAnimationFrame(drawLoop);
	if(updateCanvas){
		resizeCanvas();
		draw();
		updateCanvas = false;
	}
}

//everything related to the canvas size
function resizeCanvas(){
	var scaleFactor = window.innerWidth/scaleW
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}


//######################EVENTS##########################

//recalculates segments
calcSegments();

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

//everything happening on pageload
window.onload = function(){
	drawLoop();
};

//everything happening when mouse is moved
canvas.onmousemove = function(event){
	Mouse.x = event.clientX;
	Mouse.y = event.clientY;
	updateCanvas = true;
};

//everything happening when scrolling
window.addEventListener('scroll', function(e){
	updateCanvas = true
	windowOffset = window.pageYOffset
})
