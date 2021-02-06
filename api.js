const request = require('request');
const CONFIG = require('./config/options');

exports.getIpInfo = function(ip,ip_info_callback){

	if(CONFIG.API.KEY===""){
		console.log("Error:Api Key empty. Unable to fetch victim IP details!");
		console.log("Error:Please get an API key at: https://iknowwhatyoudownload.com/en/api/");
		console.log(`Error:After that save it to ${__dirname}/config/options.js in the KEY field of API`);
	}
	
	else{
		request(`https://api.antitor.com/history/peer?ip=${ip}&days=30&lang=en&key=${CONFIG.API.KEY}`, function (error, response, body) {
  			if (!error && response.statusCode == 200) ip_info_callback(JSON.parse(body));
			else console.log("Error:Some error occured. Error Code:- ",response.statusCode,`\nError:Unable to fetch details for: ${ip}. Please get a valid API key`);
		});
	}

};


