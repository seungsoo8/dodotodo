import WidgetKit
import SwiftUI
import AppIntents

// Control widgets require iOS 18.0+
@available(iOS 18.0, *)
struct PlenioWidgetControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(
            kind: "vito.dodotodo.com.PlenioWidgetControl",
            provider: Provider()
        ) { _ in
            ControlWidgetButton(action: OpenAppIntent()) {
                Label("Plenio 열기", systemImage: "checkmark.circle")
            }
        }
        .displayName("Plenio")
        .description("Plenio 앱 열기")
    }
}

@available(iOS 18.0, *)
extension PlenioWidgetControl {
    struct Provider: ControlValueProvider {
        var previewValue: Bool { false }
        func currentValue() async throws -> Bool { false }
    }
}

@available(iOS 18.0, *)
struct OpenAppIntent: AppIntent {
    static var title: LocalizedStringResource = "Plenio 열기"
    func perform() async throws -> some IntentResult { .result() }
}
