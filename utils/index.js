"use strict"

const isEmpty = (value, trim) => {
  return (
    value === null ||
    value === undefined ||
    value.length === 0 ||
    (trim && value.trim() === "")
  )
}

module.exports = {
  isEmpty
}
