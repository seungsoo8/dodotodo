import Foundation
import Capacitor
import WidgetKit
import Photos
import UIKit

@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTodos", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveImageToPhotos", returnType: CAPPluginReturnPromise)
    ]

    private let appGroupId = "group.vito.dodotodo.com"

    @objc func setTodos(_ call: CAPPluginCall) {
        guard let todosJson = call.getString("todosJson") else {
            call.reject("todosJson is required")
            return
        }

        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            call.reject("Failed to access App Group UserDefaults")
            return
        }

        defaults.set(todosJson, forKey: "widget_todos")
        defaults.synchronize()

        WidgetCenter.shared.reloadAllTimelines()

        call.resolve()
    }

    @objc func saveImageToPhotos(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64"),
              let data = Data(base64Encoded: base64String),
              let image = UIImage(data: data) else {
            call.reject("Invalid image data")
            return
        }

        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                call.reject("Photo library access denied")
                return
            }
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { success, error in
                if success {
                    call.resolve()
                } else {
                    call.reject(error?.localizedDescription ?? "Failed to save image")
                }
            }
        }
    }
}
