/*

ckropper.init(document.querySelector("#canvas_wrapper canvas"), {
	minWidth: 400
})

ckropper.onUpdate(function (data) {
	x1 = data.x1
	x2 = data.x2
	y1 = data.y1
	y2 = data.y2
})

ckropper.show()

*/

window.ckropper = {
	element: null,
	data: {
		mousemove: false,
		positions: {
			y1: 0,
			y2: 0,
			x1: 0,
			x2: 0
		},
		elements: {}
	},

	onUpdateCallbacks: [],
	onUpdate: function (cb) {
		this.onUpdateCallbacks.push(cb)
	},

	getCoordinates: function () {
		return {
			x: (this.data.positions.x1 / 100) * this.element.offsetWidth,
			y: (this.data.positions.y1 / 100) * this.element.offsetHeight,
			width: this.element.offsetWidth - (((this.data.positions.x1 + this.data.positions.x2) / 100) * this.element.offsetWidth),
			height: this.element.offsetHeight - (((this.data.positions.y1 + this.data.positions.y2) / 100) * this.element.offsetHeight)
		}
	},

	getRelativeCoordinates: function () {
		return {
			x: this.data.positions.x1,
			y: this.data.positions.y1,
			width: ((this.element.offsetWidth - (((this.data.positions.x1 + this.data.positions.x2) / 100) * this.element.offsetWidth)) / this.element.offsetWidth) * 100,
			height: ((this.element.offsetHeight - (((this.data.positions.y1 + this.data.positions.y2) / 100) * this.element.offsetHeight)) / this.element.offsetHeight) * 100
		}
	},

	screenshot: function () {
		var ctx = document.createElement("canvas").getContext("2d")
	},

	init: function (el) {
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

				if (mode === 'north-handle') {
					self.data.positions.y1 = height
					self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
				} else if (mode === 'south-handle') {
					height = 100 - height
					self.data.positions.y2 = height
					self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
				} else if (mode === 'east-handle') {
					width = 100 - width
					self.data.positions.x2 = width
					self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'west-handle') {
					self.data.positions.x1 = width
					self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				} else if (mode === 'north-east-handle') {
					width = 100 - width
					self.data.positions.y1 = height
					self.data.positions.x2 = width
					self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'north-west-handle') {
					self.data.positions.y1 = height
					self.data.positions.x1 = width
					self.container.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				} else if (mode === 'south-east-handle') {
					width = 100 - width
					height = 100 - height
					self.data.positions.y2 = height
					self.data.positions.x2 = width
					self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					self.container.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'south-west-handle') {
					height = 100 - height
					self.data.positions.y2 = height
					self.data.positions.x1 = width
					self.container.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					self.container.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				}

				self.onUpdateCallbacks.forEach(function(cb) {
					cb(self.data.positions, self.getCoordinates())
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
		return '<table><tr><td></td><td style="width:10px;"></td><td id="north-space" style="height: 5%;"></td><td style="width:10px"></td><td></td></tr><tr><td style="height:10px"></td><td id="north-west-handle" style="height:10px;cursor: nwse-resize;border-top: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;border-left: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: -5px; top: -5px;"></div></td><td id="north-handle" style="height:10px; background: transparent; cursor: ns-resize; border-top: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 50%; top: -5px; margin-left: -5px;"></div></td><td id="north-east-handle" style="height:10px;cursor: nesw-resize;border-top: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;border-right: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 5px; top: -5px;"></div></td><td style="height:10px"></td></tr><tr><td id="west-space" style="width: 5%;"></td><td id="west-handle" style="cursor: ew-resize;border-left: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="left: -5px; top: 50%; margin-top: -5px;"></div></td><td id="revealed-space" style="background: transparent;"></td><td id="east-handle" style="cursor: ew-resize;border-right: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="right: -5px;top: 50%; margin-top: -5px;"></div></td><td id="east-space" style="width: 5%;"></td></tr><tr><td style="height:10px"></td><td id="south-west-handle" style="height:10px;cursor: nesw-resize; background: transparent; border-bottom: 1px dotted rgba(255, 255, 255, 0.25); border-left: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: -5px; top: 5px;"></div></td><td id="south-handle" style="height:10px; cursor: ns-resize; border-bottom: 1px dotted rgba(255, 255, 255, 0.25);background: transparent;"><div class="handle" style="left: 50%; top: 5px; margin-left: -5px;"></div></td><td id="south-east-handle" style="height:10px;cursor: nwse-resize;background: transparent; border-bottom: 1px dotted rgba(255, 255, 255, 0.25); border-right: 1px dotted rgba(255, 255, 255, 0.25);"><div class="handle" style="left: 5px; top: 5px;"></div></td><td style="height:10px"></td></tr><tr><td></td><td></td><td id="south-space" style="height: 5%;"></td><td></td><td></td></tr></table><style>#ckrop-positioner{position: absolute;width: 100%;height: 100%;opacity: 1;top: 0px;left: 0px;pointer-events: none;display: none;transition: opacity .2s;}#ckrop-positioner table{width: 100%;height: 100%;border-collapse: collapse;}#ckrop-positioner table td{background: rgba(0, 0, 0, .42);pointer-events: all;}#ckrop-positioner table td#revealed-space{pointer-events: none;}#ckrop-positioner table td .handle{background: rgba(200, 200, 200, .75);box-shadow: inset 0px 0px 0px 1px rgba(50, 50, 50, .75);width: 10px;height: 10px;position: relative;border-radius: 2px;transition: transform .2s;}#ckrop-positioner table td:hover .handle{transform: scale(1.2);}#ckrop-positioner .positioner-cutout{position: absolute;background: rgba(62, 62, 62, 0.7);display: flex;pointer-events: all;}#ckrop-positioner .positioner-cutout.cutout-top,#ckrop-positioner .positioner-cutout.cutout-bottom{width: 100%;flex-direction: column;left: 0px;height: 10%;cursor: ns-resize;}#ckrop-positioner .positioner-cutout.cutout-left,#ckrop-positioner .positioner-cutout.cutout-right{top: 0px;height: 100%;flex-direction: row;min-width: 10px;cursor: ew-resize;width: 10%;}#ckrop-positioner .positioner-cutout.cutout-top{top: 0%;justify-content: flex-end;}#ckrop-positioner .positioner-cutout.cutout-bottom{bottom: 0%;justify-content: flex-start;}#ckrop-positioner .positioner-cutout.cutout-left{justify-content: flex-end;left: 0%;}#ckrop-positioner .positioner-cutout.cutout-right{justify-content: flex-start;right: 0%;}#ckrop-positioner .cutout-top .cutout-handle,#ckrop-positioner .cutout-bottom .cutout-handle,#ckrop-positioner .cutout-left .cutout-handle,#ckrop-positioner .cutout-right .cutout-handle{border-color: rgba(176, 176, 176, 0.38);border-style: dotted;border-width: 0px;}#ckrop-positioner .cutout-top .cutout-handle,#ckrop-positioner .cutout-bottom .cutout-handle{width: 100%;height: 5px;}#ckrop-positioner .cutout-top .cutout-handle{border-bottom-width: 1px;}#ckrop-positioner .cutout-bottom .cutout-handle{border-top-width: 1px;}#ckrop-positioner .cutout-left .cutout-handle,#ckrop-positioner .cutout-right .cutout-handle{width: 5px;height: 100%;}#ckrop-positioner .cutout-left .cutout-handle{border-right-width: 1px;}#ckrop-positioner .cutout-right .cutout-handle{border-left-width: 1px;}</style>'
	}
}