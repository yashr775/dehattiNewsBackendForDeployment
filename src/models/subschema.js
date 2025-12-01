const mongoose = require("mongoose");

const subSchema = new mongoose.Schema({
    subscription: Object,
});

module.exports = mongoose.model("Sub", subSchema);
