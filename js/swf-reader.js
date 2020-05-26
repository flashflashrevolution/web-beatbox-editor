var RECORDHEADER_LENTH_FULL = 0x3f
		// null-character
	, EOS = 0x00
	, styleCountExt = 0xFF;

/**
 *
 * Constructor of ByteReader object
 *
 * @param {ArrayBuffer} buffer
 * @return Instance of ByteReader
 */

function ByteReader( buffer ) {
	this.buffer_raw = buffer;
	this.buffer = new DataView(buffer);
	this.pointer = 0;
	this.position = 1;
	this.current = 0;
	this.length = buffer.byteLength;
}

/**
 * Reads unsigned 16 or 32 Little Endian Bits
 * and advance pointer to next bits / 8 bytes
 *
 * @param {Number} bits
 * @return {Number} Value read from buffer
 */

ByteReader.prototype.readUIntLE = function( bits ) {
	var value = 0;
	try {
		value = this.buffer['getUint' + bits](this.pointer, true);
		this.pointer += bits / 8;
	} catch ( e ) {
		throw e;
	}
	return value;
};

/**
 * Reads unsigned 8 bit from the buffer
 *
 * @return {Number} Value read from buffer
 */

ByteReader.prototype.readUInt8 = function() {
	return this.buffer.getUint8( this.pointer++ );
};

/**
 * Reads float from the buffer
 *
 * @return {Number} Value read from buffer
 */

ByteReader.prototype.readFloat = function() {
	var value = 0;
	try {
		value = this.buffer.getFloat32(this.pointer);
		this.pointer += 4;
	} catch ( e ) {
		throw e;
	}
	return value;
};

/**
 * Reads double from the buffer
 *
 * @return {Number} Value read from buffer
 */

ByteReader.prototype.readDouble = function() {
	var value = 0;
	try {
		value = this.buffer.getFloat64(this.pointer);
		this.pointer += 8;
	} catch ( e ) {
		throw e;
	}
	return value;
};

/**
 * Reads 32-bit unsigned integers value encoded (1-5 bytes)
 *
 * @return {Number} 32-bit unsigned integer
 */

ByteReader.prototype.readEncodedU32 = function() {
	var i = 5
		, result = 0
		, nb;

	do
		result += (nb = this.nextByte());
	while((nb & 128) && --i);

	return result;
};

/**
 * Reads an encoded data from buffer and returns a
 * string using the specified character set.
 *
 * @param {String} encoding - defaults to 'utf8'
 * @returns {String} Decoded string
 */

ByteReader.prototype.readString = function(encoding) {
	var str = "";
	while(true) {
		var read = this.readUInt8();
		if(read === EOS)
			break;
		str += String.fromCharCode(read);
	}
	return str;
};

/**
 * Reads an encoded data from buffer and returns a
 * string using the specified character set.
 *
 * @param {String} encoding - defaults to 'utf8'
 * @returns {String} Decoded string
 */

ByteReader.prototype.readStringFixed = function(readLength) {
	var str = "";
	while(readLength-- > 0) {
		var read = this.readUInt8();
		if(read === EOS)
			break;
		str += String.fromCharCode(read);
	}
	return str;
};

/**
 * Reads RECORDHEADER from next tag in the buffer
 *
 * @return {Object} Tag code and length
 */

ByteReader.prototype.readTagCodeAndLength = function() {
	var p = this.pointer;
	var n = this.readUIntLE(16)
		, tagType = n >> 6
		, tagLength = n & RECORDHEADER_LENTH_FULL;

	if ( n === 0 )
		return false;

	if ( tagLength === RECORDHEADER_LENTH_FULL )
		tagLength = this.readUIntLE(32);

	return { start : p, end: this.pointer + tagLength, code : tagType, length : tagLength, position : this.pointer };
};

/**
 * Reads RECORDHEADER from next tag in the buffer
 *
 * @return {Object} Tag code and length
 */

