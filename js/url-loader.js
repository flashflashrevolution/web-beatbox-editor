useCORSPassthrough = true;
CORSPassthroughURL = "https://cors-anywhere.herokuapp.com/";

function buildXHRURL(url) {
	if(useCORSPassthrough)
		return CORSPassthroughURL + url;
	
	return url;
}

function loadExternalSWFURL() {
	var loadUrl = prompt("Enter URL", "");

	if (loadUrl == null || loadUrl == "" || loadUrl.length < 7) {
		alert('Invalid URL');
	}
	else {
		loadExternalSWLURLRequest(loadUrl);
	} 
}

function loadExternalSWLURLRequest(inputUrl) {
	console.log("Attempting Load of URL:", inputUrl);
	$("#progressBarOverlay").show();
	$("#progressBarOverlay .fill").css('width', "0%");
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", buildXHRURL(inputUrl), true);
	oReq.responseType = "arraybuffer";
	
	oReq.onprogress = function (oEvent) {
		var percentage = Math.round((oEvent.loaded / oEvent.total) * 100);
		$("#progressBarOverlay .fill").css('width', percentage + "%");
	};
	
	oReq.onerror = function (oEvent) {
		alert('Download of "' + inputUrl + '" failed.');
		$("#progressBarOverlay").hide();
		$("#progressBarOverlay .fill").css('width', "0%");
	};
	
	oReq.onload = function (oEvent) {
		$("#progressBarOverlay").hide();
		$("#progressBarOverlay .fill").css('width', "0%");
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		
		// Check Header for File type.
		var typeCheck = true;
		if(oReq.getResponseHeader("content-type") != "application/x-shockwave-flash") {
			typeCheck = confirm("Unexpected file type, got \"" + oReq.getResponseHeader("content-type") + "\" not \"application/x-shockwave-flash\"\nLoad anyway?");
		}
		if(!typeCheck)
			return;
		
		// Check buffer and Buffer Length
		if (arrayBuffer && arrayBuffer.byteLength > 0) {
			// Editor Code
			resetEditor();
			
			// Set SWF Name
			swf_file_name = inputUrl.substr(inputUrl.lastIndexOf("/") + 1);
			
			// Start Editor
			swfFile_Ready(arrayBuffer);
		} else {
			alert("Loaded file, but was invalid.");
		}
	};

	oReq.send(null);
}