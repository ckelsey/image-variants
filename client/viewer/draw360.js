window.draw360 = function (imageItem, canvasWrapper, is3D) {
	canvasWrapper.innerHTML = ""

	return new Promise(function (respond) {
		var minZoom = 5,
			maxZoom = 100,
			zoom = 40,
			renderer, scene, camera, texture, material, isUserInteracting, img, storedImg, controls,
			ctxTop = window.document.createElement("canvas").getContext("2d"),
			distance = 50,
			onPointerDownPointerX = 0,
			onPointerDownPointerY = 0,
			onPointerDownLon = 0,
			onPointerDownLat = 0,
			lon = 0,
			lat = 0,
			phi = 0,
			theta = 0,
			subscriptions = [],
			canDoVR = false,
			animationFrame,
			vrButton = window.document.createElement('button')


		function subscribe(cb) {
			subscriptions.push(cb)
		}

		function draw() {
			lat = Math.max(- 85, Math.min(85, lat))
			phi = window.THREE.Math.degToRad(90 - lat)
			theta = window.THREE.Math.degToRad(lon - 180)
			camera.position.x = distance * Math.sin(phi) * Math.cos(theta)
			camera.position.y = distance * Math.cos(phi)
			camera.position.z = distance * Math.sin(phi) * Math.sin(theta)
			camera.lookAt(scene.position)

			if (canDoVR) {
				controls.update()
			}

			renderer.render(scene, camera)

			subscriptions.forEach(function (cb) {
				cb({
					pan: lon,
					tilt: lat,
					zoom: distance,
					sourceWidth: canvasWrapper.offsetWidth,
					sourceHeight: canvasWrapper.offsetHeight,
					viewWidth: canvasWrapper.offsetWidth,
					viewHeight: canvasWrapper.offsetHeight
				})
			})
		}

		function animate() {
			animationFrame = window.requestAnimationFrame(animate)
			draw()
		}

		function onDocumentMouseDown(event) {
			event.preventDefault()
			isUserInteracting = true
			onPointerDownPointerX = event.clientX
			onPointerDownPointerY = event.clientY
			onPointerDownLon = lon
			onPointerDownLat = lat
		}

		function onDocumentMouseMove(event) {
			if (isUserInteracting === true) {
				lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon
				lat = (onPointerDownPointerY - event.clientY) * 0.1 + onPointerDownLat
			}
		}

		function onDocumentMouseUp() {
			isUserInteracting = false
		}

		function onDocumentMouseWheel(event) {
			event.preventDefault()
			distance += event.deltaY * 0.05

			if (distance < minZoom) {
				distance = minZoom
			}

			if (distance > maxZoom) {
				distance = maxZoom
			}
		}

		function resize() {
			renderer.setSize(canvasWrapper.offsetWidth, canvasWrapper.offsetHeight)
			camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight
			camera.updateProjectionMatrix()
		}

		function setImages(_img) {
			return new Promise(function (resolve) {
				storedImg = _img
				if (_img.naturalWidth === _img.naturalHeight || is3D) {
					is3D = true
					ctxTop.canvas.width = _img.naturalWidth
					ctxTop.canvas.height = _img.naturalHeight / 2
					ctxTop.drawImage(_img, 0, 0)
					img = ctxTop.canvas
					resolve(img)
				} else {
					img = _img
					resolve(img)
				}

				if (window.navigator.getVRDisplays) {
					try {
						window.navigator.getVRDisplays().then(function (displays) {
							if (displays.length > 0) {
								var vrDisplay = displays[0]
								canDoVR = vrDisplay.capabilities.canPresent

								if (canDoVR) {
									vrButton.textContent = "VR"
									vrButton.style.position = "relative"
									canvasWrapper.appendChild(vrButton)
									vrButton.addEventListener('click', function () {
										window.cancelAnimationFrame(animationFrame)
										window.drawVr(storedImg, canvasWrapper, is3D)
									}, false)
								}
							}
						})
					} catch (e) { }
				}
			})
		}

		function run() {

			renderer = new window.THREE.WebGLRenderer({ antialiasing: false, preserveDrawingBuffer: true })
			renderer.setPixelRatio(window.devicePixelRatio)
			renderer.setSize(canvasWrapper.offsetWidth, canvasWrapper.offsetHeight)
			canvasWrapper.appendChild(renderer.domElement)
			renderer.domElement.preserveDrawingBuffer = true

			scene = new window.THREE.Scene()

			camera = new window.THREE.PerspectiveCamera(zoom, canvasWrapper.offsetWidth / canvasWrapper.offsetHeight, 1, 2000)
			camera.layers.enable(1) // render left view when no stereo available
			camera.target = new window.THREE.Vector3(0, 0, 0)
			camera.lookAt(camera.target)
			camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight
			camera.updateProjectionMatrix()

			if (canDoVR) {
				controls = new window.THREE.DeviceOrientationControls(camera)
			}

			var geometry = new window.THREE.SphereGeometry(100, 100, 40)
			geometry.applyMatrix(new window.THREE.Matrix4().makeScale(-1, 1, 1))
			geometry.applyMatrix(new window.THREE.Matrix4().makeRotationY(-Math.PI / 2))

			texture = new window.THREE.Texture()
			texture.format = 1022

			material = new window.THREE.MeshBasicMaterial({ transparent: true, map: texture })
			var mesh = new window.THREE.Mesh(geometry, material)
			scene.add(mesh)

			animate()

			if (typeof imageItem === "string") {
				// setImages(imageItem)
				let newimg = new window.Image()
				newimg.onload = function () {
					setImages(newimg).then(function (_img) {
						texture.image = _img
						texture.needsUpdate = true
						draw()
						respond(subscribe)
					})
				}
				newimg.src = imageItem
			} else if (imageItem instanceof window.HTMLImageElement) {
				setImages(imageItem).then(function () {
					texture.image = imageItem
					texture.needsUpdate = true
					draw()
					respond(subscribe)
				})
			} else {
				window.imageReader(imageItem).then(function (newimg) {
					setImages(newimg.img).then(function (_img) {
						texture.image = _img
						texture.needsUpdate = true
						draw()
						respond(subscribe)
					})
				})
			}

			canvasWrapper.addEventListener("mousedown", onDocumentMouseDown, false)
			canvasWrapper.addEventListener("mousemove", onDocumentMouseMove, false)
			canvasWrapper.addEventListener("wheel", onDocumentMouseWheel, false)

			window.document.addEventListener("mouseup", onDocumentMouseUp, false)
			window.addEventListener("resize", resize, true)
		}


		if (window.navigator.getVRDisplays) {
			try {
				window.navigator.getVRDisplays().then(function (displays) {
					if (displays.length > 0) {
						var vrDisplay = displays[0];
						canDoVR = vrDisplay.capabilities.canPresent;
					}

					run();
				});
			} catch (e) {
				run();
			}
		}
	})
}