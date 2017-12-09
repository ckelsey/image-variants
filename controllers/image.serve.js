const fs = require("fs")
const path = require("path")
const Utils = require("../lib/utils")

module.exports = function (res, headers, body, query, params, files) {

	var fileStream = fs.createReadStream(path.join(Utils.tempDir, params.url))
	fileStream.on("open", function () {
		res.setHeader("Content-Type", "image/jpeg")
		fileStream.pipe(res)
	})

	fileStream.on("error", function () {
		res.setHeader("Content-Type", "text/plain")
		res.statusCode = 404
		res.end("No images here")
	})
}