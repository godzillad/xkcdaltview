'use strict';
var express = require('express');
var http = require('http');
var htmlparser = require("htmlparser2");

var ip_addr = '0.0.0.0';
var port = Number(process.env.PORT || 8090);

var app = express('xkcd');

app.get('/xkcd', onQuery);

var server = app.listen(port ,ip_addr, function(){
	console.log('Listening at :' + server.address().port);
});

function onQuery(req, res , next){

	var isRandom = req.param('random');
	var _id = req.param('id');
	var _path = "";
	if(isRandom == "1"){
		_path = Math.floor(Math.random() * 1409 );
		_path = "" + _path + "/";
	}else if(_id !=null && _id != ""){
		_path = "" + _id + "/";
	}
	var options = {
		host: 'xkcd.com',
		port: 80,
		path: _path,
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
		var foundNext = false;
		var foundPrev = false;
		var next_id = "";
		var previous_id = "";
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
					if(!foundPrev && tagname === "a" && attribs.rel === 'prev'){
						var url = attribs.href;
						if (url != '#'){
							var parts = url.split('/')
							previous_id = parts[parts.length-2];
						}else{
							previous_id = "0";
						}
						foundPrev = true;
					}
					if(!foundNext && tagname === "a" && attribs.rel === 'next'){
						var url = attribs.href;
						if (url != '#'){
							var parts = url.split('/')
							next_id = parts[parts.length-2];
						}else{
							next_id ="0";
						}
						foundNext = true;
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
						foundTitle=false;
					}
				},
				onclosetag: function(tagname){
					if (gotData){
						var resTxt = "<html><body><center style='font-size:30px;font-family:Arial'>" ;
						resTxt += "<a href='/xkcd?id=" + previous_id +"'>&lt;&lt;</a>" ;
						resTxt += "&nbsp;&nbsp;<a href='/xkcd?random=1' style='font-size:20px;font-family:Arial'>Random</a>&nbsp;&nbsp;" ;
						resTxt += "<a href='/xkcd?id=" + next_id +"'>&gt;&gt;</a>" ;
						resTxt += "<br>" + title ;
						resTxt += "</center><br>";
						resTxt += "<img src='" + source + "'><br>";
						resTxt += "<div style='font-size:5px'>" + alt + "</font>";
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