ByteReader.prototype.readAction = function() {
	var s = this.pointer;
	var a = this.readUInt8();
	var l = (a & 0x80) ? this.readUIntLE(16) : 0;
	var p = this.pointer;
	
	return { start : s, action : a, length : l, position: p };
};

/**
 * Reads RECT format
 *
 * @return {Object} x, y, width and height of the RECT
 */

ByteReader.prototype.readRect = function() {

	this.start();

	var NBits = this.readBits(5)
		, Xmin	= this.readBits(NBits, true)/20
		, Xmax	= this.readBits(NBits, true)/20
		, Ymin	= this.readBits(NBits, true)/20
		, Ymax	= this.readBits(NBits, true)/20;

	return {
		x : Xmin,
		y : Ymin,
		width : (Xmax > Xmin ?	Xmax - Xmin : Xmin - Xmax),
		height : (Ymax > Ymin ? Ymax - Ymin : Ymin - Ymax)
	};

}

/**
 * Sets internal pointer to the specified position;
 *
 * @param {Number} pos
 */

ByteReader.prototype.seek = function( pos ) {
	this.pointer = pos % this.buffer.byteLength;
};

/**
 * Resets position and sets current to next Byte in buffer
 */
ByteReader.prototype.start = function() {
	this.current = this.nextByte();
	this.position = 1;
};

/**
 * Gets next Byte in the buffer and Increment internal pointer
 *
 * @return {Number} Next byte in buffer
 */

ByteReader.prototype.nextByte = function() {
	return this.pointer > this.buffer.byteLength ? null : this.buffer.getUint8( this.pointer++ );
};

/**
 * Reads b bits from current byte in buffer
 *
 * @param {Number} b
 * @return {Number} Bits read from buffer
 */

ByteReader.prototype.readBits = function( b, signed ) {
	var n = 0
		, r = 0
		, sign = signed && ++n && ((this.current >> (8-this.position++)) & 1) ? -1 : 1;

	while( n++ < b ) {
		if ( this.position > 8 ) this.start();

		r = (r << 1 ) + ((this.current >> (8-this.position++)) & 1);
	}
	return sign * r;
};

/**
 * Replace bytes in the ArrayBuffer with the provided bytes.
 * This slices the from `0 -> pointer` and `position_end -> bufferlength`
 * and inserts the given bytes between them.
 *
 * @param {ArrayBuffer} b
 * @return {Number} Bits read from buffer
 */

