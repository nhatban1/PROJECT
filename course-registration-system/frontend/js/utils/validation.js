function isEmail(val) {
	if (!val) return false;
	return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
}

function isNotEmpty(val) {
	return val !== undefined && val !== null && String(val).trim() !== '';
}

if (typeof window !== 'undefined') {
	window.isEmail = isEmail;
	window.isNotEmpty = isNotEmpty;
}

