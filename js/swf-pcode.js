/**
 * PCode Generator for SWF.
 * - Velocity
 *
 * Is able to generate a PCode op list for writing back into a SWF.
 * Values can be set using "writeVariable". All other functions shouldn't
 * be used unless you have a reason.
 *
 * @return Instance of PCode
 */
function PCode() {
	this.opcodes = [];
	this.constants = [];
}

/**
 * Add a new variable into the PCode list.
 * 
 * Example Use:
 * pcode.writeVariable("_root.beatBox", [[46,"L","green"],[49,"D","red"]);
 *
 * @return Self Instance of PCode
 */
PCode.prototype.writeVariable = function(var_name, data) {
	// Write Variable Name, Setup SET_MEMBER
	var var_parts = var_name.split(".");
	
	this.push(var_parts[0]);
	this.add("GET_VARIABLE");
	
	if(var_parts.length > 1) {
		for(var i = 1; i < var_parts.length - 1; i++) {
			this.push(var_parts[i]);
			this.add("GET_MEMBER");
		}
		this.push(var_parts[var_parts.length - 1]);
	}
	
	this.push(data);
	
	// Set Member
	this.add("SET_MEMBER");
	
	return this;
}

PCode.prototype.add = function(...values) {
	this.opcodes.push(values);
}

PCode.prototype.addConstant = function(value) {
	if(this.constants.indexOf(value) === -1)
		this.constants.push(value);
}


PCode.prototype.push = function(value) {
	if(Array.isArray(value))
		this.pushArray(value);
	else
		this.add("PUSH", value);
	
	// Add Constant Pool
	if(typeof value === "string")
		this.addConstant(value);
}

PCode.prototype.pushArray = function(inputArray) {
	for(var i = inputArray.length - 1; i >= 0; i--) {
		this.push(inputArray[i]);
	}
	this.add("PUSH", inputArray.length);
	this.add("INIT_ARRAY");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
* PCode Basic Compiler
* - Velocity
*
* Used to compile the PCode into Flash opcodes. Pass in a PCode
* instance and access the result from the "tag" variable.
*
* Note: This is single use and a new instance must be used for each
* PCode compile.
*/
function PCodeCompile(pcode) {
	this.index = 0;
	this.code = pcode;
	this.tag = new ByteWriter(128);
	
	if(this.code.constants.length > 0)
		this.writeConstantPool();
	
	this.writeOps();
}

PCodeCompile.prototype.writeConstantPool = function() {
	var buffer = new ByteWriter(128);
	buffer.writeUIntLE(16, this.code.constants.length);
	for(var i = 0; i < this.code.constants.length; i++) {
		buffer.writeString(this.code.constants[i]);
	}
	buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.CONSTANTPOOL, buffer.length));
	this.tag = buffer;
}

PCodeCompile.prototype.writeOps = function() {
	var line = null;
	while(this.index < this.code.opcodes.length) {
		line = this.code.opcodes[this.index];
		
		switch(line[0]) {
			case "PUSH":
				this.writePush();
				break;
				
			default:
				this.tag.writeAction(SWFActionTags[line[0]]);
		}
		
		this.index++;
	}
	
	this.tag.writeAction(SWFActionTags.END);
	this.tag.prependBuffer(new ByteWriter(16).writeTag(SWFTags.DOACTION, this.tag.length));
}

PCodeCompile.prototype.writePush = function() {
	var buffer = new ByteWriter(128);
	var line = null;
	// Check for multiple Pushes, and compact them.
	while(this.index < this.code.opcodes.length) {
		line = this.code.opcodes[this.index];
		
		opcode = line[0];
		value = line[1];
		
		switch(typeof value) {
			case "string":
				var poolPosition = this.code.constants.indexOf(value);
				if(poolPosition >= 0) {
					if(poolPosition <= 255)
						buffer.writeType(SWFTypeTags.CONSTANT8).writeUIntLE(8, poolPosition);
					else 
						buffer.writeType(SWFTypeTags.CONSTANT16).writeUIntLE(16, poolPosition);
				}
				else
					buffer.writeType(SWFTypeTags.STRING_LITERAL).writeString(value);
				break;
				
			case "number":
				if(Number.isSafeInteger(value))
					buffer.writeType(SWFTypeTags.INTEGER).writeUIntLE(32, value);
				else
					buffer.writeType(SWFTypeTags.FLOAT_LITERAL).writeFloat(32, value);
				break;
				
			default:
				console.log("Unknown Push Value", this.index, value, (typeof value));
				break;
		}
		
		// Check Next for Push, Break
		if(this.index < this.code.opcodes.length - 1)
			if(this.code.opcodes[this.index + 1][0] != "PUSH")
				break;
			
		this.index++;
	}
	buffer.prependBuffer(new ByteWriter(8).writeAction(SWFActionTags.PUSH, buffer.length));
	
	this.tag.appendBuffer(buffer);
}