const fs = require("fs")
const Utils = require("./utils")
const easyimg = require('easyimage')
const image360 = require("./image-360")
const imageFabric = require("./image-fabric")

/*
options = {
	x1: 0,
	x2: 100,
	y1: 0,
	y2: 100,
	sourceWidth: 100,
	sourceHeight: 100,
	pan: 0,
	tilt: 0,
	zoom: 1
}
*/

module.exports = function (imgUrl, meta, options) {
	return new Promise((resolve) => {
		const filenameParts = imgUrl.split(".")
		var large = filenameParts[0] + "_large.jpg"
		var small = filenameParts[0] + "_small.jpg"
		var thumb = filenameParts[0] + "_thumb.jpg"

		function crop(dest, w, h, cw, ch, x, y, quality, gravity) {
			return easyimg.rescrop({
				src: imgUrl,
				dst: dest,
				width: w, height: h,
				cropwidth: cw, cropheight: ch,
				x: x, y: y,
				gravity,
				quality,
				ignoreAspectRatio: true
			})
		}

		function resize(dest, w, h, quality) {
			return easyimg.resize({
				src: imgUrl,
				dst: dest,
				quality,
				width: w, height: h
			})
		}

		function respond() {
			large = "v1/image" + large.split(Utils.tempDir)[1]
			small = "v1/image" + small.split(Utils.tempDir)[1]
			thumb = "v1/image" + thumb.split(Utils.tempDir)[1]

			resolve({
				meta,
				urls: {large, small, thumb}
			})
		}

		meta.dimensions.height = parseInt(meta.dimensions.height)
		meta.dimensions.width = parseInt(meta.dimensions.width)

		resize(small, 600, parseInt(meta.dimensions.height * (600 / meta.dimensions.width)), 33).then(() => {
			if (meta["360"]) {

				resize(large, 4096, parseInt(meta.dimensions.height * (4096 / meta.dimensions.width)), 80).then(() => {

					options.sourceWidth = meta.dimensions.width
					options.sourceHeight = meta.dimensions.height

					image360(imgUrl, thumb, options).then(() => {

						meta.dimensions.width = 600
						meta.dimensions.height = 300

						respond()
					})
				})

			} else {

				resize(large, meta.dimensions.width, meta.dimensions.height, 80).then(() => {

					imageFabric(imgUrl, thumb, options, meta).then(() => {
						respond()
					})

					// if (meta["3D"]) {

					// 	imageFabric(imgUrl, thumb, options, meta).then(() => {
					// 		respond()
					// 	})
					// 	// crop(thumb,
					// 	// 	1200, parseInt(meta.dimensions.height * (1200 / meta.dimensions.width)),
					// 	// 	600, parseInt(meta.dimensions.height * (1200 / meta.dimensions.width)), 0, 0, 80, "NorthWest"
					// 	// ).then(() => {

					// 	// 	meta.dimensions.height = parseInt(meta.dimensions.height * (1200 / meta.dimensions.width))
					// 	// 	meta.dimensions.width = 600

					// 	// 	respond()
					// 	// })


					// } else {
					// 	imageFabric(imgUrl, thumb, options, meta).then(() => {
					// 		respond()
					// 	})
					// 	// resize(thumb, 600, parseInt(meta.dimensions.height * (600 / meta.dimensions.width)), 80).then(() => {

					// 	// 	meta.dimensions.height = parseInt(meta.dimensions.height * (600 / meta.dimensions.width))
					// 	// 	meta.dimensions.width = 600

					// 	// 	respond()
					// 	// })

					// }
				})

			}
		})
	})
}