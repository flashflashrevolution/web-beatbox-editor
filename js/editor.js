var lane_classes = ["l0", "l1", "l2", "l3"];
var color_classes = ["blue", "red", "yellow",  "green", "orange", "pink", "purple", "cyan", "white"];

var generated_tag_end = null;

var editor_tag = null;
var editor_beatbox = null;
var frame_height = 16;

var sticky_offset = 131;

// OnLoad Function.
$(function() {
	sticky_offset = $("#audioPreview").offset().top - 15;
	window.onscroll = function() {editorScrollUpdate()};

	// Editor Stuff
	$('#editor_options .updatePreview').click(editorUpdatePreview);
	$('#editor_options .shiftFrames').click(editorShiftFrames);
	$('#editor_options .writeFile').click(editorWriteFile);
	$('#editor_options .randomColors').click(editorRandomColors);
	
	// Jump Stuff
	$('#editor_jump .jumpToNote').click(jumpNoteIndex);
	$('#editor_jump .jumpToTime').click(jumpTimeIndex);
});

function resetEditor() {
	editor_tag = null;
	editor_beatbox = null;
	editor_index = null;
	$("#chart_tag_empty").show();
	hideNoteModel();
}

function populateEditor(tag) {
	editor_tag = tag
	editor_beatbox = noteCloneAll(editor_tag["variables"]["_root"]["beatBox"]);
	
	$("#chart_tag_empty").hide();
	
	hideNoteModel();
	drawNoteField();
}

function drawNoteField() {	
	var target = $("#chart_box");
	target.empty();
	
	target.css('height', ((editor_beatbox[editor_beatbox.length - 1][0] + 30) * frame_height) + 'px');
	
	for(var i = 0; i < editor_beatbox.length; i++) {
		note = editor_beatbox[i]
		note_c = noteGetColumn(note[1]);
		note_y = note[0] * frame_height;
		note_color = note[2] || 'blue';
		
		target.append('<div data-index="' + i + '" class="song_note ' + note_color + ' l' + note_c + ' i' + i + '" style="top:' + note_y +'px;"> </div>');
	}
}

