const fs = require("fs")
const path = require("path")

module.exports = function (res, headers, body, query, params, files) {

	var fileStream = fs.createReadStream("./client" + params.url)
	fileStream.on("open", function () {
		res.setHeader("Content-Type", "text/javascript")
		fileStream.pipe(res)
	})

	fileStream.on("error", function () {
		res.setHeader("Content-Type", "text/plain")
		res.statusCode = 404
		res.end("No images here")
	})
}