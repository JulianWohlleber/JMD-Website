//######################SETUP##########################

//VARS parametric
const rectSize = 150; //dimensions of the rects
const scaleW = 1680; //width for which was designed for
var fuzzyRadius = 10; //spreading of the light

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
var segments = [];

var rectPlaces = [
	{x: 600, y: 400},
	{x: 300, y: 200},
	{x: 1100, y: 1000},
	{x: 100, y: 2000},
	{x: 400, y: 1400},
	{x: 700, y: 1900},
];

//relations
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;


//#####################FUNCTIONS#######################

//calculates shifts for dots
function calcShift(dot,x,y){
	var point = {};
	point.x = dot.x + x;
	point.y = dot.y + y;
	// console.log(point.x);
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

//Everything visible in the canvas
function draw(){
	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	// Draw red dot
	ctx.fillStyle = "#dd3838";
	ctx.beginPath();
	ctx.arc(Mouse.x, Mouse.y, 4, 0, 2*Math.PI, false);
	ctx.fill();

	// Draw segments
	ctx.strokeStyle = "#999";
	ctx.fillStyle = "#dd3838"
	for(var i=0;i<segments.length;i++){
		var seg = segments[i];
		ctx.beginPath();
		ctx.moveTo(seg.a.x*scaleFactor,seg.a.y*scaleFactor-windowOffset);
		ctx.lineTo(seg.b.x*scaleFactor,seg.b.y*scaleFactor-windowOffset);
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
