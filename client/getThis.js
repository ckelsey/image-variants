window.getThis = function(el, path, emptyVal) {
	path = [el].concat(path.split("."))

	var result = path.reduce(function (accumulator, currentValue) {
		if (currentValue) {
			return accumulator[currentValue]
		} else {
			return accumulator
		}

	})

	if (!result) {
		return emptyVal
	}

	return result
}