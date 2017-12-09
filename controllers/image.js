const uploader = require("../lib/file-upload")
const imageMeta = require("../lib/image-metadata")
const imageVariants = require("../lib/image-variants")
const Utils = require("../lib/utils")

module.exports = function (res, headers, body, query, params, files) {
	function respond(response) {
		res.statusCode = response.status
		res.write(JSON.stringify({
			message: response.message,
			success: response.status === 200,
			result: response.result,
			id: response.properties.id
		}))
		return res.end()
	}

	uploader(headers, files, body, query, Utils.tempDir)
		.then((uploadResult) => {

			if (uploadResult.properties.done) {

				imageMeta(uploadResult.result.url)
					.then((meta) => {

						imageVariants(uploadResult.result.url, meta, body)
							.then((variantsData) => {
								uploadResult.result = {
									url: variantsData.urls.large,
									urls: variantsData.urls,
									meta: variantsData.meta
								}

								respond(uploadResult)

							}, (err) => {
								uploadResult.message = err
								uploadResult.status = 500
								respond(uploadResult)
							})
					}, (err) => {

						uploadResult.message = err
						uploadResult.status = 500
						respond(uploadResult)
					})

			} else {
				respond(uploadResult)
			}
		}, (uploadResult) => {

			respond(uploadResult)
		})
}