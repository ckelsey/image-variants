window.imageReader = function (file) {
	return new Promise(function (resolve) {
		var domURL = window.URL || window.webkitURL

		var result = {
			ext: null
		}

		var reader

		try {
			reader = new window.FileReader()
		} catch (error) {
			reader = window.FileReader
		}

		var ext = file.name.split(".")
		result.ext = ext[ext.length - 1]

		reader.onload = (e) => {
			var blob = new window.Blob([e.target.result], { type: result.ext })
			result.url = domURL.createObjectURL(blob)

			let img = new window.Image()
			img.onload = function () {
				result.img = img
				resolve(result)
			}
			img.src = result.url
		}

		reader.readAsArrayBuffer(file)
	})
}