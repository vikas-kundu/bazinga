const ngrok = require('ngrok');

exports.startTunnel= function (options,tunnel_url){
	(async function(){
		console.log("Info:Please be patient, requesting for new tunnel can take a few minutes...");
		const url = await ngrok.connect({addr:options.port});
		if(url){
			console.log("Info:Ngrok Tunnel Obtained!");
			console.log("Warning:Please note all the links will be defunct once Ngrok is stopped."); 
			tunnel_url(url);
		}
	})();
}


