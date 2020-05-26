const songChartPreviewer = ( p ) => {
	let BASE_COLORS = ["blue", "red", "yellow",  "green", "orange", "pink", "purple", "cyan", "white"];
	let BASE_DIRECTIONS = {"D": 0, "L": 1.5708, "U": 3.14159, "R": 4.71239}
	let BASE_COLUMN = {"D": 1, "L": 0, "U": 2, "R": 3}
	
	let music_data = null;
	let chart_data = null;
	
	let CURRENT_TIME = 0;
	let CURRENT_RATIO = 0;
	let MUSIC_END = 1;
	let NOTE_INDEX = 0;
	let NOTE_COUNT = 1;
	let NOTE_LAST_FRAME = 1;
	let RECEPTOR_LINE = 50;
	let NOTE_SPEED = 450;
	let NOTE_VERTEX = 1;
	let NOTE_DIR = "down";
	let READAHEAD = (RECEPTOR_LINE / NOTE_SPEED);
	let IS_PLAYING = false;
	
	let PROGRESS_BAR_COLOR = p.color(108, 219, 255);
	
	let setupComplete = false;
	
	// Peload Data
	let preload_content = [
		["image", "note_receptor", BASE_NOTE_LOCATION + "note_receptor.png"]
	];
	
	let loaded_data = [];
	
	BASE_COLORS.forEach(function(e) {
		preload_content.push(["image", "note_" + e, BASE_NOTE_LOCATION + "note_" + e + ".png"]);
	});
	
	p.preload = function() {
		p.soundFormats('mp3');
		preload_content.forEach(function(e) {
			switch(e[0]) {
				case 'image': loaded_data[e[1]] = p.loadImage(e[2]); break;
				case 'json':  loaded_data[e[1]] = p.loadJSON(e[2]);  break;
				case 'sound': loaded_data[e[1]] = p.loadSound(e[2]); break;
			}
		});
	}
	
	// Setup P5
	p.setup = function() {
		p.createCanvas(310, 400);
		p.frameRate(60);
		
		setScrollDirection(NOTE_DIR);
		
		setupComplete = true;
	};
	
	// Draw
	p.draw = function() {
		p.background(0);
		
		if(chart_data == null || music_data == null)
			return;
		
		CURRENT_TIME = music_data.currentTime(); // Yes, I sync with music, it's only a preview.
		CURRENT_RATIO = CURRENT_TIME / MUSIC_END;
		
		//p.clear();
		
		var n_time = 0;
		var n_last = NOTE_INDEX; // Store first note, cuts loop counts down.
		for(var i = NOTE_INDEX; i < NOTE_COUNT; i++) {
			n_time = chart_data[i]["time"];
			if(n_time < CURRENT_TIME) {
				n_last = i;
				continue;
			}
			else if(n_time > CURRENT_TIME + READAHEAD)
				break;
			
			drawNote(chart_data[i], RECEPTOR_LINE + (NOTE_VERTEX * (NOTE_SPEED * (n_time - CURRENT_TIME))));
		}
		NOTE_INDEX = n_last;
		
		if(CURRENT_TIME >= MUSIC_END)
			music_data.stop();
		
		// Draw Receptors
		drawNoteParam("receptor", "L", RECEPTOR_LINE);
		drawNoteParam("receptor", "D", RECEPTOR_LINE);
		drawNoteParam("receptor", "U", RECEPTOR_LINE);
		drawNoteParam("receptor", "R", RECEPTOR_LINE);
		
		
		// Draw Progress Bar
		p.fill(PROGRESS_BAR_COLOR);
		p.noStroke();
		p.rect(0, 390, 310 * CURRENT_RATIO, 10);
	};
	
	//##############################################//
	// Our External Functions
	p.setNoteSpeed = function(val) {
		if(isNaN(val))
			return false;
		val = parseFloat(val);
		
		NOTE_SPEED = 300 * val;
		NOTE_INDEX = 0;
		setScrollDirection(NOTE_DIR);
		
		return true;
	};
	
	p.scrollDirection = function(val) {
		return setScrollDirection(val);
	}
	
	// Begin Playback
	p.playPreview = function(val) {
		if(!setupComplete)
			return false;
		
		if(music_data.isPlaying())
			music_data.stop();
		else {
			NOTE_INDEX = 0;	
			music_data.play();
		}
		IS_PLAYING = true;
		return true;
	};
	p.stopPreview = function(val) {
		if(music_data && music_data.isPlaying())
			music_data.stop();
		IS_PLAYING = false;
		return true;
	};
	
	// Data Setting
	p.clearData = function(val) {
		p.stopPreview();
		chart_data = null;
		music_data = null;
	}
	
	p.setChartBeatbox = function(val) {
		// Setup Chart Data
		chart_data = transformChartData(val);
		NOTE_COUNT = chart_data.length;
		MUSIC_END = chart_data[NOTE_COUNT-1]["time"] + 1;
		NOTE_LAST_FRAME = chart_data[NOTE_COUNT-1]["frame"];
	}
	
	p.setChartAudio = function(val) {
		if(music_data && music_data.isPlaying())
			music_data.stop();
		
		music_data = null;
		CURRENT_TIME = 0;
		p.loadSound(val, e_onAudioLoad);
	}
	
	e_onAudioLoad = function(e) {
		// Setup Audio
		music_data = e;
		music_data.setVolume(0.1);
		
		//p.playPreview();
	}
	
	//##############################################//
	setScrollDirection = function(dir) {
		if(dir == "down") {
			RECEPTOR_LINE = p.height - 50;
			READAHEAD = (RECEPTOR_LINE / NOTE_SPEED);
			NOTE_VERTEX = -1;
			NOTE_DIR = "down";
		}
		else {
			RECEPTOR_LINE = 50;
			READAHEAD = ((p.height - RECEPTOR_LINE) / NOTE_SPEED);
			NOTE_VERTEX = 1;
			NOTE_DIR = "up";
		}
		return true;
	};
	
	transformChartData = function(e) {
		let out = [];
		$.each(e, function (index, value) {
			out.push({"frame": value[0], "dir": value[1], "color": (value[2] ? value[2] : "blue"), "time": (value[0] / 30)});
		});
		return out;
	};
	
	//##############################################//
	let NOTE_GAP = 40;
	drawNote = function(note, y) {
		drawNoteParam(note["color"], note["dir"], y);
	};
	
	drawNoteParam = function(color, direction, y) {
		p.push();
		p.translate(
				(p.width / 2) - (NOTE_GAP * 2) + (NOTE_GAP * BASE_COLUMN[direction]) + (NOTE_GAP / 2), 
				y
			);
		p.rotate(BASE_DIRECTIONS[direction]);
		p.image(loaded_data["note_" + color], -16, -16);
		p.pop();
	};
}