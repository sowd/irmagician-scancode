require("colors")
const co = require("co")
const deviceInfo = {
    version: "",
    irChangePoint: 0x00,
    maxOfHighIrSignal: 0x00,
    minOfHighIrSignal: 0x00,
    maxOfLowIrSignal: 0x00,
    minOfLowIrSignal: 0x00,
    postScaler: 0x00,
    currentBank: 0x00
}
const serial = require("serialport")
const SerialPort = require("serialport").SerialPort
const fs = require("fs")

let autoSelectDevicePort =
    () => new Promise((resolve, reject) => {
        serial.list((err, ports) => {
            var validPorts = ports.filter(element => {
                if (typeof element === "undefined") return false
                if(/\/dev\/cu\.usbmodem[0-9]?[0-9]/.test(element.comName)){
                    return true    
                }
                if(/\/dev\/ttyACM0/.test(element.comName)){
                    return true    
                }
                return false
            })
            if (validPorts.length > 0) {
                resolve(validPorts[0].comName)
            } else {
                reject("Valid device port is not found. Please confirm connection of irMagician. 🔌")
            }
        })
    })

let open =
    device => new Promise((resolve, reject) => {
        // console.log("open start");
        this.port = new SerialPort(device, {
            baudrate: 9600
        })
        this.port.on("open", () => {
            // console.log(`port open`)
            resolve(true)
        })
        this.port.on("error", error => {
            // console.log(`error: port open`)
            console.log(error)
            reject(error)
        })
    })

let getInfo =
    ()=> new Promise((resolve, reject) => {
        // console.log("get Info");
        infoPart(0)
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(type => infoPart(type))
            .then(() => resolve(deviceInfo))
            .catch(error => (
                reject(error)
            ))
    })

let command = (commandStr, completion, failure)=>{
    // console.log(commandStr)
    this.port.write(commandStr, err => {
        if (err) {
            console.log(err)
            if (failure) failure(err)
            return
        }
        this.port.once("data", result => {
            // setTimeout(() => {
            // console.log(result.toString())
            if (completion) completion(result)
                // }, 50)
        })
    })
}

function infoPart(type) {
    // console.log("info part");
    return new Promise((resolve, reject) => {
        var commandStr = "i," + type + "\r\n"
        command(commandStr, result => {
            setInfo(type, result)
            resolve(type + 1)
        }, error => {
            reject(error)
        })
    })
}

let info = 
    () => new Promise((resolve, reject) => {
        // console.log("info start")
        getInfo()
            .then(info => {
                console.log("-----------------------------------")
                console.log("[irMagician Infomation]".inverse)
                console.log(`  0) Version               : ${info.version}`)
                console.log(`  1) IR change point       : ${info.irChangePoint} (${info.irChangePoint.toString(16)})`)
                console.log(`  2) Max of high IR signal : ${info.maxOfHighIrSignal} (${info.maxOfHighIrSignal.toString(16)})`)
                console.log(`  3) Min of high IR signal : ${info.minOfHighIrSignal} (${info.minOfHighIrSignal.toString(16)})`)
                console.log(`  4) Max of low  IR signal : ${info.maxOfLowIrSignal} (${info.maxOfLowIrSignal.toString(16)})`)
                console.log(`  5) Min of low  IR signal : ${info.minOfLowIrSignal} (${info.minOfLowIrSignal.toString(16)})`)
                console.log(`  6) postScaler            : ${info.postScaler} (${info.postScaler.toString(16)})`)
                console.log(`  7) current bank          : ${info.currentBank} (${info.currentBank.toString(16)})`)
                console.log("-----------------------------------")
                resolve()
            })
            .catch(error => {
                reject(error)
            })
    })

let close =
    () => new Promise(resolve => {
        this.port.close()
        resolve()
    })

let infoTypes = {
    version: 0,
    irChangePoint: 1,
    maxOfHighIrSignal: 2,
    minOfHighIrSignal: 3,
    maxOfLowIrSignal: 4,
    minOfLowIrSignal: 5,
    postScaler: 6,
    currentBank: 7
}

let setInfo = (type, value) => {
    value = value.toString().replace(/\r\n/, "")
    switch (type) {
    case infoTypes.version:
        deviceInfo.version = value
        break
    case infoTypes.irChangePoint:
        deviceInfo.irChangePoint = parseInt(value, 16)
        break
    case infoTypes.maxOfHighIrSignal:
        deviceInfo.maxOfHighIrSignal = parseInt(value, 16)
        break
    case infoTypes.minOfHighIrSignal:
        deviceInfo.minOfHighIrSignal = parseInt(value, 16)
        break
    case infoTypes.maxOfLowIrSignal:
        deviceInfo.maxOfLowIrSignal = parseInt(value, 16)
        break
    case infoTypes.minOfLowIrSignal:
        deviceInfo.minOfLowIrSignal = parseInt(value, 16)
        break
    case infoTypes.postScaler:
        deviceInfo.postScaler = parseInt(value, 16)
        break
    case infoTypes.currentBank:
        deviceInfo.currentBank = value
        break
    default:
        break
    }
}

// function version() {
//     return new Promise(resolve => {
//         command(`V\r\n`, () => {
//             resolve()
//         })
//     })
// }


