exports.tempDir = "temp-images"

exports.get = function (el, path, emptyVal) {
	path = [el].concat(path.split("."))

	var result = path.reduce(function (accumulator, currentValue) {
		if (currentValue) {
			return accumulator[currentValue]
		} else {
			return accumulator
		}

	})

	if (!result){
		return emptyVal
	}

	return result
}

exports.safeText = function(input) {
	input = input || ""
	var output = ""
	for (var i = 0; i < input.length; i++) {
		if (input.charCodeAt(i) <= 127) {
			output += input.charAt(i)
		}
	}

	output = output.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#x27;/g, "'")
		.replace(/&#039;/g, "'")
	return decodeURIComponent(encodeURIComponent(output).split("%00").join(""))
}