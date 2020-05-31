function loadExternalURL() {
	var loadUrl = prompt("Enter URL", "");

	if (loadUrl == null || loadUrl == "" || loadUrl.length < 7) {
		alert('Invalid URL');
	}
	else {
		loadExternalURLRequest(loadUrl);
	} 
}

function loadExternalURLRequest(inputUrl) {
	console.log("Attempting Load of URL:", inputUrl);
	$("#progressBar").show();
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", inputUrl, true);
	oReq.responseType = "arraybuffer";
	
	oReq.onprogress = function (oEvent) {
		var percentage = Math.round((oEvent.loaded / oEvent.total) * 100);
		$("#progressBar .fill").css('width', percentage + "%");
	};
	
	oReq.onerror = function (oEvent) {
		alert('Download of "' + inputUrl + '" failed.');
		$("#progressBar").hide();
	};
	
	oReq.onload = function (oEvent) {
		$("#progressBar").hide();
		$("#progressBar .fill").css('width', "0%");
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		console.log(oReq);
		
		// Check Header for File type.
		if(oReq.getResponseHeader("content-type") != "application/x-shockwave-flash") {
			alert("Unexpected file type, got \"" + oReq.getResponseHeader("content-type") + "\" not \"application/x-shockwave-flash\"");
			return;
		}
		
		// Check buffer and Buffer Length
		if (arrayBuffer && arrayBuffer.byteLength > 0) {
			// Editor Code
			resetEditor();
			
			// Set SWF Name
			swf_file_name = "external_url.swf";
			
			// Start Editor
			swfFile_Ready(arrayBuffer);
		} else {
			alert("Loaded file, but was invalid.");
		}
	};

	oReq.send(null);
}