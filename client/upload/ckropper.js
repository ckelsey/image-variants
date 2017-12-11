/*

TO INIT, PASS IN CANVAS ELEMENT. THERE ARE OPTIONS FOR MINIMUM WIDTH/HEIGHT

ckropper.init(document.querySelector("#canvas_wrapper canvas"), {
	minWidth: 100,
	minHeight: 100
})

=====================================


IF YOU NEED DATA WHEN ITS BEEN UPDATED

ckropper.onUpdate(function (data) {
	x1 = data.x1
	x2 = data.x2
	y1 = data.y1
	y2 = data.y2
})

=====================================


BY DEFAULT ITS HIDDEN, CALL THIS TO SHOW

ckropper.show()

=====================================


CALL THIS TO GET COORDS IN PX

ckropper.getCoordinates()

=====================================

CALL THIS TO GET COORDS IN %

ckropper.getRelativeCoordinates()

======================================

THERE ARE A FEW OPTIONS TO GET A SCREENSHOT

screenshotData(type, quality) => base64 string
screenshotImage(callback, type, quality) => img element
screenshotCanvas(type, quality) => canvas element

*/

window.ckropper = {
	ver: "2.0.0",
	element: null,
	data: {
		mousemove: false,
		positions: {
			y1: 5,
			y2: 5,
			x1: 5,
			x2: 5
		},
		elements: {}
	},

	onUpdateCallbacks: [],
	onUpdate: function (cb) {
		this.onUpdateCallbacks.push(cb)
	},

	getCoordinates: function () {
		var w = window.ckropper.element.offsetWidth
		var h = window.ckropper.element.offsetHeight

		var data = {
			x: (this.data.positions.x1 / 100) * w,
			y: (this.data.positions.y1 / 100) * h,
			width: w - (((this.data.positions.x1 + this.data.positions.x2) / 100) * w),
			height: h - (((this.data.positions.y1 + this.data.positions.y2) / 100) * h)
		}

		for (var p in data) {
			if (data[p]) {
				data[p] = data[p] * window.devicePixelRatio
			}
		}

		return data
	},

	getRelativeCoordinates: function () {
		var w = window.ckropper.element.offsetWidth
		var h = window.ckropper.element.offsetHeight

		return {
			x: this.data.positions.x1,
			y: this.data.positions.y1,
			width: ((w - (((this.data.positions.x1 + this.data.positions.x2) / 100) * w)) / w) * 100,
			height: ((h - (((this.data.positions.y1 + this.data.positions.y2) / 100) * h)) / h) * 100
		}
	},

	screenshotData: function (type, quality) {
		if (!type) {
			type = "image/jpeg"
		}

		if (!quality) {
			quality = 0.92
		}

		return this.screenshotCanvas().toDataURL(type, quality)
	},

	screenshotImage: function (cb, type, quality) {
		if (!type) {
			type = "image/jpeg"
		}

		if (!quality) {
			quality = 0.92
		}

		var img = new window.Image()
		img.onload = function () {
			cb(img)
		}
		img.src = this.screenshotData(type, quality)
	},

	screenshotDownload: function (type, quality) {
		if (!type) {
			type = "image/jpeg"
		}

		if (!quality) {
			quality = 0.92
		}

		var a = window.document.createElement("a")
		a.download = true
		a.href = this.screenshotData(type, quality)
		a.click()
	},

	screenshotCanvas: function () {
		var coords = this.getCoordinates();
		var ctx = window.document.createElement("canvas").getContext("2d")
		ctx.canvas.width = coords.width
		ctx.canvas.height = coords.height
		ctx.drawImage(this.element, coords.x, coords.y, coords.width, coords.height, 0, 0, coords.width, coords.height)
		return ctx.canvas
	},

	init: function (el, options) {
		var self = this
		this.container = window.document.createElement("div")
		this.container.id = "ckrop-positioner"
		this.container.innerHTML = this.createHtml()
		this.onUpdateCallbacks = []
		this.element = el
		this.container.style.display = "none"
		this.element.parentNode.insertBefore(this.container, this.element.nextSibling)
		this.data.elements = {
			north: this.container.querySelector("#north-handle"),
			south: this.container.querySelector("#south-handle"),
			east: this.container.querySelector("#east-handle"),
			west: this.container.querySelector("#west-handle"),
			northeast: this.container.querySelector("#north-east-handle"),
			northwest: this.container.querySelector("#north-west-handle"),
			southeast: this.container.querySelector("#south-east-handle"),
			southwest: this.container.querySelector("#south-west-handle")
		}

		function mouseDown(e) {
			e.preventDefault()
			e.stopPropagation()

			var _this = this
			var handleHeight = (_this.offsetHeight / self.element.offsetHeight) * 100
			var handleWidth = (_this.offsetWidth / self.element.offsetWidth) * 100
			var mode = _this.id

			self.data.mousemove = true

			function move(e) {
				if (!self.data.mousemove) { return }
				e.stopPropagation()
				e.preventDefault()

				var height = ((e.y - (handleHeight / 2)) / self.element.offsetHeight) * 100 || 0
				var width = ((e.x - (handleWidth / 2)) / self.element.offsetWidth) * 100 || 0

				function checkHeight(y1, y2) {
					if (!options.minHeight) {
						return true
					}
					return self.element.offsetHeight - (((y1 + y2) / 100) * self.element.offsetHeight) > options.minHeight
				}

				function checkWidth(x1, x2) {
					if (!options.minWidth) {
						return true
					}
					return self.element.offsetWidth - (((x1 + x2) / 100) * self.element.offsetWidth) > options.minWidth
				}

				if (mode === 'north-handle') {

					if (checkHeight(height, self.data.positions.y2)) {
						self.data.positions.y1 = height
						self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					}

				} else if (mode === 'south-handle') {

					height = 100 - height

					if (checkHeight(height, self.data.positions.y1)) {
						self.data.positions.y2 = height
						self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					}

				} else if (mode === 'east-handle') {

					width = 100 - width

					if (checkWidth(width, self.data.positions.x1)) {
						self.data.positions.x2 = width
						self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
					}

				} else if (mode === 'west-handle') {

					if (checkWidth(width, self.data.positions.x2)) {
						self.data.positions.x1 = width
						self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
					}

				} else if (mode === 'north-east-handle') {

					if (checkHeight(height, self.data.positions.y2)) {
						self.data.positions.y1 = height
						self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					}

					width = 100 - width

					if (checkWidth(width, self.data.positions.x1)) {
						self.data.positions.x2 = width
						self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
					}

				} else if (mode === 'north-west-handle') {
					if (checkHeight(height, self.data.positions.y2)) {
						self.data.positions.y1 = height
						self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					}

					if (checkWidth(width, self.data.positions.x2)) {
						self.data.positions.x1 = width
						self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
					}
				} else if (mode === 'south-east-handle') {
					width = 100 - width
					height = 100 - height

					if (checkHeight(height, self.data.positions.y1)) {
						self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
						self.data.positions.y2 = height
					}

					if (checkWidth(width, self.data.positions.x1)) {
						self.data.positions.x2 = width
						self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
					}
				} else if (mode === 'south-west-handle') {
					height = 100 - height

					if (checkHeight(height, self.data.positions.y1)) {
						self.data.positions.y2 = height
						self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					}

					if (checkWidth(width, self.data.positions.x2)) {
						self.data.positions.x1 = width
						self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
					}
				}

				self.onUpdateCallbacks.forEach(function(cb) {
					cb(self.getCoordinates())
				})
			}

			function clear() {
				self.data.mousemove = false
				window.document.removeEventListener('mousemove', move, false)
				window.document.removeEventListener('mouseup', clear, false)
				window.document.body.removeEventListener('mouseleave', clear, false)
			}

			window.document.addEventListener('mousemove', move, false)
			window.document.addEventListener('mouseup', clear, false)
			window.document.body.addEventListener('mouseleave', clear, false)
		}

		for (var handle in this.data.elements) {
			if (self.data.elements[handle]) {
				self.data.elements[handle].addEventListener("mousedown", mouseDown, false)
			}
		}

		this.sizeWatcher = window.requestAnimationFrame(this.position)

		self.getCoordinates()
	},

	position: function () {
		if (!window.ckropper.container) {
			return;
		}

		if (!window.ckropper.element) {
			window.ckropper.container.parentNode.removeChild(window.ckropper.container)
			return
		}

		window.ckropper.container.style.width = window.ckropper.element.offsetWidth + "px"
		window.ckropper.container.style.height = window.ckropper.element.offsetHeight + "px"
		window.ckropper.sizeWatcher = window.requestAnimationFrame(window.ckropper.position)
	},

	show: function () {
		this.container.style.display = "block"
	},

	createHtml: function () {
		return '<table><tr><td></td><td style="width:10px;"></td><td id="north-space" style="height: 5%;"></td><td style="width:10px"></td><td></td></tr><tr><td style="height:10px"></td><td id="north-west-handle" style="height:10px;cursor: nwse-resize;border-top: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;border-left: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: -5px; top: -5px;"></div></td><td id="north-handle" style="height:10px; background: transparent; cursor: ns-resize; border-top: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 50%; top: -5px; margin-left: -5px;"></div></td><td id="north-east-handle" style="height:10px;cursor: nesw-resize;border-top: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;border-right: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 5px; top: -5px;"></div></td><td style="height:10px"></td></tr><tr><td id="west-space" style="width: 5%;"></td><td id="west-handle" style="cursor: ew-resize;border-left: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="left: -5px; top: 50%; margin-top: -5px;"></div></td><td id="revealed-space" style="background: transparent;"></td><td id="east-handle" style="cursor: ew-resize;border-right: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="right: -5px;top: 50%; margin-top: -5px;"></div></td><td id="east-space" style="width: 5%;"></td></tr><tr><td style="height:10px"></td><td id="south-west-handle" style="height:10px;cursor: nesw-resize; background: transparent; border-bottom: 1px dotted rgba(255, 255, 255, 0.25); border-left: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: -5px; top: 5px;"></div></td><td id="south-handle" style="height:10px; cursor: ns-resize; border-bottom: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="left: 50%; top: 5px; margin-left: -5px;"></div></td><td id="south-east-handle" style="height:10px;cursor: nwse-resize;background: transparent; border-bottom: 1px dotted rgba(255, 255, 255, 0.25); border-right: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 5px; top: 5px;"></div></td><td style="height:10px"></td></tr><tr><td></td><td></td><td id="south-space" style="height: 5%;"></td><td></td><td></td></tr></table><style>#ckrop-positioner{z-index: 9999999;position: absolute;width: 100%;height: 100%;opacity: 1;top: 0px;left: 0px;pointer-events: none;display: none;transition: opacity .2s;}#ckrop-positioner table{width: 100%;height: 100%;border-collapse: collapse;}#ckrop-positioner table td{background: rgba(0, 0, 0, .42);}#ckrop-positioner table td#north-west-handle, #ckrop-positioner table td#north-east-handle, #ckrop-positioner table td#north-handle,#ckrop-positioner table td#south-west-handle, #ckrop-positioner table td#south-east-handle, #ckrop-positioner table td#south-handle,#ckrop-positioner table td#west-handle, #ckrop-positioner table td#east-handle{pointer-events: all;}#ckrop-positioner table td#revealed-space{pointer-events: none;}#ckrop-positioner table td .handle{background: rgba(200, 200, 200, .75);box-shadow: inset 0px 0px 0px 1px rgba(50, 50, 50, .75);width: 10px;height: 10px;position: relative;border-radius: 2px;transition: transform .2s;}#ckrop-positioner table td:hover .handle{transform: scale(1.2);}#ckrop-positioner .positioner-cutout{position: absolute;background: rgba(62, 62, 62, 0.7);display: flex;pointer-events: all;}#ckrop-positioner .positioner-cutout.cutout-top,#ckrop-positioner .positioner-cutout.cutout-bottom{width: 100%;flex-direction: column;left: 0px;height: 10%;cursor: ns-resize;}#ckrop-positioner .positioner-cutout.cutout-left,#ckrop-positioner .positioner-cutout.cutout-right{top: 0px;height: 100%;flex-direction: row;min-width: 10px;cursor: ew-resize;width: 10%;}#ckrop-positioner .positioner-cutout.cutout-top{top: 0%;justify-content: flex-end;}#ckrop-positioner .positioner-cutout.cutout-bottom{bottom: 0%;justify-content: flex-start;}#ckrop-positioner .positioner-cutout.cutout-left{justify-content: flex-end;left: 0%;}#ckrop-positioner .positioner-cutout.cutout-right{justify-content: flex-start;right: 0%;}#ckrop-positioner .cutout-top .cutout-handle,#ckrop-positioner .cutout-bottom .cutout-handle,#ckrop-positioner .cutout-left .cutout-handle,#ckrop-positioner .cutout-right .cutout-handle{border-color: rgba(176, 176, 176, 0.38);border-style: dotted;border-width: 0px;}#ckrop-positioner .cutout-top .cutout-handle,#ckrop-positioner .cutout-bottom .cutout-handle{width: 100%;height: 5px;}#ckrop-positioner .cutout-top .cutout-handle{border-bottom-width: 1px;}#ckrop-positioner .cutout-bottom .cutout-handle{border-top-width: 1px;}#ckrop-positioner .cutout-left .cutout-handle,#ckrop-positioner .cutout-right .cutout-handle{width: 5px;height: 100%;}#ckrop-positioner .cutout-left .cutout-handle{border-right-width: 1px;}#ckrop-positioner .cutout-right .cutout-handle{border-left-width: 1px;}</style>'
	}
}