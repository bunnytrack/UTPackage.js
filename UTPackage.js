window.UTPackage = function(arrayBuffer) {
	/**
	 * Reference to parent class; used to access global variables (e.g. import/export tables)
	 */
	const self = this;

	this.dataView = new DataView(arrayBuffer);

	this.packageData = new Uint8Array(arrayBuffer);

	this.propertyTypes = [
		"Unknown",
		"Byte",
		"Integer",
		"Boolean",
		"Float",
		"Object",
		"Name",
		"String",
		"Class",
		"Array",
		"Struct",
		"Vector",
		"Rotator",
		"Str",
		"Map",
		"Fixed Array",
	];

	this.fileTypes = {
		u   : "System",
		uax : "Sound",
		umx : "Music",
		unr : "Map",
		utx : "Texture",
		uxx : "Cache",
	}

	this.defaultPackages = {
		// System
		"botpack"          : "u",
		"core"             : "u",
		"de"               : "u",
		"editor"           : "u",
		"engine"           : "u",
		"epiccustommodels" : "u",
		"fire"             : "u",
		"ipdrv"            : "u",
		"ipserver"         : "u",
		"multimesh"        : "u",
		"relics"           : "u",
		"relicsbindings"   : "u",
		"ubrowser"         : "u",
		"umenu"            : "u",
		"unreali"          : "u",
		"unrealshare"      : "u",
		"utbrowser"        : "u",
		"utmenu"           : "u",
		"utserveradmin"    : "u",
		"uweb"             : "u",
		"uwindow"          : "u",

		// Sounds
		"activates"    : "uax",
		"addon1"       : "uax",
		"ambancient"   : "uax",
		"ambcity"      : "uax",
		"ambmodern"    : "uax",
		"amboutside"   : "uax",
		"announcer"    : "uax",
		"bossvoice"    : "uax",
		"dday"         : "uax",
		"dmatch"       : "uax",
		"doorsanc"     : "uax",
		"doorsmod"     : "uax",
		"extro"        : "uax",
		"female1voice" : "uax",
		"female2voice" : "uax",
		"femalesounds" : "uax",
		"laddersounds" : "uax",
		"male1voice"   : "uax",
		"male2voice"   : "uax",
		"malesounds"   : "uax",
		"noxxsnd"      : "uax",
		"openingwave"  : "uax",
		"pan1"         : "uax",
		"rain"         : "uax",
		"tutvoiceas"   : "uax",
		"tutvoicectf"  : "uax",
		"tutvoicedm"   : "uax",
		"tutvoicedom"  : "uax",
		"vrikers"      : "uax",

		// Music
		"botmca9"  : "umx",
		"botpck10" : "umx",
		"cannon"   : "umx",
		"colossus" : "umx",
		"course"   : "umx",
		"credits"  : "umx",
		"ending"   : "umx",
		"enigma"   : "umx",
		"firebr"   : "umx",
		"foregone" : "umx",
		"godown"   : "umx",
		"lock"     : "umx",
		"mech8"    : "umx",
		"mission"  : "umx",
		"nether"   : "umx",
		"organic"  : "umx",
		"phantom"  : "umx",
		"razor-ub" : "umx",
		"run"      : "umx",
		"saveme"   : "umx",
		"savemeg"  : "umx",
		"seeker"   : "umx",
		"seeker2"  : "umx",
		"skyward"  : "umx",
		"strider"  : "umx",
		"suprfist" : "umx",
		"unworld2" : "umx",
		"utmenu23" : "umx",
		"uttitle"  : "umx",
		"wheels"   : "umx",

		// Maps
		"as-frigate"       : "unr",
		"as-guardia"       : "unr",
		"as-hispeed"       : "unr",
		"as-mazon"         : "unr",
		"as-oceanfloor"    : "unr",
		"as-overlord"      : "unr",
		"as-rook"          : "unr",
		"as-tutorial"      : "unr",
		"cityintro"        : "unr",
		"ctf-command"      : "unr",
		"ctf-coret"        : "unr",
		"ctf-cybrosis]["   : "unr",
		"ctf-darji16"      : "unr",
		"ctf-dreary"       : "unr",
		"ctf-eternalcave"  : "unr",
		"ctf-face"         : "unr",
		"ctf-face]["       : "unr",
		"ctf-gauntlet"     : "unr",
		"ctf-hallofgiants" : "unr",
		"ctf-high"         : "unr",
		"ctf-hydro16"      : "unr",
		"ctf-kosov"        : "unr",
		"ctf-lavagiant"    : "unr",
		"ctf-niven"        : "unr",
		"ctf-november"     : "unr",
		"ctf-noxion16"     : "unr",
		"ctf-nucleus"      : "unr",
		"ctf-orbital"      : "unr",
		"ctf-tutorial"     : "unr",
		"dm-agony"         : "unr",
		"dm-arcanetemple"  : "unr",
		"dm-barricade"     : "unr",
		"dm-codex"         : "unr",
		"dm-conveyor"      : "unr",
		"dm-crane"         : "unr",
		"dm-curse]["       : "unr",
		"dm-cybrosis]["    : "unr",
		"dm-deck16]["      : "unr",
		"dm-fetid"         : "unr",
		"dm-fractal"       : "unr",
		"dm-gothic"        : "unr",
		"dm-grinder"       : "unr",
		"dm-healpod]["     : "unr",
		"dm-hyperblast"    : "unr",
		"dm-kgalleon"      : "unr",
		"dm-liandri"       : "unr",
		"dm-malevolence"   : "unr",
		"dm-mojo]["        : "unr",
		"dm-morbias]["     : "unr",
		"dm-morpheus"      : "unr",
		"dm-oblivion"      : "unr",
		"dm-peak"          : "unr",
		"dm-phobos"        : "unr",
		"dm-pressure"      : "unr",
		"dm-shrapnel]["    : "unr",
		"dm-spacenoxx"     : "unr",
		"dm-stalwart"      : "unr",
		"dm-stalwartxl"    : "unr",
		"dm-tempest"       : "unr",
		"dm-turbine"       : "unr",
		"dm-tutorial"      : "unr",
		"dm-zeto"          : "unr",
		"dom-cinder"       : "unr",
		"dom-condemned"    : "unr",
		"dom-cryptic"      : "unr",
		"dom-gearbolt"     : "unr",
		"dom-ghardhen"     : "unr",
		"dom-lament"       : "unr",
		"dom-leadworks"    : "unr",
		"dom-metaldream"   : "unr",
		"dom-olden"        : "unr",
		"dom-sesmar"       : "unr",
		"dom-tutorial"     : "unr",
		"entry"            : "unr",
		"eol_assault"      : "unr",
		"eol_challenge"    : "unr",
		"eol_ctf"          : "unr",
		"eol_deathmatch"   : "unr",
		"eol_domination"   : "unr",
		"eol_statues"      : "unr",
		"utcredits"        : "unr",

		// Textures
		"alfafx"         : "utx",
		"ancient"        : "utx",
		"arenatex"       : "utx",
		"belt_fx"        : "utx",
		"blufffx"        : "utx",
		"bossskins"      : "utx",
		"castle1"        : "utx",
		"chizraefx"      : "utx",
		"city"           : "utx",
		"commandoskins"  : "utx",
		"coret_fx"       : "utx",
		"creative"       : "utx",
		"credits"        : "utx",
		"crypt"          : "utx",
		"crypt2"         : "utx",
		"crypt_fx"       : "utx",
		"ctf"            : "utx",
		"dacomafem"      : "utx",
		"dacomaskins"    : "utx",
		"ddayfx"         : "utx",
		"decayeds"       : "utx",
		"detail"         : "utx",
		"dmeffects"      : "utx",
		"egypt"          : "utx",
		"egyptpan"       : "utx",
		"eol"            : "utx",
		"faces"          : "utx",
		"fcommandoskins" : "utx",
		"female1skins"   : "utx",
		"female2skins"   : "utx",
		"fireeng"        : "utx",
		"flarefx"        : "utx",
		"fractalfx"      : "utx",
		"genearth"       : "utx",
		"genfluid"       : "utx",
		"genfx"          : "utx",
		"genin"          : "utx",
		"genterra"       : "utx",
		"genwarp"        : "utx",
		"gothfem"        : "utx",
		"gothskins"      : "utx",
		"greatfire"      : "utx",
		"greatfire2"     : "utx",
		"hubeffects"     : "utx",
		"indus1"         : "utx",
		"indus2"         : "utx",
		"indus3"         : "utx",
		"indus4"         : "utx",
		"indus5"         : "utx",
		"indus6"         : "utx",
		"indus7"         : "utx",
		"isvfx"          : "utx",
		"jwsky"          : "utx",
		"ladderfonts"    : "utx",
		"ladrarrow"      : "utx",
		"ladrstatic"     : "utx",
		"lavafx"         : "utx",
		"lian-x"         : "utx",
		"liquids"        : "utx",
		"male1skins"     : "utx",
		"male2skins"     : "utx",
		"male3skins"     : "utx",
		"menugr"         : "utx",
		"metalmys"       : "utx",
		"mine"           : "utx",
		"nalicast"       : "utx",
		"nalifx"         : "utx",
		"nivenfx"        : "utx",
		"noxxpack"       : "utx",
		"of1"            : "utx",
		"old_fx"         : "utx",
		"palettes"       : "utx",
		"phraelfx"       : "utx",
		"playrshp"       : "utx",
		"queen"          : "utx",
		"rainfx"         : "utx",
		"render"         : "utx",
		"rotatingu"      : "utx",
		"scripted"       : "utx",
		"sgirlskins"     : "utx",
		"shanechurch"    : "utx",
		"shaneday"       : "utx",
		"shanesky"       : "utx",
		"skaarj"         : "utx",
		"sktrooperskins" : "utx",
		"skybox"         : "utx",
		"skycity"        : "utx",
		"slums"          : "utx",
		"soldierskins"   : "utx",
		"spacefx"        : "utx",
		"starship"       : "utx",
		"tcowmeshskins"  : "utx",
		"tcrystal"       : "utx",
		"terranius"      : "utx",
		"tnalimeshskins" : "utx",
		"trenchesfx"     : "utx",
		"tskmskins"      : "utx",
		"ut"             : "utx",
		"ut_artfx"       : "utx",
		"utbase1"        : "utx",
		"utcrypt"        : "utx",
		"uttech1"        : "utx",
		"uttech2"        : "utx",
		"uttech3"        : "utx",
		"uwindowfonts"   : "utx",
		"xbpfx"          : "utx",
		"xfx"            : "utx",
		"xtortion"       : "utx",
		"xutfx"          : "utx",
	}

	this.polyFlags = {
		"Invisible"        : 0x00000001,
		"Masked"           : 0x00000002,
		"Translucent"      : 0x00000004,
		"NotSolid"         : 0x00000008,
		"Environment"      : 0x00000010,
		"ForceViewZone"    : 0x00000010,
		"Semisolid"        : 0x00000020,
		"Modulated"        : 0x00000040,
		"FakeBackdrop"     : 0x00000080,
		"TwoSided"         : 0x00000100,
		"AutoUPan"         : 0x00000200,
		"AutoVPan"         : 0x00000400,
		"NoSmooth"         : 0x00000800,
		"BigWavy"          : 0x00001000,
		"SpecialPoly"      : 0x00001000,
		"SmallWavy"        : 0x00002000,
		"Flat"             : 0x00004000,
		"LowShadowDetail"  : 0x00008000,
		"NoMerge"          : 0x00010000,
		"CloudWavy"        : 0x00020000,
		"DirtyShadows"     : 0x00040000,
		"BrightCorners"    : 0x00080000,
		"SpecialLit"       : 0x00100000,
		"Gouraud"          : 0x00200000,
		"NoBoundRejection" : 0x00200000,
		"Unlit"            : 0x00400000,
		"HighShadowDetail" : 0x00800000,
		"Portal"           : 0x04000000,
		"Mirrored"         : 0x08000000
	}

	this.index = function(dataArray, offset = 0) {
		let l = 5;
		let output = dataArray[offset];

		// Get index size
		if ((output & 0x40) === 0) {
			l = 1;
		} else {
			for (let i = 1; i < 4; i++) {
				if ((dataArray[offset + i] & 0x80) === 0) {
					l = i + 1;
					break;
				}
			}
		}

		// Calculate index
		const signed = (output & 0x80) === 0x80;

		output &= 0x3F;

		for (let i = 1; i < Math.min(l, 4); i++) {
			output |= (dataArray[offset + i] & 0x7F) << (6 + ((i - 1) * 7));
		}

		if (l === 5) {
			output |= (dataArray[offset + 4] & 0x1F) << 27;
		}

		return {
			value  : signed ? -1 * output : output,
			length : l
		}
	}

	this.word = function(dataArray, offset = 0) {
		return ((dataArray[offset + 1] << 8) + dataArray[offset]);
	}

	this.dword = function(dataArray, offset = 0) {
		return ((dataArray[offset + 3] << 24)
			  + (dataArray[offset + 2] << 16)
			  + (dataArray[offset + 1] << 8)
			  +  dataArray[offset]);
	}

	this.qword = function(dataArray, offset = 0) {
		return ((dataArray[offset + 7] << 56)
			+   (dataArray[offset + 6] << 48)
			+   (dataArray[offset + 5] << 40)
			+   (dataArray[offset + 4] << 32)
			+   (dataArray[offset + 3] << 24)
			+   (dataArray[offset + 2] << 16)
			+   (dataArray[offset + 1] << 8)
			+    dataArray[offset]);
	}

	this.float32 = function(dword) {
		return ((dword & ((0x01 << 23) - 0x01)) + (0x01 << 23) * (dword >> 31 | 0x01)) * Math.pow(2, ((dword >> 23 & 0xFF) - 127) - 23);
	}

	this.getHeader = function() {
		const header = {
			signature       : self.dataView.getUint32(0,  true).toString(16).toUpperCase(),
			version         : self.dataView.getUint32(4,  true),
			package_flags   : self.dataView.getUint32(8,  true),
			name_count      : self.dataView.getUint32(12, true),
			name_offset     : self.dataView.getUint32(16, true),
			export_count    : self.dataView.getUint32(20, true),
			export_offset   : self.dataView.getUint32(24, true),
			import_count    : self.dataView.getUint32(28, true),
			import_offset   : self.dataView.getUint32(32, true),
		}

		if (header.version < 68) {
			header.heritage_count  = self.dataView.getUint32(36, true);
			header.heritage_offset = self.dataView.getUint32(40, true);
		} else {
			header.guid = (self.dataView.getUint32(36, true).toString(16)
				+ self.dataView.getUint32(40, true).toString(16)
				+ self.dataView.getUint32(44, true).toString(16)
				+ self.dataView.getUint32(48, true).toString(16)).toUpperCase();
			header.generation_count = self.dataView.getUint32(52, true);
			header.generations = [];

			for (let offset = 56; header.generations.length < header.generation_count; offset += 4) {
				header.generations.push({
					export_count : self.dataView.getUint32(offset, true),
					name_count   : self.dataView.getUint32(offset + 4, true),
				})
			}
		}

		return header;
	}

	this.getNameTable = function() {
		const nameTable = [];

		const count = self.header.name_count;
		let offset  = self.header.name_offset;

		let currentName = "";

		while (offset < self.dataView.byteLength) {
			if (self.version < 68) {
				const byte = self.dataView.getUint8(offset);

				// Interpret byte as string until the next 0 byte is found
				if (byte !== 0) {
					currentName += String.fromCharCode(byte);
					offset++;
				} else {
					nameTable.push(currentName);

					// All names found in table
					if (nameTable.length === count) break;

					currentName = "";
					offset += 5;
				}
			} else {
				// First byte is the name length, so use this then adjust the offset past the object flags
				const nameLength = self.dataView.getUint8(offset);
				let name = "";

				for (let i = 0; i < nameLength - 1; i++) {
					name += String.fromCharCode(self.dataView.getUint8(++offset));
				}

				nameTable.push(name);

				if (nameTable.length === count) break;

				offset += 6;
			}
		}

		return nameTable;
	}

	this.getExportTable = function() {
		const exportTable = [];
		const exportData  = [];

		const exportCount = self.header.export_count;
		let offset = self.header.export_offset;

		// Push export table bytes into array for processing
		for (let i = 0; i < exportCount * 33; i++) {
			if (offset >= self.dataView.byteLength) break;

			exportData.push(self.dataView.getUint8(offset));
			offset++;
		}

		// Iterate through export table data for each entry
		let lastMainIndex = 0;

		for (let i = 0; i < exportCount; i++) {
			const entry = {};

			const classIndex = self.index(exportData, lastMainIndex);
			lastMainIndex += classIndex.length;

			const superIndex = self.index(exportData, lastMainIndex);
			lastMainIndex += superIndex.length;

			const packageIndex = self.dword(exportData, lastMainIndex);
			lastMainIndex += 4;

			const objectNameIndex = self.index(exportData, lastMainIndex);
			lastMainIndex += objectNameIndex.length;

			const objectFlags = self.dword(exportData, lastMainIndex);
			lastMainIndex += 4;

			const serialSize = self.index(exportData, lastMainIndex, true);
			lastMainIndex += serialSize.length;

			// Assign this export table entry's values
			entry.class_index       = classIndex.value;
			entry.super_index       = superIndex.value;
			entry.package_index     = packageIndex;
			entry.object_name_index = objectNameIndex.value;
			entry.object_flags      = objectFlags;
			entry.serial_size       = serialSize.value;

			if (serialSize.value > 0) {
				const serialOffset = self.index(exportData, lastMainIndex);
				lastMainIndex += serialOffset.length;

				entry.serial_offset = serialOffset.value;
			}

			exportTable.push(entry);
		}

		return exportTable;
	}

	this.getImportTable = function() {
		const importTable = [];

		let offset = self.header.import_offset;

		for (let i = 0; i < self.header.import_count; i++) {
			const entry = {};

			const classPackageIndex = self.index(self.packageData, offset);
			offset += classPackageIndex.length;

			const classNameIndex = self.index(self.packageData, offset);
			offset += classNameIndex.length;

			const packageIndex = self.dword(self.packageData, offset);
			offset += 4;

			const objectNameIndex = self.index(self.packageData, offset);
			offset += objectNameIndex.length;

			// Assign this import table entry's values
			entry.class_package_index = classPackageIndex.value;
			entry.class_name_index    = classNameIndex.value;
			entry.package_index       = packageIndex;
			entry.object_name_index   = objectNameIndex.value;

			importTable.push(entry);
		}

		return importTable;
	}

	this.getObjectProperties = function(object, flags = 0x00000000) {
		const properties = [];

		let offset = object.serial_offset;

		// Check other flags first (such as state blocks)
		if ((flags & 0x02000000) === 0x02000000) {
			const stateFrameNode = self.index(self.packageData, offset);
			offset += stateFrameNode.length;

			const stateFrameStateNode = self.index(self.packageData, offset);
			offset += stateFrameStateNode.length;

			const stateFrameProbeMask = self.qword(self.packageData, offset);
			offset += 8;

			const stateFrameLatentAction = self.dword(self.packageData, offset);
			offset += 4;

			if (stateFrameNode.value !== 0) {
				offset += self.index(self.packageData, offset).length;
			}
		}

		let currentProp = self.index(self.packageData, offset);
		let currentPropName = self.nameTable[currentProp.value];

		// First byte of property block is a name table index
		while (currentPropName.toLowerCase() !== "none") {
			const prop = {};

			// Next byte contains property info (type, size, etc.)
			offset += currentProp.length;

			let propInfoByte = self.packageData[offset];
			offset++;

			prop.name = self.nameTable[currentProp.value];
			prop.type = self.propertyTypes[propInfoByte & 0x0F];

			// If the property type is a struct then the struct name follows
			if (prop.type === "Struct") {
				const subType = self.index(self.packageData, offset);

				prop.subtype = self.nameTable[subType.value];

				offset += subType.length;
			}

			/**
			 * The size value is interpreted in the following way:
			 *   0 = 1 byte
			 *   1 = 2 bytes
			 *   2 = 4 bytes
			 *   3 = 12 bytes
			 *   4 = 16 bytes
			 *   5 = a byte follows with real size
			 *   6 = a word follows with real size
			 *   7 = an integer follows with real size
			 */
			const propSizeInfo = (propInfoByte >> 4) & 0x07;

			switch (propSizeInfo) {
				case 0: prop.length = 1;  break;
				case 1: prop.length = 2;  break;
				case 2: prop.length = 4;  break;
				case 3: prop.length = 12; break;
				case 4: prop.length = 16; break;

				case 5:
					prop.length = self.packageData[offset];
					offset += 1;
				break;

				case 6:
					prop.length = self.word(self.packageData, offset);
					offset += 2;
				break;

				case 7:
					prop.length = self.dword(self.packageData, offset);
					offset += 4;
				break;

				default:
					prop.length = 1;
				break;
			}

			// Property special flags
			const arrayFlag = !!(propInfoByte >> 7);

			if (prop.type !== "Boolean" && arrayFlag) {
				let prevProp, arrayIndex;

				if (properties.length > 0) {
					prevProp = properties[properties.length - 1];

					if (prevProp.name === prop.name && prevProp.subtype === undefined) {
						prevProp.subtype = "Array";
						prevProp.index   = 0;
					}

					properties[properties.length - 1] = prevProp;
				}

				if (prevProp && prevProp.index !== undefined) {
					if (prevProp.index >= 16383) {
						arrayIndex = self.dword(self.packageData, offset) & 0x3FFFFFFF;
						offset += 4;
					} else if (prevProp.index >= 127) {
						arrayIndex = self.word(self.packageData, offset) & 0x7FFF;
						offset += 2;
					} else {
						arrayIndex = self.packageData[offset];
						offset++;
					}
				} else {
					arrayIndex = self.packageData[offset];
					offset++;
				}

				prop.aggtype = "Array";
				prop.index   = arrayIndex;
			}

			// Assign property value
			switch (prop.type) {
				case "Byte":
					prop.value = self.packageData[offset];
					offset += prop.length;
				break;

				case "Integer":
					prop.value = self.dword(self.packageData, offset);

					if (prop.value > 0x7FFFFFFF) {
						prop.value -= 0x100000000;
					}

					offset += prop.length;
				break;

				case "Boolean":
					prop.value = arrayFlag;
				break;

				case "Float":
					prop.value = self.float32(self.dword(self.packageData, offset));
					offset += prop.length;
				break;

				case "Object":
					prop.value = self.index(self.packageData, offset).value;
					offset += prop.length;
				break;

				case "Name":
					const nameProp = self.index(self.packageData, offset);
					prop.value = self.nameTable[nameProp.value];
					offset += nameProp.length;
				break;

				// Handled later
				case "Class":
				break;

				case "Struct":
					switch (prop.subtype.toLowerCase()) {
						case "color":
							const r = self.packageData[offset];
							offset++;

							const g = self.packageData[offset];
							offset++;

							const b = self.packageData[offset];
							offset++;

							const a = self.packageData[offset];
							offset++;

							prop.value = {
								r : r,
								g : g,
								b : b,
								a : a,
							}
						break;

						case "vector":
							const vectorX = self.dataView.getFloat32(offset, true);
							offset += 4;

							const vectorY = self.dataView.getFloat32(offset, true);
							offset += 4;

							const vectorZ = self.dataView.getFloat32(offset, true);
							offset += 4;

							prop.value = {
								x : vectorX,
								y : vectorY,
								z : vectorZ,
							}
						break;

						case "rotator":
							const pitch = self.dword(self.packageData, offset);
							offset += 4;

							const yaw = self.dword(self.packageData, offset);
							offset += 4;

							const roll = self.dword(self.packageData, offset);
							offset += 4;

							prop.value = {
								pitch : pitch,
								yaw   : yaw,
								roll  : roll,
							}
						break;

						case "scale":
							const scaleX = self.float32(self.dword(self.packageData, offset));
							offset += 4;

							const scaleY = self.float32(self.dword(self.packageData, offset));
							offset += 4;

							const scaleZ = self.float32(self.dword(self.packageData, offset));
							offset += 4;

							const sheerRate = self.dword(self.packageData, offset);
							offset += 4;

							const sheerAxis = self.packageData[offset];
							offset++;

							prop.value = {
								x          : scaleX,
								y          : scaleY,
								z          : scaleZ,
								sheer_rate : sheerRate,
								sheer_axis : sheerAxis,
							}
						break;

						case "pointregion":
							const zone = self.index(self.packageData, offset);
							offset += zone.length;

							const iLeaf = self.dword(self.packageData, offset);
							offset += 4;

							const zoneNumber = self.packageData[offset];
							offset += 1;

							prop.value = {
								zone        : zone.value,
								i_leaf      : iLeaf,
								zone_number : zoneNumber,
							}
						break;

						default:
							offset += prop.length;
						break;
					}
				break;

				case "Str":
					const strLength = self.index(self.packageData, offset);
					offset += strLength.length;

					prop.value = "";

					for (let i = 0; i < strLength.value - 1; i++) {
						prop.value += String.fromCharCode(self.packageData[offset++]);
					}

					offset++;
				break;

				// Unknown
				case "String":
				case "Array":
				case "Vector":
				case "Rotator":
				case "Map":
				case "Fixed Array":
				default:
					offset += prop.length;
				break;
			}

			properties.push(prop);

			currentProp = self.index(self.packageData, offset);
			currentPropName = self.nameTable[currentProp.value];
		}

		return {
			props  : properties,
			offset : offset + 1,
		}
	}

	this.getObject = function(index) {
		if (index === 0) {
			return null;
		}

		if (index < 0) {
			return {
				table  : "import",
				object : self.importTable[~index],
			}
		}

		return {
			table  : "export",
			object : self.exportTable[index - 1],
		}
	}

	this.getObjectByName = function(objectName) {
		for (const object of self.exportTable) {
			if (self.nameTable[object.object_name_index] === objectName) {
				return object;
			}
		}

		return null;
	}

	this.getObjectPropertiesFromName = function(objectName) {
		const object = self.getObjectByName(objectName);

		if (object) {
			return self.getObjectProperties(object, object.object_flags);
		}

		return {};
	}

	this.getObjectsByType = function(objectType) {
		const objects = [];

		for (const entry of self.exportTable) {
			const objectInfo = self.getObject(entry.class_index);

			if (objectInfo !== null && self.nameTable[objectInfo.object.object_name_index] === objectType) {
				objects.push(entry);
			}
		}

		return objects;
	}

	this.getTextureObjects = function() {
		return self.getObjectsByType("Texture");
	}

	this.getSoundObjects = function() {
		return self.getObjectsByType("Sound");
	}

	this.getMusicObjects = function() {
		return self.getObjectsByType("Music");
	}

	this.getTextBufferObjects = function() {
		return self.getObjectsByType("TextBuffer");
	}

	this.getTextBufferData = function(textBufferObject) {
		const textBuffer = {};

		const properties = self.getObjectProperties(textBufferObject);

		let offset = properties.offset;

		const pos = self.dword(self.packageData, offset);
		offset += 4;

		const top = self.dword(self.packageData, offset);
		offset += 4;

		const textSize = self.index(self.packageData, offset);
		offset += textSize.length;

		textBuffer.name = self.nameTable[textBufferObject.object_name_index];
		textBuffer.pos  = pos;
		textBuffer.top  = top;
		textBuffer.size = textSize.value;

		if (textSize.value > 0) {
			const decoder  = new TextDecoder();
			const textData = new Uint8Array(arrayBuffer.slice(offset, offset + textSize.value - 1));

			textBuffer.contents = decoder.decode(textData);
		}

		if (textBufferObject.package_index !== 0) {
			textBuffer.package = self.getParentPackageName(textBufferObject);
		}

		return textBuffer;
	}

	this.getTextureInfo = function(textureObject) {
		const objectInfo = self.getObject(textureObject.package_index);

		return {
			name  : self.nameTable[textureObject.object_name_index],
			group : objectInfo ? self.nameTable[objectInfo.object.object_name_index] : null,
		}
	}

	this.getTexturesGrouped = function() {
		const grouped   = {};
		const ungrouped = [];
		let total = 0;

		for (const textureObject of self.getTextureObjects()) {
			const textureInfo = self.getTextureInfo(textureObject);

			if (textureInfo.group) {
				if (typeof grouped[textureInfo.group] === "array") {
					grouped[textureInfo.group].push(textureInfo.name);
				} else {
					grouped[textureInfo.group] = [textureInfo.name];
				}
			} else {
				ungrouped.push(textureInfo.name);
			}

			total++;
		}

		return {
			grouped   : grouped,
			ungrouped : ungrouped,
			length    : total
		}
	}

	this.getParentPackageName = function(object) {
		const parentPackage = self.getObject(object.package_index).object;
		return self.nameTable[parentPackage.object_name_index];
	}

	/*this.getMusicInfo = function(musicObject) {
		const musicInfo = {};

		let offset = musicObject.serial_offset;

		const chunkCount = self.word(self.packageData, offset);
		offset += 2;

		console.log("chunkCount", chunkCount);

		if (self.version > 61) {
			const chunkSizeOffset = self.dword(self.packageData, offset);
			offset == chunkSizeOffset;

			console.log("chunkSizeOffset", chunkSizeOffset);
		}

		const chunkSize = self.index(self.packageData, offset);
		offset += chunkSize.length;

		console.log("chunkSize", chunkSize);

		return musicInfo;
	}*/

	this.getSounds = function() {
		const sounds       = [];
		const soundObjects = self.getSoundObjects();

		for (const soundObject of soundObjects) {
			const sound = {};

			sound.name = self.nameTable[soundObject.object_name_index];

			// Attempt to get this sound's package name
			if (soundObject.package_index !== 0) {
				sound.package = self.getParentPackageName(soundObject);
			}

			const properties = self.getObjectProperties(soundObject, soundObject.object_flags);

			let offset = properties.offset;

			const format = self.index(self.packageData, offset);
			offset += format.length;

			if (self.version >= 63) {
				const nextObjectOffset = self.dword(self.packageData, offset);
				offset += 4;

				sound.next_object_offset = nextObjectOffset;
			}

			const size = self.index(self.packageData, offset);
			offset += size.length;

			sound.properties   = properties.props;
			sound.format       = self.nameTable[format.value];
			sound.audio_offset = offset;
			sound.audio_size   = size.value;

			sounds.push(sound);
		}

		return sounds;
	}

	this.getSoundData = function(audioOffset, audioSize) {
		return new Uint8Array(arrayBuffer.slice(audioOffset, audioOffset + audioSize));
	}

	this.getLightHsl = function(lightObject) {
		// Default UT values: 0, 255, 64
		const hsl = {
			h : 0,
			s : 100,
			l : 25
		}

		const properties = self.getObjectProperties(lightObject, lightObject.object_flags);

		for (const prop of properties.props) {
			switch (prop.name.toLowerCase()) {
				// Degree in colour wheel
				case "lighthue":
					hsl.h = Math.round(prop.value / 256 * 360);
				break;

				// UT saturation is opposite of HSL, i.e. 0% = full colour
				case "lightsaturation":
					hsl.s = 100 - Math.round(prop.value / 256 * 100);
				break;

				case "volumebrightness":
					hsl.l = Math.round(prop.value / 256 * 100);
				break;

				default:
				break;
			}
		}

		return hsl;
	}

	this.getPolyInfo = function(polyObject) {
		const polyInfo = [];
		const properties = self.getObjectProperties(polyObject, polyObject.object_flags);

		let offset = properties.offset;

		const polyCount = self.dataView.getUint32(offset, true);
		offset += 4;

		// why is this dword repeated?
		offset += 4;

		const polyProperties = [
			"origin",
			"normal",
			"texture_u",
			"texture_v",
		];

		for (let i = 0; i < polyCount; i++) {
			const poly = {};

			const vertexCount = self.dataView.getUint8(offset);
			offset++;

			// Get poly properties first, then [vertexCount] vertices thereafter
			for (const prop of polyProperties) {
				poly[prop] = {};

				poly[prop].x = self.dataView.getFloat32(offset, true);
				offset += 4;

				poly[prop].y = self.dataView.getFloat32(offset, true);
				offset += 4;

				poly[prop].z = self.dataView.getFloat32(offset, true);
				offset += 4;
			}

			// Get vertices
			poly.vertices = [];

			for (let i = 0; i < vertexCount; i++) {
				const vertex_x = self.dataView.getFloat32(offset, true);
				offset += 4;

				const vertex_y = self.dataView.getFloat32(offset, true);
				offset += 4;

				const vertex_z = self.dataView.getFloat32(offset, true);
				offset += 4;

				poly.vertices.push({
					x: vertex_x,
					y: vertex_y,
					z: vertex_z,
				})
			}

			// Get poly "attributes"
			const flags = self.dataView.getUint32(offset, true);
			poly.flags = self.getPolyFlags(flags);
			offset += 4;

			const polyActor = self.index(self.packageData, offset);
			poly.actor = polyActor.value;
			offset += polyActor.length;

			const polyTexture = self.index(self.packageData, offset);
			const polyTextureObject = self.getObject(polyTexture.value);

			if (polyTextureObject) {
				poly.texture = package.nameTable[polyTextureObject.object.object_name_index];
			}

			offset += polyTexture.length;

			const polyItemName = self.index(self.packageData, offset);
			poly.item_name = package.nameTable[polyItemName.value];
			offset += polyItemName.length;

			const polyLink = self.index(self.packageData, offset);
			poly.link = polyLink.value;
			offset += polyLink.length;

			const brushPoly = self.index(self.packageData, offset);
			poly.brush_poly = brushPoly.value;
			offset += brushPoly.length;

			let panU = self.word(self.packageData, offset);

			if (panU > 0x8000) panU |= 0xFFFF0000;

			poly.pan_u = panU;
			offset += 2;

			let panV = self.word(self.packageData, offset);

			if (panV > 0x8000) panV |= 0xFFFF0000;

			poly.pan_v = panV;
			offset += 2;

			polyInfo.push(poly);
		}

		return polyInfo;
	}

	this.getPolyFlags = function(flags) {
		const polyFlags = [];

		for (const flagName in self.polyFlags) {
			const flagVal = self.polyFlags[flagName];

			if (flagVal > flags) break;

			if ((flags & flagVal) !== 0) {
				polyFlags.push(flagName);
			}
		}

		return polyFlags;
	}

	this.getPaletteData = function(paletteObject) {
		// Get palette properties to find out where the actual data begins
		const paletteProperties = self.getObjectProperties(paletteObject);

		// Adjust offset taking into account property length
		let offset = paletteProperties.offset;

		// First byte of palette contains total colours. Each byte afterwards are RGBA values.
		const paletteSize = self.index(self.packageData, offset);
		offset += paletteSize.length;

		const colourData = [];

		for (let i = 0; i < paletteSize.value; i++) {
			colourData.push({
				r : self.packageData[offset++],
				g : self.packageData[offset++],
				b : self.packageData[offset++],
				a : self.packageData[offset++],
			})
		}

		return {
			colours : colourData,
			length  : paletteSize.value,
		}
	}

	this.getPaletteObjectFromTexture = function(textureObject) {
		const textureProperties = self.getObjectProperties(textureObject, textureObject.object_flags);

		for (const prop of textureProperties.props) {
			if (prop.name.toLowerCase() === "palette") {
				return self.getObject(prop.value);
			}
		}

		return null;
	}

	this.getPaletteCanvas = function(textureObject, callback) {
		const paletteObject = self.getPaletteObjectFromTexture(textureObject);
		const paletteData   = self.getPaletteData(paletteObject.object);

		const canvas  = document.createElement("canvas");
		const context = canvas.getContext("2d");

		canvas.width  = 16;
		canvas.height = 16;

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		createImageBitmap(imageData).then(function(imageBitmap) {
			let i = 0;

			for (const pixel of paletteData.colours) {
				imageData.data[i++] = pixel.r;
				imageData.data[i++] = pixel.g;
				imageData.data[i++] = pixel.b;
				imageData.data[i++] = pixel.a;
			}

			context.putImageData(imageData, 0, 0);

			callback(canvas, paletteData);
		})

		return paletteData;
	}

	this.getTextureData = function(textureObject) {
		const textureProperties = self.getObjectProperties(textureObject, textureObject.object_flags);

		// Find this texture's palette object
		const paletteObject = self.getPaletteObjectFromTexture(textureObject);

		// Get palette colour data
		const paletteData = self.getPaletteData(paletteObject.object);

		// Texture data begins after the properties; use the offset returned from getObjectProperties()
		let offset = textureProperties.offset;

		// First byte is mipmap count
		const mipMapCount = self.packageData[offset++];

		const textureData = {};

		for (let i = 0; i < mipMapCount; i++) {
			if (self.header.version >= 63) {
				const widthOffset = self.dword(self.packageData, offset);
				offset += 4;
			}

			const mipMapSize = self.index(self.packageData, offset);
			offset += mipMapSize.length;

			// Mip map data array - one byte = one pixel
			const mipMapData = new Uint8Array(arrayBuffer.slice(offset, offset + mipMapSize.value));
			offset += mipMapSize.value;

			const textureWidth  = self.dword(self.packageData, offset);
			offset += 4;

			const textureHeight = self.dword(self.packageData, offset);
			offset += 4;

			textureData.palette        = paletteData;
			textureData.mip_map_count  = mipMapCount;
			textureData.mip_map_size   = mipMapSize;
			textureData.texture_width  = textureWidth;
			textureData.texture_height = textureHeight;
			textureData.mip_map_data   = mipMapData;

			// to-do: handle compressed mip maps
			break;
		}

		return textureData;
	}

	this.textureToCanvas = function(textureObject, callback) {
		const canvas  = document.createElement("canvas");
		const context = canvas.getContext("2d");

		const textureData = self.getTextureData(textureObject);

		canvas.width  = textureData.texture_width;
		canvas.height = textureData.texture_height;

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		createImageBitmap(imageData).then(function(imageBitmap) {
			let i = 0;

			for (const pixel of textureData.mip_map_data) {
				const colour = textureData.palette.colours[pixel];

				imageData.data[i++] = colour.r;
				imageData.data[i++] = colour.g;
				imageData.data[i++] = colour.b;
				imageData.data[i++] = colour.a;
			}

			context.putImageData(imageData, 0, 0);

			callback(canvas, imageBitmap);
		})
	}

	this.getScreenshot = function(callback) {
		const screenshotObject = self.getObjectByName("Screenshot");

		let screenshotFound = false;

		if (screenshotObject) {
			self.textureToCanvas(screenshotObject, callback);
			screenshotFound = true;
		} else {
			// Officially, the map screenshot should be named "Screenshot"; however, it's possible to set this value
			// to a different texture. It won't appear in-game, but is still saved in the LevelSummary actor.
			const levelInfoObject = self.getObjectByName("LevelInfo0");

			if (levelInfoObject) {
				const levelInfoProps = self.getObjectProperties(levelInfoObject, levelInfoObject.object_flags);

				for (const prop of levelInfoProps.props) {
					if (prop.name === "Screenshot") {
						self.textureToCanvas(self.getObject(prop.value).object, callback);
						screenshotFound = true;
						break;
					}
				}
			}
		}

		if (!screenshotFound) {
			callback(null);
		}
	}

	this.getLevelSummary = function(allProperties = false) {
		const levelSummary    = {};
		const levelInfoObject = self.getObjectByName("LevelInfo0");

		if (levelInfoObject) {
			const properties = self.getObjectProperties(levelInfoObject, levelInfoObject.object_flags);

			// If allProperties == false, only include these
			const meaningfulProperties = ["Author", "IdealPlayerCount", "LevelEnterText", "Screenshot", "Song", "Title"];

			// Lookup these properties in the name table
			const tableLookup = ["Song", "DefaultGameType", "Summary", "NavigationPointList", "Level"];

			for (const prop of properties.props) {
				if (allProperties || meaningfulProperties.includes(prop.name)) {
					if (tableLookup.includes(prop.name)) {
						levelSummary[prop.name] = self.nameTable[self.getObject(prop.value).object.object_name_index];
					} else {
						levelSummary[prop.name] = prop.value;
					}
				}
			}

			levelSummary["Screenshot"] = Object.keys(levelSummary).includes("Screenshot");
		}

		return levelSummary;
	}

	this.getDependencies = function() {
		const dependencies = [];

		// Check dependencies against the file's "Song" name (if it's a map).
		const levelMusic = self.getLevelSummary()["Song"];

		for (const entry of self.importTable) {
			if (self.nameTable[entry.class_name_index] === "Package" && entry.package_index === 0) {
				const dependency = {
					name: self.nameTable[entry.object_name_index]
				}

				const fileExt   = self.defaultPackages[dependency.name.toLowerCase()];
				const isDefault = !!fileExt;

				if (isDefault) {
					dependency.ext  = fileExt;
					dependency.type = self.fileTypes[dependency.ext];
				} else if (dependency.name === levelMusic) {
					dependency.ext  = "umx";
					dependency.type = self.fileTypes[dependency.ext];
				}

				dependency.default = isDefault;

				dependencies.push(dependency);
			}
		}

		return dependencies;
	}

	this.getDependenciesFiltered = function(ignoreCore = true) {
		const ignore = ["botpack", "core", "engine", "unreali", "unrealshare", "uwindow"];
		const dependencies = {
			length   : 0,
			packages : {
				default : [],
				custom  : [],
			}
		}

		for (const dep of self.getDependencies()) {
			if (dep.default) {
				if (ignoreCore && ignore.includes(dep.name.toLowerCase())) continue;

				dependencies.packages.default.push(dep);
			} else {
				dependencies.packages.custom.push(dep);
			}

			dependencies.length++;
		}

		return dependencies;
	}

	// Assign these at runtime as they're referenced in many functions.
	this.header      = this.getHeader();
	this.version     = this.header.version;
	this.nameTable   = this.getNameTable();
	this.exportTable = this.getExportTable();
	this.importTable = this.getImportTable();
}
