# UTPackage.js
---
A simple JavaScript plugin for reading [Unreal Tournament](https://en.wikipedia.org/wiki/Unreal_Tournament) package data.

Based almost entirely on Feralidragon's [PHP UPackage](https://ut99.org/viewtopic.php?t=4796), this is essentially a JavaScript rewrite with some extra features for use in web applications (e.g. Canvas and audio elements for textures and sounds).

**N.B.** this plugin is still in development and some features (such as parsing embedded music) are not yet available.

## Demo
Visit https://bunnytrack.net/package-explorer/ to see this plugin in use.

---

## Usage
Create an instance of UTPackage by passing an `ArrayBuffer` as the only argument:

```js
const package = new UTPackage(arrayBuffer);
```

**Example with HTML**
```html
<input type="file" id="file-input" />

<script src="UTPackage.js"></script>
<script>
    document.getElementById("file-input").addEventListener("input", function() {
        if (this.files.length > 0) {
            const file       = this.files[0];
            const fileReader = new FileReader();

            fileReader.onload = function() {
                const package = new UTPackage(this.result);

                // Get package version
                console.log(package.version); // 68
            }

            fileReader.readAsArrayBuffer(file);
        }
    })
</script>
```

---

## Properties
| Name              | Type                | Description                                                                                                                   |
| ---               | ---                 | ---                                                                                                                           |
| `dataView`        | `DataView` object   | A [`DataView`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView) of the package.     |
| `packageData`     | `Uint8Array` object | A [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) of the package. |
| `propertyTypes`   | array               | The standard UT package format property types.                                                                                |
| `fileTypes`       | object              | The standard UT file extensions and their corresponding package type (e.g. `"utx": "Texture"`).                               |
| `defaultPackages` | object              | The default UT GOTY filenames and their corresponding extension (e.g. `"city": "utx"`).                                       |
| `header`          | object              | Package header.                                                                                                               |
| `version`         | int                 | Package version.                                                                                                              |
| `nameTable`       | array               | Package name table.                                                                                                           |
| `importTable`     | array               | Package import table.                                                                                                         |
| `exportTable`     | array               | Package export table.                                                                                                         |

---

## Methods
Currently only the most useful methods for web applications are documented here. See source code for all methods.

---

#### getLevelSummary
```js
getLevelSummary([bool allProperties = false]) : object
```
Returns an object containing level details. The object will be empty if the package is not a map file (i.e. does not contain a `LevelInfo`) actor.

When `allProperties` is `false`, only the following level properties are returned: `Author`, `IdealPlayerCount`, `LevelEnterText`, `Screenshot`, `Song`, `Title`.

The `Screenshot` property is cast to a `bool` value rather than returning the export table index.

These properties are read directly from the `LevelInfo0` actor which is present in all map files.

**Example using CTF-Face**

_`allProperties = false`_

```js
{
    "Author"           : "Cedric 'Inoxx' Fiorentino",
    "IdealPlayerCount" : "4-10",
    "Screenshot"       : true,
    "Song"             : "Foregone",
    "Title"            : "Facing Worlds"
}
```

_`allProperties = true`_

```js
{
    "TimeSeconds": 174.3309326171875,
    "Title": "Facing Worlds",
    "Author": "Cedric 'Inoxx' Fiorentino",
    "IdealPlayerCount": "4-10",
    "RecommendedEnemies": 2,
    "RecommendedTeammates": 3,
    "Summary": "LevelSummary",
    "bHighDetailMode": false,
    "Song": "Foregone",
    "PlayerDoppler": 1,
    "Brightness": 1.5,
    "Screenshot": true,
    "DefaultGameType": "CTFGame",
    "NavigationPointList": "InventorySpot167",
    "AIProfile": 201077017,
    "AvgAITime": 5.877478059954527e-39,
    "AmbientBrightness": 4,
    "TexUPanSpeed": 2,
    "Level": "LevelInfo0",
    "Tag": "LevelInfo",
    "Region": {
        "zone": 1,
        "i_leaf": -1,
        "zone_number": 0
    },
    "Location": {
        "x": -12869,
        "y": -1454,
        "z": -1
    },
    "Rotation": {
        "pitch": 0,
        "yaw": 16384,
        "roll": 0
    }
}
```

---

#### getScreenshot
```js
getScreenshot(function callback) : void
```
Asynchronously extracts a map file's screenshot texture, passing it as a parameter in the provided `callback` function.

In order for UT to be able to display a map screenshot in-game, the screenshot must be named `Screenshot` and saved in the `MyLevel` pseudo-package; some mappers, however, have not named the texture correctly or have erroneously set the `Screenshot` property to a texture within a different package.

This function attempts to extract the screenshot even if it is set incorrectly, although it is not always possible to do so (e.g. when the texture is part of an external package).

If available, the screenshot is extracted into a HTML `Canvas` element; otherwise a `null` value is returned.

Currently, only the first screenshot is returned for maps with a "slideshow" screenshot.

**Example**

```js
package.getScreenshot(function(canvas) {
    if (canvas) {
        document.getElementById("screenshot").append(canvas);
    } else {
        // No screenshot available
    }
})
```

---

#### getDependencies
```js
getDependencies() : array
```
Returns an array of dependencies (i.e. other packages) required for this package to be used.

The return value is an array of objects. Each object will always have a `name` and `default` property (`string` and `bool` respectively) and may also contain `ext` and `type` properties (both `string`).

**Example output for CTF-BT-Mesablanca**
```js
[
    // A default texture package dependency
    {
        "name": "Crypt2",
        "ext": "utx",
        "type": "Texture",
        "default": true
    },

    // Non-default dependency; type unknown
    {
        "name": "BT2",
        "default": false
    },

    // etc.
]
```

---

#### getDependenciesFiltered
```js
getDependenciesFiltered([bool ignoreCore = true]) : object
```
Returns an object containing a `packages` property which contains two arrays: `default` and `custom`. A `length` property is also included.

This function is essentially the same as `getDependencies` with the return value filtered into default/non-default dependency arrays.

When `ignoreCore` is `true`, several core UT files which are used by the vast majority of packages (such as `Core.u` and `Engine.u`) are excluded from the return value.

**Example output for CTF-BT-Mesablanca**
```js
{
    "length": 30,
    "custom": [
        {
            "name": "SS3rdWorld",
            "default": false
        },

        // etc.
    ],
    "default": [
        {
            "name": "DoorsAnc",
            "ext": "uax",
            "type": "Sound",
            "default": true
        },

        // etc.
    ]
}
```

---

#### getTextureObjects
```js
getTextureObjects() : array
```
Returns an array of export table object details for textures embedded within the package.

**N.B.** a _package_ object is not the same as a JavaScript object. A package object can be thought of a chunk of data within the file, usually containing a list of properties followed by the data itself.

**Example output for CTF-BT-BehindSunrise**
```js
[
    {
        "class_index": -39,
        "super_index": 0,
        "package_index": 0,
        "object_name_index": 599,
        "object_flags": 983044,
        "serial_size": 22027,
        "serial_offset": 29774
    },

    // etc.
]
```

The properties listed in the example above can then be used to ascertain further details about that texture (its name, image data, etc.).

---

#### getTextureInfo
```js
getTextureInfo(object textureObject) : object
```
Returns the texture's name and group (if available).

**Example output using the texture object above**
```js
{
    "name": "trims2",
    "group": null
}
```

---

#### textureToCanvas
```js
textureToCanvas(object textureObject, function callback) : void
```
Essentially the same as the `getScreenshot` method, however the first parameter must be a texture object.

**Example**

```js
// All embedded textures
const textureObjects = package.getTextureObjects();

// Extract the first texture then append it to a container element
package.textureToCanvas(textureObjects[0], function(canvas) {
    document.getElementById("texture-container").append(canvas);
})
```

---

#### getSounds
```js
getSounds() : array
```
Returns an array of objects, each containing details of the package's sound objects.

**Example output for CTF-BT-BehindSunrise**
```js
[
    {
        "name": "islice",
        "format": "WAV",
        "audio_offset": 4645786,
        "audio_size": 19822
        "next_object_offset": 4665608,
        "properties": [],
    },

    // etc.
]
```

This can then be used to obtain the audio data. An example using the [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object is shown below:

```js
fileReader.onload = function() {
    const package = new UTPackage(this.result);

    // All embedded sounds
    const sounds = package.getSounds();

    // Loop through each sound and create an <audio> element with a Blob src attribute
    for (const sound of sounds) {
        // ArrayBuffer containing the audio data
        const audioData = this.result.slice(sound.audio_offset, sound.audio_offset + sound.audio_size);

        // Blob object using the above data
        const audioBlob = new Blob([audioData], {
            type: `audio/${sound.format.toLowerCase()}`
        })

        // <audio> element
        const audioElement = new Audio();

        // Set Blob src and add controls so the element is visible
        audioElement.src = URL.createObjectURL(audioBlob);
        audioElement.controls = true;

        // Append to container
        document.getElementById("sounds-container").append(audioElement);
    }
}
```

---

#### getTextBufferObjects
```js
getTextBufferObjects() : array
```
Returns an array of text buffer objects. A text buffer is usually an embedded UnrealScript file.

**Example output for CTF-BT-BehindSunrise**
```js
[
    {
        "class_index": -152,
        "super_index": 0,
        "package_index": 0,
        "object_name_index": 98,
        "object_flags": 3407872,
        "serial_size": 2293,
        "serial_offset": 13374731
    },

    // etc.
]
```

---

#### getTextBufferData
```js
getTextBufferData(object textBufferObject) : object
```
Returns an object containing information about the given text buffer object.

**Example output for CTF-BT-BehindSunrise**
```js
// Script contents truncated for brevity
{
    "contents": "// ResetCounter.\r\n// A counter that can be used several times\r\n// by Wolf (www.unrealed.de)\r\n",
    "name": "resetcounter",
    "pos": 850,
    "size": 2282,
    "top": 0
}
```
