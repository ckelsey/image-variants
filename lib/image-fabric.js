const sanitizer = require("./sanitize")
const fs = require("fs")
const Canvas = require("canvas")
const {fabric} = require("fabric")

global.document = {
	createElement: function (tag) {
		if (tag === "img") {
			return new Canvas.Image()
		} else if (tag === "canvas") {
			return new Canvas()
		}
	}
}

function drawFabric(sourceUrl, destinationUrl, options, meta) {
	return new Promise((resolve) => {

		options = options || {}
		options.viewWidth = options.viewWidth ? sanitizer.number(options.viewWidth[0]) : meta.dimensions.width
		options.viewHeight = options.viewHeight ? sanitizer.number(options.viewHeight[0]) : meta.dimensions.height
		options.sourceWidth = options.sourceWidth ? sanitizer.number(options.sourceWidth[0]) : meta.dimensions.width
		options.sourceHeight = options.sourceHeight ? sanitizer.number(options.sourceHeight[0]) : meta.dimensions.height

		var zoom = options.zoom ? sanitizer.number(options.zoom[0]) : 40
		var lat = options.tilt ? sanitizer.number(options.tilt[0]) : 0
		var lon = options.pan ? sanitizer.number(options.pan[0]) : 0
		var x1 = options.x1 ? sanitizer.number(options.x1[0]) : 0
		var x2 = options.x2 ? sanitizer.number(options.x2[0]) : 0
		var y1 = options.y1 ? sanitizer.number(options.y1[0]) : 0
		var y2 = options.y2 ? sanitizer.number(options.y2[0]) : 0

		var img = new Canvas.Image()
		img.onload = function () {
			var loadedImg = img
			var viewHeight = options.viewHeight
			var viewWidth = options.viewWidth

			var canvas = new Canvas(viewWidth, viewHeight)
			canvas.style = {} // dummy shim to prevent errors during render.setSize

			var ctx = canvas.getContext("2d");
			ctx.scale(zoom, zoom);
			ctx.drawImage(loadedImg, lon / zoom, lat / zoom)

			var yCropFactor = 1 - ((y1 + y2 !== 0 ? y1 + y2 : 100) / 100)
			var xCropFactor = 1 - ((x1 + x2 !== 0 ? x1 + x2 : 100) / 100)
			var croppedHeight = viewHeight * yCropFactor
			var croppedWidth = viewWidth * xCropFactor

			var cropCanvas = new Canvas(croppedWidth, croppedHeight)
			cropCanvas.style = {} // dummy shim to prevent errors during render.setSize

			cropCanvas.getContext("2d").drawImage(canvas, 1 - ((x1 / 100) * viewWidth), 1 - ((y1 / 100) * viewHeight))

			var resizeCanvas = new Canvas(600, croppedHeight * (600 / croppedWidth))
			resizeCanvas.style = {} // dummy shim to prevent errors during render.setSize

			resizeCanvas.getContext("2d").drawImage(cropCanvas, 0, 0, cropCanvas.width, cropCanvas.height, 0, 0, resizeCanvas.width, resizeCanvas.height)

			var out = fs.createWriteStream(destinationUrl)
			var canvasStream = resizeCanvas.jpegStream()

			canvasStream.on("data", function (chunk) { out.write(chunk) })
			canvasStream.on("end", function () { resolve() })

		}

		img.src = sourceUrl
	})
}

module.exports = drawFabric