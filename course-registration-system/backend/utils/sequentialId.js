const padSequence = (value, length = 3) => String(value).padStart(length, "0");

async function generateSequentialId(model, prefix, query = {}, digits = 3) {
  const count = await model.countDocuments(query);
  return `${prefix}${padSequence(count + 1, digits)}`;
}

module.exports = { generateSequentialId };