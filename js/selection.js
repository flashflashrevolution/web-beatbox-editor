//////////////////
var editor_index = null;
var editor_ids = null;

$(function() {
	// Selection Note Model
	$("#noteSelectionModel .shiftSelectionFrames").click(editorSelectionShiftFrames);
	
	// Note Model
	$("#saveNoteButton").click(saveNoteModel);
	
	$(document).click(function(event) {
		$target = $(event.target);
		if(!$target.closest('#noteModel').length && $('#noteModel').is(":visible")) {
			hideNoteModel();
		}
		if(!$target.closest('#noteSelectionModel').length && $('#noteSelectionModel').is(":visible")) {
			hideNoteSelectionModel();
		}
	});
});

function openNoteModelInput(elms) {
	if(editor_beatbox == null || elms == null || elms.length <= 0)
		return;
	
	hideNoteModel();
	hideNoteSelectionModel();
	
	$(elms).addClass("selected");
	
	// Single Note
	if(elms.length == 1)
		openNoteModelSingle($(elms[0]));
	
	// Selection
	else
		openNoteModelMultiple(elms);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function openNoteModelSingle(target) {
	if(editor_beatbox == null)
		return;
	
	// Get Note ID
	editor_index = Number(target.attr("data-index"));
	
	if(editor_index == null || editor_index < 0 || editor_index >= editor_beatbox.length)
		return;
	
	// Get Note Data
	var noteData = editor_beatbox[editor_index];
	
	$(".noteIndex").text(editor_index);
	$("#note_model_frame").val(noteData[0]);
	$("#note_model_dir").val(noteData[1]);
	$("#note_model_color").val((noteData[2] || "blue"));
	
	// Display Panel
	updateNoteModelPosition();
	$("#noteModel").show();
}

function updateNoteModelPosition() {
	var target = $(".i" + editor_index);
	var targetOffset = target.offset();
	
	var model = $("#noteModel");
	model.css("left", (targetOffset.left + 45) + "px");
	model.css("top", (targetOffset.top - 24) + "px");
}

function saveNoteModel(event) {
	if(editor_beatbox == null || editor_index == null || editor_index < 0 || editor_index >= editor_beatbox.length)
		return;
	
	// Get Form Values
	var n_frame = Number($("#note_model_frame").val());
	var n_dir = $("#note_model_dir").val();
	var n_color = $("#note_model_color").val();
	
	// Add History
	var historyText = "Note " + editor_index + ": ";
	var historyEntry = {
		"index": editor_index,
		"old": {
			"f": editor_beatbox[editor_index][0],
			"d": editor_beatbox[editor_index][1],
			"c": editor_beatbox[editor_index][2] || "blue"
		},
		"new": {
			"f": n_frame,
			"d": n_dir,
			"c": n_color
		}
	};
	historyText += historyChangeText(historyEntry);
	edit_history.add("note", historyEntry, historyText);
	
	// Update Array
	editor_beatbox[editor_index][0] = n_frame;
	editor_beatbox[editor_index][1] = n_dir;
	editor_beatbox[editor_index][2] = n_color;
	
	// Update HTML Node
	updateNoteDisplay(editor_index);
	
	updateNoteModelPosition();
}

function hideNoteModel() {
	//note_selector.clearSelection();
	$(".selected").removeClass("selected");
	$("#noteModel").hide();
	editor_index = null;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function openNoteModelMultiple(elms) {
	// Build Note ID list.
	editor_ids = [];
	$.each(elms, function (index, value) {
		editor_ids.push(Number($(value).attr("data-index")));
	});
	editor_ids.sort(function(a, b){ return a-b;});
	
	// Note Selection Size Display
	$(".selectionSize").text(editor_ids.length);
	
	// Display Panel
	updateNoteSelectionModelPosition();
	$("#noteSelectionModel").show();
}

function updateNoteSelectionModelPosition() {
	var averageTopOffset = 0;
	$.each(editor_ids, function (index, value) {
		averageTopOffset += $(".i" + value).offset().top;
	});
	averageTopOffset /= editor_ids.length;
	
	var container = $("#chart_box");
	var containerOffset = container.offset();
	
	var model = $("#noteSelectionModel");
	model.css("left", (containerOffset.left + container.width() + 5) + "px"); // Use Container Size, regardless of note horizontal position.
	model.css("top", (averageTopOffset - (model.height() / 2)) + "px");
}

function hideNoteSelectionModel() {
	//note_selector.clearSelection();
	$(".selected").removeClass("selected");
	$("#noteSelectionModel").hide();
	editor_ids = null;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function editorSelectionShiftFrames() {
	var frameShift = prompt("Enter Amount", "0");

	if (frameShift == null || frameShift == "") {}
	else {
		noteSelectionShiftFrames(frameShift, editor_ids);
	} 
}

function noteSelectionShiftFrames(frameShift, indexes, fromHistory) {
	frameShift = Number(frameShift);
		
	var minFrame = Math.max(0, editor_beatbox[indexes[0]][0] + frameShift);
	var maxFrame = Math.min(0x7FFFFFFF, editor_beatbox[indexes[indexes.length - 1]][0] + frameShift);
	
	if(frameShift < 0)
		frameShift = minFrame - editor_beatbox[indexes[0]][0];
	else 
		frameShift = maxFrame - editor_beatbox[indexes[indexes.length - 1]][0];
	
	for(var i = 0; i < indexes.length; i++) {
		editor_beatbox[indexes[i]][0] += frameShift;
		updateNoteDisplay(indexes[i]);
	}
	
	// Add History
	if(fromHistory != true) {
		var historyText = "Selection Note Shift: " + frameShift + " frames";
		var historyEntry = {"frames": frameShift, "indexes": indexes.concat()};
		edit_history.add("selection_shift", historyEntry, historyText, true);
		
		updateNoteSelectionModelPosition();
	}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////

note_selector = Selection.create({
	singleClick: true,
    class: 'chart-selection',
    selectables: ['#chart_box > div'],
    boundaries: ['#noteListContainer']
}).on('start', ({inst, selected, oe}) => {
    if (!oe.ctrlKey && !oe.metaKey) {
		$(".selected").removeClass("selected");
        inst.clearSelection();
    }
}).on('move', ({changed: {removed, added}}) => {
	$(added).addClass('selected');
	$(removed).removeClass('selected');
}).on('stop', ({inst, oe}) => {
	var elms = inst.getSelection();
    inst.keepSelection();
	setTimeout(function() {
		openNoteModelInput(elms);
	}, 1); // Hide Mouse Event Triggers directly after this, closing the window instantly.
});