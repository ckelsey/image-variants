window.getMetadata = function(file){
	return new Promise(function (resolve, reject) {

		var result = {}
		var filePart = file
		var ext = filePart.name.split(".")
		ext = ext[ext.length - 1]

		if (filePart.slice) {
			filePart = filePart.slice(0, 131072)
		} else if (filePart.webkitSlice) {
			filePart = filePart.webkitSlice(0, 131072)
		} else if (filePart.mozSlice) {
			filePart = filePart.mozSlice(0, 131072)
		}

		var requestUpdate = function (res) {

			var isValid = (window.getThis(res, "Model", "").toLowerCase().indexOf("nvidia") > -1 ||
				window.getThis(res, "Model", "").toLowerCase().indexOf("ansel") > -1 ||
				window.getThis(res, "Model", "").toLowerCase().indexOf("nvcamera") > -1 ||
				window.getThis(res, "Software", "").toLowerCase().indexOf("nvidia") > -1 ||
				window.getThis(res, "Software", "").toLowerCase().indexOf("ansel") > -1 ||
				window.getThis(res, "Software", "").toLowerCase().indexOf("nvcamera") > -1 ||
				window.getThis(res, "Make", "").toLowerCase().indexOf("nvidia") > -1 ||
				window.getThis(res, "Make", "").toLowerCase().indexOf("ansel") > -1 ||
				window.getThis(res, "Make", "").toLowerCase().indexOf("nvcamera") > -1
			)

			if (!isValid) {
				return reject()
			}

			if (window.getThis(res, "Software", "").toLowerCase() === "geforce experience – ansel" ||
				window.getThis(res, "Software", "").toLowerCase().indexOf("ansel") > -1
			) {
				result.game = window.getThis(res, "ImageDescription", window.getThis(res, "Description"))
			} else {
				result.game = window.getThis(res, "Software")
			}

			var type = window.getThis(res, "MakerNote")

			if (type && type.split("360").length > 1) { result["360"] = 1 }
			if (type && (type.split("Stereo").length > 1 || window.getThis(res, "ImageDescription") === "Stereo")) { result["3d"] = 1 }
			if (type && type.split("SuperResolution").length > 1) { result["Super resolution"] = 1 }

			if (result["360"] && result["3d"]) {
				result["Top bottom"] = 1
			} else if (result["3d"]) {
				result["Left right"] = 1
			}

			if (
				result["360"] === undefined &&
				result["3d"] === undefined &&
				result["Super resolution"] === undefined
			) {
				if (type && encodeURIComponent(type.trim()).toLowerCase().indexOf("regular") > -1) {
					result.showMetaInputs = false
				} else {

					if (!type) {
						if (window.getThis(res, "Model") && window.getThis(res, "Source")) {
							result.showMetaInputs = false
						} else {
							result.showMetaInputs = true
						}
					} else {
						result.showMetaInputs = true
					}
				}
			}

			resolve(result)
		}

		if (ext === "jpg" || ext === "jpeg") {
			window.EXIF.getData(file, function () {
				requestUpdate(window.EXIF.getAllTags(this))
			})
		} else if (ext === "png") {
			var binary = ""

			var reader

			try {
				reader = new window.FileReader()
			} catch (error) {
				reader = window.FileReader
			}

			reader.onload = function() {
				var bytes = new Uint8Array(reader.result)
				var length = bytes.byteLength

				for (var i = 0; i < length; i++) {
					binary += String.fromCharCode(bytes[i])
				}

				var meta = window.png.splitChunk(binary)
				var results = {}

				meta.forEach(function (m) {
					if (m.type === "tEXt") {
						if (m.data.indexOf("Model") > -1) {
							results.Model = m.data.split("Model")[1]
						}

						if (m.data.indexOf("Software") > -1) {
							results.Software = m.data.split("Software")[1]
						}

						if (m.data.indexOf("Source") > -1) {
							results.Source = m.data.split("Source")[1]
						}

						if (m.data.indexOf("MakerNote") > -1) {
							results.MakerNote = m.data.split("MakerNote")[1]
						} else if (m.data.indexOf("Make") > -1) {
							results.Make = m.data.split("Make")[1]
						}

						if (m.data.indexOf("Description") > -1) {
							results.Description = m.data.split("Description")[1]
						}
					}
				})

				requestUpdate(results)
			}

			reader.readAsArrayBuffer(file)

		} else {
			reject()
		}
	})
}