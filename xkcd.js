'use strict';
var express = require('express');
var http = require('http');
var htmlparser = require("htmlparser2");

var ip_addr = '0.0.0.0';
var port = Number(process.env.PORT || 8090);

var app = express('xkcd');

app.get('/data', onQuery);

var server = app.listen(port ,ip_addr, function(){
	console.log('Listening at :' + server.address().port);
});

function onQuery(req, res , next){

	var options = {
		host: 'xkcd.com',
		port: 80,
		path: '',
		method: 'GET'
	};
	http.get(options, function(resp) {
	
		var response = "";

		resp.on('data', function (chunk) {
			response += chunk;
		});
		
		var foundTitle = false;
		var foundImage = false;
		var gotData = false;
		var source ="";
		var alt ="";
		var title ="";
	

		resp.on('end', function () {

			
			var parser = new htmlparser.Parser({
				onopentag: function(tagname, attribs){
					if(tagname === "div" && attribs.id === 'ctitle'){
						foundTitle = true;
					}
					if(tagname === "div" && attribs.id === 'comic'){
						foundImage = true;
					}
					if(foundImage && tagname === "img"){
						source = attribs.src;
						alt = attribs.title;
						gotData = true;
						foundImage = false;
					}
				},
				ontext: function(text){
					if(foundTitle){
						text = text.replace("&nbsp;","");
						text = text.replace(/[\r\n\t]/g,"");
						text = text.trim();
						title = text;
					}
				},
				onclosetag: function(tagname){
					if (gotData){
						var resTxt = "<html><body>" + title ;
						resTxt += "<img src='" + source + "'>";
						resTxt += alt;
						resTxt += "</body><html>";
						res.set('Content-Type', 'text/html');
						
						res.send(200, resTxt);
						gotData = false;
						return;
					}
				}
			});
			parser.write(response);
			parser.end();
		});
	}).on('error', function(e) {
		console.log('Error in request: ' + e.message);
	});

}


