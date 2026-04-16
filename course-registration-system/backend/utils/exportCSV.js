function escapeValue(value) {
	if (value === null || value === undefined) return "";
	const str = String(value);
	if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

function toCSV(rows = [], fields = []) {
	if (!Array.isArray(rows)) return "";
	if (!fields || fields.length === 0) {
		// derive headers from first object
		const first = rows[0] || {};
		fields = Object.keys(first);
	}

	const header = fields.join(',');
	const lines = rows.map(row => fields.map(f => escapeValue(row[f])).join(','));
	return [header].concat(lines).join('\n');
}

function sendCSV(res, rows = [], fields = [], filename = 'export.csv') {
	const csv = toCSV(rows, fields);
	res.setHeader('Content-Type', 'text/csv; charset=utf-8');
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
	res.send(csv);
}

module.exports = { toCSV, sendCSV };
