const getBarcode = (req, res) => {
	res.render("index");
};

const getError403 = (req,res) => {
	res.render("error403")
}
const getError404 = (req,res) => {
	res.render("error404")
}

module.exports = {
	getBarcode,
	getError403,
	getError404
};
