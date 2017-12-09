window.cropper = {
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

	init: function (el) {
		var self = this
		this.onUpdateCallbacks = []
		this.element = el
		this.element.style.display = "none"
		this.data.elements = {
			north: this.element.querySelector("#north-handle"),
			south: this.element.querySelector("#south-handle"),
			east: this.element.querySelector("#east-handle"),
			west: this.element.querySelector("#west-handle"),
			northeast: this.element.querySelector("#north-east-handle"),
			northwest: this.element.querySelector("#north-west-handle"),
			southeast: this.element.querySelector("#south-east-handle"),
			southwest: this.element.querySelector("#south-west-handle")
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
					self.element.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
				} else if (mode === 'south-handle') {
					height = 100 - height
					self.data.positions.y2 = height
					self.element.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
				} else if (mode === 'east-handle') {
					width = 100 - width
					self.data.positions.x2 = width
					self.element.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'west-handle') {
					self.data.positions.x1 = width
					self.element.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				} else if (mode === 'north-east-handle') {
					width = 100 - width
					self.data.positions.y1 = height
					self.data.positions.x2 = width
					self.element.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					self.element.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'north-west-handle') {
					self.data.positions.y1 = height
					self.data.positions.x1 = width
					self.element.querySelector("#north-space").style.height = self.data.positions.y1 + "%"
					self.element.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				} else if (mode === 'south-east-handle') {
					width = 100 - width
					height = 100 - height
					self.data.positions.y2 = height
					self.data.positions.x2 = width
					self.element.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					self.element.querySelector("#east-space").style.width = self.data.positions.x2 + "%"
				} else if (mode === 'south-west-handle') {
					height = 100 - height
					self.data.positions.y2 = height
					self.data.positions.x1 = width
					self.element.querySelector("#south-space").style.height = self.data.positions.y2 + "%"
					self.element.querySelector("#west-space").style.width = self.data.positions.x1 + "%"
				}

				self.onUpdateCallbacks.forEach(function(cb) {
					cb(self.data.positions)
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
	},
	show: function () {
		this.element.style.display = "block"
	}
}