ByteReader.prototype.replaceBytes = function(new_bytes, postion_end) {
	var buffer1 = this.buffer_raw.slice(0, this.pointer);
	var buffer2 = new_bytes;
	var buffer3 = this.buffer_raw.slice(postion_end);
	
	var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength + buffer3.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	tmp.set(new Uint8Array(buffer3), buffer1.byteLength + buffer2.byteLength);
	
	this.buffer_raw = tmp.buffer;
	this.buffer = new DataView(this.buffer_raw);
	this.pointer = 0;
	this.position = 1;
	this.current = 0;
	this.length = this.buffer.byteLength;
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Concat SWF Header with uncompressed Buffer
 */
function concatSWFHeader(buff, swf) {
	var tmp = new Uint8Array(buff.byteLength + 8);
	tmp.set(new Uint8Array(swf.slice(0, 8)));
	tmp.set(new Uint8Array(buff), 8);
	return tmp.buffer;
}

/**
 * Decompress SWF if needed and Read SWF
 */
function uncompress(swf) {
	var swf_bytes = new Uint8Array(swf);
	var compressed_buff = swf.slice(8);
	
	// uncompress buffer
	switch( swf_bytes[0] ) { // MAGIC
		case 0x43 : // 'C' = zlib compressed
			uncompressed_buff = concatSWFHeader(pako.inflate(compressed_buff), swf);
			return readSWFBuff(new ByteReader(uncompressed_buff), swf);
			break;
			
		case 0x46 : // 'F' = uncompressed
			return readSWFBuff(new ByteReader( swf ), swf);
			break;
			
		case 0x5a : // LZMA compressed
			alert('Cannot handle LZMA SWF compressions');
			break;
			
		default :
			alert('Unknown SWF compressions');
			break;
	}
}

/**
 * Reads the SWF from uncompressed buffer.
 */
function readSWFBuff(buff, compressed_buff) {
	buff.seek(0);// start

	var swf = {
		buffer		: buff,
		magic		: buff.readStringFixed(3),
		version     : buff.readUInt8(),
		fileLength  : {
			compressed    : compressed_buff.byteLength,
			uncompressed  : buff.readUIntLE(32)
		},
		frameSize   : buff.readRect(), // Returns a RECT object. i.e : { x : 0, y : 0, width : 200, height: 300 }
		frameRate   : buff.readUIntLE(16)/256,
		frameCount  : buff.readUIntLE(16)
	};
	try {
		swf.tags = readSWFTags(buff, swf);
	} catch(e) {
		console.log(e);
	}
	return swf;
}

/**
 * Parses the SWF TAG data structure, keeping only the tags
 * we are interested in.
 * - Audio Tags: Audio Samples
 * - Do Action Tag: Containing the beatBox variable.
 */
function readSWFTags(buff, swf) {
	var tags = [];
	var tag;
	var tagHeader;
	
	var mp3Frame = 0;
	var mp3Seek = 0;
	var mp3Samples = 0;
	var mp3Id = 0;
	var mp3Format = 0;
	var mp3Stream = false;

	/* Reads TagCodeAndLength from Tag's RECORDHEADER */
	while( (tagHeader = buff.readTagCodeAndLength()) ) {
		tag = {
			header : tagHeader,
			doInclude : false
		};
		
		switch( tagHeader.code ) {
			// Sound Tags - MP3 Extraction
			case SWFTags.STREAMBLOCK:
				if (!mp3Stream || ((tagHeader.length - 4) == 0))
					break;
				
				mp3Samples += buff.readUIntLE(16); // frame samples
				buff.readUIntLE(16); // seek samples
				
				tag.data = buff.buffer_raw.slice(buff.pointer, buff.pointer + (tagHeader.length - 4));
				tag.audio_bytes = (tagHeader.length - 4);
				tag.doInclude = true;
				break;
				
			case SWFTags.STREAMHEAD:
			case SWFTags.STREAMHEAD2:
				buff.readUIntLE(8);
				mp3Format = buff.readUIntLE(8);
				buff.readUIntLE(16); // average frame samples
				mp3Seek = buff.readUIntLE(16);
				if (((mp3Format >>> 4) & 0xf) == SWFOtherTags.CODEC_MP3)
					mp3Stream = true;
				break;
				
			case SWFTags.DEFINESOUND:
				if (!mp3Stream)
				{
					var id = buff.readUIntLE(16);
					var format = buff.readUIntLE(8);
					if (((format >>> 4) & 0xf) == SWFOtherTags.CODEC_MP3)
					{
						mp3Id = id;
						mp3Format = format;
						mp3Samples = buff.readUIntLE(32);
						mp3Seek = buff.readUIntLE(16);
						tag.data = buff.buffer_raw.slice(buff.pointer, buff.pointer + (tagHeader.length - 9));
						tag.audio_bytes = (tagHeader.length - 9);
						tag.doInclude = true;
					}
				}
				break;
				
			// DoAction - Where the Beatbox Lives
			case SWFTags.DOACTION :
				//console.log("Found a SWFTags.DOACTION Tag!");
				var _finishedReading = false;
				
				var actionStack = [];
				var actionVariables = {};
				var actionRegisters = [null, null, null, null];
				var constantPool = [];
				
				while (!_finishedReading) {
					var action = buff.readAction();
					
					// Read Action Tag
					switch (action.action) {
						case SWFActionTags.END:
							_finishedReading = true;
							break;
							
						case SWFActionTags.CONSTANTPOOL:
							constantPool = [];
							var constantCount = buff.readUIntLE(16);
							for (var i = 0; i < constantCount; i++) {
								constantPool.push(buff.readString());
							}
							break;
							
						case SWFActionTags.PUSH:
							while (buff.pointer < action.position + action.length) {
								var pushValue = undefined;
								var pushType = buff.readUIntLE(8);
								switch (pushType) {
									case SWFTypeTags.STRING_LITERAL:
										pushValue = buff.readString();
										break;
										
									case SWFTypeTags.FLOAT_LITERAL:
										pushValue = buff.readFloat();
										break;
										
									case SWFTypeTags.NULL:
										pushValue = null;
										break;
										
									case SWFTypeTags.UNDEFINED:
										pushValue = undefined;
										break;
										
									case SWFTypeTags.REGISTER:
										pushValue = actionRegisters[buff.readUIntLE(8)];
										break;
										
									case SWFTypeTags.BOOLEAN:
										pushValue = Boolean(buff.readUIntLE(8));
										break;
										
									case SWFTypeTags.DOUBLE:
										pushValue = buff.readDouble();
										break;
										
									case SWFTypeTags.INTEGER:
										pushValue = buff.readUIntLE(32);
										break;
										
									case SWFTypeTags.CONSTANT8:
										pushValue = constantPool[buff.readUIntLE(8)];
										break;
										
									case SWFTypeTags.CONSTANT16:
										pushValue = constantPool[buff.readUIntLE(16)];
										break;
										
									default:
										console.log("FOUND UNSUPPORTED PUSHDATA TYPE: " + pushType);
										break;
								}
								actionStack.push(pushValue);
							}
							break;
							
						case SWFActionTags.POP:
							actionStack.pop();
							break;
							
						case SWFActionTags.DUPLICATE:
							actionStack.push(actionStack[actionStack.length - 1]);
							break;
							
						case SWFActionTags.STORE_REGISTER:
							actionRegisters[buff.readUIntLE(8)] = actionStack[actionStack.length - 1];
							break;
							
						case SWFActionTags.GET_VARIABLE:
							var gvName = actionStack.pop();
							if (!(gvName in actionVariables))
								actionVariables[gvName] = {};
							actionStack.push(actionVariables[gvName]);
							break;
							
						case SWFActionTags.SET_VARIABLE:
							var svValue = actionStack.pop();
							actionVariables[actionStack.pop()] = svValue;
							break;
							
						case SWFActionTags.INIT_ARRAY:
							var arraySize = actionStack.pop();
							var array = [];
							for (i = 0; i < arraySize; i++)
								array.push(actionStack.pop());
							actionStack.push(array);
							break;
							
						case SWFActionTags.GET_MEMBER:
							var gmName = actionStack.pop();
							var gmObject = actionStack.pop();
							if (!(gmName in gmObject))
								gmObject[gmName] = {};
							actionStack.push(gmObject[gmName]);
							break;
							
						case SWFActionTags.SET_MEMBER:
							var smValue = actionStack.pop();
							var smName = actionStack.pop();
							actionStack.pop()[smName] = smValue;
							break;
							
						default:
							//console.log("FOUND UNSUPPORTED ACTION TAG: " + action.action.toString(16));
							break;
					}
				}
				if(actionVariables["_root"] != undefined && actionVariables["_root"]["beatBox"])
					tag.doInclude = true;
				
				tag.pool = constantPool;
				tag.variables = actionVariables;
				break;
				
			default:
				//tag.data = buff.buffer_raw.slice(buff.pointer, buff.pointer + tagHeader.length);
				break;
		}
		
		if(tag.doInclude)
		{
			delete tag.doInclude;
			tags.push(tag);
		}
		
		buff.seek(tagHeader.position + tagHeader.length);
	}
	return tags;
}