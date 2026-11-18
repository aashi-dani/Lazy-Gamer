import Capacitor
import CommonCrypto
import Foundation
import UIKit
import WebKit

final class GameBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LocalDevicePlugin())
    }
}

@objc(LocalDevicePlugin)
final class LocalDevicePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "LocalDevicePlugin"
    let jsName = "LocalDevice"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hashPin", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "printReport", returnType: CAPPluginReturnPromise)
    ]

    private let storage = DispatchQueue(label: "com.aashidani.lazygamer.save")

    private func file(_ call: CAPPluginCall) throws -> URL {
        guard let key = call.getString("key"), key == "town" || key == "parent-pin" else {
            throw CocoaError(.fileWriteInvalidFileName)
        }
        var directory = try FileManager.default.url(for: .libraryDirectory, in: .userDomainMask,
                                                      appropriateFor: nil, create: true)
        directory.appendPathComponent("LazyGamer", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var options = URLResourceValues()
        options.isExcludedFromBackup = true
        try directory.setResourceValues(options)
        return directory.appendingPathComponent(key + ".json")
    }

    @objc func read(_ call: CAPPluginCall) {
        storage.async {
            do {
                let value = try String(contentsOf: self.file(call), encoding: .utf8)
                call.resolve(["value": value])
            } catch let error as CocoaError where error.code == .fileReadNoSuchFile {
                call.resolve()
            } catch {
                call.reject("Could not read the local record")
            }
        }
    }

    @objc func write(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else {
            call.reject("Missing local record")
            return
        }
        storage.async {
            do {
                try Data(value.utf8).write(to: self.file(call), options: .atomic)
                call.resolve()
            } catch {
                call.reject("Could not save the local record")
            }
        }
    }

    @objc func hashPin(_ call: CAPPluginCall) {
        guard let pin = call.getString("pin"), pin.utf8.count == 4,
              pin.utf8.allSatisfy({ (48...57).contains($0) }),
              let salt = call.getArray("salt", Int.self), salt.count == 16,
              salt.allSatisfy({ (0...255).contains($0) }) else {
            call.reject("Invalid PIN or salt")
            return
        }
        storage.async {
            var hash = [UInt8](repeating: 0, count: 32)
            let result = CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), pin, pin.utf8.count,
                                              salt.map(UInt8.init), salt.count,
                                              CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                                              180_000, &hash, 32)
            guard result == kCCSuccess else {
                call.reject("Could not prepare the PIN")
                return
            }
            call.resolve(["hash": hash.map { String(format: "%02x", $0) }.joined()])
        }
    }

    @objc func printReport(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let view = self.bridge?.webView, UIPrintInteractionController.isPrintingAvailable else {
                call.reject("Printing is unavailable")
                return
            }
            let printer = UIPrintInteractionController.shared
            let info = UIPrintInfo(dictionary: nil)
            info.jobName = "Lazy Gamer progress summary"
            info.outputType = .general
            printer.printInfo = info
            printer.printFormatter = view.viewPrintFormatter()
            let center = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            let opened = view.traitCollection.userInterfaceIdiom == .pad
                ? printer.present(from: center, in: view, animated: true, completionHandler: nil)
                : printer.present(animated: true, completionHandler: nil)
            if opened { call.resolve() }
            else { call.reject("Could not open the print preview") }
        }
    }
}
