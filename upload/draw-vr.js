window.drawVr = function (imageItem, canvasWrapper, is3D) {
	return new Promise(function (respond) {
		var glAttribs = {
			antialias: true,
		}

		var frameData = new window.VRFrameData()
		var vrDisplay
		var normalSceneFrame
		var vrSceneFrame
		var canvas = window.document.createElement("canvas")
		var img1 = new window.Image()
		var img2 = new window.Image()
		var ctxTop = window.document.createElement("canvas").getContext("2d")
		var ctxBottom = window.document.createElement("canvas").getContext("2d")
		var panorama = null
		var panorama2 = null
		var viewMat = window.mat4.create()
		var gl = canvas.getContext("webgl", glAttribs)
		var isPresenting = false
		var canPresent = false

		canvasWrapper.appendChild(canvas)

		if (!gl) {
			gl = canvas.getContext("experimental-webgl", glAttribs)
		}

		var subscriptions = []


		function subscribe(cb) {
			subscriptions.push(cb)
		}



		function getPoseMatrix(out, pose) {
			var orientation = pose.orientation
			if (!orientation) { orientation = [0, 0, 0, 1] }

			window.mat4.fromQuat(out, orientation)
			window.mat4.invert(out, out)
		}



		function drawVRScene() {
			vrSceneFrame = vrDisplay.requestAnimationFrame(drawVRScene)
			vrDisplay.getFrameData(frameData)

			getPoseMatrix(viewMat, frameData.pose)

			gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)

			gl.viewport(0, 0, canvas.width * 0.5, canvas.height)
			panorama.render(frameData.leftProjectionMatrix, viewMat)

			gl.viewport(canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height)

			if (is3D) {
				panorama2.render(frameData.rightProjectionMatrix, viewMat)
			} else {
				panorama.render(frameData.rightProjectionMatrix, viewMat)
			}

			vrDisplay.submitFrame()
		}



		function drawScene() {
			normalSceneFrame = window.requestAnimationFrame(drawScene)
			vrDisplay.getFrameData(frameData)

			getPoseMatrix(viewMat, frameData.pose)

			gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)

			gl.viewport(0, 0, canvas.width, canvas.height)
			panorama.render(frameData.leftProjectionMatrix, viewMat)
		}



		function positionCanvas() {
			canvas.style.position = "fixed"

			if (isPresenting) {
				var leftEye = vrDisplay.getEyeParameters("left")
				var rightEye = vrDisplay.getEyeParameters("right")
				canvas.width = (Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2) * window.devicePixelRatio
				canvas.height = (Math.max(leftEye.renderHeight, rightEye.renderHeight)) * window.devicePixelRatio
				canvas.style.width = "100%"
				canvas.style.height = "100%"
				canvas.style.top = "0px"
				canvas.style.left = "0px"
			} else {
				canvas.width = Math.max(window.innerWidth, window.innerHeight) * window.devicePixelRatio
				canvas.height = Math.max(window.innerWidth, window.innerHeight) * window.devicePixelRatio
				canvas.style.width = (canvas.width / window.devicePixelRatio) + "px"
				canvas.style.height = (canvas.height / window.devicePixelRatio) + "px"
				canvas.style.top = ((window.innerHeight - (canvas.height / window.devicePixelRatio)) / 2) + "px"
				canvas.style.left = ((window.innerWidth - (canvas.width / window.devicePixelRatio)) / 2) + "px"
			}
		}



		function onPresent() {
			setTimeout(function () {
				isPresenting = true

				window.cancelAnimationFrame(normalSceneFrame)
				// window.parent.document.getElementById("ansel_viewer_frame").classList.add("in-vr-mode")

				positionCanvas()

				if (is3D) {

					if (!panorama) {
						panorama = new window.VRPanorama(gl)
					}
					panorama.useImage(img1)

					if (!panorama2) {
						panorama2 = new window.VRPanorama(gl)
					}
					panorama2.useImage(img2)

					drawVRScene()
				} else {
					if (!panorama) {
						panorama = new window.VRPanorama(gl)
					}
					panorama.useImage(img1)
					drawVRScene()
				}
			}, 500)
		}



		function onNormalScene() {
			try {
				vrDisplay.cancelAnimationFrame(vrSceneFrame)
			} catch (e) { }

			positionCanvas()

			// window.parent.document.getElementById("ansel_viewer_frame").classList.remove("in-vr-mode")

			isPresenting = false

			if (!panorama) {
				panorama = new window.VRPanorama(gl)
			}

			panorama.useImage(img1)
			drawScene()
		}



		function setImages(img) {
			return new Promise(function (res) {
				if (is3D) {
					ctxTop.canvas.width = img.naturalWidth
					ctxTop.canvas.height = img.naturalHeight / 2
					ctxTop.drawImage(img, 0, 0)

					ctxBottom.canvas.width = img.naturalWidth
					ctxBottom.canvas.height = img.naturalHeight / 2
					ctxBottom.drawImage(img, 0, -ctxBottom.canvas.height)

					img1 = ctxTop.canvas
					img2 = ctxBottom.canvas
					res()

				} else {
					img1 = img
					res()
				}
			})
		}



		var present = function () {
			vrDisplay.requestPresent([{ source: canvas }]).then(function () {
				onPresent()
			})
		}


		if (window.navigator.getVRDisplays) {
			try {
				window.navigator.getVRDisplays().then(function (displays) {
					if (displays.length > 0) {
						vrDisplay = displays[0]
						canPresent = vrDisplay.capabilities.canPresent
					}
				})
			} catch (e) { }
		}

		if (typeof imageItem === "string") {
			// setImages(imageItem)
			let newimg = new window.Image()
			newimg.onload = function () {
				setImages(newimg).then(function () {
					onPresent()
					// if (isPresenting) {
					// 	onPresent()
					// } else {
					// 	onNormalScene()
					// }

					respond(subscribe)
				})
			}
			newimg.src = imageItem
		} else {
			window.imageReader(imageItem).then(function (newimg) {
				setImages(newimg.img).then(function () {
					onPresent()
					// if (isPresenting) {
					// 	onPresent()
					// } else {
					// 	onNormalScene()
					// }
					respond(subscribe)
				})
			})
		}


		window.addEventListener("resize", function () {
			positionCanvas()
		})

		window.addEventListener("vrdisplaypresentchange", function () {
			if (!vrDisplay.isPresenting) {
				onNormalScene()
			}
		})
	})
}