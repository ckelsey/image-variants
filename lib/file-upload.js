const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const sanitize = require("./sanitize")
const fileType = require("file-type")
const readChunk = require("read-chunk")


function moveFile(sourcePath, targetFolder, name) {
	return new Promise((resolve, reject) => {
		mkdirp(targetFolder, (err) => {
			if (err) {
				return reject(err)
			}

			var sourceStream = fs.createReadStream(sourcePath)
			var destStream = fs.createWriteStream(path.join(targetFolder, name), { flags: "a" })

			sourceStream
				.on("error", function (error) {
					destStream.end()
					reject(error)
				})
				.on("end", function () {
					destStream.end()
					resolve()
				})
				.pipe(destStream, { end: false })
		})
	})
}

function getUploadProperties(data, params, file) {
	if (!params) {
		params = {}
	}

	if (!file) {
		return false
	}

	if (!file.size || file.size < 10) {
		return false
	}

	var result = {}
	result.index = parseInt(sanitize.number(data.partindex[0]))
	result.totalSize = parseInt(sanitize.number(data.totalfilesize[0]))
	result.totalParts = parseInt(sanitize.number(data.totalparts[0]))
	result.done = sanitize.number(params.done)
	result.id = sanitize.string(data.id[0])

	if (
		!result.totalSize ||
		!result.totalParts ||
		!result.id
	) {
		return false
	}

	return result
}



module.exports = function (headers, files, body, query, uploadPath) {
	return new Promise((resolve, reject) => {

		if (!files) {
			return reject({ status: 400, message: "Invalid file" })
		}

		const file = files.image[0]

		if (!file) {
			return reject({ status: 400, message: "Invalid file" })
		}

		const properties = getUploadProperties(body, query, file)

		if (!properties) {
			return reject({ status: 400, message: "Invalid data" })
		}

		properties.type = fileType(readChunk.sync(file.path, 0, 4100));

		let filename = (new Buffer(properties.id + properties.totalSize).toString("base64")).split("=").join("")

		if (!properties.type) {
			if (fs.existsSync(path.join(uploadPath, filename + ".jpg"))) {
				filename = filename + ".jpg"
			} else if (fs.existsSync(path.join(uploadPath, filename + ".png"))) {
				filename = filename + ".png"
			} else {
				return reject({ status: 400, message: "Invalid chunk" })
			}
		}else {
			filename = filename + "." + properties.type.ext
		}

		moveFile(
			file.path,
			uploadPath,
			filename
		)
			.then(
			() => {
				resolve({
					status: 200,
					properties: properties,
					id: properties.id,
					result: {
						url: path.join(uploadPath, filename)
					}
				})
			},
			(err) => {
				reject({
					status: 500,
					id: properties.id,
					message: err
				})
			})

	})
}