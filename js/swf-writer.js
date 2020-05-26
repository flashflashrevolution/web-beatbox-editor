function concatBuffer(buffer1, buffer2) {
	var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	return tmp.buffer;
};

function ByteWriter(rawSize) {
	this.baseSize = (rawSize == null || isNaN(rawSize)) ? 1024 : rawSize;
	this.textEncoder = new TextEncoder();
	this.buffer = new ArrayBuffer(this.baseSize);
	this.view = new DataView(this.buffer);
	this.array = new Uint8Array(this.buffer);
	this.pointer = 0;
	this.length = 0;
}

ByteWriter.prototype.getBuffer = function() {
	return this.buffer.slice(0, this.length);
}

ByteWriter.prototype.extendBuffer = function() {
	//console.log("Expanding Buffer:", this.buffer.byteLength);
	var tmp = new Uint8Array(this.buffer.byteLength + this.baseSize);
	tmp.set(new Uint8Array(this.buffer));
	
	this.buffer = tmp.buffer;
	this.view = new DataView(this.buffer);
	this.array = new Uint8Array(this.buffer);
	//console.log("New Buffer Length:", this.buffer.byteLength);
	return this;
}

ByteWriter.prototype.rebuild = function(ourBuffer, otherBuffer, prepend) {
	var tmp = new Uint8Array(ourBuffer.byteLength + otherBuffer.byteLength);
	if(prepend) {
		tmp.set(new Uint8Array(otherBuffer), 0);
		tmp.set(new Uint8Array(ourBuffer), otherBuffer.byteLength);
	} else {
		tmp.set(new Uint8Array(ourBuffer), 0);
		tmp.set(new Uint8Array(otherBuffer), ourBuffer.byteLength);
	}
	this.buffer = tmp.buffer;
	this.view = new DataView(this.buffer);
	this.array = new Uint8Array(this.buffer);
	this.pointer = this.length = this.buffer.byteLength;
	return this;
}

ByteWriter.prototype.prependBuffer = function(writeBuffer) {
	return this.rebuild(this.getBuffer(), writeBuffer.getBuffer(), true);
}

ByteWriter.prototype.appendBuffer = function(writeBuffer) {
	return this.rebuild(this.getBuffer(), writeBuffer.getBuffer(), false);
}

ByteWriter.prototype.seek = function(pos) {
	this.pointer = pos;
	return this;
}

ByteWriter.prototype.writeUIntLE = function(bits, val) {
	try {
		if((this.pointer + (bits / 8)) > this.buffer.byteLength)
			this.extendBuffer();
		
		this.view['setUint' + bits](this.pointer, val, true);
		
		this.pointer += bits / 8;
		this.length = Math.max(this.pointer, this.length);
	} catch ( e ) {
		throw e;
	}
	
	return this;
};

ByteWriter.prototype.writeType = function(type) {
	this.writeUIntLE(8, type);
	
	return this;
}

ByteWriter.prototype.writeTag = function(tag, len) {
	len = isNaN(len) ? 0 : len;
	
	this.writeUIntLE(16, ((tag << 6) & 0xffc0) | (len < RECORDHEADER_LENTH_FULL ? len : RECORDHEADER_LENTH_FULL));
	if(len >= RECORDHEADER_LENTH_FULL) this.writeUIntLE(32, len);
	
	return this;
}

ByteWriter.prototype.writeAction = function(action, len) {
	len = isNaN(len) ? 0 : len;
	
	this.writeUIntLE(8, action | (len > 0 ? 0x80 : 0));
	if(len > 0) this.writeUIntLE(16, len);
	
	return this;
}

ByteWriter.prototype.writeString = function(string) {
	var textArray = this.textEncoder.encode(string);
	var textLength = textArray.buffer.byteLength + 1;
	
	if((this.pointer + textLength) > this.buffer.byteLength)
		this.extendBuffer();
		
	this.array.set(textArray, this.pointer);
	this.pointer += textLength;
	this.length = Math.max(this.pointer, this.length);
	
	return this;
}