function updateNoteDisplay(index) {
	var elm = $(".i" + index);
	
	var note_c = noteGetColumn(editor_beatbox[index][1]);
	var note_y = editor_beatbox[index][0] * frame_height;
	var note_color = editor_beatbox[index][2] || 'blue';
		
	elm.removeClass(lane_classes).removeClass(color_classes);
	elm.addClass(["l" + note_c, note_color]);
	elm.css("top", note_y + "px");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function noteCloneAll(data) {
	let out = [];
	$.each(data, function (index, value) {
		out.push([value[0], value[1], (value[2] ? value[2] : "blue")]);
	});
	return out;
}

function noteGetColumn(dir) {
	if(dir == "L") return 0;
	if(dir == "D") return 1;
	if(dir == "U") return 2;
	if(dir == "R") return 3;
	return 0;
}

function noteCloneAllSorted(data) {
	let out = [];
	$.each(data, function (index, value) {
		out.push([value[0], value[1], (value[2] ? value[2] : "blue")]);
	});
	out.sort(function(a, b) {
		return a[0] - b[0];
	});
	return out;
}

function noteShiftFrames(frameShift, fromHistory) {
	frameShift = Number(frameShift);
		
	var minFrame = Math.max(0, editor_beatbox[0][0] + frameShift);
	var maxFrame = Math.min(0x7FFFFFFF, editor_beatbox[editor_beatbox.length - 1][0] + frameShift);
	
	if(frameShift < 0)
		frameShift = minFrame - editor_beatbox[0][0];
	else 
		frameShift = maxFrame - editor_beatbox[editor_beatbox.length - 1][0];
	
	for(var i = 0; i < editor_beatbox.length; i++) {
		editor_beatbox[i][0] += frameShift;
	}
	drawNoteField();
	
	// Add History
	if(fromHistory != true) {
		var historyText = "Note Shift: " + frameShift + " frames";
		var historyEntry = {"frames": frameShift};
		edit_history.add("shift", historyEntry, historyText, true);
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function jumpNoteIndex() {
	if(editor_beatbox == null)
		return;
	
	var raw = Number($("#jump_note_value").val());
	if(isNaN(raw)) raw = 0;
	raw = Math.max(0, Math.min(raw, editor_beatbox.length));
	
	$(".i" + raw)[0].scrollIntoView();
}

function jumpTimeIndex() {
	if(editor_beatbox == null)
		return;
	
	var raw = $("#jump_time_value").val().split(":");
	var time_secs = 0;
	if(raw.length == 2) time_secs = Number(raw[0]) * 60 + Number(raw[0]);
	if(raw.length == 1) time_secs = Number(raw[0]);
	var newScroll = sticky_offset + (time_secs * 30 * frame_height);
	$(window).scrollTop(newScroll);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////

function editorScrollUpdate() {
	if (window.pageYOffset > sticky_offset) {
		$(".sticky_container").outerWidth($(".sticky_container").outerWidth());
		$(".sticky_container").addClass("sticky");
	} else {
		$(".sticky_container").outerWidth("");
		$(".sticky_container").removeClass("sticky");
	}
}

function editorUpdatePreview() {
	if(editor_beatbox == null)
		return;
	
	if(chartPreview)
		chartPreview.setChartBeatbox(editor_beatbox);
}

function editorWriteFile() {
	if(editor_beatbox == null || editor_tag == null)
		return;

	// Generate New Filename
	var newFileName = swf_file_name.substr(0, swf_file_name.length - 4);
	newFileName += "." + (new Date().toLocaleString()).replace(/[\/|:|\s]/g, "_").replace(/,/g, "");
	newFileName += ".swf";
	
	// Rebuild Beatbox Order
	var newBeatboxArray = noteCloneAllSorted(editor_beatbox);
	
	// Write Beatbox Opcodes
	var beatboxSize = (generated_tag_end || editor_tag.header.end);
	
	var newPCode = new PCode();
	$.each(editor_tag["pool"], function (index, value) {
		newPCode.addConstant(value);
	});
	newPCode.writeVariable("_root.beatBox", newBeatboxArray);
	
	var newBeatbox = new PCodeCompile(newPCode).tag;
	var newBeatboxBuffer = newBeatbox.getBuffer();
	
	swf_write_buffer.seek(editor_tag.header.start);
	swf_write_buffer.replaceBytes(newBeatboxBuffer, beatboxSize);
	
	// Keep Length of new Beatbox for next writes.
	generated_tag_end = editor_tag.header.start + newBeatboxBuffer.byteLength;
	
	// Create Buffers
	var raw_size = swf_write_buffer.buffer_raw.byteLength; // Uncompressed Size
	var raw_data = swf_write_buffer.buffer_raw.slice(8);
	var compressed_data = pako.deflate(raw_data);
	var new_size = compressed_data.byteLength + 8;
	
	var final_file = new ArrayBuffer(new_size);
	var final_file_view = new DataView(final_file);
	var final_file_arrr = new Uint8Array(final_file);
	
	// Copy Header
	final_file_view.setUint8(0, 0x43); // 0x43 = Char 'C', 0x46 = Char 'F'
	for(var i = 1; i < 4; i++)
		final_file_view.setUint8(i, swf_write_buffer.buffer.getUint8(i));
	
	// Write New Uncompressed Size
	final_file_view.setUint32(4, raw_size, true);
	
	// Copy Compressed to Final
	final_file_arrr.set(compressed_data, 8);
	
	// Create Binary Blobs
	var blob = new Blob([final_file_arrr]);
	var blobUrl = URL.createObjectURL(blob);
	
	// Create Download Link
	$("#download_urls").append('<a href="' + blobUrl + '" download="' + newFileName + '">&gt; Download Chart SWF @ ' + (new Date().toLocaleString()) + '</a><br>');
}

function editorShiftFrames() {
	if(editor_beatbox == null)
		return;
	
	var frameShift = prompt("Enter Amount", "0");

	if (frameShift == null || frameShift == "") {}
	else {
		noteShiftFrames(frameShift);
	} 
}

function editorRandomColors() {
	if(editor_beatbox == null)
		return;
	
	// Add History
	var historyText = "Color Randomizer";
	var historyEntry = {
		"old": [],
		"new": []
	};
	
	for(var i = 0; i < editor_beatbox.length; i++) {
		historyEntry["old"][i] = editor_beatbox[i][2];
		editor_beatbox[i][2] = color_classes[Math.floor(Math.random() * 9)];
		historyEntry["new"][i] = editor_beatbox[i][2];
	}
	
	edit_history.add("color_random", historyEntry, historyText);
	
	drawNoteField();
}
