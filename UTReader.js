window.UTReader = function(arrayBuffer) {
	/**
	 * Globally accessible DataView object of this file
	 */
	this.dataView = new DataView(arrayBuffer);

	/**
	 * Reference to UTReader object; used to access global variables and functions
	 */
	const reader = this;

	/**
	 * UT file signatures
	 */
	const SIGNATURE_UT   = 0x9E2A83C1;
	const SIGNATURE_UMOD = 0x9FE3C5A3;
	const SIGNATURE_UZ   = [1234, 5678];

	/**
	 * Byte-related helper functions
	 */
	this.offset = 0;

	this.seek = function(offset) {
		return reader.offset = offset;
	}

	this.getInt8 = function() {
		const value = reader.dataView.getInt8(reader.offset);
		reader.offset += 1;
		return value;
	}

	this.getUint8 = function() {
		const value = reader.dataView.getUint8(reader.offset);
		reader.offset += 1;
		return value;
	}

	this.getInt16 = function() {
		const value = reader.dataView.getInt16(reader.offset, true);
		reader.offset += 2;
		return value;
	}

	this.getUint16 = function() {
		const value = reader.dataView.getUint16(reader.offset, true);
		reader.offset += 2;
		return value;
	}

	this.getInt32 = function() {
		const value = reader.dataView.getInt32(reader.offset, true);
		reader.offset += 4;
		return value;
	}

	this.getUint32 = function() {
		const value = reader.dataView.getUint32(reader.offset, true);
		reader.offset += 4;
		return value;
	}

	this.getFloat32 = function() {
		const value = reader.dataView.getFloat32(reader.offset, true);
		reader.offset += 4;
		return value;
	}

	this.getInt64 = function() {
		const value = reader.dataView.getBigInt64(reader.offset, true);
		reader.offset += 8;
		return value;
	}

	this.getUint64 = function() {
		const value = reader.dataView.getBigUint64(reader.offset, true);
		reader.offset += 8;
		return value;
	}

	this.getFloat64 = function() {
		const value = reader.dataView.getFloat64(reader.offset, true);
		reader.offset += 8;
		return value;
	}

	this.getCompactIndex = function(startValue) {
		let length = 5;
		let value  = startValue || reader.dataView.getUint8(reader.offset);

		if ((value & 0x40) === 0) {
			length = 1;
		} else {
			for (let i = 1; i < 4; i++) {
				if ((reader.dataView.getUint8(reader.offset + i) & 0x80) === 0) {
					length = i + 1;
					break;
				}
			}
		}

		const signed = (value & 0x80) === 0x80;

		value &= 0x3F;

		for (let i = 1; i < Math.min(length, 4); i++) {
			value |= (reader.dataView.getUint8(reader.offset + i) & 0x7F) << (6 + ((i - 1) * 7));
		}

		if (length === 5) {
			value |= (reader.dataView.getUint8(reader.offset + 4) & 0x1F) << 27;
		}

		reader.offset += length;

		return signed ? -value : value;
	}

	// Gets text where the first byte specifies the size
	this.getSizedText = function(offsetAdjust) {
		const size  = reader.getUint8();
		const bytes = reader.dataView.buffer.slice(reader.offset, reader.offset + size - 1);

		reader.offset += size;

		if (offsetAdjust !== undefined) reader.offset += offsetAdjust;

		return reader.decodeText(bytes);
	}

	/**
	 * From Anthrax (maintainer of OldUnreal UT99 patch):
	 *   There are two legal encodings for string properties: "plain ANSI" or UTF-16LE.
	 *   If the string you want to store in the property has no characters outside the [0, 0x7F] range,
	 *   it will be stored as plain ANSI. The way to tell them apart is to look at the length that is stored
	 *   at the start of the string: positive length = ANSI, negative = UTF-16LE.
	 */
	this.getStringProperty = function() {
		const strSize    = reader.getCompactIndex();
		const isUtf16    = strSize < 0;
		const charWidth  = isUtf16 ? 2 : 1;
		const byteLength = Math.abs(strSize) * charWidth;
		const bytes      = reader.dataView.buffer.slice(reader.offset, reader.offset + byteLength - charWidth);

		reader.offset += byteLength;

		if (isUtf16) {
			return reader.decodeText(bytes, "utf-16le");
		}

		return reader.decodeText(bytes);
	}

	this.decodeText = function(bytes, encoding) {
		return new TextDecoder(encoding || "windows-1252").decode(bytes);
	}

	/**
	 * Package table objects
	 */
	class TableObject {
		get name() {
			return reader.nameTable[this.object_name_index].name;
		}

		get packageObject() {
			return reader.getObject(this.package_index);
		}

		get packageName() {
			return this.packageObject?.name || null;
		}

		get table() {
			const { name } = this.constructor;

			if (name.startsWith("ExportTable")) {
				return "export";
			} else if (name.startsWith("ImportTable")) {
				return "import";
			}
		}
	}

	class ExportTableObject extends TableObject {
		constructor() {
			super();
			this.class_index       = reader.getCompactIndex();
			this.super_index       = reader.getCompactIndex();
			this.package_index     = reader.getInt32();
			this.object_name_index = reader.getCompactIndex();
			this.object_flags      = reader.getUint32();
			this.serial_size       = reader.getCompactIndex();

			if (this.serial_size > 0) {
				this.serial_offset = reader.getCompactIndex();
			}
		}

		get classObject() {
			return reader.getObject(this.class_index);
		}

		get parentObject() {
			return reader.getObject(this.super_index);
		}

		get className() {
			return this.classObject?.name || null;
		}

		get parentObjectName() {
			return this.parentObject?.name || null;
		}

		get flagNames() {
			return Object.keys(reader.objectFlags).filter(name => {
				return reader.objectFlags[name] & this.object_flags;
			})
		}

		hasFlag(flag) {
			return Boolean(this.object_flags & flag);
		}
	}

	class ImportTableObject extends TableObject {
		constructor() {
			super();
			this.class_package_index = reader.getCompactIndex();
			this.class_name_index    = reader.getCompactIndex();
			this.package_index       = reader.getInt32();
			this.object_name_index   = reader.getCompactIndex();
		}

		get classPackageName() {
			return reader.nameTable[this.class_package_index].name;
		}

		get className() {
			return reader.nameTable[this.class_name_index].name;
		}
	}

	/**
	 * Generic class for reading package objects
	 */
	class UTObject {
		constructor(object) {
			reader.seek(object.serial_offset);

			this.object_name = object.name;
			this.properties  = reader.getObjectProperties(object);
		}
	}

	/**
	 * UMOD file data
	 */
	class UMODFile {
		constructor() {
			this.name   = reader.getSizedText();
			this.offset = reader.getUint32();
			this.size   = reader.getUint32();
			this.flags  = reader.getUint32();
		}
	}

	/**
	 * Structs
	 */
	class StateFrame {
		constructor() {
			this.name          = "StateFrame";
			this.node          = reader.getCompactIndex();
			this.state_node    = reader.getCompactIndex();
			this.probe_mask    = reader.getInt64();
			this.latent_action = reader.getUint32();

			if (this.node !== 0) {
				this.offset = reader.getCompactIndex();
			}
		}
	}

	class Vector {
		constructor() {
			this.x = reader.getFloat32();
			this.y = reader.getFloat32();
			this.z = reader.getFloat32();
		}
	}

	class Rotator {
		constructor() {
			this.pitch = reader.getInt32();
			this.yaw   = reader.getInt32();
			this.roll  = reader.getInt32();
		}
	}

	class Quaternion {
		constructor() {
			this.x = reader.getFloat32();
			this.y = reader.getFloat32();
			this.z = reader.getFloat32();
			this.w = reader.getFloat32();
		}
	}

	class Colour {
		constructor() {
			this.r = reader.getUint8();
			this.g = reader.getUint8();
			this.b = reader.getUint8();
			this.a = reader.getUint8();
		}
	}

	class Scale {
		constructor() {
			this.x          = reader.getFloat32();
			this.y          = reader.getFloat32();
			this.z          = reader.getFloat32();
			this.sheer_rate = reader.getUint32();
			this.sheer_axis = reader.getUint8();
		}
	}

	class PointRegion {
		constructor() {
			this.zone        = reader.getCompactIndex();
			this.i_leaf      = reader.getUint32();
			this.zone_number = reader.getUint8();
		}
	}

	class BoundingBox {
		constructor() {
			this.min    = new Vector();
			this.max    = new Vector();
			this.valid  = reader.getUint8() > 0;
		}
	}

	class BoundingSphere {
		constructor() {
			this.centre = new Vector();
			this.radius = reader.getFloat32();
		}
	}

	class Plane {
		constructor() {
			this.x = reader.getFloat32();
			this.y = reader.getFloat32();
			this.z = reader.getFloat32();
			this.w = reader.getFloat32();
		}
	}

	class BspNode {
		constructor() {
			this.plane             = new Plane();
			this.zone_mask         = reader.getUint64();
			this.node_flags        = reader.getUint8();
			this.i_vert_pool       = reader.getCompactIndex();
			this.i_surf            = reader.getCompactIndex();
			this.i_front           = reader.getCompactIndex();
			this.i_back            = reader.getCompactIndex();
			this.i_plane           = reader.getCompactIndex();
			this.i_collision_bound = reader.getCompactIndex();
			this.i_render_bound    = reader.getCompactIndex();

			this.i_zone = [
				reader.getCompactIndex(),
				reader.getCompactIndex(),
			];

			this.vertices = reader.getUint8();

			this.i_leaf = [
				reader.getUint32(),
				reader.getUint32(),
			];
		}
	}

	class BspSurface {
		constructor() {
			this.texture      = reader.getCompactIndex();
			this.poly_flags   = reader.getUint32();
			this.p_base       = reader.getCompactIndex();
			this.v_normal     = reader.getCompactIndex();
			this.v_texture_u  = reader.getCompactIndex();
			this.v_texture_v  = reader.getCompactIndex();
			this.i_light_map  = reader.getCompactIndex();
			this.i_brush_poly = reader.getCompactIndex();
			this.pan_u        = reader.getInt16();
			this.pan_v        = reader.getInt16();
			this.actor        = reader.getCompactIndex();
		}
	}

	class ModelVertex {
		constructor() {
			this.vertex = reader.getCompactIndex();
			this.i_side = reader.getCompactIndex();
		}
	}

	class MeshVertex {
		constructor() {
			// Vertex X/Y/Z values are stored in a single DWORD
			const xyz = reader.getUint32();

			let x = (xyz & 0x7FF) / 8;
			let y = ((xyz >> 11) & 0x7FF) / 8;
			let z = ((xyz >> 22) & 0x3FF) / 4;

			if (x > 128) x -= 256;
			if (y > 128) y -= 256;
			if (z > 128) z -= 256;

			// Deus Ex
			/*const xyz = Number(reader.getUint64());

			let x = (xyz & 0xFFFF) / 256;
			let y = ((xyz >> 16) & 0xFFFF) / 256;
			let z = ((xyz >> 32) & 0xFFFF) / 256;

			if (x > 128) x -= 256;
			if (y > 128) y -= 256;
			if (z > 128) z -= 256;*/

			this.x = x;
			this.y = y;
			this.z = z;
		}
	}

	class MeshTriangle {
		constructor() {
			this.vertex_index_1 = reader.getUint16();
			this.vertex_index_2 = reader.getUint16();
			this.vertex_index_3 = reader.getUint16();
			this.vertex_1_u     = reader.getUint8();
			this.vertex_1_v     = reader.getUint8();
			this.vertex_2_u     = reader.getUint8();
			this.vertex_2_v     = reader.getUint8();
			this.vertex_3_u     = reader.getUint8();
			this.vertex_3_v     = reader.getUint8();
			this.flags          = reader.getUint32();
			this.texture_index  = reader.getUint32();
		}
	}

	class MeshAnimationSequence {
		constructor() {
			this.name        = reader.nameTable[reader.getCompactIndex()].name;
			this.group       = reader.nameTable[reader.getCompactIndex()].name;
			this.start_frame = reader.getUint32();
			this.frame_count = reader.getUint32();

			this.functions = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.functions.length; i++) {
				const f = {};

				f.time     = reader.getUint32();
				f.function = reader.getCompactIndex();

				this.functions[i] = f;
			}

			this.rate = reader.getFloat32();
		}
	}

	class MeshConnection {
		constructor() {
			this.num_vert_triangles   = reader.getUint32();
			this.triangle_list_offset = reader.getUint32();
		}
	}

	class LodMeshFace {
		constructor() {
			this.wedge_index_1  = reader.getUint16();
			this.wedge_index_2  = reader.getUint16();
			this.wedge_index_3  = reader.getUint16();
			this.material_index = reader.getUint16();
		}
	}

	class LodMeshWedge {
		constructor() {
			this.vertex_index = reader.getUint16();
			this.s            = reader.getUint8();
			this.t            = reader.getUint8();
		}
	}

	class LodMeshMaterial {
		constructor() {
			this.flags         = reader.getUint32();
			this.texture_index = reader.getUint32();
		}
	}

	class SkeletalMeshExtWedge {
		constructor() {
			this.i_vertex = reader.getUint16();
			this.flags    = reader.getUint16();
			this.u        = reader.getFloat32();
			this.v        = reader.getFloat32();
		}
	}

	class SkeletalMeshSkeleton {
		constructor() {
			this.name           = reader.nameTable[reader.getCompactIndex()].name;
			this.flags          = reader.getUint32();
			this.orientation    = new Quaternion();
			this.position       = new Vector();
			this.length         = reader.getFloat32();
			this.x_size         = reader.getFloat32();
			this.y_size         = reader.getFloat32();
			this.z_size         = reader.getFloat32();
			this.children_count = reader.getUint32();
			this.parent_index   = reader.getUint32();
		}
	}

	class SkeletalMeshBoneWeightIndex {
		constructor() {
			this.weight_index = reader.getUint16();
			this.number       = reader.getUint16();
			this.detail_a     = reader.getUint16();
			this.detail_b     = reader.getUint16();
		}
	}

	class SkeletalMeshBoneWeight {
		constructor() {
			this.point_index = reader.getUint16();
			this.bone_weight = reader.getUint16();
		}
	}

	class SkeletalMeshWeaponAdjust {
		constructor() {
			this.origin = new Vector();
			this.x_axis = new Vector();
			this.y_axis = new Vector();
			this.z_axis = new Vector();
		}
	}

	class BoneReference {
		constructor() {
			this.name         = reader.nameTable[reader.getCompactIndex()].name;
			this.flags        = reader.getUint32();
			this.parent_index = reader.getUint32();
		}
	}

	class BoneMovement {
		constructor() {
			this.root_speed_3d = new Vector();
			this.track_time    = reader.getFloat32();
			this.start_bone    = reader.getUint32();
			this.flags         = reader.getUint32();
			this.bones         = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bones.length; i++) {
				this.bones[i] = reader.getUint32();
			}

			this.animation_tracks = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.animation_tracks.length; i++) {
				this.animation_tracks[i] = new AnimationTrack();
			}

			this.root_track = new AnimationTrack();
		}
	}

	class AnimationTrack {
		constructor() {
			this.flags = reader.getUint32();
			this.key_quaternions = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.key_quaternions.length; i++) {
				this.key_quaternions[i] = new Quaternion();
			}

			this.key_positions = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.key_positions.length; i++) {
				this.key_positions[i] = new Vector();
			}

			this.key_time = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.key_time.length; i++) {
				this.key_time[i] = reader.getFloat32();
			}
		}
	}

	class Zone {
		constructor() {
			this.zone_actor   = reader.getCompactIndex();
			this.connectivity = reader.getUint64();
			this.visibility   = reader.getUint64();

			if (reader.header.version < 63) {
				this.last_render_time = reader.getFloat32();
			}
		}
	}

	class LightMap {
		constructor() {
			this.data_offset    = reader.getUint32();
			this.pan            = new Vector();
			this.u_clamp        = reader.getCompactIndex();
			this.v_clamp        = reader.getCompactIndex();
			this.u_scale        = reader.getFloat32();
			this.v_scale        = reader.getFloat32();
			this.i_light_actors = reader.getInt32();
		}
	}

	class BspLeaf {
		constructor() {
			this.i_zone        = reader.getCompactIndex()
			this.i_permeating  = reader.getCompactIndex()
			this.i_volumetric  = reader.getCompactIndex()
			this.visible_zones = reader.getUint64();
		}
	}

	class Polygon {
		constructor() {
			this.vertex_count = reader.getUint8();
			this.origin       = new Vector();
			this.normal       = new Vector();
			this.texture_u    = new Vector();
			this.texture_v    = new Vector();

			this.vertices = new Array(this.vertex_count);

			for (let i = 0; i < this.vertices.length; i++) {
				this.vertices[i] = new Vector();
			}

			this.flags      = reader.getPolyFlags(reader.getUint32());
			this.actor      = reader.getCompactIndex();
			this.texture    = reader.getCompactIndex();
			this.item_name  = reader.getCompactIndex();
			this.link       = reader.getCompactIndex();
			this.brush_poly = reader.getCompactIndex();
			this.pan_u      = reader.getUint16();
			this.pan_v      = reader.getUint16();

			if (this.pan_u > 0x8000) this.pan_u |= 0xFFFF0000;
			if (this.pan_v > 0x8000) this.pan_v |= 0xFFFF0000;
		}
	}

	class MipMap {
		constructor() {
			if (reader.header.version >= 63) {
				this.width_offset = reader.getUint32();
			}

			this.size = reader.getCompactIndex();
			this.data = new Uint8Array(reader.dataView.buffer.slice(reader.offset, reader.offset + this.size));

			reader.offset += this.size;

			this.width       = reader.getUint32();
			this.height      = reader.getUint32();
			this.bits_width  = reader.getUint8();
			this.bits_height = reader.getUint8();
		}
	}

	class LevelURL {
		constructor() {
			this.protocol = reader.getSizedText();
			this.host     = reader.getSizedText();
			this.map      = reader.getSizedText();
			this.options  = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.options.length; i++) {
				this.options[i] = reader.getSizedText();
			}

			this.portal = reader.getSizedText();
			this.port   = reader.getUint32();
			this.valid  = reader.getUint32() > 0;
		}
	}

	class ReachSpec {
		constructor() {
			this.distance         = reader.getUint32();
			this.start            = reader.getCompactIndex();
			this.end              = reader.getCompactIndex();
			this.collision_radius = reader.getUint32();
			this.collision_height = reader.getUint32();
			this.reach_flags      = reader.getUint32();
			this.pruned           = reader.getUint8() > 0;
		}
	}

	class LevelMap {
		constructor() {
			this.key   = reader.getSizedText();
			this.value = reader.getSizedText();
		}
	}

	/**
	 * UT native classes
	 */
	class ULevelBase extends UTObject {
		constructor(levelObject) {
			super(levelObject);

			this.actors = new Array(reader.getUint32());

			// Seems to be repeated...
			reader.offset += 4;

			for (let i = 0; i < this.actors.length; i++) {
				this.actors[i] = reader.getObject(reader.getCompactIndex());
			}

			this.url = new LevelURL();
		}
	}

	class ULevel extends ULevelBase {
		constructor(levelObject) {
			super(levelObject);

			this.model       = reader.getObject(reader.getCompactIndex());
			this.reach_specs = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.reach_specs.length; i++) {
				this.reach_specs[i] = new ReachSpec();
			}

			this.approx_time   = reader.getFloat32();
			this.first_deleted = reader.getCompactIndex();
			this.text_blocks   = new Array(16);

			for (let i = 0; i < this.text_blocks.length; i++) {
				this.text_blocks[i] = reader.getObject(reader.getCompactIndex());
			}

			if (reader.header.version > 62) {
				this.travel_info = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.travel_info.length; i++) {
					this.travel_info[i] = new LevelMap();
				}
			}
		}
	}

	class UTexture extends UTObject {
		constructor(textureObject) {
			super(textureObject);

			this.mip_maps = new Array(reader.getUint8());

			for (let i = 0; i < this.mip_maps.length; i++) {
				this.mip_maps[i] = new MipMap();
			}
		}
	}

	class UPalette extends UTObject {
		constructor(paletteObject) {
			super(paletteObject);

			this.colours = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.colours.length; i++) {
				this.colours[i] = new Colour();
			}
		}
	}

	class UPolys extends UTObject {
		constructor(polysObject) {
			super(polysObject);

			this.poly_count = reader.getUint32();

			// Seems to be repeated...
			reader.offset += 4;

			this.polys = new Array(this.poly_count);

			for (let i = 0; i < this.polys.length; i++) {
				this.polys[i] = new Polygon();
			}
		}
	}

	class UPrimitive extends UTObject {
		constructor(modelObject) {
			super(modelObject);

			this.bounding_box    = new BoundingBox();
			this.bounding_sphere = new BoundingSphere();
		}
	}

	class UModel extends UPrimitive {
		constructor(modelObject) {
			super(modelObject);

			if (reader.header.version > 61) {
				this.vectors = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.vectors.length; i++) {
					this.vectors[i] = new Vector();
				}

				this.points = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.points.length; i++) {
					this.points[i] = new Vector();
				}

				this.nodes = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.nodes.length; i++) {
					this.nodes[i] = new BspNode();
				}

				this.surfaces = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.surfaces.length; i++) {
					this.surfaces[i] = new BspSurface();
				}

				this.vertices = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.vertices.length; i++) {
					this.vertices[i] = new ModelVertex();
				}

				this.shared_sides = reader.getUint32();

				this.zones = new Array(reader.getUint32());

				for (let i = 0; i < this.zones.length; i++) {
					this.zones[i] = new Zone();
				}

				this.polys = reader.getCompactIndex();

				this.light_map = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.light_map.length; i++) {
					this.light_map[i] = new LightMap();
				}

				this.light_bits = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.light_bits.length; i++) {
					this.light_bits[i] = reader.getUint8();
				}

				this.bounds = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.bounds.length; i++) {
					this.bounds[i] = new BoundingBox();
				}

				this.leaf_hulls = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.leaf_hulls.length; i++) {
					this.leaf_hulls[i] = reader.getUint32();
				}

				this.leaves = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.leaves.length; i++) {
					this.leaves[i] = new BspLeaf();
				}

				this.lights = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.lights.length; i++) {
					this.lights[i] = reader.getCompactIndex();
				}

				this.root_outside = reader.getUint32() > 0;
				this.linked       = reader.getUint32() > 0;
			}
		}
	}

	class UMesh extends UPrimitive {
		constructor(meshObject) {
			super(meshObject);

			if (reader.header.version > 61) {
				this.vertices_jump = reader.getUint32();
			}

			this.vertices = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.vertices.length; i++) {
				this.vertices[i] = new MeshVertex();
			}

			if (reader.header.version > 61) {
				this.triangles_jump = reader.getUint32();
			}

			this.triangles = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.triangles.length; i++) {
				this.triangles[i] = new MeshTriangle();
			}

			this.anim_sequences = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.anim_sequences.length; i++) {
				this.anim_sequences[i] = new MeshAnimationSequence();
			}

			this.connects_jump = reader.getUint32();

			this.connections = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.connections.length; i++) {
				this.connections[i] = new MeshConnection();
			}

			this.bounding_box_2    = new BoundingBox();
			this.bounding_sphere_2 = new BoundingSphere();
			this.vert_links_jump   = reader.getUint32();

			this.vert_links = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.vert_links.length; i++) {
				this.vert_links[i] = reader.getUint32();
			}

			this.textures = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.textures.length; i++) {
				this.textures[i] = reader.getObject(reader.getCompactIndex());
			}

			this.bounding_boxes = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bounding_boxes.length; i++) {
				this.bounding_boxes[i] = new BoundingBox();
			}

			this.bounding_spheres = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bounding_spheres.length; i++) {
				this.bounding_spheres[i] = new BoundingSphere();
			}

			this.frame_verts     = reader.getUint32();
			this.anim_frames     = reader.getUint32();
			this.flags_AND       = reader.getUint32();
			this.flags_OR        = reader.getUint32();
			this.scale           = new Vector();
			this.origin          = new Vector();
			this.rotation_origin = new Rotator();
			this.cur_poly        = reader.getUint32();
			this.cur_vertex      = reader.getUint32();

			if (reader.header.version === 65) {
				this.texture_lod = [reader.getFloat32()];
			}

			else if (reader.header.version >= 66) {
				this.texture_lod = new Array(reader.getCompactIndex());

				for (let i = 0; i < this.texture_lod.length; i++) {
					this.texture_lod[i] = reader.getFloat32();
				}
			}
		}
	}

	class ULodMesh extends UMesh {
		constructor(lodMeshObject) {
			super(lodMeshObject);

			this.collapse_point_thus = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.collapse_point_thus.length; i++) {
				this.collapse_point_thus[i] = reader.getUint16();
			}

			this.face_level = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.face_level.length; i++) {
				this.face_level[i] = reader.getUint16();
			}

			this.faces = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.faces.length; i++) {
				this.faces[i] = new LodMeshFace();
			}

			this.collapse_wedge_thus = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.collapse_wedge_thus.length; i++) {
				this.collapse_wedge_thus[i] = reader.getUint16();
			}

			this.wedges = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.wedges.length; i++) {
				this.wedges[i] = new LodMeshWedge();
			}

			this.materials = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.materials.length; i++) {
				this.materials[i] = new LodMeshMaterial();
			}

			this.special_faces = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.special_faces.length; i++) {
				this.special_faces[i] = new LodMeshFace();
			}

			this.model_vertices   = reader.getUint32();
			this.special_vertices = reader.getUint32();
			this.mesh_scale_max   = reader.getFloat32();
			this.lod_hysteresis   = reader.getFloat32();
			this.lod_strength     = reader.getFloat32();
			this.lod_min_verts    = reader.getUint32();
			this.lod_morph        = reader.getFloat32();
			this.lod_z_displace   = reader.getFloat32();

			this.remap_anim_vertices = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.remap_anim_vertices.length; i++) {
				this.remap_anim_vertices[i] = reader.getUint16();
			}

			this.old_frame_verts = reader.getUint32();
		}
	}

	class USkeletalMesh extends ULodMesh {
		constructor(skeletalMeshObject) {
			super(skeletalMeshObject);

			this.ext_wedges = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.ext_wedges.length; i++) {
				this.ext_wedges[i] = new SkeletalMeshExtWedge();
			}

			this.points = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.points.length; i++) {
				this.points[i] = new Vector();
			}

			this.skeletons = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.skeletons.length; i++) {
				this.skeletons[i] = new SkeletalMeshSkeleton();
			}

			this.bone_weight_indices = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bone_weight_indices.length; i++) {
				this.bone_weight_indices[i] = new SkeletalMeshBoneWeightIndex();
			}

			this.bone_weights = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bone_weights.length; i++) {
				this.bone_weights[i] = new SkeletalMeshBoneWeight();
			}

			this.local_points = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.local_points.length; i++) {
				this.local_points[i] = new Vector();
			}

			this.skeletal_depth    = reader.getUint32();
			this.default_animation = reader.getObject(reader.getCompactIndex());
			this.weapon_bone_index = reader.getUint32();
			this.weapon_adjust     = new SkeletalMeshWeaponAdjust();
		}
	}

	class UAnimation extends UTObject {
		constructor(animationObject) {
			super(animationObject);

			this.bones = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.bones.length; i++) {
				this.bones[i] = new BoneReference();
			}

			this.movements = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.movements.length; i++) {
				this.movements[i] = new BoneMovement();
			}

			this.animation_sequences = new Array(reader.getCompactIndex());

			for (let i = 0; i < this.animation_sequences.length; i++) {
				this.animation_sequences[i] = new MeshAnimationSequence();
			}
		}
	}

	class UMusic extends UTObject {
		constructor(musicObject) {
			super(musicObject);

			// If the package itself only contains music (.umx) then the first name table entry is the format.
			// This is not always the case if the music is embedded in a map, for example.
			this.format          = reader.nameTable[reader.getCompactIndex()].name;
			this.data_end_offset = reader.getUint32();
			this.size            = reader.getCompactIndex(); // includes null padding?
			this.audio_data      = reader.dataView.buffer.slice(reader.offset, reader.offset + this.size);
		}
	}

	class USound extends UTObject {
		constructor(soundObject) {
			super(soundObject);

			this.format = reader.nameTable[reader.getCompactIndex()].name;

			if (reader.header.version >= 63) {
				this.next_object_offset = reader.getUint32();
			}

			this.size         = reader.getCompactIndex();
			this.audio_offset = reader.offset;
		}
	}

	class UTextBuffer extends UTObject {
		constructor(textBufferObject) {
			super(textBufferObject);

			this.pos  = reader.getUint32();
			this.top  = reader.getUint32();
			this.size = reader.getCompactIndex();

			if (this.size > 0) {
				this.contents = reader.decodeText(reader.dataView.buffer.slice(reader.offset, reader.offset + this.size - 1));
				reader.offset += this.size + 1;
			}
		}
	}

	class UFont extends UTObject {
		constructor(fontObject) {
			super(fontObject);

			this.textures = new Array(reader.getUint8());

			for (let i = 0; i < this.textures.length; i++) {
				const fontTexture = {};

				fontTexture.texture    = reader.getObject(reader.getCompactIndex());
				fontTexture.characters = new Array(reader.getCompactIndex());

				for (let j = 0; j < fontTexture.characters.length; j++) {
					fontTexture.characters[j] = {};

					fontTexture.characters[j].x      = reader.getUint32();
					fontTexture.characters[j].y      = reader.getUint32();
					fontTexture.characters[j].width  = reader.getUint32();
					fontTexture.characters[j].height = reader.getUint32();
				}

				this.textures[i] = fontTexture;
			}
		}
	}

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

	this.objectFlags = {
		RF_Transactional   : 0x00000001,
		RF_Unreachable     : 0x00000002,
		RF_Public          : 0x00000004,
		RF_TagImp          : 0x00000008,
		RF_TagExp          : 0x00000010,
		RF_SourceModified  : 0x00000020,
		RF_TagGarbage      : 0x00000040,
		RF_NeedLoad        : 0x00000200,
		RF_HighlightedName : 0x00000400,
		RF_InSingularFunc  : 0x00000800,
		RF_Suppress        : 0x00001000,
		RF_InEndState      : 0x00002000,
		RF_Transient       : 0x00004000,
		RF_PreLoading      : 0x00008000,
		RF_LoadForClient   : 0x00010000,
		RF_LoadForServer   : 0x00020000,
		RF_LoadForEdit     : 0x00040000,
		RF_Standalone      : 0x00080000,
		RF_NotForClient    : 0x00100000,
		RF_NotForServer    : 0x00200000,
		RF_NotForEdit      : 0x00400000,
		RF_Destroyed       : 0x00800000,
		RF_NeedPostLoad    : 0x01000000,
		RF_HasStack        : 0x02000000,
		RF_Native          : 0x04000000,
		RF_Marked          : 0x08000000,
		RF_ErrorShutdown   : 0x10000000,
		RF_DebugPostLoad   : 0x20000000,
		RF_DebugSerialize  : 0x40000000,
		RF_DebugDestroy    : 0x80000000,
	}

	this.fileTypes = {
		u    : "System",
		uax  : "Sound",
		umod : "UMOD",
		umx  : "Music",
		unr  : "Map",
		utx  : "Texture",
		uxx  : "Cache",
		uz   : "Zip",
		tmp  : "Zip",
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

	this.brushClasses = [
		"AssertMover",
		"AttachMover",
		"Brush",
		"ElevatorMover",
		"GradualMover",
		"LoopMover",
		"MixMover",
		"Mover",
		"RotatingMover",
	];

	this.moverClasses = [
		"AssertMover",
		"AttachMover",
		"ElevatorMover",
		"GradualMover",
		"LoopMover",
		"MixMover",
		"Mover",
		"RotatingMover",
	];

	this.meshClasses = [
		"Mesh",
		"LodMesh",
		"SkeletalMesh",
	];

	this.enumBumpType = [
		"BT_PlayerBump",
		"BT_PawnBump",
		"BT_AnyBump",
	];

	this.enumMoverEncroachType = [
		"ME_StopWhenEncroach",
		"ME_ReturnWhenEncroach",
		"ME_CrushWhenEncroach",
		"ME_IgnoreWhenEncroach",
	];

	this.enumMoverGlideType = [
		"MV_MoveByTime",
		"MV_GlideByTime",
	];

	this.enumCsgOper = [
		"CSG_Active",
		"CSG_Add",
		"CSG_Subtract",
		"CSG_Intersect",
		"CSG_Deintersect",
	];

	this.enumSheerAxis = [
		"SHEER_None",
		"SHEER_XY",
		"SHEER_XZ",
		"SHEER_YX",
		"SHEER_YZ",
		"SHEER_ZX",
		"SHEER_ZY",
	];

	/**
	 * UT package functions
	 */
	this.readPackage = function() {
		// Set global variables for access within other functions
		reader.header      = reader.getPackageHeader();
		reader.version     = reader.header.version;
		reader.nameTable   = reader.getNameTable();
		reader.exportTable = reader.getExportTable();
		reader.importTable = reader.getImportTable();

		return reader;
	}

	this.getPackageHeader = function() {
		const header = {};

		reader.seek(0);

		header.signature = reader.getUint32();

		if (header.signature !== SIGNATURE_UT) {
			throw `Invalid package signature: 0x${header.signature.toString(16).padStart(8, 0)}`;
		}

		header.version          = reader.getUint16();
		header.licensee_version = reader.getUint16();
		header.package_flags    = reader.getUint32();
		header.name_count       = reader.getUint32();
		header.name_offset      = reader.getUint32();
		header.export_count     = reader.getUint32();
		header.export_offset    = reader.getUint32();
		header.import_count     = reader.getUint32();
		header.import_offset    = reader.getUint32();

		if (header.version < 68) {
			header.heritage_count  = reader.getUint32();
			header.heritage_offset = reader.getUint32();
		} else {
			header.guid = (
				  reader.getUint32().toString(16).padStart(8, 0)
				+ reader.getUint32().toString(16).padStart(8, 0)
				+ reader.getUint32().toString(16).padStart(8, 0)
				+ reader.getUint32().toString(16).padStart(8, 0)
			).toUpperCase();

			header.generation_count = reader.getUint32();
			header.generations = [];

			for (let i = 0; i < header.generation_count; i++) {
				const generation = {};

				generation.export_count = reader.getUint32();
				generation.name_count   = reader.getUint32();

				header.generations.push(generation);
			}
		}

		return header;
	}

	this.getNameTable = function() {
		const nameTable = [];

		reader.seek(reader.header.name_offset);

		if (reader.header.version < 64) {
			for (let i = 0; i < reader.header.name_count; i++) {
				const bytes = [];
				let char    = reader.getUint8();

				while (char !== 0x00) {
					bytes.push(char);
					char = reader.getUint8();
				}

				const name  = reader.decodeText(new Uint8Array(bytes));
				const flags = reader.getUint32();

				nameTable.push({
					name  : name,
					flags : flags,
				})
			}
		} else {
			for (let i = 0; i < reader.header.name_count; i++) {
				const name  = reader.getSizedText();
				const flags = reader.getUint32();

				nameTable.push({
					name  : name,
					flags : flags,
				})
			}
		}

		return nameTable;
	}

	this.getExportTable = function() {
		const exportTable = [];

		reader.seek(reader.header.export_offset);

		for (let i = 0; i < reader.header.export_count; i++) {
			exportTable.push(new ExportTableObject());
		}

		return exportTable;
	}

	this.getImportTable = function() {
		const importTable = [];

		reader.seek(reader.header.import_offset);

		for (let i = 0; i < reader.header.import_count; i++) {
			importTable.push(new ImportTableObject());
		}

		return importTable;
	}

	this.getObjectProperties = function(object) {
		const properties = [];

		reader.seek(object.serial_offset);

		// If RF_HasStack flag is present, handle "StateFrame" block which comes before the properties
		if ((object.object_flags & 0x02000000) === 0x02000000) {
			// Not actually a property but include it anyway for completeness
			properties.push(new StateFrame());
		}

		// The first byte of property block is a name table index
		let currentPropName = reader.nameTable[reader.getCompactIndex()].name;

		while (currentPropName.toLowerCase() !== "none") {
			const prop = {};

			// Next byte contains property info (type, size, etc.)
			const infoByte = reader.getUint8();

			prop.name = currentPropName;
			prop.type = reader.propertyTypes[infoByte & 0x0F];

			// If the property type is a struct then the struct name follows
			if (prop.type === "Struct") {
				prop.subtype = reader.nameTable[reader.getCompactIndex()].name;
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
			const propSizeInfo = (infoByte >> 4) & 0x07;
			let propSize;

			switch (propSizeInfo) {
				case 0: propSize = 1;  break;
				case 1: propSize = 2;  break;
				case 2: propSize = 4;  break;
				case 3: propSize = 12; break;
				case 4: propSize = 16; break;

				case 5:
					propSize = reader.getUint8();
				break;

				case 6:
					propSize = reader.getUint16();
				break;

				case 7:
					propSize = reader.getUint32();
				break;

				default:
					propSize = 1;
				break;
			}

			// Property special flags
			const arrayFlag = !!(infoByte >> 7);

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
					if (prevProp.index >= 0x3FFF) {
						arrayIndex = reader.getUint32() & 0x3FFFFFFF;
					} else if (prevProp.index >= 0x7F) {
						arrayIndex = reader.getUint16() & 0x7FFF;
					} else {
						arrayIndex = reader.getUint8();
					}
				} else {
					arrayIndex = reader.getUint8();
				}

				prop.aggtype = "Array";
				prop.index   = arrayIndex;
			}

			// Assign property value
			switch (prop.type) {
				case "Byte":
					prop.value = reader.getUint8();
				break;

				case "Integer":
					prop.value = reader.getInt32();
				break;

				case "Boolean":
					prop.value = arrayFlag;
				break;

				case "Float":
					prop.value = reader.getFloat32();
				break;

				case "Object":
					prop.value = reader.getCompactIndex();
				break;

				case "Name":
					prop.value = reader.nameTable[reader.getCompactIndex()].name;
				break;

				// Handled later
				case "Class":
				break;

				case "Struct":
					switch (prop.subtype.toLowerCase()) {
						case "color":
							prop.value = new Colour();
						break;

						case "vector":
							prop.value = new Vector();
						break;

						case "rotator":
							prop.value = new Rotator();
						break;

						case "scale":
							prop.value = new Scale();
						break;

						case "pointregion":
							prop.value = new PointRegion();
						break;

						default:
							reader.offset += propSize;
						break;
					}
				break;

				case "Str":
					prop.value = reader.getStringProperty();
				break;

				// Unknown
				case "String":
				case "Array":
				case "Vector":
				case "Rotator":
				case "Map":
				case "Fixed Array":
				default:
					reader.offset += propSize;
				break;
			}

			properties.push(prop);

			currentPropName = reader.nameTable[reader.getCompactIndex()].name;
		}

		return properties;
	}

	this.getObject = function(index) {
		if (index === 0) {
			return null;
		} else if (index < 0) {
			return reader.importTable[~index];
		} else {
			return reader.exportTable[index - 1];
		}
	}

	this.getObjectByName = function(objectName) {
		for (const object of reader.exportTable) {
			if (reader.nameTable[object.object_name_index].name === objectName) {
				return object;
			}
		}

		return null;
	}

	this.getObjectNameFromIndex = function(index) {
		try {
			return reader.nameTable[reader.getObject(index).object_name_index].name;
		} catch (e) {
			return "None";
		}
	}

	this.getObjectPropertiesFromName = function(objectName) {
		const object = reader.getObjectByName(objectName);

		if (object) {
			return reader.getObjectProperties(object);
		}

		return [];
	}

	this.getParentObject = function(object) {
		if (object.package_index !== 0) {
			const parent = reader.getObject(object.package_index);
			return reader.getParentObject(parent);
		}

		return object;
	}

	this.getObjectsByType = function(objectType) {
		const objects = [];

		for (const exportObject of reader.exportTable) {
			const classObject = reader.getObject(exportObject.class_index);

			if (classObject !== null && objectType === reader.nameTable[classObject.object_name_index].name) {
				objects.push(exportObject);
			}
		}

		return objects;
	}

	this.getTextureObjects = function() {
		return reader.getObjectsByType("Texture");
	}

	this.getSoundObjects = function() {
		return reader.getObjectsByType("Sound");
	}

	this.getMusicObjects = function() {
		return reader.getObjectsByType("Music");
	}

	this.getTextBufferObjects = function() {
		return reader.getObjectsByType("TextBuffer");
	}

	this.getLevel = function() {
		const levels = [];
		const levelObjects = reader.getObjectsByType("Level");

		for (const levelObject of levelObjects) {
			levels.push(new ULevel(levelObject));
		}

		return levels;
	}

	this.getAllMeshObjects = function() {
		const meshes = [];

		for (const object of reader.exportTable) {
			const name = reader.getObjectNameFromIndex(object.class_index);

			if (reader.meshClasses.includes(name)) meshes.push(object);
		}

		return meshes;
	}

	this.getAllBrushObjects = function() {
		const brushes = [];

		for (const object of reader.exportTable) {
			const name = reader.getObjectNameFromIndex(object.class_index);

			if (reader.brushClasses.includes(name)) brushes.push(object);
		}

		return brushes;
	}

	this.getBrushData = function(brushObject) {
		const data = {};

		data.brush = {};
		data.model = {};
		data.polys = {};

		// Brush
		data.brush.object = brushObject;
		data.brush.properties = reader.getObjectProperties(brushObject);

		// Model
		const modelIndex = data.brush.properties.filter(p => p.name.toLowerCase() === "brush")[0];

		if (modelIndex) {
			const modelObject = reader.getObject(modelIndex.value);
			const modelData   = reader.getUModel(modelObject);

			data.model.object = modelObject;
			data.model.properties = modelData;

			// Polys
			if (modelData.polys !== 0) {
				const polyObject = reader.getObject(modelData.polys);
				const polysData  = reader.getUPolys(polyObject);

				data.polys.object   = polyObject;
				data.polys.polygons = polysData.polys;
			}
		}

		return data;
	}

	this.getAllMeshData = function() {
		const allMeshData = [];
		const meshObjects = reader.getAllMeshObjects();

		for (const mesh of meshObjects) {
			allMeshData.push(reader.getMeshData(mesh));
		}

		return allMeshData;
	}

	this.getAllBrushData = function() {
		const allBrushData = [];
		const brushObjects = reader.getAllBrushObjects();

		for (const brush of brushObjects) {
			allBrushData.push(reader.getBrushData(brush));
		}

		return allBrushData;
	}

	this.getAnimations = function() {
		const animations       = [];
		const animationObjects = reader.getObjectsByType("Animation");

		for (const animationObject of animationObjects) {
			animations.push(new UAnimation(animationObject));
		}

		return animations;
	}

	this.getTextBuffer = function(textBufferObject) {
		const textBuffer = new UTextBuffer(textBufferObject);

		if (textBufferObject.package_index !== 0) {
			textBuffer.package = reader.getParentPackageName(textBufferObject);
		}

		return textBuffer;
	}

	this.getFonts = function() {
		const fonts       = [];
		const fontObjects = reader.getObjectsByType("Font");

		for (const fontObject of fontObjects) {
			fonts.push(new UFont(fontObject));
		}

		return fonts;
	}

	this.getTextureInfo = function(textureObject) {
		const objectInfo = reader.getObject(textureObject.package_index);

		return {
			name  : reader.nameTable[textureObject.object_name_index].name,
			group : objectInfo ? reader.nameTable[objectInfo.object_name_index].name : null,
		}
	}

	this.getTexturesGrouped = function() {
		const textures  = reader.getTextureObjects();
		const grouped   = {};
		const ungrouped = [];

		let total = 0;

		for (const textureObject of textures) {
			const textureInfo = reader.getTextureInfo(textureObject);

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
		const parentPackage = reader.getObject(object.package_index);
		return reader.nameTable[parentPackage.object_name_index].name;
	}

	this.getMusic = function(musicObject) {
		return new UMusic(musicObject);
	}

	this.getSound = function(soundObject) {
		return new USound(soundObject);
	}

	this.getSounds = function() {
		const sounds       = [];
		const soundObjects = reader.getSoundObjects();

		// Used to check for additional metadata
		const WAVE_FORMAT_PCM   = 0x01;
		const SUBCHUNK_SIZE_PCM = 0x10;

		for (const soundObject of soundObjects) {
			const sound = new USound(soundObject);

			// Attempt to get this sound's package name
			if (soundObject.package_index !== 0) {
				sound.package = reader.getParentPackageName(soundObject);
			}

			// Not all sound files are PCM - e.g. ultra trash map CTF-BT-SuckmeToo seems to contain some kind of compressed audio.
			// Additionally, some files contain extra metadata so the values below cannot be accurately read unless using a more
			// sophisticated WAVE audio reading method.
			if (
				   sound.format.toUpperCase() === "WAV"
				&& reader.dataView.getUint16(sound.audio_offset + 16, true) === SUBCHUNK_SIZE_PCM
				&& reader.dataView.getUint16(sound.audio_offset + 20, true) === WAVE_FORMAT_PCM
			) {
				sound.channels    = reader.dataView.getUint16(sound.audio_offset + 22, true);
				sound.sample_rate = reader.dataView.getUint32(sound.audio_offset + 24, true);
				sound.byte_rate   = reader.dataView.getUint32(sound.audio_offset + 28, true);
				sound.bit_depth   = reader.dataView.getUint16(sound.audio_offset + 34, true);
			}

			sounds.push(sound);
		}

		return sounds;
	}

	this.getLightHsl = function(lightObject) {
		// Default UT values: 0, 255, 64
		const hsl = {
			h : 0,
			s : 100,
			l : 25
		}

		const properties = reader.getObjectProperties(lightObject);

		for (const prop of properties) {
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

	this.getUModel = function(modelObject) {
		return new UModel(modelObject);
	}

	this.getUPolys = function(polysObject) {
		return new UPolys(polysObject);
	}

	this.getPolyFlags = function(flags) {
		const polyFlags = [];

		for (const flagName in reader.polyFlags) {
			const flagVal = reader.polyFlags[flagName];

			if (flagVal > flags) break;

			if ((flags & flagVal) !== 0) {
				polyFlags.push(flagName);
			}
		}

		return polyFlags;
	}

	this.getMeshData = function(meshObject) {
		return new UMesh(meshObject);
	}

	this.getLodMeshData = function(lodMeshObject) {
		return new ULodMesh(lodMeshObject);
	}

	this.getSkeletalMeshData = function(skeletalMeshObject) {
		return new USkeletalMesh(skeletalMeshObject);
	}

	this.getPalette = function(paletteObject) {
		return new UPalette(paletteObject);
	}

	this.getPaletteObjectFromTexture = function(textureObject) {
		const textureProperties = reader.getObjectProperties(textureObject);

		for (const prop of textureProperties) {
			if (prop.name.toLowerCase() === "palette") {
				return reader.getObject(prop.value);
			}
		}

		return null;
	}

	this.getPaletteCanvas = function(textureObject, callback) {
		const paletteObject = reader.getPaletteObjectFromTexture(textureObject);
		const paletteData   = reader.getPalette(paletteObject);

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
				imageData.data[i++] = 0xFF; // See explanation in textureToCanvas()
			}

			context.putImageData(imageData, 0, 0);

			callback(canvas, paletteData);
		})

		return paletteData;
	}

	this.getTexture = function(textureObject) {
		return new UTexture(textureObject);
	}

	this.getTextureData = function(textureObject) {
		const texture = reader.getTexture(textureObject);

		// Find this texture's palette object
		const paletteObject = reader.getPaletteObjectFromTexture(textureObject);

		// Get palette colour data
		const paletteData = reader.getPalette(paletteObject);

		texture.palette = paletteData;

		return texture;
	}

	this.textureToCanvas = function(textureObject, callback) {
		const canvas  = document.createElement("canvas");
		const context = canvas.getContext("2d");

		const textureData = reader.getTextureData(textureObject);

		canvas.width  = textureData.mip_maps[0].width;
		canvas.height = textureData.mip_maps[0].height;

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

		createImageBitmap(imageData).then(function(imageBitmap) {
			let i = 0;

			for (const pixel of textureData.mip_maps[0].data) {
				const colour = textureData.palette.colours[pixel];

				imageData.data[i++] = colour.r;
				imageData.data[i++] = colour.g;
				imageData.data[i++] = colour.b;
				// imageData.data[i++] = colour.a;

				// Newer versions use alpha channel, but this doesn't seem to be
				// consistent in older packages, e.g. Faces.utx has alpha set to 0
				imageData.data[i++] = 0xFF;
			}

			context.putImageData(imageData, 0, 0);

			callback({
				canvas : canvas,
				bitmap : imageBitmap,
				name   : textureData.object_name,
			})
		})
	}

	this.getScreenshot = function(callback) {
		// Multiple screenshots can be embedded to create a montage effect by naming MyLevel textures "Screenshot2" etc.
		const screenshotRegEx = new RegExp("^Screenshot([0-9]+)?$", "i");
		const screenshotNames = reader.nameTable.filter(name => screenshotRegEx.test(name));
		let screenshotObjects = screenshotNames.map(name => reader.getObjectByName(name));

		// "Screenshot" may be present in name table but may erroneously point to an import table object (e.g. CTF-BT-Brazilian-novice)
		screenshotObjects = screenshotObjects.filter(s => s !== null);

		let screenshotFound = false;

		if (screenshotObjects.length > 0) {
			const screenshots = [];

			for (let i = 0; i < screenshotObjects.length; i++) {
				reader.textureToCanvas(screenshotObjects[i], function(screenshot) {
					screenshots.push(screenshot);

					if (screenshots.length === screenshotObjects.length) {
						// Sort numerically as name table doesn't guarantee order
						screenshots.sort((a, b) => Number(a.name.substring("Screenshot".length)) - Number(b.name.substring("Screenshot".length)));
						callback(screenshots);
					}
				})
			}

			screenshotFound = true;
		}

		else {
			// Officially, the map screenshot should be named "Screenshot"; however, it's possible to set this value
			// to a different texture. It won't appear in-game, but is still saved in the LevelSummary actor.
			const levelInfoObject = reader.getObjectByName("LevelInfo0");

			if (levelInfoObject) {
				const levelInfoProps = reader.getObjectProperties(levelInfoObject);

				for (const prop of levelInfoProps) {
					if (prop.name === "Screenshot") {
						const invalidScreenshot = reader.getObject(prop.value);

						// Final check - can't show screenshot if it's linked to an external package.
						if (invalidScreenshot.table !== "import") {
							reader.textureToCanvas(invalidScreenshot, function(screenshot) {
								callback([screenshot]); // return as array for consistency
							})

							screenshotFound = true;
						}

						break;
					}
				}
			}
		}

		if (!screenshotFound) {
			callback([]);
		}
	}

	this.getLevelSummary = function(allProperties = false) {
		const levelSummary    = {};
		const levelInfoObject = reader.getObjectByName("LevelInfo0");

		if (levelInfoObject) {
			const properties = reader.getObjectProperties(levelInfoObject);

			// If allProperties == false, only include these
			const meaningfulProperties = ["Author", "IdealPlayerCount", "LevelEnterText", "Screenshot", "Song", "Title"];

			// Lookup these properties in the name table
			const tableLookup = ["Song", "DefaultGameType", "Summary", "NavigationPointList", "Level"];

			for (const prop of properties) {
				if (allProperties || meaningfulProperties.includes(prop.name)) {
					if (tableLookup.includes(prop.name)) {
						levelSummary[prop.name] = reader.nameTable[reader.getObject(prop.value).object_name_index].name;
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
		const levelMusic = reader.getLevelSummary()["Song"];

		for (const entry of reader.importTable) {
			if (reader.nameTable[entry.class_name_index].name === "Package" && entry.package_index === 0) {
				const dependency = {
					name: reader.nameTable[entry.object_name_index].name
				}

				const fileExt   = reader.defaultPackages[dependency.name.toLowerCase()];
				const isDefault = !!fileExt;

				if (isDefault) {
					dependency.ext  = fileExt;
					dependency.type = reader.fileTypes[dependency.ext];
				} else if (dependency.name === levelMusic) {
					dependency.ext  = "umx";
					dependency.type = reader.fileTypes[dependency.ext];
				}

				dependency.default = isDefault;

				dependencies.push(dependency);
			}
		}

		return dependencies;
	}

	this.getDependenciesFiltered = function(ignoreCore = true) {
		const dependencies = reader.getDependencies();
		const ignore       = ["botpack", "core", "engine", "unreali", "unrealshare", "uwindow"];
		const filtered     = {
			length   : 0,
			packages : {
				default : [],
				custom  : [],
			}
		}

		for (const dep of dependencies) {
			if (dep.default) {
				if (ignoreCore && ignore.includes(dep.name.toLowerCase())) continue;

				filtered.packages.default.push(dep);
			} else {
				filtered.packages.custom.push(dep);
			}

			filtered.length++;
		}

		return filtered;
	}

	this.getClassesCount = function() {
		const counts = {};

		for (const object of reader.exportTable) {
			const name = reader.getObjectNameFromIndex(object.class_index).toLowerCase();

			if (counts[name] !== undefined) {
				counts[name]++;
			} else {
				counts[name] = 1;
			}
		}

		return counts;
	}
}
