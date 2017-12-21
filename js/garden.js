//######################SETUP##########################

//VARS parametric
const rectSize = 300; //dimensions of the rects
const scaleW = 1680; //width for which was designed for
var fuzzyRadius = 5; //spreading of the light
var backgroundColor = "rgba(10, 10, 10, 0.3)";
var shadowSideStripes = "rgba(23, 23,23 ,0.3)";
var rectsColor = "black"

//BOOLEANS
var updateCanvas = true;

//VARS GENERIC
var windowOffset = 0;
var Mouse = {
	x: 0,
	y: 0
};
var scaleFactor = window.innerWidth/scaleW
var lightSpotImage = new Image();

// LINKS
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// ELEMENTS Scaled for 1680w
var segments = [
	// Border
	{a:{x:0,y:0}, b:{x:5000,y:0-windowOffset}},
	{a:{x:5000,y:0}, b:{x:5000,y:6000-windowOffset}},
	{a:{x:5000,y:6000}, b:{x:0,y:6000}},
	{a:{x:0,y:6000}, b:{x:0,y:0}},
];

//x,y coordinates for the rects on the canvas
var rectPlaces = [
	{x: 170, y: 500},
	{x: 170, y: 2450},
	{x: 170, y: 5230},
	{x: 476, y: 1218},
	{x: 476, y: 3222},
	{x: 476, y: 4610},
	{x: 1088, y: 213},
	{x: 1088, y: 2736},
	{x: 1394, y: 1296},
	{x: 1394, y: 3444},
];
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
	return point;
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

//draws a polygon that forms or leaves the shadows free
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

//Everything visible in the canvas
function draw(){

	//define the point of the lightSpotImage
	var spotLight = {};
	spotLight.x = canvas.width/2;
	spotLight.y = (windowOffset/$(document).height())*canvas.height*1.4 - 80
	spotLight.x = Mouse.x
	// spotLight.y = Mouse.y

	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);
	// Sight Polygons
	var polygons = [getSightPolygon(spotLight.x,spotLight.y+windowOffset)];
	for(var angle=0;angle<Math.PI*2; angle+=(Math.PI*2)/10){
		var dx = Math.sin(angle)*fuzzyRadius;
		var dy = Math.cos(angle)*fuzzyRadius;
		polygons.push(getSightPolygon((spotLight.x+dx) ,(spotLight.y+dy+windowOffset)));
	};

	drawPolygon(polygons[0],ctx,backgroundColor);

	// DRAW AS A GIANT POLYGON
	for(var i=1;i<polygons.length;i++){
		drawPolygon(polygons[i],ctx, shadowSideStripes);
	}

	drawShaft(spotLight.x, spotLight.y);

	ctx.drawImage(lightSpotImage,spotLight.x-lightSpotImage.width/2,spotLight.y-lightSpotImage.height/2);

	for(var i=0;i<rectPlaces.length;i++){
		ctx.fillStyle = rectsColor
		var spot = rectPlaces[i];
		ctx.beginPath();
		ctx.moveTo(spot.x ,spot.y -windowOffset);
		ctx.lineTo(spot.x+rectSize,spot.y -windowOffset);
		ctx.lineTo(spot.x+rectSize,spot.y + rectSize -windowOffset);
		ctx.lineTo(spot.x,spot.y+rectSize -windowOffset);
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

// //logarythmic function for sun movement
// function moveSpotlight(x, radiusHeightRatio){
// 	radius = radiusHeightRatio * $(document).height()
// 	centerX = canvas.width/2//-radius/2
// 	centerY = canvas.height/2
// }

function drawShaft(x,y){
	ctx.strokeStyle = "white"
	ctx.beginPath()
	ctx.moveTo(x,0);
	ctx.lineTo(x, y);
	ctx.lineTo(x, 0);
	ctx.stroke();
}



//######################EVENTS##########################

//recalculates segments
calcSegments();

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

//everything happening on pageload
window.onload = function(){
	lightSpotImage.onload = function(){
		drawLoop();
	};
	lightSpotImage.src = "assets/lightspot.png";
};

//everything happening when mouse is moved
canvas.onmousemove = function(event){
	Mouse.x = event.clientX;
	Mouse.y = event.clientY;
	updateCanvas = true;
};

//everything happening when scrolling
window.addEventListener('scroll', function(e){
	updateCanvas = true;
	windowOffset = window.pageYOffset;
})
