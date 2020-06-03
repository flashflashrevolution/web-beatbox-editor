console.log("So you want to to view a FFR SWF File in pure JS...\nFine.\n\n\nWait...\nAn Owl built an entire chart editor as well?.\n\n\nHow does an Owl even code?");
console.log("[FFR BeatBox SWF Editor v1.2.0]");

var swf_array_buffer = null;
var swf_data_view = null;
var swf_tags = null;
var swf_write_buffer = null;
var swf_file_name = "";

$(function(){
    $(".urlFile").on('click', function(e) {
		loadExternalSWFURL();
	});
    $(".swfFile").change(swfFile_click);
})

function swfFile_click(e) {
	// Editor Code
	resetEditor();

    loadFileList(this.files);
}

function loadFileList(inputFiles) {
	if(inputFiles == undefined || inputFiles.length == 0)
		return;
	
    var inputFile = inputFiles[0];
	
	// Verify Type
	if(inputFile["type"] != "application/x-shockwave-flash") {
		alert("Unexpected file type, got \"" + inputFile["type"] + "\" not \"application/x-shockwave-flash\"");
		return;
	}
	
	swf_file_name = inputFile["name"];
	
	// Read input SWF File
    var reader = new FileReader();
    reader.onload = function(event) {
        swfFile_Ready(event.target.result);
    };
    reader.onerror = function(event) {
        alert("I AM ERROR: " + event.target.error.code);
    };
    reader.readAsArrayBuffer(inputFile);
}

function swfFile_Ready(array_buffer) {
	edit_history.clear();
	edit_history.add("load", {}, "Loaded SWF File: " + swf_file_name, true);
	
	swf_array_buffer = array_buffer;
	swf_tags = uncompress(swf_array_buffer);
	swf_write_buffer = swf_tags.buffer;
	
	console.log(swf_file_name, swf_tags);
	
	// Chart Data
	var chart_tag = getBeatBox();
	var chart_data = chart_tag["variables"]["_root"]["beatBox"];
	
	console.log(chart_tag);
	
	if(chartPreview)
		chartPreview.setChartBeatbox(chart_data);
	
	populateEditor(chart_tag);
	
	// Music Data
	var music_binary = getAudio();
	var blob = new Blob([music_binary], {type : 'audio/mpeg'});
	var blobUrl = URL.createObjectURL(blob);
	
	$("#source").attr("src", blobUrl);
	$("#audio")[0].pause();
	$("#audio")[0].load();//suspends and restores all audio element
	//$("#audio")[0].oncanplaythrough = $("#audio")[0].play();
	
	if(chartPreview)
		chartPreview.setChartAudio(blob);
	
}

/**
 * Find Beatbox in the swf_tags.
 */
function getBeatBox() {
	var len = swf_tags.tags.length;
	var i = 0;
	var elm = null;
	
	for(i = 0; i < len; i++) {
		elm = swf_tags.tags[i];
		if(elm.header.code == SWFTags.DOACTION)
			return elm;
	}
	
	return null;
}

/**
 * Find Beatbox in the swf_tags.
 */
function getAudio() {
	var len = swf_tags.tags.length;
	var i = 0;
	var elm = null;
	
	var audioSize = 0
	
	// Loop All Audio Tags, get Total Byte Size
	for(i = 0; i < len; i++) {
		elm = swf_tags.tags[i];
		if(elm.header.code == SWFTags.DEFINESOUND || elm.header.code == SWFTags.STREAMBLOCK)
			audioSize += elm.audio_bytes;
	}
	
	console.log("Audio Size:", audioSize);
	
	// Loop All Audio Tags, get Total Byte Size
	var writePosition = 0;
	var binary = new Uint8Array(audioSize);
	for(i = 0; i < len; i++) {
		elm = swf_tags.tags[i];
		if(elm.header.code == SWFTags.DEFINESOUND || elm.header.code == SWFTags.STREAMBLOCK) {
			binary.set(new Uint8Array(elm.data), writePosition);
			writePosition += elm.audio_bytes;
		}
	}
	return binary;
}