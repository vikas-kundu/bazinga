const fs= require('fs');
const sess = require('./session');


exports.generateMultipleTokens = function(argv,result){
	var arr='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var token_arr=[];
	for(var i=0;i<argv.generator;i++ ){
		var output='';	
		for(var j=0;j<argv.tokenLen;j++){	
			output+=arr.charAt( Math.floor(Math.random() * 62) );
		}
		token_arr[i]=output;
	}	
	result(token_arr);
};

exports.storeMultipleTokens = function(token_arr,argv,stored){

	for (const token of token_arr){
		sess[`${token}`]={
			"mode":`${argv.mode}`,
			"redirect_url":`${argv.redirectUrl}`,
			"local_url":`${argv.localUrl}`
		};
	}

	fs.writeFile("session.json",JSON.stringify(sess,null,2), function (err) {
			if (err) throw err; else stored(1);
	});
};

exports.deleteAllTokens = function(delete_tokens_callback){
	fs.writeFile('session.json','{}', function (err) {
			if (err) throw err;
			else delete_tokens_callback(1);
	});
};

exports.showAllTokens = function(show_all_callback){
	show_all_callback(sess);		
};

