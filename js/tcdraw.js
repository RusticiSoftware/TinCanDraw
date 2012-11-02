/*jslint nomen: true, debug: true, evil: false, vars: true, white: true, browser: true, bitwise: true */
/*global $, jQuery, alert, escape*/


$(document).ready(function() {

	var canvasWidth = 300;
	var canvasHeight = 200;
	var canvasDiv = document.getElementById('tcdraw');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', canvasWidth);
	canvas.setAttribute('height', canvasHeight);
	canvas.setAttribute('id', 'canvas');

	canvasDiv.appendChild(canvas);

	var drawCanvas = document.getElementById("canvas");
	var context = drawCanvas.getContext("2d");
	context.strokeStyle = 'Black';
	context.lineWidth = 5;
	
	initialize();

/*

	***********  Events

*/

$('#draw').bind('pageshow', function(){
	console.log('draw pageshow');
	if(localStorage.length > 0 && localStorage['tc-draw-email'] && localStorage['tc-draw-email']!=''){
		console.log(localStorage['tc-draw-email']);
		
	}else{
		$.mobile.changePage("#signin", {
			transition: "flip"
		});
	}
});

$('#clear').click(function(){
	context.clearRect ( 0 , 0 , canvasWidth , canvasHeight );
});

$('#save').click(function() {
	$('#save').hide();
	generateStatement();

});

$('#start').click(function() {
	console.log('start clicked');
	var val = true;
	if($('#name').val() != '') {
		localStorage.setItem('tc-draw-user', $('#name').val());
	} else {
		val = false;
		$.mobile.showPageLoadingMsg('a', 'Name is required.', true);
		setTimeout($.mobile.hidePageLoadingMsg, 1500);
	}
	if($('#email').val() != '') {
		localStorage.setItem('tc-draw-email', $('#email').val());
	} else {
		val = false;
		$.mobile.showPageLoadingMsg('a', 'Email is required.', true);
		setTimeout($.mobile.hidePageLoadingMsg, 1500);
	}
	if(val) {
		$.mobile.changePage("#draw", {
			transition: "slideup"
		});
	}
});


// works out the X, Y position of the click inside the canvas from the X, Y position on the page
function getPosition(mouseEvent, drawCanvas) {
	var x, y;
	if(mouseEvent.pageX !== undefined && mouseEvent.pageY !== undefined) {
		x = mouseEvent.pageX;
		y = mouseEvent.pageY;
	} else {
		x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return {
		X: x - drawCanvas.offsetLeft,
		Y: y - drawCanvas.offsetTop - 40
	};
}

function initialize() {
	// get references to the canvas element as well as the 2D drawing context
	
	// This will be defined on a TOUCH device such as iPad or Android, etc.
	var is_touch_device = 'ontouchstart' in document.documentElement;

	if(is_touch_device) {
		// create a drawer which tracks touch movements
		var drawer = {
			isDrawing: false,
			touchstart: function(coors) {
				context.beginPath();
				context.moveTo(coors.x, coors.y);
				this.isDrawing = true;
			},
			touchmove: function(coors) {
				if(this.isDrawing) {
					context.lineTo(coors.x, coors.y);
					context.stroke();
				}
			},
			touchend: function(coors) {
				if(this.isDrawing) {
					this.touchmove(coors);
					this.isDrawing = false;
				}
			}
		};

		// create a function to pass touch events and coordinates to drawer


		function draw(event) {

			// get the touch coordinates.  Using the first touch in case of multi-touch
			var coors = {
				x: event.targetTouches[0].pageX,
				y: event.targetTouches[0].pageY
			};

			// Now we need to get the offset of the canvas location
			var obj = drawCanvas;

			if(obj.offsetParent) {
				// Every time we find a new object, we add its offsetLeft and offsetTop to curleft and curtop.
				do {
					coors.x -= obj.offsetLeft;
					coors.y -= obj.offsetTop;
				}
				// The while loop can be "while (obj = obj.offsetParent)" only, which does return null
				// when null is passed back, but that creates a warning in some editors (i.e. VS2010).
				while
				((obj = obj.offsetParent) != null);
			}

			// pass the coordinates to the appropriate handler
			drawer[event.type](coors);
		}


		// attach the touchstart, touchmove, touchend event listeners.
		drawCanvas.addEventListener('touchstart', draw, false);
		drawCanvas.addEventListener('touchmove', draw, false);
		drawCanvas.addEventListener('touchend', draw, false);

		// prevent elastic scrolling
		drawCanvas.addEventListener('touchmove', function(event) {
			event.preventDefault();
		}, false);
	} else {

		// start drawing when the mousedown event fires, and attach handlers to
		// draw a line to wherever the mouse moves to
		$("canvas").mousedown(function(mouseEvent) {
			var position = getPosition(mouseEvent, drawCanvas);

			context.moveTo(position.X, position.Y);
			context.beginPath();

			// attach event handlers
			$(this).mousemove(function(mouseEvent) {
				drawLine(mouseEvent, drawCanvas, context);
			}).mouseup(function(mouseEvent) {
				finishDrawing(mouseEvent, drawCanvas, context);
			}).mouseout(function(mouseEvent) {
				finishDrawing(mouseEvent, drawCanvas, context);
			});
		});

	}
}

// draws a line to the x and y coordinates of the mouse event inside
// the specified element using the specified context


function drawLine(mouseEvent, drawCanvas, context) {

	var position = getPosition(mouseEvent, drawCanvas);

	context.lineTo(position.X, position.Y);
	context.stroke();
}

// draws a line from the last coordiantes in the path to the finishing
// coordinates and unbind any event handlers which need to be preceded
// by the mouse down event


function finishDrawing(mouseEvent, drawCanvas, context) {
	// draw the line to the finishing coordinates
	drawLine(mouseEvent, drawCanvas, context);

	context.closePath();

	// unbind any events which could draw
	$(drawCanvas).unbind("mousemove").unbind("mouseup").unbind("mouseout");
}





function generateStatement() {
	if(localStorage.getItem('tc-draw-user') != null && localStorage.getItem('tc-draw-user') != '') {
		var drawing = {}
		drawing.base64data = canvas.toDataURL();
		drawing.width = canvasWidth;
		drawing.height = canvasHeight;

		console.log(JSON.stringify(drawing));

		var s = {};
		s.actor = {};
		s.actor['name'] = localStorage.getItem('tc-draw-user');
		s.actor['mbox'] = 'mailto:' + localStorage.getItem('tc-draw-email');
		s.actor['objectType'] = 'Agent';

		s.verb = {};
		s.verb['display'] = {
			'en-US': 'drew'
		};
		s.verb['id'] = 'http://scorm.com/verbs/drew';

		s["object"] = {};
		s["object"].definition = {};
		s["object"].definition.name = {
			'en-US': 'tcdraw'
		};
		s["object"].id = 'http://scorm.com/tcdraw-87dab09b-7c33-49a2-9080-06fbe54f1560';
		s["object"].type = "Activity";

		s.context = {};
		s.context.extensions = {};
		s.context.extensions["http://scorm.com/extensions/tcdraw-data"] = drawing;

		putStatement(s, function(data) {
			console.log(data);
			alert('Your drawing has been saved.');
			$.mobile.changePage("#done", {
				transition: "flip"
			});
		});
	}
}

function putStatement(statement, callback) {
	console.log(JSON.stringify(statement));

	$.ajax({
		url: 'https://watershed.ws/tc/statements',
		type: 'POST',
		dataType: 'json',
		data: JSON.stringify(statement),
		contentType: 'application/json',
		success: function(data) {
			//console.log(data); 
			callback(data);
		},
		error: function(err) {
			console.log(err);
			alert('error:' + err.status + ' - ' + err.statusText);

		},
		beforeSend: function(xhr) {
			xhr.setRequestHeader('Authorization', 'Basic YnJpYW4ucm9nZXJzK3RjZHJhd0BzY29ybS5jb206c2Nvcm0yMDA0');
			xhr.setRequestHeader('X-Experience-API-Version', '0.95');
		}
	});
}

function GUID() {
	var S4 = function() {
			return Math.floor(
			Math.random() * 0x10000 /* 65536 */ ).toString(16);
		};

	return(
	S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}


});

