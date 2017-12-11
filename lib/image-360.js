const sanitizer = require("./sanitize")
const THREE = global.THREE = require("three")
require("../three/canvas-renderer")
require("../three/projector")

const fs = require("fs")
const Canvas = require("canvas")

global.document = {
	createElement: function (tag) {
		if (tag === "img") {
			return new Canvas.Image()
		} else if (tag === "canvas") {
			return new Canvas()
		}
	}
}


function draw360(sourceUrl, destinationUrl, options) {
	return new Promise((resolve, reject) => {

		options = options || {}
		options.viewWidth = options.viewWidth ? sanitizer.number(options.viewWidth[0]) : 4096
		options.viewHeight = options.viewHeight ? sanitizer.number(options.viewHeight[0]) : 2048

		var zoom = 40
		var aspect = options.viewWidth / options.viewHeight
		var lat = options.tilt ? sanitizer.number(options.tilt[0]) : 0
		var lon = options.pan ? sanitizer.number(options.pan[0]) : 270
		var distance = options.zoom ? sanitizer.number(options.zoom[0]) : 10
		var x1 = options.x1 ? sanitizer.number(options.x1[0]) : 0
		var x2 = options.x2 ? sanitizer.number(options.x2[0]) : 0
		var y1 = options.y1 ? sanitizer.number(options.y1[0]) : 0
		var y2 = options.y2 ? sanitizer.number(options.y2[0]) : 0

		options.viewHeight = options.viewHeight * 2
		options.viewWidth = options.viewWidth * 2

		var scene = new THREE.Scene()

		var camera = new THREE.PerspectiveCamera(zoom, aspect, 1, 2000)
		camera.layers.enable(1) // render left view when no stereo available
		camera.target = new THREE.Vector3(0, 0, 0)
		camera.lookAt(camera.target)
		camera.aspect = aspect
		camera.updateProjectionMatrix()

		var geometry = new THREE.SphereGeometry(100, 100, 40)
		geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1))
		geometry.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI / 2))



		var img = new Canvas.Image()
		img.onload = function () {
			var loadedImg = img

			if (img.width === img.height) {
				var tempCanvas = new Canvas(img.width, img.height / 2)
				tempCanvas.getContext("2d").drawImage(loadedImg, 0, 0)
				loadedImg = tempCanvas
			}

			var texture = new THREE.Texture()
			texture.format = 1022
			texture.image = loadedImg
			texture.needsUpdate = true

			var material = new THREE.MeshBasicMaterial({ transparent: true, map: texture })
			material.overdraw = 0.5
			var mesh = new THREE.Mesh(geometry, material)
			scene.add(mesh)

			var canvas = new Canvas(options.viewWidth, options.viewHeight)
			canvas.style = {} // dummy shim to prevent errors during render.setSize

			var yCropFactor = 1 - ((y1 + y2 !== 0 ? y1 + y2 : 100) / 100)
			var xCropFactor = 1- ((x1 + x2 !== 0 ? x1 + x2 : 100) / 100)
			var croppedHeight = options.viewHeight * yCropFactor
			var croppedWidth = options.viewWidth * xCropFactor

			var cropCanvas = new Canvas(croppedWidth, croppedHeight)
			cropCanvas.style = {} // dummy shim to prevent errors during render.setSize

			var resizeCanvas = new Canvas(600, croppedHeight * (600 / croppedWidth))
			resizeCanvas.style = {} // dummy shim to prevent errors during render.setSize

			var renderer = new THREE.CanvasRenderer({
				canvas: canvas
			})

			renderer.setSize(options.viewWidth, options.viewHeight)

			lat = Math.max(- 85, Math.min(85, lat))
			var phi = THREE.Math.degToRad(90 - lat)
			var theta = THREE.Math.degToRad(lon - 180)
			camera.position.x = distance * Math.sin(phi) * Math.cos(theta)
			camera.position.y = distance * Math.cos(phi)
			camera.position.z = distance * Math.sin(phi) * Math.sin(theta)
			camera.lookAt(scene.position)

			renderer.render(scene, camera)

			cropCanvas.getContext("2d").drawImage(canvas, 1 - ((x1 / 100) * options.viewWidth), 1 - ((y1 / 100) * options.viewHeight))
			resizeCanvas.getContext("2d").drawImage(cropCanvas,
				0, 0, cropCanvas.width, cropCanvas.height,
				0, 0, resizeCanvas.width, resizeCanvas.height)

			var out = fs.createWriteStream(destinationUrl)
			var canvasStream = resizeCanvas.jpegStream()

			canvasStream.on("data", function (chunk) { out.write(chunk) })
			canvasStream.on("end", function () { resolve() })
		}

		img.onerror = reject

		img.src = sourceUrl
	})
}

module.exports = draw360