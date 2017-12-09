window.draw2D = function (imageItem, canvasWrapper, fill) {

	canvasWrapper.innerHTML = ""

	return new Promise(function (respond) {

		var image, zoomMin, zoom, canvas, subscriptions = []

		function subscribe(cb) {
			subscriptions.push(cb)
		}

		function sendUpdate() {
			subscriptions.forEach(function (cb) {
				cb({
					pan: image.oCoords.tl.x < 0 ? image.oCoords.tl.x : 0,
					tilt: image.oCoords.tl.y < 0 ? image.oCoords.tl.y : 0,
					zoom: zoom,
					sourceWidth: image.width,
					sourceHeight: image.height,
					viewWidth: canvasWrapper.offsetWidth,
					viewHeight: canvasWrapper.offsetHeight
					// viewWidth: image.oCoords.tl.x < 0 ? canvasWrapper.offsetWidth : canvasWrapper.offsetWidth - (image.oCoords.tl.x * 2),
					// viewHeight: image.oCoords.tl.y < 0 ? canvasWrapper.offsetHeight : canvasWrapper.offsetHeight - (image.oCoords.tl.y * 2),
				})
			})
		}

		function getMinZoom() {
			if (!image) {
				return 0
			}

			let method = fill ? 'max' : 'min'

			return Math[method](canvasWrapper.offsetWidth / image.width, canvasWrapper.offsetHeight / image.height)
		}

		function isOutOfBounds(x, y) {
			image.setCoords()
			var top = image.oCoords.tl.y
			var left = image.oCoords.tl.x
			var bottom = image.oCoords.bl.y
			var right = image.oCoords.br.x
			var height = bottom - top
			var width = right - left
			var cHeight = canvas.height
			var cWidth = canvas.width
			var xOutOfBounds = false
			var yOutOfBounds = false
			var correctedY = y
			var correctedX = x

			if (((bottom + y) <= cHeight) || ((bottom + y) >= height && (top + y) >= 0)) {
				yOutOfBounds = true

				if ((bottom + y) <= cHeight) {
					correctedY = cHeight - (bottom + y)
				} else {
					correctedY = height - (bottom + y)
				}

				if (cHeight > height) {
					correctedY = correctedY - ((cHeight - height) / 2)
				}
			}

			if (((right + x) <= cWidth) || ((right + x) >= width && (left + x) >= 0)) {
				xOutOfBounds = true

				if ((right + x) <= cWidth) {
					correctedX = cWidth - (right + x)
				} else {
					correctedX = width - (right + x)
				}

				if (cWidth > width) {
					correctedX = correctedX - ((cWidth - width) / 2)
				}
			}

			return {
				x: xOutOfBounds,
				correctedX: correctedX,
				y: yOutOfBounds,
				correctedY: correctedY
			}
		}

		function zooming(point, amount) {
			amount = (amount * (zoom * 0.025))

			if (zoom + amount > getMinZoom() || amount > 0) {
				zoom = zoom + amount
				canvas.zoomToPoint(point, zoom)
			} else {
				canvas.zoomToPoint(point, zoom)
			}

			var outOfBounds = isOutOfBounds(0, 0)

			if (outOfBounds.x || outOfBounds.y) {
				var delta = new window.fabric.Point(outOfBounds.correctedX, outOfBounds.correctedY)
				canvas.relativePan(delta)
			}

			sendUpdate()
		}

		function setZoomingPoint(amount) {
			var canvasCenterX = canvasWrapper.offsetWidth / 2
			var canvasCenterY = canvasWrapper.offsetHeight / 2
			var point = new window.fabric.Point(canvasCenterX, canvasCenterY)
			zooming(point, -amount * 16)
		}

		function mouseWheel(e) {
			e.preventDefault()
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
			if (delta !== 0) {
				setZoomingPoint(-delta / 16)
			}
		}

		function reCenter() {
			zoom = zoomMin = getMinZoom()
			canvas.setZoom(zoomMin)
			if (image) {
				image.viewportCenter()
				image.setCoords()
			}

			canvas.renderAll()

			sendUpdate()
		}

		function elResize() {
			canvas.setDimensions({ width: Math.floor(canvasWrapper.offsetWidth), height: Math.floor(canvasWrapper.offsetHeight) })

			zoomMin = getMinZoom()

			if (zoom < zoomMin) {
				zoom = zoomMin
				canvas.setZoom(zoomMin)
			}

			if (image) {

				var outOfBounds = isOutOfBounds(0, 0)

				if (outOfBounds.x || outOfBounds.y) {
					var delta = new window.fabric.Point(outOfBounds.correctedX, outOfBounds.correctedY)
					canvas.relativePan(delta)
				}

				image.setCoords()
			}

			sendUpdate()
		}

		function setEvents() {

			var panning = false
			var previousEvent = null

			canvas.on("mouse:down", function () {
				panning = true
			})

			canvas.on("mouse:up", function () {
				panning = false
			})

			canvas.on("mouse:move", function (e) {
				if (panning && e && e.e) {
					var x = e.e.movementX
					var y = e.e.movementY
					if (!x) {
						x = e.e.screenX - previousEvent.e.screenX
						y = e.e.screenY - previousEvent.e.screenY
					}

					var outOfBounds = isOutOfBounds(x, y)

					if (outOfBounds.y) { y = 0 }
					if (outOfBounds.x) { x = 0 }

					var delta = new window.fabric.Point(x, y)
					canvas.relativePan(delta)

					sendUpdate()
				}
				previousEvent = e
			})

			canvasWrapper.addEventListener("mousewheel", mouseWheel, false)
			window.document.addEventListener("fullscreenchange", reCenter, false)
			window.document.addEventListener("webkitfullscreenchange", reCenter, false)
			window.document.addEventListener("mozfullscreenchange", reCenter, false)

		}


		function updateImage(uri) {
			image = canvas.getObjects()[0]
			canvas.remove(image)

			window.fabric.Image.fromURL(uri, function (oImg) {
				window.URL.revokeObjectURL(uri)
				canvas.add(oImg)

				image = canvas.getObjects()[0]
				image.hasBorders = image.hasControls = false
				image.selectable = false

				var previousZoomMin = zoomMin
				zoomMin = getMinZoom()

				if (!zoom) {
					zoom = zoomMin
					canvas.setZoom(zoomMin)
				} else {
					zoom = zoom / (previousZoomMin / zoomMin)
					canvas.setZoom(zoom)
				}

				image.viewportCenter()

				image.setCoords()
				canvas.renderAll()

				setEvents()

				canvasWrapper.classList.add("active")

				sendUpdate()

			}, { crossOrigin: "anonymous" })
		}


		function run() {

			canvas = window.document.createElement("canvas")
			canvasWrapper.appendChild(canvas)
			canvas = new window.fabric.Canvas(canvas, {
				allowTouchScrolling: false,
				enableRetinaScaling: true,
				stopContextMenu: true,
				lockUniScaling: true,
				centeredScaling: true,
				alignX: "mid",
				alignY: "mid",
			})

			canvas.setDimensions({ width: canvasWrapper.offsetWidth, height: canvasWrapper.offsetHeight })
			canvas.selection = false

			if (typeof imageItem === "string") {
				updateImage(imageItem)
				respond(subscribe)
				sendUpdate()
			} else {
				window.imageReader(imageItem).then(function (img) {
					updateImage(img.url)
					respond(subscribe)
					sendUpdate()
				})
			}

			window.addEventListener("resize", elResize, false)

		}

		run()
	})
}