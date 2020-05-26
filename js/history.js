var editor_history = [];
var editor_history_index = 0;

function e_historyClick(event) {
	var index = $(event.currentTarget).attr("data-index");
	historyUndo(index);
}

function historyClear() {
	editor_history = [];
	editor_history_index = 0;
	$("#history").empty();
}

function historyAdd(type, data, log_text, ignore_changes) {
	if(historyChangeCount(data) > 0 || ignore_changes) {
		var id = editor_history_index++;
		var entry = {
			"id": id,
			"type": type,
			"data": data
		};
		editor_history.push(entry);
		var historyHtml = '<div title="Undo Action" data-index="' + id + '" id="his' + id + '"><a>• ' + log_text + '</a></div>';
		$("#history").append(historyHtml);
		$("#his" + id).on("click", e_historyClick);
		if($("#history").children().length > 1) $("#history_change_text").hide();
	}
}

function historyChangeText(entry) {
	var historyText = "";
	for (var prop in entry["old"]) {
		if(entry["old"][prop] != entry["new"][prop])
			historyText += "[" + (prop.toUpperCase()) + ": '" + entry["old"][prop] + "' &gt; '" + entry["new"][prop] + "'] ";
	}
	return historyText;
}

function historyChangeCount(entry) {
	var historyCount = 0;
	for (var prop in entry["old"]) {
		if(entry["old"][prop] != entry["new"][prop])
			historyCount++;
	}
	return historyCount;
}

function historyGetEntry(id) {
	var entries = editor_history.length - 1;
	for(var i = entries; i >= 0; i--)
		if(editor_history[i].id == id)
			return editor_history[i];
		
	return null;
}

function historyDeleteEntry(id) {
	var entries = editor_history.length - 1;
	for(var i = entries; i >= 0; i--)
		if(editor_history[i].id == id)
			editor_history.splice(i, 1);
}

function historyUndo(id) {
	var entry = historyGetEntry(id);
	
	if(entry == null)
		return;
	
	switch(entry["type"]) {
		case "note":
			historyUndoTypeNote(entry);
			break;
		case "shift":
			historyUndoTypeShift(entry);
			break;
		case "color_random":
			historyUndoTypeColorRandomizer(entry);
			break;
	}
	
	// Remove Node in History List
	historyDeleteEntry(id);
	$("#his" + id).remove();
	if($("#history").children().length <= 1)
		$("#history_change_text").show();
}

//////////////////////////////////////////////////////////////////////

function historyUndoTypeNote(entry) {
	var note_index = entry["data"]["index"];
	
	// Update Array
	editor_beatbox[note_index][0] = entry["data"]["old"]["f"];
	editor_beatbox[note_index][1] = entry["data"]["old"]["d"];
	editor_beatbox[note_index][2] = entry["data"]["old"]["c"];
	
	// Update HTML Node
	updateNoteDisplay(note_index);
}

function historyUndoTypeShift(entry) {
	var frame_shift = entry["data"]["frames"];
	noteShiftFrames(-frame_shift, true);
}

function historyUndoTypeColorRandomizer(entry) {
	for(var i = 0; i < entry["data"]["old"].length; i++) {
		editor_beatbox[i][2] = entry["data"]["old"][i];
	}
	drawNoteField();
}