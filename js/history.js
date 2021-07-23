var edit_history = new HistoryEditor();

//////////////////////////////////////////////////////////////////////
// Undo / Redo Key listeners.
$(function() {
	$(document).keydown(function(e){
		// Ctrl + Y
		if (e.which == 89 && e.ctrlKey) edit_history.stepForward();

		// Crtl + Z
		if (e.which == 90 && e.ctrlKey) edit_history.stepBack();
	});
});

function e_historyClick(event) {
	var index = $(event.currentTarget).attr("data-index");
	edit_history.jumpToHistory(Number(index));
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

//////////////////////////////////////////////////////////////////////

function HistoryEditor() {
	this.entries = [];
	this.active_index = 0;
}

HistoryEditor.prototype.clear = function() {
	this.entries = [];
	this.active_index = 0;
	$("#history").html("History:");
}

HistoryEditor.prototype.add = function(type, data, log_text, ignore_changes) {
	if(ignore_changes || historyChangeCount(data) > 0) {
		// Remove Undo History that is invalid now.
		if(this.active_index < this.entries.length - 1) {
			this.entries.length = this.active_index + 1;
			$("#history .undo").remove();
		}
		
		// Add New Entry
		var id = this.entries.length;
		var entry = {
			"id": id,
			"type": type,
			"data": data
		};
		
		if(this.build(entry)) {
			// Set History Index
			this.active_index = id;
			
			// Add HTML Button
			var historyElm = $("#history");
			var historyHtml = '<div data-index="' + id + '" id="history_entry_' + id + '"><a>' + log_text + '</a></div>';
			historyElm.append(historyHtml);
			historyElm.scrollTop(historyElm.prop("scrollHeight"));
			$("#history_entry_" + id).on("click", e_historyClick);
		}
	}
}

HistoryEditor.prototype.get = function(id) {
	return this.entries[id] || null;
}

HistoryEditor.prototype.build = function(entry) {
	var built = null;
	
	switch(entry["type"]) {
		case "load":             built = new HistoryTypeLoad(entry);           break;
		case "note":             built = new HistoryTypeNote(entry);           break;
		case "shift":            built = new HistoryTypeShift(entry);          break;
		case "color_random":     built = new HistoryTypeColorRandom(entry);    break;
		case "selection_shift":  built = new HistoryTypeSelectionShift(entry); break;
	}
	
	if(built != null) {
		this.entries.push(built);
		return true;
	}
	return false;
}

HistoryEditor.prototype.undoEntry = function(id) {
	this.entries[id].undo();
	$("#history_entry_" + id).addClass("undo");
}

HistoryEditor.prototype.redoEntry = function(id) {
	this.entries[id].redo();
	$("#history_entry_" + id).removeClass("undo");
}

HistoryEditor.prototype.jumpToHistory = function(index) {
	var entry = this.get(index);
	
	if(entry == null || this.active_index == index)
		return;
	
	// We're ahead, go back.
	if(this.active_index > index) {
		for(var i = this.active_index; i > index; i--) {
			this.undoEntry(i);
		}
	}
	// We're behind, go forward.
	else if(this.active_index < index) {
		for(var i = this.active_index + 1; i <= index; i++) {
			this.redoEntry(i);
		}
	}
	this.active_index = index;
}

HistoryEditor.prototype.stepBack = function() {
	if(this.entries.length > 1 && this.active_index > 0) {
		this.undoEntry(this.active_index);
		this.active_index--;
	}
}

HistoryEditor.prototype.stepForward = function() {
	if(this.entries.length > 1 && this.active_index < this.entries.length - 1) {
		this.active_index++;
		this.redoEntry(this.active_index);
	}
}

//////////////////////////////////////////////////////////////////////
function HistoryTypeLoad(entry) {}
HistoryTypeLoad.prototype.undo = function() {}
HistoryTypeLoad.prototype.redo = function() {}

//////////////////////////////////////////////////////////////////////
function HistoryTypeNote(entry) {
	this.entry = entry;
}

HistoryTypeNote.prototype.undo = function() {
	var note_index = this.entry["data"]["index"];
	
	// Update Array
	editor_beatbox[note_index][0] = this.entry["data"]["old"]["f"];
	editor_beatbox[note_index][1] = this.entry["data"]["old"]["d"];
	editor_beatbox[note_index][2] = this.entry["data"]["old"]["c"];
	editor_beatbox[note_index][3] = this.entry["data"]["old"]["t"];
	
	// Update HTML Node
	updateNoteDisplay(note_index);
}

HistoryTypeNote.prototype.redo = function() {
	var note_index = this.entry["data"]["index"];
	
	// Update Array
	editor_beatbox[note_index][0] = this.entry["data"]["new"]["f"];
	editor_beatbox[note_index][1] = this.entry["data"]["new"]["d"];
	editor_beatbox[note_index][2] = this.entry["data"]["new"]["c"];
	editor_beatbox[note_index][3] = this.entry["data"]["new"]["t"];
	
	// Update HTML Node
	updateNoteDisplay(note_index);
}

//////////////////////////////////////////////////////////////////////
function HistoryTypeShift(entry) {
	this.entry = entry;
}

HistoryTypeShift.prototype.undo = function() {
	var frame_shift = this.entry["data"]["frames"];
	noteShiftFrames(-frame_shift, true);
}

HistoryTypeShift.prototype.redo = function() {
	var frame_shift = this.entry["data"]["frames"];
	noteShiftFrames(frame_shift, true);
}

//////////////////////////////////////////////////////////////////////
function HistoryTypeColorRandom(entry) {
	this.entry = entry;
}

HistoryTypeColorRandom.prototype.undo = function() {
	for(var i = 0; i < this.entry["data"]["old"].length; i++) {
		editor_beatbox[i][2] = this.entry["data"]["old"][i];
	}
	drawNoteField();
}

HistoryTypeColorRandom.prototype.redo = function() {
	for(var i = 0; i < this.entry["data"]["new"].length; i++) {
		editor_beatbox[i][2] = this.entry["data"]["new"][i];
	}
	drawNoteField();
}

//////////////////////////////////////////////////////////////////////
function HistoryTypeSelectionShift(entry) {
	this.entry = entry;
}

HistoryTypeSelectionShift.prototype.undo = function() {
	var frame_shift = this.entry["data"]["frames"];
	noteSelectionShiftFrames(-frame_shift, this.entry["data"]["indexes"], true);
}

HistoryTypeSelectionShift.prototype.redo = function() {
	var frame_shift = this.entry["data"]["frames"];
	noteSelectionShiftFrames(frame_shift, this.entry["data"]["indexes"], true);
}
