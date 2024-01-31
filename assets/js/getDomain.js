function isDevHost() {
	return location.host.indexOf('dev.') >= 0 || location.host.indexOf('localhost') >= 0;
}

function isDebugMode() {
	return getQueryStringByName('debug') == '1';
}

function isLocalHost() {
	return location.hostname == "localhost";
}

function getQueryStringByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


function isLocalApi() {
	//
	// check if the page contains a meta element named 'localapi' with content of 'true'
	// e.g. <meta name='localapi' content='true' />
	//
	// if a page has meta=localapi then we should behave properly otherwise Google Ads is going 
	// to complain that loading external scripts dynamically is malicous behavior! so we need to determine
	// if we are using api endpoints locally, and to check, see the meta tag named 'localapi' if it is 'true'
	//
	var elems = document.getElementsByName('localapi');
	if (!elems.length)
		return false;

	var meta = elems[0];
	return meta.content == 'true';
}

function isLocalApiStrict() {
	//
	// check if the page contains a meta element named 'localapi-strict' with content of 'true'
	// e.g. <meta name='localapi-strict' content='true' />
	//
	// this indicates that regardless of whether the site is on dev or live, regardless, it should
	// not do GET/POST requests to an external orders API. instead it should GET/POST to local '/onlineorder/v2'
	//
	var elems = document.getElementsByName('localapi-strict');
	if (!elems.length)
		return false;

	var meta = elems[0];
	return meta.content == 'true';
}

function getAPI_Domain() {
	if (isDebugMode()) // served at localhost
		return location.protocol + '//localhost:' + location.port;
	if (isLocalHost()) // served at localhost, but not in debug mode
		return "http://dev.apiorders.com";
	if (isLocalApiStrict()) // api should be strictly on whatever hostname this is served on
		return location.protocol + '//' + location.hostname;

	// not doing local api strictly
	if (isDevHost())
		return 'http://ordersdev.apiorders.com';    // dev sites use the dev version of the orders api

	// this is a live site
	return isLocalApi()
		? location.protocol + '//' + location.host // api being local on a live site
		: 'https://pay.apiorders.com';             // api dont need to be local on live site, go to 'pay.apiorders.com'
}