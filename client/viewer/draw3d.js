
window.draw3D = function (imageItem, canvasWrapper, fill) {
	canvasWrapper.innerHTML = ""

	return new Promise(function (respond) {
		var vrDisplay = null, gl, image, zoom, canvas, image2D, image3D, updatedCount = 0, subscriptions = []

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

		if (window.navigator.getVRDisplays) {
			try {
				window.navigator.getVRDisplays().then(function (displays) {
					if (displays.length > 0 && displays[0].capabilities.canPresent) {
						vrDisplay = displays[0]
					}
				})
			} catch (e) { }
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

		function setZoom() {
			if (!image) {
				return 0
			}

			zoom = getMinZoom()

			canvas.setZoom(zoom)
			image.viewportCenter()
			image.setCoords()

			sendUpdate()
		}

		function create2D(uri) {
			return new Promise(function (resolve) {

				var img = new window.Image()

				img.onload = function () {
					var ctx = window.document.createElement("canvas").getContext("2d")
					gl = canvas.getContext("webgl", {})
					ctx.canvas.width = img.naturalWidth / 2
					ctx.canvas.height = img.naturalHeight
					ctx.drawImage(img, 0, 0)
					return resolve(ctx.canvas.toDataURL())
				}

				img.src = uri

			})
		}

		function elResize() {
			canvas.setDimensions({ width: Math.floor(canvasWrapper.offsetWidth), height: Math.floor(canvasWrapper.offsetHeight) })
			setZoom()

			if (image) {
				image.viewportCenter()
				image.setCoords()

				sendUpdate()
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

		function mouseWheel(e) {
			e.preventDefault()

			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))
			if (delta !== 0) {
				setZoomingPoint(-delta / 16)
			}
		}

		function setZoomingPoint(amount) {
			var canvasCenterX = canvasWrapper.offsetWidth / 2
			var canvasCenterY = canvasWrapper.offsetHeight / 2
			var point = new window.fabric.Point(canvasCenterX, canvasCenterY)
			zooming(point, -amount * 16)
		}

		function setEvents() {
			// Events.setCommonEvents(canvas.getElement())

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
				}
				previousEvent = e
				sendUpdate()
			})

			// Events.subscribe("mouseWheel", mouseWheel)
			// Events.subscribe("zoom", function (amount) { setZoomingPoint(amount) })
			// Events.subscribe("reCenter", function () { reCenter() })

			canvasWrapper.addEventListener("mousewheel", mouseWheel, false)
			window.document.addEventListener("fullscreenchange", reCenter, false)
			window.document.addEventListener("webkitfullscreenchange", reCenter, false)
			window.document.addEventListener("mozfullscreenchange", reCenter, false)
		}

		function updateImage(uri) {
			canvas.clear()

			window.fabric.Image.fromURL(uri, function (oImg) {
				canvas.add(oImg)

				image = canvas.getObjects()[0]
				image.hasBorders = image.hasControls = false
				image.selectable = false

				setZoom()

				image.viewportCenter()
				image.setCoords()
				canvas.renderAll()

				setEvents()

				canvasWrapper.classList.add("active")

				sendUpdate()

			}, { crossOrigin: "anonymous" })
		}



		function reCenter() {
			setZoom()
			if (image) {
				image.viewportCenter()
				image.setCoords()
				sendUpdate()
			}
		}



		function run() {
			canvas = window.document.createElement("canvas")
			canvasWrapper.appendChild(canvas)
			canvas = new window.fabric.Canvas(canvas, {
				allowTouchScrolling: false,
				enableRetinaScaling: true,
				stopContextMenu: true,
				lockUniScaling: true,
				centeredScaling: false,
				alignX: "mid",
				alignY: "mid",
			})

			canvas.setDimensions({ width: Math.floor(canvasWrapper.offsetWidth), height: Math.floor(canvasWrapper.offsetHeight) })
			canvas.selection = false

			if (typeof imageItem === "string") {
				create2D(imageItem).then(function (img2d) {
					image2D = img2d
					updateImage(image2D)
					respond(subscribe)
					sendUpdate()
				})
			} else {
				window.imageReader(imageItem).then(function (img) {
					image3D = img.url
					create2D(img.url).then(function (img2d) {
						image2D = img2d
						updateImage(image2D)
						respond(subscribe)
						sendUpdate()
					})


				})
			}
		}

		run()

		window.addEventListener("resize", elResize, true)
	})
}