let capture =
    () => new Promise((resolve, reject) => {
        this.port.write("c\r\n", (error, bytesWritten) => {
            var logMessage = ""
            this.port.on("data", data => {
                logMessage += data.toString().replace(/\r\n/, "")
                console.log(logMessage)
                if (/[0-640]/.test(data)) {
                    resolve()
                } else if (/Time Out !/.test(data)) {
                    // console.log(`time out close!!`)
                    resolve()
                }
            })
            if (error) {
                console.log("Error: ", error.message)
                reject(error)
            }
            console.log(bytesWritten, "bytes written")
        })
    })

let play =
    () => new Promise((resolve, reject) => {
        // if (this.port.isOpen() == false) return
        this.port.write("p\r\n", error => {
            if (error) {
                console.log("Error: ", error.message)
                reject(error)
            }
            this.port.on("data", (data) => {
                // console.log(data.toString())
                if (data.toString().match(/Done \!/)) {
                    resolve()
                }
            })
        })
    })

let signalArray = dataSize => {
    // console.log("get signal array");
    var result = []
    for (var i = 0; i < dataSize; i++) {
        var bank = Math.floor(i / 64)
        var pos = i % 64
        result.push({
            bank: bank,
            pos: pos
        })
    }
    // console.log("generated signal array");
    return result
}

let setRecordPointer =
    value => new Promise((resolve, reject) => {
        command(`n,${value}\r\n`, result => {
            if (/OK/.test(result)) {
                // console.log("recode pointer update...");
                resolve()
            }
        }, error => {
            console.log(error)
            reject(error)
        })
    })

let write =
    path => new Promise((resolve, reject) => {
        // console.log(path)
        var json = JSON.parse(fs.readFileSync(path, "utf-8"))
            // console.log(json)

        var array = signalArray(json.data.length)
            // console.log(array)
            // console.log(json.data)
        if (json.data == undefined) reject("json not found")
        co(function* () {
            yield setRecordPointer(json.data.length)
            yield setPostScale(json.postscale.toString(16))
            for (var key in array) {
                yield setBank(array[key].bank, array[key].pos)
                yield writeFragment(array[key].pos, json.data[key])
                    // console.log(key)
            }
            resolve()
        })
    })

let setPostScale =
    value => new Promise((resolve, reject) => {
        command(`k,${value}\r\n`, result => {
            // console.log(result.toString().replace(/\r\n/,""))
            if (/OK/.test(result)) {
                // console.log(`set post scaler: ${value}`)
                resolve(result)
            }
        }, error => {
            reject(error)
        })
    })

let writeFragment =
    (pos, value) => new Promise((resolve, reject) => {
        // console.log(`write fragment pos: ${pos} value:${value}`)
        command_immediate(`w,${pos},${parseInt(value)}\r\n`, () => {
            // setTimeout(() => {
            resolve()
                // }, 50)
        }, error => {
            console.log(error)
            reject(error)
        })
    })

let dump =
    (info, fileName) => new Promise((resolve, reject) => {
        var array = signalArray(info.irChangePoint)
            // console.log(array)
        var data = []
        co(function* () {
            for (var key in array) {
                // console.log(array[key]);
                yield setBank(array[key].bank, array[key].pos)
                var fragment = yield dumpFragment(array[key].pos)
                data.push(fragment)
            }
            generateSignalFile(fileName, info, data, resolve, reject)
        })
    })

let generateSignalFile =
    (fileName, info, data, resolve, reject) => {
    var json = JSON.stringify({
        "postscale": info.postScaler,
        "freq": 38,
        "data": data,
        "format": "raw"
    })
    console.log(json)
    if (fileName) {
        fs.writeFile(fileName, json, error => {
            if (error) {
                console.log("failed write file")
                reject(error)
            } else {
                console.log("file saved...")
                resolve()
            }
        })
    } else {
        resolve()
    }

}

let dumpFragment = 
    pos => new Promise((resolve, reject) => {
        command(`d,${pos}\r\n`, result => {
            var fragment = parseInt(result.toString(), 16)
                // console.log(fragment)
            resolve(fragment)
        }, error => reject(error))
    })


let command_immediate =
    (commandStr, completion, failure) => {
    // console.log(commandStr)
    this.port.write(commandStr, (error, result) => {
        if (error) {
            console.log(error)
            if (failure) failure(error)
            return
        }
        if (completion) completion(result)
    })
}

let setBank =
    (bank, pos) => new Promise((resolve, reject) => {
        if (pos != 0) {
            resolve()
        } else {
            var pattern = `b,${bank}\r\n`
            this.port.write(pattern, error => {
                if (error) {
                    console.log(error)
                    reject(error)
                    return
                }
                // console.log(`set bank: ${bank}`)
                resolve()
            })
        }
    })


exports.info = port => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        yield info()
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.version = port => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.capture = port => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        yield capture()
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.play = port => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        yield play()
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.write = (path, port) => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        yield write(path)
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.dump = (fileName, port) => {
    co(function* () {
        var validPort = yield autoSelectDevicePort()
        port = port || validPort
        yield open(port)
        const info = yield getInfo()
        yield dump(info, fileName)
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}

exports.reco = value => {
    co(function* () {
        yield open()
        yield setRecordPointer(value)
        yield close()
    }).catch(error => {
        console.log(`💀  Error: ${error}`)
        close()
    })
}
