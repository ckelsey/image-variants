window.upload = function (file, options, progressCB) {
	return new Promise(function (resolve, reject) {

		var BYTES_PER_CHUNK = 123857
		var SIZE = file.size
		var Start = 0
		var End = BYTES_PER_CHUNK
		var ID = new Date().getTime()
		var lastMessage = {}

		function uploadChunk() {
			if (Start < SIZE) {
				var Chunk = file.slice(Start, End)
				var formData = new window.FormData()
				formData.append("image", Chunk)
				formData.append("partindex", Math.ceil(Start / BYTES_PER_CHUNK))
				formData.append("totalparts", Math.ceil(SIZE / BYTES_PER_CHUNK))
				formData.append("totalfilesize", SIZE)
				formData.append("id", ID)

				for (var p in options) {
					if (options[p]) {
						formData.append(p, options[p])
					}
				}

				var xhr = new window.XMLHttpRequest()
				xhr.onload = function () {
					lastMessage = JSON.parse(this.responseText)

					if (this.status !== 200) {
						return reject(lastMessage)
					}

					Start = End
					End = Start + BYTES_PER_CHUNK

					progressCB(Math.floor((Start / SIZE) * 100))

					uploadChunk()
				}

				xhr.onerror = function () {
					lastMessage = JSON.parse(this.responseText).data

					reject(lastMessage)
				}

				xhr.open('POST', '/v1/image' + (End >= SIZE ? "?done=1" : ""), true)
				xhr.send(formData)
			} else {
				progressCB(100)
				resolve(lastMessage)
			}
		}

		uploadChunk()
	})
}