var express = require("express"),
    app = express(),
    bodyParser = require('body-parser'),
    hostname = process.env.HOSTNAME || 'localhost',
    port = parseInt(process.env.PORT, 10) || 4567;

app.get("/", function (req, res) {
  res.redirect("/index.html");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/client'));

console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port, hostname);
