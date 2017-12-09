const fs = require("fs")

module.exports = function (res) {

	var fileStream = fs.createReadStream("./client/upload/upload.html")
	fileStream.on("open", function () {
		res.setHeader("Content-Type", "text/html")
		fileStream.pipe(res)
	})

	fileStream.on("error", function () {
		res.setHeader("Content-Type", "text/plain")
		res.statusCode = 404
		res.end("No images here")
	})
}