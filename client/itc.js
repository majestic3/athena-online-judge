
var itc = exports = misc.emitter();
itc.$emit = itc.emit;

var prefix = "athena/itc/";
var blocksize = 100*1024; // 100KB
var incomplete = {};
var accesstime = {};
var timeout = 10*1000; // 10s
var log = false;

itc.emit = function(name){
	if(typeof(name)!=="string") return false;
	var key = prefix+unique, args = Array.prototype.slice.apply(arguments);
	if(log) console.log("[itc] send",args);
	try { args = JSON.stringify(args); } catch(e){ return false; }
	for(var offset=0; offset<args.length; offset+=blocksize)
		window.localStorage[key] = args.substr(offset,blocksize);
	delete window.localStorage[key];
};

itc.broadcast = function(name){
	if(typeof(name)!=="string") return false;
	var args = Array.prototype.slice.apply(arguments);
	itc.$emit.apply(this,args);
	itc.emit.apply(this,args);
};

window.addEventListener('storage',function(event){
	// Discard parts that have timed out.
	var now = misc.timestamp();
	Object.keys(accesstime).forEach(function(key){
		if(now-accesstime[key]<=timeout) return;
		delete incomplete[key];
		delete accesstime[key];
	});
	// Ignore storage events not generated by this module.
	if(event.key.substr(0,prefix.length)!=prefix) return;
	if(event.newValue!=null){
		// If this is not a deletion event, add data to incomplete dict
		if(!(event.key in incomplete)) incomplete[event.key] = "";
		incomplete[event.key] += event.newValue;
		accesstime[event.key] = now;
	} else {
		// If this is deletion event, process data in incomplete dict
		var args = incomplete[event.key];
		delete incomplete[event.key];
		delete accesstime[event.key];
		try { args = JSON.parse(args); } catch (e) { return; }
		if(log) console.log("[itc] recv",args);
		itc.$emit.apply(this,args);
	}
});