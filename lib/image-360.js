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
		var x = options.x ? sanitizer.number(options.x[0]) : 0
		var y = options.y ? sanitizer.number(options.y[0]) : 0
		var w = options.width ? sanitizer.number(options.width[0]) : 0
		var h = options.height ? sanitizer.number(options.height[0]) : 0


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

			var scaleWidth = 600
			var scaleFactor =  (scaleWidth / w)

			var resizeCanvas = new Canvas(scaleWidth, h * scaleFactor)
			resizeCanvas.style = {} // dummy shim to prevent errors during render.setSize

			var renderer = new THREE.CanvasRenderer({
				canvas: canvas,
				antialiasing: false
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

			resizeCanvas.getContext("2d").drawImage(canvas,
				x, y, w, h,
				0, 0, resizeCanvas.width, resizeCanvas.height)

			var out = fs.createWriteStream(destinationUrl)
			var canvasStream = resizeCanvas.jpegStream({quality:100})

			canvasStream.on("data", function (chunk) { out.write(chunk) })
			canvasStream.on("end", function () { resolve() })
		}

		img.onerror = reject

		img.src = sourceUrl
	})
}

module.exports = draw360