/**
* Generate a new Constant Pool combining the old pool
* in the same order, and new missing elements if there are any.
* For laziness, the 4 direction and colors are just put into the pool
* if they are missing to make life easy.
*/
var gen_expected_pool_contents = ["L", "D", "U", "R", "blue", "red", "yellow",  "green", "orange", "pink", "purple", "cyan", "white"];

function generateConstantPool(paramPool) {
	var newPool = [];
	
	// Copy Old
	for(var i = 0; i < paramPool.length; i++) {
		newPool.push(paramPool[i]);
	}
	
	// Add expected values.
	for(i = 0; i < gen_expected_pool_contents.length; i++) {
		if(!newPool.includes(gen_expected_pool_contents[i]))
			newPool.push(gen_expected_pool_contents[i]);
	}
	
	return newPool;
}
/**
* Generate the inverse of the constant pool.
* Creates a map of the string => index for fast lookups.
*/
function generateInverseConstantPool(pool) {
	var inversePool = {};
	for(var i = 0; i < pool.length; i++) {
		inversePool[pool[i]] = i;
	}
	return inversePool;
}


/**
* Create an ArrayBuffer of the BeatBox data.
*/
function generateBeatBoxActionTag(paramNotes, paramPool) {
	var constantPool = generateConstantPool(paramPool);
	var inversePool = generateInverseConstantPool(constantPool);
	
	var buffer = null;
	var tag = null;
	
	// Write Constant Pool
	buffer = new ByteWriter(128);
	buffer.writeUIntLE(16, constantPool.length);
	for(var i = 0; i < constantPool.length; i++) {
		buffer.writeString(constantPool[i]);
	}
	buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.CONSTANTPOOL, buffer.length));
	tag = buffer;
	
	// Push _root Constant
	buffer = new ByteWriter(128);
	buffer.writeType(SWFTypeTags.CONSTANT8).writeUIntLE(8, inversePool['_root']);
	buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.PUSH, buffer.length));
	buffer.writeAction(SWFActionTags.GET_VARIABLE);
	tag.appendBuffer(buffer);
	
	// Write BeatBox - Color [Optional], Direction, Frame
	var noteCount = paramNotes.length;
	var note = null;
	var noteSize = 2;
	for(i = noteCount - 1; i >= 0; i--) {
		note = paramNotes[i];
		noteSize = note.length;
		buffer = new ByteWriter();
		
		if(i == (noteCount - 1))
			buffer.writeType(SWFTypeTags.CONSTANT8).writeUIntLE(8, inversePool['beatBox']);
		
		if(noteSize > 2) {
			if(inversePool[note[2]] > 255)
				buffer.writeType(SWFTypeTags.CONSTANT16).writeUIntLE(16, inversePool[note[2]]);
			else
				buffer.writeType(SWFTypeTags.CONSTANT8).writeUIntLE(8, inversePool[note[2]]);
		}
		buffer.writeType(SWFTypeTags.CONSTANT8).writeUIntLE(8, inversePool[note[1]]);
		buffer.writeType(SWFTypeTags.INTEGER).writeUIntLE(32, note[0]);
		buffer.writeType(SWFTypeTags.INTEGER).writeUIntLE(32, noteSize);
		
		buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.PUSH, buffer.length));
		buffer.writeAction(SWFActionTags.INIT_ARRAY);
		
		tag.appendBuffer(buffer);
	}
	
	// Write BeatBox Size
	buffer = new ByteWriter();
	buffer.writeType(SWFTypeTags.INTEGER).writeUIntLE(32, noteCount);
	buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.PUSH, buffer.length));
	buffer.writeAction(SWFActionTags.INIT_ARRAY);
	tag.appendBuffer(buffer);

	// Write Set Member on _root
	tag.appendBuffer(new ByteWriter(16).writeAction(SWFActionTags.SET_MEMBER).writeAction(SWFActionTags.END));

	// Write Action Header
	tag.prependBuffer(new ByteWriter(16).writeTag(SWFTags.DOACTION, tag.length));

	return tag;
}