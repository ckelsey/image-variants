const ExifImage = require("exif").ExifImage;
const png = require("png-metadata");
const sizeOf = require('image-size');
const fileType = require("file-type");
const readChunk = require("read-chunk");
const Utils = require("./utils")

function parseMeta(res, imgUrl) {

	var result = {}
	var model = Utils.get(res, "Model", "").toLowerCase()
	var Software = Utils.get(res, "Software", "")
	var software = Software.toLowerCase()
	var make = Utils.get(res, "Make", "").toLowerCase()
	var Description = Utils.get(res, "ImageDescription", Utils.get(res, "Description"))
	var MakerNote = Utils.get(res, "MakerNote")
	var isValid = (model.indexOf("nvidia") > -1 ||
		model.indexOf("ansel") > -1 ||
		model.indexOf("nvcamera") > -1 ||
		software.indexOf("nvidia") > -1 ||
		software.indexOf("ansel") > -1 ||
		software.indexOf("nvcamera") > -1 ||
		make.indexOf("nvidia") > -1 ||
		make.indexOf("ansel") > -1 ||
		make.indexOf("nvcamera") > -1
	)

	if (!isValid) {
		return false
	}

	if (
		software === "geforce experience – ansel" ||
		software.indexOf("ansel") > -1
	) {
		result.game = Description
	} else {
		result.game = Software
	}

	if (MakerNote) {
		if (MakerNote.split("360").length > 1) {
			result["360"] = 1
		}

		if (
			MakerNote.split("Stereo").length > 1 ||
			Description === "Stereo"
		) {
			result["3D"] = 1
		}

		if (MakerNote.split("SuperResolution").length > 1) {
			result["Super resolution"] = 1
		}
	}

	if (result["360"] && result["3D"]) {
		result["Top bottom"] = 1
	} else if (result["3D"]) {
		result["Left right"] = 1
	}

	result.dimensions = sizeOf(imgUrl);

	return result
}

module.exports = function (imgUrl) {
	return new Promise((resolve, reject) => {
		const type = fileType(readChunk.sync(imgUrl, 0, 4100));
		var meta = null

		if (type.mime === "image/jpeg") {

			try {
				new ExifImage({ image: imgUrl }, function (error, exifData) {
					if (error) { return reject(error.message) }

					else {
						meta = parseMeta(exifData.image, imgUrl)

						if (!meta) {
							return reject()
						}

						return resolve(meta)
					}
				});
			} catch (error) {
				return reject(error.message)
			}
		} else {

			var s = png.readFileSync(imgUrl);
			var list = png.splitChunk(s);
			var results = {}

			list.forEach((m) => {
				if (m.type === "tEXt") {
					if (m.data.indexOf("Model") > -1) {
						results.Model = m.data.split("Model")[1].split("\u0000").join("")
					}

					if (m.data.indexOf("Software") > -1) {
						results.Software = m.data.split("Software")[1].split("\u0000").join("")
					}

					if (m.data.indexOf("Source") > -1) {
						results.Source = m.data.split("Source")[1].split("\u0000").join("")
					}

					if (m.data.indexOf("MakerNote") > -1) {
						results.MakerNote = m.data.split("MakerNote")[1].split("\u0000").join("")
					} else if (m.data.indexOf("Make") > -1) {
						results.Make = m.data.split("Make")[1].split("\u0000").join("")
					}

					if (m.data.indexOf("Description") > -1) {
						results.Description = m.data.split("Description")[1].split("\u0000").join("")
					}
				}
			})

			meta = parseMeta(results, imgUrl)

			if (!meta) {
				return reject()
			}

			return resolve(meta)
		}
	})
}