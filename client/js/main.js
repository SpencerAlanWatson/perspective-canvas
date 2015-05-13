window.addEventListener('load', function () {
	'use strict';
	if (!localStorage.getItem('saveTitles')) {
		localStorage.setItem('saveTitles', "[]");
	}
	var mousePos = P(0, 0);
	var len = P(20, 20);
	var renderSize = P(window.innerWidth, window.innerHeight);
	var vp1 = P(0, 0);
	var vp2 = P(0, 0);
	var vp3 = P(0, 0);
	var vp4 = P(0, 0);

	var placeObj = false;
	var redrawBg = false;
	var recalculateBg = false;

	var perspectiveObjects = {};

	var bgStyle = "white";
	var strokeStyle = "black";
	var fillStyle = "white";

	var requestId = 0;

	var stats = new Stats();
	stats.setMode(0);
	// align bottom-right
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.right = '0px';
	stats.domElement.style.bottom = '0px';

	document.body.appendChild(stats.domElement);

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return P(evt.clientX - rect.left, evt.clientY - rect.top)
	}
	var canvas = document.getElementById('main-canvas');
	var ctx = canvas.getContext('2d');
	var bgCanvas = document.getElementById('bg-canvas');
	var bgCtx = bgCanvas.getContext('2d');

	var mode = 1;

	Resize();
	setupControls();


	function ResizeVPs(renderSize) {
		var halfX = renderSize.x / 2,
			halfY = renderSize.y / 2;

		vp1.x = halfX;
		vp1.y = halfY;

		vp2.x = 0;
		vp2.y = halfY;

		vp3.x = renderSize.x;
		vp3.y = halfY;

		vp4.x = halfX;
		vp4.y = halfY / 2;

	}


	function Resize() {
		redrawBg = true;
		recalculateBg = true;
		bgCanvas.width = window.innerWidth;
		bgCanvas.height = window.innerHeight;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		//ScaleBg(window.innerWidth / renderSize.x, window.innerHeight / renderSize.y);
		renderSize = P(window.innerWidth, window.innerHeight);
		ResizeVPs(renderSize);

	}
	window.addEventListener('resize', Resize);

	function Clear(context) {
		//Trick to clear any canvas
		++context.canvas.width;
		--context.canvas.width;
		//After clearing like that, though, you have to reset the style.
		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
	}

	function EmptyAll() {
		perspectiveObjects = {};
		redrawBg = true;
	}

	function RemovePerspectiveObject(index) {
		delete perspectiveObjects[index];
		redrawBg = true;
	}

	function Save(title) {
		var compObjs = CompressObjects(perspectiveObjects);
		compObjs.push(bgStyle);
		var compStrings = JSON.stringify(compObjs);
		localStorage.setItem(title, compStrings);

		var saveTitles = JSON.parse(localStorage.getItem('saveTitles'));
		var index = saveTitles.indexOf(title);
		if (index === -1) {
			saveTitles.push(title);
		}
		localStorage.setItem('saveTitles', JSON.stringify(saveTitles));
	}

	function Load(title) {
		var savedArray = localStorage.getItem(title)
		if (!savedArray) {
			return;
		}
		savedArray = JSON.parse(savedArray);
		bgStyle = savedArray.pop();
		var decompObjs = DecompressObjects(savedArray);
		perspectiveObjects = decompObjs;
		redrawBg = true;
	}

	function Delete(title) {
		var savedArray = localStorage.getItem(title)
		if (savedArray) {
			localStorage.removeItem(title);
		}
		var saveTitles = JSON.parse(localStorage.getItem('saveTitles'));
		var index = saveTitles.indexOf(title);
		if (index !== -1) {
			saveTitles.splice(index, 1);
			localStorage.setItem('saveTitles', JSON.stringify(saveTitles));
		}
	}


	function CompressObjects(objs) {
		var compressedObjs = [];

		_.forEach(objs, function (obj) {
			var compressedStroke = obj.strokeStyle.replace('#', '');
			var compressedFill = obj.fillStyle.replace('#', '');
			var compObj = [obj.perspective, compressedStroke, compressedFill];
			//  obj.origPoints, obj.origLen, obj.polygons];
			var compPoints = [];
			_.forEach(obj.origPoints, function (point) {
				var compPoint = [point.x, point.y];
				compPoints.push(compPoint);
			});
			compObj.push(compPoints);
			compObj.push([obj.origLen.x, obj.origLen.y]);

			var compPolygons = [];
			_.forEach(obj.polygons, function (polygon) {
				var compPolygon = [];
				_.forEach(polygon, function (point) {
					var compPoint = [point.x, point.y];
					compPolygon.push(compPoint);
				});
				compPolygons.push(compPolygon);
			});
			compObj.push(compPolygons);

			compressedObjs.push(compObj);
		});
		return compressedObjs;
	}

	function DecompressObjects(objs) {
		var decompressedObjects = {};
		_.forEach(objs, function (obj) {
			var decompObj = {
				id: _.uniqueId(),
				perspective: obj[0],
				strokeStyle: '#' + obj[1],
				fillStyle: '#' + obj[2]
			};
			var decompOrigPoints = [];

			_.forEach(obj[3], function (point) {
				var decompPoint = P(point[0], point[1]);
				decompOrigPoints.push(decompPoint);
			});
			decompObj.origPoints = decompOrigPoints;

			decompObj.origLen = P(obj[4][0], obj[4][1]);
			var decompPolygons = [];
			_.forEach(obj[5], function (polygon) {
				var decompPolygon = [];
				_.forEach(polygon, function (point) {
					var decompPoint = P(point[0], point[1]);
					decompPolygon.push(decompPoint);
				});
				decompPolygons.push(decompPolygon);
			});
			decompObj.polygons = decompPolygons;
			decompressedObjects[decompObj.id] = decompObj;
		});
		return decompressedObjects;
	};

	function PathPolygons(ctx, polygons) {
		polygons.forEach(function (polygon, index) {
			if (polygon.length !== 0) {
				ctx.moveTo(polygon[0].x, polygon[0].y);

				polygon.forEach(function (point) {
					ctx.lineTo(point.x, point.y);
				});
				ctx.lineTo(polygon[0].x, polygon[0].y);
			}
		});
	}

	function DrawBg(ctx, clickCtx) {
		Clear(ctx);
		if (recalculateBg) {
			CalculateBg();
		}
		ctx.fillStyle = bgStyle;
		ctx.fillRect(0, 0, renderSize.x, renderSize.y);
		ctx.beginPath();
		ctx.arc(vp1.x, vp1.y, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(vp2.x, vp2.y, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(vp3.x, vp3.y, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(vp4.x, vp4.y, 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(vp2.x, vp2.y);
		ctx.lineTo(vp3.x, vp3.y);

		ctx.fill();
		ctx.stroke();

		_.forEach(perspectiveObjects, function (perspectiveObject) {
			ctx.beginPath();
			ctx.strokeStyle = perspectiveObject.strokeStyle;
			ctx.fillStyle = perspectiveObject.fillStyle;
			var path = new Path2D();
			clickCtx.removeHitRegion({
				id: perspectiveObject.id
			});

			PathPolygons(path, perspectiveObject.polygons);
			clickCtx.addHitRegion({
				id: perspectiveObject.id,
				path: path
			});
			ctx.closePath();
			ctx.fill(path);
			ctx.stroke(path);

		});
	}

	function CalculateBg() {
		var newPerspectiveObjects = {};
		_.forEach(perspectiveObjects, function (perspectiveObject) {
			var polygons;
			switch (perspectiveObject.perspective) {
			case 1:
				polygons = Draw1PointPerSq(perspectiveObject.origLen, perspectiveObject.origPoints, vp1);
				break;
			case 2:
				polygons = Draw2PointPerSq(perspectiveObject.origLen, perspectiveObject.origPoints[0], perspectiveObject.origPoints[1], vp2, vp3);
				break;
			case 3:
				polygons = Draw3PointPerSq(perspectiveObject.origLen, perspectiveObject.origPoints[0], vp2, vp3, vp4);
				break;
			}
			var obj = {
				id: perspectiveObject.id,
				perspective: perspectiveObject.perspective,
				strokeStyle: perspectiveObject.strokeStyle,
				fillStyle: perspectiveObject.fillStyle,
				origPoints: perspectiveObject.origPoints,
				origLen: perspectiveObject.origLen,
				polygons: polygons

			}
			newPerspectiveObjects[obj.id] = obj;
		});
		perspectiveObjects = newPerspectiveObjects;
	}

	function ScaleBg(xScale, yScale) {
		perspectiveObjects.forEach(function (perspectiveObject) {
			perspectiveObject.polygons.forEach(function (polygon) {
				polygon.forEach(function (point, index) {
					point.x *= xScale;
					point.y *= yScale;
				});
			});
		});
	}

	function StepAB() {
		requestId = window.requestAnimationFrame(StepAB);
		stats.begin();

		Clear(ctx);

		ctx.beginPath();
		var polygons;
		switch (mode) {
		case 0:
			polygons = [];
			break;
		case 1:
			polygons = setup1Point(ctx);
			break;
		case 2:
			polygons = setup2Point(ctx);
			break;
		case 3:
			polygons = setup3Point(ctx);
			break;

		}
		PathPolygons(ctx, polygons);
		ctx.stroke();

		if (redrawBg) {
			DrawBg(bgCtx, ctx);
			redrawBg = false;
		}

		stats.end();

	}

	function StepA() {
		requestId = window.requestAnimationFrame(StepA);

		stats.begin();
		Clear(ctx);

		ctx.beginPath();
		ctx.arc(vp1.x, vp1.y, 5, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();

		var polygons = setup1Point(ctx);
		PathPolygons(ctx, polygons);
		ctx.stroke();

		if (redrawBg) {
			DrawBg(bgCtx, ctx);
			redrawBg = false;
		}

		stats.end();
	}

	function StepB() {
		requestId = window.requestAnimationFrame(StepB);

		stats.begin();
		Clear(ctx);

		ctx.beginPath();
		ctx.arc(vp2.x, vp2.y, 2, 0, Math.PI * 2);
		ctx.arc(vp3.x, vp3.y, 2, 0, Math.PI * 2);
		ctx.moveTo(vp2.x, vp2.y);
		ctx.lineTo(vp3.x, vp3.y);
		ctx.stroke();
		ctx.fill();

		ctx.beginPath();
		var polygons = setup2Point(ctx);
		PathPolygons(ctx, polygons);
		ctx.stroke();

		if (redrawBg) {
			DrawBg(bgCtx, ctx);
			redrawBg = false;
		}

		stats.end();
	}

	function setup1Point(ctx) {
		var halfLenX = len.x / 2;
		var halfLenY = len.y / 2;
		//var halfOffset = offset / 2;
		var p1 = P(mousePos.x - halfLenX, mousePos.y - halfLenY),
			p2 = P(mousePos.x + halfLenX, mousePos.y - halfLenY),
			p3 = P(mousePos.x + halfLenX, mousePos.y + halfLenY),
			p4 = P(mousePos.x - halfLenX, mousePos.y + halfLenY);

		//context.strokeStyle = "blue";
		var polygons = Draw1PointPerSq(len, [p1, p2, p3, p4], vp1);
		if (placeObj) {
			var perspectiveObject = {
				id: _.uniqueId(),
				perspective: 1,
				strokeStyle: ctx.strokeStyle,
				fillStyle: ctx.fillStyle,
				origPoints: [p1, p2, p3, p4],
				origLen: P(len.x, len.y),
				polygons: polygons
			}
			perspectiveObjects[perspectiveObject.id] = (perspectiveObject);
			placeObj = false;
			redrawBg = true;
		}
		return polygons;
	};

	function setup2Point(ctx) {
		var halfLenX = len.x / 2;
		var halfLenY = len.y / 2;
		var p1 = P(mousePos.x, mousePos.y - halfLenY),
			p2 = P(mousePos.x, mousePos.y + halfLenY);


		var polygons = Draw2PointPerSq(len, p1, p2, vp2, vp3);
		if (placeObj) {
			var perspectiveObject = {
				id: _.uniqueId(),

				perspective: 2,
				strokeStyle: ctx.strokeStyle,
				fillStyle: ctx.fillStyle,
				origPoints: [p1, p2],
				origLen: P(len.x, len.y),
				polygons: polygons
			}
			perspectiveObjects[perspectiveObject.id] = (perspectiveObject);
			placeObj = false;
			redrawBg = true;
		}
		return polygons;
	};

	function setup3Point(ctx) {
		var p = P(mousePos.x, mousePos.y);

		var polygons = Draw3PointPerSq(len, p, vp2, vp3, vp4);
		if (placeObj) {
			var perspectiveObject = {
				id: _.uniqueId(),
				perspective: 3,
				strokeStyle: ctx.strokeStyle,
				fillStyle: ctx.fillStyle,
				origPoints: [p],
				origLen: P(len.x, len.y),
				polygons: polygons
			}
			perspectiveObjects[perspectiveObject.id] = (perspectiveObject);
			placeObj = false;
			redrawBg = true;
		}
		return polygons;
	};

	function setupControls() {


		document.getElementById('clearCanvas').addEventListener('click', EmptyAll);
		var modeSelectElem = document.getElementById('modeSelect');

		var modalPrimaryBtnsElem = document.getElementById('modal-primary-btns');
		var modalFooter = document.getElementById('save-load-modal-footer');

		var saveLoadButtonElem = document.getElementById('saveLoadScene');
		var saveLoadModalElem = $('#saveLoadModal');
		var saveTitleElem = document.getElementById('saveTitle');
		var saveSelectElem = document.getElementById('saveSelect');
		var saveButtonElem = document.getElementById('saveButton');
		var loadButtonElem = document.getElementById('loadButton');
		var deleteButtonElem = document.getElementById('deleteButton');

		var saveLoadModalBodyElem = document.getElementById('saveLoadModalBody');

		var bgElem = document.getElementById('bgColor');
		var strokeElem = document.getElementById('strokeColor');
		var fillElem = document.getElementById('fillColor');
		var lengthXElem = document.getElementById('lineLengthX');
		var lengthYElem = document.getElementById('lineLengthY');
		var footer = document.getElementById("credits");
		var githubLink = document.getElementById("github-link");

		canvas.addEventListener('mousemove', function (evt) {
			mousePos = getMousePos(canvas, evt);
		}, false);
		footer.addEventListener('mousemove', function (evt) {
			mousePos = getMousePos(canvas, evt);
		}, false);

		var canvasClick = function (evt) {

			if (mode === 0) {
				if (evt.region !== null) {
					RemovePerspectiveObject(evt.region);
				}
			} else {
				placeObj = true;
			}
		}

		canvas.addEventListener('click', canvasClick, false);
		footer.addEventListener('click', function (evt) {
			if (evt.target !== githubLink)
				canvasClick(evt);
		}, false);

		modeSelectElem.addEventListener('change',
			function (evt) {

				mode = Number(modeSelectElem.value);
			});
		bgElem.addEventListener('change', function (evt) {
			var val = bgElem.value;
			bgStyle = val;
			redrawBg = true;
		});
		strokeElem.addEventListener('change', function (evt) {
			var val = strokeElem.value;
			strokeStyle = val;
		});
		fillElem.addEventListener('change', function (evt) {
			var val = fillElem.value;
			fillStyle = val;
		});
		lengthXElem.addEventListener('change', function (evt) {
			var val = Number(lengthXElem.value);
			len.x = val;
		});
		lengthYElem.addEventListener('change', function (evt) {
			var val = Number(lengthYElem.value);
			len.y = val;
		});
		saveLoadModalElem.on('show.bs.modal', function (e) {
			var saveTitles = JSON.parse(localStorage.getItem('saveTitles'));
			var lc = saveSelectElem.lastChild;
			while (lc) {
				saveSelectElem.removeChild(lc);
				lc = saveSelectElem.lastChild;
			}
			_.forEach(saveTitles, function (title) {
				var opt = document.createElement('option');
				opt.innerHTML = title;
				opt.value = title;
				saveSelectElem.add(opt);
			});
			if (saveSelectElem.firstChild) {
				saveSelectElem.firstChild.selected = true;
			}
		})
		saveLoadModalElem.on('hidden.bs.modal', function (e) {
			saveLoadModalElem.find('.alert').remove();
			modalPrimaryBtnsElem.classList.remove('hidden');
		})
		saveLoadButtonElem.addEventListener('click', function (evt) {
			saveLoadModalElem.modal('toggle');

		});

		saveButtonElem.addEventListener('click', function (evt) {
			var title = saveTitleElem.value;
			if (localStorage.getItem('saveTitles').indexOf(title) !== -1) {
				var alert = document.createElement('div');
				alert.classList.add('alert', 'alert-warning', 'alert-dismissible', 'alert-overwrite');
				alert.role = "alert";

				alert.innerHTML = "<strong>A scene with this title already exists,</strong> do you want to overwrite?";


				var overWrite = document.createElement('button');
				overWrite.type = "button";
				overWrite.classList.add('btn', 'btn-danger', 'btn-alert');
				overWrite["data-dismiss"] = "alert";
				overWrite["aria-label"] = "Overwrite";
				overWrite["aria-hidden"] = "true";
				overWrite.innerText = "Yes, overwrite.";


				var overWriteClick = function (evt) {
					Save(title);
					closeAlert();
				};

				var closeAlert = function () {
					modalFooter.removeChild(alert);
					modalPrimaryBtnsElem.classList.remove('hidden');
					overWrite.removeEventListener('click', overWriteClick);
					button.removeEventListener('click', closeAlert);

				}
				overWrite.addEventListener('click', overWriteClick);

				var button = document.createElement('button');
				button.type = "button";
				button.classList.add('btn', 'btn-primary', 'btn-alert');
				button["data-dismiss"] = "alert";
				button["aria-label"] = "Close";
				button["aria-hidden"] = "true";
				button.innerText = "No, nevermind.";
				button.addEventListener('click', closeAlert);


				var div = document.createElement('div');
				div.appendChild(overWrite);
				div.appendChild(button);

				alert.appendChild(div);

				modalPrimaryBtnsElem.classList.toggle('hidden');
				modalFooter.appendChild(alert);
			} else {
				Save(title);
				var opt = document.createElement('option');
				opt.innerHTML = title;
				opt.value = title;

				saveSelectElem.add(opt);
			}
		});
		loadButtonElem.addEventListener('click', function (evt) {
			var title = saveSelectElem.value;
			Load(title);
		});
		deleteButtonElem.addEventListener('click', function (evt) {
			var title = saveSelectElem.value;
			var alert = document.createElement('div');
			alert.classList.add('alert', 'alert-danger', 'alert-dismissible', 'alert-overwrite');
			alert.role = "alert";

			alert.innerHTML = "Once you delete this scene, <strong>it can never be retried</strong>, are you sure you want to delete it?";

			var deleteBtn = document.createElement('button');
			deleteBtn.type = "button";
			deleteBtn.classList.add('btn', 'btn-danger', 'btn-alert');
			deleteBtn["data-dismiss"] = "alert";
			deleteBtn["aria-label"] = "Close";
			deleteBtn["aria-hidden"] = "true";
			deleteBtn.innerText = "Yes, I am sure.";

			var button = document.createElement('button');
			button.type = "button";
			button.classList.add('btn', 'btn-primary', 'btn-alert');
			button["data-dismiss"] = "alert";
			button["aria-label"] = "Close";
			button["aria-hidden"] = "true";
			button.innerText = "No, I changed my mind.";

			var closeAlert = function () {
				modalFooter.removeChild(alert);
				modalPrimaryBtnsElem.classList.remove('hidden');
				deleteBtn.removeEventListener('click', deleteClick);
				button.removeEventListener('click', closeAlert);
			}

			var deleteClick = function (evt) {
				Delete(title);
				//saveLoadModalElem.modal('toggle');
				for (var index = 0, end = saveSelectElem.children.length; index < end; ++index) {
					var child = saveSelectElem.children[index];
					if (child.innerHTML === title) {
						saveSelectElem.removeChild(child);
						break;
					}
				}
				closeAlert();
			};
			deleteBtn.addEventListener('click', deleteClick);
			button.addEventListener('click', closeAlert);

			var div = document.createElement('div');
			div.appendChild(deleteBtn);
			div.appendChild(button);

			alert.appendChild(div);

			modalPrimaryBtnsElem.classList.toggle('hidden');
			modalFooter.appendChild(alert);
		});
		saveSelectElem.addEventListener('change', function (evt) {
			saveTitleElem.value = saveSelectElem.value;
		});



		mode = Number(modeSelectElem.value);
		bgStyle = bgElem.value;
		strokeStyle = strokeElem.value;
		fillStyle = fillElem.value;
		len.x = Number(lengthXElem.value);
		len.y = Number(lengthYElem.value);
		document.body.addEventListener('keydown', function (evt) {
			var keyCode = evt.keyCode;
			if (evt.target.tagName === "INPUT") {
				return true;
			}
			switch (keyCode) {
			case 68:
			case 48:
				mode = 0;
				modeSelectElem.selectedIndex = 0;
				break;
			case 49:
				mode = 1;
				modeSelectElem.selectedIndex = 1;
				break;
			case 50:
				mode = 2;
				modeSelectElem.selectedIndex = 2;

				break;
			case 51:
				mode = 3;
				modeSelectElem.selectedIndex = 3;
				break;

			case 37:
				--len.x;
				lengthXElem.value = len.x;
				break;
			case 39:
				++len.x;
				lengthXElem.value = len.x;
				break;
			case 38:
				++len.y;
				lengthYElem.value = len.y;
				break;
			case 40:
				--len.y;
				lengthYElem.value = len.y;
				break;
			}
		});
	}
	requestId = window.requestAnimationFrame(StepAB);
}());